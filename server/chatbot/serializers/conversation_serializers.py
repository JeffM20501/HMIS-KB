from rest_framework import serializers

from chatbot.models import Conversation


class ConversationSerializer(serializers.ModelSerializer):
    message_count = serializers.SerializerMethodField()

    class Meta:
        model = Conversation
        fields = ['id', 'title', 'is_archived', 'message_count', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at', 'message_count']

    def get_message_count(self, obj):
        return obj.messages.count()


class ConversationRenameSerializer(serializers.Serializer):
    title = serializers.CharField(max_length=255, allow_blank=False)


class ConversationMessageSerializer(serializers.Serializer):
    """Read-only shape for replaying a conversation's turns (loading previous conversations)."""

    question = serializers.CharField()
    answer = serializers.CharField()
    was_helpful = serializers.BooleanField(allow_null=True)
    created_at = serializers.DateTimeField()
    sources = serializers.SerializerMethodField()

    def get_sources(self, obj):
        return [
            {'article_slug': s.article.slug, 'title': s.article.title, 'confidence': s.confidence}
            for s in obj.sources.select_related('article').all()
        ]
