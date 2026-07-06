from rest_framework import permissions


class CanManageArticleTags(permissions.BasePermission):
    """
    PRD: Only editors and admins can manage article tags.
    """
    
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return request.user.is_authenticated
        
        return request.user.is_authenticated and request.user.role in ['editor', 'admin']
    
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        
        return request.user.is_authenticated and request.user.role in ['editor', 'admin']