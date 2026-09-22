with open("app.js", "r") as f:
    text = f.read()

start_idx = text.find("Ube = (")
if start_idx != -1:
    ube_code = text[start_idx:start_idx+300000] # let's take 300k characters
    with open("ube_snippet.txt", "w") as out:
        out.write(ube_code)
    print("Extracted 100k characters of Ube into ube_snippet.txt")
else:
    print("Could not find Ube")
