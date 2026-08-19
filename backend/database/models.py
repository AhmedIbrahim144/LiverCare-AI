"""
الملف ده مسؤول عن:
- نماذج البيانات (Pydantic Models) للـ API
- ChatRequest / ChatResponse لأسئلة المريض والإجابات
- ProfileRequest لبيانات المريض
- TrackingEntry و LabEntry للتتبع
"""

from pydantic import BaseModel
from typing import Optional


class ChatRequest(BaseModel):
    """نموذج طلب السؤال من المريض"""
    question: str
    lang: str = "en"
    top_k: int = 6


class ChatResponse(BaseModel):
    """نموذج إجابة الـ Chat - فيه الإجابة والمصادر وتنبيه السلامة"""
    answer: str
    citations: list[dict] = []
    citations_text: str = ""
    retrieved_chunks: list[dict] = []
    safety_notice: Optional[str] = None
    confidence: str = "high"


class ProfileRequest(BaseModel):
    """نموذج بيانات المريض - كل الحقول اختيارية ما عدا اللي عايزينه"""
    name: Optional[str] = ""
    age: Optional[int] = None
    sex: Optional[str] = ""
    weight: Optional[float] = None
    height: Optional[float] = None
    bmi: Optional[float] = None
    diabetes: Optional[bool] = False
    hypertension: Optional[bool] = False
    activity_level: Optional[str] = "moderate"
    labs: Optional[dict] = {}


class TrackingEntry(BaseModel):
    """نموذج سجل التتبع الصحي - تاريخ ووزن ونشاط وملاحظات"""
    date: Optional[str] = ""
    weight: Optional[float] = None
    activity: Optional[str] = ""
    notes: Optional[str] = ""


class LabEntry(BaseModel):
    """نموذج نتيجة التحليل المخبري - اسم التحليل والقيمة والوحدة"""
    test_name: str
    value: float
    unit: Optional[str] = ""
    date: Optional[str] = ""
    notes: Optional[str] = ""
