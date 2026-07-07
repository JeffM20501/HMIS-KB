from rest_framework import permissions


class CanViewSearchLogs(permissions.BasePermission):
    """
    Admins can view all search logs.
    Users can only view their own logs.
    """
    
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        
        # Allow all authenticated users for list (queryset will filter)
        if view.action == 'list':
            return True
        
        return True
    
    def has_object_permission(self, request, view, obj):
        if request.user.role == 'admin':
            return True
        return obj.user == request.user


class CanCreateSearchLog(permissions.BasePermission):
    """Any authenticated user can create a search log."""
    
    def has_permission(self, request, view):
        return request.user.is_authenticated