// scripts/build_dynamic_modal.cjs
const fs = require('fs');

// Read current j3e_extracted.js to extract the history tab implementation intact
const oldCode = fs.readFileSync('scripts/j3e_extracted.js', 'utf8');

const histStart = oldCode.indexOf('activeTab === "history" &&');
if (histStart === -1) {
  console.error('Could not find history tab start');
  process.exit(1);
}

// Find footer start
const footerStart = oldCode.indexOf('// 4. Footer Bar', histStart);
if (footerStart === -1) {
  console.error('Could not find footer start');
  process.exit(1);
}

// Slice history tab code (strip trailing comma and closing paren for body)
let historyTabCode = oldCode.slice(histStart, footerStart).trim();
if (historyTabCode.endsWith(',')) {
  historyTabCode = historyTabCode.slice(0, -1).trim();
}
if (historyTabCode.endsWith(')')) {
  historyTabCode = historyTabCode.slice(0, -1).trim();
}

// Safely replace PDF button with direct window.qapPdfView handler so browsers never block top-level data URLs
historyTabCode = historyTabCode.replace(
  /item\.pdfUrl \? h\("a",\s*\{[\s\S]*?\}, "📄 ดูใบเซอร์ PDF"\)/g,
  `item.pdfUrl ? h("button", {
                      type: "button",
                      onClick: () => {
                        if (typeof window.qapPdfView === "function") {
                          window.qapPdfView(item.pdfUrl, item.certNo, f);
                        } else if (typeof window.qapOpenDocViewer === "function") {
                          window.qapOpenDocViewer(item, f);
                        } else if (item.pdfUrl) {
                          const w = window.open();
                          if (w) w.document.write('<iframe src="' + item.pdfUrl + '" style="width:100%;height:100%;border:none;"></iframe>');
                        }
                      },
                      className: "px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300 border border-rose-200 dark:border-rose-800 text-[10px] font-bold transition flex items-center gap-1 cursor-pointer shadow-2xs"
                    }, "📄 ดูใบเซอร์ PDF")`
);
historyTabCode = historyTabCode.replace(/historyList\.map\(/g, '(Array.isArray(historyList) ? historyList : []).map(');
historyTabCode = historyTabCode.replace(/historyList\.filter\(/g, '(Array.isArray(historyList) ? historyList : []).filter(');

console.log('History tab extracted, length:', historyTabCode.length);

const newJ3eCode = `const J3e = ({ isOpen: e, onClose: t, onSave: r, instrumentToEdit: n, defaultCategory: defCat = "NORMAL STANDARD", totalInstrumentsCount: l, currentTab, activeTab: activeTabProp }) => {
  const h = A.createElement;
  const isEdit = !!(n && n.id && (n.codeNo || n.instrumentName));
  const o = isEdit;

  // Determine current active page from props
  const initialPage = (activeTabProp && activeTabProp !== "dashboard") ? activeTabProp
    : (currentTab && currentTab !== "dashboard") ? currentTab
    : (defCat === "CANCEL" ? "cancel" : defCat === "CENTRALIZED" ? "centralized" : defCat === "EACH SECTION" ? "each_section" : "normal_standard");

  const [selectedPage, setSelectedPage] = A.useState(initialPage);

  // Synchronize with external page if changed or when modal opens
  A.useEffect(() => {
    const p = (activeTabProp && activeTabProp !== "dashboard") ? activeTabProp
      : (currentTab && currentTab !== "dashboard") ? currentTab
      : (defCat === "CANCEL" ? "cancel" : defCat === "CENTRALIZED" ? "centralized" : defCat === "EACH SECTION" ? "each_section" : "normal_standard");
    setSelectedPage(p);
  }, [activeTabProp, currentTab, defCat, e]);

  // Tab inside modal: "specs" (ข้อมูลตามหัวตารางของหน้านี้) or "history" (ประวัติสอบเทียบ & ใบเซอร์)
  const [activeTab, setActiveTab] = A.useState("specs");
  const [copiedCode, setCopiedCode] = A.useState(false);
  const [showNewRoundForm, setShowNewRoundForm] = A.useState(false);
  const [errorMsg, setErrorMsg] = A.useState("");
  const [historyList, setHistoryList] = A.useState([]);

  // Table header definitions and metadata for each page
  const pageConfigs = {
    normal_standard: {
      pageId: "normal_standard",
      pageName: "NORMAL STANDARD (มาตรฐานทั่วไป)",
      shortName: "NORMAL STANDARD",
      category: "NORMAL STANDARD",
      themeColor: "emerald",
      badgeClass: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
      btnClass: "bg-emerald-600 hover:bg-emerald-700 text-white",
      headers: ["No.", "Instrument Name", "Maker Name", "Model", "Code No.", "Serial No.", "Size", "Cal. Date", "Due Date", "Frequency", "Section", "Sub Section", "Register date", "Status"],
      showAdvanced: false
    },
    centralized: {
      pageId: "centralized",
      pageName: "CENTRALIZED (เครื่องมือวัดส่วนกลาง)",
      shortName: "CENTRALIZED",
      category: "CENTRALIZED",
      themeColor: "blue",
      badgeClass: "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30",
      btnClass: "bg-blue-600 hover:bg-blue-700 text-white",
      headers: ["N", "Instrument Name", "Maker Name", "Model", "Code No", "Serial No.", "Size", "Cal. Dat", "Due Da", "Freque", "Section", "Sub Section", "Register da", "Status"],
      showAdvanced: false
    },
    each_section: {
      pageId: "each_section",
      pageName: "EACH SECTION (เครื่องมือวัดตามแผนก)",
      shortName: "EACH SECTION",
      category: "EACH SECTION",
      themeColor: "amber",
      badgeClass: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30",
      btnClass: "bg-amber-600 hover:bg-amber-700 text-white",
      headers: ["N", "Instrument Name", "Maker Name", "Model", "Code No.", "Serial No.", "Size", "Cal. Dat", "Due Dat", "Frequer", "Sectic", "Sub Section", "Register da", "Status"],
      showAdvanced: false
    },
    cancel: {
      pageId: "cancel",
      pageName: "CANCEL Y2026 (รายการที่ยกเลิก / จำหน่ายออก)",
      shortName: "CANCEL Y2026",
      category: "CANCEL",
      themeColor: "rose",
      badgeClass: "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30",
      btnClass: "bg-rose-600 hover:bg-rose-700 text-white",
      headers: ["No", "Instrument Name", "Maker Name", "Model", "Code No.", "Serial No.", "Size", "Cal. Date", "Due Date", "Frequency", "Section", "Sub Section", "Register date", "Due Year", "CATEGORY", "CONTROL INSTRUMENT", "CTC CONTROL", "LAB CAL Y2025", "Status"],
      showAdvanced: true
    },
    calibration_all: {
      pageId: "calibration_all",
      pageName: "CALIBRATION ALL (MASTER LIST)",
      shortName: "CALIBRATION ALL",
      category: "NORMAL STANDARD",
      themeColor: "indigo",
      badgeClass: "bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/30",
      btnClass: "bg-indigo-600 hover:bg-indigo-700 text-white",
      headers: ["No.", "Instrument Name", "Maker Name", "Model", "Code No.", "Serial No.", "Size", "Cal. Date", "Due Date", "Frequency", "Section", "Sub Section", "Register date", "Due Year", "CATEGORY", "CONTROL INSTRUMENT", "CTC CONTROL", "LAB CAL Y2026", "Status"],
      showAdvanced: true
    }
  };

  const activeConfig = pageConfigs[selectedPage] || pageConfigs.normal_standard;

  // Calculate default due date
  const getDefaultDueDate = () => {
    const d = new Date();
    d.setFullYear(d.getFullYear() + 1);
    return d.toISOString().split("T")[0];
  };

  // Main Instrument State
  const [f, setF] = A.useState({
    no: l + 1,
    instrumentName: "",
    makerName: "",
    model: "",
    codeNo: "",
    serialNo: "",
    size: "",
    calDate: new Date().toISOString().split("T")[0],
    dueDate: getDefaultDueDate(),
    section: selectedPage === "centralized" ? "CENTRALIZED" : selectedPage === "each_section" ? "PRODUCTION" : "QAP Section",
    subSection: "Quality Inspection",
    registerDate: new Date().toISOString().split("T")[0],
    frequency: "1 Year",
    month: "",
    imageUrl: "",
    status: selectedPage === "cancel" ? "inactive" : "normal",
    location: selectedPage === "centralized" ? "Central Tool Crib" : "QAP Tool Room Rack A",
    calibratedBy: "NA CALTECHNOLOGIES",
    certNo: "",
    standardUsed: "",
    accuracy: "± 0.01 mm",
    notes: "",
    temperature: "20.0 °C ± 1.0 °C",
    humidity: "50% RH ± 5%",
    uncertainty: "U = ±0.005 mm (k=2)",
    traceability: "NIMT (Thailand) / ISO 17025 Accredited",
    dueYear: "Y" + (new Date().getFullYear() + 1),
    category: activeConfig.category,
    controlInstrument: selectedPage === "centralized" ? "CENTRALIZED" : "QAP-01",
    ctcControl: "YES",
    labCal: "NA CALTECHNOLOGIES",
    calibrationHistory: []
  });

  // Calculate Due Date based on calDate and frequency
  const calculateDueDate = (calDateVal, freqVal) => {
    if (!calDateVal) return;
    const d = new Date(calDateVal);
    if (isNaN(d.getTime())) return;
    const fl = (freqVal || "").toLowerCase();
    if (freqVal.includes("6") || fl.includes("6 month")) {
      d.setMonth(d.getMonth() + 6);
    } else if (freqVal.includes("3") || fl.includes("3 month")) {
      d.setMonth(d.getMonth() + 3);
    } else if (freqVal.includes("2") && (fl.includes("year") || freqVal.includes("ปี"))) {
      d.setFullYear(d.getFullYear() + 2);
    } else {
      d.setFullYear(d.getFullYear() + 1);
    }
    const dueStr = d.toISOString().split("T")[0];
    const yrStr = "Y" + d.getFullYear();
    setF(prev => ({
      ...prev,
      calDate: calDateVal,
      frequency: freqVal,
      dueDate: dueStr,
      dueYear: yrStr
    }));
  };

  // State for adding new calibration history round in Tab 2
  const [newRound, setNewRound] = A.useState({
    certNo: "",
    calDate: new Date().toISOString().split("T")[0],
    dueDate: "",
    result: "PASS",
    calibratedBy: "NA CALTECHNOLOGIES",
    standardUsed: "Standard Gauge Block Set Grade 0",
    accuracy: "± 0.01 mm",
    uncertainty: "U = ±0.005 mm (k=2)",
    temperature: "20.0 °C",
    humidity: "50% RH",
    performedBy: "QAP Calibrator",
    approvedBy: "QAP Metrology Manager",
    notes: "ผลการสอบเทียบประจำรอบ สมบูรณ์พร้อมใช้งาน",
    pdfUrl: ""
  });

  // Load editing instrument or reset for new
  A.useEffect(() => {
    if (!e) return;
    if (n && n.id && (n.codeNo || n.instrumentName)) {
      setF({
        ...n,
        no: n.no || (l + 1),
        frequency: n.frequency || "1 Year",
        calDate: n.calDate || new Date().toISOString().split("T")[0],
        dueDate: n.dueDate || getDefaultDueDate(),
        category: n.category || activeConfig.category,
        calibrationHistory: Array.isArray(n.calibrationHistory) ? n.calibrationHistory : []
      });
      if (n.category === "CANCEL") setSelectedPage("cancel");
      else if (n.category === "CENTRALIZED") setSelectedPage("centralized");
      else if (n.category === "EACH SECTION") setSelectedPage("each_section");
      else if (n.category === "NORMAL STANDARD") setSelectedPage("normal_standard");

      if (n.history && n.history.length > 0) {
        setHistoryList([...n.history]);
      } else if (n.calibrationHistory && n.calibrationHistory.length > 0) {
        setHistoryList([...n.calibrationHistory]);
      } else {
        setHistoryList([{
          id: "hist-" + (n.id || Date.now()) + "-curr",
          certNo: n.certNo || ("CERT-" + (n.codeNo || "INST") + "-CURRENT"),
          calDate: n.calDate || new Date().toISOString().split("T")[0],
          dueDate: n.dueDate || getDefaultDueDate(),
          calibratedBy: n.calibratedBy || "NA CALTECHNOLOGIES",
          result: "PASS",
          standardUsed: n.standardUsed || "Standard Gauge Block Set Grade 0",
          accuracy: n.accuracy || "± 0.01 mm",
          uncertainty: n.uncertainty || "U = ±0.005 mm (k=2)",
          temperature: n.temperature || "20.0 °C",
          humidity: n.humidity || "50% RH",
          performedBy: "QAP Calibrator",
          approvedBy: "QAP Metrology Manager",
          notes: n.notes || "ผลการสอบเทียบประจำรอบปัจจุบัน สมบูรณ์พร้อมใช้งาน",
          pdfUrl: n.pdfUrl || ""
        }]);
      }
    } else {
      const now = new Date();
      const todayStr = now.toISOString().split("T")[0];
      const nextDueDate = getDefaultDueDate();
      const generatedCert = "CERT-QAP-" + String((l || 0) + 1).padStart(3, "0");

      setF({
        no: (l || 0) + 1,
        instrumentName: "",
        makerName: "",
        model: "",
        codeNo: "",
        serialNo: "",
        size: "",
        calDate: todayStr,
        dueDate: nextDueDate,
        section: selectedPage === "centralized" ? "CENTRALIZED" : selectedPage === "each_section" ? "PRODUCTION" : "QAP Section",
        subSection: "Quality Inspection",
        registerDate: todayStr,
        frequency: "1 Year",
        month: "",
        imageUrl: "",
        status: selectedPage === "cancel" ? "inactive" : "normal",
        location: selectedPage === "centralized" ? "Central Tool Crib" : "QAP Tool Room Rack A",
        calibratedBy: "NA CALTECHNOLOGIES",
        certNo: generatedCert,
        standardUsed: "",
        accuracy: "± 0.01 mm",
        notes: "",
        temperature: "20.0 °C ± 1.0 °C",
        humidity: "50% RH ± 5%",
        uncertainty: "U = ±0.005 mm (k=2)",
        traceability: "NIMT (Thailand) / ISO 17025 Accredited",
        dueYear: "Y" + (new Date().getFullYear() + 1),
        category: activeConfig.category,
        controlInstrument: selectedPage === "centralized" ? "CENTRALIZED" : "QAP-01",
        ctcControl: "YES",
        labCal: "NA CALTECHNOLOGIES",
        calibrationHistory: []
      });

      setHistoryList([{
        id: "hist-new-" + Date.now(),
        certNo: generatedCert,
        calDate: todayStr,
        dueDate: nextDueDate,
        calibratedBy: "NA CALTECHNOLOGIES",
        result: "PASS",
        standardUsed: "Standard Gauge Block Set Grade 0",
        accuracy: "± 0.01 mm",
        uncertainty: "U = ±0.005 mm (k=2)",
        temperature: "20.0 °C",
        humidity: "50% RH",
        performedBy: "QAP Calibrator",
        approvedBy: "QAP Metrology Manager",
        notes: "ผลการสอบเทียบประจำรอบ สมบูรณ์พร้อมใช้งาน",
        pdfUrl: ""
      }]);
    }
    setErrorMsg("");
  }, [n, l, e]);

  // Handle adding new calibration round in Tab 2
  const handleAddNewRound = () => {
    if (!newRound.certNo || !newRound.certNo.trim()) {
      alert("กรุณาระบุเลขที่ใบรับรอง (Certificate No.) สำหรับรอบใหม่");
      return;
    }
    const createdItem = {
      id: "hist-" + Date.now(),
      certNo: newRound.certNo.trim(),
      calDate: newRound.calDate || f.calDate,
      dueDate: newRound.dueDate || f.dueDate,
      calibratedBy: newRound.calibratedBy || f.calibratedBy || "NA CALTECHNOLOGIES",
      result: newRound.result || "PASS",
      standardUsed: newRound.standardUsed || f.standardUsed || "Standard Gauge Block Set Grade 0",
      accuracy: newRound.accuracy || f.accuracy || "± 0.01 mm",
      uncertainty: newRound.uncertainty || f.uncertainty || "U = ±0.005 mm (k=2)",
      temperature: newRound.temperature || "20.0 °C",
      humidity: newRound.humidity || "50% RH",
      performedBy: newRound.performedBy || "QAP Calibrator",
      approvedBy: newRound.approvedBy || "QAP Metrology Manager",
      notes: newRound.notes || "",
      pdfUrl: newRound.pdfUrl || ""
    };
    const updatedHistory = [createdItem, ...historyList];
    setHistoryList(updatedHistory);
    setF(prev => ({
      ...prev,
      certNo: createdItem.certNo,
      calDate: createdItem.calDate,
      dueDate: createdItem.dueDate,
      calibratedBy: createdItem.calibratedBy,
      standardUsed: createdItem.standardUsed,
      accuracy: createdItem.accuracy,
      uncertainty: createdItem.uncertainty
    }));
    setShowNewRoundForm(false);
  };

  // Delete history item
  const handleDeleteHistory = (idx) => {
    if (confirm("คุณแน่ใจหรือไม่ว่าต้องการลบประวัติการสอบเทียบรอบนี้?")) {
      const updated = historyList.filter((_, i) => i !== idx);
      setHistoryList(updated);
      if (updated.length > 0 && idx === 0) {
        const newFirst = updated[0];
        setF(prev => ({
          ...prev,
          certNo: newFirst.certNo,
          calDate: newFirst.calDate,
          dueDate: newFirst.dueDate,
          calibratedBy: newFirst.calibratedBy
        }));
      }
    }
  };

  // PDF File attach handler
  const handlePdfAttach = (evt, targetIdx) => {
    const file = evt.target.files && evt.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (targetIdx === -1) {
          setF(prev => ({ ...prev, pdfUrl: reader.result }));
        } else {
          setHistoryList(prev => (Array.isArray(prev) ? prev : []).map((item, i) => i === targetIdx ? { ...item, pdfUrl: reader.result } : item));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const passRatePercent = (Array.isArray(historyList) && historyList.length > 0)
    ? Math.round((historyList.filter(it => (it.result || "PASS").toUpperCase() === "PASS").length / historyList.length) * 100)
    : 100;

  // Handle saving
  const handleSave = () => {
    if (!f.codeNo.trim()) {
      setErrorMsg("กรุณาระบุรหัสเครื่องมือ (Code No.)");
      setActiveTab("specs");
      return;
    }
    if (!f.instrumentName.trim()) {
      setErrorMsg("กรุณาระบุชื่อเครื่องมือวัด (Instrument Name)");
      setActiveTab("specs");
      return;
    }
    if (!f.calDate) {
      setErrorMsg("กรุณาระบุวันที่สอบเทียบ (Cal. Date)");
      setActiveTab("specs");
      return;
    }
    if (!f.dueDate) {
      setErrorMsg("กรุณาระบุวันครบกำหนดสอบเทียบ (Due Date)");
      setActiveTab("specs");
      return;
    }

    const targetCategory = selectedPage === "cancel" ? "CANCEL"
      : selectedPage === "centralized" ? "CENTRALIZED"
      : selectedPage === "each_section" ? "EACH SECTION"
      : selectedPage === "normal_standard" ? "NORMAL STANDARD"
      : (f.category || "NORMAL STANDARD");

    const finalItem = {
      ...f,
      id: f.id || (f.codeNo.trim() ? "inst-" + f.codeNo.trim().replace(/[^a-zA-Z0-9_-]/g, "_") : "inst-" + Date.now()),
      category: targetCategory,
      status: selectedPage === "cancel" ? (f.status || "inactive") : (f.status || "normal"),
      targetTab: selectedPage,
      history: historyList,
      calibrationHistory: historyList
    };

    r(finalItem, selectedPage);
    t();
  };

  const handleCopyCode = () => {
    if (f.codeNo) {
      navigator.clipboard.writeText(f.codeNo);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  // Helper for status badge
  const getStatusBadge = (st) => {
    switch (st) {
      case "normal":
        return { text: "ปกติ (IN SPEC)", bg: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700" };
      case "due_soon":
        return { text: "ใกล้ครบกำหนด", bg: "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300 dark:border-amber-700" };
      case "overdue":
        return { text: "เกินกำหนดสอบเทียบ", bg: "bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-300 dark:border-rose-700" };
      case "in_calibration":
        return { text: "ส่งสอบเทียบภายนอก", bg: "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-300 dark:border-blue-700" };
      case "inactive":
      case "cancel":
        return { text: "ปลดระวาง/ยกเลิก", bg: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-300 dark:border-slate-700" };
      default:
        return { text: st, bg: "bg-slate-100 text-slate-700" };
    }
  };

  const statusBadge = getStatusBadge(f.status || (selectedPage === "cancel" ? "inactive" : "normal"));

  // Rules of Hooks mandate all hooks above. Only render DOM if isOpen is true
  if (!e) return null;

  return h("div", {
    className: "fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150"
  },
    h("div", {
      className: "relative w-full max-w-5xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 my-auto flex flex-col max-h-[92vh] overflow-hidden"
    },
      // ==========================================
      // Modal Header
      // ==========================================
      h("div", {
        className: "px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4 bg-white dark:bg-slate-900 shrink-0"
      },
        h("div", { className: "flex items-center gap-3 min-w-0" },
          h("div", {
            className: "w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/80 border border-blue-200 dark:border-blue-800/80 flex items-center justify-center shrink-0 shadow-2xs"
          },
            h(o5, { className: "w-5 h-5 text-blue-600 dark:text-blue-400" })
          ),
          h("div", { className: "min-w-0" },
            h("div", { className: "flex items-center gap-2 flex-wrap" },
              h("h2", { className: "text-base font-bold text-slate-900 dark:text-white truncate" },
                o ? "แก้ไขข้อมูลเครื่องมือวัด" : "ขึ้นทะเบียนเครื่องมือวัดใหม่"
              ),
              !o ? h("span", {
                className: "px-2.5 py-0.5 rounded-full text-[11px] font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 flex items-center gap-1 shadow-2xs"
              }, "➕ โหมดเพิ่มข้อมูลใหม่") : h("span", {
                className: "px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300 dark:border-amber-700"
              }, "✏️ แก้ไขข้อมูล"),
              h("span", {
                className: "px-2.5 py-0.5 rounded-full text-[11px] font-bold border " + activeConfig.badgeClass
              }, "📌 บันทึกลง: " + activeConfig.shortName)
            ),
            h("p", { className: "text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5" },
              "ช่องกรอกข้อมูลด้านล่างถูกจัดสรรให้ตรงตามหัวตารางของหน้า " + activeConfig.pageName + " โดยอัตโนมัติ"
            )
          )
        ),
        h("button", {
          type: "button",
          onClick: t,
          className: "p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
        },
          h(Xl, { className: "w-5 h-5" })
        )
      ),

      // ==========================================
      // Dynamic Page Selector Dropdown (No header pills)
      // ==========================================
      h("div", {
        className: "px-6 py-3 bg-slate-50 dark:bg-slate-950/70 border-b border-slate-200/90 dark:border-slate-800 shrink-0"
      },
        h("div", { className: "flex flex-wrap items-center justify-between gap-3" },
          h("div", { className: "flex items-center gap-2" },
            h("span", { className: "w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse" }),
            h("label", {
              htmlFor: "modal-page-select-dropdown",
              className: "text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5"
            },
              "หน้าที่เปิดอยู่ / ปลายทางที่ต้องการบันทึก:"
            )
          ),
          h("div", { className: "flex items-center gap-2 min-w-[280px] sm:min-w-[340px]" },
            h("select", {
              id: "modal-page-select-dropdown",
              value: selectedPage,
              onChange: (e) => {
                const newPage = e.target.value;
                setSelectedPage(newPage);
                setF(prev => ({
                  ...prev,
                  category: newPage === "cancel" ? "CANCEL" : newPage === "centralized" ? "CENTRALIZED" : newPage === "each_section" ? "EACH SECTION" : "NORMAL STANDARD",
                  status: newPage === "cancel" ? "inactive" : (prev.status === "inactive" ? "normal" : prev.status)
                }));
              },
              className: "w-full text-xs font-bold text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2 shadow-2xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition cursor-pointer"
            },
              h("option", { value: "normal_standard" }, "🟢 NORMAL STANDARD (เครื่องมือวัดมาตรฐานทั่วไป)"),
              h("option", { value: "centralized" }, "🔷 CENTRALIZED (เครื่องมือวัดส่วนกลาง)"),
              h("option", { value: "each_section" }, "🔶 EACH SECTION (เครื่องมือวัดตามแผนก)"),
              h("option", { value: "calibration_all" }, "🌐 CALIBRATION ALL (ข้อมูลเครื่องมือวัดทั้งหมด)"),
              h("option", { value: "cancel" }, "⛔ CANCEL Y2026 (รายการที่ยกเลิก / จำหน่ายออก)")
            )
          )
        )
      ),

      // ==========================================
      // Modal Tabs (Page 1: ข้อมูลตามหัวตาราง, Page 2: ประวัติสอบเทียบ & ใบเซอร์)
      // ==========================================
      h("div", {
        className: "px-6 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between shrink-0"
      },
        h("div", { className: "flex space-x-1" },
          h("button", {
            type: "button",
            onClick: () => setActiveTab("specs"),
            className: "px-4 py-2.5 text-xs font-bold border-b-2 flex items-center gap-2 transition cursor-pointer " +
              (activeTab === "specs"
                ? "border-blue-600 text-blue-600 dark:text-blue-400 bg-blue-50/40 dark:bg-blue-950/20"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200")
          },
            h(o5, { className: "w-4 h-4" }),
            h("span", null, "1. ข้อมูลตามหัวตาราง (" + activeConfig.shortName + ")"),
            h("span", {
              className: "px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300"
            }, activeConfig.headers.length + " คอลัมน์")
          ),
          h("button", {
            type: "button",
            onClick: () => setActiveTab("history"),
            className: "px-4 py-2.5 text-xs font-bold border-b-2 flex items-center gap-2 transition cursor-pointer " +
              (activeTab === "history"
                ? "border-blue-600 text-blue-600 dark:text-blue-400 bg-blue-50/40 dark:bg-blue-950/20"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200")
          },
            h("span", { className: "text-sm" }, "📜"),
            h("span", null, "2. ประวัติสอบเทียบ & ใบเซอร์"),
            h("span", {
              className: "px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
            }, (f.calibrationHistory ? f.calibrationHistory.length : 0))
          )
        ),
        errorMsg && h("div", {
          className: "text-xs text-rose-600 dark:text-rose-400 font-bold flex items-center gap-1 animate-bounce"
        }, "⚠️ " + errorMsg)
      ),

      // ==========================================
      // Modal Body (Scrollable)
      // ==========================================
      h("div", {
        className: "p-6 overflow-y-auto flex-1 space-y-4 bg-slate-50/50 dark:bg-slate-950/40 min-h-0"
      },
        // ==========================================
        // PAGE 1: ข้อมูลตามหัวตารางของหน้าที่เลือก
        // ==========================================
        activeTab === "specs" && h("div", { className: "space-y-4" },
          // Card 1: ข้อมูลเครื่องมือวัดและหมายเลขระบุตัวตน
          h("div", {
            className: "bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-3"
          },
            h("div", { className: "flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5" },
              h("h3", { className: "text-xs font-bold text-slate-900 dark:text-white uppercase flex items-center gap-2" },
                h("span", { className: "w-2.5 h-2.5 rounded-full bg-blue-600" }),
                "1. ข้อมูลเครื่องมือวัดและหมายเลขระบุตัวตน (Identification)"
              ),
              h("span", { className: "text-[11px] font-mono font-bold text-blue-600 dark:text-blue-400" },
                "ตรงตามหัวตาราง: " + (selectedPage === "cancel" ? "No" : selectedPage === "centralized" || selectedPage === "each_section" ? "N" : "No.") + ", " + (selectedPage === "each_section" ? "Code No." : selectedPage === "centralized" ? "Code No" : "Code No.") + ", Instrument Name, Maker Name, Model, Serial No., Size"
              )
            ),
            h("div", { className: "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs" },
              // No. / N
              h("div", null,
                h("label", { className: "block font-bold text-slate-700 dark:text-slate-300 mb-1" },
                  (selectedPage === "cancel" ? "No (ลำดับ)" : selectedPage === "centralized" || selectedPage === "each_section" ? "N (ลำดับ)" : "No. (ลำดับ)")
                ),
                h("input", {
                  type: "number",
                  value: f.no || "",
                  onChange: e => setF({ ...f, no: parseInt(e.target.value) || 1 }),
                  className: "w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono text-xs focus:ring-1 focus:ring-blue-500"
                })
              ),
              // Code No. / Code No
              h("div", { className: "sm:col-span-1 md:col-span-1" },
                h("div", { className: "flex items-center justify-between mb-1" },
                  h("label", { className: "block font-bold text-slate-700 dark:text-slate-300" },
                    (selectedPage === "each_section" ? "Code No. *" : selectedPage === "centralized" ? "Code No *" : "Code No. *")
                  ),
                  !o && h("button", {
                    type: "button",
                    onClick: () => setF(prev => ({ ...prev, codeNo: "CAL-" + String(l + 1).padStart(3, "0") })),
                    className: "text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer flex items-center gap-1",
                    title: "คลิกเพื่อใช้รหัสแนะนำอัตโนมัติ"
                  }, "⚡ แนะนำ: CAL-" + (l + 1))
                ),
                h("input", {
                  type: "text",
                  value: f.codeNo || "",
                  onChange: e => setF({ ...f, codeNo: e.target.value }),
                  placeholder: "เช่น CAL-001 หรือ QAP-01",
                  className: "w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono font-bold text-xs focus:ring-1 focus:ring-blue-500"
                })
              ),
              // Instrument Name
              h("div", { className: "sm:col-span-2 md:col-span-2" },
                h("label", { className: "block font-bold text-slate-700 dark:text-slate-300 mb-1" }, "Instrument Name (ชื่อเครื่องมือวัด) *"),
                h("input", {
                  type: "text",
                  value: f.instrumentName || "",
                  onChange: e => setF({ ...f, instrumentName: e.target.value }),
                  placeholder: "ระบุชื่อเครื่องมือ เช่น ไมโครมิเตอร์วัดนอก, เวอร์เนียร์คาลิปเปอร์, เกจบล็อก...",
                  className: "w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold text-xs focus:ring-1 focus:ring-blue-500"
                })
              ),
              // Maker Name
              h("div", null,
                h("label", { className: "block font-medium text-slate-700 dark:text-slate-300 mb-1" }, "Maker Name (ผู้ผลิต / ยี่ห้อ)"),
                h("input", {
                  type: "text",
                  value: f.makerName || "",
                  onChange: e => setF({ ...f, makerName: e.target.value }),
                  placeholder: "เช่น Mitutoyo, Fluke, KANON...",
                  className: "w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs focus:ring-1 focus:ring-blue-500"
                })
              ),
              // Model
              h("div", null,
                h("label", { className: "block font-medium text-slate-700 dark:text-slate-300 mb-1" }, "Model (รุ่น)"),
                h("input", {
                  type: "text",
                  value: f.model || "",
                  onChange: e => setF({ ...f, model: e.target.value }),
                  placeholder: 'เช่น CD-6"CSX, 87-V, 293-240-30...',
                  className: "w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs focus:ring-1 focus:ring-blue-500"
                })
              ),
              // Serial No.
              h("div", null,
                h("label", { className: "block font-medium text-slate-700 dark:text-slate-300 mb-1" }, "Serial No. (หมายเลขเครื่อง)"),
                h("input", {
                  type: "text",
                  value: f.serialNo || "",
                  onChange: e => setF({ ...f, serialNo: e.target.value }),
                  placeholder: "เช่น SN-2024-0012...",
                  className: "w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono text-xs focus:ring-1 focus:ring-blue-500"
                })
              ),
              // Size
              h("div", null,
                h("label", { className: "block font-medium text-slate-700 dark:text-slate-300 mb-1" }, "Size (ขนาด / ย่านการวัด)"),
                h("input", {
                  type: "text",
                  value: f.size || "",
                  onChange: e => setF({ ...f, size: e.target.value }),
                  placeholder: "เช่น 0-150 mm, 0-25 mm, 0-1000V...",
                  className: "w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs focus:ring-1 focus:ring-blue-500"
                })
              )
            )
          ),

          // Card 2: แผนก จุดใช้งาน และวันที่ขึ้นทะเบียน
          h("div", {
            className: "bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-3"
          },
            h("div", { className: "flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5" },
              h("h3", { className: "text-xs font-bold text-slate-900 dark:text-white uppercase flex items-center gap-2" },
                h("span", { className: "w-2.5 h-2.5 rounded-full bg-amber-500" }),
                "2. แผนก จุดใช้งาน และวันที่ขึ้นทะเบียน (Location & Registration)"
              ),
              h("span", { className: "text-[11px] font-mono font-bold text-amber-600 dark:text-amber-400" },
                "ตรงตามหัวตาราง: " + (selectedPage === "each_section" ? "Sectic" : "Section") + ", Sub Section, " + (selectedPage === "cancel" ? "Register date" : selectedPage === "centralized" || selectedPage === "each_section" ? "Register da" : "Register date")
              )
            ),
            h("div", { className: "grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs" },
              // Section / Sectic
              h("div", null,
                h("label", { className: "block font-medium text-slate-700 dark:text-slate-300 mb-1" },
                  (selectedPage === "each_section" ? "Sectic (แผนกผู้รับผิดชอบ)" : "Section (แผนกผู้รับผิดชอบ)")
                ),
                h("input", {
                  type: "text",
                  value: f.section || "",
                  onChange: e => setF({ ...f, section: e.target.value }),
                  placeholder: "เช่น QAP, QA, QC, ฝ่ายผลิต...",
                  className: "w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs focus:ring-1 focus:ring-blue-500"
                })
              ),
              // Sub Section
              h("div", null,
                h("label", { className: "block font-medium text-slate-700 dark:text-slate-300 mb-1" }, "Sub Section (จุดใช้งาน / แผนกย่อย)"),
                h("input", {
                  type: "text",
                  value: f.subSection || "",
                  onChange: e => setF({ ...f, subSection: e.target.value }),
                  placeholder: "เช่น ไลน์ประกอบ 1, ห้องคลีนรูม...",
                  className: "w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs focus:ring-1 focus:ring-blue-500"
                })
              ),
              // Register date / Register da
              h("div", null,
                h("label", { className: "block font-medium text-slate-700 dark:text-slate-300 mb-1" },
                  (selectedPage === "cancel" ? "Register date (วันที่ขึ้นทะเบียน)" : selectedPage === "centralized" || selectedPage === "each_section" ? "Register da (วันที่ขึ้นทะเบียน)" : "Register date (วันที่ขึ้นทะเบียน)")
                ),
                h("input", {
                  type: "date",
                  value: f.registerDate || "",
                  onChange: e => setF({ ...f, registerDate: e.target.value }),
                  className: "w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs focus:ring-1 focus:ring-blue-500"
                })
              )
            )
          ),

          // Card 3: รอบและกำหนดการสอบเทียบ (Cal. Date, Frequency, Due Date, Status)
          h("div", {
            className: "bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-3"
          },
            h("div", { className: "flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5" },
              h("h3", { className: "text-xs font-bold text-slate-900 dark:text-white uppercase flex items-center gap-2" },
                h("span", { className: "w-2.5 h-2.5 rounded-full bg-emerald-500" }),
                "3. รอบและกำหนดการสอบเทียบ (Calibration Schedule & Status)"
              ),
              h("span", { className: "text-[11px] font-mono font-bold text-emerald-600 dark:text-emerald-400" },
                "ตรงตามหัวตาราง: " + (selectedPage === "centralized" || selectedPage === "each_section" ? "Cal. Dat" : "Cal. Date") + ", " + (selectedPage === "cancel" ? "Frequency" : selectedPage === "each_section" ? "Frequer" : selectedPage === "centralized" ? "Freque" : "Frequen") + ", " + (selectedPage === "each_section" ? "Due Dat" : selectedPage === "centralized" ? "Due Da" : "Due Date") + ", Status"
              )
            ),
            h("div", { className: "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs" },
              // Cal. Date / Cal. Dat
              h("div", null,
                h("label", { className: "block font-bold text-slate-700 dark:text-slate-300 mb-1" },
                  (selectedPage === "centralized" || selectedPage === "each_section" ? "Cal. Dat (วันที่สอบเทียบ) *" : "Cal. Date (วันที่สอบเทียบ) *")
                ),
                h("input", {
                  type: "date",
                  value: f.calDate || "",
                  onChange: e => calculateDueDate(e.target.value, f.frequency),
                  className: "w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs font-bold focus:ring-1 focus:ring-blue-500"
                })
              ),
              // Frequency / Freque / Frequer
              h("div", null,
                h("label", { className: "block font-bold text-slate-700 dark:text-slate-300 mb-1" },
                  (selectedPage === "cancel" ? "Frequency (ความถี่รอบสอบเทียบ)" : selectedPage === "each_section" ? "Frequer (ความถี่รอบสอบเทียบ)" : selectedPage === "centralized" ? "Freque (ความถี่รอบสอบเทียบ)" : "Frequency (ความถี่รอบสอบเทียบ)")
                ),
                h("select", {
                  value: f.frequency || "1 Year",
                  onChange: e => calculateDueDate(f.calDate, e.target.value),
                  className: "w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs font-bold focus:ring-1 focus:ring-blue-500"
                },
                  h("option", { value: "1 Year" }, "1 ปี (1 Year)"),
                  h("option", { value: "6 Months" }, "6 เดือน (6 Months)"),
                  h("option", { value: "3 Months" }, "3 เดือน (3 Months)"),
                  h("option", { value: "2 Years" }, "2 ปี (2 Years)")
                )
              ),
              // Due Date / Due Da / Due Dat
              h("div", null,
                h("label", { className: "block font-bold text-slate-700 dark:text-slate-300 mb-1" },
                  (selectedPage === "each_section" ? "Due Dat (วันครบกำหนด) *" : selectedPage === "centralized" ? "Due Da (วันครบกำหนด) *" : "Due Date (วันครบกำหนด) *")
                ),
                h("input", {
                  type: "date",
                  value: f.dueDate || "",
                  onChange: e => setF({ ...f, dueDate: e.target.value }),
                  className: "w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs font-bold focus:ring-1 focus:ring-blue-500"
                })
              ),
              // Status
              h("div", null,
                h("label", { className: "block font-bold text-slate-700 dark:text-slate-300 mb-1" }, "Status (สถานะเครื่องมือวัด)"),
                h("select", {
                  value: f.status || (selectedPage === "cancel" ? "inactive" : "normal"),
                  onChange: e => setF({ ...f, status: e.target.value }),
                  className: "w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs font-bold focus:ring-1 focus:ring-blue-500"
                },
                  h("option", { value: "normal" }, "ปกติ (IN SPEC)"),
                  h("option", { value: "due_soon" }, "ใกล้ครบกำหนด (DUE SOON)"),
                  h("option", { value: "overdue" }, "เกินกำหนด (OVERDUE)"),
                  h("option", { value: "in_calibration" }, "ส่งสอบเทียบ (IN CALIBRATION)"),
                  h("option", { value: "inactive" }, "ปลดระวาง/ยกเลิก (CANCEL)")
                )
              )
            )
          ),

          // Card 4: คอลัมน์เฉพาะหน้า CALIBRATION ALL หรือ CANCEL Y2026
          activeConfig.showAdvanced && h("div", {
            className: "bg-white dark:bg-slate-900 p-4 rounded-2xl border border-indigo-200/90 dark:border-indigo-900/60 shadow-2xs space-y-3"
          },
            h("div", { className: "flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5" },
              h("h3", { className: "text-xs font-bold text-indigo-900 dark:text-indigo-300 uppercase flex items-center gap-2" },
                h("span", { className: "w-2.5 h-2.5 rounded-full bg-indigo-600" }),
                "4. คอลัมน์การควบคุมเฉพาะ (Due Year, CATEGORY, CONTROL INSTRUMENT, CTC CONTROL, LAB CAL)"
              ),
              h("span", { className: "text-[11px] font-mono font-bold text-indigo-600 dark:text-indigo-400" },
                "หัวตารางเฉพาะหน้า " + activeConfig.shortName
              )
            ),
            h("div", { className: "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 text-xs" },
              // Due Year
              h("div", null,
                h("label", { className: "block font-medium text-slate-700 dark:text-slate-300 mb-1" }, "Due Year (ปีครบกำหนด)"),
                h("input", {
                  type: "text",
                  value: f.dueYear || "",
                  onChange: e => setF({ ...f, dueYear: e.target.value }),
                  placeholder: "เช่น Y2026, Jun-27...",
                  className: "w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono text-xs focus:ring-1 focus:ring-blue-500"
                })
              ),
              // CATEGORY
              h("div", null,
                h("label", { className: "block font-bold text-slate-700 dark:text-slate-300 mb-1" }, "CATEGORY (หมวดหมู่)"),
                selectedPage === "cancel"
                  ? h("input", {
                      type: "text",
                      value: "CANCEL",
                      disabled: true,
                      className: "w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-bold text-xs cursor-not-allowed"
                    })
                  : h("select", {
                      value: f.category || "NORMAL STANDARD",
                      onChange: e => setF({ ...f, category: e.target.value }),
                      className: "w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold text-xs focus:ring-1 focus:ring-blue-500"
                    },
                      h("option", { value: "NORMAL STANDARD" }, "NORMAL STANDARD"),
                      h("option", { value: "CENTRALIZED" }, "CENTRALIZED"),
                      h("option", { value: "EACH SECTION" }, "EACH SECTION"),
                      h("option", { value: "CANCEL" }, "CANCEL")
                    )
              ),
              // CONTROL INSTRUMENT
              h("div", null,
                h("label", { className: "block font-medium text-slate-700 dark:text-slate-300 mb-1" }, "CONTROL INST."),
                h("input", {
                  type: "text",
                  value: f.controlInstrument || "",
                  onChange: e => setF({ ...f, controlInstrument: e.target.value }),
                  placeholder: "เช่น CENTRALIZED, QAP-01...",
                  className: "w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs focus:ring-1 focus:ring-blue-500"
                })
              ),
              // CTC CONTROL
              h("div", null,
                h("label", { className: "block font-medium text-slate-700 dark:text-slate-300 mb-1" }, "CTC CONTROL"),
                h("select", {
                  value: f.ctcControl || "YES",
                  onChange: e => setF({ ...f, ctcControl: e.target.value }),
                  className: "w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold text-xs focus:ring-1 focus:ring-blue-500"
                },
                  h("option", { value: "YES" }, "YES"),
                  h("option", { value: "NO" }, "NO")
                )
              ),
              // LAB CAL
              h("div", null,
                h("label", { className: "block font-medium text-slate-700 dark:text-slate-300 mb-1" },
                  (selectedPage === "cancel" ? "LAB CAL Y2025" : "LAB CAL Y2026")
                ),
                h("input", {
                  type: "text",
                  value: f.labCal || "",
                  onChange: e => setF({ ...f, labCal: e.target.value }),
                  placeholder: "เช่น NA CALTECHNOLOGIES, NIMT...",
                  className: "w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs focus:ring-1 focus:ring-blue-500"
                })
              )
            )
          )
        ),

        // ==========================================
        // PAGE 2: ประวัติสอบเทียบ & ใบเซอร์ (History & Certificates)
        // ==========================================
        ${historyTabCode}

      ),

      // ==========================================
      // Modal Footer
      // ==========================================
      h("div", {
        className: "px-6 py-3.5 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-50/90 dark:bg-slate-900/90 shrink-0"
      },
        h("div", { className: "flex items-center gap-2" },
          h("span", {
            className: "px-2.5 py-1 rounded-lg text-xs font-bold border flex items-center gap-1.5 " + activeConfig.badgeClass
          },
            h("span", { className: "w-2 h-2 rounded-full bg-current" }),
            "บันทึกลงหน้า: " + activeConfig.shortName
          ),
          h("span", { className: "text-[11px] text-slate-500 dark:text-slate-400 hidden sm:inline" },
            o ? "(โหมดแก้ไขข้อมูลเดิม)" : "(โหมดเพิ่มข้อมูลใหม่)"
          )
        ),
        h("div", { className: "flex items-center gap-2" },
          h("button", {
            type: "button",
            onClick: t,
            className: "px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold transition cursor-pointer"
          }, "ยกเลิก"),
          h("button", {
            type: "button",
            onClick: handleSave,
            className: "px-5 py-2 rounded-xl text-white text-xs font-black shadow-md transition flex items-center gap-2 cursor-pointer " + activeConfig.btnClass
          },
            h(S0, { className: "w-4 h-4 text-white" }),
            h("span", null, o ? "บันทึกการแก้ไขลง " + activeConfig.shortName : "💾 ยืนยันบันทึกลงหน้า " + activeConfig.shortName)
          )
        )
      )
    )
  );
};
`;

fs.writeFileSync('scripts/j3e_patched.js', newJ3eCode);
console.log('✅ Generated new dynamic j3e_patched.js successfully! Length:', newJ3eCode.length);

// Also patch directly into app.js
const appCode = fs.readFileSync('app.js', 'utf8');
const j3eStart = appCode.indexOf('const J3e =');
const afterJ3e = appCode.indexOf('const eSe=', j3eStart);
if (j3eStart !== -1 && afterJ3e !== -1) {
  const newAppCode = appCode.slice(0, j3eStart) + newJ3eCode + ';\n' + appCode.slice(afterJ3e);
  fs.writeFileSync('app.js', newAppCode);
  console.log('✅ Successfully patched app.js with new J3e dynamic modal!');
} else {
  console.error('⚠️ Could not locate J3e boundaries in app.js:', { j3eStart, afterJ3e });
}
