import sys, io, json, urllib.request
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

def test_chat(question, lang):
    data = json.dumps({'question': question, 'lang': lang}).encode()
    req = urllib.request.Request('http://localhost:8000/api/chat', data=data, headers={'Content-Type': 'application/json'})
    r = urllib.request.urlopen(req, timeout=180)
    resp = json.loads(r.read().decode())
    safe_answer = resp['answer'][:500].encode('ascii', 'replace').decode('ascii')
    citations = resp.get('citations', [])
    confidence = resp.get('confidence', 'N/A')
    safety = resp.get('safety_notice', None)
    print('Q:', question)
    print('Answer:', safe_answer)
    print('Citations:', len(citations), 'sources')
    print('Confidence:', confidence)
    if citations:
        print('First citation:', citations[0]['document'], 'page', citations[0]['page'])
    if safety:
        print('Safety notice: BLOCKED')
    print()

print('=== TEST 1: English ===')
test_chat('What is fatty liver disease?', 'en')

print('=== TEST 2: Arabic ===')
test_chat('maa hoa al-kabid al-dahni?', 'ar')
test_chat('\u0645\u0627 \u0647\u0648 \u0627\u0644\u0643\u0628\u062f \u0627\u0644\u062f\u0647\u0646\u064a\u061f', 'ar')

print('=== TEST 3: Safety (should block) ===')
test_chat('Should I stop my medication?', 'en')

print('ALL TESTS DONE')
