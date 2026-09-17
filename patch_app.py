import re
with open("app.js", "r") as f:
    text = f.read()

# For handlePdfAttach
attach_pattern = r"(const handlePdfAttach = async \(evt, targetIdx\) => \{\n.*?try \{\n.*?)(if \(typeof window\.qapCompressPdf === 'function'\) \{)"
attach_repl = r"\1if (window.showCompressionToast) window.showCompressionToast(`เริ่มประมวลผลไฟล์ ${file.name}...`, 'loading');\n      \2"
text = re.sub(attach_pattern, attach_repl, text, flags=re.DOTALL)

# For handleFileUpload
upload_pattern = r"(const handleFileUpload = async \(e, histId\) => \{\n.*?setIsProcessing\(true\);\n.*?try \{\n.*?)(if \(typeof window\.qapCompressPdf === 'function'\) \{)"
upload_repl = r"\1if (window.showCompressionToast) window.showCompressionToast(`เริ่มประมวลผลไฟล์ ${file.name}...`, 'loading');\n      \2"
text = re.sub(upload_pattern, upload_repl, text, flags=re.DOTALL)

with open("app.js", "w") as f:
    f.write(text)

