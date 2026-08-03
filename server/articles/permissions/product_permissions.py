from rest_framework import permissions

class IsProductRead(permissions.BasePermission):
    """
    Allows read access for authenticated users with role 'admin' or 'editor'.
    """
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ['admin', 'editor']

    def has_object_permission(self, request, view, obj):
        return request.user.is_authenticated and request.user.role in ['admin', 'editor']

class IsProductWrite(permissions.BasePermission):
    """
    Allows write access only for authenticated users with role 'admin'.
    """
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'admin'

    def has_object_permission(self, request, view, obj):
        return request.user.is_authenticated and request.user.role == 'admin'