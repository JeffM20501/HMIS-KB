from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied
from django.db.models import Q
from articles.models.article import Article
from articles.serializers.article_serializers import ArticleSerializer
from articles.permissions.article_permissions import (
    IsEditor, IsAdmin, CanDeleteArticle, CanEditArticle
)
from analytics.models import SearchLog
from django.utils import timezone
from django.utils.dateparse import parse_datetime
from datetime import timedelta

class ArticleViewSet(viewsets.ModelViewSet):
    queryset = Article.objects.all().order_by('-created_at')
    serializer_class = ArticleSerializer
    lookup_field = 'slug'

    def get_queryset(self):
        """Filter articles based on user authentication and role."""
        user = self.request.user
        queryset = super().get_queryset()

        # If user is not authenticated → only published articles
        if not user.is_authenticated:
            return queryset.filter(status='published')

        # Authenticated users
        if user.role in ['admin', 'editor']:
            # Editors/Admins see all articles (they manage content)
            return queryset
        else:
            # Viewers see only published articles
            return queryset.filter(status='published')

    def get_permissions(self):
        """
        Permissions for actions that modify data.
        """
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            permission_classes = [permissions.IsAuthenticated, IsEditor | IsAdmin]
        elif self.action in ['publish', 'reject']:
            permission_classes = [permissions.IsAuthenticated, IsAdmin]
        elif self.action == 'submit_for_review':
            permission_classes = [permissions.IsAuthenticated, IsEditor | IsAdmin]
        elif self.action == 'my_articles':
            permission_classes = [permissions.IsAuthenticated]
        elif self.action == 'pending_review':
            permission_classes = [permissions.IsAuthenticated, IsAdmin]
        else:
            # list, retrieve → allow any (but queryset filters will restrict)
            permission_classes = [permissions.AllowAny]
        return [permission() for permission in permission_classes]

    def retrieve(self, request, *args, **kwargs):
        """Allow any user to view a published article; restrict others."""
        instance = self.get_object()

        # If article is not published, only editors/admins can view
        if instance.status != 'published':
            if not request.user.is_authenticated or request.user.role not in ['admin', 'editor']:
                raise PermissionDenied("You do not have permission to view this article.")

        # Record view (both authenticated and anonymous)
        instance.record_view(request)

        serializer = self.get_serializer(instance)
        return Response(serializer.data)

    def list(self, request, *args, **kwargs):
        search_query = request.query_params.get('search', '').strip()
        queryset = self.filter_queryset(self.get_queryset())

        # Log search only if query is provided
        if search_query:
            # Deduplicate using session (works for both authenticated and anonymous)
            session = request.session
            last_search = session.get('last_search', {})
            now = timezone.now()

            prev_timestamp_str = last_search.get('timestamp')
            prev_timestamp = parse_datetime(prev_timestamp_str) if prev_timestamp_str else None

            # Check duplicate (same query, same session, within 2 seconds)
            is_duplicate = (
                last_search.get('query') == search_query and
                prev_timestamp is not None and
                (now - prev_timestamp).total_seconds() < 2
            )

            if not is_duplicate:
                result_count = queryset.count()
                # Create log with user=None if not authenticated
                SearchLog.objects.create(
                    user=request.user if request.user.is_authenticated else None,
                    query=search_query,
                    result_count=result_count
                )
                session['last_search'] = {
                    'query': search_query,
                    'timestamp': now.isoformat(),
                }
                session.modified = True

        # Paginate and return
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    def perform_create(self, serializer):
        serializer.save(
            author=self.request.user,
            status='draft'
        )
        
    def retrieve(self, request, *args, **kwargs):
        slug = kwargs.get('slug')
        try:
            instance = self.get_object()
            instance.record_view(request)
            serializer = self.get_serializer(instance)
            return Response(serializer.data)
        except Exception as e:
            print(f"Error: {e}")
            raise
    
    def perform_update(self, serializer):
        instance = self.get_object()
        if instance.status == 'published' and self.request.user.role != 'admin':
            serializer.save(status='draft', published_by=None, published_at=None)
        else:
            serializer.save()
    
    def list(self, request, *args, **kwargs):
        search_query = request.query_params.get('search', '').strip()
        queryset = self.filter_queryset(self.get_queryset())

        if search_query and request.user.is_authenticated:
            session = request.session
            last_search = session.get('last_search', {})
            now = timezone.now()

            # Parse previous timestamp from session (stored as ISO string)
            prev_timestamp_str = last_search.get('timestamp')
            prev_timestamp = parse_datetime(prev_timestamp_str) if prev_timestamp_str else None

            # Check if this is a duplicate (same query, same user, within 2 seconds)
            is_duplicate = (
                last_search.get('query') == search_query and
                last_search.get('user_id') == request.user.id and
                prev_timestamp is not None and
                (now - prev_timestamp).total_seconds() < 2
            )

            if not is_duplicate:
                result_count = queryset.count()
                SearchLog.objects.create(
                    user=request.user,
                    query=search_query,
                    result_count=result_count
                )
                # Store timestamp as ISO string (JSON serializable)
                session['last_search'] = {
                    'query': search_query,
                    'user_id': request.user.id,
                    'timestamp': now.isoformat(),
                }
                session.modified = True

        # Paginate and return
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def submit_for_review(self, request, slug=None):
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
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Failed to send notifications for article {article.id}: {e}")
        return Response(
            {'message': 'Article submitted for review successfully.'},
            status=status.HTTP_200_OK
        )
    
    @action(detail=True, methods=['post'])
    def publish(self, request, slug=None):
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
        articles = Article.objects.filter(author=request.user).order_by('-created_at')
        serializer = self.get_serializer(articles, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def pending_review(self, request):
        if request.user.role != 'admin':
            raise PermissionDenied("Only admins can view pending articles.")
        articles = Article.objects.filter(status='pending_review').order_by('-updated_at')
        serializer = self.get_serializer(articles, many=True)
        return Response(serializer.data)