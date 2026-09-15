with open("app.js", "r", encoding="utf-8") as f:
    text = f.read()

target = 'className:"flex-1 overflow-x-auto overflow-y-auto min-h-0 bg-white dark:bg-[#0b0f19] select-text relative"'
replacement = 'className:"flex-1 overflow-x-auto overflow-y-auto min-h-0 bg-white dark:bg-[#0b0f19] select-text relative table-scroll-container"'

if target in text:
    text = text.replace(target, replacement, 1)
    with open("app.js", "w", encoding="utf-8") as f:
        f.write(text)
    print("Added table-scroll-container class to InstrumentTable wrapper")
else:
    print("Target not found in app.js, checking alternate form")
    import re
    m = re.search(r'className:\s*["\'][^"\']*overflow-x-auto[^"\']*overflow-y-auto[^"\']*["\']', text)
    if m:
        print("Found matching pattern:", m.group(0))
        new_val = m.group(0)[:-1] + ' table-scroll-container"'
        text = text[:m.start()] + new_val + text[m.end():]
        with open("app.js", "w", encoding="utf-8") as f:
            f.write(text)
        print("Replaced with regex pattern successfully")
