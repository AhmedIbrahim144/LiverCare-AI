# LiverCare AI

## Personalized AI Assistant for Fatty Liver Patients

---

## Overview

LiverCare AI is a Day 1 prototype of a medical Retrieval-Augmented Generation (RAG) system designed specifically for patients with fatty liver disease (MASLD/NAFLD). It retrieves trusted medical information from peer-reviewed sources and provides grounded, cited answers to patient questions about fatty liver disease, nutrition, lifestyle, and laboratory information.

## Problem

Fatty liver disease affects a large and growing number of patients worldwide. Patients often struggle to find trustworthy, easy-to-understand medical information. They may rely on unreliable internet sources, which can lead to confusion, anxiety, or harmful self-treatment decisions.

## Solution

LiverCare AI provides a safe, evidence-based AI assistant that:

- Retrieves information only from trusted medical sources
- Generates answers grounded in retrieved evidence with citations
- Supports both Arabic and English
- Uses simple, patient-friendly language
- Clearly refuses high-risk medical requests (medication changes, diagnoses)
- Never replaces a qualified healthcare professional

## Features

- **PDF Ingestion**: Parse medical PDFs with page-level metadata
- **Recursive Chunking**: Section-aware text splitting with configurable parameters
- **Multilingual Embeddings**: BAAI/bge-small-en-v1.5 (local, free)
- **ChromaDB Vector Store**: Persistent vector storage
- **Retrieval**: Top-k similarity search with relevance scoring
- **Grounded Generation**: LLM-powered answers from retrieved evidence (Ollama/OpenAI/fallback)
- **Citations**: Document name, page number, and relevance scores
- **Safety Layer**: Regex-based detection of high-risk medical requests
- **Bilingual UI**: Arabic (RTL) and English (LTR) with language toggle
- **Patient Profile**: Name, age, sex, BMI, comorbidities, activity level
- **Health Tracking**: Weight, activity, and notes over time
- **Lab Explanation**: Query lab test explanations through the RAG pipeline

## Architecture

```
Medical PDFs
    |
Document Loading (PyPDFLoader)
    |
PDF Parsing (page-level)
    |
Recursive Chunking (1600 chars, 200 overlap)
    |
Metadata Generation (document, page, chunk_id)
    |
Embeddings (BAAI/bge-small-en-v1.5, local)
    |
ChromaDB (persistent storage)
    |
Retriever (top-k similarity search)
    |
Relevant Context + Patient Profile
    |
LLM (Ollama / OpenAI / Offline Fallback)
    |
Grounded Answer + Citations
```

## Data Sources

12 medical PDFs covering fatty liver guidelines, NAFLD research, metabolic risk factors, and clinical management. See [DATA_SOURCES.md](DATA_SOURCES.md) for full inventory.

## Installation

```bash
# Clone or download the project
cd D:\LiverCare-AI

# Create virtual environment (optional but recommended)
python -m venv .venv
.venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
copy .env.example .env
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `EMBEDDING_PROVIDER` | `local` | `local` (free) or `openai` |
| `LLM_PROVIDER` | `ollama` | `ollama`, `openai`, or leave for fallback |
| `OLLAMA_BASE_URL` | `http://localhost:11434` | Ollama server URL |
| `OLLAMA_MODEL` | `llama3.2` | Ollama model name |
| `OPENAI_API_KEY` | | Required only for OpenAI |

## Ingestion

```bash
python scripts/ingest_all.py
```

Expected output:
```
Documents processed: 12
Pages processed: 229
Chunks created: 890
Collection count: 890
Vector store: D:\LiverCare-AI\vector_db\chroma
```

## Running the Backend

```bash
python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
```

## Running the Frontend

Open http://localhost:8000 in your browser. The frontend is served by the FastAPI backend.

## Testing

```bash
# Test retrieval
python scripts/test_retrieval.py

# Test full pipeline (English + Arabic + safety)
python scripts/test_all.py
```

## Safety Limitations

This system **CANNOT**:

- Diagnose diseases
- Prescribe medication
- Tell patients to start, stop, or change medication
- Replace a doctor
- Generate unsupported medical claims

This system **SHOULD**:

- Retrieve information from trusted sources
- Generate answers grounded in evidence
- Provide citations
- Support Arabic and English
- Clearly indicate when evidence is insufficient

## Project Structure

```
LiverCare-AI/
├── backend/
│   ├── main.py              # FastAPI application
│   ├── config.py            # Central configuration
│   ├── api/
│   │   ├── chat.py          # Chat endpoint
│   │   ├── profile.py       # Profile endpoint
│   │   └── tracking.py      # Tracking endpoint
│   ├── rag/
│   │   ├── ingest.py        # Ingestion pipeline
│   │   ├── loader.py        # PDF loader
│   │   ├── chunker.py       # Text splitter
│   │   ├── embeddings.py    # Embedding provider
│   │   ├── vectorstore.py   # ChromaDB management
│   │   ├── retriever.py     # Similarity retrieval
│   │   └── citations.py     # Citation formatting
│   ├── ai/
│   │   ├── llm.py           # LLM integration
│   │   ├── prompts.py       # System prompts
│   │   └── safety.py        # Safety layer
│   └── database/
│       ├── database.py      # JSON storage
│       └── models.py        # Pydantic models
├── frontend/
│   ├── index.html           # Main UI
│   ├── styles.css           # Styles (RTL/LTR)
│   └── app.js               # Frontend logic
├── data/
│   ├── raw/                 # Source PDFs
│   └── metadata/            # Ingestion logs
├── vector_db/
│   └── chroma/              # ChromaDB index
├── scripts/
│   ├── ingest_all.py        # Full ingestion
│   ├── test_retrieval.py    # Retrieval tests
│   └── test_all.py          # Full pipeline tests
├── requirements.txt
├── .env.example
├── run.bat
└── README.md
```

## Future Improvements

- Advanced evaluation metrics (Precision@k, Recall@k)
- Section-aware chunking
- Hybrid search (dense + sparse)
- Session memory and conversation history
- Multi-turn dialogue
- Advanced analytics dashboard
- Doctor dashboard
- Mobile application

## Disclaimer

This is a prototype system for informational purposes only. It is not a medical diagnostic tool. Always consult a qualified healthcare professional for medical decisions.

---

**Built with**: LangChain, ChromaDB, FastEmbed, FastAPI, PyPDF
