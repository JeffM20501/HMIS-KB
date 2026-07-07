from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from articles.models.media import Media
from articles.serializers.media_serializer import MediaSerializer, MediaUploadSerializer
from articles.permissions.media_permissions import CanUploadMedia, CanViewMedia
from utils.cloudinary_utils import delete_from_cloudinary


class MediaViewSet(viewsets.ModelViewSet):
    """
    API endpoint for media management.
    
    PRD: Media attachments for articles (images, videos, PDFs).
    """
    
    queryset = Media.objects.all()
    serializer_class = MediaSerializer
    permission_classes = [permissions.IsAuthenticated, CanViewMedia]
    
    def get_permissions(self):
        if self.action == 'upload':
            permission_classes = [permissions.IsAuthenticated, CanUploadMedia]
        elif self.action in ['create', 'update', 'partial_update']:
            permission_classes = [permissions.IsAuthenticated, CanUploadMedia]
        elif self.action == 'destroy':
            permission_classes = [permissions.IsAuthenticated, CanUploadMedia]
        elif self.action in ['list', 'retrieve']:
            permission_classes = [permissions.IsAuthenticated, CanViewMedia]
        else:
            permission_classes = [permissions.IsAuthenticated]
        return [permission() for permission in permission_classes]
    
    def get_queryset(self):
        """Filter queryset based on user role and query parameters."""
        queryset = super().get_queryset()
        user = self.request.user
        
        # If not admin, only show media from published articles
        if user.role != 'admin':
            queryset = queryset.filter(article__status='published')
        
        # Filter by article
        article_id = self.request.query_params.get('article_id')
        if article_id:
            queryset = queryset.filter(article_id=article_id)
        
        # Filter by type
        media_type = self.request.query_params.get('type')
        if media_type:
            queryset = queryset.filter(type=media_type)
        
        return queryset
    
    @action(detail=False, methods=['post'])
    def upload(self, request):
        """
        Upload a file to Cloudinary and associate with an article.
        """
        serializer = MediaUploadSerializer(
            data=request.data,
            context={'request': request}
        )
        
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        # Create media
        media = serializer.save()
        
        # Return the created media
        response_serializer = MediaSerializer(media, context={'request': request})
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['delete'])
    def delete_file(self, request, pk=None):
        """
        Delete a media file from Cloudinary and the database.
        """
        media = self.get_object()
        
        # Check permission
        if request.user.role != 'admin' and media.article.author != request.user:
            return Response(
                {"error": "You don't have permission to delete this file."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Delete from Cloudinary
        if media.public_id:
            delete_from_cloudinary(media.public_id, media.type)
        
        # Delete from database
        media.delete()
        
        return Response(
            {"message": "File deleted successfully."},
            status=status.HTTP_204_NO_CONTENT
        )
    
    @action(detail=False, methods=['get'])
    def article_media(self, request):
        """
        Get all media for a specific article.
        """
        article_id = request.query_params.get('article_id')
        
        if not article_id:
            return Response(
                {"error": "article_id is required."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        media = Media.objects.filter(article_id=article_id)
        serializer = self.get_serializer(media, many=True)
        return Response(serializer.data)