from django.test import TestCase
from django.urls import reverse
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework.test import APIClient
from articles.models.article import Article
from articles.models.category import Category
from articles.models.media import Media
from users.test.helper import create_regular_user, create_admin
from articles.validators.media_validator import validate_file_mime_type
from django.core.exceptions import ValidationError
from PIL import Image
import io
from unittest.mock import patch


class MediaTest(TestCase):
    """Test media functionality."""
    
    def setUp(self):
        self.client = APIClient()
        self.editor = create_regular_user(role='editor')
        self.admin = create_admin()
        self.viewer = create_regular_user(role='viewer')
        
        self.category = Category.objects.create(
            name='Test Category',
            slug='test-category'
        )
        
        self.article = Article.objects.create(
            title='Test Article',
            slug='test-article',
            content='This is test content for the article.',
            category=self.category,
            author=self.editor,
            status='published'
        )
        
        # Create test image
        image = Image.new('RGB', (1, 1), color='red')
        image_bytes = io.BytesIO()
        image.save(image_bytes, format='JPEG')
        image_bytes.seek(0)
        self.image_bytes = image_bytes.getvalue()
    
    def _get_token(self, user):
        url = reverse('token_obtain_pair')
        response = self.client.post(url, {
            'username': user.username,
            'password': '12345'
        })
        return response.data['access']
    
    def _login(self, user):
        token = self._get_token(user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
    
    @patch('articles.serializers.media_serializer.upload_to_cloudinary')
    def test_upload_file(self, mock_upload):
        """Test uploading a file - mocked Cloudinary."""
        # Mock Cloudinary response
        mock_upload.return_value = {
            'url': 'https://example.com/test.jpg',
            'public_id': 'articles/test_public_id',
            'type': 'image',
            'filename': 'test.jpg'
        }
        
        self._login(self.editor)
        
        image_file = SimpleUploadedFile(
            "test.jpg",
            self.image_bytes,
            content_type="image/jpeg"
        )
        
        url = reverse('articles:media-upload')
        response = self.client.post(url, {
            'file': image_file,
            'article_id': self.article.id
        }, format='multipart')
        
        self.assertEqual(response.status_code, 201)
        self.assertEqual(Media.objects.count(), 1)
        self.assertEqual(response.data['filename'], 'test.jpg')
        mock_upload.assert_called_once()
    
    def test_viewer_cannot_upload(self):
        """Test that viewers cannot upload files."""
        self._login(self.viewer)
        
        image_file = SimpleUploadedFile(
            "test.jpg",
            self.image_bytes,
            content_type="image/jpeg"
        )
        
        url = reverse('articles:media-upload')
        response = self.client.post(url, {
            'file': image_file,
            'article_id': self.article.id
        }, format='multipart')
        
        self.assertEqual(response.status_code, 403)
    
    def test_list_media(self):
        """Test listing media for an article."""
        self._login(self.viewer)
        
        Media.objects.create(
            article=self.article,
            filename='test.jpg',
            url='https://example.com/test.jpg',
            type='image',
            uploaded_by=self.editor,
            public_id='test_public_id'
        )
        
        url = reverse('articles:media-list')
        response = self.client.get(url, {'article_id': self.article.id})
        
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['count'], 1)
        self.assertEqual(response.data['results'][0]['filename'], 'test.jpg')
    
    def test_delete_media(self):
        """Test deleting media."""
        self._login(self.editor)
        
        media = Media.objects.create(
            article=self.article,
            filename='test.jpg',
            url='https://example.com/test.jpg',
            type='image',
            uploaded_by=self.editor,
            public_id='test_public_id'
        )
        
        url = reverse('articles:media-delete-file', kwargs={'pk': media.id})
        response = self.client.delete(url)
        
        self.assertEqual(response.status_code, 204)
        self.assertEqual(Media.objects.count(), 0)
    
    def test_admin_can_delete_any_media(self):
        """Test that admins can delete any media."""
        self._login(self.admin)
        
        media = Media.objects.create(
            article=self.article,
            filename='test.jpg',
            url='https://example.com/test.jpg',
            type='image',
            uploaded_by=self.editor,
            public_id='test_public_id'
        )
        
        url = reverse('articles:media-delete-file', kwargs={'pk': media.id})
        response = self.client.delete(url)
        
        self.assertEqual(response.status_code, 204)
        self.assertEqual(Media.objects.count(), 0)
    
    # ─── VALIDATOR TESTS (These don't need Cloudinary) ───
    
    def test_validate_file_with_zip(self):
        """Test that zip files are rejected."""
        zip_file = SimpleUploadedFile(
            "malicious.zip",
            b"PK\x03\x04",
            content_type="application/zip"
        )
        
        with self.assertRaises(ValidationError) as context:
            validate_file_mime_type(zip_file)
        
        self.assertIn("not allowed", str(context.exception))

    def test_validate_file_with_fake_extension(self):
        """Test that fake extensions are caught by magic bytes."""
        fake_jpg = SimpleUploadedFile(
            "image.jpg",
            b"PK\x03\x04",
            content_type="image/jpeg"
        )
        
        with self.assertRaises(ValidationError) as context:
            validate_file_mime_type(fake_jpg)
        
        self.assertIn("content type", str(context.exception))

    @patch('articles.validators.media_validator.magic.from_buffer')
    def test_validate_file_valid_jpg(self, mock_magic):
        """Test that a valid JPG file passes validation."""
        # Mock magic to return a valid image mime type
        mock_magic.return_value = 'image/jpeg'
        
        image_file = SimpleUploadedFile(
            "test.jpg",
            self.image_bytes,
            content_type="image/jpeg"
        )
        
        # Should not raise an error
        result = validate_file_mime_type(image_file)
        self.assertEqual(result, image_file)
        mock_magic.assert_called_once()