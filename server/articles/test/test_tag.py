# articles/test/test_tag.py
from django.test import TestCase
from articles.test.helper import *
from articles.models import Tag, Article, Category

class TagTest(TestCase):
    def setUp(self):
        Tag.objects.all().delete()
        Article.objects.all().delete()
        Category.objects.all().delete()

    def test_tag_creation(self):
        slug = unique_slug(base='sop')
        tag = Tag.objects.create(
            name='SOP',
            slug=slug,
            description='Standard Operating Procedure'
        )
        self.assertEqual(tag.name, 'SOP')
        self.assertEqual(tag.slug, slug)

    def test_tag_str_method(self):
        slug = unique_slug(base='faqs')
        tag = Tag.objects.create(
            name='FAQs',
            slug=slug
        )
        self.assertEqual(str(tag), 'FAQs')

    def test_article_can_have_multiple_tags(self):
        author = create_user(role='editor')
        category = create_category()
        article = create_article(author, category) 

        tag1_slug = unique_slug(base='emergency')
        tag2_slug = unique_slug(base='sop')
        tag1 = Tag.objects.create(
            name='Emergency',
            slug=tag1_slug
        )
        tag2 = Tag.objects.create(
            name='SOP',
            slug=tag2_slug
        )

        article.tags.add(tag1, tag2)
        self.assertEqual(article.tags.count(), 2)
        self.assertIn(tag1, article.tags.all())
        self.assertIn(tag2, article.tags.all())