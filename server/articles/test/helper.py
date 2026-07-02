from django.contrib.auth import get_user_model
from django.utils import timezone
from articles.models import *


User = get_user_model()

def create_user(role='viewer'):
    return User.objects.create_user(
        username='usertest',
        email='test@gmail.com',
        password='12345',
        role=role,
        department='IT'
    )

def create_admin():
    return User.objects.create_user(
        username='admin',
        email='admin@gmail.com',
        password='12345',
        role='admin',
        department='admin'
    )

def create_category(name='Troubleshooting'):
    return Category.objects.create(
        name=name,
        slug=name.lower().replace(' ', '-'),
        description=f'Category for {name}'
    )

def create_tag(name='Emergency'):
    return Tag.objects.create(
        name=name,
        slug=name.lower().replace(' ', '-')
    )

def create_article(author, category=None, status='draft'):
    if category is None:
        category = create_category()
    
    article = Article.objects.create(
        title='Test Article',
        slug='test-article',
        content='This is test content for the article.',
        category=category,
        author=author,
        status=status,
        views=0
    )
    return article