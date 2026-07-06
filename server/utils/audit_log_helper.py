from analytics.models.audit_log import AuditLog
from django.contrib.auth import get_user_model
from django.utils import timezone

User = get_user_model()


def log_audit_action(user, action, obj, request=None, changes=None, reason=None):
    """
    Helper function to log an audit action from anywhere in the app.
    
    Args:
        user: The user performing the action
        action: The action type (from AuditLog.ACTION_CHOICES)
        obj: The Django model instance being acted upon
        request: The HTTP request (optional, for IP and user agent)
        changes: Dict of changes made (for updates)
        reason: Optional reason for the action
    """
    data = {
        'user': user,
        'action': action,
        'obj': obj,
        'changes': changes or {},
    }
    
    if request:
        data['user_ip'] = _get_client_ip(request)
        data['user_agent'] = request.META.get('HTTP_USER_AGENT', '')
    
    if reason:
        data['reason'] = reason
    
    return AuditLog.log_action(**data)


def _get_client_ip(request):
    """Get client IP address."""
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip

def audit_log(action, get_object=None):
    """
    Decorator to automatically log actions in views.
    
    Usage:
        @audit_log('publish', get_object=lambda request, **kwargs: Article.objects.get(pk=kwargs['pk']))
        def publish_article(request, pk):
            ...
    """
    def decorator(view_func):
        def wrapper(view_instance, request, *args, **kwargs):
            response = view_func(view_instance, request, *args, **kwargs)
            
            obj = None
            if get_object:
                obj = get_object(request, **kwargs)
            else:
                if hasattr(view_instance, 'get_object'):
                    try:
                        obj = view_instance.get_object()
                    except:
                        pass
            
            if obj and request.user.is_authenticated:
                log_audit_action(
                    user=request.user,
                    action=action,
                    obj=obj,
                    request=request
                )
            
            return response
        return wrapper
    return decorator