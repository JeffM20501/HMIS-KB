from rest_framework import serializers
from articles.models.article_tag import ArticleTag
from articles.models.article import Article
from articles.models.tag import Tag


class ArticleTagSerializer(serializers.HyperlinkedModelSerializer):
    """PRD FR-1.5: Serializer for Article-Tag relationships."""
    
    article_title = serializers.ReadOnlyField(source='article.title')
    tag_name = serializers.ReadOnlyField(source='tag.name')
    added_by_username = serializers.ReadOnlyField(source='added_by.username')
    
    class Meta:
        model = ArticleTag
        fields = [
            'url', 'id', 'article', 'article_title',
            'tag', 'tag_name', 'added_by', 'added_by_username',
            'added_at'
        ]
        read_only_fields = ['added_at']
    
    def validate(self, data):
        """Validate the relationship."""
        article = data.get('article')
        tag = data.get('tag')
        
        if not article:
            raise serializers.ValidationError({"article": "Article is required."})
        
        if not tag:
            raise serializers.ValidationError({"tag": "Tag is required."})
        
        # Check if relationship already exists
        instance = getattr(self, 'instance', None)
        from articles.models.article_tag import ArticleTag
        queryset = ArticleTag.objects.filter(article=article, tag=tag)
        
        if instance:
            queryset = queryset.exclude(pk=instance.pk)
        
        if queryset.exists():
            raise serializers.ValidationError(
                f"Tag '{tag.name}' is already added to article '{article.title}'."
            )
        
        return data
    
    def create(self, validated_data):
        """Create ArticleTag with current user as added_by."""
        request = self.context.get('request')
        if request and request.user:
            validated_data['added_by'] = request.user
        
        return super().create(validated_data)


class BulkArticleTagSerializer(serializers.Serializer):
    """
    Serializer for bulk adding/removing tags to an article.
    """
    tag_ids = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True
    )
    
    def validate_tag_ids(self, value):
        """Validate that all tag IDs exist."""
        from articles.models.tag import Tag
        existing_tags = Tag.objects.filter(id__in=value)
        
        if len(existing_tags) != len(value):
            missing = set(value) - set(existing_tags.values_list('id', flat=True))
            raise serializers.ValidationError(
                f"Tags with IDs {missing} do not exist."
            )
        
        return value