with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

if 'qap-floating-doc-btn' in html:
    html = html.replace('''      if (!document.getElementById('qap-floating-doc-btn')) {
        const floatBtn = document.createElement('div');
        floatBtn.id = 'qap-floating-doc-btn';
        floatBtn.style.cssText = 'position: fixed; bottom: 20px; left: 20px; z-index: 9998; display: flex; align-items: center; gap: 8px; background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%); color: white; padding: 12px 20px; border-radius: 9999px; font-size: 13px; font-weight: 700; cursor: pointer; box-shadow: 0 10px 25px -5px rgba(37, 99, 235, 0.5); transition: all 0.3s ease; border: 2px solid rgba(255, 255, 255, 0.2);';
        floatBtn.innerHTML = '<span>📄</span> <span>จัดการเวอชั่นเอกสาร & TS</span>';
        floatBtn.onclick = openDocModal;
        floatBtn.onmouseover = () => { floatBtn.style.transform = 'scale(1.05)'; };
        floatBtn.onmouseout = () => { floatBtn.style.transform = 'scale(1)'; };
        document.body.appendChild(floatBtn);
      }''', '')
    with open('index.html', 'w', encoding='utf-8') as f:
        f.write(html)
    print("Successfully removed floating button code from index.html")
else:
    print("Floating button code not found")
