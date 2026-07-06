from rest_framework import serializers
from articles.models.tag import Tag
from articles.validators.tag_validator import validate_name, validate_slug


class TagSerializer(serializers.ModelSerializer):
    article_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Tag
        fields = ['id', 'name', 'slug', 'description', 'article_count', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']
    
    def get_article_count(self, obj):
        return obj.get_article_count()
    
    def validate_name(self, value):
        return validate_name(value)
    
    def validate_slug(self, value):
        return validate_slug(value)
    
    def create(self, validated_data):
        if 'slug' not in validated_data or not validated_data['slug']:
            from django.utils.text import slugify
            validated_data['slug'] = slugify(validated_data['name'])
        return super().create(validated_data)
    
    def update(self, instance, validated_data):
        if 'name' in validated_data and 'slug' not in validated_data:
            from django.utils.text import slugify
            validated_data['slug'] = slugify(validated_data['name'])
        return super().update(instance, validated_data)


class TagListSerializer(serializers.ModelSerializer):
    """Simplified serializer for list views."""
    
    class Meta:
        model = Tag
        fields = ['id', 'name', 'slug'] 


class TagDetailSerializer(serializers.ModelSerializer):
    """Detailed serializer with article count."""
    
    article_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Tag
        fields = [
            'id', 'name', 'slug', 'description', 
            'article_count', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']
    
    def get_article_count(self, obj):
        return obj.get_article_count()