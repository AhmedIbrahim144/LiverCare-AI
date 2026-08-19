"""
Lab Analyzer endpoint: analyzes lab report images using Google AI Studio (Gemini).
Extracts test names, values, units, reference ranges, explains results and gives health advice.
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import os
import requests

router = APIRouter(prefix="/api", tags=["lab_analyzer"])

GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY", "")


class LabAnalysisRequest(BaseModel):
    image_base64: str
    lang: str = "en"


ANALYSIS_PROMPT_EN = """You are a medical lab report analyzer. Analyze this lab report image.

IMPORTANT: Do NOT use asterisks (*) or markdown formatting. Write plain text only.

For EACH visible test result, provide:

1. Test Name (in Arabic and English)
2. Value
3. Unit
4. Reference Range (normal range)
5. Status: Normal / High / Low
6. WHERE TO FIND IT: Tell the patient exactly where to find this value on the report (e.g., "Look for the column labeled 'Result' next to the test name 'ALT'")

After listing all tests, provide:
- SUMMARY: Overall health assessment based on the results
- HEALTH ADVICE: Practical lifestyle and dietary recommendations to improve the results
- IMPORTANT: Always recommend consulting a doctor for personalized advice

Format as plain text with clear sections. No asterisks, no markdown symbols.

The analysis MUST be in the same language as the user's question (Arabic if Arabic, English if English)."""


ANALYSIS_PROMPT_AR = """أنت محلل نتائج تحاليل مخبرية. حلل صورة تقرير التحاليل هذه.

مهم جدا: لا تستخدم نجمة (*) أو رموز تنسيق. اكتب نص عادي فقط.

لكل نتيجة تحليل مرئية، قدم:

1. اسم التحليل (بالعربي والإنجليزي)
2. القيمة
3. الوحدة
4. المدى المرجعي (المدى الطبيعي)
5. الحالة: طبيعي / مرتفع / منخفض
6. اين تجد القيمة: أخبر المريض بالضبط اين يجد هذه القيمة في التقرير (مثلا: "ابحث عن العمود المكتوب بجانبه 'القيمة' بجانب اسم التحليل 'ALT'")

بعد قائمة التحاليل، قدم:
- ملخص: تقييم عام للصحة بناءً على النتائج
- نصائح صحية: توصيات عملية للغذاء وال.activity البدني لتحسين النتائج
- مهم جدا: انصح دائماً باستشارة طبيب للحصول على إرشادات شخصية

اكتب بتنسيق نص عادي مع أقسام واضحة. بدون نجمة، بدون رموز تنسيق.

يجب أن يكون التحليل بنفس لغة سؤال المستخدم (عربي إذا عربي، إنجليزي إذا إنجليزي)."""

# Reference ranges for common liver-related tests (bilingual)
COMMON_RANGES = {
    "ALT": {"unit": "U/L", "normal": "7-56", "low": "<7", "high": ">56", "ar": "الأنزيم الناقل للأمين (ALT)", "en": "ALT (Alanine Aminotransferase)"},
    "AST": {"unit": "U/L", "normal": "10-40", "low": "<10", "high": ">40", "ar": "الأنزيم الناقل للأسبارت (AST)", "en": "AST (Aspartate Aminotransferase)"},
    "GGT": {"unit": "U/L", "normal": "9-48", "low": "<9", "high": ">48", "ar": "-peptidase gamma-glutamyl (GGT)", "en": "GGT (Gamma-Glutamyl Transferase)"},
    "ALP": {"unit": "U/L", "normal": "44-147", "low": "<44", "high": ">147", "ar": "الأنزيم القاعدي (ALP)", "en": "ALP (Alkaline Phosphatase)"},
    "Bilirubin": {"unit": "mg/dL", "normal": "0.1-1.2", "low": "<0.1", "high": ">1.2", "ar": "البيليروبين", "en": "Bilirubin"},
    "Albumin": {"unit": "g/dL", "normal": "3.5-5.0", "low": "<3.5", "high": ">5.0", "ar": "الألبومين", "en": "Albumin"},
    "Creatinine": {"unit": "mg/dL", "normal": "0.6-1.2", "low": "<0.6", "high": ">1.2", "ar": "الكرياتينين", "en": "Creatinine"},
    "HbA1c": {"unit": "%", "normal": "4.0-5.6", "low": "<4.0", "high": ">5.6", "ar": "الهيموجلوبين السكري (HbA1c)", "en": "HbA1c (Glycated Hemoglobin)"},
    "Triglycerides": {"unit": "mg/dL", "normal": "<150", "high": ">200", "ar": "الدهون الثلاثية", "en": "Triglycerides"},
    "Cholesterol": {"unit": "mg/dL", "normal": "<200", "high": ">240", "ar": "الكوليسترول الكلي", "en": "Total Cholesterol"},
    "LDL": {"unit": "mg/dL", "normal": "<100", "high": ">160", "ar": "الكوليسترول الضار (LDL)", "en": "LDL Cholesterol"},
    "HDL": {"unit": "mg/dL", "normal": ">40", "low": "<40", "ar": "الكوليسترول النافع (HDL)", "en": "HDL Cholesterol"},
    "Platelets": {"unit": "K/uL", "normal": "150-400", "low": "<150", "high": ">400", "ar": "الصفائح الدموية", "en": "Platelets"},
    "WBC": {"unit": "K/uL", "normal": "4.5-11.0", "low": "<4.5", "high": ">11.0", "ar": "الكريات البيضاء", "en": "White Blood Cells"},
    "Hemoglobin": {"unit": "g/dL", "normal": "12.0-17.5", "low": "<12.0", "high": ">17.5", "ar": "الهيموجلوبين", "en": "Hemoglobin"},
}


@router.post("/analyze-lab")
async def analyze_lab_image(request: LabAnalysisRequest):
    if not request.image_base64:
        raise HTTPException(status_code=400, detail="Image data is required")

    if not GOOGLE_API_KEY:
        raise HTTPException(status_code=503, detail="Google AI Studio API key not configured")

    lang = request.lang
    prompt = ANALYSIS_PROMPT_AR if lang == "ar" else ANALYSIS_PROMPT_EN

    image_data = request.image_base64
    if "," in image_data:
        image_data = image_data.split(",", 1)[1]

    try:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key={GOOGLE_API_KEY}"

        payload = {
            "contents": [{
                "parts": [
                    {"text": prompt},
                    {"inline_data": {
                        "mime_type": "image/jpeg",
                        "data": image_data,
                    }},
                ]
            }],
            "generationConfig": {
                "temperature": 0.3,
                "maxOutputTokens": 4096,
            },
        }

        response = requests.post(url, json=payload, timeout=120)
        response.raise_for_status()
        data = response.json()

        candidates = data.get("candidates", [])
        if candidates and len(candidates) > 0:
            parts = candidates[0].get("content", {}).get("parts", [])
            if parts:
                analysis_text = parts[0].get("text", "")
            else:
                analysis_text = "Could not analyze the image." if lang == "en" else "لم أتمكن من تحليل الصورة."
        else:
            analysis_text = "No analysis available." if lang == "en" else "لا يوجد تحليل متاح."

        # Remove any asterisks that might slip through
        analysis_text = analysis_text.replace("**", "").replace("*", "")

        return {
            "analysis": analysis_text,
            "reference_ranges": COMMON_RANGES,
            "notice": "This analysis is for educational purposes only. Always consult a healthcare professional." if lang == "en" else "هذا التحليل لأغراض تعليمية فقط. استشر دائماً متخصصاً في الرعاية الصحية.",
        }

    except requests.exceptions.Timeout:
        raise HTTPException(status_code=504, detail="Analysis request timed out")
    except requests.exceptions.HTTPError as e:
        error_detail = str(e)
        try:
            error_json = e.response.json()
            error_detail = error_json.get("error", {}).get("message", str(e))
        except Exception:
            pass
        raise HTTPException(status_code=502, detail=f"Google AI API error: {error_detail}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")
