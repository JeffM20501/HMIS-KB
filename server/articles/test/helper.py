"""
Test helper functions for articles app.
Provides reusable factories for creating test data.
"""
from django.contrib.auth import get_user_model
from articles.models import Article, Category, Tag
import uuid
import time

User = get_user_model()

_user_counter = 0
_slug_counter = 0


def _get_next_username():
    global _user_counter
    _user_counter += 1
    return f'testuser_{_user_counter}'


def unique_slug(base="test-article"):
    """Generate a unique slug with counter + timestamp + UUID."""
    global _slug_counter
    _slug_counter += 1
    return f"{base}-{uuid.uuid4().hex[:8]}-{_slug_counter}-{int(time.time())}"


def create_user(role='viewer', **kwargs):
    if 'username' not in kwargs:
        kwargs['username'] = _get_next_username()
    if 'email' not in kwargs:
        kwargs['email'] = f'{kwargs["username"]}@test.com'
    return User.objects.create_user(
        username=kwargs['username'],
        email=kwargs['email'],
        password=kwargs.get('password', '12345'),
        role=role,
        department=kwargs.get('department', 'IT')
    )


def create_admin():
    return create_user(role='admin', username='admin_test', email='admin@test.com')


def create_category(name='Troubleshooting', **kwargs):
    slug = kwargs.pop('slug', unique_slug(base=name.lower().replace(' ', '-')))
    return Category.objects.create(
        name=name,
        slug=slug,
        description=kwargs.pop('description', f'Category for {name}'),
        **kwargs
    )


def create_tag(name='Emergency', **kwargs):
    slug = kwargs.pop('slug', unique_slug(base=name.lower().replace(' ', '-')))
    return Tag.objects.create(
        name=name,
        slug=slug,
        description=kwargs.pop('description', f'Tag for {name}'),
        **kwargs
    )


def create_article(author, category=None, status='draft', **kwargs):
    if category is None:
        category = create_category()
    slug = kwargs.pop('slug', unique_slug(base='article'))
    return Article.objects.create(
        title=kwargs.get('title', 'Test Article'),
        slug=slug,
        content=kwargs.get('content', 'This is test content for the article. It needs to be at least 50 characters long.'),
        category=category,
        author=author,
        status=status,
        views=kwargs.get('views', 0),
        **kwargs
    )