from django.core.exceptions import ValidationError
from django.utils.translation import gettext_lazy as _


def validate_action(value):
    """Validate that the action is valid."""
    valid_actions = [
        'create', 'update', 'delete', 'publish', 'reject',
        'submit', 'login', 'logout', 'role_change', 'view', 'export'
    ]
    
    if not value:
        raise ValidationError(_("Action is required."))
    
    if value not in valid_actions:
        raise ValidationError(
            _("'%(value)s' is not a valid action. Must be one of: %(actions)s."),
            params={'value': value, 'actions': ', '.join(valid_actions)}
        )
    
    return value


def validate_content_type(value):
    """Validate that the content type is provided."""
    if not value:
        raise ValidationError(_("Content type is required."))
    
    return value


def validate_object_id(value):
    """Validate that the object ID is a positive integer."""
    if not value:
        raise ValidationError(_("Object ID is required."))
    
    if value <= 0:
        raise ValidationError(_("Object ID must be a positive integer."))
    
    return value