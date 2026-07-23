from django.db import models
from django.utils import timezone
from articles.models.category import Category
from articles.models.tag import Tag
from articles.models.article_tag import ArticleTag
from users.models import User
from articles.validators.article_validator import *
from analytics.models import ArticleViewLog

STATUS_CHOICES = [
    ('draft', 'Draft'),
    ('pending_review', 'Pending Review'),  
    ('published', 'Published'),
    ('archived', 'Archived'),  
]

class Article(models.Model):
    
    title = models.CharField(max_length=200)
    slug = models.SlugField(max_length=200, unique=True)
    content = models.TextField()
    
    category = models.ForeignKey(
        Category, 
        on_delete=models.SET_NULL,
        null=True,
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
    
    
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='draft'
    )
    views = models.PositiveIntegerField(default=0)  
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    published_at = models.DateTimeField(null=True, blank=True)
    
    # assosiation
    tags = models.ManyToManyField(
        Tag,
        through='articles.ArticleTag',
        through_fields=('article', 'tag'),
        blank=True,
        related_name='articles'
    )
    
    article_type=models.CharField(
        max_length=50, 
        blank=True, 
        default='article',
    )
    
    def clean(self):
        """PRD: FR-3.3 Editors can create/edit but not publish."""
        super().clean()        
        
        if self.author and self.author.role not in ['editor', 'admin']:
            raise ValidationError({
                'author': 'Only editors and admins can create articles.'
            })
        
    
        if self.status == 'published':
            if not self.published_by:
                raise ValidationError({
                    'published_by': 'Published articles must have a publisher.'
                })
            if self.published_by.role != 'admin':
                raise ValidationError({
                    'published_by': 'Only admins can publish articles.'
                })
    
        if self.pk and self.status == 'published':
            original = Article.objects.get(pk=self.pk)
            if original.status == 'draft' and self.author.role != 'admin':
                raise ValidationError({
                    'status': 'Only admins can publish articles. Please submit for review.'
                })
    
    def publish(self, admin_user):
        """PRD: FR-1.3 Admins can publish articles."""
        if admin_user.role != 'admin':
            raise PermissionError('Only admins can publish articles.')
        
        self.status = 'published'
        self.published_by = admin_user
        self.published_at = timezone.now()
        self.save()
    
    def submit_for_review(self):
        """PRD: FR-3.3 Editors can submit for Admin review."""
        if self.status != 'draft':
            raise ValueError('Only draft articles can be submitted for review.')
        
        self.status = 'pending_review'
        self.save()
    
    def record_view(self, request):
        if self.status != 'published':
            return

        if request.user.is_authenticated:
            viewed_key = f'viewed_articles_user_{request.user.id}'
        else:
            viewed_key = 'viewed_articles_anonymous'

        session = request.session
        viewed = session.get(viewed_key, [])

        if self.id not in viewed:
            self.views += 1
            self.save(update_fields=['views'])

            # Local import to avoid circular dependency
            from analytics.models import ArticleViewLog
            ArticleViewLog.objects.create(
                article=self,
                user=request.user if request.user.is_authenticated else None,
                timestamp=timezone.now()
            )

            viewed.append(self.id)
            session[viewed_key] = viewed
            session.modified = True
            
    def __str__(self):
            return self.title