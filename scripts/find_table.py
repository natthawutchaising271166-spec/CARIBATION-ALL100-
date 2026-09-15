with open('app.js', 'r') as f:
    text = f.read()

import re
# look for table rendered with class
for m in re.finditer(r'[\'"]table[\'"]', text):
    start = max(0, m.start() - 300)
    end = min(len(text), m.end() + 300)
    chunk = text[start:end]
    if 'overflow' in chunk:
        print("FOUND TABLE WITH OVERFLOW:")
        print(chunk)
        print("="*40)
