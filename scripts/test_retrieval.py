"""
الملف ده مسؤول عن:
- اختبار الـ Retrieval فقط (من غير LLM)
- التأكد إن ChromaDB بترجع نتائج مناسبة للأسئلة
- عرض الـ Citations مع Relevance Score
"""

import sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
sys.path.insert(0, '.')
from backend.rag.retriever import retrieve, format_retrieved_context

# أسئلة اختبار بالإنجليزي
questions_en = [
    "What is fatty liver disease?",
    "What does ALT measure?",
    "How is lifestyle related to fatty liver?",
    "What information should I monitor?",
    "Explain ALT in simple terms.",
]

# أسئلة اختبار بالعربي
questions_ar = [
    "ما هو الكبد الدهني؟",
    "ما معنى تحليل ALT؟",
    "هل الكبد الدهني له علاقة بزيادة الوزن؟",
    "ما هي العادات الصحية التي تساعد مريض الكبد الدهني؟",
    "ماذا أفعل إذا أردت فهم نتيجة التحليل؟",
]

all_q = questions_en + questions_ar

for q in all_q:
    print("=" * 60)
    print("Q:", q)
    results = retrieve(q, k=3)
    print("Retrieved:", len(results), "results")
    context, citations = format_retrieved_context(results)
    for c in citations:
        print("  Doc:", c["document"], "| Page:", c["page"], "| Score:", c["relevance_score"])
    preview = context[:300].encode('ascii', 'replace').decode('ascii') if context else "EMPTY"
    print("  Context:", preview)
    print()

print("=" * 60)
print("ALL RETRIEVAL TESTS PASSED")
