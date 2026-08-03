from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Count, Q
from django.utils import timezone
from datetime import timedelta
from analytics.models.search_logs import SearchLog
from analytics.serializers.search_log_serializer import (
    SearchLogSerializer,
    SearchLogListSerializer
)
from analytics.permissions.search_log_permissions import (
    CanViewSearchLogs,
    CanCreateSearchLog
)


class SearchLogViewSet(viewsets.ModelViewSet):
    """
    API endpoint for search logs.
    PRD FR-2.6: All searches are logged for analytics.
    """
    
    queryset = SearchLog.objects.all()
    serializer_class = SearchLogSerializer
    permission_classes = [permissions.IsAuthenticated, CanCreateSearchLog]
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            permission_classes = [permissions.IsAuthenticated, CanViewSearchLogs]
        elif self.action in ['update', 'partial_update', 'destroy']:
            permission_classes = [permissions.IsAuthenticated, CanViewSearchLogs]
        else:
            permission_classes = [permissions.IsAuthenticated, CanCreateSearchLog]
        return [permission() for permission in permission_classes]
    
    def get_serializer_class(self):
        if self.action == 'list':
            return SearchLogListSerializer
        return SearchLogSerializer
    
    def get_queryset(self):
        """Filter queryset based on user role and query parameters."""
        queryset = super().get_queryset()
        user = self.request.user
        
        # Admins see all, others see only their own
        if user.role != 'admin':
            queryset = queryset.filter(user=user)
        
        # Filter by user
        user_id = self.request.query_params.get('user_id')
        if user_id and user.role == 'admin':
            queryset = queryset.filter(user_id=user_id)
        
        # Filter by query text (partial match)
        query_text = self.request.query_params.get('query')
        if query_text:
            queryset = queryset.filter(query__icontains=query_text)
        
        # Date range filters
        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')
        
        if start_date:
            queryset = queryset.filter(created_at__gte=start_date)
        if end_date:
            queryset = queryset.filter(created_at__lte=end_date)
        
        return queryset
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """
        Get search statistics for the analytics dashboard.
        Admin only.
        """
        if request.user.role != 'admin':
            return Response(
                {"error": "Only admins can view search stats."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Parse range param (e.g., '28d', '7d', '30d')
        range_param = request.query_params.get('range', '28d')
        days = int(range_param.replace('d', ''))
        since = timezone.now() - timedelta(days=days)
        
        logs = SearchLog.objects.filter(created_at__gte=since)
        
        # Top 5 search terms (most frequent)
        top_terms = logs.values('query').annotate(
            count=Count('id')
        ).order_by('-count')[:5]
        
        # Zero-result terms (searches with result_count=0)
        zero_result_terms = logs.filter(result_count=0).values('query').annotate(
            count=Count('id')
        ).order_by('-count')[:5]
        
        return Response({
            'top_terms': [
                {'term': item['query'], 'count': item['count']}
                for item in top_terms
            ],
            'zero_result_terms': [
                {'term': item['query'], 'count': item['count']}
                for item in zero_result_terms
            ]
        })
    
    @action(detail=False, methods=['get'])
    def my_searches(self, request):
        """
        Get the current user's search history.
        """
        logs = SearchLog.objects.filter(user=request.user)
        
        # Filter by date range
        days = int(request.query_params.get('days', 7))
        since = timezone.now() - timedelta(days=days)
        logs = logs.filter(created_at__gte=since)
        
        serializer = self.get_serializer(logs, many=True)
        return Response(serializer.data)