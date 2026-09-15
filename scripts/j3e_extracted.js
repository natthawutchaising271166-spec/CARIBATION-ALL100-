const J3e = ({ isOpen: e, onClose: t, onSave: r, instrumentToEdit: n, totalInstrumentsCount: l }) => {
  const h = A.createElement;
  const o = !!n;

  // Tabs: "specs" (Page 1) and "history" (Page 2) - Matches View Modal
  const [activeTab, setActiveTab] = A.useState("specs");
  const [copiedCode, setCopiedCode] = A.useState(false);
  const [showIsoAccordion, setShowIsoAccordion] = A.useState(false);
  const [showNewRoundForm, setShowNewRoundForm] = A.useState(false);
  const [errorMsg, setErrorMsg] = A.useState("");

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
    dueDate: "",
    section: "QAP Section",
    subSection: "Quality Inspection",
    registerDate: new Date().toISOString().split("T")[0],
    frequency: "1 Year",
    month: "",
    imageUrl: "",
    status: "normal",
    location: "QAP Tool Room Rack A",
    calibratedBy: "NA CALTECHNOLOGIES",
    certNo: "",
    standardUsed: "Standard Gauge Block Set Grade 0",
    accuracy: "± 0.01 mm",
    notes: "",
    temperature: "20.0 °C ± 1.0 °C",
    humidity: "50% RH ± 5%",
    uncertainty: "U = ±0.005 mm (k=2)",
    traceability: "NIMT (Thailand) / ISO 17025 Accredited",
    dueYear: new Date().getFullYear().toString(),
    category: "NORMAL STANDARD",
    controlInstrument: "CENTRALIZED",
    ctcControl: "YES",
    labCal: "NA CALTECHNOLOGIES",
    pdfUrl: ""
  });

  // ISO 17025 State
  const [isoChecklist, setIsoChecklist] = A.useState(() => i5(true));
  const [isoAuditedBy, setIsoAuditedBy] = A.useState("QAP Metrology Lead Auditor");
  const [isoAuditDate, setIsoAuditDate] = A.useState(new Date().toISOString().split("T")[0]);

  // History List State (Page 2)
  const [historyList, setHistoryList] = A.useState([]);

  // New Round Form State
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

  // Initialize on open or instrument change
  A.useEffect(() => {
    if (n) {
      setF({
        no: (n.no !== undefined && n.no !== null) ? n.no : (l + 1),
        instrumentName: n.instrumentName || "",
        makerName: n.makerName || "",
        model: n.model || "",
        codeNo: n.codeNo || "",
        serialNo: n.serialNo || "",
        size: n.size || "",
        calDate: n.calDate || new Date().toISOString().split("T")[0],
        dueDate: n.dueDate || "",
        section: n.section || "QAP Section",
        subSection: n.subSection || "Quality Inspection",
        registerDate: n.registerDate || new Date().toISOString().split("T")[0],
        frequency: n.frequency || "1 Year",
        month: n.month || "",
        imageUrl: n.imageUrl || "",
        status: n.status || "normal",
        location: n.location || "QAP Tool Room Rack A",
        calibratedBy: n.calibratedBy || "NA CALTECHNOLOGIES",
        certNo: n.certNo || "",
        standardUsed: n.standardUsed || "Standard Gauge Block Set Grade 0",
        accuracy: n.accuracy || "± 0.01 mm",
        notes: n.notes || "",
        temperature: n.temperature || "20.0 °C ± 1.0 °C",
        humidity: n.humidity || "50% RH ± 5%",
        uncertainty: n.uncertainty || "U = ±0.005 mm (k=2)",
        traceability: n.traceability || "NIMT (Thailand) / ISO 17025 Accredited",
        dueYear: n.dueYear || "",
        category: n.category || "NORMAL STANDARD",
        controlInstrument: n.controlInstrument || "CENTRALIZED",
        ctcControl: n.ctcControl || "YES",
        labCal: n.labCal || "NA CALTECHNOLOGIES",
        pdfUrl: n.pdfUrl || ""
      });
      if (n.iso17025Checklist && n.iso17025Checklist.length > 0) {
        setIsoChecklist(n.iso17025Checklist);
      } else {
        setIsoChecklist(i5(true));
      }
      setIsoAuditedBy(n.iso17025AuditedBy || "QAP Metrology Lead Auditor");
      setIsoAuditDate(n.iso17025AuditDate || n.calDate || new Date().toISOString().split("T")[0]);

      // Initialize history list
      if (n.history && n.history.length > 0) {
        setHistoryList([...n.history]);
      } else {
        setHistoryList([{
          id: "hist-" + n.id + "-curr",
          certNo: n.certNo || ("CERT-" + (n.codeNo || "INST") + "-CURRENT"),
          calDate: n.calDate || new Date().toISOString().split("T")[0],
          dueDate: n.dueDate || "",
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
      const nextYear = new Date(now);
      nextYear.setFullYear(now.getFullYear() + 1);
      const nextYearStr = nextYear.toISOString().split("T")[0];
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const currentMonth = monthNames[now.getMonth()];

      const generatedCode = "CAL-" + String(l + 1).padStart(3, "0");
      const generatedCert = "CERT-QAP-" + String(l + 1).padStart(3, "0");

      setF({
        no: l + 1,
        instrumentName: "",
        makerName: "",
        model: "",
        codeNo: generatedCode,
        serialNo: "",
        size: "",
        calDate: todayStr,
        dueDate: nextYearStr,
        section: "QAP Section",
        subSection: "Quality Inspection",
        registerDate: todayStr,
        frequency: "1 Year",
        month: currentMonth,
        imageUrl: "",
        status: "normal",
        location: "QAP Tool Room Rack A",
        calibratedBy: "NA CALTECHNOLOGIES",
        certNo: generatedCert,
        standardUsed: "Standard Gauge Block Set Grade 0",
        accuracy: "± 0.01 mm",
        notes: "",
        temperature: "20.0 °C ± 1.0 °C",
        humidity: "50% RH ± 5%",
        uncertainty: "U = ±0.005 mm (k=2)",
        traceability: "NIMT (Thailand) / ISO 17025 Accredited",
        dueYear: nextYear.getFullYear().toString(),
        category: "NORMAL STANDARD",
        controlInstrument: "CENTRALIZED",
        ctcControl: "YES",
        labCal: "NA CALTECHNOLOGIES",
        pdfUrl: ""
      });
      setIsoChecklist(i5(true));
      setIsoAuditedBy("QAP Metrology Lead Auditor");
      setIsoAuditDate(todayStr);

      setHistoryList([{
        id: "hist-new-" + Date.now(),
        certNo: generatedCert,
        calDate: todayStr,
        dueDate: nextYearStr,
        calibratedBy: "NA CALTECHNOLOGIES",
        result: "PASS",
        standardUsed: "Standard Gauge Block Set Grade 0",
        accuracy: "± 0.01 mm",
        uncertainty: "U = ±0.005 mm (k=2)",
        temperature: "20.0 °C",
        humidity: "50% RH",
        performedBy: "QAP Calibrator",
        approvedBy: "QAP Metrology Manager",
        notes: "ผลการสอบเทียบประจำรอบเริ่มต้น",
        pdfUrl: ""
      }]);
    }
    setErrorMsg("");
    setActiveTab("specs");
    setShowNewRoundForm(false);
  }, [n, e, l]);

  // Recalculate due date from frequency
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
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const dueMonth = monthNames[d.getMonth()];
    const dueYr = d.getFullYear().toString();
    setF(prev => ({ ...prev, calDate: calDateVal, frequency: freqVal, dueDate: dueStr, dueYear: dueYr, month: dueMonth }));
    if (!isoAuditDate || isoAuditDate === f.calDate) setIsoAuditDate(calDateVal);
  };

  // ISO Checklist helpers
  const handleToggleChecklist = (id) => {
    setIsoChecklist(prev => prev.map(item => item.id === id ? { ...item, checked: !item.checked } : item));
  };
  const handleChecklistNotes = (id, val) => {
    setIsoChecklist(prev => prev.map(item => item.id === id ? { ...item, notes: val } : item));
  };
  const handleToggleAllChecklist = (val) => {
    setIsoChecklist(prev => prev.map(item => ({ ...item, checked: val })));
  };
  const isoStats = A.useMemo(() => G$(isoChecklist), [isoChecklist]);

  // Copy code helper
  const handleCopyCode = () => {
    if (navigator.clipboard && f.codeNo) {
      navigator.clipboard.writeText(f.codeNo).then(() => {
        setCopiedCode(true);
        setTimeout(() => setCopiedCode(false), 2000);
      });
    }
  };

  // Save Instrument Handler
  const handleSave = (ev) => {
    if (ev) ev.preventDefault();
    if (!f.codeNo || !f.codeNo.trim()) {
      setErrorMsg("กรุณาระบุรหัสเครื่องมือวัด (Code No.)");
      setActiveTab("specs");
      return;
    }
    if (!f.instrumentName || !f.instrumentName.trim()) {
      setErrorMsg("กรุณาระบุชื่อเครื่องมือวัด (Instrument Name)");
      setActiveTab("specs");
      return;
    }
    if (!f.calDate || !f.dueDate) {
      setErrorMsg("กรุณาระบุวันที่สอบเทียบและวันครบกำหนดในหน้าประวัติสอบเทียบ");
      setActiveTab("history");
      return;
    }

    const calculatedStatus = P0(f);

    // Sync latest cert / dates from first history item if available
    let updatedCertNo = f.certNo ? f.certNo.trim() : ("CERT-" + f.codeNo.trim());
    let updatedCalDate = f.calDate;
    let updatedDueDate = f.dueDate;
    let updatedLab = f.calibratedBy ? f.calibratedBy.trim() : "NA CALTECHNOLOGIES";

    if (historyList && historyList.length > 0) {
      const latest = historyList[0];
      if (latest.certNo) updatedCertNo = latest.certNo;
      if (latest.calDate) updatedCalDate = latest.calDate;
      if (latest.dueDate) updatedDueDate = latest.dueDate;
      if (latest.calibratedBy) updatedLab = latest.calibratedBy;
    }

    const payload = {
      id: n ? n.id : ("inst-" + Date.now()),
      no: f.no || l + 1,
      instrumentName: f.instrumentName.trim(),
      makerName: (f.makerName ? f.makerName.trim() : "") || "-",
      model: (f.model ? f.model.trim() : "") || "-",
      codeNo: f.codeNo.trim(),
      serialNo: (f.serialNo ? f.serialNo.trim() : "") || "-",
      size: (f.size ? f.size.trim() : "") || "-",
      calDate: updatedCalDate,
      dueDate: updatedDueDate,
      section: (f.section ? f.section.trim() : "") || "QAP Section",
      subSection: (f.subSection ? f.subSection.trim() : "") || "Quality Inspection",
      registerDate: f.registerDate || new Date().toISOString().split("T")[0],
      frequency: f.frequency || "1 Year",
      month: f.month || "Jan",
      imageUrl: f.imageUrl || "",
      status: calculatedStatus,
      location: (f.location ? f.location.trim() : "") || "-",
      calibratedBy: updatedLab,
      certNo: updatedCertNo,
      standardUsed: (f.standardUsed ? f.standardUsed.trim() : "") || "Standard Gauge Block Set Grade 0",
      accuracy: (f.accuracy ? f.accuracy.trim() : "") || "± 0.01 mm",
      notes: (f.notes ? f.notes.trim() : "") || "",
      temperature: (f.temperature ? f.temperature.trim() : "") || "20.0 °C ± 1.0 °C",
      humidity: (f.humidity ? f.humidity.trim() : "") || "50% RH ± 5%",
      uncertainty: (f.uncertainty ? f.uncertainty.trim() : "") || "U = ±0.005 mm (k=2)",
      traceability: (f.traceability ? f.traceability.trim() : "") || "NIMT (Thailand) / ISO 17025 Accredited",
      dueYear: f.dueYear || (f.dueDate ? new Date(f.dueDate).getFullYear().toString() : ""),
      category: f.category || "NORMAL STANDARD",
      controlInstrument: f.controlInstrument || "CENTRALIZED",
      ctcControl: f.ctcControl || "YES",
      labCal: f.labCal || updatedLab,
      iso17025Checklist: isoChecklist,
      iso17025AuditedBy: (isoAuditedBy && isoAuditedBy.trim()) ? isoAuditedBy.trim() : "QAP Metrology Lead Auditor",
      iso17025AuditDate: isoAuditDate || f.calDate,
      iso17025Compliant: isoStats.isFullyCompliant,
      history: historyList,
      calibratedPoints: (n == null ? void 0 : n.calibratedPoints) || []
    };

    r(payload);
    t();
  };

  // Add new history cycle
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

    // Prepend to history list (newest first)
    const updatedHistory = [createdItem, ...historyList];
    setHistoryList(updatedHistory);

    // Update main instrument values with new round
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

  // Image Upload handler
  const handleImageFileChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setF(prev => ({ ...prev, imageUrl: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  // PDF File attach handler
  const handlePdfAttach = (e, targetIdx) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (targetIdx === -1) {
          setF(prev => ({ ...prev, pdfUrl: reader.result }));
        } else {
          setHistoryList(prev => prev.map((item, i) => i === targetIdx ? { ...item, pdfUrl: reader.result } : item));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const passRatePercent = historyList.length > 0
    ? Math.round((historyList.filter(it => (it.result || "PASS").toUpperCase() === "PASS").length / historyList.length) * 100)
    : 100;

  // IMPORTANT: Rules of Hooks require all hooks above. Only now do we check !e (isOpen)
  if (!e) return null;

  return h("div", {
    className: "fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-150"
  },
    h("div", {
      className: "relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200/90 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh] text-slate-800 dark:text-slate-100",
      onClick: e => e.stopPropagation()
    },
      // 1. Header (Matching View Modal Exactly)
      h("div", {
        className: "px-5 py-3.5 bg-gradient-to-r from-[#1c2a78] via-[#1e3a8a] to-[#2563eb] text-white flex items-center justify-between shadow-md shrink-0"
      },
        h("div", { className: "flex items-center gap-3" },
          h("div", { className: "w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center shadow-inner" },
            h(sd, { className: "w-6 h-6 text-blue-200" })
          ),
          h("div", null,
            h("div", { className: "flex items-center gap-2" },
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
            )
          )
        ),
        h("div", { className: "flex items-center gap-1.5" },
          h("button", {
            type: "button",
            onClick: t,
            className: "p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition cursor-pointer",
            title: "ปิดหน้าต่าง"
          },
            h(Xl, { className: "w-5 h-5" })
          )
        )
      ),

      // 2. Tabs Bar (Matches Image 2: 2 Pages - Specs & History & Timeline)
      h("div", {
        className: "px-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/70 flex items-center justify-between text-xs shrink-0 overflow-x-auto select-none"
      },
        h("div", { className: "flex items-center gap-2 pt-2 shrink-0" },
          // Tab 1: ข้อมูลจำเพาะ (Specs)
          h("button", {
            type: "button",
            onClick: () => setActiveTab("specs"),
            className: "px-3 py-2 font-bold border-b-2 transition flex items-center gap-1.5 cursor-pointer " +
              (activeTab === "specs"
                ? "border-blue-700 dark:border-blue-400 text-blue-700 dark:text-blue-400 bg-white dark:bg-slate-900 rounded-t-lg"
                : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200")
          },
            h(o5, { className: "w-3.5 h-3.5" }),
            h("span", null, "ข้อมูลจำเพาะ (Specs)")
          ),
          // Tab 2: ประวัติสอบเทียบ & ไทม์ไลน์ใบเซอร์ (History & Timeline)
          h("button", {
            type: "button",
            onClick: () => setActiveTab("history"),
            className: "px-3 py-2 font-bold border-b-2 transition flex items-center gap-1.5 cursor-pointer " +
              (activeTab === "history"
                ? "border-blue-700 dark:border-blue-400 text-blue-700 dark:text-blue-400 bg-white dark:bg-slate-900 rounded-t-lg"
                : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200")
          },
            h(iD, { className: "w-3.5 h-3.5 text-blue-600 dark:text-blue-400" }),
            h("span", null, "ประวัติสอบเทียบ & ไทม์ไลน์ใบเซอร์ (History & Timeline)"),
            h("span", {
              className: "ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 font-bold"
            }, historyList.length)
          )
        ),
        h("div", { className: "hidden sm:flex items-center gap-2 py-1" },
          h("button", {
            type: "button",
            onClick: handleCopyCode,
            className: "inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-slate-600 dark:text-slate-300 hover:text-blue-700 dark:hover:text-blue-400 bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-md shadow-2xs transition cursor-pointer"
          },
            copiedCode ? h(hl, { className: "w-3 h-3 text-emerald-600 dark:text-emerald-400" }) : h(s5, { className: "w-3 h-3" }),
            h("span", null, copiedCode ? "คัดลอกรหัสแล้ว" : "คัดลอกรหัสเครื่องมือ")
          )
        )
      ),

      // 3. Content Body
      h("div", { className: "flex-1 overflow-y-auto p-5 space-y-5 bg-slate-50/50 dark:bg-slate-950/50 min-h-0" },
        errorMsg && h("div", {
          className: "p-3 rounded-xl text-xs font-bold bg-rose-50 border border-rose-300 text-rose-800 dark:bg-rose-950/70 dark:border-rose-800 dark:text-rose-300 flex items-center gap-2"
        },
          h("span", null, "⚠️"),
          h("span", null, errorMsg)
        ),

        // ==========================================
        // PAGE 1: ข้อมูลจำเพาะ (Specs)
        // ==========================================
        activeTab === "specs" && h("div", { className: "space-y-4" },
          // Top Row: Control Status & Classification Card (Like View Modal)
          h("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-4" },
            // Left Card: Classification & Control
            h("div", { className: "bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-3" },
              h("div", { className: "flex items-center justify-between gap-1 border-b border-slate-100 dark:border-slate-800 pb-2" },
                h("span", { className: "text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500" }, "CONTROL STATUS & CLASSIFICATION"),
                h("span", { className: "px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800" },
                  formatDueYearDisplay ? formatDueYearDisplay(f.dueYear || f.dueDate) : (f.dueYear || "Y2026")
                )
              ),
              h("div", { className: "space-y-2.5 text-xs" },
                h("div", null,
                  h("label", { className: "text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase block mb-1" }, "CATEGORY (หมวดหมู่) *"),
                  h("select", {
                    value: f.category || "NORMAL STANDARD",
                    onChange: e => setF({ ...f, category: e.target.value }),
                    className: "w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold text-xs"
                  },
                    h("option", { value: "NORMAL STANDARD" }, "NORMAL STANDARD"),
                    h("option", { value: "CENTRALIZED" }, "CENTRALIZED"),
                    h("option", { value: "EACH SECTION" }, "EACH SECTION"),
                    h("option", { value: "CANCEL" }, "CANCEL (ปลดระวาง/ยกเลิก)")
                  )
                ),
                h("div", { className: "grid grid-cols-2 gap-2" },
                  h("div", null,
                    h("label", { className: "text-[9px] text-slate-500 dark:text-slate-400 font-bold uppercase block mb-1" }, "CONTROL INST."),
                    h("input", {
                      type: "text",
                      value: f.controlInstrument || "",
                      onChange: e => setF({ ...f, controlInstrument: e.target.value }),
                      placeholder: "CENTRALIZED / QAP-01",
                      className: "w-full px-2 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono text-xs"
                    })
                  ),
                  h("div", null,
                    h("label", { className: "text-[9px] text-slate-500 dark:text-slate-400 font-bold uppercase block mb-1" }, "CTC CONTROL"),
                    h("select", {
                      value: f.ctcControl || "YES",
                      onChange: e => setF({ ...f, ctcControl: e.target.value }),
                      className: "w-full px-2 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold text-xs"
                    },
                      h("option", { value: "YES" }, "YES"),
                      h("option", { value: "NO" }, "NO")
                    )
                  )
                ),
                h("div", null,
                  h("label", { className: "text-[9px] text-slate-500 dark:text-slate-400 font-bold uppercase block mb-1" }, "LAB CAL (แล็ปที่ส่งสอบเทียบ)"),
                  h("input", {
                    type: "text",
                    value: f.labCal || "",
                    onChange: e => setF({ ...f, labCal: e.target.value }),
                    placeholder: "NA CALTECHNOLOGIES / INTERNAL",
                    className: "w-full px-2 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs"
                  })
                ),
                h("div", null,
                  h("label", { className: "text-[9px] text-slate-500 dark:text-slate-400 font-bold uppercase block mb-1" }, "DUE YEAR (ปีที่ครบกำหนด)"),
                  h("input", {
                    type: "text",
                    value: f.dueYear || "",
                    onChange: e => setF({ ...f, dueYear: e.target.value }),
                    placeholder: "Jun-27 / 2027",
                    className: "w-full px-2 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs"
                  })
                )
              )
            ),

            // Right 2 Columns: ข้อมูลทางวิศวกรรมและการผลิต (Engineering Specs)
            h("div", { className: "md:col-span-2 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-3" },
              h("div", { className: "flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2" },
                h("h3", { className: "text-xs font-bold text-slate-900 dark:text-white uppercase flex items-center gap-1.5" },
                  h(o5, { className: "w-3.5 h-3.5 text-blue-600 dark:text-blue-400" }),
                  "ข้อมูลทางวิศวกรรมและการผลิต (ENGINEERING SPECS)"
                ),
                h("span", { className: "text-[10px] text-slate-400 dark:text-slate-500 font-mono" }, "MPE & IDENTIFICATION")
              ),
              h("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs" },
                h("div", null,
                  h("label", { className: "block font-bold text-slate-700 dark:text-slate-300 mb-1" }, "รหัสเครื่องมือ (Code No.) *"),
                  h("input", {
                    type: "text",
                    value: f.codeNo || "",
                    onChange: e => setF({ ...f, codeNo: e.target.value }),
                    placeholder: "DBD-030-001",
                    className: "w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono font-bold text-xs focus:ring-1 focus:ring-blue-500"
                  })
                ),
                h("div", null,
                  h("label", { className: "block font-bold text-slate-700 dark:text-slate-300 mb-1" }, "ชื่อเครื่องมือวัด (Instrument Name) *"),
                  h("input", {
                    type: "text",
                    value: f.instrumentName || "",
                    onChange: e => setF({ ...f, instrumentName: e.target.value }),
                    placeholder: "DIGMATIC DEPTH GAUGE",
                    className: "w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold text-xs focus:ring-1 focus:ring-blue-500"
                  })
                ),
                h("div", null,
                  h("label", { className: "block font-medium text-slate-700 dark:text-slate-300 mb-1" }, "ผู้ผลิต / ยี่ห้อ (Maker Name)"),
                  h("input", {
                    type: "text",
                    value: f.makerName || "",
                    onChange: e => setF({ ...f, makerName: e.target.value }),
                    placeholder: "KANON / MITUTOYO",
                    className: "w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs"
                  })
                ),
                h("div", null,
                  h("label", { className: "block font-medium text-slate-700 dark:text-slate-300 mb-1" }, "รุ่น (Model)"),
                  h("input", {
                    type: "text",
                    value: f.model || "",
                    onChange: e => setF({ ...f, model: e.target.value }),
                    placeholder: "E-DP2J / 500-196-30",
                    className: "w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs"
                  })
                ),
                h("div", null,
                  h("label", { className: "block font-medium text-slate-700 dark:text-slate-300 mb-1" }, "หมายเลขเครื่อง (Serial No.)"),
                  h("input", {
                    type: "text",
                    value: f.serialNo || "",
                    onChange: e => setF({ ...f, serialNo: e.target.value }),
                    placeholder: "14Z19 / SN-884920",
                    className: "w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono text-xs"
                  })
                ),
                h("div", null,
                  h("label", { className: "block font-medium text-slate-700 dark:text-slate-300 mb-1" }, "ขนาดและย่านวัด (Range)"),
                  h("input", {
                    type: "text",
                    value: f.size || "",
                    onChange: e => setF({ ...f, size: e.target.value }),
                    placeholder: "0-20 mm / 0-150 mm",
                    className: "w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs"
                  })
                ),
                h("div", null,
                  h("label", { className: "block font-medium text-slate-700 dark:text-slate-300 mb-1" }, "เกณฑ์ความคลาดเคลื่อน (Accuracy / MPE)"),
                  h("input", {
                    type: "text",
                    value: f.accuracy || "",
                    onChange: e => setF({ ...f, accuracy: e.target.value }),
                    placeholder: "± 0.01 mm, ± 0.05% FS",
                    className: "w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs"
                  })
                ),
                h("div", null,
                  h("label", { className: "block font-medium text-slate-700 dark:text-slate-300 mb-1" }, "รอบการสอบเทียบ (Interval)"),
                  h("select", {
                    value: f.frequency || "1 Year",
                    onChange: e => calculateDueDate(f.calDate, e.target.value),
                    className: "w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs font-bold"
                  },
                    h("option", { value: "1 Year" }, "1 ปี (1 Year)"),
                    h("option", { value: "6 Months" }, "6 เดือน (6 Months)"),
                    h("option", { value: "3 Months" }, "3 เดือน (3 Months)"),
                    h("option", { value: "2 Years" }, "2 ปี (2 Years)")
                  )
                ),
                h("div", null,
                  h("label", { className: "block font-medium text-slate-700 dark:text-slate-300 mb-1" }, "แผนกผู้รับผิดชอบ (Section)"),
                  h("input", {
                    type: "text",
                    value: f.section || "",
                    onChange: e => setF({ ...f, section: e.target.value }),
                    placeholder: "QAP Section / Production",
                    className: "w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs"
                  })
                ),
                h("div", null,
                  h("label", { className: "block font-medium text-slate-700 dark:text-slate-300 mb-1" }, "จุดใช้งาน / ไลน์ (Sub Section / Location)"),
                  h("input", {
                    type: "text",
                    value: f.subSection || "",
                    onChange: e => setF({ ...f, subSection: e.target.value }),
                    placeholder: "Quality Inspection / Line 1",
                    className: "w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs"
                  })
                ),
                h("div", null,
                  h("label", { className: "block font-medium text-slate-700 dark:text-slate-300 mb-1" }, "วันที่ขึ้นทะเบียน (Register Date)"),
                  h("input", {
                    type: "date",
                    value: f.registerDate || "",
                    onChange: e => setF({ ...f, registerDate: e.target.value }),
                    className: "w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs"
                  })
                ),
                h("div", null,
                  h("label", { className: "block font-medium text-slate-700 dark:text-slate-300 mb-1" }, "สถานะการใช้งาน (Status)"),
                  h("select", {
                    value: f.status || "normal",
                    onChange: e => setF({ ...f, status: e.target.value }),
                    className: "w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs font-bold"
                  },
                    h("option", { value: "normal" }, "ปกติ (IN SPEC)"),
                    h("option", { value: "due_soon" }, "ใกล้ครบกำหนดสอบเทียบ"),
                    h("option", { value: "overdue" }, "เกินกำหนดสอบเทียบ"),
                    h("option", { value: "external" }, "ส่งสอบเทียบภายนอก"),
                    h("option", { value: "cancel" }, "ปลดระวาง/ยกเลิก (CANCEL)")
                  )
                )
              )
            )
          ),

          // Middle Card: สภาวะแวดล้อมขณะสอบเทียบและเกจมาตรฐานอ้างอิง (Environmental Conditions & Standard)
          h("div", { className: "bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-3" },
            h("div", { className: "flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2" },
              h("h3", { className: "text-xs font-bold text-slate-900 dark:text-white uppercase flex items-center gap-1.5" },
                h(sd, { className: "w-3.5 h-3.5 text-blue-600 dark:text-blue-400" }),
                "สภาวะแวดล้อมขณะสอบเทียบและเกจมาตรฐานอ้างอิง (ENVIRONMENTAL CONDITIONS & STANDARD)"
              )
            ),
            h("div", { className: "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs" },
              h("div", { className: "sm:col-span-2" },
                h("label", { className: "block font-medium text-slate-700 dark:text-slate-300 mb-1" }, "เกจมาตรฐานอ้างอิง (Standard Used)"),
                h("input", {
                  type: "text",
                  value: f.standardUsed || "",
                  onChange: e => setF({ ...f, standardUsed: e.target.value }),
                  placeholder: "Standard Gauge Block Set ISO 3650 Grade 0",
                  className: "w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs"
                })
              ),
              h("div", null,
                h("label", { className: "block font-medium text-slate-700 dark:text-slate-300 mb-1" }, "อุณหภูมิห้องแล็บ (Temp)"),
                h("input", {
                  type: "text",
                  value: f.temperature || "",
                  onChange: e => setF({ ...f, temperature: e.target.value }),
                  placeholder: "20.0 °C ± 1.0 °C",
                  className: "w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs"
                })
              ),
              h("div", null,
                h("label", { className: "block font-medium text-slate-700 dark:text-slate-300 mb-1" }, "ความชื้นสัมพัทธ์ (Humidity)"),
                h("input", {
                  type: "text",
                  value: f.humidity || "",
                  onChange: e => setF({ ...f, humidity: e.target.value }),
                  placeholder: "50% RH ± 5%",
                  className: "w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs"
                })
              ),
              h("div", { className: "sm:col-span-2" },
                h("label", { className: "block font-medium text-slate-700 dark:text-slate-300 mb-1" }, "ค่าความไม่แน่นอน (Uncertainty)"),
                h("input", {
                  type: "text",
                  value: f.uncertainty || "",
                  onChange: e => setF({ ...f, uncertainty: e.target.value }),
                  placeholder: "U = ±0.005 mm (k=2)",
                  className: "w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs"
                })
              ),
              h("div", { className: "sm:col-span-2" },
                h("label", { className: "block font-medium text-slate-700 dark:text-slate-300 mb-1" }, "แหล่งสืบย้อน (Traceability)"),
                h("input", {
                  type: "text",
                  value: f.traceability || "",
                  onChange: e => setF({ ...f, traceability: e.target.value }),
                  placeholder: "NIMT (Thailand) / ISO 17025 Accredited",
                  className: "w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs"
                })
              ),
              h("div", { className: "sm:col-span-3" },
                h("label", { className: "block font-medium text-slate-700 dark:text-slate-300 mb-1" }, "หมายเหตุการใช้งาน (Notes)"),
                h("input", {
                  type: "text",
                  value: f.notes || "",
                  onChange: e => setF({ ...f, notes: e.target.value }),
                  placeholder: "ระบุข้อกำหนดเฉพาะ สภาพการเก็บรักษา หรือหมายเหตุประกอบ",
                  className: "w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs"
                })
              ),
              // Image upload & preview
              h("div", { className: "sm:col-span-1" },
                h("label", { className: "block font-medium text-slate-700 dark:text-slate-300 mb-1" }, "รูปภาพเครื่องมือ"),
                h("label", {
                  className: "w-full py-1.5 px-2 rounded-lg border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-850 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center gap-1.5 text-[11px] font-bold text-slate-600 dark:text-slate-300 cursor-pointer"
                },
                  h("span", null, f.imageUrl ? "📷 เปลี่ยนรูป" : "📷 อัปโหลดรูป"),
                  h("input", {
                    type: "file",
                    accept: "image/*",
                    onChange: handleImageFileChange,
                    className: "hidden"
                  })
                )
              )
            )
          ),

          // Bottom Accordion: การประเมินข้อกำหนด ISO/IEC 17025 (Collapsible Accordion)
          h("div", { className: "bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs overflow-hidden" },
            h("div", {
              onClick: () => setShowIsoAccordion(!showIsoAccordion),
              className: "px-4 py-3 bg-slate-50/80 dark:bg-slate-850 flex items-center justify-between cursor-pointer hover:bg-slate-100/80 dark:hover:bg-slate-800 transition select-none"
            },
              h("div", { className: "flex items-center gap-2" },
                h("span", { className: "text-base" }, "📋"),
                h("span", { className: "text-xs font-bold text-slate-900 dark:text-white" }, "รายการประเมินและตรวจสอบตามมาตรฐาน ISO/IEC 17025 (9 ข้อ)"),
                h("span", {
                  className: "px-2 py-0.5 rounded-full text-[10px] font-black " +
                    (isoStats.isFullyCompliant ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300" : "bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300")
                },
                  isoStats.checkedCount + "/9 ข้อ (" + Math.round((isoStats.checkedCount / 9) * 100) + "%)"
                )
              ),
              h("div", { className: "flex items-center gap-2" },
                h("span", { className: "text-xs text-blue-600 dark:text-blue-400 font-bold" },
                  showIsoAccordion ? "▲ ย่อเก็บ" : "▼ กางออกเพื่อตรวจเช็ค"
                )
              )
            ),
            showIsoAccordion && h("div", { className: "p-4 border-t border-slate-200 dark:border-slate-800 space-y-3" },
              h("div", { className: "flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800 text-xs flex-wrap gap-2" },
                h("div", { className: "flex items-center gap-2" },
                  h("button", {
                    type: "button",
                    onClick: () => handleToggleAllChecklist(true),
                    className: "px-2 py-1 rounded bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 font-bold text-[11px] border border-emerald-200 cursor-pointer"
                  }, "✓ ติ๊กผ่านทั้งหมด"),
                  h("button", {
                    type: "button",
                    onClick: () => handleToggleAllChecklist(false),
                    className: "px-2 py-1 rounded bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 font-bold text-[11px] border border-slate-200 cursor-pointer"
                  }, "✕ ยกเลิกทั้งหมด")
                ),
                h("div", { className: "flex items-center gap-2 text-xs" },
                  h("input", {
                    type: "text",
                    value: isoAuditedBy || "",
                    onChange: e => setIsoAuditedBy(e.target.value),
                    placeholder: "ผู้ตรวจประเมิน",
                    className: "px-2 py-1 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                  }),
                  h("input", {
                    type: "date",
                    value: isoAuditDate || "",
                    onChange: e => setIsoAuditDate(e.target.value),
                    className: "px-2 py-1 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                  })
                )
              ),
              h("div", { className: "space-y-2" },
                isoChecklist.map((item, idx) => h("div", {
                  key: item.id || idx,
                  className: "p-2.5 rounded-lg border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-start gap-2.5 text-xs"
                },
                  h("input", {
                    type: "checkbox",
                    checked: !!item.checked,
                    onChange: () => handleToggleChecklist(item.id),
                    className: "mt-0.5 w-4 h-4 rounded text-blue-600 cursor-pointer shrink-0"
                  }),
                  h("div", { className: "flex-1" },
                    h("div", { className: "font-bold text-slate-800 dark:text-slate-200" }, (idx + 1) + ". " + item.title),
                    h("div", { className: "text-[11px] text-slate-500 dark:text-slate-400 mt-0.5" }, item.description),
                    h("input", {
                      type: "text",
                      value: item.notes || "",
                      onChange: e => handleChecklistNotes(item.id, e.target.value),
                      placeholder: "บันทึกหลักฐาน / ผลการตรวจประเมินข้อนี้",
                      className: "mt-1.5 w-full px-2 py-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-850 text-[11px]"
                    })
                  )
                ))
              )
            )
          )
        ),

        // ==========================================
        // PAGE 2: ประวัติสอบเทียบ & ไทม์ไลน์ใบเซอร์ (History & Timeline)
        // ==========================================
        activeTab === "history" && h("div", { className: "space-y-4" },
          // Top Summary Row: 4 Metric Cards (Like View Modal)
          h("div", { className: "grid grid-cols-2 sm:grid-cols-4 gap-3" },
            // Card 1: จำนวนประวัติ
            h("div", { className: "p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xs" },
              h("div", { className: "text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider" }, "CALIBRATION CYCLES"),
              h("div", { className: "text-xl font-black text-blue-600 dark:text-blue-400 mt-0.5 font-mono" },
                historyList.length + " รอบ"
              ),
              h("div", { className: "text-[10px] text-slate-500 dark:text-slate-400 mt-0.5" }, "ประวัติสอบเทียบสะสม")
            ),
            // Card 2: ใบเซอร์รอบปัจจุบัน
            h("div", { className: "p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xs" },
              h("div", { className: "text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider" }, "LATEST CERT NO."),
              h("div", { className: "text-xs font-black text-slate-900 dark:text-white mt-1 font-mono truncate" },
                historyList[0]?.certNo || f.certNo || "ไม่มีข้อมูล"
              ),
              h("div", { className: "text-[10px] text-slate-500 dark:text-slate-400 mt-0.5" }, "ใบรับรองรอบล่าสุด")
            ),
            // Card 3: อัตราผ่านเกณฑ์
            h("div", { className: "p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xs" },
              h("div", { className: "text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider" }, "PASS RATE"),
              h("div", { className: "text-xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5 font-mono" },
                passRatePercent + "%"
              ),
              h("div", { className: "text-[10px] text-slate-500 dark:text-slate-400 mt-0.5" }, "สถิติผลการสอบเทียบ")
            ),
            // Card 4: Action Button (+ บันทึกผลรอบใหม่)
            h("div", { className: "p-2.5 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40 border border-blue-200 dark:border-blue-900 flex flex-col justify-center" },
              h("button", {
                type: "button",
                onClick: () => setShowNewRoundForm(!showNewRoundForm),
                className: "w-full py-2 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition flex items-center justify-center gap-1.5 cursor-pointer"
              },
                h("span", null, showNewRoundForm ? "✕ ปิดฟอร์ม" : "＋ บันทึกรอบใหม่"),
              ),
              h("div", { className: "text-[10px] text-center text-blue-700 dark:text-blue-300 mt-1 font-medium" },
                showNewRoundForm ? "กำลังกรอกผลรอบใหม่" : "เพิ่มผลสอบเทียบรอบใหม่"
              )
            )
          ),

          // New Round Expansion Form
          showNewRoundForm && h("div", {
            className: "p-4 rounded-xl bg-white dark:bg-slate-900 border-2 border-blue-500/50 shadow-md space-y-3 animate-in fade-in"
          },
            h("div", { className: "flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2" },
              h("h4", { className: "text-xs font-black text-blue-600 dark:text-blue-400 uppercase flex items-center gap-1.5" },
                "＋ บันทึกผลการสอบเทียบประจำรอบใหม่ (NEW CALIBRATION CYCLE)"
              ),
              h("span", { className: "text-[10px] text-slate-400" }, "จะถูกเพิ่มเป็นรอบล่าสุดทันที")
            ),
            h("div", { className: "grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs" },
              h("div", null,
                h("label", { className: "block font-bold text-slate-700 dark:text-slate-300 mb-1" }, "เลขที่ใบรับรอง (Cert No.) *"),
                h("input", {
                  type: "text",
                  value: newRound.certNo || "",
                  onChange: e => setNewRound({ ...newRound, certNo: e.target.value }),
                  placeholder: "CERT-2026-001",
                  className: "w-full px-2.5 py-1.5 rounded-lg border border-blue-300 dark:border-blue-700 bg-blue-50/20 text-xs font-mono font-bold"
                })
              ),
              h("div", null,
                h("label", { className: "block font-medium text-slate-700 dark:text-slate-300 mb-1" }, "วันที่สอบเทียบ (Cal Date) *"),
                h("input", {
                  type: "date",
                  value: newRound.calDate || "",
                  onChange: e => {
                    const cVal = e.target.value;
                    const d = new Date(cVal);
                    if (!isNaN(d.getTime())) {
                      d.setFullYear(d.getFullYear() + 1);
                      setNewRound({ ...newRound, calDate: cVal, dueDate: d.toISOString().split("T")[0] });
                    } else {
                      setNewRound({ ...newRound, calDate: cVal });
                    }
                  },
                  className: "w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                })
              ),
              h("div", null,
                h("label", { className: "block font-medium text-slate-700 dark:text-slate-300 mb-1" }, "วันครบกำหนดรอบถัดไป (Due Date)"),
                h("input", {
                  type: "date",
                  value: newRound.dueDate || "",
                  onChange: e => setNewRound({ ...newRound, dueDate: e.target.value }),
                  className: "w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                })
              ),
              h("div", null,
                h("label", { className: "block font-medium text-slate-700 dark:text-slate-300 mb-1" }, "ผลการสอบเทียบ (Result)"),
                h("select", {
                  value: newRound.result || "PASS",
                  onChange: e => setNewRound({ ...newRound, result: e.target.value }),
                  className: "w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold"
                },
                  h("option", { value: "PASS" }, "PASS (ผ่านเกณฑ์มาตรฐาน)"),
                  h("option", { value: "ADJUSTED" }, "ADJUSTED (ปรับแต่งแล้วผ่าน)"),
                  h("option", { value: "FAIL" }, "FAIL (ไม่ผ่านเกณฑ์มาตรฐาน)")
                )
              ),
              h("div", null,
                h("label", { className: "block font-medium text-slate-700 dark:text-slate-300 mb-1" }, "สถาบัน / แล็ปที่สอบเทียบ"),
                h("input", {
                  type: "text",
                  value: newRound.calibratedBy || "",
                  onChange: e => setNewRound({ ...newRound, calibratedBy: e.target.value }),
                  placeholder: "NA CALTECHNOLOGIES",
                  className: "w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                })
              ),
              h("div", null,
                h("label", { className: "block font-medium text-slate-700 dark:text-slate-300 mb-1" }, "ค่าความไม่แน่นอน (Uncertainty)"),
                h("input", {
                  type: "text",
                  value: newRound.uncertainty || "",
                  onChange: e => setNewRound({ ...newRound, uncertainty: e.target.value }),
                  placeholder: "U = ±0.005 mm (k=2)",
                  className: "w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                })
              ),
              h("div", { className: "sm:col-span-2" },
                h("label", { className: "block font-medium text-slate-700 dark:text-slate-300 mb-1" }, "บันทึกผลการตรวจสอบรอบนี้"),
                h("input", {
                  type: "text",
                  value: newRound.notes || "",
                  onChange: e => setNewRound({ ...newRound, notes: e.target.value }),
                  placeholder: "ผลการสอบเทียบประจำรอบ สมบูรณ์พร้อมใช้งาน",
                  className: "w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                })
              ),
              h("div", null,
                h("label", { className: "block font-medium text-slate-700 dark:text-slate-300 mb-1" }, "แนบไฟล์ PDF ใบรับรอง"),
                h("input", {
                  type: "file",
                  accept: "application/pdf",
                  onChange: e => {
                    const file = e.target.files && e.target.files[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = () => setNewRound({ ...newRound, pdfUrl: reader.result });
                      reader.readAsDataURL(file);
                    }
                  },
                  className: "w-full text-xs"
                })
              )
            ),
            h("div", { className: "flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800" },
              h("button", {
                type: "button",
                onClick: () => setShowNewRoundForm(false),
                className: "px-3 py-1.5 rounded-lg border border-slate-300 text-slate-600 dark:text-slate-400 text-xs font-bold hover:bg-slate-100 cursor-pointer"
              }, "ยกเลิก"),
              h("button", {
                type: "button",
                onClick: handleAddNewRound,
                className: "px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm cursor-pointer"
              }, "✓ บันทึกรอบนี้เข้าประวัติ")
            )
          ),

          // Current Round Quick Fields
          h("div", { className: "bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-3" },
            h("div", { className: "flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2" },
              h("h4", { className: "text-xs font-bold text-slate-900 dark:text-white uppercase flex items-center gap-1.5" },
                h(iD, { className: "w-3.5 h-3.5 text-blue-600 dark:text-blue-400" }),
                "ข้อมูลใบเซอร์และรอบสอบเทียบล่าสุด (LATEST CYCLE INFORMATION)"
              ),
              h("span", { className: "text-[10px] text-slate-400" }, "รอบปัจจุบันที่กำลังใช้งาน")
            ),
            h("div", { className: "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs" },
              h("div", null,
                h("label", { className: "block font-bold text-slate-700 dark:text-slate-300 mb-1" }, "เลขที่ใบรับรอง (Cert No.) *"),
                h("input", {
                  type: "text",
                  value: f.certNo || "",
                  onChange: e => setF({ ...f, certNo: e.target.value }),
                  placeholder: "CERT-2026-001",
                  className: "w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono font-bold"
                })
              ),
              h("div", null,
                h("label", { className: "block font-bold text-slate-700 dark:text-slate-300 mb-1" }, "วันที่สอบเทียบ (Cal Date) *"),
                h("input", {
                  type: "date",
                  value: f.calDate || "",
                  onChange: e => calculateDueDate(e.target.value, f.frequency),
                  className: "w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold"
                })
              ),
              h("div", null,
                h("label", { className: "block font-bold text-slate-700 dark:text-slate-300 mb-1" }, "วันครบกำหนด (Due Date) *"),
                h("input", {
                  type: "date",
                  value: f.dueDate || "",
                  onChange: e => {
                    const dv = e.target.value;
                    const dy = dv ? new Date(dv).getFullYear().toString() : "";
                    setF({ ...f, dueDate: dv, dueYear: dy });
                  },
                  className: "w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold"
                })
              ),
              h("div", null,
                h("label", { className: "block font-medium text-slate-700 dark:text-slate-300 mb-1" }, "สถาบันที่สอบเทียบ (Cal Lab)"),
                h("input", {
                  type: "text",
                  value: f.calibratedBy || "",
                  onChange: e => setF({ ...f, calibratedBy: e.target.value, labCal: e.target.value }),
                  placeholder: "NA CALTECHNOLOGIES",
                  className: "w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                })
              )
            )
          ),

          // Timeline Cards List (History Cycles)
          h("div", { className: "space-y-3" },
            h("div", { className: "flex items-center justify-between" },
              h("h4", { className: "text-xs font-bold text-slate-900 dark:text-white uppercase flex items-center gap-1.5" },
                h(iD, { className: "w-3.5 h-3.5 text-blue-600 dark:text-blue-400" }),
                "ไทม์ไลน์ประวัติการสอบเทียบทั้งหมด (" + historyList.length + " รายการ)"
              ),
              h("span", { className: "text-[10px] text-slate-400" }, "เรียงลำดับจากรอบล่าสุดไปอดีต")
            ),

            historyList.length === 0 && h("div", {
              className: "p-8 text-center rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-400 text-xs"
            }, "ยังไม่มีประวัติการสอบเทียบ ให้คลิกปุ่ม '+ บันทึกรอบใหม่' ด้านบน"),

            historyList.map((item, idx) => {
              const isPass = (item.result || "PASS").toUpperCase() === "PASS";
              const isLatest = idx === 0;

              return h("div", {
                key: item.id || idx,
                className: "p-4 rounded-xl bg-white dark:bg-slate-900 border " +
                  (isLatest ? "border-blue-400 dark:border-blue-700 ring-1 ring-blue-400/20" : "border-slate-200/90 dark:border-slate-800") +
                  " shadow-2xs space-y-3 relative overflow-hidden"
              },
                // Top Tag Bar
                h("div", { className: "flex items-center justify-between flex-wrap gap-2" },
                  h("div", { className: "flex items-center gap-2" },
                    h("span", {
                      className: "px-2 py-0.5 rounded text-[10px] font-black font-mono " +
                        (isLatest ? "bg-blue-600 text-white" : "bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300")
                    },
                      isLatest ? "รอบล่าสุด (CYCLE 1)" : ("รอบที่ " + (historyList.length - idx))
                    ),
                    h("span", { className: "font-mono font-bold text-xs text-slate-900 dark:text-white" },
                      item.certNo || "CERT-NO-NUMBER"
                    ),
                    h("span", {
                      className: "px-2 py-0.5 rounded-full text-[10px] font-black " +
                        (isPass ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300" : "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300")
                    },
                      isPass ? "✓ ผ่านเกณฑ์ (PASS)" : "✕ ไม่ผ่านเกณฑ์ (FAIL)"
                    )
                  ),
                  h("div", { className: "flex items-center gap-1.5" },
                    // PDF Badge or Upload Button
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
                    ),
                    // Delete Button
                    historyList.length > 1 && h("button", {
                      type: "button",
                      onClick: () => handleDeleteHistory(idx),
                      className: "p-1 text-slate-400 hover:text-rose-600 transition cursor-pointer",
                      title: "ลบรอบนี้"
                    }, "🗑️")
                  )
                ),

                // Details Grid
                h("div", { className: "grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs pt-1 border-t border-slate-100 dark:border-slate-800/80" },
                  h("div", null,
                    h("div", { className: "text-[10px] text-slate-400" }, "วันที่สอบเทียบ"),
                    h("div", { className: "font-semibold text-slate-800 dark:text-slate-200" }, item.calDate || "-")
                  ),
                  h("div", null,
                    h("div", { className: "text-[10px] text-slate-400" }, "วันครบกำหนด"),
                    h("div", { className: "font-semibold text-slate-800 dark:text-slate-200" }, item.dueDate || "-")
                  ),
                  h("div", null,
                    h("div", { className: "text-[10px] text-slate-400" }, "แล็ปที่สอบเทียบ"),
                    h("div", { className: "font-semibold text-slate-800 dark:text-slate-200 truncate" }, item.calibratedBy || "-")
                  ),
                  h("div", null,
                    h("div", { className: "text-[10px] text-slate-400" }, "Uncertainty (k=2)"),
                    h("div", { className: "font-semibold text-slate-800 dark:text-slate-200 truncate" }, item.uncertainty || "-")
                  )
                ),
                item.notes && h("div", {
                  className: "text-[11px] text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-850 p-2 rounded-lg border border-slate-100 dark:border-slate-800"
                }, "📝 " + item.notes)
              );
            })
          )
        )
      ),

      // 4. Footer Bar (Navigation & Submit)
      h("div", {
        className: "px-5 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90 flex items-center justify-between shrink-0 gap-2 flex-wrap"
      },
        h("div", { className: "flex items-center gap-2 text-xs" },
          h("span", { className: "text-slate-500 dark:text-slate-400 font-medium" },
            activeTab === "specs" ? "หน้า 1 จาก 2 : ข้อมูลจำเพาะ" : "หน้า 2 จาก 2 : ประวัติและใบเซอร์"
          ),
          h("span", { className: "text-slate-300 dark:text-slate-700" }, "|"),
          h("span", { className: "text-[11px] text-slate-400" },
            o ? "กำลังแก้ไขรหัส " + (f.codeNo || "") : "กำลังขึ้นทะเบียนใหม่"
          )
        ),
        h("div", { className: "flex items-center gap-2" },
          activeTab === "specs" ? h("button", {
            type: "button",
            onClick: () => setActiveTab("history"),
            className: "px-3.5 py-1.5 rounded-xl border border-blue-600 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/50 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
          },
            h("span", null, "ขั้นตอนถัดไป (ประวัติ)"),
            h("span", null, "→")
          ) : h("button", {
            type: "button",
            onClick: () => setActiveTab("specs"),
            className: "px-3.5 py-1.5 rounded-xl border border-slate-300 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
          },
            h("span", null, "←"),
            h("span", null, "ย้อนกลับ (ข้อมูลจำเพาะ)")
          ),
          h("button", {
            type: "button",
            onClick: handleSave,
            className: "px-5 py-1.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-black shadow-md shadow-blue-500/20 transition flex items-center gap-1.5 cursor-pointer"
          },
            h(S0, { className: "w-4 h-4 text-white" }),
            h("span", null, o ? "บันทึกการแก้ไขเครื่องมือวัด" : "ยืนยันขึ้นทะเบียนเครื่องมือวัด")
          )
        )
      )
    )
  );
}