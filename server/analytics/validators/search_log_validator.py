from django.core.exceptions import ValidationError
from django.utils.translation import gettext_lazy as _


def validate_query(value):
    """Validate that the search query is provided and has reasonable length."""
    if not value:
        raise ValidationError(_("Search query is required."))
    
    if len(value) < 1:
        raise ValidationError(_("Search query must be at least 1 character long."))
    
    if len(value) > 500:
        raise ValidationError(_("Search query cannot exceed 500 characters."))
    
    return value