import re

with open("app.js", "r") as f:
    text = f.read()

matches = list(re.finditer(r"function\s+P0|const\s+P0\s*=", text))
print("Found", len(matches), "P0 functions")
for m in matches:
    start = max(0, m.start() - 100)
    end = min(len(text), m.end() + 1000)
    print(text[start:end])
