"""
Ingestion pipeline: load PDFs → chunk → embed → store in ChromaDB.
Supports category-based data directories and provides progress feedback.
"""

import sys
import time
import shutil
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from backend.rag.loader import load_pdfs, get_document_stats
from backend.rag.chunker import chunk_documents, get_chunk_stats
from backend.rag.vectorstore import create_vectorstore, get_collection_count, delete_vectorstore
from backend.rag.embeddings import get_embeddings
from backend.config import DATA_DIR, SOURCE_DATA_DIR, DATA_CATEGORIES


def ingest(source_dir=None, clean=True):
    """
    Full ingestion pipeline:
    1. Optionally copy PDFs from source to category directories
    2. Load all PDFs with category metadata
    3. Chunk documents
    4. Create embeddings and store in ChromaDB
    """
    source_dir = source_dir or SOURCE_DATA_DIR

    print("=" * 60)
    print("LiverCare AI - Data Ingestion Pipeline")
    print("=" * 60)

    # ═══════════════════════════════════════════════════════
    # Step 0: Clean existing ChromaDB if requested
    # ═══════════════════════════════════════════════════════
    if clean:
        print("\n[0/5] Cleaning existing vector store...")
        delete_vectorstore()

    # ═══════════════════════════════════════════════════════
    # Step 1: Copy PDFs from source (if source exists)
    # ═══════════════════════════════════════════════════════
    if source_dir.exists():
        print(f"\n[1/5] Copying PDFs from {source_dir}...")
        _copy_source_pdfs(source_dir)
    else:
        print(f"\n[1/5] Source directory not found: {source_dir}")
        print("      Using existing files in data/ directories.")

    # ═══════════════════════════════════════════════════════
    # Step 2: Load documents
    # ═══════════════════════════════════════════════════════
    print("\n[2/5] Loading documents...")
    t0 = time.time()
    docs, file_info = load_pdfs()
    stats = get_document_stats(docs)
    load_time = time.time() - t0

    loaded = [f for f in file_info if f["status"] == "loaded"]
    errors = [f for f in file_info if f["status"].startswith("error")]
    skipped = [f for f in file_info if "skipped" in f["status"]]

    print(f"  Documents: {stats['total_documents']}")
    print(f"  Pages: {stats['total_pages']}")
    print(f"  Categories: {', '.join(sorted(stats['categories']))}")
    print(f"  Loaded: {len(loaded)} | Errors: {len(errors)} | Skipped: {len(skipped)}")
    print(f"  Time: {load_time:.1f}s")

    if errors:
        print("\n  Errors:")
        for e in errors:
            print(f"    - {e['filename']}: {e['status']}")

    # ═══════════════════════════════════════════════════════
    # Step 3: Chunk documents
    # ═══════════════════════════════════════════════════════
    print("\n[3/5] Chunking documents...")
    t0 = time.time()
    chunked = chunk_documents(docs)
    chunk_stats = get_chunk_stats(chunked)
    chunk_time = time.time() - t0

    print(f"  Chunks: {chunk_stats['total_chunks']}")
    print(f"  Documents with chunks: {chunk_stats['documents_with_chunks']}")
    print(f"  Time: {chunk_time:.1f}s")

    # ═══════════════════════════════════════════════════════
    # Step 4: Create embeddings and store
    # ═══════════════════════════════════════════════════════
    print("\n[4/5] Creating embeddings and storing in ChromaDB...")
    t0 = time.time()
    embeddings = get_embeddings()
    vectordb = create_vectorstore(chunked, embeddings)
    embed_time = time.time() - t0

    count = get_collection_count()
    print(f"  Vectors stored: {count}")
    print(f"  Time: {embed_time:.1f}s")

    # ═══════════════════════════════════════════════════════
    # Step 5: Summary
    # ═══════════════════════════════════════════════════════
    total_time = load_time + chunk_time + embed_time
    print(f"\n[5/5] Ingestion complete!")
    print(f"  Total time: {total_time:.1f}s")
    print(f"  Documents: {stats['total_documents']}")
    print(f"  Pages: {stats['total_pages']}")
    print(f"  Chunks: {chunk_stats['total_chunks']}")
    print(f"  Vector store: {str(Path('./vector_db/chroma').resolve())}")
    print("=" * 60)

    return {
        "documents": stats['total_documents'],
        "pages": stats['total_pages'],
        "chunks": chunk_stats['total_chunks'],
        "vector_store_path": str(Path('./vector_db/chroma').resolve()),
        "load_time": load_time,
        "chunk_time": chunk_time,
        "embed_time": embed_time,
        "total_time": total_time,
    }


def _copy_source_pdfs(source_dir):
    """Copy PDFs from source directory to appropriate category directories."""
    # Keywords for classification
    nutrition_kw = [
        'diet', 'nutri', 'food', 'protein', 'amino', 'vitamin',
        'supplement', 'curcumin', 'silymarin', 'polyphenol',
        'mediterranean', 'hesperidin', 'naringin', 'anthocyanin',
        'omega-3', 'zinc', 'postbiotic', 'fermentation',
        'dietary', 'whole body', 'sarcopenic',
    ]
    laboratory_kw = [
        'assay', 'biomarker', 'chromatography', 'spectrometry',
        'liquid chromatography', 'mass spectrometry', 'high-throughput',
        'cell-based', 'scoring system', 'metrics',
    ]

    # Get root PDFs
    root_pdfs = [p for p in source_dir.glob("*.pdf") if "(1)" not in p.name]
    # Get subfolder PDFs
    sub_pdfs = [p for p in source_dir.glob("Metabolism*/*.pdf") if "(1)" not in p.name]
    all_pdfs = root_pdfs + sub_pdfs

    copied = 0
    for pdf in all_pdfs:
        name_lower = pdf.stem.lower()
        if any(kw in name_lower for kw in nutrition_kw):
            cat = "nutrition"
        elif any(kw in name_lower for kw in laboratory_kw):
            cat = "laboratory"
        else:
            cat = "healthcare"

        dest = DATA_CATEGORIES[cat] / pdf.name
        if not dest.exists():
            shutil.copy2(str(pdf), str(dest))
            copied += 1

    print(f"  Copied {copied} new files to category directories.")


if __name__ == "__main__":
    ingest()
