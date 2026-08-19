"""Standalone ingestion script - run this directly."""
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))

print("Starting ingestion...")
print("Step 1: Importing config...")
import config
print(f"  Config loaded. DATA_DIR={config.DATA_DIR}")

print("Step 2: Loading documents...")
from rag.loader import load_documents
docs = load_documents(config.DATA_DIR)
print(f"  Loaded {len(docs)} pages")

print("Step 3: Chunking...")
from rag.chunker import chunk_documents
chunks = chunk_documents(docs)
print(f"  Created {len(chunks)} chunks")

print("Step 4: Building vectorstore (this may take a while for first run - downloading embedding model)...")
from rag.vectorstore import build_vectorstore
vectordb = build_vectorstore(chunks)
print("  Vectorstore built!")

print("Step 5: Verifying...")
from rag.vectorstore import get_collection_stats
stats = get_collection_stats()
print(f"  Collection: {stats['collection_name']}")
print(f"  Document count: {stats['document_count']}")

print("\nIngestion complete!")
print(f"  Documents: {len(set(d.metadata.get('document_name','') for d in docs))}")
print(f"  Pages: {len(docs)}")
print(f"  Chunks: {len(chunks)}")
print(f"  Vector DB: {config.CHROMA_DIR}")
