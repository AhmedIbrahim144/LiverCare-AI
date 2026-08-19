"""
الملف ده مسؤول عن:
- Endpoints للتتبع الصحي وتسجيل التحاليل
- GET /api/track: الحصول على سجلات التتبع
- POST /api/track: إضافة سجل تتبع جديد
- GET /api/labs: الحصول على التحاليل المخبرية
- POST /api/labs: إضافة تحليل مخبري جديد
"""

from fastapi import APIRouter

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from backend.database.models import TrackingEntry, LabEntry
from backend.database.database import save_tracking, get_tracking, save_lab, get_labs

router = APIRouter(prefix="/api", tags=["tracking"])


@router.get("/track")
async def track_get():
    """الحصول على جميع سجلات التتبع (الوزن، النشاط، الملاحظات)"""
    return get_tracking() or {"entries": []}


@router.post("/track")
async def track_post(request: TrackingEntry):
    """إضافة سجل تتبع جديد"""
    entry = request.model_dump(exclude_none=True)
    saved = save_tracking(entry)
    return saved


@router.get("/labs")
async def labs_get():
    """الحصول على جميع التحاليل المخبرية"""
    return get_labs() or {"entries": []}


@router.post("/labs")
async def labs_post(request: LabEntry):
    """إضافة نتيجة تحليل مخبري جديد"""
    entry = request.model_dump(exclude_none=True)
    saved = save_lab(entry)
    return saved
