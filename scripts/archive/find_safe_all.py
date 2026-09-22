import re

with open("app.js", "r") as f:
    text = f.read()

start_idx = text.find("safeAll = ")
if start_idx != -1:
    print(text[start_idx-100:start_idx+1000])
else:
    print("Could not find safeAll =")
