from django.test import TestCase
from django.contrib.auth import get_user_model
from django.urls import reverse
from users.test.helper import create_regular_user, create_admin

User = get_user_model()


class TestCaseUser(TestCase):
    """Core user model tests (not permission-specific)."""

    def test_user_creation(self):
        u = create_regular_user()
        self.assertEqual(u.username, 'usertest')
        self.assertTrue(u.check_password('12345'))
        self.assertEqual(u.role, 'viewer')
        self.assertEqual(u.department, 'IT')
        self.assertEqual(u.email, 'test@gmail.com')
        self.assertIsNotNone(u.date_joined)
        self.assertIsNotNone(u.updated_at)

    def test_user_non_exist(self):
        u_non_exist = User.objects.filter(username='non_exist').first()
        self.assertIsNone(u_non_exist)

    def test_soft_delete_user(self):
        user = create_regular_user()
        user.is_active = False
        user.save()

        active_users = User.objects.filter(is_active=True)
        self.assertNotIn(user, active_users)
        self.assertIsNotNone(User.objects.get(id=user.id))

    def test_user_auth(self):
        u = create_regular_user()
        self.client.force_login(u)
        
        url = reverse('user-list')
        res_get = self.client.get(url, content_type='application/json')
        self.assertEqual(res_get.status_code, 200)

    def test_unauthenticated_access_denied(self):
        url = reverse('user-list')
        res = self.client.get(url, content_type='application/json')
        self.assertIn(res.status_code, [401, 403])

    def test_user_update_own_profile(self):
        u = create_regular_user()
        self.client.force_login(u)

        url = reverse('user-detail', kwargs={'pk': u.id})
        res = self.client.patch(
            url,
            {'department': 'HR', 'email': 'new@gmail.com'},
            content_type='application/json'
        )
        self.assertEqual(res.status_code, 200)
        u.refresh_from_db()
        self.assertEqual(u.department, 'HR')
        self.assertEqual(u.email, 'new@gmail.com')

    def test_session_expires_after_inactivity(self):
        user = create_regular_user()
        self.client.force_login(user)

        session = self.client.session
        session.set_expiry(0)
        session.save()

        url = reverse('user-list')
        response = self.client.get(url, content_type='application/json')
        self.assertIn(response.status_code, [401, 403])

    def test_admin_actions_logged(self):
        # Placeholder for audit log test
        pass

    def test_user_detail_returns_correct_fields(self):
        user = create_regular_user()
        self.client.force_login(user)

        url = reverse('user-detail', kwargs={'pk': user.id})
        response = self.client.get(url, content_type='application/json')
        self.assertEqual(response.status_code, 200)

        expected_fields = ['url', 'username', 'email', 'role', 'department', 'date_joined']
        for field in expected_fields:
            self.assertIn(field, response.data)

    def test_user_list_returns_paginated_results(self):
        admin = create_admin()
        for i in range(15):
            create_regular_user(
                username=f'user{i}',
                email=f'user{i}@test.com'
            )

        self.client.force_login(admin)
        url = reverse('user-list')
        response = self.client.get(
            url,
            {'page': 1, 'limit': 10},
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 200)
        self.assertIn('count', response.data)
        self.assertIn('next', response.data)
        self.assertIn('previous', response.data)
        self.assertIn('results', response.data)