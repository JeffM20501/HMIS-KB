from django.db import models
from django.conf import settings


class Conversation(models.Model):
    """
    Groups a sequence of chat turns together for history/rename/archive/
    delete support. `user` is null for anonymous visitors — those are
    instead tracked by `session_key` (Django's session framework), mirroring
    how ChatbotView already generates a stable per-session id for anon
    users today.

    `title` is auto-set from the first question on creation and can be
    renamed by the owner afterward (see ConversationSerializer).
    """

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='conversations',
    )
    session_key = models.CharField(max_length=64, null=True, blank=True, db_index=True)
    title = models.CharField(max_length=255, blank=True)
    is_archived = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-updated_at']
        indexes = [
            models.Index(fields=['user', '-updated_at']),
            models.Index(fields=['session_key', '-updated_at']),
        ]

    def __str__(self):
        return self.title or f"Conversation {self.pk}"

    def owned_by(self, request):
        """True if this request's user/session is allowed to see/modify this conversation."""
        if self.user_id:
            return request.user.is_authenticated and request.user.id == self.user_id
        return self.session_key and self.session_key == request.session.session_key

    def set_title_from_text(self, text, max_length=60):
        cleaned = ' '.join((text or '').split())
        self.title = (cleaned[:max_length] + '…') if len(cleaned) > max_length else cleaned
