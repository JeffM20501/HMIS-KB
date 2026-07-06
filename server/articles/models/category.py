from django.db import models
from django.utils.text import slugify
from django.core.exceptions import ValidationError
from articles.validators.category_validator import (
    validate_name,
    validate_slug,
    validate_icon
)


class Category(models.Model):
    """
    PRD FR-1.5: Articles can be categorized.
    PRD FR-8.1: Top-level categories for organizing content.
    """
    name = models.CharField(
        max_length=100,
        unique=True,
        validators=[validate_name],
        help_text="Category name (e.g., 'Patient Management')"
    )
    slug = models.SlugField(
        max_length=120,
        unique=True,
        validators=[validate_slug],
        help_text="URL-friendly version (e.g., 'patient-management')"
    )
    description = models.TextField(
        blank=True,
        help_text="Optional description of the category"
    )
    parent = models.ForeignKey(
        'self',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='children',
        help_text="Parent category for nested categories"
    )
    icon = models.CharField(
        max_length=50,
        blank=True,
        validators=[validate_icon],
        help_text="Icon name or emoji (e.g., '🏥', 'fa-user')"
    )
    sort_order = models.PositiveIntegerField(
        default=0,
        help_text="Order for display (lower numbers first)"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['sort_order', 'name']
        verbose_name_plural = 'Categories'
    
    def save(self, *args, **kwargs):
        """Auto-generate slug from name if not provided."""
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)
    
    def clean(self):
        """Cross-field validation."""
        super().clean()
        
        # Prevent a category from being its own parent
        if self.parent and self.parent == self:
            raise ValidationError({
                'parent': 'A category cannot be its own parent.'
            })
        
        # Prevent circular references
        if self.parent and self.pk:
            if self._is_circular_reference(self.parent):
                raise ValidationError({
                    'parent': 'This would create a circular reference.'
                })
    
    def _is_circular_reference(self, parent):
        """Check if parent would create a circular reference."""
        current = parent
        while current:
            if current == self:
                return True
            current = current.parent
        return False
    
    def get_full_path(self):
        """Get the full path of the category (e.g., 'Clinical Modules > Lab')."""
        if self.parent:
            return f"{self.parent.get_full_path()} > {self.name}"
        return self.name
    
    def get_article_count(self):
        """Get the number of articles in this category."""
        return self.articles.count()
    
    def __str__(self):
        return self.name