import re

text = '\u0623\u0646\u0627 LiverCare AI\u060c \u0645\u0633\u0627\u0639\u062f \u0630\u0643\u064a \u0634\u062e\u0635\u064a \u0644\u0644\u0645\u0631\u0636\u0649 \u0627\u0644\u0645\u0635\u0627\u0628\u064a\u0646 \u0628\u0627\u0644\u0643\u0628\u062f \u0627\u0644\u062f\u0647\u0646\u064a (MASLD/NAFLD).\n\n\u0627\u0644\u0643\u0628\u062f \u0627\u0644\u062f\u0647\u0646\u064a \u0647\u0648 \u062d\u0627\u0644\u0629 \u0635\u062d\u064a\u0629...'

print('Original:')
print(text)
print()

# Method: line-based removal
lines = text.split('\n')
cleaned_lines = []
skip = True
for line in lines:
    if skip and ('LiverCare AI' in line or '\u0645\u0633\u0627\u0639\u062f \u0630\u0643\u064a' in line or 'LiverCare' in line):
        continue
    skip = False
    cleaned_lines.append(line)

cleaned = '\n'.join(cleaned_lines).strip()
print('Cleaned:')
print(cleaned)
