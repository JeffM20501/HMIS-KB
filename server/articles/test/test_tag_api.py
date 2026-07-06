from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from articles.models.tag import Tag
from users.test.helper import create_regular_user, create_admin


class TagAPITest(TestCase):
    """Test tag API endpoints."""
    
    def setUp(self):
        self.client = APIClient()
        self.admin = create_admin()
        self.viewer = create_regular_user(role='viewer')
        self.tag = Tag.objects.create(
            name='Emergency',
            slug='emergency',
            description='Emergency-related content'
        )
    
    def _get_token(self, user):
        """Get JWT token for user."""
        url = reverse('token_obtain_pair')
        response = self.client.post(url, {
            'username': user.username,
            'password': '12345'
        })
        return response.data['access']
    
    def test_viewer_can_view_tags(self):
        """PRD: Anyone can view tags."""
        url = reverse('articles:tag-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        self.assertGreaterEqual(len(response.data['results']), 1)
    
    def test_viewer_can_view_tag_detail(self):
        """PRD: Anyone can view a single tag."""
        url = reverse('articles:tag-detail', kwargs={'pk': self.tag.id})
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['name'], 'Emergency')
    
    def test_viewer_cannot_create_tag(self):
        """PRD: Only admins can create tags."""
        self.client.force_login(self.viewer)
        url = reverse('articles:tag-list')
        response = self.client.post(url, {
            'name': 'New Tag',
            'slug': 'new-tag'
        }, content_type='application/json')
        self.assertEqual(response.status_code, 403)
    
    def test_admin_can_create_tag(self):
        """PRD: Admins can create tags."""
        token = self._get_token(self.admin)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        url = reverse('articles:tag-list')
        response = self.client.post(url, {
            'name': 'New Tag',
            'slug': 'new-tag'
        }, content_type='application/json')
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data['name'], 'New Tag')
        self.assertEqual(response.data['slug'], 'new-tag')
    
    def test_admin_can_update_tag(self):
        """PRD: Admins can update tags."""
        token = self._get_token(self.admin)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        url = reverse('articles:tag-detail', kwargs={'pk': self.tag.id})
        response = self.client.patch(url, {
            'name': 'Updated Tag'
        }, content_type='application/json')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['name'], 'Updated Tag')
        self.assertEqual(response.data['slug'], 'updated-tag')  # Auto-generated
    
    def test_admin_can_delete_tag(self):
        """PRD: Admins can delete tags."""
        token = self._get_token(self.admin)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        url = reverse('articles:tag-detail', kwargs={'pk': self.tag.id})
        response = self.client.delete(url)
        self.assertEqual(response.status_code, 204)
        self.assertEqual(Tag.objects.count(), 0)
    
    def test_popular_tags_endpoint(self):
        """Test popular tags endpoint."""
        url = reverse('articles:tag-popular')
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
    
    def test_search_tags_endpoint(self):
        """Test search tags endpoint."""
        url = reverse('articles:tag-search')
        response = self.client.get(url, {'q': 'emerg'})
        self.assertEqual(response.status_code, 200)
        self.assertGreaterEqual(len(response.data), 1)