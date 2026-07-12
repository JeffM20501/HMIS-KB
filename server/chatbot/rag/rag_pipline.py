import os
from langchain_huggingface import HuggingFaceEndpoint
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnablePassthrough
from django.conf import settings
from chatbot.vector.vector_store import VectorStoreManager
from chatbot.security.prompt_injection import validate_query


class RAGPipeline:
    """
    RAG pipeline using Hugging Face Inference API (FREE).
    PRD FR-5.2: Answer generated only from published KB articles.
    """
    
    def __init__(self):
        # Initialize vector store for retrieval
        self.vectorstore = VectorStoreManager()
        
        self.llm = HuggingFaceEndpoint(
            repo_id="google/flan-t5-large",  # Good free model
            huggingfacehub_api_token=settings.HUGGINGFACE_API_KEY,
            task="text-generation",
            max_new_tokens=300,
            temperature=0.2,
        )
        
        # Alternative free models to try:
        # repo_id="microsoft/phi-2"              # Small, good
        # repo_id="tiiuae/falcon-7b"              # Falcon 7B
        # repo_id="mistralai/Mistral-7B-v0.1"     # Mistral 7B
        
        # Prompt template
        self.prompt = ChatPromptTemplate.from_messages([
            ("system", """You are a helpful healthcare assistant for the HMIS Knowledge Base.

            IMPORTANT RULES:
            1. ONLY answer using the provided context. Do not use outside knowledge.
            2. If the context doesn't contain the answer, say: "I cannot find an answer to that question in the knowledge base. Please contact support for assistance."
            3. Always cite the source article(s) by mentioning the article title.
            4. Do not provide medical advice. You are providing information from documented procedures.
            5. Keep responses clear, concise, and professional.

            CONTEXT:
            {context}"""),
            ("user", "{question}"),
        ])
    
    def _format_docs(self, docs):
        """Format retrieved documents into context string."""
        if not docs:
            return ""
        
        context_parts = []
        for doc in docs:
            context_parts.append(
                f"[Article: {doc.metadata.get('title', 'Unknown')}]\n{doc.page_content}"
            )
        return "\n\n---\n\n".join(context_parts)
    
    def _get_context(self, query: str, k: int = 5) -> tuple:
        """Retrieve relevant chunks from the vector store."""
        results = self.vectorstore.similarity_search_with_score(query, k=k)
        
        # Filter by relevance threshold
        threshold = 0.7
        relevant_docs = [(doc, score) for doc, score in results if score >= threshold]
        
        if not relevant_docs:
            return "", []
        
        docs = [doc for doc, _ in relevant_docs]
        context = self._format_docs(docs)
        
        return context, docs
    
    def answer(self, question: str, conversation_id: str = None) -> dict:
        """Process a user question and return an answer."""
        # Step 1: Validate the question (prevent prompt injection)
        validation = validate_query(question)
        if not validation['valid']:
            return {
                'answer': "I cannot process this question. Please ask a valid question.",
                'was_grounded': False,
                'article_ref': None,
                'confidence_score': 0.0,
                'error': validation['error'],
            }
        
        sanitized_question = validation['sanitized']
        
        # Step 2: Retrieve relevant context
        context, documents = self._get_context(sanitized_question)
        
        # Step 3: Check if we found any relevant content
        if not context:
            return {
                'answer': "I cannot find an answer to that question in the knowledge base. Please contact support for assistance.",
                'was_grounded': False,
                'article_ref': None,
                'confidence_score': 0.0,
            }
        
        # Step 4: Generate answer using the LLM
        try:
            chain = (
                {"context": lambda x: context, "question": RunnablePassthrough()}
                | self.prompt
                | self.llm
                | StrOutputParser()
            )
            
            answer = chain.invoke(sanitized_question)
            
            # Extract article reference
            first_doc = documents[0] if documents else None
            article_ref = None
            if first_doc:
                article_ref = {
                    'id': first_doc.metadata.get('article_id'),
                    'title': first_doc.metadata.get('title'),
                    'slug': first_doc.metadata.get('slug'),
                }
            
            return {
                'answer': answer,
                'was_grounded': True,
                'article_ref': article_ref,
                'confidence_score': 0.85,
            }
            
        except Exception as e:
            return {
                'answer': "An error occurred while generating the answer. Please try again.",
                'was_grounded': False,
                'article_ref': None,
                'confidence_score': 0.0,
                'error': str(e),
            }