// scripts/doc_viewer.js
// Provides window.qapOpenDocViewer and enhances window.qapPdfView
// Uses PDF.js Canvas rendering so browsers like Edge/Chrome NEVER block PDFs in sandboxed iframes.

(function() {
  function dataUrlToUint8Array(dataUrl) {
    if (!dataUrl || typeof dataUrl !== 'string') return null;
    if (dataUrl.startsWith('data:')) {
      try {
        const parts = dataUrl.split(',');
        if (parts.length < 2) return null;
        const bstr = atob(parts[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
          u8arr[n] = bstr.charCodeAt(n);
        }
        return u8arr;
      } catch (e) {
        console.warn('Failed to convert data URL to Uint8Array:', e);
        return null;
      }
    }
    return null;
  }

  function dataUrlToBlobUrl(dataUrl) {
    if (!dataUrl || typeof dataUrl !== 'string') return null;
    if (dataUrl.startsWith('blob:') || dataUrl.startsWith('http://') || dataUrl.startsWith('https://')) {
      return dataUrl;
    }
    const u8arr = dataUrlToUint8Array(dataUrl);
    if (u8arr) {
      try {
        const parts = dataUrl.split(',');
        const mimeMatch = parts[0].match(/:(.*?);/);
        const mime = (mimeMatch && mimeMatch[1]) ? mimeMatch[1] : 'application/pdf';
        const blob = new Blob([u8arr], { type: mime });
        return URL.createObjectURL(blob);
      } catch (e) {
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
    const isImage = rawPdf && typeof rawPdf === 'string' && (rawPdf.startsWith('data:image/') || rawPdf.endsWith('.png') || rawPdf.endsWith('.jpg') || rawPdf.endsWith('.jpeg') || rawPdf.endsWith('.webp'));

    const overlay = document.createElement('div');
    overlay.id = 'qap-doc-viewer-modal';
    overlay.style.cssText = 'position:fixed;inset:0;z-index:999999;display:flex;align-items:center;justify-content:center;background:rgba(15,23,42,0.88);backdrop-filter:blur(8px);padding:12px;overflow-y:auto;font-family:Prompt,-apple-system,BlinkMacSystemFont,sans-serif;';

    const card = document.createElement('div');
    card.style.cssText = 'position:relative;width:100%;max-width:1080px;height:92vh;max-height:94vh;background:#ffffff;border-radius:18px;overflow:hidden;display:flex;flex-direction:column;box-shadow:0 25px 60px -15px rgba(0,0,0,0.6);border:1px solid #334155;';
    card.onclick = (e) => e.stopPropagation();

    // 1. Header Bar
    const header = document.createElement('div');
    header.style.cssText = 'padding:10px 18px;background:linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #2563eb 100%);color:#ffffff;display:flex;align-items:center;justify-content:space-between;gap:12px;flex-shrink:0;box-shadow:0 4px 12px rgba(0,0,0,0.2);';
    
    header.innerHTML = `
      <div style="display:flex;align-items:center;gap:10px;min-width:0;">
        <div style="width:38px;height:38px;border-radius:10px;background:rgba(255,255,255,0.15);border:1px solid rgba(255,255,255,0.25);display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0;">
          📄
        </div>
        <div style="min-width:0;">
          <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
            <span style="font-family:monospace;font-size:12px;font-weight:bold;background:rgba(255,255,255,0.2);padding:2px 8px;border-radius:6px;letter-spacing:0.5px;">${certNo}</span>
            <span style="font-size:11px;font-weight:bold;background:${isPass ? '#10b981' : '#ef4444'};color:#ffffff;padding:2px 8px;border-radius:9999px;">● ${isPass ? 'PASS (ผ่านเกณฑ์)' : 'FAIL (ไม่ผ่าน)'}</span>
            <span style="font-size:10px;font-weight:bold;background:rgba(255,255,255,0.15);padding:2px 6px;border-radius:9999px;font-family:monospace;">ISO/IEC 17025:2017</span>
          </div>
          <h3 style="font-size:14px;font-weight:700;margin:2px 0 0 0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:#ffffff;">
            ใบรับรองการสอบเทียบ: ${name} (${codeNo})
          </h3>
        </div>
      </div>
      <div style="display:flex;align-items:center;gap:8px;flex-shrink:0;">
        ${blobUrl ? `
          <button id="qap-doc-open-tab-btn" type="button" style="padding:6px 12px;border-radius:8px;background:rgba(255,255,255,0.18);color:#ffffff;border:1px solid rgba(255,255,255,0.3);font-size:12px;font-weight:600;cursor:pointer;display:inline-flex;align-items:center;gap:5px;transition:0.15s;" title="เปิดดูในแท็บใหม่">
            <span>↗️</span> เปิดแท็บใหม่
          </button>
          <a href="${blobUrl}" download="${certNo}.pdf" style="padding:6px 12px;border-radius:8px;background:#10b981;color:#ffffff;font-size:12px;font-weight:bold;text-decoration:none;display:inline-flex;align-items:center;gap:5px;box-shadow:0 2px 6px rgba(16,185,129,0.3);" title="ดาวน์โหลดไฟล์ PDF">
            <span>⬇️</span> ดาวน์โหลด
          </a>
        ` : ''}
        <button id="qap-doc-print-btn" type="button" style="padding:6px 12px;border-radius:8px;background:rgba(255,255,255,0.18);color:#ffffff;border:1px solid rgba(255,255,255,0.3);font-size:12px;font-weight:600;cursor:pointer;display:inline-flex;align-items:center;gap:5px;transition:0.15s;" title="พิมพ์เอกสาร">
          <span>🖨️</span> พิมพ์
        </button>
        <button id="qap-doc-close-btn" type="button" style="padding:6px 10px;border-radius:8px;background:rgba(255,255,255,0.15);color:#ffffff;border:none;font-size:16px;cursor:pointer;line-height:1;" title="ปิดหน้าต่าง">
          ✕
        </button>
      </div>
    `;

    // 2. Body Area
    const body = document.createElement('div');
    body.id = 'qap-doc-body-container';
    body.style.cssText = 'flex:1;overflow-y:auto;background:#0f172a;position:relative;display:flex;flex-direction:column;';

    if (blobUrl) {
      if (isImage) {
        body.innerHTML = `
          <div style="flex:1;display:flex;align-items:center;justify-content:center;padding:20px;background:#0f172a;">
            <img src="${blobUrl}" alt="Certificate Document" style="max-width:100%;max-height:100%;object-fit:contain;border-radius:8px;box-shadow:0 10px 30px rgba(0,0,0,0.5);" />
          </div>
        `;
      } else {
        // PDF Canvas Viewer Container
        body.innerHTML = `
          <div style="display:flex;flex-direction:column;width:100%;height:100%;flex:1;background:#0f172a;">
            <!-- PDF Toolbar -->
            <div id="pdf-toolbar" style="padding:8px 16px;background:#1e293b;border-bottom:1px solid #334155;display:flex;align-items:center;justify-content:between;gap:12px;flex-wrap:wrap;color:#f8fafc;font-size:12px;">
              <div style="display:flex;align-items:center;gap:8px;">
                <button id="pdf-prev-btn" type="button" style="padding:4px 10px;border-radius:6px;background:#334155;color:#fff;border:none;cursor:pointer;font-weight:bold;">◀ ก่อนหน้า</button>
                <span id="pdf-page-num-display" style="font-family:monospace;font-weight:bold;color:#93c5fd;">หน้า <span id="pdf-curr-page">1</span> / <span id="pdf-total-pages">1</span></span>
                <button id="pdf-next-btn" type="button" style="padding:4px 10px;border-radius:6px;background:#334155;color:#fff;border:none;cursor:pointer;font-weight:bold;">ถัดไป ▶</button>
              </div>
              <div style="display:flex;align-items:center;gap:8px;margin-left:auto;">
                <button id="pdf-zoom-out" type="button" style="padding:4px 8px;border-radius:6px;background:#334155;color:#fff;border:none;cursor:pointer;font-weight:bold;" title="ซูมออก">🔍−</button>
                <span id="pdf-zoom-level" style="font-family:monospace;color:#cbd5e1;">100%</span>
                <button id="pdf-zoom-in" type="button" style="padding:4px 8px;border-radius:6px;background:#334155;color:#fff;border:none;cursor:pointer;font-weight:bold;" title="ซูมเข้า">🔍＋</button>
                <button id="pdf-fit-width" type="button" style="padding:4px 10px;border-radius:6px;background:#2563eb;color:#fff;border:none;cursor:pointer;font-weight:bold;">พอดีหน้าจอ</button>
              </div>
            </div>
            <!-- Canvas Container -->
            <div id="pdf-canvas-scroll-wrapper" style="flex:1;overflow:auto;padding:20px;display:flex;flex-direction:column;align-items:center;gap:16px;background:#0f172a;">
              <div id="pdf-loading-indicator" style="color:#94a3b8;padding:40px;text-align:center;font-size:14px;display:flex;flex-direction:column;align-items:center;gap:12px;">
                <div style="width:32px;height:32px;border:3px solid rgba(255,255,255,0.2);border-top-color:#38bdf8;border-radius:50%;animation:spin 1s linear infinite;"></div>
                <span>กำลังโหลดและประมวลผลหน้าเอกสาร PDF...</span>
              </div>
              <div id="pdf-pages-container" style="display:flex;flex-direction:column;align-items:center;gap:20px;width:100%;"></div>
            </div>
          </div>
        `;
      }
    } else {
      // High-definition ISO 17025 Certificate View (fallback when no PDF attached)
      body.style.background = '#f8fafc';
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

    const openTabBtn = document.getElementById('qap-doc-open-tab-btn');
    if (openTabBtn && blobUrl) {
      openTabBtn.onclick = () => {
        window.open(blobUrl, '_blank');
      };
    }

    const printBtn = document.getElementById('qap-doc-print-btn');
    if (printBtn) {
      printBtn.onclick = () => {
        if (blobUrl) {
          const w = window.open(blobUrl, '_blank');
          if (w) {
            setTimeout(() => w.print(), 500);
          } else {
            window.print();
          }
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

    // Render PDF with PDF.js if available and PDF file exists
    if (blobUrl && !isImage) {
      const renderPdfDoc = async () => {
        const loadingIndicator = document.getElementById('pdf-loading-indicator');
        const pagesContainer = document.getElementById('pdf-pages-container');
        const currPageEl = document.getElementById('pdf-curr-page');
        const totalPagesEl = document.getElementById('pdf-total-pages');
        const zoomLevelEl = document.getElementById('pdf-zoom-level');
        const prevBtn = document.getElementById('pdf-prev-btn');
        const nextBtn = document.getElementById('pdf-next-btn');
        const zoomInBtn = document.getElementById('pdf-zoom-in');
        const zoomOutBtn = document.getElementById('pdf-zoom-out');
        const fitWidthBtn = document.getElementById('pdf-fit-width');

        if (!pagesContainer) return;

        let pdfDoc = null;
        let scale = 1.3;
        let currentPageNum = 1;
        let numPages = 1;

        const loadPdfData = async () => {
          if (!window.pdfjsLib) {
            // Wait up to 2 seconds for pdfjsLib to load
            for (let i = 0; i < 20; i++) {
              await new Promise(r => setTimeout(r, 100));
              if (window.pdfjsLib) break;
            }
          }

          if (!window.pdfjsLib) {
            if (loadingIndicator) {
              loadingIndicator.innerHTML = `
                <div style="padding:24px;text-align:center;color:#f8fafc;">
                  <p style="font-size:15px;font-weight:bold;margin-bottom:12px;">📄 เอกสาร PDF ใบรับรองการสอบเทียบ</p>
                  <div style="display:flex;gap:10px;justify-content:center;margin-top:16px;">
                    <a href="${blobUrl}" target="_blank" style="padding:10px 18px;background:#2563eb;color:#fff;border-radius:8px;font-weight:bold;text-decoration:none;">↗️ เปิดดูไฟล์ PDF ในแท็บใหม่</a>
                    <a href="${blobUrl}" download="${certNo}.pdf" style="padding:10px 18px;background:#10b981;color:#fff;border-radius:8px;font-weight:bold;text-decoration:none;">⬇️ ดาวน์โหลด PDF</a>
                  </div>
                </div>
              `;
            }
            return;
          }

          try {
            const rawUint8 = dataUrlToUint8Array(rawPdf);
            const loadingTask = rawUint8 ? window.pdfjsLib.getDocument({ data: rawUint8 }) : window.pdfjsLib.getDocument(blobUrl);
            pdfDoc = await loadingTask.promise;
            numPages = pdfDoc.numPages;
            if (totalPagesEl) totalPagesEl.textContent = numPages;
            if (loadingIndicator) loadingIndicator.style.display = 'none';

            await renderAllPages();
          } catch (err) {
            console.error('PDF.js render error:', err);
            if (loadingIndicator) {
              loadingIndicator.innerHTML = `
                <div style="padding:20px;text-align:center;color:#f8fafc;">
                  <p style="font-size:14px;color:#fca5a5;margin-bottom:12px;">⚠️ ไม่สามารถแปลงหน้า PDF ด้วยโปรแกรมแสดงผลภายในได้</p>
                  <a href="${blobUrl}" target="_blank" style="padding:8px 16px;background:#2563eb;color:#fff;border-radius:8px;font-weight:bold;text-decoration:none;display:inline-block;margin-top:6px;">↗️ คลิกที่นี่เพื่อเปิดดูในแท็บใหม่</a>
                </div>
              `;
            }
          }
        };

        const renderAllPages = async () => {
          if (!pdfDoc) return;
          pagesContainer.innerHTML = '';

          for (let pageNum = 1; pageNum <= numPages; pageNum++) {
            const page = await pdfDoc.getPage(pageNum);
            const viewport = page.getViewport({ scale: scale });

            const pageWrapper = document.createElement('div');
            pageWrapper.id = `pdf-page-${pageNum}`;
            pageWrapper.style.cssText = 'position:relative;margin-bottom:16px;box-shadow:0 8px 30px rgba(0,0,0,0.5);border-radius:6px;overflow:hidden;background:#ffffff;';

            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.height = viewport.height;
            canvas.width = viewport.width;
            canvas.style.display = 'block';

            pageWrapper.appendChild(canvas);
            pagesContainer.appendChild(pageWrapper);

            const renderContext = {
              canvasContext: context,
              viewport: viewport
            };
            await page.render(renderContext).promise;
          }

          if (zoomLevelEl) zoomLevelEl.textContent = Math.round(scale * 100) + '%';
        };

        if (zoomInBtn) {
          zoomInBtn.onclick = async () => {
            scale = Math.min(scale + 0.25, 3.0);
            await renderAllPages();
          };
        }

        if (zoomOutBtn) {
          zoomOutBtn.onclick = async () => {
            scale = Math.max(scale - 0.25, 0.5);
            await renderAllPages();
          };
        }

        if (fitWidthBtn) {
          fitWidthBtn.onclick = async () => {
            if (!pdfDoc) return;
            const scrollWrapper = document.getElementById('pdf-canvas-scroll-wrapper');
            const availWidth = (scrollWrapper ? scrollWrapper.clientWidth : 800) - 60;
            const firstPage = await pdfDoc.getPage(1);
            const defaultViewport = firstPage.getViewport({ scale: 1.0 });
            scale = Math.max(0.5, Math.min(availWidth / defaultViewport.width, 2.5));
            await renderAllPages();
          };
        }

        if (prevBtn) {
          prevBtn.onclick = () => {
            if (currentPageNum > 1) {
              currentPageNum--;
              if (currPageEl) currPageEl.textContent = currentPageNum;
              const target = document.getElementById(`pdf-page-${currentPageNum}`);
              if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
          };
        }

        if (nextBtn) {
          nextBtn.onclick = () => {
            if (currentPageNum < numPages) {
              currentPageNum++;
              if (currPageEl) currPageEl.textContent = currentPageNum;
              const target = document.getElementById(`pdf-page-${currentPageNum}`);
              if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
          };
        }

        // Run loader
        loadPdfData();
      };

      setTimeout(renderPdfDoc, 50);
    }
  };

  // Replace window.qapPdfView to directly open this viewer!
  window.qapPdfView = function(base64, certNo, instrument) {
    window.qapOpenDocViewer({ pdfUrl: base64, certFileData: base64, certNo: certNo || 'CERT-PDF' }, instrument || {});
  };
})();
