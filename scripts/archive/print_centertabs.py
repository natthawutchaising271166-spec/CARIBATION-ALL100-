import re

with open("ube_snippet.txt", "r") as f:
    text = f.read()

matches = list(re.finditer(r"centerTab\s*===\s*\"[a-zA-Z0-9_]*\"", text))
print("Found centerTab matches:", len(matches))

for m in matches:
    start = max(0, m.start() - 100)
    end = min(len(text), m.end() + 1200)
    print(f"Match: {m.group()} at index {m.start()}:")
    print(text[start:end])
    print("=========================================\n")
