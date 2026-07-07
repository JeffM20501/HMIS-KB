from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from articles.models.article_tag import ArticleTag
from articles.models.article import Article
from articles.models.tag import Tag
from articles.serializers.article_tag_serializer import (
    ArticleTagSerializer,
    BulkAddTagSerializer,
    BulkRemoveTagSerializer
)
from articles.permissions.article_tag_permissions import CanManageArticleTags


class ArticleTagViewSet(viewsets.ModelViewSet):
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
    
    @action(detail=False, methods=['post'], url_path='bulk-add', url_name='bulk-add')
    def bulk_add_tags(self, request):
        """
        Bulk add tags to an article.
        Expects: {'article_id': 1, 'tag_ids': [1, 2, 3]}
        """
        # Validate input
        serializer = BulkAddTagSerializer(
            data=request.data,
            context={'request': request}
        )
        
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        # Check permission
        article = Article.objects.get(pk=request.data['article_id'])
        if request.user.role != 'admin' and request.user != article.author:
            return Response(
                {"error": "You can only add tags to your own articles."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Save (creates the ArticleTag entries)
        result = serializer.save()
        
        return Response({
            "message": f"Added {len(result['created_tags'])} tags to article.",
            "added_tags": result['created_tags'],
            "errors": result['errors']
        }, status=status.HTTP_200_OK)
    
    @action(detail=False, methods=['post'], url_path='bulk-remove', url_name='bulk-remove')
    def bulk_remove_tags(self, request):
        """
        Bulk remove tags from an article.
        Expects: {'article_id': 1, 'tag_ids': [1, 2, 3]}
        """
        # Validate input
        serializer = BulkRemoveTagSerializer(data=request.data)
        
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        # Check permission
        article = Article.objects.get(pk=request.data['article_id'])
        if request.user.role != 'admin' and request.user != article.author:
            return Response(
                {"error": "You can only remove tags from your own articles."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Remove tags
        removed = ArticleTag.objects.filter(
            article=article,
            tag__id__in=request.data['tag_ids']
        )
        count = removed.count()
        removed.delete()
        
        return Response({
            "message": f"Removed {count} tags from article.",
            "removed_count": count
        }, status=status.HTTP_200_OK)