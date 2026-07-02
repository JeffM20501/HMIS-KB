from django.contrib.auth import get_user_model
from articles.models import Article, Category


User = get_user_model()

def create_user(role='viewer'):
    return User.objects.create_user(
        username='usertest',
        email='test@gmail.com',
        password='12345',
        role=role,
        department='IT'
    )

def create_category():
    return Category.objects.create(
        name='Troubleshooting',
        slug='troubleshooting',
        description='Troubleshooting guides'
    )

def create_article(author):
    category = create_category()
    return Article.objects.create(
        title='Test Article',
        slug='test-article',
        content='Test content',
        category=category,
        author=author,
        status='published'
    )