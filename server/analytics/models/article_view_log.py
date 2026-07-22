from django.db import models
from django.utils import timezone

class ArticleViewLog(models.Model):
    article = models.ForeignKey('articles.Article', on_delete=models.CASCADE, related_name='views_log')
    user = models.ForeignKey('users.User', on_delete=models.SET_NULL, null=True, blank=True)
    timestamp = models.DateTimeField(default=timezone.now)

    class Meta:
        indexes = [
            models.Index(fields=['article', 'timestamp']),
            models.Index(fields=['timestamp']),
        ]
        ordering = ['-timestamp']

    def __str__(self):
        return f"{self.article.title} viewed at {self.timestamp}"