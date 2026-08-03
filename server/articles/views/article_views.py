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
from utils.audit_log_helper import log_audit_action
from analytics.models import Notification
from django.contrib.postgres.search import SearchVector, SearchQuery, SearchRank
from django.db.models import Q
from analytics.models import AuditLog
from utils.get_ip import _get_client_ip
class ArticleViewSet(viewsets.ModelViewSet):
    queryset = Article.objects.all().order_by('-created_at')
    serializer_class = ArticleSerializer
    lookup_field = 'slug'

    def get_queryset(self):
        user = self.request.user
        queryset = Article.objects.all()
        status_filter = self.request.query_params.get('status')

        # --- Role / status filtering ---
        if not user.is_authenticated:
            queryset = queryset.filter(status='published')
        elif user.role in ['admin', 'editor']:
            if status_filter:
                queryset = queryset.filter(status=status_filter)
        else:  # viewer
            queryset = queryset.filter(status='published')

        # --- Search (full-text) ---
        search = self.request.query_params.get('search', '').strip()
        if search:
            vector = SearchVector('title', weight='A') + \
                    SearchVector('content', weight='B') + \
                    SearchVector('category__name', weight='C') + \
                    SearchVector('tags__name', weight='C') + \
                    SearchVector('module', weight='B')
            query = SearchQuery(search, config='english')
            queryset = queryset.annotate(
                rank=SearchRank(vector, query)
            ).filter(rank__gte=0.1)

        # --- Category filter ---
        category_slug = self.request.query_params.get('category', '').strip()
        if category_slug:
            queryset = queryset.filter(category__slug=category_slug)

        # --- Content type (article_type) filter ---
        content_type = self.request.query_params.get('content_type', '').strip()
        if content_type:
            queryset = queryset.filter(article_type=content_type)

        # --- Sorting ---
        sort = self.request.query_params.get('sort', '').strip()
        if search and sort == 'relevance':
            # already ordered by -rank from the search annotation
            queryset = queryset.order_by('-rank')
        elif sort == 'recent':
            queryset = queryset.order_by('-updated_at')
        elif sort == 'views':
            queryset = queryset.order_by('-views')
        else:
            # default: by most recent creation (or updated_at if you prefer)
            queryset = queryset.order_by('-created_at')

        return queryset

    def get_permissions(self):
        """
        Allow any user to list and retrieve.
        Write actions require authentication and appropriate role.
        """
        if self.action in ['list', 'retrieve']:
            permission_classes = [permissions.AllowAny]
        elif self.action in ['create', 'update', 'partial_update', 'destroy']:
            permission_classes = [permissions.IsAuthenticated, IsEditor | IsAdmin, CanEditArticle]
        elif self.action in ['publish', 'reject']:
            permission_classes = [permissions.IsAuthenticated, IsAdmin]
        elif self.action == 'submit_for_review':
            permission_classes = [permissions.IsAuthenticated, IsEditor | IsAdmin]
        elif self.action in ['my_articles', 'pending_review']:
            permission_classes = [permissions.IsAuthenticated]
        else:
            permission_classes = [permissions.AllowAny]
        return [permission() for permission in permission_classes]

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        
        if not request.user.is_authenticated or request.user.role not in ['admin', 'editor']:
            if instance.status != 'published':
                raise PermissionDenied("You do not have permission to view this article.")
        
        instance.record_view(request)
        serializer = self.get_serializer(instance)
        return Response(serializer.data)

    def list(self, request, *args, **kwargs):
        search_query = request.query_params.get('search', '').strip()
        queryset = self.filter_queryset(self.get_queryset())

        if search_query:
            session = request.session
            last_search = session.get('last_search', {})
            now = timezone.now()

            prev_timestamp_str = last_search.get('timestamp')
            prev_timestamp = parse_datetime(prev_timestamp_str) if prev_timestamp_str else None

            is_duplicate = (
                last_search.get('query') == search_query and
                prev_timestamp is not None and
                (now - prev_timestamp).total_seconds() < 5
            )

            if not is_duplicate:
                result_count = queryset.count()
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

        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    def perform_create(self, serializer):
        serializer.save(author=self.request.user, status='draft')

    def perform_update(self, serializer):
        instance = self.get_object()
        if instance.status == 'published' and self.request.user.role != 'admin':
            serializer.save(status='draft', published_by=None, published_at=None)
        else:
            serializer.save()

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
        AuditLog.log_action(
            user=request.user,
            action=AuditLog.ACTION_SUBMIT,
            obj=article,
            user_ip=_get_client_ip(request),
            user_agent=request.META.get('HTTP_USER_AGENT', '')
        )
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
        AuditLog.log_action(
            user=request.user,
            action=AuditLog.ACTION_PUBLISH,
            obj=article,
            reason="Published article",
            user_ip=_get_client_ip(request),
            user_agent=request.META.get('HTTP_USER_AGENT', '')
        )
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
        AuditLog.log_action(
            user=request.user,
            action=AuditLog.ACTION_REJECT,
            obj=article,
            reason=reason,
            user_ip=_get_client_ip(request),
            user_agent=request.META.get('HTTP_USER_AGENT', '')
        )
        Notification.create_article_rejected_notification(article, request.user, reason)
        return Response(
            {'message': f'Article rejected. Reason: {reason}'},
            status=status.HTTP_200_OK
        )

    @action(detail=False, methods=['get'])
    def my_articles(self, request):
        articles = Article.objects.filter(author=request.user).order_by('-created_at')
        status = request.query_params.get('status')
        if status:
            articles = articles.filter(status=status)
        serializer = self.get_serializer(articles, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def pending_review(self, request):
        if request.user.role != 'admin':
            raise PermissionDenied("Only admins can view pending articles.")
        articles = Article.objects.filter(status='pending_review').order_by('-updated_at')
        serializer = self.get_serializer(articles, many=True)
        return Response(serializer.data)