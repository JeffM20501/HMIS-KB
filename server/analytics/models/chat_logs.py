from django.db import models

from django.db import models
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from analytics.validators.chat_log_validator import (
    validate_question,
    validate_answer,
    validate_conversation_id
)

User = get_user_model()


class ChatLog(models.Model):
    """
    PRD FR-5.8: All assistant queries and responses are logged.
    PRD FR-5.7: Conversation history within a session is retained for context.
    PRD FR-5.10: Support 'was this helpful' feedback control.
    PRD FR-5.2: Answer generated only from published KB articles.
    """
    
    # Who asked the question
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='chat_logs'
    )
    
    # Conversation grouping (for multi-turn chats)
    conversation_id = models.CharField(
        max_length=100,
        validators=[validate_conversation_id],
        help_text="Unique identifier for the conversation session"
    )
    
    # The question asked
    question = models.TextField(
        validators=[validate_question],
        help_text="The user's question"
    )
    
    # The answer provided
    answer = models.TextField(
        validators=[validate_answer],
        help_text="The bot's response"
    )
    
    # Reference to the article used (grounding)
    article_ref = models.ForeignKey(
        'articles.Article',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='chat_logs',
        help_text="Article used to ground the answer"
    )
    
    # Was the answer helpful? (FR-5.10)
    was_helpful = models.BooleanField(
        null=True,
        blank=True,
        help_text="User feedback on whether the answer was helpful"
    )
    
    # Additional metadata
    response_time = models.FloatField(
        null=True,
        blank=True,
        help_text="Time taken to generate response (in seconds)"
    )
    
    confidence_score = models.FloatField(
        null=True,
        blank=True,
        help_text="Confidence score of the answer (0-1)"
    )
    
    # Timestamp
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'conversation_id']),
            models.Index(fields=['conversation_id', 'created_at']),
            models.Index(fields=['article_ref']),
            models.Index(fields=['was_helpful']),
        ]
    
    def clean(self):
        """Validate the chat log entry."""
        super().clean()
        
        # If article_ref is provided, it must be published
        if self.article_ref and self.article_ref.status != 'published':
            raise ValidationError({
                'article_ref': 'Only published articles can be used as references.'
            })
    
    def __str__(self):
        preview = self.question[:50] + '...' if len(self.question) > 50 else self.question
        return f"{self.user.username} asked: '{preview}' at {self.created_at}"
    
    def get_feedback(self):
        """Get the feedback for this chat log."""
        from .feedback import Feedback
        try:
            return Feedback.objects.get(
                content_type='chat',
                object_id=self.id
            )
        except Feedback.DoesNotExist:
            return None
    
    def get_article_title(self):
        """Get the title of the referenced article."""
        return self.article_ref.title if self.article_ref else None