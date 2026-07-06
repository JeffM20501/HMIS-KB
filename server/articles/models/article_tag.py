from django.db import models
from django.utils import timezone
from django.core.exceptions import ValidationError
from users.models import User 


class ArticleTag(models.Model):
    """
    PRD FR-1.5: Junction table for Article-Tag many-to-many relationship.
    Stores additional data about the relationship.
    """
    

    article = models.ForeignKey(
        'articles.Article', 
        on_delete=models.CASCADE,
        related_name='article_tags'
    )
    tag = models.ForeignKey(
        'articles.Tag', 
        on_delete=models.CASCADE,
        related_name='tag_articles'
    )
    added_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='added_tags'
    )
    added_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        # Ensure a tag can only be added once per article
        unique_together = ['article', 'tag']
        ordering = ['-added_at']
        verbose_name_plural = 'Article Tags'
    
    def clean(self):
        """Validate the relationship."""
        if self.article and self.tag:
            # Check if this tag is already added to this article
            if ArticleTag.objects.filter(
                article=self.article,
                tag=self.tag
            ).exclude(pk=self.pk).exists():
                raise ValidationError(
                    f"Tag '{self.tag.name}' is already added to this article."
                )
    
    def __str__(self):
        return f"{self.article.title} → {self.tag.name}"