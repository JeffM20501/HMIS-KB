from rest_framework import serializers
from articles.models import Article
from articles.validators.article_validator import *


class ArticleSerializer(serializers.HyperlinkedModelSerializer):
    author_username = serializers.ReadOnlyField(source='author.username')
    publisher_username = serializers.ReadOnlyField(source='published_by.username')
    
    class Meta:
        model = Article
        fields = [
            'url', 'id', 'title', 'slug', 'content', 'category',
            'author', 'author_username', 'published_by', 'publisher_username',
            'status', 'views', 'created_at', 'updated_at', 'published_at', 'tags'
        ]
        read_only_fields = ['views', 'created_at', 'updated_at', 'published_at']
    
    def validate_title(self, value):
        return validate_title(value)
    
    def validate_content(self, value):
        return validate_content(value)
    
    def validate_slug(self, value):
        return validate_slug(value)
    
    def validate_status(self, value):
        return validate_status(value)
    
    def validate(self, data):
        """PRD: Cross-field validation."""
        request = self.context.get('request')
        if request and request.user.role not in ['editor', 'admin']:
            raise serializers.ValidationError({
                'author': 'Only editors and admins can create articles.'
            })
        
        if data.get('status') == 'published':
            if not data.get('published_by'):
                raise serializers.ValidationError({
                    'published_by': 'Published articles must have a publisher.'
                })
        
        return data
    
    def create(self, validated_data):
        """Create article with current user as author."""
        request = self.context.get('request')
        if request and request.user:
            validated_data['author'] = request.user
        
        if 'status' not in validated_data:
            validated_data['status'] = 'draft'
        
        return super().create(validated_data)