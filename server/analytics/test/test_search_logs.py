from django.urls import reverse
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from analytics.models.search_logs import SearchLog
from users.test.helper import create_regular_user, create_admin
from utils.base_helper_auth import BaseAPITestCase

User = get_user_model()


class SearchLogTest(BaseAPITestCase):
    """Test search log functionality."""
    
    def setUp(self):
        self.client = APIClient()
        self.user = create_regular_user(role='viewer')
        self.admin = create_admin()
    
    def test_search_log_creation(self):
        """Test creating a search log."""
        self._login(self.user)
        log = SearchLog.objects.create(
            user=self.user,
            query='password reset',
            result_count=5
        )
        
        self.assertEqual(log.user, self.user)
        self.assertEqual(log.query, 'password reset')
        self.assertEqual(log.result_count, 5)
        self.assertIsNotNone(log.created_at)
    
    def test_user_can_view_own_logs(self):
        """Test that users can view their own search logs."""
        self._login(self.user)
        SearchLog.objects.create(user=self.user, query='test1', result_count=3)
        SearchLog.objects.create(user=self.user, query='test2', result_count=1)
        
        url = reverse('analytics:search-log-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['count'], 2)
    
    def test_admin_can_view_all_logs(self):
        """Test that admins can view all search logs."""
        # Create logs for user
        SearchLog.objects.create(user=self.user, query='user query')
        SearchLog.objects.create(user=self.admin, query='admin query')
        
        self._login(self.admin)
        url = reverse('analytics:search-log-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['count'], 2)
    
    def test_user_cannot_view_others_logs(self):
        """Test that users cannot view others' logs."""
        other_user = create_regular_user(role='viewer', username='other')
        SearchLog.objects.create(user=other_user, query='other query')
        
        self._login(self.user)
        url = reverse('analytics:search-log-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['count'], 0)
    
    def test_search_log_stats_endpoint(self):
        """Test the search stats endpoint (admin only)."""
        self._login(self.admin)
        
        SearchLog.objects.create(user=self.user, query='apple', result_count=5)
        SearchLog.objects.create(user=self.user, query='banana', result_count=0)
        SearchLog.objects.create(user=self.user, query='apple', result_count=3)
        
        url = reverse('analytics:search-log-stats')
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['total_searches'], 3)
        self.assertEqual(response.data['unique_queries'], 2)
        self.assertEqual(response.data['no_results_searches'], 1)
        self.assertIn('popular_queries', response.data)
    
    def test_viewer_cannot_access_stats(self):
        """Test that non-admin users cannot access stats endpoint."""
        self._login(self.user)
        url = reverse('analytics:search-log-stats')
        response = self.client.get(url)
        self.assertEqual(response.status_code, 403)
    
    def test_my_searches_endpoint(self):
        """Test the my_searches endpoint."""
        self._login(self.user)
        SearchLog.objects.create(user=self.user, query='query1')
        SearchLog.objects.create(user=self.user, query='query2')
        
        url = reverse('analytics:search-log-my-searches')
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 2)
    
    def test_filtering_by_query(self):
        """Test filtering search logs by query text."""
        self._login(self.admin)
        SearchLog.objects.create(user=self.user, query='password reset')
        SearchLog.objects.create(user=self.user, query='login help')
        SearchLog.objects.create(user=self.user, query='password change')
        
        url = reverse('analytics:search-log-list')
        response = self.client.get(url, {'query': 'password'})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['count'], 2)