"""
PDF loader with category support.
Loads PDFs from category-based directories (healthcare, nutrition, food, laboratory, other),
extracts text per page, and attaches metadata including category.
"""

from pathlib import Path
from pypdf import PdfReader
from langchain_core.documents import Document
from backend.config import DATA_DIR, DATA_CATEGORIES


def load_pdfs(data_dir=None, categories=None):
    """
    Load all PDFs from category directories.
    Returns (list[Document], list[dict]) where dict has file info.
    """
    data_dir = data_dir or DATA_DIR
    categories = categories or DATA_CATEGORIES
    all_docs = []
    file_info = []
    seen_names = set()

    for cat_name, cat_dir in categories.items():
        if not cat_dir.exists():
            continue

        pdf_files = sorted(cat_dir.glob("*.pdf"))

        for pdf_path in pdf_files:
            # Deduplicate by stem (skip if same name already loaded from another category)
            stem = pdf_path.stem
            if stem in seen_names:
                file_info.append({
                    "filename": pdf_path.name,
                    "category": cat_name,
                    "pages": 0,
                    "status": "skipped_duplicate",
                })
                continue
            seen_names.add(stem)

            try:
                reader = PdfReader(str(pdf_path))
                pages = []
                for i, page in enumerate(reader.pages):
                    text = page.extract_text() or ""
                    if text.strip():
                        doc = Document(
                            page_content=text,
                            metadata={
                                "document_name": stem,
                                "page_number": i + 1,
                                "source": str(pdf_path),
                                "source_type": "medical_guideline",
                                "category": cat_name,
                            },
                        )
                        pages.append(doc)

                all_docs.extend(pages)
                file_info.append({
                    "filename": pdf_path.name,
                    "category": cat_name,
                    "pages": len(pages),
                    "status": "loaded",
                })
            except Exception as e:
                file_info.append({
                    "filename": pdf_path.name,
                    "category": cat_name,
                    "pages": 0,
                    "status": f"error: {e}",
                })

    return all_docs, file_info


def get_document_stats(docs):
    """Basic stats about loaded documents."""
    names = set(d.metadata.get("document_name", "unknown") for d in docs)
    categories = set(d.metadata.get("category", "unknown") for d in docs)
    return {
        "total_documents": len(names),
        "total_pages": len(docs),
        "document_names": names,
        "categories": categories,
    }
