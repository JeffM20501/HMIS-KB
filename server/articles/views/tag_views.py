from articles.models.tag import Tag
from articles.serializers.tag_serializer import TagSerializer, TagListSerializer, TagDetailSerializer
from articles.permissions.tag_permissions import CanManageTags
from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action

class TagViewSet(viewsets.ModelViewSet):
    
    queryset = Tag.objects.all().order_by('name')
    serializer_class = TagSerializer
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            # Anyone can view tags
            permission_classes = [permissions.AllowAny]
        else:
            # Only admins can modify tags
            permission_classes = [CanManageTags]
        
        return [permission() for permission in permission_classes]
    
    def get_serializer_class(self):
        """Use appropriate serializer for different actions."""
        if self.action == 'list':
            return TagListSerializer
        elif self.action == 'retrieve':
            return TagDetailSerializer
        return TagSerializer
    
    @action(detail=True, methods=['get'])
    def articles(self, request, pk=None):
        tag = self.get_object()
        articles = tag.articles.filter(status='published')  # Only published articles
        from articles.serializers.article_serializers import ArticleSerializer
        serializer = ArticleSerializer(articles, many=True, context={'request': request})
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def popular(self, request):
        from django.db.models import Count
        popular_tags = Tag.objects.annotate(
            article_count=Count('articles')
        ).filter(
            article_count__gt=0
        ).order_by('-article_count')[:10]
        
        serializer = TagSerializer(popular_tags, many=True, context={'request': request})
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def search(self, request):
        query = request.query_params.get('q', '')
        if not query:
            return Response({"error": "Search query parameter 'q' is required."}, status=400)
        
        tags = Tag.objects.filter(name__icontains=query).order_by('name')[:20]
        serializer = TagListSerializer(tags, many=True, context={'request': request})
        return Response(serializer.data)