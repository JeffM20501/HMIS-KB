from django.shortcuts import render
from rest_framework import viewsets, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from articles.models.article import Article
from articles.serializers.article_serializers import ArticleSerializer
from articles.permissions.article_permissions import (
    IsEditor, IsAdmin, IsViewer,
    CanCreateArticle, CanEditArticle, CanPublishArticle, CanListArticles
)

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

            permission_classes = [permissions.IsAuthenticated, IsAdmin]
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
            return super().retrieve(request, *args, **kwargs)
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
    
    @action(detail=True, methods=['post'])
    def submit_for_review(self, request, pk=None):
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
    def publish(self, request, pk=None):
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
    def reject(self, request, pk=None):
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