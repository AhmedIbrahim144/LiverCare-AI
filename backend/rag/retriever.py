"""
Retriever: semantic search with evidence strength evaluation.
Fetches many candidates, filters by relevance, deduplicates,
and classifies evidence strength (strong/moderate/weak/insufficient).
"""

from backend.config import (
    TOP_K, CONFIDENCE_THRESHOLD, MAX_CONTEXT_CHARS,
    RETRIEVAL_CANDIDATES, STRONG_EVIDENCE_THRESHOLD, MODERATE_EVIDENCE_THRESHOLD,
)
from backend.rag.vectorstore import get_vectorstore


def retrieve(question, k=None, threshold=None, candidates=None):
    """
    Search ChromaDB for chunks relevant to the question.
    Fetches many candidates, filters, deduplicates by document name.
    Returns (results, evidence_strength, top_score).
    """
    k = k or TOP_K
    threshold = threshold or CONFIDENCE_THRESHOLD
    candidates = candidates or RETRIEVAL_CANDIDATES
    vectordb = get_vectorstore()

    raw_results = vectordb.similarity_search_with_relevance_scores(question, k=candidates)

    filtered = [(doc, score) for doc, score in raw_results if score >= threshold]

    if not filtered:
        return [], "insufficient", 0.0

    seen_docs = {}
    deduplicated = []
    for doc, score in filtered:
        doc_name = doc.metadata.get("document_name", "unknown")
        if doc_name not in seen_docs:
            seen_docs[doc_name] = (doc, score)
            deduplicated.append((doc, score))
        elif score > seen_docs[doc_name][1]:
            deduplicated = [
                (d, s) if d.metadata.get("document_name") != doc_name else (doc, score)
                for d, s in deduplicated
            ]
            seen_docs[doc_name] = (doc, score)

    top_score = deduplicated[0][1] if deduplicated else 0.0
    above_strong = sum(1 for _, s in deduplicated if s >= STRONG_EVIDENCE_THRESHOLD)
    above_moderate = sum(1 for _, s in deduplicated if s >= MODERATE_EVIDENCE_THRESHOLD)

    if top_score >= STRONG_EVIDENCE_THRESHOLD and above_strong >= 2:
        strength = "strong"
    elif top_score >= MODERATE_EVIDENCE_THRESHOLD and above_moderate >= 2:
        strength = "moderate"
    elif top_score >= CONFIDENCE_THRESHOLD:
        strength = "weak"
    else:
        strength = "insufficient"

    return deduplicated[:k], strength, top_score


def format_retrieved_context(results):
    """
    Format retrieved results into context string and citations list.
    Truncates context to MAX_CONTEXT_CHARS.
    """
    context_parts = []
    citations = []
    total_chars = 0

    for i, (doc, score) in enumerate(results):
        doc_name = doc.metadata.get("document_name", "Unknown")
        page_num = doc.metadata.get("page_number", "N/A")
        chunk_id = doc.metadata.get("chunk_id", f"chunk-{i}")
        source_type = doc.metadata.get("source_type", "medical_guideline")
        category = doc.metadata.get("category", "unknown")
        content = doc.page_content

        if total_chars + len(content) > MAX_CONTEXT_CHARS:
            remaining = MAX_CONTEXT_CHARS - total_chars
            if remaining > 100:
                content = content[:remaining] + "..."
            else:
                break
        total_chars += len(content)

        context_parts.append(
            f"[Source {i+1}: {doc_name}, Page {page_num}, Category: {category}] "
            f"(Relevance: {score:.3f})\n{content}"
        )

        citations.append({
            "document": doc_name,
            "page": page_num,
            "chunk_id": chunk_id,
            "relevance_score": round(score, 3),
            "source_type": source_type,
            "category": category,
        })

    return "\n\n".join(context_parts), citations
