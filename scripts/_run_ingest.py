import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

print("Importing config...")
from backend.config import DATA_DIR
print("Config OK: {}".format(DATA_DIR))

print("Importing loader...")
from backend.rag.loader import load_pdfs
print("Loader OK")

print("Loading PDFs...")
docs, info = load_pdfs(DATA_DIR)
print("Loaded {} pages".format(len(docs)))

print("Importing chunker...")
from backend.rag.chunker import chunk_documents
print("Chunker OK")

print("Chunking...")
chunks = chunk_documents(docs)
print("Created {} chunks".format(len(chunks)))

print("Importing embeddings...")
from backend.rag.embeddings import get_embedding_function
emb_fn = get_embedding_function()
print("Embeddings OK")

print("Building vector store (this may take a while)...")
from backend.rag.vectorstore import build_index
vectordb = build_index(chunks)
print("Vector store built!")

print("Done!")
