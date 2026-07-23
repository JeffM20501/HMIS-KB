# articles/test/test_category_api.py
from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from articles.models import Category
from users.test.helper import create_regular_user, create_admin
from articles.test.helper import unique_slug

class CategoryAPITest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.admin = create_admin()
        self.viewer = create_regular_user(role='viewer')
        # Delete any existing categories
        Category.objects.all().delete()
        # Create a category with a unique slug
        slug = unique_slug(base='patient-management')
        self.category = Category.objects.create(
            name='Patient Management',
            slug=slug,
            description='Patient management guides'
        )

    def test_viewer_can_view_categories(self):
        url = reverse('articles:category-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        self.assertGreaterEqual(len(response.data['results']), 1)

    def test_viewer_cannot_create_category(self):
        self.client.force_login(self.viewer)
        url = reverse('articles:category-list')
        slug = unique_slug(base='new-category')
        response = self.client.post(url, {
            'name': 'New Category',
            'slug': slug
        }, content_type='application/json')
        self.assertEqual(response.status_code, 403)

    def test_admin_can_create_category(self):
        token = self._get_token(self.admin)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        url = reverse('articles:category-list')
        slug = unique_slug(base='new-category')
        response = self.client.post(url, {
            'name': 'New Category',
            'slug': slug
        }, content_type='application/json')
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data['name'], 'New Category')
        self.assertEqual(response.data['slug'], slug)

    def _get_token(self, user):
        url = reverse('token_obtain_pair')
        response = self.client.post(url, {
            'username': user.username,
            'password': '12345'
        })
        return response.data['access']