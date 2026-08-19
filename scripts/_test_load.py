import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from backend.rag.loader import load_pdfs, ensure_files_copied
from backend.config import DATA_DIR

copied = ensure_files_copied()
print("Copied {} files".format(copied))

docs, info = load_pdfs(DATA_DIR)
print("Loaded {} pages".format(len(docs)))
for f in info:
    print("  {}: {} pages ({})".format(f["filename"], f["pages"], f["status"]))
