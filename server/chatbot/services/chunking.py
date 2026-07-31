"""
Paragraph-aware Markdown chunking — no langchain-text-splitters dependency
needed for what's fundamentally "split on blank lines, fall back to
sentences, cap the size."

Chunk size: ~800 characters (~150-200 tokens for typical English prose).
Overlap: ~120 characters.

Why these numbers: articles are Markdown SOPs/how-tos structured as
headings + short paragraphs/numbered steps. Splitting on paragraph
boundaries first means a chunk essentially never cuts a single step or
sentence in half, which matters a lot for "does this chunk retrieve as a
complete, self-contained thought." 800 characters keeps 4-5 retrieved
chunks + the system prompt + conversation history + the question
comfortably inside an 8K-context model's budget with room left for the
answer, while staying large enough to avoid pathological over-fragmentation
of already-short SOP steps into meaningless slivers. The 120-character
overlap exists so a sentence that lands right at a chunk boundary is still
findable/coherent from the chunk on either side of the cut.
"""
import re

CHUNK_SIZE = 800
CHUNK_OVERLAP = 120


def _split_paragraphs(text):
    return [p.strip() for p in re.split(r'\n\s*\n', text) if p.strip()]


def _split_sentences(paragraph):
    # Simple, dependency-free sentence boundary heuristic — good enough for
    # English prose/SOP steps; not attempting full NLP sentence segmentation.
    return [s.strip() for s in re.split(r'(?<=[.!?])\s+', paragraph) if s.strip()]


def chunk_text(text, chunk_size=CHUNK_SIZE, overlap=CHUNK_OVERLAP):
    """
    Returns a list of chunk strings. Packs whole paragraphs (then, if a
    single paragraph alone exceeds chunk_size, whole sentences) into chunks
    up to `chunk_size`, carrying the trailing `overlap` characters of a
    chunk into the start of the next one.
    """
    if not text or not text.strip():
        return []

    paragraphs = _split_paragraphs(text)
    units = []
    for para in paragraphs:
        if len(para) <= chunk_size:
            units.append(para)
        else:
            units.extend(_split_sentences(para))

    chunks = []
    current = ''
    for unit in units:
        candidate = f"{current}\n\n{unit}" if current else unit
        if len(candidate) <= chunk_size:
            current = candidate
            continue

        if current:
            chunks.append(current)
            # carry a trailing slice forward as overlap context
            tail = current[-overlap:]
            current = f"{tail}\n\n{unit}" if tail else unit
        else:
            # a single unit longer than chunk_size on its own — hard-split it
            for i in range(0, len(unit), chunk_size - overlap or chunk_size):
                chunks.append(unit[i:i + chunk_size])
            current = ''

    if current:
        chunks.append(current)

    return chunks
