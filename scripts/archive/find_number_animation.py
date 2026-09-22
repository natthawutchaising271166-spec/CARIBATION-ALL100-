import re

with open("app.js", "r") as f:
    text = f.read()

matches = list(re.finditer(r"installNumberAnimation", text))
print("Found", len(matches), "occurrences of installNumberAnimation")
for m in matches:
    start = max(0, m.start() - 150)
    end = min(len(text), m.end() + 250)
    print(text[start:end])
    print("-------------------------------------------\n")
