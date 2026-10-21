"""
Configuration for LiverCare AI RAG pipeline.
"""

import os
from pathlib import Path
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")

# ═══════════════════════════════════════════════════════════
# Folder Paths
# ═══════════════════════════════════════════════════════════

DATA_DIR = BASE_DIR / "data"
HEALTHCARE_DIR = DATA_DIR / "healthcare"
NUTRITION_DIR = DATA_DIR / "nutrition"
FOOD_DIR = DATA_DIR / "food"
LABORATORY_DIR = DATA_DIR / "laboratory"
OTHER_DIR = DATA_DIR / "other"

RAW_DATA_DIR = BASE_DIR / "data" / "raw"
METADATA_DIR = BASE_DIR / "data" / "metadata"

CHROMA_DIR = BASE_DIR / "vector_db" / "chroma"
COLLECTION_NAME = "livercare_medical_kb"

SOURCE_DATA_DIR = Path(os.getenv("SOURCE_DATA_DIR", r"C:\Users\MSI2\Desktop\NEW"))

# ═══════════════════════════════════════════════════════════
# Chunking
# ═══════════════════════════════════════════════════════════

CHUNK_SIZE = int(os.getenv("CHUNK_SIZE", "1200"))
CHUNK_OVERLAP = int(os.getenv("CHUNK_OVERLAP", "150"))

# ═══════════════════════════════════════════════════════════
# Retrieval
# ═══════════════════════════════════════════════════════════

# How many raw results to fetch from ChromaDB before filtering
RETRIEVAL_CANDIDATES = int(os.getenv("RETRIEVAL_CANDIDATES", "30"))

# Final number of results to return
TOP_K = int(os.getenv("TOP_K", "8"))

# Minimum relevance score to consider a result relevant
CONFIDENCE_THRESHOLD = float(os.getenv("CONFIDENCE_THRESHOLD", "0.35"))

# Maximum characters for LLM context
MAX_CONTEXT_CHARS = int(os.getenv("MAX_CONTEXT_CHARS", "6000"))

# Evidence strength thresholds
STRONG_EVIDENCE_THRESHOLD = float(os.getenv("STRONG_EVIDENCE_THRESHOLD", "0.70"))
MODERATE_EVIDENCE_THRESHOLD = float(os.getenv("MODERATE_EVIDENCE_THRESHOLD", "0.50"))

# ═══════════════════════════════════════════════════════════
# Embeddings
# ═══════════════════════════════════════════════════════════

EMBEDDING_PROVIDER = os.getenv("EMBEDDING_PROVIDER", "local")
LOCAL_EMBEDDING_MODEL = os.getenv("LOCAL_EMBEDDING_MODEL", "BAAI/bge-small-en-v1.5")
OPENAI_EMBEDDING_MODEL = os.getenv("OPENAI_EMBEDDING_MODEL", "text-embedding-3-small")

# ═══════════════════════════════════════════════════════════
# LLM
# ═══════════════════════════════════════════════════════════

LLM_PROVIDER = os.getenv("LLM_PROVIDER", "ollama")
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "qwen3:8b")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
OPENAI_CHAT_MODEL = os.getenv("OPENAI_CHAT_MODEL", "gpt-4o-mini")

# Google AI Studio (Gemini) - primary/fallback LLM used when Ollama or
# HuggingFace Inference are unavailable.
GEMINI_API_KEY = os.getenv("GOOGLE_API_KEY", "")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-3.6-flash")
GEMINI_MODEL_FALLBACKS = os.getenv(
    "GEMINI_MODEL_FALLBACKS", "gemini-3.7-flash,gemini-3.1-flash-lite-preview"
)
GEMINI_BASE_URL = os.getenv(
    "GEMINI_BASE_URL", "https://generativelanguage.googleapis.com/v1beta"
)

# ═══════════════════════════════════════════════════════════
# Data Categories
# ═══════════════════════════════════════════════════════════

DATA_CATEGORIES = {
    "healthcare": HEALTHCARE_DIR,
    "nutrition": NUTRITION_DIR,
    "food": FOOD_DIR,
    "laboratory": LABORATORY_DIR,
    "other": OTHER_DIR,
}
