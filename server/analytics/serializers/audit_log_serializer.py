from rest_framework import serializers
from analytics.models.audit_log import AuditLog


class AuditLogSerializer(serializers.ModelSerializer):
    """PRD FR-3.6: Serializer for audit logs."""
    
    username = serializers.ReadOnlyField(source='user.username')
    user_email = serializers.ReadOnlyField(source='user.email')
    user_role = serializers.ReadOnlyField(source='user.role')
    
    class Meta:
        model = AuditLog
        fields = [
            'id', 'user', 'username', 'user_email', 'user_role',
            'user_ip', 'user_agent', 'action', 'content_type',
            'object_id', 'object_repr', 'changes', 'reason', 'timestamp'
        ]
        read_only_fields = ['timestamp']

class AuditLogListSerializer(serializers.ModelSerializer):
    username = serializers.ReadOnlyField(source='user.username')
    user_email = serializers.ReadOnlyField(source='user.email')
    full_name = serializers.SerializerMethodField()
    display_action = serializers.SerializerMethodField()
    object_label = serializers.ReadOnlyField(source='object_repr')
    object_type = serializers.ReadOnlyField(source='content_type')
    ip_address = serializers.ReadOnlyField(source='user_ip')
    created_at = serializers.ReadOnlyField(source='timestamp')
    detail = serializers.SerializerMethodField()

    class Meta:
        model = AuditLog
        fields = [
            'id', 'user', 'username', 'user_email', 'full_name',
            'display_action', 'object_label', 'object_type',
            'ip_address', 'created_at', 'detail'
        ]

    def get_full_name(self, obj):
        if obj.user and hasattr(obj.user, 'full_name'):
            return obj.user.full_name
        return obj.user.username if obj.user else None

    def get_display_action(self, obj):
        return obj.get_action_display()

    def get_detail(self, obj):
        if obj.reason:
            return obj.reason
        if obj.changes and isinstance(obj.changes, dict):
            parts = []
            for field, value in obj.changes.items():
                if isinstance(value, dict) and 'old' in value and 'new' in value:
                    parts.append(f"{field}: {value['old']} → {value['new']}")
            if parts:
                return "; ".join(parts[:3])
        return None

class AuditLogDetailSerializer(serializers.ModelSerializer):
    """Detailed serializer for single log entry."""
    
    username = serializers.ReadOnlyField(source='user.username')
    user_email = serializers.ReadOnlyField(source='user.email')
    user_role = serializers.ReadOnlyField(source='user.role')
    
    class Meta:
        model = AuditLog
        fields = [
            'id', 'user', 'username', 'user_email', 'user_role',
            'user_ip', 'user_agent', 'action', 'content_type',
            'object_id', 'object_repr', 'changes', 'reason', 'timestamp'
        ]
        read_only_fields = ['timestamp']