from rest_framework import permissions


class CanViewChatLogs(permissions.BasePermission):
    """
    PRD FR-5.9: Admins can review logs.
    Users can only view their own logs.
    """
    
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        
        # Users can view their own
        if view.action == 'list':
            return True
        return True
    
    def has_object_permission(self, request, view, obj):
        # Admins can view any
        if request.user.role == 'admin':
            return True
        # Users can only view their own
        return obj.user == request.user