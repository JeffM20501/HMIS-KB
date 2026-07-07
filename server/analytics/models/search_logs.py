from django.db import models

# Create your models here.
from django.db import models
from django.contrib.auth import get_user_model
from analytics.validators.search_log_validator import validate_query

User = get_user_model()


class SearchLog(models.Model):
    """
    PRD FR-2.6: All searches are logged for analytics (query, result count, timestamp).
    """
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='search_logs'
    )
    query = models.CharField(
        max_length=500,
        validators=[validate_query],
        help_text="The search query entered by the user"
    )
    result_count = models.PositiveIntegerField(
        null=True,
        blank=True,
        help_text="Number of results returned for the query"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'created_at']),
            models.Index(fields=['query']),
            models.Index(fields=['created_at']),
        ]

    def __str__(self):
        preview = self.query[:30] + '...' if len(self.query) > 30 else self.query
        return f"{self.user.username} searched '{preview}' at {self.created_at}"