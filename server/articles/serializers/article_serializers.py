from rest_framework import serializers
from articles.models import Article,Category,Tag
from django.contrib.auth import get_user_model


class ArticleSerializer(serializers.ModelSerializer):
    author_username = serializers.ReadOnlyField(source='author.username')
    publisher_username = serializers.ReadOnlyField(source='published_by.username')
    
    class Meta:
        model = Article
        fields = [
            'id', 'title', 'slug', 'content', 'category',
            'author', 'author_username', 'published_by', 'publisher_username',
            'status', 'views', 'created_at', 'updated_at', 'published_at', 'tags',
            'article_type'
        ]
        read_only_fields = [
            'views', 'created_at', 'updated_at', 'published_at',
            'author', 'published_by'
        ]
    
    def validate(self, data):
        """Cross-field validation."""
        request = self.context.get('request')
        
        # Only editors/admins can create articles
        if request and request.user.role not in ['editor', 'admin']:
            raise serializers.ValidationError({
                'author': 'Only editors and admins can create articles.'
            })
        
        # If status is published, validate publisher
        if data.get('status') == 'published':
            if not data.get('published_by'):
                raise serializers.ValidationError({
                    'published_by': 'Published articles must have a publisher.'
                })
        
        return data
    
    def create(self, validated_data):
        """Create article with current user as author and default status draft."""
        request = self.context.get('request')
        if request and request.user:
            validated_data['author'] = request.user
        
        if 'status' not in validated_data:
            validated_data['status'] = 'draft'
        
        if 'article_type' not in validated_data or not validated_data['article_type']:
            validated_data['article_type']='article'
            
        
        return super().create(validated_data)
    
    def validate_article_type(self, value):
        normalized = value.replace('-', '_')
        allowed = ['how_to', 'sop', 'faq', 'troubleshooting', 'feature_ref', 'release_notes', 'article']
        
        if normalized not in allowed:
            raise serializers.ValidationError(f"Invalid article type. Allowed: {', '.join(allowed)}")
        
        return normalized 
    
