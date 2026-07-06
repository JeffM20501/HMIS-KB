from rest_framework import serializers
from analytics.models.audit_log import AuditLog


class AuditLogSerializer(serializers.HyperlinkedModelSerializer):
    """PRD FR-3.6: Serializer for audit logs."""
    
    username = serializers.ReadOnlyField(source='user.username')
    user_email = serializers.ReadOnlyField(source='user.email')
    user_role = serializers.ReadOnlyField(source='user.role')
    
    class Meta:
        model = AuditLog
        fields = [
            'url', 'id', 'user', 'username', 'user_email', 'user_role',
            'user_ip', 'user_agent', 'action', 'content_type',
            'object_id', 'object_repr', 'changes', 'reason', 'timestamp'
        ]
        read_only_fields = ['timestamp']


class AuditLogListSerializer(serializers.HyperlinkedModelSerializer):
    """Simplified serializer for list views."""
    
    username = serializers.ReadOnlyField(source='user.username')
    
    class Meta:
        model = AuditLog
        fields = [
            'url', 'id', 'username', 'action', 'content_type',
            'object_repr', 'timestamp'
        ]


class AuditLogDetailSerializer(serializers.HyperlinkedModelSerializer):
    """Detailed serializer for single log entry."""
    
    username = serializers.ReadOnlyField(source='user.username')
    user_email = serializers.ReadOnlyField(source='user.email')
    user_role = serializers.ReadOnlyField(source='user.role')
    
    class Meta:
        model = AuditLog
        fields = [
            'url', 'id', 'user', 'username', 'user_email', 'user_role',
            'user_ip', 'user_agent', 'action', 'content_type',
            'object_id', 'object_repr', 'changes', 'reason', 'timestamp'
        ]
        read_only_fields = ['timestamp']