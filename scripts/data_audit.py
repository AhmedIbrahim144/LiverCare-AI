"""
LiverCare AI - Data Audit Script
Scans source documents and creates an inventory.
"""

import os
import json
from pathlib import Path
from datetime import datetime

import sys
sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "backend"))
import config

SOURCE_DIR = Path(r"C:\Users\MSI2\Desktop\LIVER")


def get_pdf_info(pdf_path: Path) -> dict:
    """Get basic info about a PDF file."""
    info = {
        "filename": pdf_path.name,
        "file_size_bytes": pdf_path.stat().st_size,
        "file_size_mb": round(pdf_path.stat().st_size / (1024 * 1024), 2),
        "extension": pdf_path.suffix,
    }

    try:
        from pypdf import PdfReader
        reader = PdfReader(str(pdf_path))
        info["page_count"] = len(reader.pages)
        info["is_readable"] = True
    except Exception as e:
        info["page_count"] = 0
        info["is_readable"] = False
        info["error"] = str(e)

    return info


def classify_relevance(filename: str) -> str:
    """Classify document relevance based on filename."""
    high_keywords = [
        "easl", "aasld", "nafld", "masld", "fatty", "steatosis", "steatotic",
        "fgf21", "emc10", "genetic-risk", "cardiometabolic", "jgh3-7-231",
        "nihms-1948413", "cp-2013", "crg-0006", "sex-specific",
    ]
    medium_keywords = [
        "editor", "contents", "glance", "board", "overweight",
    ]

    fn_lower = filename.lower()
    for kw in high_keywords:
        if kw in fn_lower:
            return "highly_relevant"
    for kw in medium_keywords:
        if kw in fn_lower:
            return "somewhat_relevant"
    return "not_relevant"


def run_audit():
    """Run the data audit."""
    print("=" * 60)
    print("LiverCare AI - Data Audit")
    print("=" * 60)

    if not SOURCE_DIR.exists():
        print(f"Source directory not found: {SOURCE_DIR}")
        return

    pdf_files = sorted(SOURCE_DIR.glob("*.pdf"))
    print(f"\nFound {len(pdf_files)} PDF files in {SOURCE_DIR}")

    inventory = []
    for pdf_file in pdf_files:
        print(f"  Scanning: {pdf_file.name}...", end=" ")
        info = get_pdf_info(pdf_file)
        info["relevance"] = classify_relevance(pdf_file.name)
        info["source_path"] = str(pdf_file)
        info["topic"] = "fatty_liver" if info["relevance"] == "highly_relevant" else (
            "liver_general" if info["relevance"] == "somewhat_relevant" else "other"
        )
        info["processing_status"] = "pending"
        info["duplicate_status"] = "unique"
        inventory.append(info)
        print(f"{info['page_count']} pages, {info['relevance']}")

    summary = {
        "total_files": len(inventory),
        "highly_relevant": sum(1 for i in inventory if i["relevance"] == "highly_relevant"),
        "somewhat_relevant": sum(1 for i in inventory if i["relevance"] == "somewhat_relevant"),
        "not_relevant": sum(1 for i in inventory if i["relevance"] == "not_relevant"),
        "readable": sum(1 for i in inventory if i.get("is_readable", False)),
        "total_pages": sum(i["page_count"] for i in inventory),
        "audit_date": datetime.now().isoformat(),
    }

    print("\n" + "=" * 60)
    print("Audit Summary")
    print("=" * 60)
    for k, v in summary.items():
        print(f"  {k}: {v}")

    config.METADATA_DIR.mkdir(parents=True, exist_ok=True)
    inventory_path = config.METADATA_DIR / "data_inventory.json"
    with open(inventory_path, "w", encoding="utf-8") as f:
        json.dump({"summary": summary, "files": inventory}, f, indent=2, ensure_ascii=False)
    print(f"\nInventory saved to: {inventory_path}")

    relevant = [i for i in inventory if i["relevance"] in ("highly_relevant", "somewhat_relevant")]
    processed_dir = config.DATA_DIR
    processed_dir.mkdir(parents=True, exist_ok=True)
    print(f"\nRelevant files ({len(relevant)}):")
    for item in relevant:
        print(f"  [{item['relevance']}] {item['filename']} ({item['page_count']} pages)")

    return {"summary": summary, "inventory": inventory}


if __name__ == "__main__":
    run_audit()
