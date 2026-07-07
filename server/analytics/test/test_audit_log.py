from django.test import TestCase
from django.urls import reverse
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from analytics.models.audit_log import AuditLog
from users.test.helper import create_regular_user, create_admin
from utils.base_helper_auth import BaseAPITestCase

User = get_user_model()

class AuditLogTest(BaseAPITestCase):
    
    def setUp(self):
        self.client=APIClient()
        self.admin=create_admin()
        self.viewer=create_regular_user()

    def test_audit_log_creation(self):
        """Test that audit log entries can be created."""
        log = AuditLog.objects.create(
            user=self.admin,
            action='publish',
            content_type='Article',
            object_id=1,
            object_repr='Test Article',
            changes={'status': 'draft -> published'}
        )
        
        self.assertEqual(log.user, self.admin)
        self.assertEqual(log.action, 'publish')
        self.assertEqual(log.content_type, 'Article')
        self.assertIsNotNone(log.timestamp)
        
    def test_audit_log_log_action_helper(self):
        """Test the log_action helper method."""
        # Create a mock object
        class MockObject:
            __class__ = type('Article', (), {})
            pk = 1
            
            def __str__(self):
                return 'Test Article'
        
        mock_obj = MockObject()
        
        log = AuditLog.log_action(
            user=self.admin,
            action='create',
            obj=mock_obj,
            changes={'title': 'New Article'}
        )
        
        self.assertEqual(log.user, self.admin)
        self.assertEqual(log.action, 'create')
        self.assertEqual(log.content_type, 'Article')
        self.assertEqual(log.object_id, 1)
        self.assertEqual(log.object_repr, 'Test Article')
        
    def test_admin_can_view_audit_logs(self):
        """Test that admins can view audit logs."""
        # Create some logs
        AuditLog.log_action(self.admin, 'create', self.admin)
        
        token = self._get_token(self.admin)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        url = reverse('analytics:audit-log-list')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, 200)
        self.assertGreaterEqual(response.data['count'], 1)
        
    def test_viewer_cannot_view_audit_logs(self):
        """Test that viewers cannot view audit logs."""
        token = self._get_token(self.viewer)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        url = reverse('analytics:audit-log-list')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, 403)
        
    def test_audit_log_stats_endpoint(self):
        """Test the audit log stats endpoint."""
        AuditLog.log_action(self.admin, 'create', self.admin)
        AuditLog.log_action(self.admin, 'publish', self.admin)
        
        token = self._get_token(self.admin)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        url = reverse('analytics:audit-log-stats')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, 200)
        self.assertIn('total_logs', response.data)
        self.assertIn('by_action', response.data)
        self.assertIn('by_user', response.data)
        
    def test_audit_log_filtering(self):
        """Test filtering audit logs by user and action."""
        # Create logs
        AuditLog.log_action(self.admin, 'create', self.admin)
        AuditLog.log_action(self.admin, 'publish', self.admin)
        AuditLog.log_action(self.viewer, 'view', self.viewer)
        
        token = self._get_token(self.admin)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        # Filter by action
        url = reverse('analytics:audit-log-list')
        response = self.client.get(url, {'action': 'publish'})
        
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['count'], 1)
        self.assertEqual(response.data['results'][0]['action'], 'publish')
        
        # Filter by user
        response = self.client.get(url, {'user_id': self.viewer.id})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['count'], 1)
        self.assertEqual(response.data['results'][0]['username'], self.viewer.username)