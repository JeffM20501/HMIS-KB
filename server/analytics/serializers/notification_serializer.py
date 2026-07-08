from rest_framework import serializers
from analytics.models.notification import Notification


class NotificationSerializer(serializers.ModelSerializer):
    """Serializer for notifications."""
    
    sender_username = serializers.ReadOnlyField(source='sender.username')
    sender_email = serializers.ReadOnlyField(source='sender.email')
    recipient_username = serializers.ReadOnlyField(source='recipient.username')
    
    class Meta:
        model = Notification
        fields = [
            'id', 'recipient', 'recipient_username',
            'sender', 'sender_username', 'sender_email',
            'notification_type', 'title', 'message',
            'link', 'read', 'read_at', 'created_at'
        ]
        read_only_fields = ['created_at', 'read_at']


class NotificationListSerializer(serializers.ModelSerializer):
    """Simplified serializer for list views."""
    
    sender_username = serializers.ReadOnlyField(source='sender.username')
    
    class Meta:
        model = Notification
        fields = [
            'id', 'sender_username', 'notification_type',
            'title', 'message', 'link', 'read', 'created_at'
        ]


class NotificationMarkReadSerializer(serializers.Serializer):
    """Serializer for marking notifications as read."""
    
    ids = serializers.ListField(
        child=serializers.IntegerField(),
        required=False,
        help_text="List of notification IDs to mark as read. If empty, marks all as read."
    )
    
    def validate_ids(self, value):
        if value is None:
            return []
        return value