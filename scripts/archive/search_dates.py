import re

with open("app.js", "r") as f:
    text = f.read()

# Let's search for functions matching date or lastCal or calDate or similar
matches = list(re.finditer(r"calDate|dueDate|P0|effectiveStatus", text))
print("Found", len(matches), "matches")
for m in matches[:5]:
    start = max(0, m.start() - 150)
    end = min(len(text), m.end() + 250)
    print(text[start:end])
    print("-------------------------------------------\n")
