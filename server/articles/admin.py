from django.contrib import admin
from django.utils.html import format_html
from .models import Category
from django.utils.html import format_html
from .models import Tag,ArticleTag


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    """PRD: Admin interface for managing categories."""
    
    list_display = ['name', 'slug', 'parent', 'sort_order', 'article_count_display', 'created_at']
    list_filter = ['parent', 'created_at']
    search_fields = ['name', 'description']
    prepopulated_fields = {'slug': ('name',)}
    ordering = ['sort_order', 'name']
    
    def article_count_display(self, obj):
        """Display article count in admin."""
        count = obj.get_article_count()
        return format_html(f'<b>{count}</b>')
    article_count_display.short_description = 'Articles'
    
    fieldsets = (
        ('Category Information', {
            'fields': ('name', 'slug', 'description')
        }),
        ('Organization', {
            'fields': ('parent', 'sort_order', 'icon')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    readonly_fields = ['created_at', 'updated_at']
    
@admin.register(Tag)
class TagAdmin(admin.ModelAdmin):
    """
    PRD: Admin interface for managing tags.
    """
    
    list_display = ['name', 'slug', 'article_count_display', 'created_at']
    list_filter = ['created_at']
    search_fields = ['name', 'description']
    prepopulated_fields = {'slug': ('name',)}
    
    def article_count_display(self, obj):
        """Display article count in admin."""
        count = obj.get_article_count()
        return format_html(f'<b>{count}</b>')
    article_count_display.short_description = 'Articles'
    
    fieldsets = (
        ('Tag Information', {
            'fields': ('name', 'slug', 'description')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    readonly_fields = ['created_at', 'updated_at']


@admin.register(ArticleTag)
class ArticleTagAdmin(admin.ModelAdmin):
    """
    PRD: Admin interface for managing article-tag relationships.
    """
    
    list_display = ['article', 'tag', 'added_by', 'added_at']
    list_filter = ['added_at', 'tag']
    search_fields = ['article__title', 'tag__name']
    readonly_fields = ['added_at']