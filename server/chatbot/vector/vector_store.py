from langchain_community.vectorstores import Chroma
from django.conf import settings
from chatbot.embedding.chatbot_embedding import EmbeddingManager


class VectorStoreManager:
    """Manages vector database operations."""
    
    def __init__(self, collection_name="articles"):
        self.embeddings = EmbeddingManager().get_embeddings()
        self.collection_name = collection_name
        self._init_pgvector()
    
    def _init_chroma(self):
        """Use Chroma (local, file-based, good for development)."""
        import os
        persist_dir = os.path.join(settings.BASE_DIR, "chroma_db")
        
        self.vectorstore = Chroma(
            collection_name=self.collection_name,
            embedding_function=self.embeddings,
            persist_directory=persist_dir,
        )
    
    def _init_pgvector(self):
        """Use PostgreSQL + pgvector (production-ready)."""
        from langchain_postgres import PGVector
        connection_string = settings.DATABASE_URL
        
        self.vectorstore = PGVector(
            collection_name=self.collection_name,
            connection=connection_string,
            embedding_function=self.embeddings,
        )
    
    def add_documents(self, texts, metadatas):
        """Add documents to the vector store."""
        return self.vectorstore.add_texts(
            texts=texts,
            metadatas=metadatas,
        )  # Returns list of IDs[reference:9]
    
    def similarity_search(self, query, k=5):
        """Search for similar documents."""
        return self.vectorstore.similarity_search(query, k=k)
    
    def similarity_search_with_score(self, query, k=5):
        """Search with relevance scores."""
        return self.vectorstore.similarity_search_with_relevance_scores(query, k=k)
    
    def delete_collection(self):
        """Delete the entire collection."""
        self.vectorstore.delete_collection()