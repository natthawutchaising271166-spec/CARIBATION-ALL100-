import re

with open("ube_snippet.txt", "r") as f:
    text = f.read()

# Find all occurrences of hoveredBar and setHoveredBar
matches = list(re.finditer(r"hoveredBar|setHoveredBar", text))
print("Found", len(matches), "occurrences")

for m in matches:
    start = max(0, m.start() - 150)
    end = min(len(text), m.end() + 250)
    print(f"Match at index {m.start()}:")
    print(text[start:end])
    print("-------------------------------------------\n")
