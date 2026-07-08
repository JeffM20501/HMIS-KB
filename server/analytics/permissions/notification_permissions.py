from rest_framework import permissions


class CanViewNotifications(permissions.BasePermission):
    """Users can only view their own notifications."""
    
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        
        # For list action, allow access (queryset will filter)
        if view.action == 'list':
            return True
        
        return True
    
    def has_object_permission(self, request, view, obj):
        # Users can only access their own notifications
        return obj.recipient == request.user


class CanManageNotifications(permissions.BasePermission):
    """Users can manage their own notifications."""
    
    def has_permission(self, request, view):
        return request.user.is_authenticated
    
    def has_object_permission(self, request, view, obj):
        return obj.recipient == request.user