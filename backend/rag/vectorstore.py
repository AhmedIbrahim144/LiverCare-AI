"""
ChromaDB vector store management.
Handles creation, querying, and deletion of the vector database.
"""

import shutil
from pathlib import Path
import chromadb
from langchain_chroma import Chroma
from backend.config import CHROMA_DIR, COLLECTION_NAME
from backend.rag.embeddings import get_embeddings


def get_vectorstore(embeddings=None, persist_dir=None):
    """Open existing ChromaDB for querying."""
    persist_dir = persist_dir or str(CHROMA_DIR)
    embeddings = embeddings or get_embeddings()
    return Chroma(
        collection_name=COLLECTION_NAME,
        embedding_function=embeddings,
        persist_directory=persist_dir,
    )


def create_vectorstore(docs, embeddings=None, persist_dir=None):
    """Create ChromaDB from documents (full rebuild)."""
    persist_dir = persist_dir or str(CHROMA_DIR)
    embeddings = embeddings or get_embeddings()
    CHROMA_DIR.mkdir(parents=True, exist_ok=True)

    vectordb = Chroma.from_documents(
        documents=docs,
        embedding=embeddings,
        collection_name=COLLECTION_NAME,
        persist_directory=persist_dir,
    )
    return vectordb


def get_collection_count(persist_dir=None):
    """Get number of vectors in ChromaDB."""
    persist_dir = persist_dir or str(CHROMA_DIR)
    try:
        client = chromadb.PersistentClient(path=persist_dir)
        collection = client.get_collection(COLLECTION_NAME)
        return collection.count()
    except Exception:
        return 0


def delete_vectorstore(persist_dir=None):
    """Delete ChromaDB directory for clean rebuild."""
    persist_dir = persist_dir or str(CHROMA_DIR)
    chroma_path = Path(persist_dir)
    if chroma_path.exists():
        shutil.rmtree(str(chroma_path))
        print(f"  Deleted vector store at {chroma_path}")
