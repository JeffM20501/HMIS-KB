from django.db import models
from django.conf import settings
from django.core.exceptions import ValidationError

class ChatLog(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        null=True,        
        blank=True
    )
    conversation_uuid = models.CharField(null=True,max_length=255, db_index=True)
    # Added alongside conversation_id (kept for backward compatibility with
    # any existing rows/log readers) — new code should prefer this FK, which
    # is what powers rename/archive/delete/list-conversations support.
    conversation = models.ForeignKey(
        'chatbot.Conversation',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='messages',
    )
    question = models.TextField()
    answer = models.TextField()
    article_ref = models.ForeignKey('articles.Article', null=True, blank=True, on_delete=models.SET_NULL)
    was_helpful = models.BooleanField(null=True, blank=True)
    response_time = models.FloatField(null=True, blank=True)
    confidence_score = models.FloatField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'conversation_uuid']),
            models.Index(fields=['conversation', 'created_at']),
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
        who = self.user.username if self.user else 'Anonymous'
        return f"{who} asked: '{preview}' at {self.created_at}"
    
    def get_sources(self):
        """All cited source articles for this answer, ranked."""
        return self.sources.select_related('article').all()

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