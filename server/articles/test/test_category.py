# articles/test/test_category.py
from django.test import TestCase
from articles.test.helper import *
from articles.models import Category

class CategoryTest(TestCase):
    def setUp(self):
        Category.objects.all().delete()

    def test_category_creation(self):
        slug = unique_slug(base='patient-management')
        category = Category.objects.create(
            name='Patient Management',
            slug=slug,
            description='Patient management guides'
        )
        self.assertEqual(category.name, 'Patient Management')
        self.assertEqual(category.slug, slug)
        self.assertEqual(category.description, 'Patient management guides')

    def test_category_str_method(self):
        slug = unique_slug(base='patient-management')
        category = Category.objects.create(
            name='Patient Management',
            slug=slug
        )
        self.assertEqual(str(category), 'Patient Management')