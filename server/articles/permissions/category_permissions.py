from rest_framework import permissions


class IsCategoryAdmin(permissions.BasePermission):
    """PRD: Only admins can create, edit, or delete categories."""
    
    def has_permission(self, request, view):
        # Safe methods (GET, HEAD, OPTIONS) are allowed for everyone
        if request.method in permissions.SAFE_METHODS:
            return True
        
        # Non-safe methods require admin role
        return request.user.is_authenticated and request.user.role == 'admin'
    
    def has_object_permission(self, request, view, obj):
        # Safe methods are allowed for everyone
        if request.method in permissions.SAFE_METHODS:
            return True
        
        # Non-safe methods require admin role
        return request.user.is_authenticated and request.user.role == 'admin'