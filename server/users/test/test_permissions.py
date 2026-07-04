from django.urls import reverse
from users.test.helper import create_regular_user, create_admin
from users.test.base_helper_auth import BaseAPITestCase
from unittest import skip


class UserPermissionTest(BaseAPITestCase):
    """Tests for user permissions (RBAC)."""

    def test_viewer_permissions(self):
        viewer = self._create_and_login_user(role='viewer')

        # Viewer CAN view user list (should be denied - 403)
        url_view = reverse('user-list')
        res = self.client.get(url_view, content_type='application/json')
        self.assertEqual(res.status_code, 403)

        # Viewer CAN view their own detail
        url_detail = reverse('user-detail', kwargs={'pk': viewer.id})
        res = self.client.get(url_detail, content_type='application/json')
        self.assertEqual(res.status_code, 200)

        # Viewer CANNOT create an article (will pass when articles is implemented)
        url_post = reverse('article-list')
        res = self.client.post(
            url_post,
            {'title': 'Not auth', 'content': 'bad auth'},
            content_type='application/json'
        )
        self.assertEqual(res.status_code, 403)

    @skip("Articles app not implemented yet")
    def test_editor_permissions(self):
        e = self._create_and_login_user(role='editor')

        # Editor CAN create a draft
        url_post = reverse('article-list')
        res_post = self.client.post(
            url_post,
            {
                'title': 'test draft',
                'content': 'test content',
                'status': 'draft'
            },
            content_type='application/json'
        )
        self.assertEqual(res_post.status_code, 201)

        # Editor CANNOT publish
        url_patch = reverse('article-publish', kwargs={'pk': 1})
        res_patch = self.client.patch(
            url_patch,
            {'status': 'published'},
            content_type='application/json'
        )
        self.assertEqual(res_patch.status_code, 403)

    @skip("Articles app not implemented yet")
    def test_admin_permissions(self):
        admin = self._create_and_login_admin()

        # Admin CAN publish
        url_patch = reverse('article-publish', kwargs={'pk': 1})
        res_patch = self.client.patch(
            url_patch,
            {'status': 'published'},
            content_type='application/json'
        )
        self.assertEqual(res_patch.status_code, 200)

        # Admin CAN view dashboard
        url = reverse('users:admin_dashboard')
        res_get = self.client.get(url, content_type='application/json')
        self.assertEqual(res_get.status_code, 200)

    def test_admin_can_list_all_users(self):
        admin = self._create_and_login_admin()
        create_regular_user(username='user1', email='user1@gmail.com')
        create_regular_user(username='user2', email='user2@gmail.com')

        url = reverse('user-list')
        response = self.client.get(url, content_type='application/json')
        self.assertEqual(response.status_code, 200)
        self.assertGreaterEqual(len(response.data.get('results', response.data)), 3)

    def test_viewer_cannot_list_all_users(self):
        viewer = self._create_and_login_user(role='viewer')

        url = reverse('user-list')
        response = self.client.get(url, content_type='application/json')
        self.assertEqual(response.status_code, 403)

    def test_admin_manage_users(self):
        admin = self._create_and_login_admin()
        v = create_regular_user(role='viewer')

        url = reverse('user-detail', kwargs={'pk': v.id})
        res_put = self.client.put(
            url,
            {'role': 'editor'},
            content_type='application/json'
        )
        self.assertEqual(res_put.status_code, 200)

        v.refresh_from_db()
        self.assertEqual(v.role, 'editor')

    def test_user_cannot_update_other_profiles(self):
        u1 = create_regular_user(username='u1', email='u1@gmail.com')
        u2 = create_regular_user(username='u2', email='u2@gmail.com')
        self._login(u1)

        url = reverse('user-detail', kwargs={'pk': u2.id})
        res = self.client.patch(
            url,
            {'department': 'hacked'},
            content_type='application/json'
        )
        self.assertEqual(res.status_code, 403)

    def test_user_cannot_change_own_role(self):
        """Test that a user cannot change their own role."""
        viewer = self._create_and_login_user(role='viewer')

        url = reverse('user-detail', kwargs={'pk': viewer.id})
        response = self.client.patch(
            url,
            {'role': 'admin'},
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 403)

        viewer.refresh_from_db()
        self.assertEqual(viewer.role, 'viewer')

    def test_admin_can_change_any_user_role(self):
        """Test that an admin can change any user's role."""
        admin = self._create_and_login_admin()
        viewer = create_regular_user(role='viewer')

        url = reverse('user-detail', kwargs={'pk': viewer.id})
        response = self.client.patch(
            url,
            {'role': 'editor'},
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 200)

        viewer.refresh_from_db()
        self.assertEqual(viewer.role, 'editor')