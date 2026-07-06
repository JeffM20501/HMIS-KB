from django.core.exceptions import ValidationError
from django.utils.translation import gettext_lazy as _
from django.utils.text import slugify


def validate_name(value):
    """PRD: Tag name is required and must be unique."""
    if not value:
        raise ValidationError(_("Tag name is required."))
    
    if len(value) < 2:
        raise ValidationError(_("Tag name must be at least 2 characters long."))
    
    if len(value) > 50:
        raise ValidationError(_("Tag name must be less than 50 characters."))
    
    # Check for invalid characters (optional)
    if not all(c.isalnum() or c in " -_" for c in value):
        raise ValidationError(_("Tag name can only contain letters, numbers, spaces, hyphens, and underscores."))
    
    return value


def validate_slug(value):
    """PRD: Slug must be URL-friendly."""
    if not value:
        raise ValidationError(_("Slug is required."))
    
    # Check if slug is valid format
    if not value.islower() or ' ' in value:
        raise ValidationError(_("Slug must be lowercase with no spaces."))
    
    # Check for invalid characters
    if not all(c.isalnum() or c == '-' for c in value):
        raise ValidationError(_("Slug can only contain lowercase letters, numbers, and hyphens."))
    
    return value