"""
Vector similarity search over ArticleChunk using pgvector's cosine distance
operator directly through the Django ORM — no LangChain PGVector wrapper,
no separate connection/collection bookkeeping. This is step 6-8 of the RAG
pipeline (embed query -> similarity search -> top-k retrieval).
"""
import logging

from pgvector.django import CosineDistance

from chatbot.models import ArticleChunk
from chatbot.services.embedding_service import embed_query

logger = logging.getLogger('chatbot')

DEFAULT_TOP_K = 5
# Cosine distance is 0 (identical) to 2 (opposite); similarity = 1 - distance.
# Below this similarity, a chunk is considered too weak a match to cite —
# this is what lets the assistant say "I don't know" instead of grounding
# an answer in a barely-related chunk just because it was the closest one.
MIN_SIMILARITY = 0.35


def retrieve_relevant_chunks(query_text, top_k=DEFAULT_TOP_K):
    """
    Returns a list of dicts: [{chunk, article, similarity}, ...] ordered by
    descending similarity, already filtered to MIN_SIMILARITY and to
    published articles only (the FK naturally excludes chunks for articles
    that were unpublished/archived, since chatbot/signals.py deletes their
    chunks — this filter is a defensive second layer, not the only guard).
    """
    query_vector = embed_query(query_text)

    queryset = (
        ArticleChunk.objects.select_related('article', 'article__category')
        .filter(article__status='published')
        .annotate(distance=CosineDistance('embedding', query_vector))
        .order_by('distance')[: top_k * 2]  # over-fetch slightly before the similarity filter
    )

    results = []
    for chunk in queryset:
        similarity = 1 - chunk.distance
        if similarity < MIN_SIMILARITY:
            continue
        results.append({'chunk': chunk, 'article': chunk.article, 'similarity': similarity})
        if len(results) >= top_k:
            break

    logger.info(
        'retrieval_complete',
        extra={'query_len': len(query_text), 'chunks_found': len(results)},
    )
    return results


def rank_and_dedupe_by_article(results, max_articles=3):
    """
    Context ranking step (step 9): collapse multiple chunks from the same
    article down to that article's single best-scoring chunk, so the
    prompt cites a spread of distinct articles rather than N fragments of
    one document — better for both prompt-token budget and for giving the
    user several relevant source links instead of one repeated five times.
    """
    best_per_article = {}
    for r in results:
        article_id = r['article'].id
        if article_id not in best_per_article or r['similarity'] > best_per_article[article_id]['similarity']:
            best_per_article[article_id] = r
    ranked = sorted(best_per_article.values(), key=lambda r: r['similarity'], reverse=True)
    return ranked[:max_articles]
