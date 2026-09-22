import os

for root, dirs, files in os.walk("."):
    if "node_modules" in dirs:
        dirs.remove("node_modules")
    if ".next" in dirs:
        dirs.remove(".next")
    if "dist" in dirs:
        dirs.remove("dist")
    for file in files:
        path = os.path.join(root, file)
        try:
            with open(path, "r", encoding="utf-8", errors="ignore") as f:
                content = f.read()
            if "installNumberAnimation" in content:
                print(f"Found in: {path}")
        except Exception as e:
            pass
