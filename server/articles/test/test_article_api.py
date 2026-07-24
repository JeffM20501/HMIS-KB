from django.urls import reverse
from django.test import TestCase
from articles.test.helper import *
from rest_framework.test import APIClient
from utils.base_helper_auth import BaseAPITestCase
from analytics.models import SearchLog
from articles.models import Article


class ArticleAPITest(BaseAPITestCase):
    """Test the Article API endpoints with public access."""

    def setUp(self):
        Article.objects.all().delete()
        Category.objects.all().delete()
        Tag.objects.all().delete()

        self.client = APIClient()
        self.author = create_user(role='editor')
        self.admin = create_admin()
        self.viewer = create_user(role='viewer')
        self.category = create_category()
        self.article = create_article(self.author, self.category, status='published')

    # ---------- PUBLIC ACCESS TESTS ----------
    def test_unauthenticated_can_list_published_articles(self):
        """Anonymous users can list published articles."""
        url = reverse('articles:article-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        # Only published articles appear
        self.assertEqual(len(response.data['results']), 1)  # our published article

    def test_unauthenticated_can_retrieve_published_article(self):
        """Anonymous users can view a published article."""
        url = reverse('articles:article-detail', kwargs={'slug': self.article.slug})
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)

    def test_unauthenticated_cannot_retrieve_draft(self):
        """Anonymous users cannot view draft articles."""
        draft = create_article(self.author, self.category, status='draft')
        url = reverse('articles:article-detail', kwargs={'slug': draft.slug})
        response = self.client.get(url)
        self.assertEqual(response.status_code, 403)  # PermissionDenied

    def test_unauthenticated_search_logged_with_user_null(self):
        """Anonymous search creates SearchLog with user=None."""
        url = reverse('articles:article-list')
        response = self.client.get(url, {'search': 'test'})
        self.assertEqual(response.status_code, 200)
        log = SearchLog.objects.filter(query='test').first()
        self.assertIsNotNone(log)
        self.assertIsNone(log.user)

    # ---------- AUTHENTICATED USER TESTS ----------
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

    def test_authenticated_search_logs_user(self):
        self._login(self.viewer)
        url = reverse('articles:article-list')
        response = self.client.get(url, {'search': 'authenticated'})
        self.assertEqual(response.status_code, 200)
        log = SearchLog.objects.filter(query='authenticated').first()
        self.assertIsNotNone(log)
        self.assertEqual(log.user, self.viewer)

    def test_duplicate_search_not_logged(self):
        self._login(self.viewer)
        url = reverse('articles:article-list')
        # First search
        self.client.get(url, {'search': 'unique'})
        # Second search within 2 seconds (same session)
        self.client.get(url, {'search': 'unique'})
        logs = SearchLog.objects.filter(query='unique')
        self.assertEqual(logs.count(), 1)  # only one log