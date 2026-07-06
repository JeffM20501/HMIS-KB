from django.core.exceptions import ValidationError
from django.utils.translation import gettext_lazy as _


def validate_title(value):
    """PRD: Title is required."""
    if not value:
        raise ValidationError(_("Title is required."))
    
    if len(value) < 5:
        raise ValidationError(_("Title must be at least 5 characters long."))
    
    return value


def validate_content(value):
    """PRD: Content must be detailed."""
    if not value:
        raise ValidationError(_("Content is required."))
    
    if len(value) < 50:
        raise ValidationError(_("Content must be at least 50 characters long."))
    
    return value


def validate_slug(value):
    """PRD: Slug is required and unique."""
    if not value:
        raise ValidationError(_("Slug is required."))
    
    if not value.islower() or ' ' in value:
        raise ValidationError(_("Slug must be lowercase with no spaces."))
    
    return value


def validate_status(value):
    """PRD: Status must be valid."""
    valid_statuses = ['draft', 'pending_review', 'published', 'archived']
    
    if not value:
        raise ValidationError(_("Status is required."))
    
    if value not in valid_statuses:
        raise ValidationError(
            _("'%(value)s' is not a valid status. Must be one of: %(statuses)s."),
            params={'value': value, 'statuses': ', '.join(valid_statuses)}
        )
    
    return value


def validate_views(value):
    """PRD: Views must be a non-negative integer."""
    if not isinstance(value, int):
        raise ValidationError(_("Views must be a number."))
    
    if value < 0:
        raise ValidationError(_("Views cannot be negative."))
    
    return value


def validate_author_can_create(author):
    """PRD: FR-3.3 Only editors can create articles."""
    if not author:
        raise ValidationError(_("Author is required."))
    
    if author.role not in ['editor', 'admin']:
        raise ValidationError(_("Only editors and admins can create articles."))


def validate_publisher_can_publish(publisher):
    """PRD: FR-3.4 Only admins can publish articles."""
    if not publisher:
        raise ValidationError(_("Publisher is required for published articles."))
    
    if publisher.role != 'admin':
        raise ValidationError(_("Only admins can publish articles."))