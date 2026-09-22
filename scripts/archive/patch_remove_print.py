import re
with open("app.js", "r") as f:
    text = f.read()

pattern = r"l && h\('button', \{\s*type: 'button',\s*onClick: \(\) => \{ l\(currentInst\); \},\s*className: 'px-2.5 py-1 rounded-md bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-600 text-\[11px\] font-bold flex items-center gap-1 transition cursor-pointer'\s*\}, '🖨️ พิมพ์ใบเซอร์'\),"

text = re.sub(pattern, "", text)

with open("app.js", "w") as f:
    f.write(text)

