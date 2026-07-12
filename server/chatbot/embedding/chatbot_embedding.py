import os
from langchain_huggingface import HuggingFaceEndpointEmbeddings
from django.conf import settings


class EmbeddingManager:
    """Handles embedding generation for the RAG pipeline using sentence-transformers."""
    
    def __init__(self):
        # Reference: https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2
        self.embeddings = HuggingFaceEndpointEmbeddings(
            model="sentence-transformers/all-MiniLM-L6-v2",
            huggingfacehub_api_token=settings.HUGGINGFACE_API_KEY,
        )
    
    def get_embeddings(self):
        """Return the embedding model."""
        return self.embeddings
    
    def embed_text(self, text: str):
        """Generate embedding for a single text."""
        return self.embeddings.embed_query(text)
    
    def embed_documents(self, texts: list):
        """Generate embeddings for multiple documents."""
        return self.embeddings.embed_documents(texts)