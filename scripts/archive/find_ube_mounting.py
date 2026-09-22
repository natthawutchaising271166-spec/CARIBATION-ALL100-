import re

with open("app.js", "r") as f:
    text = f.read()

matches = list(re.finditer(r"h\(Ube|Ube\s*\(", text))
print("Found matches:", len(matches))
for m in matches:
    start = max(0, m.start() - 150)
    end = min(len(text), m.end() + 250)
    print(text[start:end])
    print("---------------------------------\n")
