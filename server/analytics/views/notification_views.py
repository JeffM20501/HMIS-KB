from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q
from analytics.models.notification import Notification
from analytics.serializers.notification_serializer import (
    NotificationSerializer,
    NotificationListSerializer,
    NotificationMarkReadSerializer
)
from analytics.permissions.notification_permissions import (
    CanViewNotifications,
    CanManageNotifications
)

from django.utils import timezone


class NotificationViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API endpoint for user notifications.
    """
    
    queryset = Notification.objects.all()
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated, CanViewNotifications]
    
    def get_serializer_class(self):
        if self.action == 'list':
            return NotificationListSerializer
        return NotificationSerializer
    
    def get_queryset(self):
        """Filter to only the current user's notifications."""
        queryset = super().get_queryset()
        queryset = queryset.filter(recipient=self.request.user)
        
        # Filter by read status
        read_filter = self.request.query_params.get('read')
        if read_filter is not None:
            if read_filter.lower() == 'true':
                queryset = queryset.filter(read=True)
            elif read_filter.lower() == 'false':
                queryset = queryset.filter(read=False)
        
        # Filter by notification type
        notification_type = self.request.query_params.get('type')
        if notification_type:
            queryset = queryset.filter(notification_type=notification_type)
        
        # Search in title and message
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(title__icontains=search) |
                Q(message__icontains=search)
            )
        
        return queryset
    
    @action(detail=True, methods=['patch'])
    def mark_read(self, request, pk=None):
        """Mark a single notification as read."""
        notification = self.get_object()
        notification.mark_read()
        serializer = self.get_serializer(notification)
        return Response(serializer.data)
    
    @action(detail=True, methods=['patch'])
    def mark_unread(self, request, pk=None):
        """Mark a single notification as unread."""
        notification = self.get_object()
        notification.mark_unread()
        serializer = self.get_serializer(notification)
        return Response(serializer.data)
    
    @action(detail=False, methods=['patch'])
    def mark_all_read(self, request):
        """Mark all notifications as read for the current user."""
        count = Notification.objects.filter(recipient=request.user, read=False).count()
        Notification.objects.filter(recipient=request.user, read=False).update(
            read=True,
            read_at=timezone.now()
        )
        return Response({
            "message": f"Marked {count} notifications as read.",
            "count": count
        })
    
    @action(detail=False, methods=['get'])
    def unread_count(self, request):
        """Get the count of unread notifications."""
        count = Notification.objects.filter(recipient=request.user, read=False).count()
        return Response({"unread_count": count})