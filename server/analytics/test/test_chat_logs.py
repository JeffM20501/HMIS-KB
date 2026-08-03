from django.test import TestCase
from django.urls import reverse
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from analytics.models.chat_logs import ChatLog
from analytics.models.feedback import Feedback
from articles.models.article import Article
from articles.models.category import Category
from users.test.helper import create_regular_user, create_admin

User = get_user_model()


class ChatLogTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = create_regular_user(role='viewer')
        self.admin = create_admin()

        self.category = Category.objects.create(name='Test', slug='test')
        self.article = Article.objects.create(
            title='Test Article',
            slug='test-article',
            content='This is test content for the article.',
            category=self.category,
            author=self.user,
            status='published'
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

    def test_anonymous_chat_creates_log_without_user(self):
        from unittest.mock import patch
        from chatbot.services.rag_pipeline import RAGResult
        with patch('chatbot.services.rag_pipeline.run_pipeline') as mock_run:
            mock_run.return_value = RAGResult(answer='Test answer', sources=[], latency_seconds=0.1)
            response = self.client.post('/api/v1/chat/', {'message': 'Hello'})
            self.assertEqual(response.status_code, 200)
            log = ChatLog.objects.first()
            self.assertIsNotNone(log)
            self.assertIsNone(log.user)
            self.assertIsNotNone(log.conversation_id)

    def test_chat_log_creation(self):
        self._login(self.user)
        log = ChatLog.objects.create(
            user=self.user,
            conversation=None,
            question='How do I reset my password?',
            answer='You can reset your password by going to Settings...',
            article_ref=self.article,
            response_time=1.5,
            confidence_score=0.9
        )
        self.assertEqual(log.user, self.user)
        self.assertIsNone(log.conversation)
        self.assertEqual(log.question, 'How do I reset my password?')
        self.assertEqual(log.article_ref, self.article)
        self.assertIsNotNone(log.created_at)

    def test_admin_can_view_chat_logs(self):
        self._login(self.user)
        ChatLog.objects.create(
            user=self.user,
            conversation=None,
            question='Test?',
            answer='Test answer'
        )
        self._login(self.admin)
        url = reverse('analytics:chat-log-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        self.assertGreaterEqual(response.data['count'], 1)

    def test_user_can_view_own_chat_logs(self):
        self._login(self.user)
        ChatLog.objects.create(
            user=self.user,
            conversation=None,
            question='Test?',
            answer='Test answer'
        )
        url = reverse('analytics:chat-log-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['count'], 1)

    def test_user_cannot_view_others_chat_logs(self):
        other_user = create_regular_user(role='viewer', username='other')
        ChatLog.objects.create(
            user=other_user,
            conversation=None,
            question='Other question?',
            answer='Other answer'
        )
        self._login(self.user)
        url = reverse('analytics:chat-log-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['count'], 0)

    def test_unanswered_endpoint(self):
        ChatLog.objects.create(
            user=self.user,
            conversation=None,
            question='Unanswered question?',
            answer='Some answer'
        )
        self._login(self.admin)
        url = reverse('analytics:chat-log-unanswered')
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        self.assertGreaterEqual(len(response.data), 1)

    def test_stats_endpoint(self):
        self._login(self.admin)
        ChatLog.objects.create(
            user=self.user,
            conversation=None,
            question='Q1?',
            answer='A1',
            was_helpful=True
        )
        ChatLog.objects.create(
            user=self.user,
            conversation=None,
            question='Q2?',
            answer='A2',
            was_helpful=False
        )
        url = reverse('analytics:chat-log-stats')
        response = self.client.get(url, {'range': '28d'})
        self.assertEqual(response.status_code, 200)
        # New response structure
        self.assertIn('weekly', response.data)
        self.assertIn('resolution_rate', response.data)
        self.assertIn('escalation_rate', response.data)
        self.assertIn('avg_turn_length', response.data)
        # Check that weekly contains at least one entry
        self.assertGreaterEqual(len(response.data['weekly']), 1)
        # Check that resolution rate is computed (we have 1 helpful, 1 not helpful -> 50%)
        self.assertEqual(response.data['resolution_rate'], 50)

    def test_conversation_endpoint(self):
        conv_uuid = 'multi-turn-conv'
        self._login(self.user)
        ChatLog.objects.create(
            user=self.user,
            conversation=None,
            conversation_uuid=conv_uuid,
            question='Q1?',
            answer='A1'
        )
        ChatLog.objects.create(
            user=self.user,
            conversation=None,
            conversation_uuid=conv_uuid,
            question='Q2?',
            answer='A2'
        )
        url = reverse('analytics:chat-log-conversation')
        response = self.client.get(url, {'conversation_uuid': conv_uuid})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 2)

    def test_chat_log_article_reference(self):
        self._login(self.user)
        log = ChatLog.objects.create(
            user=self.user,
            conversation=None,
            question='How to fix issue?',
            answer='Here is the solution...',
            article_ref=self.article
        )
        self.assertEqual(log.get_article_title(), 'Test Article')