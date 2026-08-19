import re

# Simulated LLM output with preamble
text = '\u0623\u0646\u0627 LiverCare AI\u060c \u0645\u0633\u0627\u0639\u062f \u0630\u0643\u064a \u0634\u062e\u0635\u064a \u0644\u0644\u0645\u0631\u0636\u0649 \u0627\u0644\u0645\u0635\u0627\u0628\u064a\u0646 \u0628\u0627\u0644\u0643\u0628\u062f \u0627\u0644\u062f\u0647\u0646\u064a (MASLD/NAFLD).\n\n\u0627\u0644\u0643\u0628\u062f \u0627\u0644\u062f\u0647\u0646\u064a \u0647\u0648 \u062d\u0627\u0644\u0629 \u0635\u062d\u064a\u0629 \u062a\u0624\u062f\u064a \u0625\u0644\u0649 \u062a\u0643\u0648\u064a\u0646 \u0627\u0644\u062f\u0647\u0648\u0646...'

print('Original:', text[:100])
print()

preamble_keywords = [
    'LiverCare AI',
    '\u0645\u0633\u0627\u0639\u062f \u0630\u0643\u064a \u0634\u062e\u0635\u064a',
    '\u0645\u0633\u0627\u0639\u062f \u0630\u0643\u064a',
    'I am LiverCare AI',
    'I am a personal AI',
    'personal AI assistant',
]

lines = text.split('\n')
print('Total lines:', len(lines))
for i, line in enumerate(lines):
    stripped = line.strip()
    matches = [kw for kw in preamble_keywords if kw in stripped]
    print(f'Line {i}: {stripped[:60]}... matches={matches}')

# Apply cleanup
cleaned_lines = []
skip_preamble = True
for line in lines:
    if skip_preamble:
        stripped = line.strip()
        if any(kw in stripped for kw in preamble_keywords):
            print(f'  SKIPPING: {stripped[:60]}...')
            continue
        skip_preamble = False
    cleaned_lines.append(line)

cleaned = '\n'.join(cleaned_lines).strip()
print()
print('Cleaned:', cleaned[:100])
