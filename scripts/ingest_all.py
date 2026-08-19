"""
الملف ده مسؤول عن:
- سكريبت Ingestion مباشر ومستقل
- بيعمل كل حاجة: تحميل PDFs، Chunking، Embeddings، ChromaDB
- بيحفظ log للـ Ingestion في data/metadata
"""

import sys
sys.path.insert(0, '.')

from pathlib import Path
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_chroma import Chroma
from backend.config import RAW_DATA_DIR, CHROMA_DIR, CHUNK_SIZE, CHUNK_OVERLAP, COLLECTION_NAME, METADATA_DIR
from backend.rag.embeddings import get_embeddings

print("=" * 60)
print("LiverCare AI - Full Ingestion")
print("=" * 60)

# البحث عن ملفات PDF في المجلد الخام
pdf_files = sorted(RAW_DATA_DIR.glob("*.pdf"))
print(f"\nFound {len(pdf_files)} PDF files")

all_docs = []
loaded_files = []
failed_files = []

# الخطوة 1: تحميل كل PDF
for pdf in pdf_files:
    try:
        loader = PyPDFLoader(str(pdf))
        pages = loader.load()
        # إضافة Metadata لكل صفحة
        for page in pages:
            page.metadata["document_name"] = pdf.stem
            page.metadata["page_number"] = page.metadata.get("page", 0) + 1
            page.metadata["source_type"] = "medical_guideline"
        all_docs.extend(pages)
        loaded_files.append({"name": pdf.name, "pages": len(pages)})
        print(f"  OK: {pdf.name} -> {len(pages)} pages")
    except Exception as e:
        failed_files.append({"name": pdf.name, "error": str(e)})
        print(f"  FAIL: {pdf.name} -> {e}")

print(f"\nLoaded {len(all_docs)} pages from {len(loaded_files)} documents")
if failed_files:
    print(f"Failed: {len(failed_files)} documents")

# الخطوة 2: تقسيم النص إلى Chunks
print(f"\nChunking (size={CHUNK_SIZE}, overlap={CHUNK_OVERLAP})...")
splitter = RecursiveCharacterTextSplitter(
    chunk_size=CHUNK_SIZE,
    chunk_overlap=CHUNK_OVERLAP,
    separators=["\n\n", "\n", ". ", " ", ""],
    length_function=len,
)
chunks = splitter.split_documents(all_docs)
# إضافة chunk_id فريد لكل chunk
for i, chunk in enumerate(chunks):
    doc_name = chunk.metadata.get("document_name", "unknown")
    page_num = chunk.metadata.get("page_number", 0)
    chunk.metadata["chunk_id"] = f"{doc_name}-p{page_num}-c{i}"
print(f"Created {len(chunks)} chunks")

# الخطوة 3: إنشاء Embeddings وتخزينها في ChromaDB
print("\nEmbedding and storing in ChromaDB...")
embeddings = get_embeddings()
CHROMA_DIR.mkdir(parents=True, exist_ok=True)
vectordb = Chroma.from_documents(
    documents=chunks,
    embedding=embeddings,
    collection_name=COLLECTION_NAME,
    persist_directory=str(CHROMA_DIR),
)
count = vectordb._collection.count()
print(f"Collection count: {count}")

# حفظ إحصائيات الـ Ingestion
import json
from datetime import datetime
stats = {
    "status": "success",
    "documents_processed": len(loaded_files),
    "pages_processed": len(all_docs),
    "chunks_created": len(chunks),
    "embeddings_created": len(chunks),
    "vector_store": str(CHROMA_DIR),
    "loaded_files": loaded_files,
    "failed_files": failed_files,
    "embedding_model": "BAAI/bge-small-en-v1.5",
    "timestamp": datetime.now().isoformat(),
}
METADATA_DIR.mkdir(parents=True, exist_ok=True)
with open(METADATA_DIR / "ingestion_log.json", "w") as f:
    json.dump(stats, f, indent=2)

print("\n" + "=" * 60)
print("INGESTION COMPLETE")
print(f"  Documents processed: {len(loaded_files)}")
print(f"  Pages processed: {len(all_docs)}")
print(f"  Chunks created: {len(chunks)}")
print(f"  Collection count: {count}")
print(f"  Vector store: {CHROMA_DIR}")
print("=" * 60)
