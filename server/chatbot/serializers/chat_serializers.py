from rest_framework import serializers


class ChatRequestSerializer(serializers.Serializer):
    """
    Accepts `message` (the field name the React frontend's chatbot.api.js
    actually sends) with `question` as a backward-compatible alias — the
    previous backend implementation only read `question`, which the
    frontend never sent, so every real request from the app was silently
    rejected. Supporting both avoids a second breaking change on either side.
    """

    message = serializers.CharField(required=False, allow_blank=True, trim_whitespace=False)
    question = serializers.CharField(required=False, allow_blank=True, trim_whitespace=False)
    conversation_id = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    context = serializers.DictField(required=False, default=dict)

    def validate(self, data):
        text = data.get('message') or data.get('question')
        if not text or not text.strip():
            raise serializers.ValidationError({'message': 'A message is required.'})
        data['message'] = text
        return data


class ChatSourceSerializer(serializers.Serializer):
    article_slug = serializers.CharField()
    title = serializers.CharField()
    confidence = serializers.FloatField()


class ChatResponseSerializer(serializers.Serializer):
    """
    Matches the shape chatbot/ChatMessage.jsx and SourceCitationCard.jsx
    already expect on the frontend: `answer` + a `sources` array (not the
    old single `article_ref` object) + `conversation_id` + an
    `escalate_suggested` flag the UI uses to surface the "escalate to
    support" affordance.
    """

    conversation_id = serializers.CharField()
    chat_log_id=serializers.IntegerField()
    answer = serializers.CharField()
    sources = ChatSourceSerializer(many=True)
    escalate_suggested = serializers.BooleanField(default=False)
    confidence = serializers.FloatField(required=False, allow_null=True)
