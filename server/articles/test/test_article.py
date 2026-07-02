from articles.test.helper import *
from django.utils import timezone
from django.urls import reverse
from django.test import TestCase
from articles.models import Article

class ArticleModelTest(TestCase):
    """Test the Article model directly."""
    
    def test_article_creation(self):
        author = create_user(role='editor')
        category = create_category()
        article = create_article(author, category)
        
        self.assertEqual(article.title, 'Test Article')
        self.assertEqual(article.slug, 'test-article')
        self.assertEqual(article.author, author)
        self.assertEqual(article.category, category)
        self.assertEqual(article.status, 'draft')
        self.assertEqual(article.views, 0)
        self.assertIsNotNone(article.created_at)
        self.assertIsNotNone(article.updated_at)
        self.assertIsNone(article.published_at)
        self.assertIsNone(article.published_by)

    def test_article_str_method(self):
        author = create_user(role='editor')
        article = create_article(author)
        self.assertEqual(str(article), 'Test Article')

    def test_article_published_status(self):
        author = create_user(role='editor')
        admin = create_admin()
        article = create_article(author, status='draft')
        
        self.assertEqual(article.status, 'draft')
        self.assertIsNone(article.published_at)
        self.assertIsNone(article.published_by)
        
        
        article.status = 'published'
        article.published_by = admin
        article.published_at = timezone.now()
        article.save()
        
        self.assertEqual(article.status, 'published')
        self.assertEqual(article.published_by, admin)
        self.assertIsNotNone(article.published_at)

    def test_article_views_increment(self):
        author = create_user(role='editor')
        article = create_article(author)
        
        self.assertEqual(article.views, 0)
        
        
        article.views += 1
        article.save()
        self.assertEqual(article.views, 1)
        
        article.views += 1
        article.save()
        self.assertEqual(article.views, 2)


class ArticleAPITest(TestCase):
    """Test the Article API endpoints."""
    
    def setUp(self):
        self.author = create_user(role='editor')
        self.admin = create_admin()
        self.viewer = create_user(role='viewer')
        self.category = create_category()
        self.article = create_article(self.author, self.category)

    def test_unauthenticated_cannot_access_articles(self):
        url = reverse('article-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, 401)  

    def test_viewer_can_list_articles(self):
        self.client.force_login(self.viewer)
        url = reverse('article-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)

    def test_viewer_can_view_article_detail(self):
        self.client.force_login(self.viewer)
        url = reverse('article-detail', kwargs={'pk': self.article.id})
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)

    def test_viewer_cannot_create_article(self):
        self.client.force_login(self.viewer)
        url = reverse('article-list')
        response = self.client.post(url, {
            'title': 'New Article',
            'content': 'Content here',
            'category': self.category.id
        })
        self.assertEqual(response.status_code, 403)

    def test_editor_can_create_draft(self):
        self.client.force_login(self.author)
        url = reverse('article-list')
        response = self.client.post(url, {
            'title': 'My New Draft',
            'content': 'Draft content here',
            'category': self.category.id,
            'status': 'draft'
        })
        self.assertEqual(response.status_code, 201)
        self.assertEqual(Article.objects.count(), 2)

    def test_editor_can_edit_own_draft(self):
        self.client.force_login(self.author)
        url = reverse('article-detail', kwargs={'pk': self.article.id})
        response = self.client.patch(url, {
            'title': 'Updated Title',
            'content': 'Updated content'
        })
        self.assertEqual(response.status_code, 200)
        self.article.refresh_from_db()
        self.assertEqual(self.article.title, 'Updated Title')

    def test_editor_cannot_edit_others_article(self):
        other_editor = create_user(role='editor')
        self.client.force_login(other_editor)
        url = reverse('article-detail', kwargs={'pk': self.article.id})
        response = self.client.patch(url, {'title': 'Hacked Title'})
        self.assertEqual(response.status_code, 403)

    def test_editor_cannot_publish_article(self):
        self.client.force_login(self.author)
        url = reverse('article-publish', kwargs={'pk': self.article.id})
        response = self.client.patch(url, {'status': 'published'})
        self.assertEqual(response.status_code, 403)

    def test_admin_can_publish_article(self):
        self.client.force_login(self.admin)
        url = reverse('article-publish', kwargs={'pk': self.article.id})
        response = self.client.patch(url, {'status': 'published'})
        self.assertEqual(response.status_code, 200)
        self.article.refresh_from_db()
        self.assertEqual(self.article.status, 'published')
        self.assertEqual(self.article.published_by, self.admin)
        self.assertIsNotNone(self.article.published_at)

    def test_admin_can_delete_article(self):
        self.client.force_login(self.admin)
        url = reverse('article-detail', kwargs={'pk': self.article.id})
        response = self.client.delete(url)
        self.assertEqual(response.status_code, 204)
        self.assertEqual(Article.objects.count(), 0)