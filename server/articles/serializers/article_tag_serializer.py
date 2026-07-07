from rest_framework import serializers
from articles.models.article_tag import ArticleTag
from articles.models.article import Article
from articles.models.tag import Tag


class ArticleTagSerializer(serializers.ModelSerializer):
    article_title = serializers.ReadOnlyField(source='article.title')
    tag_name = serializers.ReadOnlyField(source='tag.name')
    added_by_username = serializers.ReadOnlyField(source='added_by.username')
    
    class Meta:
        model = ArticleTag
        fields = [
            'id', 'article', 'article_title', 'tag', 'tag_name',
            'added_by', 'added_by_username', 'added_at'
        ]
        read_only_fields = ['added_at', 'added_by', 'added_by_username']
    
    def validate(self, data):
        article = data.get('article')
        tag = data.get('tag')
        
        if not article or not tag:
            raise serializers.ValidationError("Article and Tag are required.")
        
        # Check for duplicate
        instance = getattr(self, 'instance', None)
        queryset = ArticleTag.objects.filter(article=article, tag=tag)
        if instance:
            queryset = queryset.exclude(pk=instance.pk)
        if queryset.exists():
            raise serializers.ValidationError(
                f"Tag '{tag.name}' is already added to article '{article.title}'."
            )
        
        return data
    
    def create(self, validated_data):
        request = self.context.get('request')
        if request and request.user:
            validated_data['added_by'] = request.user
        return super().create(validated_data)

class BulkAddTagSerializer(serializers.Serializer):
    """
    Serializer for bulk adding/removing tags to an article.
    """
    article_id = serializers.IntegerField()
    tag_ids = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True
    )
    
    def validate_article_id(self, value):
        """Validate that the article exists."""
        if not Article.objects.filter(pk=value).exists():
            raise serializers.ValidationError(f"Article with ID {value} does not exist.")
        return value
        
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
    
    def save(self, **kwargs):
        """
        Create ArticleTag entries for each tag.
        """
        article_id = self.validated_data['article_id']
        tag_ids = self.validated_data['tag_ids']
        request = self.context.get('request')
        
        article = Article.objects.get(pk=article_id)
        added_by = request.user if request else None
        
        created_tags = []
        errors = []
        
        for tag_id in tag_ids:
            tag = Tag.objects.get(pk=tag_id)
            article_tag, created = ArticleTag.objects.get_or_create(
                article=article,
                tag=tag,
                defaults={'added_by': added_by}
            )
            if created:
                created_tags.append(tag.name)
            else:
                errors.append(f"Tag '{tag.name}' already exists on this article.")
        
        return {
            'article': article,
            'created_tags': created_tags,
            'errors': errors
        }
        
        
class BulkRemoveTagSerializer(serializers.Serializer):
    """
    Serializer for bulk removing tags from an article.
    """
    article_id = serializers.IntegerField()
    tag_ids = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True
    )
    
    def validate_article_id(self, value):
        if not Article.objects.filter(pk=value).exists():
            raise serializers.ValidationError(f"Article with ID {value} does not exist.")
        return value
    
    def validate_tag_ids(self, value):
        existing_tags = Tag.objects.filter(id__in=value)
        if len(existing_tags) != len(value):
            missing = set(value) - set(existing_tags.values_list('id', flat=True))
            raise serializers.ValidationError(f"Tags with IDs {missing} do not exist.")
        return value