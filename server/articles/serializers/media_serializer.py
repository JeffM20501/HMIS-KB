from rest_framework import serializers
from articles.models.media import Media
from articles.validators.media_validator import validate_filename, validate_url, validate_media_type,ALLOWED_EXTENSIONS,validate_file_size,validate_file_mime_type
from articles.models.article import Article
from utils.cloudinary_utils import upload_to_cloudinary
import os

class MediaSerializer(serializers.ModelSerializer):
    """PRD: Serializer for media files."""
    
    uploaded_by_username = serializers.ReadOnlyField(source='uploaded_by.username')
    article_title = serializers.ReadOnlyField(source='article.title')
    
    class Meta:
        model = Media
        fields = [
            'id', 'article', 'article_title', 'filename',
            'url', 'type', 'uploaded_by', 'uploaded_by_username',
            'public_id', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at', 'public_id']
    
    def validate_filename(self, value):
        return validate_filename(value)
    
    def validate_url(self, value):
        return validate_url(value)
    
    def validate_type(self, value):
        return validate_media_type(value)
    
    def create(self, validated_data):
        """Set uploaded_by from request."""
        request = self.context.get('request')
        if request and request.user:
            validated_data['uploaded_by'] = request.user
        return super().create(validated_data)


class MediaUploadSerializer(serializers.Serializer):
    """
    Serializer for media upload with strict validation.
    """
    file = serializers.FileField()
    article_id = serializers.IntegerField()
    
    def validate_article_id(self, value):
        from articles.models.article import Article
        if not Article.objects.filter(pk=value).exists():
            raise serializers.ValidationError("Article not found.")
        return value
    
    def validate_file(self, value):
        """Validate file type and size."""
        
        validate_filename(value.name)
        
        # 2. Check allowed extension (redundant but explicit)
        ext = os.path.splitext(value.name)[1].lower()
        if ext not in ALLOWED_EXTENSIONS:
            raise serializers.ValidationError(
                f"File type '{ext}' is not allowed. "
                f"Allowed: {', '.join(sorted(ALLOWED_EXTENSIONS))}"
            )
        
        # 3. Validate file size
        validate_file_size(value)
        
        # 4. Validate magic bytes (content type)
        validate_file_mime_type(value) 
        
        return value
    
    def create(self, validated_data):
        """
        Upload file to Cloudinary and create Media record.
        """
        file_obj = validated_data['file']
        article_id = validated_data['article_id']
        request = self.context.get('request')
        
        # Upload to Cloudinary
        upload_result = upload_to_cloudinary(file_obj)
        
        # Create Media record
        media = Media.objects.create(
            article_id=article_id,
            filename=upload_result['filename'],
            url=upload_result['url'],
            type=upload_result['type'],
            uploaded_by=request.user if request else None,
            public_id=upload_result['public_id']
        )
        
        return media
