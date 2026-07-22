from django.shortcuts import render
from rest_framework import viewsets, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from articles.models.article import Article
from articles.serializers.article_serializers import ArticleSerializer
from articles.permissions.article_permissions import (
    IsEditor, IsAdmin, IsViewer, CanDeleteArticle,
    CanCreateArticle, CanEditArticle, CanPublishArticle, CanListArticles
)
from analytics.models import SearchLog

from django.core.cache import cache
import hashlib

from utils.audit_log_helper import log_audit_action
from analytics.models import Notification

class ArticleViewSet(viewsets.ModelViewSet):
    
    queryset = Article.objects.all().order_by('-created_at')
    serializer_class = ArticleSerializer
    lookup_field='slug'
    
    def get_serializer_context(self):
        """Add request to serializer context for permission checks."""
        context = super().get_serializer_context()
        context.update({"request": self.request})
        return context
    
    def get_permissions(self):
        """
        PRD: Role-based permissions for each action.
        """
        if self.action == 'list':

            permission_classes = [permissions.IsAuthenticated, CanListArticles]
        elif self.action == 'retrieve':

            permission_classes = [permissions.IsAuthenticated]
        elif self.action == 'create':

            permission_classes = [permissions.IsAuthenticated, IsEditor | IsAdmin]
        elif self.action in ['update', 'partial_update']:

            permission_classes = [permissions.IsAuthenticated, CanEditArticle]
        elif self.action == 'destroy':

            permission_classes = [permissions.IsAuthenticated, CanDeleteArticle]
        elif self.action in ['publish', 'submit_for_review']:

            if self.action == 'publish':
                permission_classes = [permissions.IsAuthenticated, IsAdmin]
            else:
                permission_classes = [permissions.IsAuthenticated, IsEditor | IsAdmin]
        else:
            permission_classes = [permissions.IsAuthenticated]
        
        return [permission() for permission in permission_classes]
    
    def perform_create(self, serializer):
        """
        PRD FR-1.1: Set the current user as author and default to draft.
        """
        serializer.save(
            author=self.request.user,
            status='draft'
        )
        
    def retrieve(self, request, *args, **kwargs):
        slug = kwargs.get('slug')
        print(f"Retrieving article with slug: {slug}")
        try:
            instance = self.get_object()
            instance.record_view(request)
            serializer = self.get_serializer(instance)
            return Response(serializer.data)
        except Exception as e:
            print(f"Error: {e}")
            raise
    
    def perform_update(self, serializer):
        """
        PRD FR-3.3: When editor updates article, reset status to draft.
        """
        instance = self.get_object()
        
        if instance.status == 'published' and self.request.user.role != 'admin':

            serializer.save(status='draft', published_by=None, published_at=None)
        else:
            serializer.save()
            
    # helper to create search logs and prebvent duplicates
    def _log_search_if_not_duplicate(self, user, query, result_count, window_seconds=2):
        """
        Logs a search only if the same user+query hasn't been logged within
        the specified time window. Uses cache to track recent logs.
        """
        # Build a unique cache key for this user and query
        query_hash = hashlib.md5(query.encode('utf-8')).hexdigest()
        cache_key = f"search_log_{user.id}_{query_hash}"

        # Check if we've already logged this within the time window
        if cache.get(cache_key):
            return  # Duplicate - skip logging

        # Mark that we've logged it (with expiration)
        cache.set(cache_key, True, timeout=window_seconds)

        # Perform the actual log creation
        SearchLog.objects.create(
            user=user,
            query=query,
            result_count=result_count
        )
    
    def list(self, request, *args, **kwargs):        
        # Log search if the 'search' parameter is present
        search_query = request.query_params.get('search', '').strip()
        
        # Execute search
        queryset = self.filter_queryset(self.get_queryset())
        
        if search_query and request.user.is_authenticated:
            result_count = queryset.count()
            # Use the deduplication helper instead of direct creation
            self._log_search_if_not_duplicate(request.user, search_query, result_count)
        
        # Continue with pagination and response
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def submit_for_review(self, request, slug=None):
        """
        PRD FR-3.3: Editor submits article for Admin review.
        """
        article = self.get_object()
        
        if request.user.role not in ['editor', 'admin']:
            raise PermissionDenied("Only editors can submit articles for review.")
        
        if article.status != 'draft':
            return Response(
                {'error': 'Only draft articles can be submitted for review.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        article.status = 'pending_review'
        article.save()
        
        try:
            from django.contrib.auth import get_user_model
            User = get_user_model()
            admins = User.objects.filter(role='admin')
            Notification.create_article_submitted_notification(article, request.user, admins)
        except Exception as e:
            # Log the error but don't break the flow
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Failed to send notifications for article {article.id}: {e}")
        return Response(
            {'message': 'Article submitted for review successfully.'},
            status=status.HTTP_200_OK
        )
    
    @action(detail=True, methods=['post'])
    def publish(self, request, slug=None):
        """
        PRD FR-1.3: Admin publishes article.
        """
        article = self.get_object()
        
        if request.user.role != 'admin':
            raise PermissionDenied("Only admins can publish articles.")
        
        if article.status != 'pending_review':
            return Response(
                {'error': 'Only articles pending review can be published.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        article.publish(request.user)
        Notification.create_article_published_notification(article, request.user)
        
        return Response(
            {'message': 'Article published successfully.'},
            status=status.HTTP_200_OK
        )
    
    @action(detail=True, methods=['post'])
    def reject(self, request, slug=None):
        """
        PRD FR-1.3: Admin rejects article.
        """
        article = self.get_object()
        
        if request.user.role != 'admin':
            raise PermissionDenied("Only admins can reject articles.")
        
        if article.status != 'pending_review':
            return Response(
                {'error': 'Only articles pending review can be rejected.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        reason = request.data.get('reason', 'No reason provided.')
        article.status = 'draft'
        article.save()
        
        Notification.create_article_rejected_notification(article, request.user, reason)
        
        return Response(
            {'message': f'Article rejected. Reason: {reason}'},
            status=status.HTTP_200_OK
        )
    
    @action(detail=False, methods=['get'])
    def my_articles(self, request):
        """
        Get articles authored by the current user.
        """
        articles = Article.objects.filter(author=request.user).order_by('-created_at')
        serializer = self.get_serializer(articles, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def pending_review(self, request):
        """
        PRD FR-1.3: Admin gets all articles pending review.
        """
        if request.user.role != 'admin':
            raise PermissionDenied("Only admins can view pending articles.")
        
        articles = Article.objects.filter(status='pending_review').order_by('-updated_at')
        serializer = self.get_serializer(articles, many=True)
        return Response(serializer.data)