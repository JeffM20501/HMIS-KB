from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from articles.models.article_tag import ArticleTag
from articles.models.article import Article
from articles.models.tag import Tag
from articles.serializers.article_tag_serializer import ArticleTagSerializer, BulkArticleTagSerializer
from articles.permissions.article_tag_permissions import CanManageArticleTags


class ArticleTagViewSet(viewsets.ModelViewSet):
    """
    API endpoint for managing Article-Tag relationships.
    
    PRD FR-1.5: Articles can be tagged
    """
    
    queryset = ArticleTag.objects.all().order_by('-added_at')
    serializer_class = ArticleTagSerializer
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            permission_classes = [permissions.IsAuthenticated]
        else:
            permission_classes = [CanManageArticleTags]
        return [permission() for permission in permission_classes]
    
    def perform_create(self, serializer):
        serializer.save(added_by=self.request.user)
    
    @action(detail=False, methods=['post'], url_path='bulk-add')  # ✅ url_path must match reverse
    def bulk_add_tags(self, request):
        """
        Bulk add tags to an article.
        URL: POST /api/v1/articles/article-tags/bulk-add/
        """
        article_id = request.data.get('article_id')
        tag_ids = request.data.get('tag_ids', [])
        
        if not article_id:
            return Response(
                {"error": "article_id is required."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            article = Article.objects.get(pk=article_id)
        except Article.DoesNotExist:
            return Response(
                {"error": "Article not found."},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Check permission - user must be author or admin
        if request.user.role != 'admin' and request.user != article.author:
            return Response(
                {"error": "You can only add tags to your own articles."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        added_tags = []
        errors = []
        
        for tag_id in tag_ids:
            try:
                tag = Tag.objects.get(pk=tag_id)
                article_tag, created = ArticleTag.objects.get_or_create(
                    article=article,
                    tag=tag,
                    defaults={'added_by': request.user}
                )
                if created:
                    added_tags.append(tag.name)
                else:
                    errors.append(f"Tag '{tag.name}' already exists on this article.")
            except Tag.DoesNotExist:
                errors.append(f"Tag with ID {tag_id} not found.")
        
        return Response({
            "message": f"Added {len(added_tags)} tags to article.",
            "added_tags": added_tags,
            "errors": errors
        }, status=status.HTTP_200_OK)
    
    @action(detail=False, methods=['post'], url_path='bulk-remove')
    def bulk_remove_tags(self, request):
        """
        Bulk remove tags from an article.
        URL: POST /api/v1/articles/article-tags/bulk-remove/
        """
        article_id = request.data.get('article_id')
        tag_ids = request.data.get('tag_ids', [])
        
        if not article_id:
            return Response(
                {"error": "article_id is required."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            article = Article.objects.get(pk=article_id)
        except Article.DoesNotExist:
            return Response(
                {"error": "Article not found."},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Check permission
        if request.user.role != 'admin' and request.user != article.author:
            return Response(
                {"error": "You can only remove tags from your own articles."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        removed = ArticleTag.objects.filter(
            article=article,
            tag__id__in=tag_ids
        )
        count = removed.count()
        removed.delete()
        
        return Response({
            "message": f"Removed {count} tags from article.",
            "removed_count": count
        }, status=status.HTTP_200_OK)