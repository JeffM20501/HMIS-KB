from rest_framework import permissions
from articles.models.article import Article


class CanUploadMedia(permissions.BasePermission):
    """
    PRD: Only editors and admins can upload media.
    """
    
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        
        return request.user.role in ['editor', 'admin']
    
    def has_object_permission(self, request, view, obj):
        # Admin can manage any media
        if request.user.role == 'admin':
            return True
        
        # Editor can only manage media on their own articles
        if request.user.role == 'editor':
            return obj.article.author == request.user
        
        return False


class CanViewMedia(permissions.BasePermission):
    """
    PRD: Anyone can view media if they can view the article.
    """
    
    def has_permission(self, request, view):
        return request.user.is_authenticated
    
    def has_object_permission(self, request, view, obj):
        # Anyone can view media on published articles
        if obj.article.status == 'published':
            return True
        
        # Only authors and admins can view media on drafts
        if request.user.role == 'admin':
            return True
        
        return obj.article.author == request.user