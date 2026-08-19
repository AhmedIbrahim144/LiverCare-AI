"""
الملف ده مسؤول عن:
- إدارة قاعدة البيانات البسيطة (JSON-based storage)
- حفظ وقراءة ملف المريض (Profile)
- حفظ وقراءة نتائج التحاليل المخبرية (Labs)
- حفظ وقراءة سجل التتبع الصحي (Tracking)
"""

import json
from pathlib import Path
from datetime import datetime

import sys
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
import config


# مجلد التخزين - كل البيانات بتتخزن هنا كـ JSON files
DATA_STORE = config.BASE_DIR / "data" / "store"


def _ensure_store():
    """التأكد من وجود مجلد التخزين - لو مش موجود بننشأه"""
    DATA_STORE.mkdir(parents=True, exist_ok=True)


def _load_json(filename: str) -> dict:
    """قراءة ملف JSON - لو الملف مش موجود بيرجع dict فاضي"""
    _ensure_store()
    filepath = DATA_STORE / filename
    if filepath.exists():
        with open(filepath, "r", encoding="utf-8") as f:
            return json.load(f)
    return {}


def _save_json(filename: str, data: dict):
    """حفظ البيانات في ملف JSON"""
    _ensure_store()
    filepath = DATA_STORE / filename
    with open(filepath, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)


# ═══════════════════════════════════════════════════════════
# إدارة ملف المريض (Profile)
# ═══════════════════════════════════════════════════════════

def save_profile(profile: dict) -> dict:
    """حفظ أو تحديث ملف المريض - بيضيف timestamps تلقائياً"""
    profile["updated_at"] = datetime.now().isoformat()
    if "created_at" not in profile:
        profile["created_at"] = profile["updated_at"]
    _save_json("profile.json", profile)
    return profile


def get_profile() -> dict:
    """الحصول على ملف المريض الحالي"""
    return _load_json("profile.json")


# ═══════════════════════════════════════════════════════════
# إدارة التحاليل المخبرية (Labs)
# ═══════════════════════════════════════════════════════════

def save_lab(lab: dict) -> dict:
    """إضافة نتيجة تحليل جديد - بيضيف ID وتاريخ تلقائياً"""
    labs = _load_json("labs.json")
    if "entries" not in labs:
        labs["entries"] = []
    lab["id"] = len(labs["entries"]) + 1
    lab["recorded_at"] = datetime.now().isoformat()
    labs["entries"].append(lab)
    _save_json("labs.json", labs)
    return lab


def get_labs() -> dict:
    """الحصول على جميع التحاليل المخبرية"""
    return _load_json("labs.json")


# ═══════════════════════════════════════════════════════════
# إدارة التتبع الصحي (Tracking)
# ═══════════════════════════════════════════════════════════

def save_tracking(entry: dict) -> dict:
    """إضافة سجل تتبع جديد (وزن، نشاط، ملاحظات)"""
    tracking = _load_json("tracking.json")
    if "entries" not in tracking:
        tracking["entries"] = []
    entry["id"] = len(tracking["entries"]) + 1
    entry["recorded_at"] = datetime.now().isoformat()
    tracking["entries"].append(entry)
    _save_json("tracking.json", tracking)
    return entry


def get_tracking() -> dict:
    """الحصول على جميع سجلات التتبع"""
    return _load_json("tracking.json")
