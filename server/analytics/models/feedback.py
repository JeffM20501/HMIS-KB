from django.db import models

from django.db import models
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from analytics.validators.feedback_validator import (
    validate_rating,
    validate_comment,
    validate_content_type
)
from django.conf import settings

User = get_user_model()


class Feedback(models.Model):
    CONTENT_TYPES = (
        ('article', 'Article'),
        ('chat', 'Chat'),
    )

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        null=True,
        blank=True
    )
    content_type = models.CharField(max_length=20, choices=CONTENT_TYPES)
    object_id = models.CharField(max_length=255)  # article slug or chat_log id
    rating = models.PositiveSmallIntegerField(null=True, blank=True)  # 1-5 for articles
    helpful = models.BooleanField(null=True, blank=True)  # for chat
    comment = models.TextField(blank=True)
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
    
    def __str__(self):
        obj_type = self.get_content_type_display()
        user_str = self.user.username if self.user else 'Anonymous'
        if self.content_type == 'article':
            return f"{user_str} rated {obj_type} #{self.object_id}: {self.rating}★"
        else:
            return f"{user_str} said chat #{self.object_id} was {'helpful' if self.helpful else 'not helpful'}"
