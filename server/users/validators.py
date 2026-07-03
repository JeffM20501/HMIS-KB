from django.core.exceptions import ValidationError
from django.utils.translation import gettext_lazy as _
from django.contrib.auth import get_user_model


def validate_username(value):
    """Validate that the username is provided and unique."""
    User = get_user_model()
    
    if not value:
        raise ValidationError(
            _("Username is required.")
        )
    
    if User.objects.filter(username=value).exists():
        raise ValidationError(
            _("Username '%(value)s' is already taken."),
            params={'value': value}
        )
    
    return value


def validate_email(value):
    """Validate that the email is provided and valid."""
    User = get_user_model()
    
    if not value:
        raise ValidationError(
            _("Email is required.")
        )
    
    if '@' not in value:
        raise ValidationError(
            _("'%(value)s' is not a valid email address."),
            params={'value': value}
        )
    
    if User.objects.filter(email=value).exists():
        raise ValidationError(
            _("Email '%(value)s' is already tied to another account."),
            params={'value': value}
        )
    
    return value


def validate_role(value):
    """Validate that the role is one of the allowed choices."""
    ROLES = ['admin', 'editor', 'viewer']
    
    if not value:
        raise ValidationError(
            _("Role is required.")
        )
    
    if value not in ROLES:
        raise ValidationError(
            _("'%(value)s' is not a valid role. Must be one of: %(roles)s."),
            params={'value': value, 'roles': ', '.join(ROLES)}
        )
    
    return value


def validate_department(value):
    """Validate that the department is provided."""
    if not value:
        raise ValidationError(
            _("Department is required.")
        )
    
    return value


def validate_password(value):
    """Validate password strength requirements."""
    if not value:
        raise ValidationError(
            _("Password is required.")
        )
    
    if len(value) < 8:
        raise ValidationError(
            _("Password must be at least 8 characters long.")
        )
    
    if not any(char.isdigit() for char in value):
        raise ValidationError(
            _("Password must contain at least one digit.")
        )
    
    if not any(char.isupper() for char in value):
        raise ValidationError(
            _("Password must contain at least one uppercase letter.")
        )
    
    if not any(char.islower() for char in value):
        raise ValidationError(
            _("Password must contain at least one lowercase letter.")
        )
    
    return value


def validate_admin_department(role, department):
    """
    Validate the relationship between role and department.
    This is NOT a field validator—it's called from the model's clean() method.
    """
    if role == 'admin' and department != 'Management':
        raise ValidationError(
            _("Admin users must be in the Management department.")
        )
    
    if role != 'admin' and department == 'Management':
        raise ValidationError(
            _("Regular users cannot be in the Management department.")
        )