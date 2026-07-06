from rest_framework import permissions

class CanManageTags(permissions.BasePermission):
    """
    PRD: Only admins can create, edit, or delete tags.
    Everyone can view tags.
    """
    
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        
        return request.user.is_authenticated and request.user.role == 'admin'
    
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        
        return request.user.is_authenticated and request.user.role == 'admin'