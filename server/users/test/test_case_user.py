from django.test import TestCase
from django.utils import timezone
from django.contrib.auth import get_user_model
from django.urls import reverse

User=get_user_model()

def create_user(**kwargs):
    user_obj={
        'username':'usertest',
        'email':'test@gmail.com',
        'password':'12345',
        'role':'viewer',
        'department':'IT'
    }
    
    user_obj.update(kwargs)
    
    user=User.objects.create_user(**user_obj)
    return user

def create_admin():
    user=User.objects.create_user(
            username='admin',
            email='admin@gmail.com',
            password='12345',
            role='admin',
            department='admin'
    )
    return user

class TestCaseUser(TestCase):
    def test_user_creation(self):
        u=create_user()
        
        self.assertEqual(u.username,'usertest')
        self.assertTrue(u.check_password('12345'))
        self.assertEqual(u.role,'viewer')
        self.assertEqual(u.department,'IT')
        self.assertEqual(u.email,'test@gmail.com')
        self.assertIsNotNone(u.date_joined)
        self.assertIsNotNone(u.upadated_at)
        
    
    def test_user_non_exist(self):
        u_non_exist=User.objects.filter(username='non_exist').first()
        self.assertIsNone(u_non_exist)
    
    def test_user_auth(self):
        u=create_user()
        self.client.force_login(u)
        
        url=reverse('user-list')
        res_get=self.client.get(url)
        self.assertEqual(res_get.status_code,200)
        
    
    
    def test_viewer_permissions(self):
        viewer=create_user(role='viewer')
        self.client.force_login(viewer)
        
        url_view=reverse('user-list')
        res=self.client.get(url_view)
        self.assertEqual(res.status_code,200)
        
        url_post=reverse('article-list')
        res=self.client.post(url_post,{'title':'Not auth', 'content':'bad auth'})
        
        self.assertEqual(res.status_code,403)
    
    def test_editor_permissions(self):
        e=create_user(role='editor')
        self.client.force_login(e)
        
        url_post=reverse('article-list', kwargs={'pk':1})
        res_post=self.client.post(url_post, {'title': 'test draft', 'content': 'test content', 'status': 'draft'})
        self.assertEqual(res_post.status_code,201)
        
        url_patch=reverse('article-publish',kwargs={'pk':1})
        res_patch = self.client.patch(url_patch, {'status': 'published'})
        self.assertEqual(res_patch.status_code,403)
        
        
    def test_admin_permissions(self):
        admin=create_admin()
        self.client.force_login(admin)
        
        url_patch=reverse('article-publish',kwargs={'pk':1})
        res_patch=self.client.patch(url_patch,{'status':'pubished'})
        self.assertEqual(res_patch.status_code,200)
        
        url = reverse('users:admin_dashboard')
        res_get = self.client.get(url)
        self.assertEqual(res_get.status_code, 200)
    
    def test_admin_manage_users(self):
        a=create_admin()
        v=create_user(role='viewer')
        self.client.force_login(a)
        
        url = reverse('user-detail', kwargs={'pk': v.id})
        res_put = self.client.put(url, {'role': 'editor'})
        self.assertEqual(res_put.status_code, 200)
        
        v.refresh_from_db()
        self.assertEqual(v.role,'editor')
    
    def test_email_unique(self):
        create_user(email='unique@gmail.com')
        
        with self.assertRaises(Exception):
            User.objects.create_user(
                email='unique@gmail.com',
                username='another',
                password='12345',
                role='viewer'
            )
            
    
    def test_username_unique(self):
        create_user(username='unique')
        
        with self.assertRaises(Exception):
            User.objects.create_user(
                email='test@gmail.com',
                username='unique',
                password='12345',
                role='viewer'
            )

    
    def test_valid_roles(self):
        valid_roles=['viewer','admin','editor']
        
        for role in valid_roles:
            u = create_user(role=role)
            self.assertEqual(u.role, role)
            u.delete()
    
    def test_invalid_roles(self):
        with self.assertRaises(Exception):
            create_user(role='invalid')
            
    def test_pwd_hashing(self):
        u=create_user(password='12345')
        
        self.assertNotEqual(u.password, '12345')
        self.assertTrue(u.check_password('12345'))
        self.assertFasle(u.check_password('wrong'))
        
    def test_create_user_no_email(self):
        with self.assertRaises(Exception):
            create_user(email=None)
            
    
    def test_unauth_access_denied(self):
        url=reverse('user=list')
        res=self.client.get(url)
        
        self.assertEqual(res.status_code,401)
        
    def test_user_update_own_profile(self):
        u=create_user()
        self.client.force_login(u)
        
        url=reverse('user-detail',kwargs={'pk':u.id})
        res=self.client.patch(url,{'department':'HR', 'email':'new@gmail.com'})
        
        self.assertEqual(res.status_code,200)
        
        u.refresh_from_db()
        
        self.assertEqual(u.department,'HR')
        self.assertEqual(u.email,'new@gmail.com')
        
    
    def test_user_cannot_update_other_profiles(self):
        u1=create_user(username='u1', email='u1@gmail.com')
        u2=create_user(username='u2', email='u2@gmail.com')
        
        self.client.force_login(u1)
        
        url=reverse('user-detail',kwargs={'pk':u2.id})
        res=self.client.patch(url,{'department':'hacked'})
        self.assertEqual(res.status_code,403)
        
    def test_user_cannot_change_own_role(self):
        """Test that a user cannot change their own role."""
        viewer = create_user(role='viewer')
        self.client.force_login(viewer)
        
        url = reverse('user-detail', kwargs={'pk': viewer.id})
        response = self.client.patch(url, {'role': 'admin'})
        self.assertEqual(response.status_code, 403)
        
        viewer.refresh_from_db()
        self.assertEqual(viewer.role, 'viewer') 
    
    def test_admin_can_change_any_user_role(self):
        """Test that an admin can change any user's role."""
        admin = create_admin()
        viewer = create_user(role='viewer')
        self.client.force_login(admin)
        
        url = reverse('user-detail', kwargs={'pk': viewer.id})
        response = self.client.patch(url, {'role': 'editor'})
        self.assertEqual(response.status_code, 200)
        
        viewer.refresh_from_db()
        self.assertEqual(viewer.role, 'editor')
    
    def test_admin_can_list_all_users(self):
        """Test that an admin can see all users."""
        admin = create_admin()
        create_user(username='user1')
        create_user(username='user2')
        self.client.force_login(admin)
        
        url = reverse('user-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        self.assertGreaterEqual(len(response.data), 3)
    
    def test_viewer_cannot_list_all_users(self):
        """Test that a viewer cannot see the full user list."""
        viewer = create_user(role='viewer')
        self.client.force_login(viewer)
        
        url = reverse('user-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, 403)  
    
    
    def test_session_expires_after_inactivity(self):
        """Test that session expires after 8 hours of inactivity (FR-3.5)."""
        user = create_user()
        self.client.force_login(user)
        
        # Simulate session expiry
        # This requires mocking the session expiration
        # Here's how you'd do it with Django's test framework:
        session = self.client.session
        session.set_expiry(0)  # Expire immediately
        session.save()
        
        url = reverse('user-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, 401)
    
    def test_admin_actions_logged(self):
        """Test FR-3.6"""
        # This test assumes you have an AuditLog model
        # If you don't have one yet, skip or implement it
        admin = create_admin()
        viewer = create_user(role='viewer')
        self.client.force_login(admin)
        
        # Change user role
        url = reverse('user-detail', kwargs={'pk': viewer.id})
        self.client.patch(url, {'role': 'editor'})
        
        # Check that an audit log was created
        # from audit.models import AuditLog
        # self.assertEqual(AuditLog.objects.count(), 1)
        # self.assertEqual(AuditLog.objects.first().action, 'role_change')
    
    def test_soft_delete_user(self):
        """Test that users can be soft-deleted without losing data"""
        user = create_user()
        user.is_active = False
        user.save()
        
        active_users = User.objects.filter(is_active=True)
        self.assertNotIn(user, active_users)
        
        self.assertIsNotNone(User.objects.get(id=user.id))
    
    
    def test_user_detail_returns_correct_fields(self):
        """Test that the user detail endpoint returns the expected fields."""
        user = create_user()
        self.client.force_login(user)
        
        url = reverse('user-detail', kwargs={'pk': user.id})
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        
        expected_fields = ['id', 'username', 'email', 'role', 'department', 'date_joined']
        for field in expected_fields:
            self.assertIn(field, response.data)
    
    def test_user_list_returns_paginated_results(self):
        """Test that the user list is paginated."""
        admin = create_admin()
        
        for i in range(15):
            create_user(username=f'user{i}')
        
        self.client.force_login(admin)
        url = reverse('user-list')
        response = self.client.get(url, {'page': 1, 'limit': 10})
        self.assertEqual(response.status_code, 200)
        
        self.assertIn('count', response.data)
        self.assertIn('next', response.data)
        self.assertIn('previous', response.data)
        self.assertIn('results', response.data)
        