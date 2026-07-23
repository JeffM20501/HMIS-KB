from django.core.management.base import BaseCommand
from articles.models import Article
from chatbot.vector.vector_store import VectorStoreManager
from langchain_text_splitters import RecursiveCharacterTextSplitter

class Command(BaseCommand):
    help = 'Index all published articles into the vector database'

    def handle(self, *args, **options):
        self.stdout.write('Starting article indexing...')
        
        articles = Article.objects.filter(status='published')
        self.stdout.write(f'Found {articles.count()} published articles.')
        
        vector_store = VectorStoreManager()
        
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=512,
            chunk_overlap=50,
            separators=["\n\n", "\n", ". ", " ", ""],
        )
        
        processed = 0
        for article in articles:
            self.stdout.write(f'Processing: {article.title}')
            
            full_text = f"{article.title}\n\n{article.content}"
            chunks = text_splitter.split_text(full_text)
            
            metadatas = []
            for _ in chunks:
                metadatas.append({
                    'article_id': article.id,
                    'title': article.title,
                    'slug': article.slug,
                    'category_id': article.category_id,
                    'author_id': article.author_id,
                    'published_at': str(article.published_at) if article.published_at else '',
                })
            
            vector_store.add_documents(chunks, metadatas)
            processed += 1
            self.stdout.write(f'  Added {len(chunks)} chunks for "{article.title}"')
        
        self.stdout.write(self.style.SUCCESS(f'Done. Processed {processed} articles.'))