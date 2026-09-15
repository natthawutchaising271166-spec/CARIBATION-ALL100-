const rSe = ({ isOpen: e, onClose: t, instrument: r, onEdit: n, onPrintCert: l, onViewImage: o, onUpdateInstrument: u }) => {
  const h = A.createElement;
  const [instData, setInstData] = A.useState(r);
  const [copiedCode, setCopiedCode] = A.useState(false);
  const [isProcessing, setIsProcessing] = A.useState(false);

  // Keep instData in sync when prop r changes
  A.useEffect(() => {
    setInstData(r);
  }, [r]);

  if (!e || !instData) return null;

  const currentInst = instData;

  const formatBytes = (bytes) => {
    if (!bytes || bytes === 0) return '';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const copyText = (text) => {
    if (!text) return;
    try {
      navigator.clipboard.writeText(text);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } catch (err) {}
  };

  // Robust Smart Date Parser supporting all Thai/Eng calibration date formats
  const parseSmartDate = (str) => {
    if (!str) return null;
    const s = String(str).trim();
    if (!s) return null;

    const monthMap = {
      jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
      'ม.ค.': 0, 'ก.พ.': 1, 'มี.ค.': 2, 'เม.ย.': 3, 'พ.ค.': 4, 'มิ.ย.': 5, 'ก.ค.': 6, 'ส.ค.': 7, 'ก.ย.': 8, 'ต.ค.': 9, 'พ.ย.': 10, 'ธ.ค.': 11,
      'มกราคม': 0, 'กุมภาพันธ์': 1, 'มีนาคม': 2, 'เมษายน': 3, 'พฤษภาคม': 4, 'มิถุนายน': 5, 'กรกฎาคม': 6, 'สิงหาคม': 7, 'กันยายน': 8, 'ตุลาคม': 9, 'พฤศจิกายน': 10, 'ธันวาคม': 11
    };

    // 1. ISO YYYY-MM-DD
    const isoMatch = s.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
    if (isoMatch) {
      let year = parseInt(isoMatch[1], 10);
      if (year > 2400) year -= 543;
      return new Date(year, parseInt(isoMatch[2], 10) - 1, parseInt(isoMatch[3], 10));
    }

    // 2. DD-MMM-YY or DD-MMM-YYYY (e.g. 20-Jun-26, 20-Jun-2027)
    const dmyMatch = s.match(/^(\d{1,2})[-/\s]([A-Za-zก-๙.]+)[-/\s](\d{2,4})$/);
    if (dmyMatch) {
      const day = parseInt(dmyMatch[1], 10);
      const mStr = dmyMatch[2].toLowerCase().replace(/\./g, '');
      let month = 0;
      for (const [k, v] of Object.entries(monthMap)) {
        if (k.startsWith(mStr) || mStr.startsWith(k)) {
          month = v;
          break;
        }
      }
      let year = parseInt(dmyMatch[3], 10);
      if (year < 100) year += 2000;
      if (year > 2400) year -= 543;
      return new Date(year, month, day);
    }

    // 3. DD/MM/YYYY or DD/MM/YY
    const slashMatch = s.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{2,4})$/);
    if (slashMatch) {
      const day = parseInt(slashMatch[1], 10);
      const month = parseInt(slashMatch[2], 10) - 1;
      let year = parseInt(slashMatch[3], 10);
      if (year < 100) year += 2000;
      if (year > 2400) year -= 543;
      return new Date(year, month, day);
    }

    // 4. MMM-YY or MMM-YYYY
    const myMatch = s.match(/^([A-Za-zก-๙.]+)[-/\s](\d{2,4})$/);
    if (myMatch) {
      const mStr = myMatch[1].toLowerCase().replace(/\./g, '');
      let month = 0;
      for (const [k, v] of Object.entries(monthMap)) {
        if (k.startsWith(mStr) || mStr.startsWith(k)) {
          month = v;
          break;
        }
      }
      let year = parseInt(myMatch[2], 10);
      if (year < 100) year += 2000;
      if (year > 2400) year -= 543;
      return new Date(year, month, 1);
    }

    const d = new Date(s);
    return isNaN(d.getTime()) ? null : d;
  };

  // Calculate days remaining with proper date parsing
  const calculateDays = (dueDateStr) => {
    if (!dueDateStr) return null;
    const target = parseSmartDate(dueDateStr);
    if (!target) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    target.setHours(0, 0, 0, 0);
    return Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  };

  const daysRemaining = calculateDays(currentInst.dueDate);

  // Calibration progress
  const getProgress = () => {
    const startD = parseSmartDate(currentInst.calDate);
    const endD = parseSmartDate(currentInst.dueDate);
    if (!startD || !endD) return { percent: 100, color: 'bg-blue-600' };

    const start = startD.getTime();
    const end = endD.getTime();
    const now = Date.now();

    if (end <= start) return { percent: 100, color: 'bg-blue-600' };
    const total = end - start;
    const elapsed = Math.max(0, Math.min(total, now - start));
    const percent = Math.min(100, Math.max(0, Math.round((elapsed / total) * 100)));

    if (now > end) return { percent: 100, color: 'bg-rose-500' };
    if (daysRemaining !== null && daysRemaining <= 30) return { percent: percent, color: 'bg-amber-500' };
    return { percent: percent, color: 'bg-emerald-500' };
  };

  const progress = getProgress();

  // Status badge helper (compact & high contrast)
  const getStatusInfo = (rawStatus) => {
    const s = String(rawStatus || '').toLowerCase();
    if (s === 'inactive' || s === 'cancel') {
      return {
        label: 'ยกเลิก / จำหน่ายออก',
        bg: 'bg-slate-700 text-slate-100 border border-slate-600',
        dot: 'bg-slate-400'
      };
    }
    if (s === 'in_calibration' || s === 'in_cal' || s === 'in_lab') {
      return {
        label: 'ส่งสอบเทียบภายนอก (In Calibration)',
        bg: 'bg-sky-600 text-white border border-sky-400',
        dot: 'bg-white animate-ping'
      };
    }
    if (s === 'overdue' || (daysRemaining !== null && daysRemaining < 0 && s !== 'inactive' && s !== 'cancel')) {
      return {
        label: 'เกินกำหนดสอบเทียบ (Overdue)',
        bg: 'bg-rose-600 text-white border border-rose-400 shadow-2xs',
        dot: 'bg-white animate-ping'
      };
    }
    if (s === 'due_soon' || (daysRemaining !== null && daysRemaining >= 0 && daysRemaining <= 30 && s !== 'inactive' && s !== 'cancel')) {
      return {
        label: 'ใกล้ครบกำหนด (Due Soon)',
        bg: 'bg-amber-500 text-slate-950 font-black border border-amber-300 shadow-2xs',
        dot: 'bg-slate-950 animate-pulse'
      };
    }
    return {
      label: 'ปกติ / ใช้งานได้ (In Spec / Normal)',
      bg: 'bg-emerald-600 text-white border border-emerald-400 shadow-2xs',
      dot: 'bg-white'
    };
  };

  const statusInfo = getStatusInfo(currentInst.status);

  // Handle PDF Upload with in-browser compression
  const handleFileUpload = async (e, histId) => {
    const file = e && e.target && e.target.files && e.target.files[0];
    if (!file) return;

    setIsProcessing(true);
    try {
      let base64 = null;
      let compSize = file.size;
      let origSize = file.size;

      if (typeof window.qapCompressPdf === 'function') {
        const res = await window.qapCompressPdf(file);
        base64 = res.dataUrl;
        compSize = res.compressedSize;
        origSize = res.originalSize;
      } else {
        base64 = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      }

      const existingHistory = Array.isArray(currentInst.history) && currentInst.history.length > 0
        ? [...currentInst.history]
        : Array.isArray(currentInst.calibrationHistory) && currentInst.calibrationHistory.length > 0
        ? [...currentInst.calibrationHistory]
        : [{
            id: histId || 'hist-curr',
            certNo: currentInst.certNo || ('CERT-' + (currentInst.codeNo || '1')),
            calDate: currentInst.calDate || new Date().toISOString().split('T')[0],
            dueDate: currentInst.dueDate || '',
            calibratedBy: currentInst.labCal || currentInst.calibratedBy || '-',
            result: 'PASS'
          }];

      const updatedHistory = existingHistory.map(item => {
        if (item.id === histId || (!histId && existingHistory.length === 1)) {
          return {
            ...item,
            certFileData: base64,
            certFileName: file.name,
            pdfUrl: base64,
            fileSize: compSize,
            originalFileSize: origSize
          };
        }
        return item;
      });

      const updatedInst = {
        ...currentInst,
        history: updatedHistory,
        calibrationHistory: updatedHistory,
        certFileData: base64,
        certFileName: file.name,
        pdfUrl: base64,
        fileSize: compSize
      };

      setInstData(updatedInst);
      if (typeof u === 'function') {
        u(updatedInst);
      }
    } catch (err) {
      console.error('File upload error:', err);
      alert('เกิดข้อผิดพลาดในการอัปโหลดไฟล์: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle PDF Removal
  const handleFileRemove = (histId) => {
    if (!confirm('ยืนยันลบไฟล์ PDF ใบรับรองนี้หรือไม่?')) return;

    const existingHistory = Array.isArray(currentInst.history) && currentInst.history.length > 0
      ? [...currentInst.history]
      : Array.isArray(currentInst.calibrationHistory) && currentInst.calibrationHistory.length > 0
      ? [...currentInst.calibrationHistory]
      : [{
          id: histId || 'hist-curr',
          certNo: currentInst.certNo || ('CERT-' + (currentInst.codeNo || '1')),
          calDate: currentInst.calDate || '',
          dueDate: currentInst.dueDate || ''
        }];

    const updatedHistory = existingHistory.map(item => {
      if (item.id === histId || (!histId && existingHistory.length === 1)) {
        const copy = { ...item };
        delete copy.certFileData;
        delete copy.certFileName;
        delete copy.pdfUrl;
        delete copy.fileSize;
        delete copy.originalFileSize;
        return {
          ...copy,
          certFileData: null,
          certFileName: null,
          pdfUrl: null,
          fileSize: null
        };
      }
      return item;
    });

    const updatedInst = {
      ...currentInst,
      history: updatedHistory,
      calibrationHistory: updatedHistory,
      certFileData: null,
      certFileName: null,
      pdfUrl: null,
      fileSize: null
    };

    setInstData(updatedInst);
    if (typeof u === 'function') {
      u(updatedInst);
    }
  };

  // Open Doc Viewer
  const handleViewPdf = (item) => {
    const rawPdf = item.pdfUrl || item.certFileData || currentInst.pdfUrl || currentInst.certFileData;
    if (typeof window.qapOpenDocViewer === 'function') {
      window.qapOpenDocViewer(item, currentInst);
    } else if (rawPdf) {
      const w = window.open();
      if (w) w.document.write('<iframe src="' + rawPdf + '" style="width:100%;height:100%;border:none;"></iframe>');
    }
  };

  // History entries
  const historyList = (Array.isArray(currentInst.history) && currentInst.history.length > 0)
    ? [...currentInst.history].sort((a, b) => new Date(b.calDate || 0).getTime() - new Date(a.calDate || 0).getTime())
    : (Array.isArray(currentInst.calibrationHistory) && currentInst.calibrationHistory.length > 0)
    ? [...currentInst.calibrationHistory].sort((a, b) => new Date(b.calDate || 0).getTime() - new Date(a.calDate || 0).getTime())
    : [{
        id: 'curr-' + (currentInst.id || '1'),
        certNo: currentInst.certNo || ('CERT-' + (currentInst.codeNo || 'CURRENT')),
        calDate: currentInst.calDate || '',
        dueDate: currentInst.dueDate || '',
        calibratedBy: currentInst.labCal || currentInst.calibratedBy || '-',
        result: 'PASS',
        notes: currentInst.notes || currentInst.remarks || '',
        pdfUrl: currentInst.pdfUrl || currentInst.certFileData || null,
        certFileName: currentInst.certFileName || null,
        fileSize: currentInst.fileSize || null
      }];

  return h('div', {
    className: 'fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-3 md:p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto',
    onClick: (evt) => { if (evt.target === evt.currentTarget) t(); }
  },
    h('div', {
      className: 'relative w-full max-w-4xl max-h-[96vh] flex flex-col bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl shadow-2xl overflow-hidden text-slate-900 dark:text-slate-100 my-auto'
    },
      // 1. Header Bar (Compact & Responsive)
      h('div', {
        className: 'flex items-center justify-between px-3.5 sm:px-4 py-2 sm:py-2.5 border-b border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950 shrink-0 gap-2'
      },
        h('div', { className: 'flex items-center gap-2 min-w-0' },
          h('div', {
            className: 'w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-sm sm:text-base shrink-0 shadow-2xs'
          }, '🔬'),
          h('div', { className: 'min-w-0' },
            h('div', { className: 'flex items-center gap-1.5 flex-wrap' },
              h('h2', { className: 'text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate' }, 'รายละเอียดเครื่องมือวัด'),
              h('span', {
                className: 'text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-blue-600 text-white shadow-2xs'
              }, currentInst.codeNo || '-')
            ),
            h('p', { className: 'text-[10px] text-slate-500 dark:text-slate-400 truncate hidden sm:block' }, 'ข้อมูลจำเพาะ รหัสควบคุม และประวัติการสอบเทียบ')
          )
        ),
        h('div', { className: 'flex items-center gap-1.5 shrink-0' },
          n && h('button', {
            type: 'button',
            onClick: () => { t(); n(currentInst); },
            className: 'px-2.5 py-1 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold flex items-center gap-1 transition shadow-2xs cursor-pointer'
          }, '✏️ แก้ไข'),
          l && h('button', {
            type: 'button',
            onClick: () => { l(currentInst); },
            className: 'px-2.5 py-1 rounded-md bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-600 text-[11px] font-bold flex items-center gap-1 transition cursor-pointer'
          }, '🖨️ พิมพ์ใบเซอร์'),
          h('button', {
            type: 'button',
            onClick: t,
            className: 'w-7 h-7 rounded-md flex items-center justify-center text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition cursor-pointer text-sm font-bold'
          }, '✕')
        )
      ),

      // 2. Scrollable Body (Fluid, Adaptive, Compact Spacing)
      h('div', { className: 'flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 scrollbar-thin bg-slate-50 dark:bg-slate-900' },
        
        // Compact Hero Card
        h('div', {
          className: 'p-3 sm:p-3.5 rounded-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-2.5'
        },
          // Badge Tags & Status Pill
          h('div', { className: 'flex flex-wrap items-center justify-between gap-1.5' },
            h('div', { className: 'flex flex-wrap items-center gap-1.5' },
              currentInst.category && h('span', {
                className: 'px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-200 border border-blue-300 dark:border-blue-700'
              }, currentInst.category),
              currentInst.controlInstrument && h('span', {
                className: 'px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700'
              }, 'CONTROL: ' + currentInst.controlInstrument),
              currentInst.ctcControl && h('span', {
                className: 'px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-900 dark:bg-purple-950 dark:text-purple-200 border border-purple-300 dark:border-purple-700'
              }, 'CTC: ' + currentInst.ctcControl),
              (currentInst.labCal || currentInst.calibratedBy) && h('span', {
                className: 'px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200 border border-amber-300 dark:border-amber-700 flex items-center gap-1 max-w-[200px] truncate',
                title: currentInst.labCal || currentInst.calibratedBy
              }, '🏛️ LAB: ' + (currentInst.labCal || currentInst.calibratedBy))
            ),
            h('div', { className: 'flex items-center gap-1.5' },
              h('span', {
                className: 'px-2.5 py-0.5 rounded-full text-[10px] font-black border flex items-center gap-1.5 ' + statusInfo.bg
              },
                h('span', { className: 'w-2 h-2 rounded-full ' + statusInfo.dot }),
                statusInfo.label
              )
            )
          ),

          // Code No & Instrument Name Banner
          h('div', { className: 'flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 border-t border-slate-100 dark:border-slate-800/80 pt-2' },
            h('div', { className: 'min-w-0' },
              h('div', { className: 'flex items-center gap-2' },
                h('span', { className: 'text-base sm:text-lg font-black font-mono tracking-tight text-blue-700 dark:text-blue-400 truncate' }, currentInst.codeNo || '-'),
                h('button', {
                  type: 'button',
                  onClick: () => copyText(currentInst.codeNo),
                  className: 'text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900 transition flex items-center gap-1 cursor-pointer shrink-0'
                }, copiedCode ? '✓ คัดลอก' : '📋 คัดลอก')
              ),
              h('h3', { className: 'text-xs sm:text-sm font-bold text-slate-900 dark:text-white mt-0.5 truncate' }, currentInst.instrumentName || '-')
            )
          ),

          // Calibration Timeline & Progress Gauge
          (currentInst.calDate || currentInst.dueDate) && h('div', {
            className: 'p-2 rounded-md bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1.5'
          },
            h('div', { className: 'flex flex-wrap items-center justify-between text-[11px] text-slate-700 dark:text-slate-300 gap-1.5' },
              h('span', { className: 'font-semibold flex items-center gap-1' },
                '📅 รอบสอบเทียบ: ',
                h('strong', { className: 'text-slate-900 dark:text-white font-mono text-[10px] px-1 py-0.2 bg-white dark:bg-slate-800 rounded border border-slate-300 dark:border-slate-700' }, currentInst.calDate || '-'),
                ' ถึง ',
                h('strong', { className: 'text-slate-900 dark:text-white font-mono text-[10px] px-1 py-0.2 bg-white dark:bg-slate-800 rounded border border-slate-300 dark:border-slate-700' }, currentInst.dueDate || '-')
              ),
              h('span', {
                className: 'font-black text-[10px] px-2 py-0.5 rounded shadow-2xs ' + (daysRemaining !== null && daysRemaining < 0 ? 'bg-rose-600 text-white' : daysRemaining !== null && daysRemaining <= 30 ? 'bg-amber-500 text-slate-950' : 'bg-emerald-600 text-white')
              },
                daysRemaining === null ? '' : daysRemaining < 0 ? ('⚠️ เกินกำหนด ' + Math.abs(daysRemaining) + ' วัน') : daysRemaining === 0 ? '⚠️ ครบกำหนดวันนี้' : ('⏳ คงเหลือ ' + daysRemaining + ' วัน')
              )
            ),
            h('div', { className: 'w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden border border-slate-300/60 dark:border-slate-700/60' },
              h('div', {
                className: 'h-full rounded-full transition-all duration-500 ' + progress.color,
                style: { width: Math.max(4, Math.min(100, progress.percent)) + '%' }
              })
            )
          )
        ),

        // 3 Responsive Information Panels (Fluid Grid)
        h('div', { className: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5' },
          
          // Panel 1: ข้อมูลจำเพาะ & สเปค
          h('div', {
            className: 'p-3 rounded-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-2'
          },
            h('div', { className: 'flex items-center gap-1.5 pb-1 border-b border-blue-600 font-bold text-[11px] uppercase tracking-wider text-blue-700 dark:text-blue-400' },
              '🏷️ ข้อมูลจำเพาะ & สเปค'
            ),
            h('div', { className: 'space-y-1 text-[11px]' },
              h('div', { className: 'flex items-center justify-between gap-1' },
                h('span', { className: 'text-slate-500 dark:text-slate-400 shrink-0' }, 'ยี่ห้อ (MAKER):'),
                h('span', { className: 'font-bold text-slate-900 dark:text-white truncate text-right' }, currentInst.makerName || '-')
              ),
              h('div', { className: 'flex items-center justify-between gap-1' },
                h('span', { className: 'text-slate-500 dark:text-slate-400 shrink-0' }, 'รุ่น (MODEL):'),
                h('span', { className: 'font-bold text-slate-900 dark:text-white truncate text-right' }, currentInst.model || '-')
              ),
              h('div', { className: 'flex items-center justify-between gap-1' },
                h('span', { className: 'text-slate-500 dark:text-slate-400 shrink-0' }, 'หมายเลขเครื่อง:'),
                h('span', { className: 'font-mono font-bold text-slate-900 dark:text-white truncate text-right' }, currentInst.serialNo || '-')
              ),
              h('div', { className: 'flex items-center justify-between gap-1' },
                h('span', { className: 'text-slate-500 dark:text-slate-400 shrink-0' }, 'ขนาดย่านวัด:'),
                h('span', { className: 'font-bold text-blue-700 dark:text-blue-400 text-right px-1.5 py-0.2 bg-blue-50 dark:bg-blue-950/80 rounded border border-blue-200 dark:border-blue-800 text-[10px] truncate' }, currentInst.size || '-')
              ),
              h('div', { className: 'flex items-center justify-between gap-1' },
                h('span', { className: 'text-slate-500 dark:text-slate-400 shrink-0' }, 'หมวดหมู่:'),
                h('span', { className: 'font-semibold text-slate-900 dark:text-white truncate text-right' }, currentInst.category || '-')
              )
            )
          ),

          // Panel 2: การควบคุมและแผนก
          h('div', {
            className: 'p-3 rounded-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-2'
          },
            h('div', { className: 'flex items-center gap-1.5 pb-1 border-b border-indigo-600 font-bold text-[11px] uppercase tracking-wider text-indigo-700 dark:text-indigo-400' },
              '⚙️ การควบคุม & แผนก'
            ),
            h('div', { className: 'space-y-1 text-[11px]' },
              h('div', { className: 'flex items-center justify-between gap-1' },
                h('span', { className: 'text-slate-500 dark:text-slate-400 shrink-0' }, 'แผนก (SECTION):'),
                h('span', { className: 'font-bold text-slate-900 dark:text-white truncate text-right' }, currentInst.section || '-')
              ),
              h('div', { className: 'flex items-center justify-between gap-1' },
                h('span', { className: 'text-slate-500 dark:text-slate-400 shrink-0' }, 'จุดใช้งาน (LINE):'),
                h('span', { className: 'font-bold text-slate-900 dark:text-white truncate text-right' }, currentInst.subSection || '-')
              ),
              h('div', { className: 'flex items-center justify-between gap-1' },
                h('span', { className: 'text-slate-500 dark:text-slate-400 shrink-0' }, 'ขึ้นทะเบียน:'),
                h('span', { className: 'font-mono text-slate-900 dark:text-white truncate text-right' }, currentInst.registerDate || '-')
              ),
              h('div', { className: 'flex items-center justify-between gap-1' },
                h('span', { className: 'text-slate-500 dark:text-slate-400 shrink-0' }, 'CONTROL INST.:'),
                h('span', { className: 'font-bold text-slate-900 dark:text-white truncate text-right' }, currentInst.controlInstrument || '-')
              ),
              h('div', { className: 'flex items-center justify-between gap-1' },
                h('span', { className: 'text-slate-500 dark:text-slate-400 shrink-0' }, 'CTC CONTROL:'),
                h('span', { className: 'font-bold text-purple-700 dark:text-purple-400 truncate text-right' }, currentInst.ctcControl || '-')
              )
            )
          ),

          // Panel 3: แผนการสอบเทียบและ LAB
          h('div', {
            className: 'p-3 rounded-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-2 sm:col-span-2 lg:col-span-1'
          },
            h('div', { className: 'flex items-center gap-1.5 pb-1 border-b border-emerald-600 font-bold text-[11px] uppercase tracking-wider text-emerald-700 dark:text-emerald-400' },
              '⏱️ แผนการสอบเทียบ & LAB'
            ),
            h('div', { className: 'space-y-1 text-[11px]' },
              h('div', { className: 'flex items-center justify-between gap-1' },
                h('span', { className: 'text-slate-500 dark:text-slate-400 shrink-0' }, 'รอบสอบเทียบ:'),
                h('span', { className: 'font-bold text-slate-900 dark:text-white truncate text-right' }, currentInst.frequency || '-')
              ),
              h('div', { className: 'flex items-center justify-between gap-1' },
                h('span', { className: 'text-slate-500 dark:text-slate-400 shrink-0' }, 'วันสอบเทียบ:'),
                h('span', { className: 'font-mono font-bold text-emerald-700 dark:text-emerald-400 truncate text-right' }, currentInst.calDate || '-')
              ),
              h('div', { className: 'flex items-center justify-between gap-1' },
                h('span', { className: 'text-slate-500 dark:text-slate-400 shrink-0' }, 'วันครบกำหนด:'),
                h('span', { className: 'font-mono font-bold text-rose-600 dark:text-rose-400 truncate text-right' }, currentInst.dueDate || '-')
              ),
              h('div', { className: 'flex items-center justify-between gap-1' },
                h('span', { className: 'text-slate-500 dark:text-slate-400 shrink-0' }, 'ปีที่ครบกำหนด:'),
                h('span', { className: 'font-bold text-slate-900 dark:text-white truncate text-right' }, currentInst.dueYear || '-')
              ),
              h('div', { className: 'flex items-center justify-between gap-1' },
                h('span', { className: 'text-slate-500 dark:text-slate-400 shrink-0' }, 'ผู้สอบเทียบ:'),
                h('span', { className: 'font-bold text-amber-700 dark:text-amber-400 truncate text-right max-w-[120px]', title: currentInst.labCal || currentInst.calibratedBy || '-' }, currentInst.labCal || currentInst.calibratedBy || '-')
              )
            )
          )
        ),

        // Remarks / Notes Row (If Available)
        (currentInst.notes || currentInst.remarks) && h('div', {
          className: 'p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 text-[11px] shadow-2xs space-y-0.5'
        },
          h('span', { className: 'font-bold text-amber-900 dark:text-amber-300 flex items-center gap-1' },
            '📝 หมายเหตุเพิ่มเติม:'
          ),
          h('p', { className: 'text-slate-800 dark:text-slate-200 whitespace-pre-wrap pl-4 font-normal' }, currentInst.notes || currentInst.remarks)
        ),

        // Calibration History & Certificates Section
        h('div', { className: 'space-y-2 pt-1' },
          h('div', { className: 'flex items-center justify-between' },
            h('h4', { className: 'text-[11px] font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-1.5' },
              '📜 ประวัติการสอบเทียบ & ใบรับรอง',
              h('span', { className: 'px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-blue-600 text-white' },
                historyList.length + ' ฉบับ'
              )
            )
          ),

          h('div', { className: 'space-y-2' },
            historyList.map((item, idx) => {
              const hasPdf = !!(item.pdfUrl || item.certFileData || currentInst.pdfUrl || currentInst.certFileData);

              return h('div', {
                key: item.id || idx,
                className: 'p-2.5 sm:p-3 rounded-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px]'
              },
                h('div', { className: 'space-y-1 min-w-0' },
                  h('div', { className: 'flex flex-wrap items-center gap-1.5' },
                    h('span', { className: 'font-bold text-slate-900 dark:text-white font-mono text-xs' }, item.certNo || ('CERT-' + (currentInst.codeNo || '1'))),
                    (item.fileSize || currentInst.fileSize) && h('span', {
                      className: 'px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                    }, '⚡ ' + formatBytes(item.fileSize || currentInst.fileSize)),
                    h('span', {
                      className: 'px-2 py-0.2 rounded text-[10px] font-bold ' + ((item.result || 'PASS').toUpperCase() === 'PASS' ? 'bg-emerald-600 text-white' : 'bg-amber-500 text-slate-950')
                    }, item.result || 'PASS'),
                    (item.calibratedBy || currentInst.labCal || currentInst.calibratedBy) && h('span', {
                      className: 'text-[10px] text-slate-500 dark:text-slate-400 font-medium truncate max-w-[150px]',
                      title: item.calibratedBy || currentInst.labCal || currentInst.calibratedBy
                    }, '• โดย: ' + (item.calibratedBy || currentInst.labCal || currentInst.calibratedBy))
                  ),
                  h('div', { className: 'text-[10px] text-slate-600 dark:text-slate-400 flex flex-wrap gap-x-3 gap-y-0.5' },
                    h('span', null, '📅 วันสอบเทียบ: ', h('strong', { className: 'text-slate-900 dark:text-white font-mono' }, item.calDate || currentInst.calDate || '-')),
                    h('span', null, '⏳ วันครบกำหนด: ', h('strong', { className: 'text-slate-900 dark:text-white font-mono' }, item.dueDate || currentInst.dueDate || '-')),
                    item.notes && h('span', { className: 'text-slate-700 dark:text-slate-300 truncate max-w-[200px]', title: item.notes }, '💬 ' + item.notes)
                  )
                ),

                // Actions: View PDF / Delete PDF / Upload PDF
                h('div', { className: 'flex items-center gap-1.5 shrink-0 self-start sm:self-center' },
                  hasPdf ? h('div', { className: 'flex items-center gap-1.5' },
                    h('button', {
                      type: 'button',
                      onClick: () => handleViewPdf(item),
                      className: 'px-2.5 py-1 rounded-md bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold transition flex items-center gap-1 cursor-pointer shadow-2xs active:scale-95'
                    }, '📄 ดูใบเซอร์ PDF'),
                    h('button', {
                      type: 'button',
                      onClick: () => handleFileRemove(item.id),
                      className: 'p-1.5 rounded-md bg-slate-100 hover:bg-rose-100 text-slate-500 hover:text-rose-600 dark:bg-slate-800 dark:hover:bg-rose-950 dark:hover:text-rose-400 transition cursor-pointer border border-slate-200 dark:border-slate-700 text-xs',
                      title: 'ลบไฟล์ PDF ใบรับรองนี้'
                    }, '🗑️')
                  ) : h('label', {
                    className: 'px-2.5 py-1 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold transition flex items-center gap-1 cursor-pointer active:scale-95 shadow-2xs ' + (isProcessing ? 'opacity-60 pointer-events-none' : '')
                  },
                    isProcessing ? '⏳ กำลังประมวลผล...' : '📎 แนบไฟล์ PDF',
                    h('input', {
                      type: 'file',
                      accept: 'application/pdf,image/*',
                      className: 'hidden',
                      onChange: (evt) => handleFileUpload(evt, item.id)
                    })
                  )
                )
              );
            })
          )
        )
      ),

      // 3. Footer Bar (Compact)
      h('div', {
        className: 'flex items-center justify-between px-3.5 sm:px-4 py-2 border-t border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950 shrink-0'
      },
        h('div', { className: 'text-[10px] text-slate-500 dark:text-slate-400 font-mono truncate max-w-[200px]' },
          'ID: ', currentInst.id || '-'
        ),
        h('div', { className: 'flex items-center gap-2' },
          h('button', {
            type: 'button',
            onClick: t,
            className: 'px-4 py-1 rounded-md bg-slate-900 hover:bg-black text-white dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-white text-xs font-bold transition cursor-pointer active:scale-95'
          }, 'ปิด (Close)')
        )
      )
    )
  );
};
