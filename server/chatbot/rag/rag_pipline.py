# chatbot/rag/rag_pipline.py
import os
import re
import logging
import time
import requests
from django.conf import settings
from langchain_core.prompts import ChatPromptTemplate
from chatbot.vector.vector_store import VectorStoreManager
from chatbot.security.prompt_injection import validate_query

logger = logging.getLogger(__name__)


def strip_html(text):
    """Remove HTML tags and normalize whitespace."""
    if not text:
        return text
    # Remove tags and replace with space
    text = re.sub(r'<[^>]+>', ' ', text)
    # Collapse multiple spaces
    text = re.sub(r'\s+', ' ', text)
    return text.strip()


def clean_text(text, max_length=500):
    """Strip HTML and truncate to a reasonable length."""
    cleaned = strip_html(text)
    if len(cleaned) > max_length:
        cleaned = cleaned[:max_length] + "..."
    return cleaned


class RAGPipeline:
    def __init__(self):
        self.vectorstore = VectorStoreManager()
        self.api_key = getattr(settings, 'HUGGINGFACE_API_KEY', None)
        if not self.api_key:
            print("⚠️ WARNING: HUGGINGFACE_API_KEY not set. Using fallback only.")
        
        # Try multiple models
        self.models = [
            "google/flan-t5-large",
            "microsoft/phi-2",
            "tiiuae/falcon-7b",
            "mistralai/Mistral-7B-v0.1",
        ]
        
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
        """Format retrieved documents into a clean context string (HTML stripped)."""
        if not docs:
            return ""
        context_parts = []
        for doc in docs:
            # Clean the content (strip HTML) before sending to LLM
            clean_content = clean_text(doc.page_content, max_length=800)
            context_parts.append(
                f"[Article: {doc.metadata.get('title', 'Unknown')}]\n{clean_content}"
            )
        return "\n\n---\n\n".join(context_parts)
    
    def _get_context(self, query: str, k: int = 5):
        results = self.vectorstore.similarity_search_with_score(query, k=k)
        if not results:
            return "", []
        docs = [doc for doc, _ in results]
        context = self._format_docs(docs)
        return context, docs
    
    def _call_api(self, prompt):
        """Call Hugging Face Inference API with simple timeout, fallback on failure."""
        if not self.api_key:
            return None
        
        for model in self.models:
            try:
                url = f"https://api-inference.huggingface.co/models/{model}"
                headers = {"Authorization": f"Bearer {self.api_key}"}
                payload = {
                    "inputs": prompt,
                    "parameters": {
                        "max_new_tokens": 300,
                        "temperature": 0.2,
                        "do_sample": True,
                    }
                }
                response = requests.post(url, headers=headers, json=payload, timeout=10)
                
                if response.status_code == 200:
                    result = response.json()
                    if isinstance(result, list) and len(result) > 0:
                        return result[0].get('generated_text', '').strip()
                    return result.get('generated_text', '').strip()
                elif response.status_code == 503:
                    # Model loading, wait and retry once
                    time.sleep(2)
                    continue
                else:
                    print(f"❌ Model {model} returned {response.status_code}: {response.text[:100]}")
                    continue
            except requests.exceptions.RequestException as e:
                print(f"❌ API call to {model} failed: {e}")
                continue
        
        return None
    
    def answer(self, question: str, conversation_id: str = None) -> dict:
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
        context, documents = self._get_context(sanitized_question)
        
        if not context:
            return {
                'answer': "I cannot find an answer to that question in the knowledge base. Please contact support for assistance.",
                'was_grounded': False,
                'article_ref': None,
                'confidence_score': 0.0,
            }
        
        prompt_messages = self.prompt.format_messages(context=context, question=sanitized_question)
        full_prompt = "\n".join([f"{msg.type}: {msg.content}" for msg in prompt_messages])
        
        generated_text = self._call_api(full_prompt)
        
        if generated_text:
            # Keep HTML from LLM
            clean_answer = generated_text
            first_doc = documents[0] if documents else None
            article_ref = None
            if first_doc:
                article_ref = {
                    'id': first_doc.metadata.get('article_id'),
                    'title': first_doc.metadata.get('title'),
                    'slug': first_doc.metadata.get('slug'),
                }
            return {
                'answer': clean_answer,
                'was_grounded': True,
                'article_ref': article_ref,
                'confidence_score': 0.85,
            }
        else:
            # ✅ Fallback – now returns HTML‑formatted content
            first_doc = documents[0]
            clean_content = clean_text(first_doc.page_content, max_length=300)
            title = first_doc.metadata.get('title', 'Unknown')
            
            # Build a nice HTML response
            fallback_answer = f"""
            <div class="fallback-response">
                <p><strong>Based on the article:</strong> <em>{title}</em></p>
                <p>{clean_content}</p>
            </div>
            """
            
            return {
                'answer': fallback_answer,
                'was_grounded': True,
                'article_ref': {
                    'id': first_doc.metadata.get('article_id'),
                    'title': title,
                    'slug': first_doc.metadata.get('slug'),
                },
                'confidence_score': 0.5,
            }