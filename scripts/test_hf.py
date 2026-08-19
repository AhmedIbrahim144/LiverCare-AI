import sys, io, urllib.request, json
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

def test_chat(question, lang):
    data = json.dumps({'question': question, 'lang': lang}).encode()
    req = urllib.request.Request('http://localhost:8000/api/chat', data=data, headers={'Content-Type': 'application/json'})
    r = urllib.request.urlopen(req, timeout=120)
    resp = json.loads(r.read().decode())
    safe_answer = resp['answer'][:400].encode('ascii', 'replace').decode('ascii')
    print(f"Q: {question}")
    print(f"Answer: {safe_answer}")
    print(f"Citations: {len(resp.get('citations', []))}")
    print(f"Confidence: {resp.get('confidence', 'N/A')}")
    print()

tests = [
    ("What is fatty liver disease?", "en"),
    ("What does ALT mean?", "en"),
    ("ما هو الكبد الدهني؟", "ar"),
    ("ما معنى تحليل ALT؟", "ar"),
]

for q, lang in tests:
    test_chat(q, lang)

print("TESTS COMPLETE")
