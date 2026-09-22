import re

with open("ube_snippet.txt", "r") as f:
    text = f.read()

print("File size:", len(text))

# Let's search for how stats and datasets are defined
# We want to see how monthlyData, stats, etc are computed.
patterns = [
    r"const stats\s*=",
    r"const monthlyData\s*=",
    r"centerTab\s*===",
    r"hoveredBar",
    r"onMouseEnter",
    r"title"
]

for p in patterns:
    m = list(re.finditer(p, text))
    print(f"Pattern '{p}': found {len(m)} matches")
    for match in m[:3]:
        start = max(0, match.start() - 100)
        end = min(len(text), match.end() + 400)
        print(f"--- MATCH AT {match.start()} ---")
        print(text[start:end])
        print("-------------------------------\n")
