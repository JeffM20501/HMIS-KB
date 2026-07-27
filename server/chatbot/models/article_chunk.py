from django.db import models
from pgvector.django import VectorField
from articles.models.article import Article

# BAAI/bge-small-en-v1.5 produces 384-dimensional vectors. Keeping this as
# a named constant since it's referenced by the embedding service too, and
# changing embedding models means re-indexing everything (the dimension is
# baked into the column).
EMBEDDING_DIM = 384


class ArticleChunk(models.Model):
    """
    One retrievable unit of an article's content for RAG. Replaces the old
    LangChain-`PGVector`-managed tables (`langchain_pg_collection` /
    `langchain_pg_embedding`), which lived entirely outside Django's ORM
    with no FK to Article — deleting/archiving an article left orphaned
    vectors behind with no way to clean them up short of dropping the whole
    collection. This model is a normal Django model: FK cascade-deletes its
    chunks automatically, and it's visible/queryable/admin-registerable
    like anything else in the project.

    Kept synchronized automatically by chatbot/signals.py whenever an
    Article is published, edited, unpublished, or deleted — see that file
    for the exact transitions handled.
    """

    article = models.ForeignKey(Article, on_delete=models.CASCADE, related_name='chunks')
    chunk_index = models.PositiveIntegerField()
    content = models.TextField()
    token_count = models.PositiveIntegerField(default=0)
    embedding = VectorField(dimensions=EMBEDDING_DIM, null=True)
    embedding_model = models.CharField(max_length=100, default='BAAI/bge-small-en-v1.5')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['article_id', 'chunk_index']
        constraints = [
            models.UniqueConstraint(fields=['article', 'chunk_index'], name='unique_chunk_per_article'),
        ]
        indexes = [
            models.Index(fields=['article', 'chunk_index']),
        ]

    def __str__(self):
        return f"{self.article.title} — chunk {self.chunk_index}"
