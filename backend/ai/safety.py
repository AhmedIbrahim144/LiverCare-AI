"""
الملف ده مسؤول عن:
- طبقة السلامة (Safety Layer) للأسئلة الطبية
- فلترة الأسئلة عالية الخطورة (التشخيص، الأدوية، العلاج)
- فلترة الأسئلة غير المتعلقة بالكبد الدهني
- إرسال رسائل مناسبة بالعربي أو الإنجليزي
"""

import re

# ═══════════════════════════════════════════════════════════
# أنماط الأسئلة عالية الخطورة (إنجليزي)
# ═══════════════════════════════════════════════════════════

HIGH_RISK_PATTERNS_EN = [
    r"should i (stop|start|change|adjust|reduce|increase|take|skip|discontinue)",
    r"what (medication|drug|medicine|dose|dosage) should i",
    r"do i have (liver cancer|liver cirrhosis|liver fibrosis|liver hepatitis|cancer|cirrhosis|fibrosis|hepatitis)",
    r"am i (cured|healed|getting worse|getting better)",
    r"what is my (diagnosis|prognosis|life expectancy)",
    r"can i (die|drink alcohol|eat fat|eat sugar)",
    r"prescribe me",
    r"diagnose me",
    r"(best|good|strong|top) (medication|drug|treatment|medicine) (for|to treat)",
    r"(give me|recommend|suggest) (a |some )?(medication|drug|treatment|prescription)",
    r"what (treatment|medication|drug) (is|are) (best|recommended|suitable) for",
]

# ═══════════════════════════════════════════════════════════
# أنماط الأسئلة عالية الخطورة (عربي)
# ═══════════════════════════════════════════════════════════

HIGH_RISK_PATTERNS_AR = [
    r"هل يجب أن (أتوقف|أبدأ|أغير|أعدّل|أقلّص|أزيد|آخذ|أتخلى|أتوقف|أوقف|آخذ|غيّر|عوّض)",
    r"أي (دواء|جرعة) يجب أن آخذ",
    r"هل أنا (مصاب|مصاب بالسرطان|مصاب بالتهاب|مصاب بالتليّف|مصاب بالس\w+)",
    r"ما هو تشخيصي",
    r"هل يمكنني (الموت|شرب الكحول|أكل الدهون|أكل السكر)",
    r"صف لي دواء",
    r"شخّصني",
    r"(أفضل|أجود|أقوى) (دواء|أدوي|علاج|علاجات)",
    r"أدوية (لعلاج|في علاج)",
    r"(أعطني|اديني|دلني على) (دواء|علاج|وصفة طبية)",
    r"(أحتاج|أريد|أبغى) (دواء|علاج|وصفة)",
    r"(أوقف|أ停|أتوقف|تتوقف) عن (الدواء|الأدوية|العلاج|الդواء)",
    r"(هل أستطيع|ممكن|أقدر) (أوقف|آخذ|أغير) (الدواء|الأدوية)",
]

# ═══════════════════════════════════════════════════════════
# كلمات الأسئلة غير المتعلقة (إنجليزي)
# ═══════════════════════════════════════════════════════════

OFF_TOPIC_KEYWORDS_EN = [
    "politics", "election", "sports score", "weather forecast",
    "recipe", "movie", "music", "stock price", "cryptocurrency",
]

# ═══════════════════════════════════════════════════════════
# كلمات الأسئلة غير المتعلقة (عربي)
# ═══════════════════════════════════════════════════════════

OFF_TOPIC_KEYWORDS_AR = [
    "السياسة", "الانتخابات", "المباريات", "الطقس",
    "وصفة طعام", "فيلم", "موسيقى", "سعر السهم", "العملات الرقمية",
]


def check_safety(question: str, lang: str = "en") -> dict:
    """
    الدالة دي بتحقق إذا كان السؤال آمن للإجابة عليه
    
    بتشوف:
    1. هل السؤال فيه أنماط عالية الخطورة؟ (تشخيص، أدوية، علاج)
    2. هل السؤال متعلق بالكبد الدهني ولا لأ؟
    
    لو السؤال مش آمن بترجع:
    - safe: False
    - category: "high_risk" أو "off_topic"
    - message_en / message_ar: رسالة مناسبة
    """
    question_lower = question.lower().strip()

    # اختيار الأنماط المناسبة حسب اللغة
    if lang == "ar":
        high_risk_patterns = HIGH_RISK_PATTERNS_AR
        off_topic_keywords = OFF_TOPIC_KEYWORDS_AR
    else:
        high_risk_patterns = HIGH_RISK_PATTERNS_EN
        off_topic_keywords = OFF_TOPIC_KEYWORDS_EN

    # التحقق من الأسئلة عالية الخطورة
    for pattern in high_risk_patterns:
        if re.search(pattern, question_lower):
            return {
                "safe": False,
                "category": "high_risk",
                "message_en": (
                    "I cannot provide guidance on this type of medical question. "
                    "Questions about medications, diagnoses, and treatment decisions "
                    "require personalized evaluation by a qualified healthcare professional. "
                    "Please discuss this with your doctor."
                ),
                "message_ar": (
                    "لا أستطيع تقديم إرشادات بشأن هذا النوع من الأسئلة الطبية. "
                    "الأسئلة المتعلقة بالأدوية والتشخيصات وقرارات العلاج تتطلب "
                    "تقييماً شخصياً من متخصص رعاية صحي مؤهل. "
                    "يرجى مناقشة ذلك مع طبيبك."
                ),
            }

    # التحقق من الأسئلة غير المتعلقة
    for keyword in off_topic_keywords:
        if keyword in question_lower:
            return {
                "safe": False,
                "category": "off_topic",
                "message_en": (
                    "I can only help with questions about fatty liver disease, nutrition, lifestyle, "
                    "and basic laboratory information. Please ask a related question."
                ),
                "message_ar": (
                    "يمكنني المساعدة فقط في الأسئلة المتعلقة بالكبد الدهني والتغذية ونمط الحياة "
                    "ومعلومات الفحوصات المخبرية الأساسية. يرجى طرح سؤال متعلق."
                ),
            }

    # لو السؤال آمن ومتعلق بموضوعنا
    return {"safe": True, "category": "within_scope"}
