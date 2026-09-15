// scripts/patch_j3e.js
const fs = require('fs');

let code = fs.readFileSync('scripts/j3e_extracted.js', 'utf8');

// 1. Update isEdit determination and defaultCategory prop
code = code.replace(
  'const J3e = ({ isOpen: e, onClose: t, onSave: r, instrumentToEdit: n, totalInstrumentsCount: l }) => {',
  'const J3e = ({ isOpen: e, onClose: t, onSave: r, instrumentToEdit: n, defaultCategory: defCat = "NORMAL STANDARD", totalInstrumentsCount: l }) => {'
);

code = code.replace(
  'const o = !!n;',
  'const isEdit = !!(n && n.id && (n.codeNo || n.instrumentName)); const o = isEdit;'
);

// 2. Update useEffect initialization for edit vs add
const oldEffect = `  A.useEffect(() => {
    if (n) {`;
const newEffect = `  A.useEffect(() => {
    if (isEdit) {`;
code = code.replace(oldEffect, newEffect);

// 3. Clean up the else branch in useEffect (when adding a new instrument)
const nowIdx = code.indexOf('const now = new Date();');
const elseStart = code.lastIndexOf('} else {', nowIdx);
const elseEnd = code.indexOf('setErrorMsg("");', nowIdx);

if (elseStart !== -1 && elseEnd !== -1) {
  const newElse = `} else {
      const now = new Date();
      const todayStr = now.toISOString().split("T")[0];
      const nextYear = new Date(now);
      nextYear.setFullYear(now.getFullYear() + 1);
      const nextYearStr = nextYear.toISOString().split("T")[0];
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const currentMonth = monthNames[now.getMonth()];
      const initialCat = (n && n.category) || defCat || "NORMAL STANDARD";
      setF({
        no: l + 1,
        instrumentName: "",
        makerName: "",
        model: "",
        codeNo: "",
        serialNo: "",
        size: "",
        calDate: todayStr,
        dueDate: nextYearStr,
        section: "",
        subSection: "",
        registerDate: todayStr,
        frequency: "1 Year",
        month: currentMonth,
        imageUrl: "",
        status: "normal",
        location: "",
        calibratedBy: "",
        certNo: "",
        standardUsed: "",
        accuracy: "",
        notes: "",
        temperature: "",
        humidity: "",
        uncertainty: "",
        traceability: "",
        dueYear: nextYear.getFullYear().toString(),
        category: initialCat,
        controlInstrument: "",
        ctcControl: "YES",
        labCal: "",
        pdfUrl: ""
      });
      setIsoChecklist(i5(true));
      setIsoAuditedBy("QAP Metrology Lead Auditor");
      setIsoAuditDate(todayStr);
      setHistoryList([]);
    }    `;
  code = code.slice(0, elseStart) + newElse + code.slice(elseEnd);
  console.log('Successfully replaced else block in useEffect');
} else {
  console.warn('else block not found');
}

// 4. Update Header Bar
const oldHeaderBadges = `            h("div", { className: "flex items-center gap-2" },
              h("span", { className: "px-2 py-0.5 rounded bg-white/20 text-white font-mono text-xs font-bold tracking-wide" },
                f.codeNo || "CAL-000"
              ),
              h("span", {
                className: "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider " +
                  (f.status === "normal" ? "bg-emerald-500 text-white" : f.status === "due_soon" ? "bg-amber-500 text-white" : f.status === "overdue" ? "bg-rose-600 text-white" : "bg-blue-600 text-white")
              },
                "● " + (f.status === "normal" ? "ปกติ (IN SPEC)" : f.status === "due_soon" ? "ใกล้ครบกำหนด" : f.status === "overdue" ? "เกินกำหนด" : f.status === "external" ? "ส่งสอบเทียบภายนอก" : "ปลดระวาง/ยกเลิก")
              ),
              h("span", { className: "px-2 py-0.5 rounded-full text-[10px] font-black uppercase font-mono tracking-wider bg-emerald-500/90 text-white shadow-2xs hidden sm:inline-block" },
                "ISO/IEC 17025:2017"
              )
            ),
            h("h2", { className: "text-base font-bold text-white tracking-tight mt-0.5 line-clamp-1" },
              o ? (f.instrumentName ? f.instrumentName : "แก้ไขข้อมูลเครื่องมือวัด & การประเมิน ISO 17025") : "ขึ้นทะเบียนเครื่องมือวัดใหม่ (Register Instrument)"
            )`;

const newHeaderBadges = `            h("div", { className: "flex items-center gap-2 flex-wrap" },
              o ? h("span", { className: "px-2 py-0.5 rounded bg-white/20 text-white font-mono text-xs font-bold tracking-wide" },
                f.codeNo || "CAL-000"
              ) : h("span", { className: "px-2.5 py-0.5 rounded-full bg-emerald-500 text-white text-xs font-black tracking-wide flex items-center gap-1 shadow-sm" },
                "➕ โหมดเพิ่มข้อมูลใหม่ (ไม่ใช่การแก้ไข)"
              ),
              o ? h("span", {
                className: "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider " +
                  (f.status === "normal" ? "bg-emerald-500 text-white" : f.status === "due_soon" ? "bg-amber-500 text-white" : f.status === "overdue" ? "bg-rose-600 text-white" : "bg-blue-600 text-white")
              },
                "● " + (f.status === "normal" ? "ปกติ (IN SPEC)" : f.status === "due_soon" ? "ใกล้ครบกำหนด" : f.status === "overdue" ? "เกินกำหนด" : f.status === "external" ? "ส่งสอบเทียบภายนอก" : "ปลดระวาง/ยกเลิก")
              ) : (f.codeNo ? h("span", { className: "px-2 py-0.5 rounded bg-white/20 text-white font-mono text-xs font-bold" }, f.codeNo) : null),
              h("span", { className: "px-2 py-0.5 rounded-full text-[10px] font-black uppercase font-mono tracking-wider bg-emerald-500/90 text-white shadow-2xs hidden sm:inline-block" },
                "ISO/IEC 17025:2017"
              )
            ),
            h("h2", { className: "text-base font-bold text-white tracking-tight mt-0.5 line-clamp-1" },
              o ? (f.instrumentName ? ("แก้ไข: " + f.instrumentName) : "แก้ไขข้อมูลเครื่องมือวัด & การประเมิน ISO 17025")
                : "ขึ้นทะเบียนเครื่องมือวัดใหม่ (เพิ่มข้อมูลใหม่)"
            )`;

if (code.includes(oldHeaderBadges)) {
  code = code.replace(oldHeaderBadges, newHeaderBadges);
  console.log('Successfully replaced oldHeaderBadges');
} else {
  console.warn('oldHeaderBadges not matched exactly');
}

// 5. Update Code No input with quick-suggest button
const oldCodeInput = `                  h("label", { className: "block font-bold text-slate-700 dark:text-slate-300 mb-1" }, "รหัสเครื่องมือ (Code No.) *"),
                  h("input", {
                    type: "text",
                    value: f.codeNo || "",
                    onChange: e => setF({ ...f, codeNo: e.target.value }),
                    placeholder: "DBD-030-001",
                    className: "w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono font-bold text-xs focus:ring-1 focus:ring-blue-500"
                  })`;

const newCodeInput = `                  h("div", { className: "flex items-center justify-between mb-1" },
                    h("label", { className: "block font-bold text-slate-700 dark:text-slate-300" }, "รหัสเครื่องมือ (Code No.) *"),
                    !o && h("button", {
                      type: "button",
                      onClick: () => setF(prev => ({ ...prev, codeNo: "CAL-" + String(l + 1).padStart(3, "0") })),
                      className: "text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer flex items-center gap-1",
                      title: "คลิกเพื่อใช้รหัสแนะนำอัตโนมัติ"
                    }, "⚡ แนะนำ: CAL-" + (l + 1))
                  ),
                  h("input", {
                    type: "text",
                    value: f.codeNo || "",
                    onChange: e => setF({ ...f, codeNo: e.target.value }),
                    placeholder: "ระบุรหัส เช่น CAL-001 หรือกดแนะนำรหัส",
                    className: "w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono font-bold text-xs focus:ring-1 focus:ring-blue-500"
                  })`;

if (code.includes(oldCodeInput)) {
  code = code.replace(oldCodeInput, newCodeInput);
  console.log('Successfully replaced oldCodeInput');
} else {
  console.warn('oldCodeInput not matched exactly');
}

// 6. Update placeholders for all fields in Tab 1
code = code.replace('placeholder: "DIGMATIC DEPTH GAUGE"', 'placeholder: "ระบุชื่อเครื่องมือวัด เช่น ไมโครมิเตอร์, เวอร์เนียร์, เกจวัด..."');
code = code.replace('placeholder: "KANON / MITUTOYO"', 'placeholder: "ระบุยี่ห้อ / ผู้ผลิต เช่น Mitutoyo, Fluke, KANON..."');
code = code.replace('placeholder: "E-DP2J / 500-196-30"', 'placeholder: "ระบุรุ่น (Model)..."');
code = code.replace('placeholder: "14Z19 / SN-884920"', 'placeholder: "ระบุหมายเลขเครื่อง (Serial No.)..."');
code = code.replace('placeholder: "0-20 mm / 0-150 mm"', 'placeholder: "ระบุย่านการวัด / ขนาด เช่น 0-150 mm, 0-25 mm..."');
code = code.replace('placeholder: "± 0.01 mm, ± 0.05% FS"', 'placeholder: "ระบุค่าความคลาดเคลื่อน เช่น ± 0.01 mm, ± 0.5%..."');
code = code.replace('placeholder: "QAP Section / Production"', 'placeholder: "ระบุแผนก เช่น QAP, QA, QC, ฝ่ายผลิต..."');
code = code.replace('placeholder: "Quality Inspection / Line 1"', 'placeholder: "ระบุจุดใช้งาน / ไลน์การผลิต..."');
code = code.replace('placeholder: "CENTRALIZED / QAP-01"', 'placeholder: "เช่น CENTRALIZED, QAP-01..."');
code = code.replace('placeholder: "NA CALTECHNOLOGIES / INTERNAL"', 'placeholder: "ระบุห้องแล็บสอบเทียบ เช่น NA CALTECHNOLOGIES, NIMT..."');
code = code.replace('placeholder: "Standard Gauge Block Set ISO 3650 Grade 0"', 'placeholder: "ระบุเกจมาตรฐานอ้างอิง เช่น Standard Gauge Block Set Grade 0..."');

// 7. Update Tab 2 empty state and "📄 ดูใบเซอร์ PDF" button
const emptyStart = code.indexOf('historyList.length === 0 && h("div",');
const emptyEnd = code.indexOf('}, "ยังไม่มีประวัติการสอบเทียบ ให้คลิกปุ่ม \'+ บันทึกรอบใหม่\' ด้านบน"),');

if (emptyStart !== -1 && emptyEnd !== -1) {
  const fullEmptyEnd = emptyEnd + '}, "ยังไม่มีประวัติการสอบเทียบ ให้คลิกปุ่ม \'+ บันทึกรอบใหม่\' ด้านบน"),'.length;
  const newHistoryEmpty = `historyList.length === 0 && h("div", {
              className: "p-8 text-center bg-white dark:bg-slate-900 rounded-xl border border-dashed border-slate-300 dark:border-slate-800 space-y-3"
            },
              h("div", { className: "w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto text-xl" }, "📋"),
              h("div", null,
                h("h4", { className: "text-sm font-bold text-slate-800 dark:text-slate-200" }, "ยังไม่มีประวัติการสอบเทียบสำหรับเครื่องมือใหม่นี้"),
                h("p", { className: "text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto" },
                  "สามารถบันทึกข้อมูลเครื่องมือวัดก่อนได้ หรือคลิกปุ่มด้านล่างเพื่อบันทึกผลการสอบเทียบรอบแรก"
                )
              ),
              h("button", {
                type: "button",
                onClick: () => setShowNewRoundForm(true),
                className: "px-4 py-2 rounded-xl bg-blue-700 hover:bg-blue-600 text-white text-xs font-bold transition shadow-sm inline-flex items-center gap-1.5 cursor-pointer"
              },
                h("span", null, "+"),
                h("span", null, "บันทึกผลการสอบเทียบรอบแรก")
              )
            ),`;
  code = code.slice(0, emptyStart) + newHistoryEmpty + code.slice(fullEmptyEnd);
  console.log('Successfully replaced oldHistoryEmpty');
} else {
  console.warn('oldHistoryEmpty not matched');
}

// 8. Update "📄 ดูใบเซอร์ PDF" button in timeline list
const oldPdfButton = `                    // PDF Badge or Upload Button
                    item.pdfUrl ? h("a", {
                      href: item.pdfUrl,
                      target: "_blank",
                      rel: "noopener noreferrer",
                      className: "px-2 py-1 rounded bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300 border border-rose-200 text-[10px] font-bold hover:bg-rose-100 transition"
                    }, "📄 ดูใบเซอร์ PDF") : h("label", {
                      className: "px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-bold cursor-pointer transition border border-slate-200 dark:border-slate-700"
                    },
                      h("span", null, "+ แนบ PDF"),
                      h("input", {
                        type: "file",
                        accept: "application/pdf",
                        onChange: e => handlePdfAttach(e, idx),
                        className: "hidden"
                      })
                    ),`;

const newPdfButton = `                    // PDF Badge and Action Buttons (View Document & Upload)
                    h("button", {
                      type: "button",
                      onClick: () => {
                        if (typeof window.qapOpenDocViewer === "function") {
                          window.qapOpenDocViewer(item, f);
                        } else {
                          window.qapPdfView(item.pdfUrl, item.certNo, f);
                        }
                      },
                      className: "px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/70 dark:hover:bg-rose-900 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 text-[10px] font-bold transition flex items-center gap-1 cursor-pointer shadow-2xs",
                      title: "คลิกเพื่อเปิดดูเอกสารใบรับรองทันที"
                    },
                      h("span", null, "📄"),
                      h("span", null, "ดูใบเซอร์ PDF")
                    ),
                    h("label", {
                      className: "px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-[10px] font-bold cursor-pointer transition border border-slate-200 dark:border-slate-700 flex items-center gap-1",
                      title: item.pdfUrl ? "เปลี่ยนไฟล์ PDF ฉบับสแกน" : "แนบไฟล์ PDF ฉบับสแกน"
                    },
                      h("span", null, item.pdfUrl ? "📎 เปลี่ยน PDF" : "+ แนบ PDF"),
                      h("input", {
                        type: "file",
                        accept: "application/pdf",
                        onChange: e => handlePdfAttach(e, idx),
                        className: "hidden"
                      })
                    ),`;

if (code.includes(oldPdfButton)) {
  code = code.replace(oldPdfButton, newPdfButton);
  console.log('Successfully replaced oldPdfButton');
} else {
  console.warn('oldPdfButton not matched exactly');
}

// 9. Update Footer Bar
code = code.replace(
  'o ? "กำลังแก้ไขรหัส " + (f.codeNo || "") : "กำลังขึ้นทะเบียนใหม่"',
  'o ? ("โหมด: แก้ไขข้อมูลเครื่องมือวัด (" + (f.codeNo || "") + ")") : "โหมด: เพิ่มข้อมูลใหม่ (ไม่ใช่การแก้ไข)"'
);
code = code.replace(
  'o ? "บันทึกการแก้ไขเครื่องมือวัด" : "ยืนยันขึ้นทะเบียนเครื่องมือวัด"',
  'o ? "บันทึกการแก้ไขเครื่องมือวัด" : "ยืนยันเพิ่มเครื่องมือวัดใหม่"'
);

// 10. Update handleSave to ensure proper payload.id and initial history if empty
code = code.replace(
  'id: n ? n.id : ("inst-" + Date.now()),',
  'id: (isEdit && n && n.id) ? n.id : ("inst-" + Date.now()),'
);

fs.writeFileSync('scripts/j3e_patched.js', code);
console.log('Written patched J3e, size:', fs.statSync('scripts/j3e_patched.js').size);
