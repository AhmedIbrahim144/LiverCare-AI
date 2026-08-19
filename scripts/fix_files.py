import os

files = {}

files['D:/LiverCare-AI/backend/rag/chunker.py'] = '''from langchain_text_splitters import RecursiveCharacterTextSplitter

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
import config


def chunk_documents(documents, chunk_size=None, chunk_overlap=None):
    chunk_size = chunk_size or config.CHUNK_SIZE
    chunk_overlap = chunk_overlap or config.CHUNK_OVERLAP
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap,
        separators=["\\n\\n", "\\n", ". ", " ", ""],
        length_function=len,
    )
    chunks = splitter.split_documents(documents)
    global_idx = 0
    for chunk in chunks:
        doc_name = chunk.metadata.get("document_name", "unknown")
        page_num = chunk.metadata.get("page_number", 0)
        chunk.metadata["chunk_id"] = f"{doc_name}-p{page_num}-c{global_idx}"
        global_idx += 1
    return chunks
'''

files['D:/LiverCare-AI/backend/rag/embeddings.py'] = '''import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
import config


def get_embeddings():
    provider = config.EMBEDDING_PROVIDER
    if provider == "local":
        from langchain_community.embeddings import FastEmbedEmbeddings
        print(f"Using local embedding model: {config.LOCAL_EMBEDDING_MODEL}")
        return FastEmbedEmbeddings(model_name=config.LOCAL_EMBEDDING_MODEL)
    elif provider == "openai":
        if not config.OPENAI_API_KEY:
            raise ValueError("OPENAI_API_KEY required for OpenAI embeddings")
        from langchain_openai import OpenAIEmbeddings
        print(f"Using OpenAI embedding model: {config.OPENAI_EMBEDDING_MODEL}")
        return OpenAIEmbeddings(model=config.OPENAI_EMBEDDING_MODEL)
    else:
        raise ValueError(f"Unknown embedding provider: {provider}")
'''

files['D:/LiverCare-AI/backend/rag/loader.py'] = '''from pathlib import Path
from langchain_community.document_loaders import PyPDFLoader
from langchain_core.documents import Document

import sys
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
import config


def load_pdf(pdf_path):
    pdf_path = Path(pdf_path)
    if not pdf_path.exists():
        raise FileNotFoundError(f"PDF not found: {pdf_path}")
    loader = PyPDFLoader(str(pdf_path))
    pages = loader.load()
    doc_name = pdf_path.stem
    for page in pages:
        page.metadata["document_name"] = doc_name
        page.metadata["source"] = str(pdf_path)
        page.metadata["source_type"] = "medical_guideline"
        if "page" in page.metadata:
            page.metadata["page_number"] = page.metadata["page"] + 1
        else:
            page.metadata["page_number"] = 0
    return pages


def load_documents(data_dir):
    data_dir = Path(data_dir)
    all_docs = []
    pdf_files = sorted(data_dir.glob("*.pdf"))
    if not pdf_files:
        print(f"No PDF files found in {data_dir}")
        return []
    for pdf_file in pdf_files:
        try:
            docs = load_pdf(pdf_file)
            all_docs.extend(docs)
            print(f"  Loaded {pdf_file.name}: {len(docs)} pages")
        except Exception as e:
            print(f"  Error loading {pdf_file.name}: {e}")
    return all_docs
'''

files['D:/LiverCare-AI/backend/rag/vectorstore.py'] = '''import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
import config

from langchain_core.documents import Document
from langchain_chroma import Chroma

from .embeddings import get_embeddings


def get_vectorstore():
    embeddings = get_embeddings()
    config.CHROMA_DIR.mkdir(parents=True, exist_ok=True)
    return Chroma(
        collection_name=config.COLLECTION_NAME,
        embedding_function=embeddings,
        persist_directory=str(config.CHROMA_DIR),
    )


def build_vectorstore(chunks):
    embeddings = get_embeddings()
    config.CHROMA_DIR.mkdir(parents=True, exist_ok=True)
    return Chroma.from_documents(
        documents=chunks,
        embedding=embeddings,
        collection_name=config.COLLECTION_NAME,
        persist_directory=str(config.CHROMA_DIR),
    )


def get_collection_stats():
    vectordb = get_vectorstore()
    collection = vectordb._collection
    count = collection.count()
    return {
        "collection_name": config.COLLECTION_NAME,
        "document_count": count,
        "persist_directory": str(config.CHROMA_DIR),
    }
'''

files['D:/LiverCare-AI/backend/rag/ingest.py'] = '''import sys
import json
from pathlib import Path
from datetime import datetime

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
import config

from rag.loader import load_documents
from rag.chunker import chunk_documents
from rag.vectorstore import build_vectorstore, get_collection_stats


def run_ingestion(data_dir=None):
    data_dir = Path(data_dir) if data_dir else config.DATA_DIR
    print("=" * 60)
    print("LiverCare AI - Document Ingestion Pipeline")
    print("=" * 60)
    print(f"\\nData directory: {data_dir}")
    print(f"Chunk size: {config.CHUNK_SIZE} chars")
    print(f"Chunk overlap: {config.CHUNK_OVERLAP} chars")
    print(f"Embedding provider: {config.EMBEDDING_PROVIDER}")
    print(f"Vector DB path: {config.CHROMA_DIR}")
    print("\\n[1/4] Loading documents...")
    docs = load_documents(data_dir)
    if not docs:
        print("No documents loaded. Aborting.")
        return {"status": "error", "message": "No documents found"}
    page_count = len(docs)
    doc_names = set(d.metadata.get("document_name", "unknown") for d in docs)
    doc_count = len(doc_names)
    print(f"  Loaded {page_count} pages from {doc_count} documents")
    print("\\n[2/4] Chunking documents...")
    chunks = chunk_documents(docs)
    chunk_count = len(chunks)
    print(f"  Created {chunk_count} chunks")
    print("\\n[3/4] Creating embeddings and storing in ChromaDB...")
    vectordb = build_vectorstore(chunks)
    print("  Embeddings created and stored")
    print("\\n[4/4] Verifying...")
    stats = get_collection_stats()
    print(f"  Collection: {stats['collection_name']}")
    print(f"  Documents in store: {stats['document_count']}")
    result = {
        "status": "success",
        "documents_processed": doc_count,
        "pages_processed": page_count,
        "chunks_created": chunk_count,
        "embeddings_created": chunk_count,
        "vector_store": str(config.CHROMA_DIR),
        "timestamp": datetime.now().isoformat(),
    }
    inventory_path = config.METADATA_DIR / "ingestion_log.json"
    inventory_path.parent.mkdir(parents=True, exist_ok=True)
    with open(inventory_path, "w") as f:
        json.dump(result, f, indent=2)
    print("\\n" + "=" * 60)
    print("Ingestion Complete!")
    print(f"  Documents processed: {doc_count}")
    print(f"  Pages processed: {page_count}")
    print(f"  Chunks created: {chunk_count}")
    print(f"  Embeddings created: {chunk_count}")
    print(f"  Vector store: {config.CHROMA_DIR}")
    print("=" * 60)
    return result


if __name__ == "__main__":
    run_ingestion()
'''

files['D:/LiverCare-AI/backend/rag/retriever.py'] = '''import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
import config

from langchain_core.documents import Document

from .vectorstore import get_vectorstore


def retrieve(question, top_k=None):
    top_k = top_k or config.TOP_K
    vectordb = get_vectorstore()
    results = vectordb.similarity_search_with_relevance_scores(question, k=top_k)
    retrieved = []
    for doc, score in results:
        retrieved.append({
            "content": doc.page_content,
            "score": round(score, 4),
            "metadata": {
                "document_name": doc.metadata.get("document_name", "Unknown"),
                "source": doc.metadata.get("source", "Unknown"),
                "page_number": doc.metadata.get("page_number", 0),
                "chunk_id": doc.metadata.get("chunk_id", "Unknown"),
                "section": doc.metadata.get("section", ""),
                "source_type": doc.metadata.get("source_type", "medical_guideline"),
            },
        })
    return retrieved


def retrieve_context(question, top_k=None):
    results = retrieve(question, top_k)
    if not results:
        return ""
    context_parts = []
    for i, r in enumerate(results, 1):
        meta = r["metadata"]
        context_parts.append(
            f"[Source {i}] Document: {meta[\"document_name\"]} | "
            f"Page: {meta[\"page_number\"]} | Chunk: {meta[\"chunk_id\"]}\\n"
            f"{r[\"content\"]}"
        )
    return "\\n\\n---\\n\\n".join(context_parts)
'''

for path, content in files.items():
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f'Written: {path}')

print('All files written successfully.')
