import re

with open("app.js", "r") as f:
    text = f.read()

start_idx = text.find("const monthlyData = ")
if start_idx != -1:
    print("Found monthlyData at:", start_idx)
    print(text[start_idx:start_idx+4000])
else:
    print("Could not find monthlyData")
