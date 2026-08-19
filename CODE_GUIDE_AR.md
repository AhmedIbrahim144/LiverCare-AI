# LiverCare AI - دليل الكود بالعربي

## ملخص المشروع

LiverCare AI هو مساعد ذكي طبي مبني على RAG (Retrieval-Augmented Generation) لمساعدة مرضى الكبد الدهني. المشروع بيستخدم مستندات طبية (PDFs) وبيعملها indexing في Vector Database، ولما المريض بيسأل سؤال، بيتبحث في المستندات عن الاجابات المناسبة ويرجعها مع المصادر.

---

## هيكل المشروع

```
LiverCare-AI/
├── backend/                    # الـ Backend كله (Python + FastAPI)
│   ├── main.py                 # نقطة الدخول - FastAPI App
│   ├── config.py               # الإعدادات والـ Environment Variables
│   ├── ai/                     # الذكاء الاصطناعي (LLM + Safety)
│   │   ├── llm.py              # التواصل مع HuggingFace API
│   │   ├── prompts.py          # الـ System Prompts (عربي/إنجليزي)
│   │   └── safety.py           # طبقة السلامة (فلترة الأسئلة الخطيرة)
│   ├── rag/                    # الـ RAG Pipeline
│   │   ├── loader.py           # تحميل PDFs
│   │   ├── chunker.py          # تقسيم النص إلى Chunks
│   │   ├── embeddings.py       # إنشاء Embeddings
│   │   ├── vectorstore.py      # إدارة ChromaDB
│   │   ├── retriever.py        # البحث والاسترجاع
│   │   ├── citations.py        # تنسيق المصادر
│   │   └── ingest.py           # الـ Ingestion Pipeline
│   ├── api/                    # الـ API Endpoints
│   │   ├── chat.py             # /api/chat - السؤال والإجابة
│   │   ├── profile.py          # /api/profile - ملف المريض
│   │   └── tracking.py         # /api/track و /api/labs
│   └── database/               # قاعدة البيانات
│       ├── database.py         # إدارة JSON Storage
│       └── models.py           # نماذج البيانات (Pydantic)
├── frontend/                   # الـ Frontend (HTML + CSS + JS)
│   ├── index.html              # الصفحة الرئيسية
│   ├── styles.css              # التصميم
│   └── app.js                  # المنطق (عربي/إنجليزي)
├── scripts/                    # سكريبتات مساعدة
│   ├── ingest_all.py           # Ingestion كامل
│   ├── test_hf_token.py        # اختبار HuggingFace Token
│   ├── test_all.py             # اختبار شامل للـ API
│   └── test_retrieval.py       # اختبار الـ Retrieval
├── vector_db/chroma/           # ChromaDB (المخزن)
├── data/                       # البيانات
│   ├── processed/              # PDFs المعالجة
│   ├── raw/                    # PDFs الخام
│   ├── store/                  # ملفات JSON (profile, labs, tracking)
│   └── metadata/               # إحصائيات الـ Ingestion
└── .env                        # المتغيرات البيئية (HF_TOKEN)
```

---

## تدفق RAG Pipeline

```
PDF Files
    ↓
[1] Loading (loader.py)
    - بيقرا كل PDF صفحة بصفحة
    - بيحوّل كل صفحة لـ Document object
    - بيحتفظ بالـ Metadata (اسم الملف، رقم الصفحة)
    ↓
[2] Chunking (chunker.py)
    -بيقسم كل Document إلى Chunks أصغر (1600 حرف)
    - الـ Overlap بيضمن إن المعلومات مهمة مش بتضيع
    - بيضيف chunk_id فريد لكل chunk
    ↓
[3] Embeddings (embeddings.py)
    - بيحوّل الـ Text لأرقام (Vectors) باستخدام BAAI/bge-small-en-v1.5
    - الموديل محلي ومجاني وسريع
    ↓
[4] ChromaDB (vectorstore.py)
    - بيخزن الـ Embeddings في Vector Database
    - بيحتفظ بيها على Disk (مش كل مرة بنعمل Ingestion)
    ↓
[5] Retrieval (retriever.py)
    - لما المريض بيسأل سؤال، بنحوّله لـ Embedding
    - بنقارنه بالـ Embeddings المخزنة
    - بنرجع أعلى 6 نتائج مع Relevance Score
    ↓
[6] Context Formatting (retriever.py)
    - بننسق السياق اللي هيبعت للـ LLM
    - بنضيف Citations (اسم المستند، رقم الصفحة)
    ↓
[7] Safety Check (safety.py)
    - بنفلتر الأسئلة الخطيرة (تشخيص، أدوية، علاج)
    - بنرفض الأسئلة غير المتعلقة بالكبد الدهني
    ↓
[8] LLM Generation (llm.py)
    - بنبعت السؤال + السياق + الـ Prompt للـ LLM
    - MedGemma (موديل طبي) → Qwen (بديل)
    - لو الـ LLM مش شغال بنعرض المصادر مباشرة
    ↓
[9] Response (chat.py)
    - بنرجع الإجابة + المصادر + تنبيه السلامة
```

---

## المكونات الرئيسية بالتفصيل

### 1. الإعدادات (config.py)

**الملف ده فيه كل الإعدادات:**
- مسارات المجلدات (DATA_DIR, CHROMA_DIR, etc.)
- إعدادات الـ Chunking (CHUNK_SIZE=1600, CHUNK_OVERLAP=200)
- إعدادات الـ Embedding (BAAI/bge-small-en-v1.5)
- إعدادات الـ LLM (HF_TOKEN, HF_MODEL, HF_FALLBACK_MODEL)

### 2. تحميل المستندات (loader.py)

**الدالة الأساسية:** `load_pdfs(data_dir)`
- بتحمّل كل ملفات PDF من المجلد
- بترجع قائمة بـ Documents كل واحد فيه نص + metadata
- الـ Metadata فيه: document_name, page_number, source, source_type

### 3. تقسيم النص (chunker.py)

**الدالة الأساسية:** `chunk_documents(docs)`
- بتقسم الـ Documents إلى Chunks أصغر
- الـ RecursiveCharacterTextSplitter بيقسم بالترتيب: \n\n → \n → . → (space) → حرف حرف
- كل chunk بياخد chunk_id فريد

### 4. الـ Embeddings (embeddings.py)

**الدالة الأساسية:** `get_embeddings()`
- بترجع Embedding Model (BAAI/bge-small-en-v1.5 محلي)
- أو OpenAI Embeddings لو متاح

### 5. Vector Database (vectorstore.py)

**الدوال الأساسية:**
- `get_vectorstore()`: بيفتح ChromaDB الموجود
- `create_vectorstore(docs)`: بيإنشاء Vector Store جديد من Documents
- `get_collection_count()`: بيعد عدد الـ Vectors

### 6. البحث والاسترجاع (retriever.py)

**الدوال الأساسية:**
- `retrieve(question)`: بيدور في ChromaDB عن أكتر النتائج ارتباطاً
- `format_retrieved_context(results)`: بينسق السياق والـ Citations

### 7. طبقة السلامة (safety.py)

**الدالة الأساسية:** `check_safety(question, lang)`
- بتفتر أنماط عالية الخطورة ( Regex patterns)
- بترجع `{"safe": True/False, "category": "high_risk/off_topic/within_scope"}`

### 8. الـ LLM (llm.py)

**الدوال الأساسية:**
- `_resolve_model()`: بيختار الموديل الشغال (MedGemma → Qwen)
- `generate_answer(question, context, lang)`: بيبعت للـ LLM وبيرجع الإجابة
- `_fallback_answer(context)`: إجابة بديلة لو الـ LLM مش شغال

### 9. الـ Prompts (prompts.py)

**فيه Prompt للإنجليزي وعربي:**
- قواعد صارمة: ممنوع تشخيص، ممنوع وصف أدوية
- لازم يستشهد بالمصادر
- لازم يختم بتنبيه سلامة

### 10. الـ API Endpoints

#### /api/chat (chat.py)
```
POST /api/chat
Body: {"question": "...", "lang": "en/ar", "top_k": 6}
Response: {"answer": "...", "citations": [...], "citations_text": "...", "safety_notice": "..."}
```

#### /api/profile (profile.py)
```
GET /api/profile → الملف الحالي
POST /api/profile → حفظ/تحديث الملف
```

#### /api/track و /api/labs (tracking.py)
```
GET /api/track → سجلات التتبع
POST /api/track → إضافة سجل
GET /api/labs → التحاليل
POST /api/labs → إضافة تحليل
```

### 11. الـ Frontend

**الـ Frontend فيه 5 أقسام:**
1. **Dashboard**: لوحة التحكم الرئيسية مع ملخص الملف
2. **Chat**: المساعد الذكي (أسئلة وإجابات)
3. **Profile**: ملف المريض (عمر، وزن، طول، أمراض مزمنة)
4. **Tracking**: تتبع الوزن والنشاط (مع رسم بياني)
5. **Labs**: شرح التحاليل المخبرية (ALT, AST, etc.)

**الدعم اللغوي:**
- التبديل بين العربي والإنجليزي بضغطة واحدة
- RTL للعربي
- كل الترجمات في ملف app.js

---

## كيف تشغل المشروع

### 1. تجهيز الـ PDFs
```bash
# ضع ملفات PDF الطبية في مجلد data/raw/
# أو غيّر SOURCE_DATA_DIR في .env
```

### 2. عمل Ingestion
```bash
python scripts/ingest_all.py
```

### 3. تشغيل السيرفر
```bash
python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000
```

### 4. فتح الـ Frontend
```
http://localhost:8000
```

---

## نقاط مهمة للتحكي

### 1. ليه RAG بدل LLM عادي؟
- LLM العادي ممكن يخترع معلومات طبية (Hallucination)
- RAG بيضمن إن الإجابة مبنية على مصادر موثوقة
- كل إجابة ليها Citations (اسم المستند + رقم الصفحة)

### 2. طبقة السلامة (Safety Layer)
- بترفض أسئلة التشخيص ("هل عندي سرطان؟")
- بترفض أسئلة الأدوية ("أشتري أي دواء؟")
- بترفض الأسئلة غير المتعلقة ("ما نتيجة مباراة الاهلي؟")

### 3. الـ Embeddings
- بنستخدم BAAI/bge-small-en-v1.5 (مجاني ومحلي)
- بيحوّل النص لأرقام 384 بُعد
- Semantic Search: بيقارن المعنى مش الكلمات

### 4. ChromaDB
- Vector Database خفيفة وسريحة
- بتخزن على Disk (مش كل مرة بنعمل Ingestion)
- Collection واحده: livercare_medical_kb

### 5. الـ LLM
- MedGemma (موديل طبي من Google) - الموديل الرئيسي
- Qwen (موديل عام) - البديل لو MedGemma متاحش
- Fallback: لو الاتنين مش متاحين بنعرض المصادر مباشرة

### 6. الدعم اللغوي
- كل حاجة شغالة بالعربي والإنجليزي
- RTL للعربي
- الـ Prompts منفصلين لكل لغة

---

## الأسئلة اللي Judges ممكن يسألوا عنها

**1. إيه الفرق بين RAG والـ Fine-tuning؟**
- RAG: بناخد مستندات ونبحث فيها (محتاجين embeddings + vector DB)
- Fine-tuning: بنعدّل في الـ LLM نفسه (مكلف وبيحتاج GPU)

**2. إزاي بتضمنو إن الإجابة صحيحة؟**
- بنستخدم Safety Layer يرفض الأسئلة الخطيرة
- كل إجابة فيها Citations (اسم المستند + رقم الصفحة)
- الـ LLM م-programmed إنه ما يخترعش معلومات

**3. ليه ChromaDB مش PostgreSQL؟**
- ChromaDB مصممة لـ Vector Search
- PostgreSQL مصممة لـ Relational Data
- كل واحدة في مكانها

**4. إزاي المشروع بيشتغل offline؟**
- الـ Embeddings محلي (BAAI/bge-small-en-v1.5)
- ChromaDB محلي
- بس الـ LLM محتاج HuggingFace API (internet)

**5. إيه هي الخطة الجاية؟**
- إضافة Ollama للـ LLM المحلي (full offline)
- إضافة أكتر من لغة
- تحسين الـ Chunking
- إضافة User Authentication
