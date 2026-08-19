"""
الملف ده مسؤول عن:
- Endpoint لإدارة ملف المريض (Profile)
- GET /api/profile: الحصول على الملف الحالي
- POST /api/profile: حفظ أو تحديث الملف
- حساب BMI تلقائياً لو الوزن والطول متوفرين
"""

from fastapi import APIRouter

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from backend.database.models import ProfileRequest
from backend.database.database import save_profile, get_profile

router = APIRouter(prefix="/api", tags=["profile"])


@router.get("/profile")
async def profile_get():
    """الحصول على ملف المريض الحالي"""
    profile = get_profile()
    return profile or {}


@router.post("/profile")
async def profile_post(request: ProfileRequest):
    """
    حفظ أو تحديث ملف المريض
    لو الـ Weight والـ Height متوفرين بنحسب BMI تلقائياً
    """
    profile = request.model_dump(exclude_none=True)

    # حساب BMI تلقائياً لو الوزن والطول متوفرين
    if profile.get("weight") and profile.get("height"):
        try:
            h = float(profile["height"])
            w = float(profile["weight"])
            if h > 0:
                profile["bmi"] = round(w / (h * h), 1)
        except (ValueError, TypeError):
            pass

    saved = save_profile(profile)
    return saved
