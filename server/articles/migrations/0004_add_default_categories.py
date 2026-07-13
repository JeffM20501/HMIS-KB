# articles/migrations/0002_add_default_categories.py
from django.db import migrations
from django.utils.text import slugify

def add_default_categories(apps, schema_editor):
    Category = apps.get_model('articles', 'Category')
    default_categories = [
        "Getting Started",
        "Patient Management",
        "Clinical Modules",
        "Billing & Finance",
        "System Administration",
        "Compliance & Security",
        "Troubleshooting",
        "Release Notes",
    ]
    for name in default_categories:
        Category.objects.get_or_create(
            name=name,
            defaults={
                'slug': slugify(name),
                'description': f'Articles related to {name}',
                'icon': '📁',  # default icon
                'sort_order': default_categories.index(name),
            }
        )

class Migration(migrations.Migration):
    dependencies = [
        ('articles', '0003_media'),
    ]
    operations = [
        migrations.RunPython(add_default_categories),
    ]