with open("ube_snippet.txt", "r") as f:
    text = f.read()

# Find the loop over monthlyData or the map rendering
match = text.find("key: m.id,")
if match != -1:
    print("Found map at:", match)
    start = max(0, match - 2500)
    end = match + 100
    print(text[start:end])
else:
    print("Could not find loop")
