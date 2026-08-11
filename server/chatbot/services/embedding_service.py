"""
Local embedding generation via fastembed (BAAI/bge-small-en-v1.5, onnxruntime).

Previously ran on sentence-transformers/torch. Root-caused via the Render
512MB OOM/SIGKILL investigation: `import torch` (pulled in by
sentence-transformers) alone consumed ~357MB RSS before a single model
weight was loaded, leaving no headroom in a ~512MB container for the
model itself, the HF download, Django, the DB connection, or gunicorn.
Reducing to 1 Gunicorn worker and capping BLAS/OMP thread pools (see
Dockerfile.backend) were both correct fixes for what they targeted, but
neither could fix a single process already using 86% of budget on the
torch import alone.

fastembed runs on onnxruntime instead of torch, ships a quantized ONNX
build of this exact model, and produces the same 384-dimensional vectors
this schema (chatbot/models/article_chunk.py: EMBEDDING_DIM = 384)
already expects — no schema/migration change needed.

IMPORTANT: quantized ONNX weights are numerically slightly different from
the full-precision torch weights that produced any embeddings stored
before this change. Existing ArticleChunk.embedding values must be
regenerated (`manage.py index_articles`) after deploying this, or old
chunks will compare poorly against new query embeddings computed with
this module.
"""
import logging
import threading

logger = logging.getLogger('chatbot')

EMBEDDING_MODEL_NAME = 'BAAI/bge-small-en-v1.5'

# bge models are trained with an instruction prefix for queries (not for
# the documents/chunks being indexed) — using it measurably improves
# retrieval quality for this model family specifically. Applied manually
# here (rather than relying on fastembed's own query_embed() convenience
# method) so the exact prefix text stays identical to what was used
# before this change, rather than trusting a library default to match it.
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
            # fastembed/onnxruntime to be installed unless embeddings are
            # actually used (keeps e.g. `manage.py shell` fast, and keeps
            # this module importable in environments — like CI steps that
            # don't touch the chatbot — without pulling in onnxruntime).
            from fastembed import TextEmbedding

            logger.info('embedding_model_load', extra={'model': EMBEDDING_MODEL_NAME})
            _model = TextEmbedding(model_name=EMBEDDING_MODEL_NAME)
    return _model


def embed_documents(texts):
    """Embed a batch of chunk texts for storage. Returns a list of float lists."""
    if not texts:
        return []
    model = _get_model()
    vectors = list(model.embed(list(texts)))
    return [v.tolist() for v in vectors]


def embed_query(text):
    """Embed a single user query for similarity search against stored chunks."""
    model = _get_model()
    vector = next(model.embed([_QUERY_INSTRUCTION + text]))
    return vector.tolist()
