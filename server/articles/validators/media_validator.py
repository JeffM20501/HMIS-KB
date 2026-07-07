from django.core.exceptions import ValidationError
from django.utils.translation import gettext_lazy as _
import os
import magic

# Define allowed extensions - ONLY these are accepted
ALLOWED_EXTENSIONS = {
    #image
    '.jpg', '.jpeg', '.png', '.gif', 
    '.webp', '.bmp', '.svg', '.ico',
    #videos
    '.mp4', '.webm', '.mov',
    #docs
    '.pdf',
}

ALLOWED_MIME_TYPES = {
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'image/svg+xml', 'image/bmp',
    'video/mp4', 'video/webm', 'video/quicktime',
    'application/pdf',
}

MAX_FILE_SIZE = 50 * 1024 * 1024 


def validate_filename(value):
    """Validate filename."""
    if not value:
        raise ValidationError(_("Filename is required."))
    
    if len(value) > 255:
        raise ValidationError(_("Filename cannot exceed 255 characters."))
    
    # Check for invalid characters - prevent path traversal attacks
    invalid_chars = ['/', '\\', ':', '*', '?', '"', '<', '>', '|']
    for char in invalid_chars:
        if char in value:
            raise ValidationError(
                _("Filename contains invalid character: '%(char)s'"),
                params={'char': char}
            )
    
    # Check for allowed extension
    ext = os.path.splitext(value)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise ValidationError(
            _("File type '%(ext)s' is not allowed. Allowed types: %(allowed)s"),
            params={
                'ext': ext,
                'allowed': ', '.join(sorted(ALLOWED_EXTENSIONS))
            }
        )
    
    return value


def validate_url(value):
    """Validate URL."""
    if not value:
        raise ValidationError(_("URL is required."))
    
    if not value.startswith('http://') and not value.startswith('https://'):
        raise ValidationError(_("URL must start with http:// or https://"))
    
    return value


def validate_media_type(value):
    """Validate media type."""
    valid_types = ['image', 'video', 'pdf']
    
    if not value:
        raise ValidationError(_("Media type is required."))
    
    if value not in valid_types:
        raise ValidationError(
            _("'%(value)s' is not a valid media type. Must be one of: %(types)s."),
            params={'value': value, 'types': ', '.join(valid_types)}
        )
    
    return value


def validate_file_size(value):
    """Validate file size."""
    if value.size > MAX_FILE_SIZE:
        raise ValidationError(
            _("File size exceeds %(max_size)sMB limit."),
            params={'max_size': MAX_FILE_SIZE // (1024 * 1024)}
        )
    
    return value


def get_media_type_from_filename(filename):
    """Determine media type from file extension."""
    ext = os.path.splitext(filename)[1].lower()
    
    image_exts = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg', '.ico']
    video_exts = ['.mp4', '.webm', '.mov']
    pdf_exts = ['.pdf']
    
    if ext in image_exts:
        return 'image'
    elif ext in video_exts:
        return 'video'
    elif ext in pdf_exts:
        return 'pdf'
    else:
        return 'other'

def validate_file_mime_type(file_obj):
    file_bytes = file_obj.read(2048)
    file_obj.seek(0)
    mime = magic.from_buffer(file_bytes, mime=True)
    if mime not in ALLOWED_MIME_TYPES:
        raise ValidationError(f"File content type '{mime}' is not allowed.")
    
    return file_obj