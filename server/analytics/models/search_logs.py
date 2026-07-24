from django.db import models
from django.conf import settings

class SearchLog(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        null=True,          
        blank=True
    )
    query = models.CharField(max_length=500)
    result_count = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'created_at']),
            models.Index(fields=['query']),
            models.Index(fields=['created_at']),
        ]

    def __str__(self):
        return f"{self.user or 'Anonymous'} searched '{self.query}'"