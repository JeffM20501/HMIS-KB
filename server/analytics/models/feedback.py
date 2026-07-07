from django.db import models

from django.db import models
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from analytics.validators.feedback_validator import (
    validate_rating,
    validate_comment,
    validate_content_type
)

User = get_user_model()


class Feedback(models.Model):
    """
    PRD FR-4.1: Users can rate articles (1-5 stars) and leave comments.
    PRD FR-5.10: Users can provide 'was this helpful' feedback on chat responses.
    """
    
    CONTENT_TYPES = [
        ('article', 'Article'),
        ('chat', 'Chat'),
    ]
    
    # Who gave the feedback
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='feedbacks'
    )
    
    # What type of object
    content_type = models.CharField(
        max_length=10,
        choices=CONTENT_TYPES,
        validators=[validate_content_type]
    )
    
    # Which specific object (ID)
    object_id = models.PositiveIntegerField()
    
    # Rating (1-5 for articles)
    rating = models.PositiveSmallIntegerField(
        null=True,
        blank=True,
        validators=[validate_rating],
        help_text="Article rating (1-5 stars)"
    )
    
    # Helpful flag (for chat feedback)
    helpful = models.BooleanField(
        null=True,
        blank=True,
        help_text="Was the chat response helpful?"
    )
    
    # Optional comment
    comment = models.TextField(
        blank=True,
        validators=[validate_comment]
    )
    
    # When it was created
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
        # Prevent duplicate feedback per user per object
        unique_together = ['user', 'content_type', 'object_id']
        indexes = [
            models.Index(fields=['user', 'content_type', 'object_id']),
            models.Index(fields=['content_type', 'object_id']),
        ]
    
    def clean(self):
        """Validate that either rating or helpful is set."""
        if self.rating is None and self.helpful is None:
            raise ValidationError(
                "You must provide either a rating or helpful feedback."
            )
        
        # For article feedback, rating is required
        if self.content_type == 'article' and self.rating is None:
            raise ValidationError("Rating is required for article feedback.")
        
        # For chat feedback, helpful is required
        if self.content_type == 'chat' and self.helpful is None:
            raise ValidationError("Helpful flag is required for chat feedback.")
    
    def __str__(self):
        obj_type = self.get_content_type_display()
        if self.content_type == 'article':
            return f"{self.user.username} rated {obj_type} #{self.object_id}: {self.rating}★"
        else:
            return f"{self.user.username} said chat #{self.object_id} was {'helpful' if self.helpful else 'not helpful'}"
    
    def get_object(self):
        """Get the actual object (article or chat log) this feedback refers to."""
        if self.content_type == 'article':
            from articles.models import Article
            try:
                return Article.objects.get(pk=self.object_id)
            except Article.DoesNotExist:
                return None
        elif self.content_type == 'chat':
            from .chat_logs import ChatLog
            try:
                return ChatLog.objects.get(pk=self.object_id)
            except ChatLog.DoesNotExist:
                return None
        return None
