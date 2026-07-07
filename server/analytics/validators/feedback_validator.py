from django.core.exceptions import ValidationError
from django.utils.translation import gettext_lazy as _


def validate_rating(value):
    """Validate that rating is between 1 and 5."""
    if value is None:
        return value
    
    if not isinstance(value, int):
        raise ValidationError(_("Rating must be an integer."))
    
    if value < 1 or value > 5:
        raise ValidationError(_("Rating must be between 1 and 5."))
    
    return value


def validate_comment(value):
    """Validate comment length."""
    if not value:
        return value
    
    if len(value) > 1000:
        raise ValidationError(_("Comment cannot exceed 1000 characters."))
    
    return value


def validate_content_type(value):
    """Validate content type."""
    valid_types = ['article', 'chat']
    if value not in valid_types:
        raise ValidationError(
            _("'%(value)s' is not a valid content type. Must be one of: %(types)s."),
            params={'value': value, 'types': ', '.join(valid_types)}
        )
    return value