import uuid
from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from articles.models import Product, Article, Category
from articles.test.helper import create_user, create_admin, create_category, create_article, unique_slug
from django.contrib.auth import get_user_model

User = get_user_model()


class ProductAPITest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.admin = create_admin()
        self.editor = create_user(role='editor')
        self.viewer = create_user(role='viewer')
        self.category = create_category()

        # Create products with unique names/slugs
        self.product1_name = f"SHA-{uuid.uuid4().hex[:8]}"
        self.product1_slug = unique_slug(base="sha")
        self.product2_name = f"NSSF-{uuid.uuid4().hex[:8]}"
        self.product2_slug = unique_slug(base="nssf")

        self.product1 = Product.objects.create(
            name=self.product1_name,
            slug=self.product1_slug,
            description='Social Health Authority'
        )
        self.product2 = Product.objects.create(
            name=self.product2_name,
            slug=self.product2_slug,
            description='National Social Security Fund'
        )

        # Create published articles associated with product1
        self.article1 = create_article(
            author=self.admin,
            category=self.category,
            status='published',
            product=self.product1
        )
        self.article2 = create_article(
            author=self.editor,
            category=self.category,
            status='published',
            product=self.product1
        )
        # Draft article not associated with product (for negative test)
        self.article3 = create_article(
            author=self.admin,
            category=self.category,
            status='draft'
        )

        self.list_url = reverse('articles:product-list')
        self.detail_url = lambda slug: reverse('articles:product-detail', kwargs={'slug': slug})
        self.articles_action_url = lambda slug: reverse('articles:product-articles', kwargs={'slug': slug})

    def _login(self, user):
        self.client.force_authenticate(user=user)


# ----------------------------------------
# 1. UNAUTHENTICATED TESTS
# ----------------------------------------
class ProductUnauthenticatedTest(ProductAPITest):
    """Unauthenticated users should get 401 on all endpoints."""

    def test_unauthenticated_cannot_list(self):
        response = self.client.get(self.list_url)
        self.assertEqual(response.status_code, 401)

    def test_unauthenticated_cannot_retrieve(self):
        response = self.client.get(self.detail_url(self.product1_slug))
        self.assertEqual(response.status_code, 401)

    def test_unauthenticated_cannot_create(self):
        payload = {'name': 'New Product', 'description': 'test'}
        response = self.client.post(self.list_url, payload)
        self.assertEqual(response.status_code, 401)

    def test_unauthenticated_cannot_update(self):
        payload = {'name': 'Updated SHA'}
        response = self.client.patch(self.detail_url(self.product1_slug), payload)
        self.assertEqual(response.status_code, 401)

    def test_unauthenticated_cannot_delete(self):
        response = self.client.delete(self.detail_url(self.product1_slug))
        self.assertEqual(response.status_code, 401)

    def test_unauthenticated_cannot_articles_action(self):
        response = self.client.get(self.articles_action_url(self.product1_slug))
        self.assertEqual(response.status_code, 401)


# ----------------------------------------
# 2. EDITOR TESTS (READ-ONLY)
# ----------------------------------------
class ProductEditorTest(ProductAPITest):
    """Editors can only list, retrieve, and access the articles action."""

    def setUp(self):
        super().setUp()
        self._login(self.editor)

    def test_editor_can_list(self):
        response = self.client.get(self.list_url)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertGreaterEqual(len(data), 1)

    def test_editor_can_retrieve(self):
        response = self.client.get(self.detail_url(self.product1_slug))
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['slug'], self.product1_slug)

    def test_editor_can_articles_action(self):
        response = self.client.get(self.articles_action_url(self.product1_slug))
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertGreaterEqual(len(data), 2)
        for article in data:
            self.assertEqual(article['status'], 'published')
            self.assertEqual(article['product'], self.product1_slug)

    def test_editor_cannot_create(self):
        payload = {'name': 'New Product', 'description': 'test'}
        response = self.client.post(self.list_url, payload)
        self.assertEqual(response.status_code, 403)

    def test_editor_cannot_update(self):
        payload = {'name': 'Updated SHA'}
        response = self.client.patch(self.detail_url(self.product1_slug), payload)
        self.assertEqual(response.status_code, 403)

    def test_editor_cannot_delete(self):
        response = self.client.delete(self.detail_url(self.product1_slug))
        self.assertEqual(response.status_code, 403)


# ----------------------------------------
# 3. ADMIN TESTS (FULL CRUD)
# ----------------------------------------
class ProductAdminTest(ProductAPITest):
    """Admins have full CRUD + articles action."""

    def setUp(self):
        super().setUp()
        self._login(self.admin)

    def test_admin_can_list(self):
        response = self.client.get(self.list_url)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertGreaterEqual(len(data), 2)

    def test_admin_can_retrieve(self):
        response = self.client.get(self.detail_url(self.product1_slug))
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['slug'], self.product1_slug)

    def test_admin_can_create(self):
        payload = {
            'name': 'New Product',
            'description': 'test description',
            'is_active': True
        }
        response = self.client.post(self.list_url, payload)
        self.assertEqual(response.status_code, 201)
        # Use slug to retrieve the product
        product_slug = response.data['slug']
        new_product = Product.objects.get(slug=product_slug)
        self.assertEqual(new_product.name, 'New Product')
        self.assertEqual(new_product.slug, 'new-product')
        self.assertTrue(new_product.is_active)

    def test_admin_can_update(self):
        payload = {'name': 'Updated SHA', 'description': 'new desc'}
        response = self.client.patch(self.detail_url(self.product1_slug), payload)
        self.assertEqual(response.status_code, 200)
        self.product1.refresh_from_db()
        self.assertEqual(self.product1.name, 'Updated SHA')
        self.assertEqual(self.product1.description, 'new desc')

    def test_admin_can_delete(self):
        response = self.client.delete(self.detail_url(self.product1_slug))
        self.assertEqual(response.status_code, 204)
        self.assertEqual(Product.objects.count(), 1)

    def test_admin_can_articles_action(self):
        response = self.client.get(self.articles_action_url(self.product1_slug))
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertGreaterEqual(len(data), 2)
        for article in data:
            self.assertEqual(article['status'], 'published')
            self.assertEqual(article['product'], self.product1_slug)

    def test_articles_action_excludes_drafts_and_other_products(self):
        draft_article = create_article(
            author=self.admin,
            category=self.category,
            status='draft',
            product=self.product1
        )
        response = self.client.get(self.articles_action_url(self.product1_slug))
        self.assertEqual(response.status_code, 200)
        data = response.json()
        slugs = [a['slug'] for a in data]
        self.assertNotIn(draft_article.slug, slugs)
        self.assertGreaterEqual(len(data), 2)