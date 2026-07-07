from django.db import models
from django.contrib.auth import get_user_model
from articles.validators.media_validator import validate_filename, validate_url, validate_media_type
from articles.models.article import Article

User = get_user_model()

class Media(models.Model):
    """
    PRD: File attachments for articles (images, videos, PDFs).
    Stored on Cloudinary.
    """
    
    MEDIA_TYPES = [
        ('image', 'Image'),
        ('video', 'Video'),
        ('pdf', 'PDF Document'),
        ('other', 'Other'),
    ]
    
    article = models.ForeignKey(
        Article,
        on_delete=models.CASCADE,
        related_name='media_files'
    )
    filename = models.CharField(
        max_length=255,
        validators=[validate_filename],
        help_text="Original filename"
    )
    url = models.URLField(
        max_length=500,
        validators=[validate_url],
        help_text="Cloudinary URL"
    )
    type = models.CharField(
        max_length=10,
        choices=MEDIA_TYPES,
        validators=[validate_media_type],
        help_text="Media type (image, video, pdf)"
    )
    uploaded_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='uploaded_media'
    )
    public_id = models.CharField(
        max_length=255,
        blank=True,
        help_text="Cloudinary public ID for deletion"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name_plural = 'Media'
        indexes = [
            models.Index(fields=['article', 'type']),
            models.Index(fields=['uploaded_by']),
        ]

    def __str__(self):
        return f"{self.filename} ({self.get_type_display()}) for Article #{self.article.id}"
    
    def delete_from_cloudinary(self):
        """Delete the file from Cloudinary."""
        if self.public_id:
            import cloudinary.uploader
            cloudinary.uploader.destroy(self.public_id, resource_type=self.type)