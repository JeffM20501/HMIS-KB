from django.urls import reverse
from django.test import TestCase
from articles.test.helper import *
from rest_framework.test import APIClient
from utils.base_helper_auth import BaseAPITestCase


class ArticleAPITest(BaseAPITestCase):
    """Test the Article API endpoints."""
    
    def setUp(self):
        # delete to start db on clean state to avoid collisions in multiple test runs (slug)
        Article.objects.all().delete()
        Category.objects.all().delete()
        Tag.objects.all().delete()
        
        self.client = APIClient()
        self.author = create_user(role='editor')
        self.admin = create_admin()
        self.viewer = create_user(role='viewer')
        self.category = create_category()
        self.article = create_article(self.author, self.category)

    def test_unauthenticated_cannot_access_articles(self):
        url = reverse('articles:article-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, 401)

    def test_viewer_can_list_articles(self):
        self._login(self.viewer)  
        url = reverse('articles:article-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)

    def test_viewer_can_view_article_detail(self):
        self._login(self.viewer)  
        url = reverse('articles:article-detail', kwargs={'slug': self.article.slug})
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)

    def test_viewer_cannot_create_article(self):
        self._login(self.viewer)  
        url = reverse('articles:article-list')
        response = self.client.post(url, {
            'title': 'New Article',
            'slug': unique_slug(),
            'content': 'This is a detailed content for the new article that is at least 50 characters long.',
            'category': self.category.id
        }, content_type='application/json')
        self.assertEqual(response.status_code, 403)

    def test_editor_can_create_draft(self):
        self._login(self.author)  
        slug = unique_slug()
        url = reverse('articles:article-list')
        response = self.client.post(url, {
            'title': 'My New Draft Article',
            'slug': slug,
            'content': 'This is detailed content for my new draft article. It needs to be at least 50 characters long to pass validation.',
            'category': self.category.id,
            'status': 'draft'
        }, content_type='application/json')
        self.assertEqual(response.status_code, 201)
        self.assertEqual(Article.objects.count(), 2)

    def test_editor_can_edit_own_draft(self):
        self._login(self.author)  
        url = reverse('articles:article-detail', kwargs={'slug': self.article.slug})
        response = self.client.patch(url, {
            'title': 'Updated Title',
            'content': 'This is updated content for the article. It is definitely more than 50 characters long now.'
        }, content_type='application/json')
        self.assertEqual(response.status_code, 200)
        self.article.refresh_from_db()
        self.assertEqual(self.article.title, 'Updated Title')

    def test_editor_cannot_edit_others_article(self):
        other_editor = create_user(role='editor')
        self._login(other_editor)  
        url = reverse('articles:article-detail', kwargs={'slug': self.article.slug})
        response = self.client.patch(url, {'title': 'Hacked Title'}, content_type='application/json')
        self.assertEqual(response.status_code, 403)

    def test_editor_cannot_publish_article(self):
        self._login(self.author)  
        url = reverse('articles:article-publish', kwargs={'slug': self.article.slug})
        response = self.client.post(url, {}, content_type='application/json')  
        self.assertEqual(response.status_code, 403)

    def test_admin_can_publish_article(self):
        # Submit for review first
        self._login(self.author)
        url_submit = reverse('articles:article-submit-for-review', kwargs={'slug': self.article.slug})
        response = self.client.post(url_submit, {}, content_type='application/json')
        self.assertEqual(response.status_code, 200)
        
        # Then publish as admin
        self._login(self.admin)
        url_publish = reverse('articles:article-publish', kwargs={'slug': self.article.slug})
        response = self.client.post(url_publish, {}, content_type='application/json')  
        self.assertEqual(response.status_code, 200)
        self.article.refresh_from_db()
        self.assertEqual(self.article.status, 'published')
        self.assertEqual(self.article.published_by, self.admin)
        self.assertIsNotNone(self.article.published_at)

    def test_admin_can_delete_article(self):
        self._login(self.admin)  
        url = reverse('articles:article-detail', kwargs={'slug': self.article.slug})
        response = self.client.delete(url)
        self.assertEqual(response.status_code, 204)
        self.assertEqual(Article.objects.count(), 0)