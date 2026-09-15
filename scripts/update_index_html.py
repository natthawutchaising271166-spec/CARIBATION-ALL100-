with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

placeholder_loader = '''    <div id="root">
      <div id="initial-loading-screen" style="position: fixed; inset: 0; z-index: 999999; display: flex; flex-direction: column; align-items: center; justify-content: center; background-color: #070d1d; color: #ffffff; font-family: 'Prompt', -apple-system, BlinkMacSystemFont, sans-serif;">
        <div style="position: absolute; width: 500px; height: 500px; border-radius: 50%; background: radial-gradient(circle, rgba(0,53,142,0.3) 0%, rgba(7,13,29,0) 70%); pointer-events: none;"></div>
        <div style="position: relative; z-index: 10; display: flex; flex-direction: column; align-items: center; text-align: center; max-width: 420px; width: 90%; padding: 24px;">
          <div style="position: relative; margin-bottom: 24px;">
            <div style="position: absolute; inset: -12px; border-radius: 28px; background: rgba(0, 53, 142, 0.35); filter: blur(14px);"></div>
            <div style="position: relative; padding: 16px 24px; border-radius: 20px; background: rgba(15, 23, 42, 0.95); border: 1px solid rgba(59, 130, 246, 0.3); box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);">
              <svg viewBox="0 0 709 285" width="180" height="74" xmlns="http://www.w3.org/2000/svg" style="display: block; filter: drop-shadow(0 2px 8px rgba(0,32,91,0.5));">
                <path d="M608.2 143.1C608.2 64.6 472.4 0 305 0S1.8 64.6 1.8 143.1s135.8 143.1 303.2 143.1 303.2-64.6 303.2-143.1z" fill="#00358e"/>
                <path d="M602.8 143.1C602.8 68.3 470 7.4 305 7.4S7.2 68.3 7.2 143.1s132.8 135.7 297.8 135.7 297.8-67.4 297.8-135.7z" fill="#002b77"/>
                <path d="M592 143.1C592 73.9 464.7 17.5 305 17.5S18 73.9 18 143.1s127 125.6 287 125.6 287-56.2 287-125.6z" fill="none" stroke="#ffffff" stroke-width="4.5" stroke-miterlimit="10"/>
                <path d="M165.7 186.2c-15.5 0-29.3-4.6-39.6-13.3-10.4-8.8-16.1-20.9-16.1-34.9 0-14.7 6.4-27.4 18.1-35.8 11.5-8.3 26.6-12.7 42.4-12.7 15.2 0 27.6 3.9 36 11.2 5 4.4 8.5 9.8 10.3 16.3l-24.8 5.7c-1.3-4.4-3.8-7.9-7.4-10.3-4.3-2.9-10.3-4.4-17.7-4.4-10.5 0-19.3 2.9-25.5 8.3-6.5 5.6-10.1 13.5-10.1 22.4 0 8.8 3.3 16.3 9.4 21.3 6.1 5 14.7 7.7 24.3 7.7 8.3 0 15.3-1.8 20.3-5.2 4.4-3 7.5-7.4 9.3-12.9l24.4 6.7c-3.7 9.8-10.3 17.7-19.1 23.3-9.5 5.9-21.2 8.6-34 8.6zm78.6 0l22.6-95.3h22.6l-2.4 11.2c6.4-7.8 14.8-12.3 24.6-12.3 8.3 0 14.8 2.6 18.8 7.6 4.3 5.4 5.3 12.9 3.1 22.1l-15.9 66.7h-24.2l15.1-63.5c1.1-4.7.7-8.1-1.3-10.1-1.8-1.8-4.8-2.7-9-2.7-5.9 0-11.4 2.6-15.9 7.6-4.2 4.7-7.2 11.3-8.6 19.3l-11.7 49.3h-24.2zm92.9 0l22.6-95.3h22.6l-2.7 12.6c5.2-8.7 13.5-13.7 23.9-13.7 2.9 0 5.4.3 7.6.9l-6.1 23.6c-2.4-.6-4.9-.9-7.5-.9-6.8 0-13 2.8-17.6 8-4.7 5.3-7.9 12.6-9.3 21.2l-9.3 43.6h-24.2zm67.8 0l22.6-95.3h24.2l-22.6 95.3h-24.2zm38.1-112.5l5.5-23.1h24.2l-5.5 23.1h-24.2zm-12.3 112.5l22.6-95.3h24.2l-22.6 95.3h-24.2zm51.7-47.6c0-14.7 6.4-27.4 18.1-35.8 11.5-8.3 26.6-12.7 42.4-12.7 15.2 0 27.6 3.9 36 11.2 8.4 7.3 12.8 17.6 12.8 29.8 0 3.8-.5 7.4-1.3 10.7h-83.3c-1.3 7.8 1.1 14.6 6.6 19.3 5.5 4.7 13.2 7.1 22.4 7.1 9.1 0 16.4-2.1 21.2-6.1 4.1-3.5 7-8.4 8.5-14.3l24 5.3c-3.1 10.5-9.1 19.1-17.4 25.1-9.3 6.6-21.2 10-34.9 10-15.5 0-29.3-4.6-39.6-13.3-10.4-8.8-16.1-20.9-16.1-34.9zm59.2-12.9c.7-4.4-.2-8.3-2.6-11.1-2.4-2.8-6.4-4.2-11.7-4.2-6.5 0-12.2 1.9-16.4 5.6-3.8 3.3-6.2 7.3-7 11.8h37.7v-2.1zm39.1 60.5l22.6-95.3h22.6l-2.7 12.6c5.2-8.7 13.5-13.7 23.9-13.7 2.9 0 5.4.3 7.6.9l-6.1 23.6c-2.4-.6-4.9-.9-7.5-.9-6.8 0-13 2.8-17.6 8-4.7 5.3-7.9 12.6-9.3 21.2l-9.3 43.6h-24.2z" fill="#ffffff"/>
              </svg>
            </div>
          </div>
          <div style="font-size: 15px; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 4px; color: #ffffff;">
            QAP CALIBRATION CONTROL
          </div>
          <div style="font-size: 11px; color: #94a3b8; margin-bottom: 20px;">
            ระบบจัดการสอบเทียบเครื่องมือวัด • กำลังโหลดข้อมูล...
          </div>
          <div style="width: 100%; height: 4px; border-radius: 999px; background: #1e293b; overflow: hidden; position: relative;">
            <div style="position: absolute; top: 0; left: 0; bottom: 0; width: 45%; border-radius: 999px; background: linear-gradient(90deg, #3b82f6, #10b981); animation: qap-indeterminate 1.5s infinite ease-in-out;"></div>
          </div>
        </div>
      </div>
      <style>
        @keyframes qap-indeterminate {
          0% { left: -40%; width: 30%; }
          50% { left: 30%; width: 50%; }
          100% { left: 100%; width: 40%; }
        }
      </style>
    </div>'''

if '<div id="root"></div>' in html:
    html = html.replace('<div id="root"></div>', placeholder_loader, 1)
    with open('index.html', 'w', encoding='utf-8') as f:
        f.write(html)
    print('Updated index.html with initial loading screen successfully!')
else:
    print('index.html placeholder already updated or root div different')
