from rest_framework import permissions


class CanViewFeedback(permissions.BasePermission):
    """Only admins and the feedback owner can view feedback."""
    
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        #queryset to handle filter
        if view.action == 'list':
            return True
        return True

    def has_object_permission(self, request, view, obj):
        if request.user.role == 'admin':
            return True
        return obj.user == request.user


class CanCreateFeedback(permissions.BasePermission):
    """Any authenticated user can create feedback."""
    
    def has_permission(self, request, view):
        return request.user.is_authenticated