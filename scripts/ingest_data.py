import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from backend.rag.ingest import ingest

if __name__ == "__main__":
    ingest()
