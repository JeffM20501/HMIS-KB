"""
The actual (re)index / remove-from-index logic, factored out so both
chatbot/signals.py (automatic sync on save/delete) and
chatbot/management/commands/index_articles.py (manual bulk reindex) call
the exact same code rather than maintaining two copies of it.
"""
import logging

from chatbot.models import ArticleChunk
from chatbot.services.chunking import chunk_text
from chatbot.services.embedding_service import embed_documents

logger = logging.getLogger('chatbot')


def reindex_article(article):
    """(Re)chunks and (re)embeds a single article, replacing any existing chunks wholesale."""
    try:
        chunks = chunk_text(article.content)
        if not chunks:
            remove_article_chunks(article)
            return 0

        vectors = embed_documents(chunks)

        ArticleChunk.objects.filter(article=article).delete()
        ArticleChunk.objects.bulk_create(
            [
                ArticleChunk(article=article, chunk_index=i, content=chunk, embedding=vector, token_count=len(chunk.split()))
                for i, (chunk, vector) in enumerate(zip(chunks, vectors))
            ]
        )
        logger.info('article_reindexed', extra={'article_id': article.id, 'chunk_count': len(chunks)})
        return len(chunks)
    except Exception:
        # Never let an embedding failure break the caller's transaction
        # (article save/publish, or a bulk reindex run) — log and continue.
        logger.exception('article_reindex_failed', extra={'article_id': article.id})
        return 0


def remove_article_chunks(article):
    deleted_count, _ = ArticleChunk.objects.filter(article=article).delete()
    if deleted_count:
        logger.info('article_chunks_removed', extra={'article_id': article.id, 'count': deleted_count})
    return deleted_count
