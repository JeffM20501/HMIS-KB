"""
Local embedding generation via sentence-transformers (BAAI/bge-small-en-v1.5).

Deliberately NOT calling out to an external API (the old code used
`HuggingFaceEndpointEmbeddings`, a network call per embed). This model is
~130MB and runs comfortably on CPU — running it in-process removes an
external dependency and a network round-trip from the hot path of every
chat message (the user's query has to be embedded before every retrieval).

The model is loaded once per process (module-level singleton) rather than
per-request — the old `RAGPipeline.__init__` rebuilt its embedding client
on every single request, which is the kind of thing this file exists to
stop happening again.
"""
import logging
import threading

logger = logging.getLogger('chatbot')

EMBEDDING_MODEL_NAME = 'BAAI/bge-small-en-v1.5'

# bge models are trained with an instruction prefix for queries (not for
# the documents/chunks being indexed) — using it measurably improves
# retrieval quality for this model family specifically.
_QUERY_INSTRUCTION = 'Represent this sentence for searching relevant passages: '

_model_lock = threading.Lock()
_model = None


def _get_model():
    global _model
    if _model is not None:
        return _model
    with _model_lock:
        if _model is None:
            # Imported lazily so importing this module doesn't require
            # sentence-transformers/torch to be installed unless embeddings
            # are actually used (keeps e.g. `manage.py shell` fast, and
            # keeps this module importable in environments — like CI steps
            # that don't touch the chatbot — without the ~500MB of torch).
            from sentence_transformers import SentenceTransformer
            import torch
            
            # Belt-and-suspenders alongside the OMP_NUM_THREADS/MKL_NUM_THREADS
            # env vars set in Dockerfile.backend: cap torch's own intra-op
            # thread pool directly, since env vars aren't always honored
            # depending on how torch's backend was already initialized by
            # the time this runs. On a memory-constrained (~512MB) container,
            # a single-threaded CPU embedder is plenty fast for one query at
            # a time and avoids extra per-thread stack/buffer overhead.
            torch.set_num_threads(1)

            logger.info('embedding_model_load', extra={'model': EMBEDDING_MODEL_NAME})
            _model = SentenceTransformer(EMBEDDING_MODEL_NAME)
    return _model


def embed_documents(texts):
    """Embed a batch of chunk texts for storage. Returns a list of float lists."""
    if not texts:
        return []
    model = _get_model()
    vectors = model.encode(list(texts), normalize_embeddings=True, show_progress_bar=False)
    return [v.tolist() for v in vectors]


def embed_query(text):
    """Embed a single user query for similarity search against stored chunks."""
    model = _get_model()
    vector = model.encode(_QUERY_INSTRUCTION + text, normalize_embeddings=True, show_progress_bar=False)
    return vector.tolist()
