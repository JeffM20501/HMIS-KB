from django.db import models


class ChatLogSource(models.Model):
    """
    One cited source article for a given chat answer. Replaces the old
    single `ChatLog.article_ref` FK for cases where the RAG pipeline
    grounds an answer in more than one retrieved chunk/article — which is
    the common case once top-k retrieval (k>1) is used. `ChatLog.article_ref`
    is kept as a convenience "best/primary source" field for backward
    compatibility with any existing code reading it directly.
    """

    chat_log = models.ForeignKey('analytics.ChatLog', on_delete=models.CASCADE, related_name='sources')
    article = models.ForeignKey('articles.Article', on_delete=models.CASCADE, related_name='chat_citations')
    confidence = models.FloatField(default=0.0)
    rank = models.PositiveSmallIntegerField(default=0)

    class Meta:
        ordering = ['rank']
        constraints = [
            models.UniqueConstraint(fields=['chat_log', 'article'], name='unique_source_per_chat_log'),
        ]

    def __str__(self):
        return f"{self.article.title} ({self.confidence:.2f}) for chat_log {self.chat_log_id}"
