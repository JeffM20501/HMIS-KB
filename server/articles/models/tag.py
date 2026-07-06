from django.db import models
from django.utils.text import slugify
from django.core.exceptions import ValidationError
from articles.validators.tag_validator import validate_name, validate_slug

class Tag(models.Model):
    """
    PRD FR-1.5: Articles can be tagged for better organization and search.
    PRD FR-2.3: Users can filter search results by tag.
    """
    name = models.CharField(
        max_length=50,
        unique=True,
        validators=[validate_name],
        help_text="Tag name (e.g., 'Emergency', 'SOP', 'FAQ')"
    )
    slug = models.SlugField(
        max_length=60,
        unique=True,
        validators=[validate_slug],
        help_text="URL-friendly version (e.g., 'emergency')"
    )
    description = models.TextField(
        blank=True,
        help_text="Optional description of the tag"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['name']
    
    def save(self, *args, **kwargs):
        """Auto-generate slug from name if not provided."""
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)
    
    def get_article_count(self):
        """Get the number of articles with this tag."""
        return self.articles.count()
    
    def __str__(self):
        return self.name