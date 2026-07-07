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
        
        # Create an article
        self.category = Category.objects.create(name='Test', slug='test')
        self.article = Article.objects.create(
            title='Test Article',
            slug='test-article',
            content='This is test content for the article. It is definitely more than 50 characters long.',
            category=self.category,
            author=self.user,
            status='published'
        )
        
        # Create a chat log
        self.chat_log = ChatLog.objects.create(
            user=self.user,
            conversation_id='test-conv',
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
    
    def test_create_article_feedback(self):
        self._login(self.user)
        url = reverse('analytics:feedback-list')
        response = self.client.post(url, {
            'content_type': 'article',
            'object_id': self.article.id,
            'rating': 5,
            'comment': 'Excellent article!'
        }, content_type='application/json')
        
        # if response.status_code != 201:
        #     print("CREATE ARTICLE FEEDBACK ERROR:", response.data)
        
        self.assertEqual(response.status_code, 201)
        self.assertEqual(Feedback.objects.count(), 1)
        feedback = Feedback.objects.first()
        self.assertEqual(feedback.rating, 5)
        self.assertEqual(feedback.comment, 'Excellent article!')

    def test_create_chat_feedback(self):
        self._login(self.user)
        url = reverse('analytics:feedback-list')
        response = self.client.post(url, {
            'content_type': 'chat',
            'object_id': self.chat_log.id,
            'helpful': True,
            'comment': 'Very helpful!'
        }, content_type='application/json')
        
        # if response.status_code != 201:
        #     print("CREATE CHAT FEEDBACK ERROR:", response.data)
        
        self.assertEqual(response.status_code, 201)
        self.assertEqual(Feedback.objects.count(), 1)
        feedback = Feedback.objects.first()
        self.assertTrue(feedback.helpful)

    def test_duplicate_feedback_prevented(self):
        self._login(self.user)
        url = reverse('analytics:feedback-list')
        
        # First feedback
        response = self.client.post(url, {
            'content_type': 'article',
            'object_id': self.article.id,
            'rating': 4
        }, content_type='application/json')
        
        if response.status_code != 201:
            print("FIRST FEEDBACK ERROR:", response.data)
        
        self.assertEqual(response.status_code, 201)
        
        # Second feedback (should fail)
        response = self.client.post(url, {
            'content_type': 'article',
            'object_id': self.article.id,
            'rating': 5
        }, content_type='application/json')
        
        # if response.status_code != 400:
        #     print("SECOND FEEDBACK ERROR:", response.data)
        
        self.assertEqual(response.status_code, 400)
        self.assertIn('already provided feedback', str(response.data))

    def test_unauthenticated_cannot_create_feedback(self):
        url = reverse('analytics:feedback-list')
        response = self.client.post(url, {
            'content_type': 'article',
            'object_id': self.article.id,
            'rating': 5
        }, content_type='application/json')
        self.assertEqual(response.status_code, 401)

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
        self._login(self.user)
        Feedback.objects.create(
            user=self.user,
            content_type='article',
            object_id=self.article.id,
            rating=5
        )
        url = reverse('analytics:feedback-stats')
        response = self.client.get(url, {
            'content_type': 'article',
            'object_id': self.article.id
        })
        self.assertEqual(response.status_code, 200)
        self.assertIn('average_rating', response.data)
        self.assertEqual(response.data['total_ratings'], 1)
        self.assertEqual(response.data['average_rating'], 5.0)