// scripts/doc_viewer.js
// Provides window.qapOpenDocViewer and enhances window.qapPdfView

(function() {
  function dataUrlToBlobUrl(dataUrl) {
    if (!dataUrl || typeof dataUrl !== 'string') return null;
    if (dataUrl.startsWith('blob:') || dataUrl.startsWith('http://') || dataUrl.startsWith('https://')) {
      return dataUrl;
    }
    if (dataUrl.startsWith('data:application/pdf') || dataUrl.startsWith('data:image/')) {
      try {
        const parts = dataUrl.split(',');
        const mime = parts[0].match(/:(.*?);/)[1];
        const bstr = atob(parts[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
          u8arr[n] = bstr.charCodeAt(n);
        }
        const blob = new Blob([u8arr], { type: mime });
        return URL.createObjectURL(blob);
      } catch (e) {
        console.warn('Failed to convert data URL to Blob URL:', e);
        return dataUrl;
      }
    }
    return dataUrl;
  }

  window.qapOpenDocViewer = function(item, instrument) {
    const existing = document.getElementById('qap-doc-viewer-modal');
    if (existing) existing.remove();

    const it = item || {};
    const inst = instrument || {};

    const certNo = it.certNo || inst.certNo || ('CERT-QAP-' + (inst.codeNo || 'INST'));
    const calDate = it.calDate || inst.calDate || new Date().toISOString().split('T')[0];
    const dueDate = it.dueDate || inst.dueDate || '-';
    const lab = it.calibratedBy || inst.calibratedBy || 'NA CALTECHNOLOGIES';
    const codeNo = inst.codeNo || it.codeNo || '-';
    const name = inst.instrumentName || it.instrumentName || 'เครื่องมือวัด';
    const maker = inst.makerName || it.makerName || '-';
    const model = inst.model || it.model || '-';
    const serial = inst.serialNo || it.serialNo || '-';
    const size = inst.size || it.size || '-';
    const accuracy = it.accuracy || inst.accuracy || '± 0.01 mm';
    const standard = it.standardUsed || inst.standardUsed || 'Standard Gauge Block Set Grade 0';
    const temp = it.temperature || inst.temperature || '20.0 °C ± 1.0 °C';
    const humid = it.humidity || inst.humidity || '50% RH ± 5%';
    const uncertainty = it.uncertainty || inst.uncertainty || 'U = ±0.005 mm (k=2)';
    const result = (it.result || 'PASS').toUpperCase();
    const isPass = result === 'PASS';
    const notes = it.notes || inst.notes || 'ผลการสอบเทียบประจำรอบ สมบูรณ์และถูกต้องตามเกณฑ์มาตรฐาน';

    const rawPdf = it.pdfUrl || it.certFileData || inst.pdfUrl || inst.certFileData;
    const blobUrl = dataUrlToBlobUrl(rawPdf);

    const overlay = document.createElement('div');
    overlay.id = 'qap-doc-viewer-modal';
    overlay.style.cssText = 'position:fixed;inset:0;z-index:999999;display:flex;align-items:center;justify-content:center;background:rgba(15,23,42,0.8);backdrop-filter:blur(6px);padding:16px;overflow-y:auto;font-family:Prompt,-apple-system,BlinkMacSystemFont,sans-serif;';

    const card = document.createElement('div');
    card.style.cssText = 'position:relative;width:100%;max-width:960px;height:90vh;max-height:92vh;background:#ffffff;border-radius:18px;overflow:hidden;display:flex;flex-direction:column;box-shadow:0 25px 60px -15px rgba(0,0,0,0.5);border:1px solid #cbd5e1;';
    card.onclick = (e) => e.stopPropagation();

    // 1. Header Bar
    const header = document.createElement('div');
    header.style.cssText = 'padding:14px 20px;background:linear-gradient(135deg, #1e293b 0%, #1e3a8a 50%, #2563eb 100%);color:#ffffff;display:flex;align-items:center;justify-content:space-between;gap:12px;flex-shrink:0;box-shadow:0 4px 12px rgba(0,0,0,0.15);';
    
    header.innerHTML = `
      <div style="display:flex;align-items:center;gap:12px;min-width:0;">
        <div style="width:40px;height:40px;border-radius:10px;background:rgba(255,255,255,0.15);border:1px solid rgba(255,255,255,0.25);display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0;">
          📄
        </div>
        <div style="min-width:0;">
          <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
            <span style="font-family:monospace;font-size:12px;font-weight:bold;background:rgba(255,255,255,0.2);padding:2px 8px;border-radius:6px;letter-spacing:0.5px;">${certNo}</span>
            <span style="font-size:11px;font-weight:bold;background:${isPass ? '#10b981' : '#ef4444'};color:#ffffff;padding:2px 8px;border-radius:9999px;">● ${isPass ? 'PASS (ผ่านเกณฑ์)' : 'FAIL (ไม่ผ่าน)'}</span>
            <span style="font-size:10px;font-weight:bold;background:rgba(255,255,255,0.15);padding:2px 6px;border-radius:9999px;font-family:monospace;">ISO/IEC 17025:2017</span>
          </div>
          <h3 style="font-size:15px;font-weight:700;margin:3px 0 0 0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:#ffffff;">
            ใบรับรองการสอบเทียบ: ${name} (${codeNo})
          </h3>
        </div>
      </div>
      <div style="display:flex;align-items:center;gap:8px;flex-shrink:0;">
        <button id="qap-doc-print-btn" type="button" style="padding:7px 14px;border-radius:8px;background:rgba(255,255,255,0.2);hover:background:rgba(255,255,255,0.3);color:#ffffff;border:1px solid rgba(255,255,255,0.3);font-size:12px;font-weight:600;cursor:pointer;display:inline-flex;align-items:center;gap:6px;transition:0.15s;" title="พิมพ์เอกสาร">
          <span>🖨️</span> พิมพ์
        </button>
        ${blobUrl ? `
          <a href="${blobUrl}" download="${certNo}.pdf" style="padding:7px 14px;border-radius:8px;background:#10b981;color:#ffffff;font-size:12px;font-weight:bold;text-decoration:none;display:inline-flex;align-items:center;gap:6px;box-shadow:0 2px 6px rgba(16,185,129,0.3);" title="ดาวน์โหลดไฟล์ PDF">
            <span>⬇️</span> ดาวน์โหลด PDF
          </a>
        ` : ''}
        <button id="qap-doc-close-btn" type="button" style="padding:7px 10px;border-radius:8px;background:rgba(255,255,255,0.15);color:#ffffff;border:none;font-size:16px;cursor:pointer;line-height:1;" title="ปิดหน้าต่าง">
          ✕
        </button>
      </div>
    `;

    // 2. Body Area
    const body = document.createElement('div');
    body.id = 'qap-doc-body-container';
    body.style.cssText = 'flex:1;overflow-y:auto;background:#f8fafc;position:relative;display:flex;flex-direction:column;';

    if (blobUrl) {
      body.innerHTML = `
        <iframe src="${blobUrl}" style="width:100%;height:100%;min-height:500px;border:none;flex:1;background:#f1f5f9;" allowfullscreen></iframe>
      `;
    } else {
      // High-definition ISO 17025 Certificate View
      body.innerHTML = `
        <div style="padding:24px;max-width:820px;margin:0 auto;width:100%;">
          <div style="background:#ffffff;border-radius:12px;padding:36px 40px;box-shadow:0 4px 20px rgba(0,0,0,0.06);border:2px solid #e2e8f0;position:relative;overflow:hidden;">
            <!-- Watermark -->
            <div style="position:absolute;top:40%;left:50%;transform:translate(-50%,-50%) rotate(-30deg);font-size:80px;font-weight:900;color:rgba(16,185,129,0.04);pointer-events:none;white-space:nowrap;user-select:none;">
              ISO 17025 PASS
            </div>

            <!-- Company Header -->
            <div style="border-bottom:2px solid #1e3a8a;padding-bottom:16px;margin-bottom:20px;display:flex;justify-content:space-between;align-items:flex-start;">
              <div>
                <div style="font-size:20px;font-weight:800;color:#1e3a8a;letter-spacing:-0.5px;">CARRIER (THAILAND) LIMITED</div>
                <div style="font-size:12px;font-weight:600;color:#475569;margin-top:2px;">QUALITY ASSURANCE &amp; METROLOGY DIVISION</div>
                <div style="font-size:11px;color:#64748b;">700/68 Moo 6, Amata City Chonburi, Thailand | Accredited ISO/IEC 17025:2017</div>
              </div>
              <div style="text-align:right;">
                <div style="font-size:11px;font-weight:bold;color:#1e3a8a;background:#eff6ff;padding:4px 10px;border-radius:6px;border:1px solid #bfdbfe;display:inline-block;">
                  QAP CALIBRATION CERTIFICATE
                </div>
                <div style="font-family:monospace;font-size:12px;font-weight:bold;color:#0f172a;margin-top:4px;">
                  No: ${certNo}
                </div>
              </div>
            </div>

            <!-- Certificate Title -->
            <div style="text-align:center;margin-bottom:24px;">
              <h1 style="font-size:20px;font-weight:800;color:#0f172a;margin:0;letter-spacing:-0.5px;">ใบรับรองการสอบเทียบ (CERTIFICATE OF CALIBRATION)</h1>
              <div style="font-size:12px;color:#475569;margin-top:4px;">ออกโดยห้องปฏิบัติการสอบเทียบเครื่องมือวัดตามข้อกำหนดมาตรฐานสากล ISO/IEC 17025:2017</div>
            </div>

            <!-- Instrument Info Table -->
            <div style="margin-bottom:20px;">
              <div style="font-size:12px;font-weight:700;color:#1e3a8a;margin-bottom:8px;display:flex;align-items:center;gap:6px;">
                <span>📌</span> รายละเอียดเครื่องมือวัดที่เข้ารับการสอบเทียบ (Instrument Under Test)
              </div>
              <table style="width:100%;border-collapse:collapse;font-size:12px;border:1px solid #cbd5e1;">
                <tbody>
                  <tr style="background:#f8fafc;">
                    <td style="padding:8px 12px;border:1px solid #cbd5e1;font-weight:bold;width:25%;color:#475569;">รหัสเครื่องมือ (Code No.)</td>
                    <td style="padding:8px 12px;border:1px solid #cbd5e1;font-family:monospace;font-weight:bold;color:#1e3a8a;">${codeNo}</td>
                    <td style="padding:8px 12px;border:1px solid #cbd5e1;font-weight:bold;width:25%;color:#475569;">ชื่อเครื่องมือ (Instrument Name)</td>
                    <td style="padding:8px 12px;border:1px solid #cbd5e1;font-weight:bold;color:#0f172a;">${name}</td>
                  </tr>
                  <tr>
                    <td style="padding:8px 12px;border:1px solid #cbd5e1;font-weight:bold;color:#475569;">ยี่ห้อ / ผู้ผลิต (Maker)</td>
                    <td style="padding:8px 12px;border:1px solid #cbd5e1;">${maker}</td>
                    <td style="padding:8px 12px;border:1px solid #cbd5e1;font-weight:bold;color:#475569;">รุ่น (Model)</td>
                    <td style="padding:8px 12px;border:1px solid #cbd5e1;">${model}</td>
                  </tr>
                  <tr style="background:#f8fafc;">
                    <td style="padding:8px 12px;border:1px solid #cbd5e1;font-weight:bold;color:#475569;">หมายเลขเครื่อง (Serial No.)</td>
                    <td style="padding:8px 12px;border:1px solid #cbd5e1;font-family:monospace;">${serial}</td>
                    <td style="padding:8px 12px;border:1px solid #cbd5e1;font-weight:bold;color:#475569;">ย่านการวัด / ขนาด (Range / Size)</td>
                    <td style="padding:8px 12px;border:1px solid #cbd5e1;">${size}</td>
                  </tr>
                  <tr>
                    <td style="padding:8px 12px;border:1px solid #cbd5e1;font-weight:bold;color:#475569;">เกณฑ์ความคลาดเคลื่อน (MPE)</td>
                    <td style="padding:8px 12px;border:1px solid #cbd5e1;color:#1e3a8a;font-weight:600;">${accuracy}</td>
                    <td style="padding:8px 12px;border:1px solid #cbd5e1;font-weight:bold;color:#475569;">ผู้ดำเนินการสอบเทียบ (Calibrated By)</td>
                    <td style="padding:8px 12px;border:1px solid #cbd5e1;">${lab}</td>
                  </tr>
                  <tr style="background:#f8fafc;">
                    <td style="padding:8px 12px;border:1px solid #cbd5e1;font-weight:bold;color:#475569;">วันที่สอบเทียบ (Cal Date)</td>
                    <td style="padding:8px 12px;border:1px solid #cbd5e1;font-weight:bold;color:#0f172a;">${calDate}</td>
                    <td style="padding:8px 12px;border:1px solid #cbd5e1;font-weight:bold;color:#475569;">วันครบกำหนด (Next Due Date)</td>
                    <td style="padding:8px 12px;border:1px solid #cbd5e1;font-weight:bold;color:#059669;">${dueDate}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Environmental & Standard -->
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:20px;">
              <div style="padding:12px;background:#f8fafc;border-radius:8px;border:1px solid #e2e8f0;font-size:11px;">
                <div style="font-weight:bold;color:#1e3a8a;margin-bottom:4px;">🌡️ สภาวะแวดล้อมขณะสอบเทียบ (Environment)</div>
                <div style="color:#475569;">อุณหภูมิ (Temperature): <strong style="color:#0f172a;">${temp}</strong></div>
                <div style="color:#475569;">ความชื้นสัมพัทธ์ (Humidity): <strong style="color:#0f172a;">${humid}</strong></div>
              </div>
              <div style="padding:12px;background:#f8fafc;border-radius:8px;border:1px solid #e2e8f0;font-size:11px;">
                <div style="font-weight:bold;color:#1e3a8a;margin-bottom:4px;">🔬 เกจมาตรฐานและสายการสอบกลับ (Traceability)</div>
                <div style="color:#475569;">มาตรฐานอ้างอิง: <strong style="color:#0f172a;">${standard}</strong></div>
                <div style="color:#475569;">ความไม่แน่นอนขยาย: <strong style="color:#0f172a;">${uncertainty}</strong></div>
              </div>
            </div>

            <!-- Evaluation Verdict -->
            <div style="padding:14px 18px;border-radius:8px;background:${isPass ? '#f0fdf4' : '#fef2f2'};border:1px solid ${isPass ? '#bbf7d0' : '#fecaca'};margin-bottom:24px;display:flex;align-items:center;justify-content:space-between;">
              <div>
                <div style="font-size:11px;font-weight:bold;color:${isPass ? '#166534' : '#991b1b'};text-transform:uppercase;">
                  ผลการตัดสินและการประเมินค่าตามเกณฑ์ (DECISION RULE &amp; RESULT)
                </div>
                <div style="font-size:13px;font-weight:bold;color:${isPass ? '#15803d' : '#b91c1c'};margin-top:2px;">
                  ${isPass ? '✓ ผ่านเกณฑ์มาตรฐานตามข้อกำหนด (CONFORMITY / IN-TOLERANCE)' : '✕ ไม่ผ่านเกณฑ์มาตรฐาน (OUT OF TOLERANCE)'}
                </div>
                <div style="font-size:11px;color:#64748b;margin-top:2px;">${notes}</div>
              </div>
              <div style="text-align:right;">
                <span style="font-size:18px;font-weight:900;padding:6px 16px;border-radius:8px;background:${isPass ? '#15803d' : '#b91c1c'};color:#ffffff;display:inline-block;letter-spacing:1px;">
                  ${result}
                </span>
              </div>
            </div>

            <!-- Signatures Block -->
            <div style="border-top:1px solid #cbd5e1;padding-top:16px;display:grid;grid-template-columns:1fr 1fr;gap:24px;text-align:center;">
              <div>
                <div style="font-size:11px;color:#64748b;margin-bottom:28px;">ผู้ดำเนินการสอบเทียบ (Calibrated By)</div>
                <div style="border-top:1px dashed #94a3b8;width:80%;margin:0 auto 4px auto;"></div>
                <div style="font-size:12px;font-weight:bold;color:#0f172a;">${it.performedBy || 'QAP Calibration Specialist'}</div>
                <div style="font-size:10px;color:#64748b;">Metrology Officer</div>
              </div>
              <div>
                <div style="font-size:11px;color:#64748b;margin-bottom:28px;">ผู้มีอำนาจอนุมัติผล (Approved By)</div>
                <div style="border-top:1px dashed #94a3b8;width:80%;margin:0 auto 4px auto;"></div>
                <div style="font-size:12px;font-weight:bold;color:#0f172a;">${it.approvedBy || 'QAP Metrology Manager'}</div>
                <div style="font-size:10px;color:#64748b;">ISO/IEC 17025 Lead Metrologist</div>
              </div>
            </div>

          </div>
        </div>
      `;
    }

    card.appendChild(header);
    card.appendChild(body);
    overlay.appendChild(card);
    document.body.appendChild(overlay);

    // Event listeners
    const closeBtn = document.getElementById('qap-doc-close-btn');
    if (closeBtn) closeBtn.onclick = () => overlay.remove();
    overlay.onclick = (e) => {
      if (e.target === overlay) overlay.remove();
    };

    const printBtn = document.getElementById('qap-doc-print-btn');
    if (printBtn) {
      printBtn.onclick = () => {
        if (blobUrl) {
          const w = window.open(blobUrl);
          if (w) w.print();
          else window.print();
        } else {
          window.print();
        }
      };
    }

    const escHandler = (e) => {
      if (e.key === 'Escape') {
        overlay.remove();
        window.removeEventListener('keydown', escHandler);
      }
    };
    window.addEventListener('keydown', escHandler);
  };

  // Replace window.qapPdfView to directly open this viewer!
  window.qapPdfView = function(base64, certNo) {
    window.qapOpenDocViewer({ pdfUrl: base64, certNo: certNo || 'CERT-PDF' }, {});
  };
})();
