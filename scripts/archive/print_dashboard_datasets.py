import re

with open("ube_snippet.txt", "r") as f:
    text = f.read()

# Let's search for dynamic data calculations
keys = ["quarterlyData", "departmentData", "equipmentTypeData", "radarMetrics"]
for k in keys:
    idx = text.find(f"const {k} = ")
    if idx != -1:
        print(f"=== {k} ===")
        print(text[idx:idx+2500])
        print("=======================\n")
    else:
        print(f"Could not find const {k} =")
