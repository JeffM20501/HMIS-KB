from analytics.models.audit_log import AuditLog


class AuditLogMiddleware:
    """
    Middleware to automatically log user actions.
    """
    
    def __init__(self, get_response):
        self.get_response = get_response
    
    def __call__(self, request):
        # Process request
        response = self.get_response(request)
        return response
    
    def process_view(self, request, view_func, view_args, view_kwargs):
        """Log view access for certain actions."""
        # Skip for static files, admin, etc.
        if request.path.startswith('/admin/') or request.path.startswith('/static/'):
            return None
        
        # Only log authenticated users
        if not request.user.is_authenticated:
            return None
        
        # Log specific actions
        if request.method == 'POST' and 'create' in str(view_func):
            self._log_action(request, AuditLog.ACTION_CREATE, view_func)
        elif request.method in ['PUT', 'PATCH']:
            self._log_action(request, AuditLog.ACTION_UPDATE, view_func)
        elif request.method == 'DELETE':
            self._log_action(request, AuditLog.ACTION_DELETE, view_func)
        
        return None
    
    def _log_action(self, request, action, view_func):
        """Helper to log an action."""
        # Get the object if available
        obj = getattr(request, '_cached_object', None)
        if obj:
            AuditLog.log_action(
                user=request.user,
                action=action,
                obj=obj,
                user_ip=self._get_client_ip(request),
                user_agent=request.META.get('HTTP_USER_AGENT', '')
            )
    
    def _get_client_ip(self, request):
        """Get client IP address."""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip