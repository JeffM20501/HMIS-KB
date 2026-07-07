from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q
from django.utils import timezone
from analytics.models.audit_log import AuditLog
from analytics.serializers.audit_log_serializer import (
    AuditLogSerializer,
    AuditLogListSerializer,
    AuditLogDetailSerializer
)
from users.permissions import IsAdmin


class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API endpoint for viewing audit logs.
    
    PRD FR-3.6: Admin actions are logged with timestamp and user ID.
    Only admins can view audit logs.
    """
    
    queryset = AuditLog.objects.all()
    serializer_class = AuditLogSerializer
    permission_classes = [IsAdmin]
    
    def get_serializer_class(self):
        if self.action == 'list':
            return AuditLogListSerializer
        elif self.action == 'retrieve':
            return AuditLogDetailSerializer
        return AuditLogSerializer
    
    def get_queryset(self):
        """Filter queryset based on query parameters."""
        queryset = super().get_queryset()
        
        # Filter by user
        user_id = self.request.query_params.get('user_id')
        if user_id:
            queryset = queryset.filter(user_id=user_id)
        
        # Filter by action
        action = self.request.query_params.get('action')
        if action:
            queryset = queryset.filter(action=action)
        
        # Filter by content type
        content_type = self.request.query_params.get('content_type')
        if content_type:
            queryset = queryset.filter(content_type=content_type)
        
        # Filter by date range
        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')
        
        if start_date:
            queryset = queryset.filter(timestamp__gte=start_date)
        if end_date:
            queryset = queryset.filter(timestamp__lte=end_date)
        
        # Search by object representation or username
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(object_repr__icontains=search) |
                Q(user__username__icontains=search)
            )
        
        return queryset
    
    @action(detail=False, methods=['get'], url_path='stats')
    def stats(self, request):
        """
        Get statistics about audit logs.
        """
        total = AuditLog.objects.count()
        
        # Count by action
        action_counts = {}
        for action, _ in AuditLog.ACTION_CHOICES:
            action_counts[action] = AuditLog.objects.filter(action=action).count()
        
        # Count by user
        user_counts = {}
        from django.contrib.auth import get_user_model
        User = get_user_model()
        for user in User.objects.all():
            count = AuditLog.objects.filter(user=user).count()
            if count > 0:
                user_counts[user.username] = count
        
        # Count by date
        today = timezone.now().date()
        from datetime import timedelta
        date_counts = {}
        for i in range(7):
            date = today - timedelta(days=i)
            date_counts[date.isoformat()] = AuditLog.objects.filter(
                timestamp__date=date
            ).count()
        
        return Response({
            'total_logs': total,
            'by_action': action_counts,
            'by_user': user_counts,
            'last_7_days': date_counts
        })