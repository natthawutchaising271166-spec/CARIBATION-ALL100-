import json
import re

# Let's see if there is any cached instruments or database dump we can read.
# Wait, can we read some instrument records from app.js or from local storage or mock files?
# Let's search app.js for any initial instruments or dummy instruments or see where they come from.
with open("app.js", "r") as f:
    text = f.read()

# Let's find "instruments" or initial state
matches = list(re.finditer(r"const\s+\[instruments\s*,", text))
if matches:
    print("Found state:")
    for m in matches:
        print(text[m.start():m.start()+200])
else:
    print("Could not find state for instruments")
