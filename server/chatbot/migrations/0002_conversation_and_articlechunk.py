import django.db.models.deletion
import pgvector.django
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('chatbot', '0001_enable_pgvector'),
        ('articles', '0008_alter_article_slug'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='Conversation',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('session_key', models.CharField(blank=True, db_index=True, max_length=64, null=True)),
                ('title', models.CharField(blank=True, max_length=255)),
                ('is_archived', models.BooleanField(default=False)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('user', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='conversations', to=settings.AUTH_USER_MODEL)),
            ],
            options={'ordering': ['-updated_at']},
        ),
        migrations.AddIndex(
            model_name='conversation',
            index=models.Index(fields=['user', '-updated_at'], name='chatbot_con_user_id_9f3a21_idx'),
        ),
        migrations.AddIndex(
            model_name='conversation',
            index=models.Index(fields=['session_key', '-updated_at'], name='chatbot_con_session_5c8b40_idx'),
        ),
        migrations.CreateModel(
            name='ArticleChunk',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('chunk_index', models.PositiveIntegerField()),
                ('content', models.TextField()),
                ('token_count', models.PositiveIntegerField(default=0)),
                ('embedding', pgvector.django.VectorField(dimensions=384, null=True)),
                ('embedding_model', models.CharField(default='BAAI/bge-small-en-v1.5', max_length=100)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('article', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='chunks', to='articles.article')),
            ],
            options={'ordering': ['article_id', 'chunk_index']},
        ),
        migrations.AddIndex(
            model_name='articlechunk',
            index=models.Index(fields=['article', 'chunk_index'], name='chatbot_art_article_9b1c33_idx'),
        ),
        migrations.AddConstraint(
            model_name='articlechunk',
            constraint=models.UniqueConstraint(fields=['article', 'chunk_index'], name='unique_chunk_per_article'),
        ),
    ]
