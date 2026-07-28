"""
Keeps ArticleChunk embeddings synchronized with Article lifecycle events —
the "embeddings should automatically stay synchronized" requirement, which
previously had zero automation (only a manual `manage.py index_articles`
command existed).

Transitions handled:
- Article saved with status='published'        -> (re)index its chunks
- Article saved, was published, no longer is    -> remove its chunks
- Article deleted                               -> remove its chunks (also
  happens automatically via ArticleChunk's on_delete=CASCADE, but handled
  explicitly here too so the log line exists)

The actual chunk/embed/replace logic lives in chatbot/services/indexing.py,
shared with the manual `index_articles` management command — this module
only decides *when* to call it.

Runs synchronously, in-request, right after save. This project has no
Celery/RQ/task-queue infrastructure set up anywhere (no broker, no worker
process, nothing in settings.py) — introducing one just for this would be
a meaningfully bigger infra change than this task asked for. For a
small-to-medium article corpus (an HMIS knowledge base, not a firehose of
content), (re)embedding a single article's ~5-20 chunks with a local CPU
model takes well under a couple of seconds. Flagging this explicitly: if
the article corpus or edit frequency grows enough that this becomes a
noticeable delay on save, move the call to `reindex_article` into a
background task — it's already isolated and side-effect-free enough to
drop into a task queue without changes.
"""
from django.db.models.signals import post_delete, post_save, pre_save
from django.dispatch import receiver

from articles.models.article import Article
from chatbot.services.indexing import reindex_article, remove_article_chunks


@receiver(pre_save, sender=Article)
def _stash_previous_status(sender, instance, **kwargs):
    if not instance.pk:
        instance._previous_status = None
        return
    try:
        instance._previous_status = Article.objects.only('status').get(pk=instance.pk).status
    except Article.DoesNotExist:
        instance._previous_status = None


@receiver(post_save, sender=Article)
def _sync_embeddings_on_save(sender, instance, created, **kwargs):
    previous_status = getattr(instance, '_previous_status', None)

    if instance.status == 'published':
        reindex_article(instance)
    elif previous_status == 'published' and instance.status != 'published':
        remove_article_chunks(instance)


@receiver(post_delete, sender=Article)
def _remove_embeddings_on_delete(sender, instance, **kwargs):
    remove_article_chunks(instance)
