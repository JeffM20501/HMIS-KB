from django.test import TestCase
from django.urls import reverse
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from analytics.models.feedback import Feedback
from analytics.models.chat_logs import ChatLog
from articles.models.article import Article
from articles.models.category import Category
from users.test.helper import create_regular_user, create_admin

User = get_user_model()


class FeedbackTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = create_regular_user(role='viewer')
        self.admin = create_admin()

        self.category = Category.objects.create(name='Test', slug='test')
        self.article = Article.objects.create(
            title='Test Article',
            slug='test-article',
            content='This is test content for the article...',
            category=self.category,
            author=self.user,
            status='published'
        )
        
        self.chat_log = ChatLog.objects.create(
            user=self.user,
            conversation=None,
            # conversation_id='test-conv',
            question='How do I reset password?',
            answer='Go to settings...'
        )

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

    # ---------- ANONYMOUS FEEDBACK ----------
    def test_anonymous_can_create_feedback(self):
        url = reverse('analytics:feedback-list')
        response = self.client.post(url, {
            'content_type': 'article',
            'object_id': self.article.id,
            'rating': 5,
            'comment': 'Great article!'
        }, content_type='application/json')
        self.assertEqual(response.status_code, 201)
        feedback = Feedback.objects.first()
        self.assertIsNone(feedback.user)
        self.assertEqual(feedback.rating, 5)

    def test_anonymous_can_create_chat_feedback(self):
        url = reverse('analytics:feedback-list')
        response = self.client.post(url, {
            'content_type': 'chat',
            'object_id': self.chat_log.id,
            'helpful': True,
            'comment': 'Very helpful!'
        }, content_type='application/json')
        self.assertEqual(response.status_code, 201)
        feedback = Feedback.objects.first()
        self.assertTrue(feedback.helpful)
        self.assertIsNone(feedback.user)

    # ---------- AUTHENTICATED FEEDBACK ----------
    def test_create_article_feedback(self):
        self._login(self.user)
        url = reverse('analytics:feedback-list')
        response = self.client.post(url, {
            'content_type': 'article',
            'object_id': self.article.id,
            'rating': 5,
            'comment': 'Excellent article!'
        }, content_type='application/json')
        self.assertEqual(response.status_code, 201)
        feedback = Feedback.objects.first()
        self.assertEqual(feedback.rating, 5)
        self.assertEqual(feedback.comment, 'Excellent article!')
        self.assertEqual(feedback.user, self.user)

    def test_create_chat_feedback(self):
        self._login(self.user)
        url = reverse('analytics:feedback-list')
        response = self.client.post(url, {
            'content_type': 'chat',
            'object_id': self.chat_log.id,
            'helpful': True,
            'comment': 'Very helpful!'
        }, content_type='application/json')
        self.assertEqual(response.status_code, 201)
        feedback = Feedback.objects.first()
        self.assertTrue(feedback.helpful)
        self.assertEqual(feedback.user, self.user)

    def test_duplicate_feedback_prevented(self):
        self._login(self.user)
        url = reverse('analytics:feedback-list')

        # First feedback
        response = self.client.post(url, {
            'content_type': 'article',
            'object_id': self.article.id,
            'rating': 4
        }, content_type='application/json')
        self.assertEqual(response.status_code, 201)

        # Second feedback (should fail)
        response = self.client.post(url, {
            'content_type': 'article',
            'object_id': self.article.id,
            'rating': 5
        }, content_type='application/json')
        self.assertEqual(response.status_code, 400)
        self.assertIn('already provided feedback', str(response.data))

    def test_user_can_view_own_feedback(self):
        self._login(self.user)
        Feedback.objects.create(
            user=self.user,
            content_type='article',
            object_id=self.article.id,
            rating=5,
            comment='Great!'
        )
        url = reverse('analytics:feedback-my-feedback')
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['count'], 1)
        self.assertEqual(response.data['results'][0]['rating'], 5)

    def test_admin_can_view_all_feedback(self):
        Feedback.objects.create(
            user=self.user,
            content_type='article',
            object_id=self.article.id,
            rating=5
        )
        self._login(self.admin)
        url = reverse('analytics:feedback-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['count'], 1)

    def test_feedback_stats_endpoint(self):
        # Create an editor and an article
        editor = create_regular_user(role='editor', username='editor_test')
        article2 = Article.objects.create(
            title='Editor Article',
            slug='editor-article',
            content='This is an editor article.',
            category=self.category,
            author=editor,
            status='published'
        )

        self._login(self.admin)
        url = reverse('analytics:feedback-stats')
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        self.assertIn('most_active_editors', response.data)
        editors = response.data['most_active_editors']
        # At least one editor should be present (the editor we created)
        self.assertGreaterEqual(len(editors), 1)
        # Check that the first editor matches the editor's name and has article_count >= 1
        self.assertEqual(editors[0]['name'], editor.full_name or editor.username)
        self.assertGreaterEqual(editors[0]['article_count'], 1)