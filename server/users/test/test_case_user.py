from django.test import TestCase
from django.utils import timezone
from django.contrib.auth import get_user_model
from django.urls import reverse

User=get_user_model()

def create_user(role='viewer'):
    user=User.objects.create_user(
            username='usertest',
            email='test@gmail.com',
            password='12345',
            role=role,
            department='IT'
    )
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