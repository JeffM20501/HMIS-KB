from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from articles.models.category import Category
from users.test.helper import create_regular_user, create_admin


class CategoryAPITest(TestCase):
    """Test category API endpoints."""
    
    def setUp(self):
        self.client = APIClient()
        self.admin = create_admin()
        self.viewer = create_regular_user(role='viewer')
        self.category = Category.objects.create(
            name='Patient Management',
            slug='patient-management',
            description='Patient management guides'
        )
    
    def test_viewer_can_view_categories(self):
        """PRD: Anyone can view categories."""
        url = reverse('category-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        self.assertGreaterEqual(len(response.data['results']), 1)
    
    def test_viewer_cannot_create_category(self):
        """PRD: Only admins can create categories."""
        self.client.force_login(self.viewer)
        url = reverse('category-list')
        response = self.client.post(url, {
            'name': 'New Category',
            'slug': 'new-category'
        }, content_type='application/json')
        self.assertEqual(response.status_code, 403)
    
    def test_admin_can_create_category(self):
        """PRD: Admins can create categories."""
        token = self._get_token(self.admin)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        url = reverse('category-list')
        response = self.client.post(url, {
            'name': 'New Category',
            'slug': 'new-category'
        }, content_type='application/json')
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data['name'], 'New Category')
    
    def _get_token(self, user):
        """Get JWT token for user."""
        url = reverse('token_obtain_pair')
        response = self.client.post(url, {
            'username': user.username,
            'password': '12345'
        })
        return response.data['access']
    