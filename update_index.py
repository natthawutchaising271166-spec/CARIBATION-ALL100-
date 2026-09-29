with open('/app/applet/index.html', 'r', encoding='utf-8') as f:
    html = f.read()

snippet = '''
<!-- 📄 Document Version Control Database & Quick Button Injector -->
<script>
  (() => {
    const defaultDocs = [
      { id: 'doc-1', code: 'Format-4', name: 'Instrument Calibration Master List & Due Report', rev: 'Rev.02', ts: 'TS-QAP-01', retention: '5 Years', prepared: 'K. Nattwut', approved: 'M. Manager' },
      { id: 'doc-2', code: 'QAP-FM-02', name: 'Calibration Result Certificate Form', rev: 'Rev.01', ts: 'TS-QAP-02', retention: '3 Years', prepared: 'K. Nattwut', approved: 'M. Manager' },
      { id: 'doc-3', code: 'QAP-FM-03', name: 'Instrument History Card Record', rev: 'Rev.03', ts: 'TS-QAP-03', retention: '5 Years', prepared: 'K. Nattwut', approved: 'M. Manager' },
      { id: 'doc-4', code: 'QAP-FM-04', name: 'Incoming Inspection Report', rev: 'Rev.02', ts: 'TS-QC-01', retention: '2 Years', prepared: 'QC Team', approved: 'QC Manager' },
      { id: 'doc-5', code: 'QAP-FM-05', name: 'Out-of-Tolerance Notice & Investigation', rev: 'Rev.01', ts: 'TS-QA-05', retention: '5 Years', prepared: 'QA Engineer', approved: 'Plant Director' }
    ];

    function getDocs() {
      try {
        const saved = localStorage.getItem('QAP_DOC_VERSION_DB_V2');
        if (saved) return JSON.parse(saved);
      } catch (e) {}
      return defaultDocs;
    }

    function saveDocs(docs) {
      localStorage.setItem('QAP_DOC_VERSION_DB_V2', JSON.stringify(docs));
      if (docs[0]) {
        const cfg = {
          formatCode: docs[0].code,
          revisionNo: docs[0].rev,
          tsCode: docs[0].ts,
          retention: docs[0].retention,
          company: 'THAI KOBELCO CONSTRUCTION MACHINERY LTD.',
          issueDate: '01-Jan-2026',
          preparedBy: docs[0].prepared,
          approveBy: docs[0].approved
        };
        localStorage.setItem('QAP_DOCUMENT_CONFIG_V1', JSON.stringify(cfg));
        window.qapDocumentConfig = cfg;
      }
    }

    if (!localStorage.getItem('QAP_DOC_VERSION_DB_V2')) {
      saveDocs(defaultDocs);
    }

    function openDocModal() {
      let modal = document.getElementById('qap-doc-control-modal-overlay');
      if (modal) modal.remove();

      const docs = getDocs();

      modal = document.createElement('div');
      modal.id = 'qap-doc-control-modal-overlay';
      modal.style.cssText = 'position: fixed; inset: 0; z-index: 99999; background: rgba(15, 23, 42, 0.75); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; padding: 20px; animation: qapFadeIn 0.2s ease-out;';
      
      modal.innerHTML = `
        <div style="background: #ffffff; width: 100%; max-width: 950px; border-radius: 24px; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.35); overflow: hidden; display: flex; flex-direction: column; max-height: 90vh; border: 1px solid rgba(226, 232, 240, 1);">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); padding: 24px 32px; color: white; display: flex; align-items: center; justify-content: space-between;">
            <div style="display: flex; align-items: center; gap: 14px;">
              <div style="width: 48px; height: 48px; border-radius: 14px; background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); display: flex; align-items: center; justify-content: center; font-size: 24px; box-shadow: 0 10px 15px -3px rgba(59, 130, 246, 0.5);">📄</div>
              <div>
                <h2 style="font-size: 20px; font-weight: 700; margin: 0; letter-spacing: -0.02em;">Document Version & TS Control Database</h2>
                <p style="font-size: 13px; color: #94a3b8; margin: 4px 0 0 0;">จัดการเลขเวอชั่น, TS, และข้อมูลเอกสารทั้งหมด อัปเดตและลิ้งเข้าหาเอกสารทันทีอัตโนมัติ</p>
              </div>
            </div>
            <button id="qap-modal-close-btn" style="background: rgba(255, 255, 255, 0.1); border: none; color: white; width: 36px; height: 36px; border-radius: 50%; font-size: 18px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: background 0.2s;">✕</button>
          </div>

          <!-- Body / Table -->
          <div style="padding: 24px 32px; overflow-y: auto; flex: 1; background: #f8fafc;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
              <span style="font-size: 13px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em;">รายการเอกสารที่เกี่ยวข้องทั้งหมดในระบบ (${docs.length} รายการ)</span>
              <button id="qap-doc-add-btn" style="background: #2563eb; color: white; border: none; padding: 8px 16px; border-radius: 10px; font-size: 13px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 6px; box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.2);">+ เพิ่มเอกสารใหม่</button>
            </div>

            <div style="background: white; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.02);">
              <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 13px;">
                <thead>
                  <tr style="background: #f1f5f9; border-bottom: 1px solid #e2e8f0; color: #475569; font-weight: 600;">
                    <th style="padding: 12px 16px;">Format Code</th>
                    <th style="padding: 12px 16px;">ชื่อเอกสาร (Document Name)</th>
                    <th style="padding: 12px 16px; width: 100px;">Revision</th>
                    <th style="padding: 12px 16px; width: 120px;">TS Code</th>
                    <th style="padding: 12px 16px; width: 110px;">Retention</th>
                    <th style="padding: 12px 16px; text-align: center; width: 110px;">จัดการ / ลิ้งค์</th>
                  </tr>
                </thead>
                <tbody id="qap-doc-table-body">
                  ${docs.map((doc, idx) => `
                    <tr style="border-bottom: 1px solid #f1f5f9; transition: background 0.15s;" onmouseover="this.style.background='#f8fafc'" onmouseout="this.style.background='white'">
                      <td style="padding: 12px 16px;"><input type="text" data-index="${idx}" data-field="code" value="${doc.code}" style="width: 100%; padding: 6px 10px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 13px; font-family: monospace; font-weight: 600; color: #1e293b;"></td>
                      <td style="padding: 12px 16px;"><input type="text" data-index="${idx}" data-field="name" value="${doc.name}" style="width: 100%; padding: 6px 10px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 13px; color: #334155;"></td>
                      <td style="padding: 12px 16px;"><input type="text" data-index="${idx}" data-field="rev" value="${doc.rev}" style="width: 100%; padding: 6px 10px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 13px; font-weight: 600; color: #2563eb;"></td>
                      <td style="padding: 12px 16px;"><input type="text" data-index="${idx}" data-field="ts" value="${doc.ts}" style="width: 100%; padding: 6px 10px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 13px; font-weight: 600; color: #0d9488;"></td>
                      <td style="padding: 12px 16px;"><input type="text" data-index="${idx}" data-field="retention" value="${doc.retention}" style="width: 100%; padding: 6px 10px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 13px; color: #475569;"></td>
                      <td style="padding: 12px 16px; text-align: center;">
                        <button class="qap-doc-link-btn" data-index="${idx}" title="คลิกเพื่อเปิด/ลิ้งค์เข้าสู่เอกสารนี้ทันที" style="background: #e0f2fe; color: #0284c7; border: none; padding: 6px 12px; border-radius: 8px; font-size: 12px; font-weight: 600; cursor: pointer; transition: all 0.2s;">🔗 เปิดเอกสาร</button>
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>

          <!-- Footer -->
          <div style="background: #f1f5f9; padding: 16px 32px; border-top: 1px solid #e2e8f0; display: flex; align-items: center; justify-content: space-between;">
            <div id="qap-modal-status" style="font-size: 13px; font-weight: 500; color: #059669;"></div>
            <div style="display: flex; gap: 12px;">
              <button id="qap-modal-cancel-btn" style="background: white; color: #475569; border: 1px solid #cbd5e1; padding: 10px 20px; border-radius: 10px; font-size: 13px; font-weight: 600; cursor: pointer;">ยกเลิก</button>
              <button id="qap-modal-save-btn" style="background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: white; border: none; padding: 10px 24px; border-radius: 10px; font-size: 13px; font-weight: 600; cursor: pointer; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);">💾 บันทึกและอัปเดตอัตโนมัติ</button>
            </div>
          </div>
        </div>
      `;

      document.body.appendChild(modal);

      const closeModal = () => modal.remove();
      document.getElementById('qap-modal-close-btn').onclick = closeModal;
      document.getElementById('qap-modal-cancel-btn').onclick = closeModal;
      modal.onclick = (e) => { if (e.target === modal) closeModal(); };

      modal.querySelectorAll('.qap-doc-link-btn').forEach(btn => {
        btn.onclick = (e) => {
          const idx = e.currentTarget.getAttribute('data-index');
          const doc = getDocs()[idx];
          alert(`🔗 กำลังเชื่อมโยงและเปิดเอกสาร:\n[${doc.code}] ${doc.name}\nเวอชั่นปัจจุบัน: ${doc.rev} | TS: ${doc.ts}`);
          closeModal();
          const exportBtn = document.querySelector('button[title*="Export"], button[title*="Excel"]');
          if (exportBtn) exportBtn.click();
        };
      });

      document.getElementById('qap-doc-add-btn').onclick = () => {
        const currentDocs = gatherInputs();
        currentDocs.push({ id: 'doc-' + Date.now(), code: 'NEW-FM-0' + (currentDocs.length + 1), name: 'New Control Document', rev: 'Rev.01', ts: 'TS-NEW-01', retention: '3 Years', prepared: 'Nattwut', approved: 'Manager' });
        saveDocs(currentDocs);
        openDocModal();
      };

      function gatherInputs() {
        const rows = modal.querySelectorAll('tbody tr');
        const updated = [];
        rows.forEach((tr, idx) => {
          const code = tr.querySelector('input[data-field="code"]').value;
          const name = tr.querySelector('input[data-field="name"]').value;
          const rev = tr.querySelector('input[data-field="rev"]').value;
          const ts = tr.querySelector('input[data-field="ts"]').value;
          const retention = tr.querySelector('input[data-field="retention"]').value;
          updated.push({ id: docs[idx]?.id || ('doc-' + idx), code, name, rev, ts, retention, prepared: docs[idx]?.prepared || 'Nattwut', approved: docs[idx]?.approved || 'Manager' });
        });
        return updated;
      }

      document.getElementById('qap-modal-save-btn').onclick = () => {
        const updated = gatherInputs();
        saveDocs(updated);
        const statusEl = document.getElementById('qap-modal-status');
        statusEl.textContent = '✨ บันทึกสำเร็จ! เลขเวอชั่นและ TS ถูกอัปเดตและเชื่อมโยงอัตโนมัติเรียบร้อยแล้ว';
        setTimeout(() => {
          closeModal();
          window.location.reload();
        }, 1200);
      };
    }

    function injectButtons() {
      if (!document.getElementById('qap-floating-doc-btn')) {
        const floatBtn = document.createElement('div');
        floatBtn.id = 'qap-floating-doc-btn';
        floatBtn.style.cssText = 'position: fixed; bottom: 20px; left: 20px; z-index: 9998; display: flex; align-items: center; gap: 8px; background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%); color: white; padding: 12px 20px; border-radius: 9999px; font-size: 13px; font-weight: 700; cursor: pointer; box-shadow: 0 10px 25px -5px rgba(37, 99, 235, 0.5); transition: all 0.3s ease; border: 2px solid rgba(255, 255, 255, 0.2);';
        floatBtn.innerHTML = '<span>📄</span> <span>จัดการเวอชั่นเอกสาร & TS</span>';
        floatBtn.onclick = openDocModal;
        floatBtn.onmouseover = () => { floatBtn.style.transform = 'scale(1.05)'; };
        floatBtn.onmouseout = () => { floatBtn.style.transform = 'scale(1)'; };
        document.body.appendChild(floatBtn);
      }

      const sidebars = document.querySelectorAll('aside, nav, [class*="sidebar"]');
      sidebars.forEach(sidebar => {
        if (!sidebar.querySelector('#qap-sidebar-doc-btn')) {
          const btn = document.createElement('button');
          btn.id = 'qap-sidebar-doc-btn';
          btn.title = 'Document Version & TS Control Database';
          btn.className = 'w-full flex items-center gap-3 px-3 py-2.5 my-2 rounded-xl text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transition shadow-md cursor-pointer text-left group';
          btn.innerHTML = `
            <div class="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center text-white shrink-0 font-bold">📄</div>
            <div class="truncate">
              <div class="text-[13px] font-bold tracking-tight">Document Control DB</div>
              <div class="text-[10px] text-blue-200">จัดการเวอชั่น & TS อัตโนมัติ</div>
            </div>
          `;
          btn.onclick = openDocModal;
          sidebar.appendChild(btn);
        }
      });
    }

    setInterval(injectButtons, 800);
    window.openQapDocumentControlModal = openDocModal;
  })();
</script>
'''.strip()

if 'qap-floating-doc-btn' not in html:
    html = html.replace('</body>', f'\n{snippet}\n</body>')
    with open('/app/applet/index.html', 'w', encoding='utf-8') as f:
        f.write(html)
    print("Successfully injected Document Control Database widget into index.html")
else:
    print("Already injected")
