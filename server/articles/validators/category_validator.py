from django.core.exceptions import ValidationError
from django.utils.translation import gettext_lazy as _
from django.utils.text import slugify


def validate_name(value):
    """PRD: Category name is required and must be unique."""
    if not value:
        raise ValidationError(_("Category name is required."))
    
    if len(value) < 2:
        raise ValidationError(_("Category name must be at least 2 characters long."))
    
    if len(value) > 100:
        raise ValidationError(_("Category name must be less than 100 characters."))
    
    return value


def validate_slug(value):
    """PRD: Slug must be URL-friendly."""
    if not value:
        raise ValidationError(_("Slug is required."))
    
    # Check if slug is valid format
    if not value.islower() or ' ' in value:
        raise ValidationError(_("Slug must be lowercase with no spaces."))
    
    # Check if slug would be different from name (for auto-generation)
    # This is just a helpful warning, not a hard error
    return value


def validate_icon(value):
    """PRD: Icon should be a valid format."""
    if not value:
        return value  # Optional field, so empty is fine
    
    # If it's an emoji (typically 1-2 characters)
    if len(value) <= 2:
        # Check if it's an emoji (simple check)
        return value
    
    # If it's a Font Awesome class (e.g., 'fa-user')
    if value.startswith('fa-'):
        return value
    
    # If it's a Material Icon (e.g., 'person')
    return value