from rest_framework import serializers
from analytics.models.chat_logs import ChatLog
from analytics.validators.chat_log_validator import (
    validate_question,
    validate_answer,
    validate_conversation_id
)


class ChatLogSerializer(serializers.ModelSerializer):
    """PRD FR-5.8: Serializer for chat logs."""
    
    username = serializers.ReadOnlyField(source='user.username')
    article_title = serializers.ReadOnlyField(source='article_ref.title')
    has_feedback = serializers.SerializerMethodField()
    
    class Meta:
        model = ChatLog
        fields = [
            'id', 'user', 'username', 'conversation_id',
            'question', 'answer', 'article_ref', 'article_title',
            'was_helpful', 'response_time', 'confidence_score',
            'has_feedback', 'created_at'
        ]
        read_only_fields = ['created_at']
    
    def get_has_feedback(self, obj):
        """Check if this chat log has feedback."""
        return obj.get_feedback() is not None
    
    def validate_question(self, value):
        return validate_question(value)
    
    def validate_answer(self, value):
        return validate_answer(value)
    
    def validate_conversation_id(self, value):
        return validate_conversation_id(value)
    
    def validate(self, data):
        """Cross-field validation."""
        # If article_ref is provided, ensure it's valid
        article_ref = data.get('article_ref')
        if article_ref and article_ref.status != 'published':
            raise serializers.ValidationError({
                'article_ref': 'Only published articles can be used as references.'
            })
        
        return data
    
    def create(self, validated_data):
        """Set the user from the request."""
        request = self.context.get('request')
        if request and request.user:
            validated_data['user'] = request.user
        return super().create(validated_data)


class ChatLogListSerializer(serializers.ModelSerializer):
    """Simplified serializer for list views."""
    
    username = serializers.ReadOnlyField(source='user.username')
    article_title = serializers.ReadOnlyField(source='article_ref.title')
    
    class Meta:
        model = ChatLog
        fields = [
            'id', 'username', 'conversation_id',
            'question', 'article_title', 'was_helpful', 'created_at'
        ]


class ChatLogDetailSerializer(serializers.ModelSerializer):
    """Detailed serializer for single chat log."""
    
    username = serializers.ReadOnlyField(source='user.username')
    user_email = serializers.ReadOnlyField(source='user.email')
    article_title = serializers.ReadOnlyField(source='article_ref.title')
    feedback = serializers.SerializerMethodField()
    
    class Meta:
        model = ChatLog
        fields = [
            'id', 'user', 'username', 'user_email',
            'conversation_id', 'question', 'answer',
            'article_ref', 'article_title', 'was_helpful',
            'response_time', 'confidence_score', 'feedback',
            'created_at'
        ]
        read_only_fields = ['created_at']
    
    def get_feedback(self, obj):
        """Get the feedback for this chat log."""
        feedback = obj.get_feedback()
        if feedback:
            from analytics.serializers.feedback_serializer import FeedbackSerializer
            return FeedbackSerializer(feedback).data
        return None


class ChatRequestSerializer(serializers.Serializer):
    """
    Serializer for incoming chat requests.
    Used by the chatbot endpoint.
    """
    question = serializers.CharField(max_length=5000)
    conversation_id = serializers.CharField(max_length=100)
    
    def validate_question(self, value):
        if not value or len(value) < 2:
            raise serializers.ValidationError("Question must be at least 2 characters.")
        return value
    
    def validate_conversation_id(self, value):
        if not value:
            raise serializers.ValidationError("Conversation ID is required.")
        return value


class ChatResponseSerializer(serializers.Serializer):
    """
    Serializer for chat responses.
    """
    answer = serializers.CharField()
    article_ref = serializers.IntegerField(allow_null=True)
    article_title = serializers.CharField(allow_null=True)
    was_grounded = serializers.BooleanField()
    confidence_score = serializers.FloatField(allow_null=True)