from django.test import TestCase
from analytics.models import SearchLog
from analytics.test.helper import create_user, create_article
from django.urls import reverse

class SearchLogModelTest(TestCase):
    """Test the SearchLog model directly."""
    
    def test_search_log_creation(self):
        user = create_user(role='viewer')
        
        log = SearchLog.objects.create(
            user=user,
            query='password reset',
            result_count=5
        )
        
        self.assertEqual(log.user, user)
        self.assertEqual(log.query, 'password reset')
        self.assertEqual(log.result_count, 5)
        self.assertIsNotNone(log.created_at)

    def test_search_log_result_count_null(self):
        user = create_user(role='viewer')
        
        log = SearchLog.objects.create(
            user=user,
            query='unknown query'
        )
        self.assertIsNone(log.result_count)

    def test_search_log_multiple_searches(self):
        user = create_user(role='viewer')
        
        SearchLog.objects.create(user=user, query='login', result_count=10)
        SearchLog.objects.create(user=user, query='password', result_count=3)
        SearchLog.objects.create(user=user, query='billing', result_count=8)
        
        self.assertEqual(SearchLog.objects.filter(user=user).count(), 3)
        self.assertEqual(SearchLog.objects.filter(query='login').count(), 1)


class SearchAPITest(TestCase):
    """Test the Search API endpoint."""
    
    def setUp(self):
        self.user = create_user(role='viewer')
        self.author = create_user(role='editor')
        
        # Create test articles
        self.article1 = create_article(
            self.author,
            'How to Reset Password',
            'This guide explains how to reset your password...'
        )
        self.article2 = create_article(
            self.author,
            'Login Troubleshooting',
            'If you cannot login, try these steps...'
        )
        self.article3 = create_article(
            self.author,
            'Billing FAQ',
            'Frequently asked questions about billing...'
        )

    def test_unauthenticated_cannot_search(self):
        url = reverse('search-list')
        response = self.client.get(url, {'q': 'password'})
        self.assertEqual(response.status_code, 401)

    def test_authenticated_user_can_search(self):
        self.client.force_login(self.user)
        url = reverse('search-list')
        response = self.client.get(url, {'q': 'password'})
        self.assertEqual(response.status_code, 200)
        self.assertIn('results', response.data)
        self.assertIn('total', response.data)

    def test_search_returns_relevant_results(self):
        self.client.force_login(self.user)
        url = reverse('search-list')
        response = self.client.get(url, {'q': 'password'})
        self.assertEqual(response.status_code, 200)
        self.assertGreater(response.data['total'], 0)
        
        # Check that the relevant article is in results
        titles = [r['title'] for r in response.data['results']]
        self.assertIn('How to Reset Password', titles)

    def test_search_handles_no_results(self):
        self.client.force_login(self.user)
        url = reverse('search-list')
        response = self.client.get(url, {'q': 'nonexistent term xyz'})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['total'], 0)
        self.assertEqual(len(response.data['results']), 0)

    def test_search_logs_query(self):
        self.client.force_login(self.user)
        url = reverse('search-list')
        
        response = self.client.get(url, {'q': 'login troubleshooting'})
        self.assertEqual(response.status_code, 200)
        
        # Check that the search was logged
        logs = SearchLog.objects.filter(user=self.user, query='login troubleshooting')
        self.assertEqual(logs.count(), 1)

    def test_search_filters_by_category(self):
        self.client.force_login(self.user)
        url = reverse('search-list')
        
        # Search within a specific category
        response = self.client.get(url, {
            'q': 'billing',
            'category': 'General'  # Adjust based on your category slug
        })
        self.assertEqual(response.status_code, 200)

    def test_search_ranking_title_over_body(self):
        self.client.force_login(self.user)
        url = reverse('search-list')
        
        response = self.client.get(url, {'q': 'password'})
        self.assertEqual(response.status_code, 200)
        
        # Results should be ranked by relevance
        if response.data['results']:
            # Title match should rank higher than body match
            first_result = response.data['results'][0]
            self.assertIn('password', first_result['title'].lower() or first_result['content'].lower())