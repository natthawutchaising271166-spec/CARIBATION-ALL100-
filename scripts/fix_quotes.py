with open("app.js", "r", encoding="utf-8") as f:
    text = f.read()

text = text.replace('""ติดตั้ง" (Install)"', "'ติดตั้ง (Install)'")
text = text.replace('""แอป" (Apps)"', "'แอป (Apps)'")
text = text.replace('""ติดตั้งไซต์นี้เป็นแอป" (Install this site as an app)"', "'ติดตั้งไซต์นี้เป็นแอป (Install this site as an app)'")

with open("app.js", "w", encoding="utf-8") as f:
    f.write(text)

print("Fixed quotes")
