"""
Document chunker using RecursiveCharacterTextSplitter.
Splits documents into smaller pieces for efficient retrieval.
"""

from langchain_text_splitters import RecursiveCharacterTextSplitter
from backend.config import CHUNK_SIZE, CHUNK_OVERLAP


def chunk_documents(docs, chunk_size=None, chunk_overlap=None):
    """
    Split documents into chunks with metadata preservation.
    Each chunk gets a unique chunk_id based on document name, page, and index.
    """
    chunk_size = chunk_size or CHUNK_SIZE
    chunk_overlap = chunk_overlap or CHUNK_OVERLAP

    splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap,
        separators=["\n\n", "\n", ". ", " ", ""],
        length_function=len,
    )

    chunked_docs = []
    for doc in docs:
        splits = splitter.split_documents([doc])
        for i, split in enumerate(splits):
            doc_name = split.metadata.get("document_name", "unknown")
            page_num = split.metadata.get("page_number", 0)
            chunk_id = f"{doc_name}-p{page_num}-c{i}"
            split.metadata["chunk_id"] = chunk_id
            split.metadata["chunk_index"] = i
            chunked_docs.append(split)

    return chunked_docs


def get_chunk_stats(chunked_docs):
    """Basic chunk statistics."""
    return {
        "total_chunks": len(chunked_docs),
        "documents_with_chunks": len(set(
            d.metadata.get("document_name", "unknown") for d in chunked_docs
        )),
    }
