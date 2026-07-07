from django.core.exceptions import ValidationError
from django.utils.translation import gettext_lazy as _


def validate_question(value):
    """Validate that the question is provided and has reasonable length."""
    if not value:
        raise ValidationError(_("Question is required."))
    
    if len(value) < 2:
        raise ValidationError(_("Question must be at least 2 characters long."))
    
    if len(value) > 5000:
        raise ValidationError(_("Question cannot exceed 5000 characters."))
    
    return value


def validate_answer(value):
    """Validate that the answer is provided."""
    if not value:
        raise ValidationError(_("Answer is required."))
    
    if len(value) < 2:
        raise ValidationError(_("Answer must be at least 2 characters long."))
    
    if len(value) > 50000:
        raise ValidationError(_("Answer cannot exceed 50000 characters."))
    
    return value


def validate_conversation_id(value):
    """Validate that the conversation ID is provided and valid."""
    if not value:
        raise ValidationError(_("Conversation ID is required."))
    
    if len(value) > 100:
        raise ValidationError(_("Conversation ID cannot exceed 100 characters."))
    
    # Allow only alphanumeric, hyphens, and underscores
    if not all(c.isalnum() or c in '-_' for c in value):
        raise ValidationError(
            _("Conversation ID can only contain letters, numbers, hyphens, and underscores.")
        )
    
    return value