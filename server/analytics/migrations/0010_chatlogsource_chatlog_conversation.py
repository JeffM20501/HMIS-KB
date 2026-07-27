import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('analytics', '0009_alter_feedback_comment_alter_feedback_content_type_and_more'),
        ('articles', '0008_alter_article_slug'),
        ('chatbot', '0002_conversation_and_articlechunk'),
    ]

    operations = [
        migrations.AddField(
            model_name='chatlog',
            name='conversation',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name='messages',
                to='chatbot.conversation',
            ),
        ),
        migrations.AddIndex(
            model_name='chatlog',
            index=models.Index(fields=['conversation', 'created_at'], name='analytics_c_convers_2a71de_idx'),
        ),
        migrations.CreateModel(
            name='ChatLogSource',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('confidence', models.FloatField(default=0.0)),
                ('rank', models.PositiveSmallIntegerField(default=0)),
                ('article', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='chat_citations', to='articles.article')),
                ('chat_log', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='sources', to='analytics.chatlog')),
            ],
            options={'ordering': ['rank']},
        ),
        migrations.AddConstraint(
            model_name='chatlogsource',
            constraint=models.UniqueConstraint(fields=['chat_log', 'article'], name='unique_source_per_chat_log'),
        ),
    ]
