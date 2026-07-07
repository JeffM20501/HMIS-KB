from rest_framework import serializers
from analytics.models.feedback import Feedback
from analytics.validators.feedback_validator import validate_rating, validate_comment
from articles.models.article import Article
from analytics.models.chat_logs import ChatLog


class FeedbackSerializer(serializers.ModelSerializer):
    username = serializers.ReadOnlyField(source='user.username')
    user_email = serializers.ReadOnlyField(source='user.email')

    class Meta:
        model = Feedback
        fields = [
            'id', 'user', 'username', 'user_email',
            'content_type', 'object_id',
            'rating', 'helpful', 'comment', 'created_at'
        ]
        read_only_fields = ['created_at', 'user']

    def validate_rating(self, value):
        return validate_rating(value)

    def validate_comment(self, value):
        return validate_comment(value)

    def validate(self, data):
        content_type = data.get('content_type')
        object_id = data.get('object_id')
        rating = data.get('rating')
        helpful = data.get('helpful')

        # Validate content_type
        if content_type not in ['article', 'chat']:
            raise serializers.ValidationError(
                f"'{content_type}' is not a valid content type. Must be 'article' or 'chat'."
            )

        # Validate that the object exists
        if content_type == 'article':
            if not Article.objects.filter(pk=object_id, status='published').exists():
                raise serializers.ValidationError(
                    f"Article with ID {object_id} does not exist or is not published."
                )
        elif content_type == 'chat':
            if not ChatLog.objects.filter(pk=object_id).exists():
                raise serializers.ValidationError(
                    f"Chat log with ID {object_id} does not exist."
                )

        # Check at least one feedback type
        if rating is None and helpful is None:
            raise serializers.ValidationError(
                "You must provide either a rating or helpful feedback."
            )

        # Content-type specific requirements
        if content_type == 'article' and rating is None:
            raise serializers.ValidationError(
                {"rating": "Rating is required for article feedback."}
            )
        if content_type == 'chat' and helpful is None:
            raise serializers.ValidationError(
                {"helpful": "Helpful flag is required for chat feedback."}
            )

        # Check for duplicate
        request = self.context.get('request')
        if request and request.user and object_id:
            instance = getattr(self, 'instance', None)
            queryset = Feedback.objects.filter(
                user=request.user,
                content_type=content_type,
                object_id=object_id
            )
            if instance:
                queryset = queryset.exclude(pk=instance.pk)
            if queryset.exists():
                raise serializers.ValidationError(
                    "You have already provided feedback for this item."
                )

        return data

    def create(self, validated_data):
        request = self.context.get('request')
        if request and request.user:
            validated_data['user'] = request.user
        return super().create(validated_data)