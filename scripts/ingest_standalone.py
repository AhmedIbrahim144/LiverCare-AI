"""
LiverCare AI - Complete Ingestion Script
Self-contained script that handles the entire pipeline.
Run from project root: python scripts/ingest_standalone.py
"""
import sys
import os
import json
from pathlib import Path
from datetime import datetime

PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT / "backend"))
os.chdir(str(PROJECT_ROOT))

DATA_DIR = PROJECT_ROOT / "data" / "processed"
CHROMA_DIR = PROJECT_ROOT / "vector_db" / "chroma"
METADATA_DIR = PROJECT_ROOT / "data" / "metadata"
COLLECTION_NAME = "livercare_medical_kb"
CHUNK_SIZE = 1600
CHUNK_OVERLAP = 200

print("=" * 60)
print("LiverCare AI - Document Ingestion Pipeline")
print("=" * 60)

print("\n[1/5] Loading PDFs...")
from langchain_community.document_loaders import PyPDFLoader

all_docs = []
pdf_files = sorted(DATA_DIR.glob("*.pdf"))
print(f"  Found {len(pdf_files)} PDF files")

for pdf_file in pdf_files:
    try:
        loader = PyPDFLoader(str(pdf_file))
        pages = loader.load()
        doc_name = pdf_file.stem
        for page in pages:
            page.metadata["document_name"] = doc_name
            page.metadata["source"] = str(pdf_file)
            page.metadata["source_type"] = "medical_guideline"
            if "page" in page.metadata:
                page.metadata["page_number"] = page.metadata["page"] + 1
            else:
                page.metadata["page_number"] = 0
        all_docs.extend(pages)
        print(f"  Loaded {pdf_file.name}: {len(pages)} pages")
    except Exception as e:
        print(f"  Error loading {pdf_file.name}: {e}")

print(f"\n  Total pages loaded: {len(all_docs)}")
doc_names = set(d.metadata.get("document_name", "unknown") for d in all_docs)
print(f"  Total documents: {len(doc_names)}")

print("\n[2/5] Chunking documents...")
from langchain_text_splitters import RecursiveCharacterTextSplitter

splitter = RecursiveCharacterTextSplitter(
    chunk_size=CHUNK_SIZE,
    chunk_overlap=CHUNK_OVERLAP,
    separators=["\n\n", "\n", ". ", " ", ""],
    length_function=len,
)

chunks = splitter.split_documents(all_docs)
global_idx = 0
for chunk in chunks:
    doc_name = chunk.metadata.get("document_name", "unknown")
    page_num = chunk.metadata.get("page_number", 0)
    chunk.metadata["chunk_id"] = f"{doc_name}-p{page_num}-c{global_idx}"
    global_idx += 1

print(f"  Created {len(chunks)} chunks")

print("\n[3/5] Creating embeddings (downloading model on first run)...")
from langchain_community.embeddings import FastEmbedEmbeddings

embeddings = FastEmbedEmbeddings(model_name="BAAI/bge-small-en-v1.5")
print("  Embedding model loaded")

print("\n[4/5] Building ChromaDB vector store...")
from langchain_chroma import Chroma

CHROMA_DIR.mkdir(parents=True, exist_ok=True)
vectordb = Chroma.from_documents(
    documents=chunks,
    embedding=embeddings,
    collection_name=COLLECTION_NAME,
    persist_directory=str(CHROMA_DIR),
)
print("  Vector store created")

print("\n[5/5] Verifying...")
collection = vectordb._collection
count = collection.count()
print(f"  Collection: {COLLECTION_NAME}")
print(f"  Documents in store: {count}")

result = {
    "status": "success",
    "documents_processed": len(doc_names),
    "pages_processed": len(all_docs),
    "chunks_created": len(chunks),
    "embeddings_created": len(chunks),
    "vector_store": str(CHROMA_DIR),
    "timestamp": datetime.now().isoformat(),
}

METADATA_DIR.mkdir(parents=True, exist_ok=True)
with open(METADATA_DIR / "ingestion_log.json", "w") as f:
    json.dump(result, f, indent=2)

print("\n" + "=" * 60)
print("Ingestion Complete!")
print(f"  Documents processed: {len(doc_names)}")
print(f"  Pages processed: {len(all_docs)}")
print(f"  Chunks created: {len(chunks)}")
print(f"  Embeddings created: {len(chunks)}")
print(f"  Vector store: {CHROMA_DIR}")
print("=" * 60)
