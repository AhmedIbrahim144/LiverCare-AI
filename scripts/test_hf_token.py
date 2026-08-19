"""
الملف ده مسؤول عن:
- اختبار HuggingFace Token والتأكد إنه شغال
- اختبار توفر MedGemma و Qwen على HF Inference API
- اختبار توليد الإجابات بالعربي والإنجليزي
- اختبار الـ RAG Pipeline كامل عبر الـ API
"""

import sys, io, json, time
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
sys.path.insert(0, '.')

# إعادة تحميل الـ Config بالـ Token الجديد
import importlib
import backend.config as cfg
importlib.reload(cfg)

HF_TOKEN = cfg.HF_TOKEN
HF_MODEL = cfg.HF_MODEL
HF_FALLBACK = cfg.HF_FALLBACK_MODEL

print("=" * 60)
print("LiverCare AI - HuggingFace Token Test")
print("=" * 60)
print(f"Token: {HF_TOKEN[:12]}...{HF_TOKEN[-4:]}")
print(f"Primary model: {HF_MODEL}")
print(f"Fallback model: {HF_FALLBACK}")
print()

# ── TEST 1: Authentication ──
print("=" * 60)
print("TEST 1: Authentication")
print("=" * 60)

from huggingface_hub import HfApi
api = HfApi(token=HF_TOKEN)
try:
    user = api.whoami()
    print(f"  Authenticated as: {user.get('name', 'N/A')}")
    print(f"  Type: {user.get('type', 'N/A')}")
    print("  RESULT: AUTH OK")
except Exception as e:
    print(f"  RESULT: AUTH FAILED - {e}")
print()

# ── TEST 2: Model availability (MedGemma) ──
print("=" * 60)
print("TEST 2: Model availability - MedGemma")
print("=" * 60)

from huggingface_hub import InferenceClient
client = InferenceClient(token=HF_TOKEN)

try:
    response = client.chat_completion(
        model=HF_MODEL,
        messages=[{"role": "user", "content": "Say hello"}],
        max_tokens=10,
    )
    print(f"  MedGemma responded: {response.choices[0].message.content[:100]}")
    print("  RESULT: MEDGEMMA OK")
except Exception as e:
    err = str(e)
    if "not supported by any provider" in err:
        print(f"  RESULT: MEDGEMMA NOT DEPLOYED on HF Inference API")
        print(f"  Error: Model not available via any inference provider")
    elif "402" in err:
        print(f"  RESULT: MEDGEMMA BLOCKED - 402 Payment Required (credits depleted)")
    elif "401" in err or "403" in err:
        print(f"  RESULT: MEDGEMMA BLOCKED - Authentication/authorization error")
        print(f"  Error: {err[:200]}")
    elif "gated" in err.lower():
        print(f"  RESULT: MEDGEMMA BLOCKED - Model is gated (requires accepting terms)")
        print(f"  Error: {err[:200]}")
    else:
        print(f"  RESULT: MEDGEMMA FAILED - {type(e).__name__}: {err[:200]}")
print()

# ── TEST 3: Model availability (Qwen fallback) ──
print("=" * 60)
print("TEST 3: Model availability - Qwen fallback")
print("=" * 60)

try:
    response = client.chat_completion(
        model=HF_FALLBACK,
        messages=[{"role": "user", "content": "Say hello"}],
        max_tokens=20,
    )
    print(f"  Qwen responded: {response.choices[0].message.content[:100]}")
    print("  RESULT: QWEN OK")
except Exception as e:
    err = str(e)
    if "402" in err:
        print(f"  RESULT: QWEN BLOCKED - 402 Payment Required (credits depleted)")
        print(f"  Full error: {err[:300]}")
    elif "not supported" in err:
        print(f"  RESULT: QWEN NOT AVAILABLE on this provider")
    else:
        print(f"  RESULT: QWEN FAILED - {type(e).__name__}: {err[:200]}")
print()

# ── TEST 4: English generation ──
print("=" * 60)
print("TEST 4: English generation")
print("=" * 60)

# Try MedGemma first, then Qwen
for model_name in [HF_MODEL, HF_FALLBACK]:
    try:
        response = client.chat_completion(
            model=model_name,
            messages=[{"role": "user", "content": "What is fatty liver disease? Answer in 2 sentences."}],
            max_tokens=200,
            temperature=0.3,
        )
        answer = response.choices[0].message.content
        print(f"  Model: {model_name}")
        print(f"  Response: {answer[:300]}")
        print(f"  RESULT: ENGLISH GENERATION OK")
        break
    except Exception as e:
        err = str(e)
        if "402" in err:
            print(f"  {model_name}: 402 Payment Required")
        elif "not supported" in err:
            print(f"  {model_name}: Not deployed on HF")
        else:
            print(f"  {model_name}: {type(e).__name__}: {err[:100]}")
else:
    print(f"  RESULT: ENGLISH GENERATION FAILED - No model available")
print()

# ── TEST 5: Arabic generation ──
print("=" * 60)
print("TEST 5: Arabic generation")
print("=" * 60)

for model_name in [HF_MODEL, HF_FALLBACK]:
    try:
        response = client.chat_completion(
            model=model_name,
            messages=[{"role": "user", "content": "ما هو الكبد الدهني؟ أجب بجملتين بالعربية."}],
            max_tokens=200,
            temperature=0.3,
        )
        answer = response.choices[0].message.content
        print(f"  Model: {model_name}")
        print(f"  Response: {answer[:300]}")
        # Check if response contains Arabic characters
        arabic_chars = sum(1 for c in answer if '\u0600' <= c <= '\u06FF')
        if arabic_chars > 10:
            print(f"  Arabic chars detected: {arabic_chars}")
            print(f"  RESULT: ARABIC GENERATION OK")
        else:
            print(f"  Arabic chars detected: {arabic_chars} (low)")
            print(f"  RESULT: ARABIC WEAK - Model returned mostly non-Arabic text")
        break
    except Exception as e:
        err = str(e)
        if "402" in err:
            print(f"  {model_name}: 402 Payment Required")
        elif "not supported" in err:
            print(f"  {model_name}: Not deployed on HF")
        else:
            print(f"  {model_name}: {type(e).__name__}: {err[:100]}")
else:
    print(f"  RESULT: ARABIC GENERATION FAILED - No model available")
print()

# ── TEST 6: Full RAG pipeline via API ──
print("=" * 60)
print("TEST 6: Full RAG pipeline (API test)")
print("=" * 60)

import urllib.request

# Test health
try:
    r = urllib.request.urlopen('http://localhost:8000/health', timeout=5)
    print(f"  Health: {json.loads(r.read().decode())}")
except Exception as e:
    print(f"  Health check failed: {e}")
    print("  Make sure server is running: python -m uvicorn backend.main:app --port 8000")
    print()

# Test chat - English
try:
    data = json.dumps({"question": "What is fatty liver disease?", "lang": "en"}).encode()
    req = urllib.request.Request('http://localhost:8000/api/chat', data=data, headers={"Content-Type": "application/json"})
    r = urllib.request.urlopen(req, timeout=120)
    resp = json.loads(r.read().decode())
    print(f"  EN Question: What is fatty liver disease?")
    print(f"  Citations: {len(resp.get('citations', []))} sources")
    print(f"  Confidence: {resp.get('confidence')}")
    safe = resp['answer'][:300].encode('ascii', 'replace').decode('ascii')
    print(f"  Answer: {safe}")
    # Check if it's LLM-generated or fallback
    if resp['answer'].startswith("Based on the available medical evidence:"):
        print(f"  LLM Status: FALLBACK MODE (evidence only, no LLM generation)")
    else:
        print(f"  LLM Status: LLM-GENERATED ANSWER")
    print(f"  RESULT: ENGLISH RAG OK")
except Exception as e:
    print(f"  RESULT: ENGLISH RAG FAILED - {type(e).__name__}: {str(e)[:200]}")
print()

# Test chat - Arabic
try:
    data = json.dumps({"question": "ما هو الكبد الدهني؟", "lang": "ar"}).encode()
    req = urllib.request.Request('http://localhost:8000/api/chat', data=data, headers={"Content-Type": "application/json"})
    r = urllib.request.urlopen(req, timeout=120)
    resp = json.loads(r.read().decode())
    print(f"  AR Question: ما هو الكبد الدهني؟")
    print(f"  Citations: {len(resp.get('citations', []))} sources")
    print(f"  Confidence: {resp.get('confidence')}")
    safe = resp['answer'][:300].encode('ascii', 'replace').decode('ascii')
    print(f"  Answer: {safe}")
    if resp['answer'].startswith("بناءً على المعلومات الطبية"):
        print(f"  LLM Status: FALLBACK MODE (evidence only, no LLM generation)")
    else:
        print(f"  LLM Status: LLM-GENERATED ANSWER")
    print(f"  RESULT: ARABIC RAG OK")
except Exception as e:
    print(f"  RESULT: ARABIC RAG FAILED - {type(e).__name__}: {str(e)[:200]}")
print()

# ── SUMMARY ──
print("=" * 60)
print("SUMMARY")
print("=" * 60)
print("1. Authentication:    Check TEST 1 above")
print("2. Model generation:  Check TEST 2-5 above")
print("3. Arabic generation: Check TEST 5 above")
print("4. English generation: Check TEST 4 above")
print("5. RAG + citations:   Check TEST 6 above")
print()
print("If all tests show 'BLOCKED' or 'NOT DEPLOYED', the issue is:")
print("  - MedGemma is NOT available via HF Inference API")
print("  - HF account may have depleted credits")
print("  - Solution: Install Ollama locally or add HF credits")
