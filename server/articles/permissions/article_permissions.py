from rest_framework import permissions
from articles.models.article import Article


class IsEditor(permissions.BasePermission):
    """PRD: Editor role permission."""
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'editor'


class IsAdmin(permissions.BasePermission):
    """PRD: Admin role permission."""
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'admin'


class IsViewer(permissions.BasePermission):
    """PRD: Viewer role permission."""
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'viewer'


class CanListArticles(permissions.BasePermission):
    """PRD FR-3.2: Viewers can read published content."""
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        
        # Anyone can list articles (filtering happens in queryset)
        return True
    
    def has_object_permission(self, request, view, obj):
        # Viewers can only see published articles
        if request.user.role == 'viewer':
            return obj.status == 'published'
        
        # Editors and admins can see all articles
        return request.user.role in ['editor', 'admin']


class CanCreateArticle(permissions.BasePermission):
    """PRD FR-3.3: Editors can create articles."""
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ['editor', 'admin']


class CanEditArticle(permissions.BasePermission):
    """PRD FR-3.3: Editors can edit their own drafts."""
    def has_object_permission(self, request, view, obj):
        # Admin can edit any article
        if request.user.role == 'admin':
            return True
        
        # Editor can only edit their own drafts
        if request.user.role == 'editor':
            return obj.author == request.user and obj.status in ['draft', 'pending_review']
        
        return False


class CanPublishArticle(permissions.BasePermission):
    """PRD FR-3.4: Only admins can publish articles."""
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'admin'