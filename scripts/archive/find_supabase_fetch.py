import re

with open("app.js", "r") as f:
    text = f.read()

matches = list(re.finditer(r"supabase|fetch|select", text, re.IGNORECASE))
print("Found", len(matches), "occurrences")
for m in matches[:10]:
    start = max(0, m.start() - 100)
    end = min(len(text), m.end() + 200)
    print(text[start:end])
    print("----------------------------\n")
