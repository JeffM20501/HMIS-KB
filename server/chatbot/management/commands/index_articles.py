from django.core.management.base import BaseCommand

from articles.models.article import Article
from chatbot.models import ArticleChunk
from chatbot.services.indexing import reindex_article, remove_article_chunks


class Command(BaseCommand):
    help = (
        '(Re)index published articles into the vector store. Safe to re-run — '
        'each article\'s chunks are replaced wholesale, not appended, so running '
        'this twice does not duplicate chunks (the old LangChain-based version of '
        'this command had no such guard). Also removes chunks for any article '
        'that is no longer published, so a corpus with unpublished/archived '
        'articles at the time this runs still ends up in a fully correct state.'
    )

    def add_arguments(self, parser):
        parser.add_argument(
            '--article',
            type=str,
            default=None,
            help='Slug of a single article to reindex, instead of the full published corpus.',
        )

    def handle(self, *args, **options):
        slug = options.get('article')

        if slug:
            try:
                article = Article.objects.get(slug=slug)
            except Article.DoesNotExist:
                self.stderr.write(self.style.ERROR(f'No article found with slug "{slug}".'))
                return
            self._index_one(article)
            return

        published = Article.objects.filter(status='published')
        self.stdout.write(f'Found {published.count()} published articles.')

        indexed_article_ids = set(published.values_list('id', flat=True))
        processed = 0
        for article in published:
            processed += self._index_one(article, quiet=True) and 1 or 0

        # Clean up chunks for anything that used to be published and no
        # longer is — otherwise a corpus that had unpublished/archived
        # articles before this command's first run would leave stale,
        # citeable chunks behind indefinitely.
        stale = ArticleChunk.objects.exclude(article_id__in=indexed_article_ids).values_list(
            'article_id', flat=True
        ).distinct()
        stale_count = 0
        for article_id in stale:
            article = Article.objects.filter(id=article_id).first()
            if article:
                stale_count += remove_article_chunks(article)

        self.stdout.write(
            self.style.SUCCESS(f'Done. Indexed {processed} articles, removed {stale_count} stale chunks.')
        )

    def _index_one(self, article, quiet=False):
        chunk_count = reindex_article(article)
        if not quiet:
            if chunk_count:
                self.stdout.write(self.style.SUCCESS(f'Indexed "{article.title}" — {chunk_count} chunks.'))
            else:
                self.stdout.write(self.style.WARNING(f'"{article.title}" produced no chunks (empty content?).'))
        return bool(chunk_count)
