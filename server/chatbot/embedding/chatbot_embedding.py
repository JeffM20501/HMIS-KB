import os
from langchain_huggingface import HuggingFaceEmbeddings
from django.conf import settings


class EmbeddingManager:
    """Handles embedding generation for the RAG pipeline using sentence-transformers."""
    
    def __init__(self):
        # Reference: https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2
        self.embeddings = HuggingFaceEmbeddings(
            model_name="sentence-transformers/all-MiniLM-L6-v2",
            model_kwargs={"device": "cpu"},
            encode_kwargs={"normalize_embeddings": True},
            cache_folder=os.path.join(settings.BASE_DIR, "hf_cache"),
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