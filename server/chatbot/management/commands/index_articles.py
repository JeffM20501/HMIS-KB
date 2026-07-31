from django.core.management.base import BaseCommand

from articles.models.article import Article
from chatbot.services.indexing import reindex_article, remove_article_chunks


class Command(BaseCommand):
    """
    Bulk (re)index all published articles. Useful for:
      - initial backfill on a fresh install
      - recovering after an embedding-model change (bump
        ArticleChunk.embedding_model and re-run to migrate everything)
      - manual recovery if a signal-driven reindex failed and was only
        logged (see chatbot/signals.py's exception handling)

    Shares its actual chunk/embed logic with the automatic signal-driven
    path via chatbot/services/indexing.py, rather than a separate one-off
    implementation that could drift out of sync with it. Idempotent — safe
    to run repeatedly (each article's chunks are replaced wholesale, never
    appended), unlike the previous version, which called
    `vector_store.add_documents()` unconditionally and duplicated every
    chunk on a second run.
    """

    help = '(re)generate embeddings for all published articles.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--article-id',
            type=int,
            default=None,
            help='Only (re)index a single article by id, instead of all published articles.',
        )

    def handle(self, *args, **options):
        queryset = Article.objects.filter(status='published')
        if options['article_id']:
            queryset = queryset.filter(id=options['article_id'])

        total = queryset.count()
        if total == 0:
            self.stdout.write(self.style.WARNING('No published articles found to index.'))
            return

        indexed, skipped, failed = 0, 0, 0

        for article in queryset.iterator():
            chunk_count = reindex_article(article)
            if chunk_count > 0:
                indexed += 1
                self.stdout.write(f"  indexed: {article.title} ({chunk_count} chunks)")
            elif chunk_count == 0 and not article.content.strip():
                skipped += 1
            else:
                failed += 1
                self.stderr.write(self.style.ERROR(f"  FAILED: {article.title}"))

        self.stdout.write(
            self.style.SUCCESS(f"Done. indexed={indexed} skipped_empty={skipped} failed={failed} total={total}")
        )
