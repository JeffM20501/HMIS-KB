from rest_framework import serializers
from analytics.models.search_logs import SearchLog
from analytics.validators.search_log_validator import validate_query


class SearchLogSerializer(serializers.ModelSerializer):
    """PRD FR-2.6: Serializer for search logs."""
    
    username = serializers.ReadOnlyField(source='user.username')
    user_email = serializers.ReadOnlyField(source='user.email')
    
    class Meta:
        model = SearchLog
        fields = [
            'id', 'user', 'username', 'user_email',
            'query', 'result_count', 'created_at'
        ]
        read_only_fields = ['created_at', 'user']
    
    def validate_query(self, value):
        return validate_query(value)
    
    def create(self, validated_data):
        """Set the user from the request."""
        request = self.context.get('request')
        if request and request.user:
            validated_data['user'] = request.user
        return super().create(validated_data)


class SearchLogListSerializer(serializers.ModelSerializer):
    """Simplified serializer for list views."""
    
    username = serializers.ReadOnlyField(source='user.username')
    
    class Meta:
        model = SearchLog
        fields = ['id', 'username', 'query', 'result_count', 'created_at']