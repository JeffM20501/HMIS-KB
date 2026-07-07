from django.urls import reverse
from users.test.helper import create_regular_user, create_admin
from utils.base_helper_auth import BaseAPITestCase
from unittest import skip


class UserPermissionTest(BaseAPITestCase):
    """Tests for user permissions (RBAC)."""

    def test_viewer_permissions(self):
        viewer = self._create_and_login_user(role='viewer')

        url_view = reverse('users:user-list')
        res = self.client.get(url_view, content_type='application/json')
        self.assertEqual(res.status_code, 403)

        url_detail = reverse('users:user-detail', kwargs={'pk': viewer.id})
        res = self.client.get(url_detail, content_type='application/json')
        self.assertEqual(res.status_code, 200)

        url_post = reverse('articles:article-list')
        res = self.client.post(
            url_post,
            {'title': 'Not auth', 'content': 'bad auth'},
            content_type='application/json'
        )
        self.assertEqual(res.status_code, 403)

    def test_editor_permissions(self):
        e = self._create_and_login_user(role='editor')

        # Editor CAN create a draft
        url_post = reverse('articles:article-list')
        res_post = self.client.post(
            url_post,
            {
                'title': 'test draft',
                'slug': 'test-draft-article',
                'content': 'This is a detailed content for the new draft article. It needs to be at least 50 characters long to pass validation.',
                'status': 'draft'
            },
            content_type='application/json'
        )
        self.assertEqual(res_post.status_code, 201)
        article_id = res_post.data.get('id')
        self.assertIsNotNone(article_id)

        # Editor CANNOT publish
        url_patch = reverse('articles:article-publish', kwargs={'pk': article_id})
        res_patch = self.client.post(
            url_patch,
            {'status': 'published'},
            content_type='application/json'
        )
        self.assertEqual(res_patch.status_code, 403)

    def test_admin_permissions(self):
        # 1. Create an editor user and log in as editor
        from users.test.helper import create_regular_user
        editor_user = create_regular_user(role='editor')
        self._login(editor_user)

        # 2. Create a draft article as editor
        url_create = reverse('articles:article-list')
        create_res = self.client.post(
            url_create,
            {
                'title': 'Test Article for Admin',
                'slug': 'test-article-admin',
                'content': 'This is a detailed content for the test article. It needs to be at least 50 characters long to pass validation.',
                'status': 'draft'
            },
            content_type='application/json'
        )
        self.assertEqual(create_res.status_code, 201)
        article_id = create_res.data.get('id')
        self.assertIsNotNone(article_id)

        # 3. Submit the article for review (as editor)
        url_submit = reverse('articles:article-submit-for-review', kwargs={'pk': article_id})
        submit_res = self.client.post(url_submit, content_type='application/json')
        self.assertEqual(submit_res.status_code, 200)  # Success

        # 4. Log in as admin
        admin = self._create_and_login_admin()

        # 5. Admin CAN publish the article
        url_publish = reverse('articles:article-publish', kwargs={'pk': article_id})
        res_patch = self.client.post(
            url_publish,
            {'status': 'published'},
            content_type='application/json'
        )
        self.assertEqual(res_patch.status_code, 200)

        # 6. Admin CAN view dashboard
        url = reverse('users:user-admin-dashboard')
        res_get = self.client.get(url, content_type='application/json')
        self.assertEqual(res_get.status_code, 200)

    def test_admin_can_list_all_users(self):
        admin = self._create_and_login_admin()
        create_regular_user(username='user1', email='user1@gmail.com')
        create_regular_user(username='user2', email='user2@gmail.com')

        url = reverse('users:user-list')
        response = self.client.get(url, content_type='application/json')
        self.assertEqual(response.status_code, 200)
        self.assertGreaterEqual(len(response.data.get('results', response.data)), 3)

    def test_viewer_cannot_list_all_users(self):
        viewer = self._create_and_login_user(role='viewer')

        url = reverse('users:user-list')
        response = self.client.get(url, content_type='application/json')
        self.assertEqual(response.status_code, 403)

    def test_admin_manage_users(self):
        admin = self._create_and_login_admin()
        v = create_regular_user(role='viewer')

        url = reverse('users:user-detail', kwargs={'pk': v.id})
        res_put = self.client.patch(
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

        url = reverse('users:user-detail', kwargs={'pk': u2.id})
        res = self.client.patch(
            url,
            {'department': 'hacked'},
            content_type='application/json'
        )
        self.assertEqual(res.status_code, 403)

    def test_user_cannot_change_own_role(self):
        viewer = self._create_and_login_user(role='viewer')

        url = reverse('users:user-detail', kwargs={'pk': viewer.id})
        response = self.client.patch(
            url,
            {'role': 'admin'},
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 403)

        viewer.refresh_from_db()
        self.assertEqual(viewer.role, 'viewer')

    def test_admin_can_change_any_user_role(self):
        admin = self._create_and_login_admin()
        viewer = create_regular_user(role='viewer')

        url = reverse('users:user-detail', kwargs={'pk': viewer.id})
        response = self.client.patch(
            url,
            {'role': 'editor'},
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 200)

        viewer.refresh_from_db()
        self.assertEqual(viewer.role, 'editor')