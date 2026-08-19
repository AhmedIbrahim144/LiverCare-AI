"""
LiverCare AI - Data Copier
Copies relevant documents from source to project data directory.
"""

import shutil
from pathlib import Path

import sys
sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "backend"))
import config

SOURCE_DIR = Path(r"C:\Users\MSI2\Desktop\LIVER")

RELEVANT_FILES = [
    "EASL?EASD?EASO-Clinical-Practice-Guidelines-on-the.pdf",
    "aasld-practice-guidance-on-the-clinical-assessment-and.pdf",
    "nihms-1948413.pdf",
    "FGF21-agonists--An-emerging-therapeutic-for-metabo.pdf",
    "EMC10-modulates-hepatic-ER-stress-and-steatosis-in.pdf",
    "Genetic-risk-accentuates-dietary-effects-on-hepati.pdf",
    "cp-2013-2-e17.pdf",
    "crg-0006-0538.pdf",
    "Individuals-with-cardiometabolic-risk-factors-are-.pdf",
    "JGH3-7-231.pdf",
    "Sex-specific-associations-of-steatotic-liver-disea.pdf",
]


def copy_documents():
    """Copy relevant PDFs to the project data directory."""
    dest_dir = config.DATA_DIR
    dest_dir.mkdir(parents=True, exist_ok=True)

    print(f"Copying {len(RELEVANT_FILES)} relevant documents to {dest_dir}")

    copied = 0
    for filename in RELEVANT_FILES:
        src = SOURCE_DIR / filename
        dst = dest_dir / filename

        if not src.exists():
            print(f"  [SKIP] Source not found: {filename}")
            continue

        if dst.exists():
            print(f"  [EXISTS] {filename}")
            copied += 1
            continue

        shutil.copy2(src, dst)
        print(f"  [COPIED] {filename}")
        copied += 1

    print(f"\nDone. {copied}/{len(RELEVANT_FILES)} files available in {dest_dir}")


if __name__ == "__main__":
    copy_documents()
