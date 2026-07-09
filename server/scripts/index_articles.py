"""
Run this script once to index all published articles into the vector database.
python manage.py runscript index_articles
"""

import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'app.settings')
django.setup()

from articles.models import Article
from chatbot.vector.vector_store import VectorStoreManager
from langchain_text_splitters import RecursiveCharacterTextSplitter


def index_articles():
    """Index all published articles into the vector database."""
    print("Starting article indexing...")
    
    # Get published articles
    articles = Article.objects.filter(status='published')
    print(f"Found {articles.count()} published articles.")
    
    # Initialize vector store
    vector_store = VectorStoreManager()
    
    # Text splitter for chunking[reference:12][reference:13]
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=512,
        chunk_overlap=50,
        separators=["\n\n", "\n", ". ", " ", ""],
    )
    
    processed = 0
    for article in articles:
        print(f"Processing: {article.title}")
        
        # Combine title and content for better retrieval
        full_text = f"{article.title}\n\n{article.content}"
        
        # Split into chunks
        chunks = text_splitter.split_text(full_text)
        
        # Prepare metadata for each chunk
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
        
        # Add to vector store
        vector_store.add_documents(chunks, metadatas)
        processed += 1
        
        print(f"  Added {len(chunks)} chunks for '{article.title}'")
    
    print(f"Done. Processed {processed} articles.")


if __name__ == "__main__":
    index_articles()