"""
LiverCare AI - Test Runner
Run all tests: retrieval, RAG, safety.
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "backend"))
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from scripts.test_retrieval import test_retrieval
from scripts.test_rag import test_rag


if __name__ == "__main__":
    print("Running all tests...\n")

    test_retrieval()
    print("\n\n")
    test_rag()

    print("\n\nAll tests completed!")
