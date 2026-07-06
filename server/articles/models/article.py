from django.db import models
from django.utils import timezone
from django.core.exceptions import ValidationError
from articles.models.category import Category

from users.models import User
from articles.validators.article_validator import *

STATUS_CHOICES = [
    ('draft', 'Draft'),
    ('pending_review', 'Pending Review'),
    ('published', 'Published'),
    ('archived', 'Archived'),
]

class Article(models.Model):
    # Core fields
    title = models.CharField(max_length=200)
    slug = models.SlugField(max_length=200, unique=True)
    content = models.TextField()
    
    # Relationships
    category = models.ForeignKey(
        Category,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='articles'
    )
    author = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='articles_authored'
    )
    published_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='articles_published'
    )
    
    # Status & tracking
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='draft'
    )
    views = models.PositiveIntegerField(default=0)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    published_at = models.DateTimeField(null=True, blank=True)
    
    
    tags = models.ManyToManyField(
        'articles.Tag',  
        through='articles.ArticleTag',  
        through_fields=('article', 'tag'),
        blank=True,
        related_name='articles'
    )
    
    def clean(self):
        """PRD: Cross-field validation."""
        super().clean()
        
        # ... rest of your clean method
    
    def publish(self, admin_user):
        """PRD: FR-1.3 Admins can publish articles."""
        # ... rest of your publish method
    
    def submit_for_review(self):
        """PRD: FR-3.3 Editors can submit for Admin review."""
        # ... rest of your submit_for_review method
    
    def __str__(self):
        return f"Article: {self.title} by {self.author.username}"