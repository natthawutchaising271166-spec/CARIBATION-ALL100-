import re

with open("app.js", "r") as f:
    text = f.read()

# Let's find Ube in the file and print 100 lines starting from it.
start_idx = text.find("Ube = (")
if start_idx != -1:
    print("Found Ube = ( at index:", start_idx)
    # Let's print about 4000 characters from there
    print(text[start_idx:start_idx+4000])
else:
    print("Could not find Ube = (")
