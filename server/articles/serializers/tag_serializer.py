from rest_framework import serializers
from articles.models.tag import Tag
from articles.validators.tag_validator import validate_name, validate_slug


class TagSerializer(serializers.HyperlinkedModelSerializer):
    """
    PRD FR-1.5: Tags for articles.
    PRD FR-2.3: Filtering by tags.
    """
    
    article_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Tag
        fields = [
            'url', 'id', 'name', 'slug', 'description',
            'article_count', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']
    
    def get_article_count(self, obj):
        """Get the number of articles with this tag."""
        return obj.get_article_count()
    
    def validate_name(self, value):
        """Validate tag name."""
        return validate_name(value)
    
    def validate_slug(self, value):
        """Validate tag slug."""
        return validate_slug(value)
    
    def create(self, validated_data):
        """Create tag with auto-generated slug if missing."""
        if 'slug' not in validated_data or not validated_data['slug']:
            from django.utils.text import slugify
            validated_data['slug'] = slugify(validated_data['name'])
        
        return super().create(validated_data)
    
    def update(self, instance, validated_data):
        """Update tag with slug handling."""
        if 'name' in validated_data and 'slug' not in validated_data:
            from django.utils.text import slugify
            validated_data['slug'] = slugify(validated_data['name'])
        
        return super().update(instance, validated_data)


class TagListSerializer(serializers.HyperlinkedModelSerializer):
    """Simplified serializer for list views."""
    
    class Meta:
        model = Tag
        fields = ['url', 'id', 'name', 'slug']


class TagDetailSerializer(serializers.HyperlinkedModelSerializer):
    """Detailed serializer with article count."""
    
    article_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Tag
        fields = [
            'url', 'id', 'name', 'slug', 'description',
            'article_count', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']
    
    def get_article_count(self, obj):
        return obj.get_article_count()
    