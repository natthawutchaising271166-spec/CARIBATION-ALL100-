const rSe = ({ isOpen: e, onClose: t, instrument: r, onEdit: n, onPrintCert: l, onViewImage: o, onUpdateInstrument: u }) => {
  const h = A.createElement;
  const [copiedCode, setCopiedCode] = A.useState(false);

  if (!e || !r) return null;

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

  const daysRemaining = calculateDays(r.dueDate);

  // Calibration progress
  const getProgress = () => {
    const startD = parseSmartDate(r.calDate);
    const endD = parseSmartDate(r.dueDate);
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

  const statusInfo = getStatusInfo(r.status);

  // History entries
  const historyList = (Array.isArray(r.history) && r.history.length > 0)
    ? [...r.history].sort((a, b) => new Date(b.calDate || 0).getTime() - new Date(a.calDate || 0).getTime())
    : (Array.isArray(r.calibrationHistory) && r.calibrationHistory.length > 0)
    ? [...r.calibrationHistory].sort((a, b) => new Date(b.calDate || 0).getTime() - new Date(a.calDate || 0).getTime())
    : [{
        id: 'curr-' + (r.id || '1'),
        certNo: r.certNo || ('CERT-' + (r.codeNo || 'CURRENT')),
        calDate: r.calDate || '',
        dueDate: r.dueDate || '',
        calibratedBy: r.labCal || r.calibratedBy || '-',
        result: 'PASS',
        notes: r.notes || r.remarks || '',
        pdfUrl: r.pdfUrl || r.certFileData || null,
        certFileName: r.certFileName || null
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
              }, r.codeNo || '-')
            ),
            h('p', { className: 'text-[10px] text-slate-500 dark:text-slate-400 truncate hidden sm:block' }, 'ข้อมูลจำเพาะ รหัสควบคุม และประวัติการสอบเทียบ')
          )
        ),
        h('div', { className: 'flex items-center gap-1.5 shrink-0' },
          n && h('button', {
            type: 'button',
            onClick: () => { t(); n(r); },
            className: 'px-2.5 py-1 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold flex items-center gap-1 transition shadow-2xs cursor-pointer'
          }, '✏️ แก้ไข'),
          l && h('button', {
            type: 'button',
            onClick: () => { l(r); },
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
              r.category && h('span', {
                className: 'px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-200 border border-blue-300 dark:border-blue-700'
              }, r.category),
              r.controlInstrument && h('span', {
                className: 'px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700'
              }, 'CONTROL: ' + r.controlInstrument),
              r.ctcControl && h('span', {
                className: 'px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-900 dark:bg-purple-950 dark:text-purple-200 border border-purple-300 dark:border-purple-700'
              }, 'CTC: ' + r.ctcControl),
              (r.labCal || r.calibratedBy) && h('span', {
                className: 'px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200 border border-amber-300 dark:border-amber-700 flex items-center gap-1 max-w-[200px] truncate',
                title: r.labCal || r.calibratedBy
              }, '🏛️ LAB: ' + (r.labCal || r.calibratedBy))
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
                h('span', { className: 'text-base sm:text-lg font-black font-mono tracking-tight text-blue-700 dark:text-blue-400 truncate' }, r.codeNo || '-'),
                h('button', {
                  type: 'button',
                  onClick: () => copyText(r.codeNo),
                  className: 'text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900 transition flex items-center gap-1 cursor-pointer shrink-0'
                }, copiedCode ? '✓ คัดลอก' : '📋 คัดลอก')
              ),
              h('h3', { className: 'text-xs sm:text-sm font-bold text-slate-900 dark:text-white mt-0.5 truncate' }, r.instrumentName || '-')
            )
          ),

          // Calibration Timeline & Progress Gauge
          (r.calDate || r.dueDate) && h('div', {
            className: 'p-2 rounded-md bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1.5'
          },
            h('div', { className: 'flex flex-wrap items-center justify-between text-[11px] text-slate-700 dark:text-slate-300 gap-1.5' },
              h('span', { className: 'font-semibold flex items-center gap-1' },
                '📅 รอบสอบเทียบ: ',
                h('strong', { className: 'text-slate-900 dark:text-white font-mono text-[10px] px-1 py-0.2 bg-white dark:bg-slate-800 rounded border border-slate-300 dark:border-slate-700' }, r.calDate || '-'),
                ' ถึง ',
                h('strong', { className: 'text-slate-900 dark:text-white font-mono text-[10px] px-1 py-0.2 bg-white dark:bg-slate-800 rounded border border-slate-300 dark:border-slate-700' }, r.dueDate || '-')
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
          
          // Panel 1: ข้อมูลเครื่องมือและสเปค
          h('div', {
            className: 'p-3 rounded-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-2'
          },
            h('div', { className: 'flex items-center gap-1.5 pb-1 border-b border-blue-600 font-bold text-[11px] uppercase tracking-wider text-blue-700 dark:text-blue-400' },
              '🏷️ ข้อมูลจำเพาะ & สเปค'
            ),
            h('div', { className: 'space-y-1 text-[11px]' },
              h('div', { className: 'flex items-center justify-between gap-1' },
                h('span', { className: 'text-slate-500 dark:text-slate-400 shrink-0' }, 'ยี่ห้อ (MAKER):'),
                h('span', { className: 'font-bold text-slate-900 dark:text-white truncate text-right' }, r.makerName || '-')
              ),
              h('div', { className: 'flex items-center justify-between gap-1' },
                h('span', { className: 'text-slate-500 dark:text-slate-400 shrink-0' }, 'รุ่น (MODEL):'),
                h('span', { className: 'font-bold text-slate-900 dark:text-white truncate text-right' }, r.model || '-')
              ),
              h('div', { className: 'flex items-center justify-between gap-1' },
                h('span', { className: 'text-slate-500 dark:text-slate-400 shrink-0' }, 'หมายเลขเครื่อง:'),
                h('span', { className: 'font-mono font-bold text-slate-900 dark:text-white truncate text-right' }, r.serialNo || '-')
              ),
              h('div', { className: 'flex items-center justify-between gap-1' },
                h('span', { className: 'text-slate-500 dark:text-slate-400 shrink-0' }, 'ขนาดย่านวัด:'),
                h('span', { className: 'font-bold text-blue-700 dark:text-blue-400 text-right px-1.5 py-0.2 bg-blue-50 dark:bg-blue-950/80 rounded border border-blue-200 dark:border-blue-800 text-[10px] truncate' }, r.size || '-')
              ),
              h('div', { className: 'flex items-center justify-between gap-1' },
                h('span', { className: 'text-slate-500 dark:text-slate-400 shrink-0' }, 'หมวดหมู่:'),
                h('span', { className: 'font-semibold text-slate-900 dark:text-white truncate text-right' }, r.category || '-')
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
                h('span', { className: 'font-bold text-slate-900 dark:text-white truncate text-right' }, r.section || '-')
              ),
              h('div', { className: 'flex items-center justify-between gap-1' },
                h('span', { className: 'text-slate-500 dark:text-slate-400 shrink-0' }, 'จุดใช้งาน (LINE):'),
                h('span', { className: 'font-bold text-slate-900 dark:text-white truncate text-right' }, r.subSection || '-')
              ),
              h('div', { className: 'flex items-center justify-between gap-1' },
                h('span', { className: 'text-slate-500 dark:text-slate-400 shrink-0' }, 'ขึ้นทะเบียน:'),
                h('span', { className: 'font-mono text-slate-900 dark:text-white truncate text-right' }, r.registerDate || '-')
              ),
              h('div', { className: 'flex items-center justify-between gap-1' },
                h('span', { className: 'text-slate-500 dark:text-slate-400 shrink-0' }, 'CONTROL INST.:'),
                h('span', { className: 'font-bold text-slate-900 dark:text-white truncate text-right' }, r.controlInstrument || '-')
              ),
              h('div', { className: 'flex items-center justify-between gap-1' },
                h('span', { className: 'text-slate-500 dark:text-slate-400 shrink-0' }, 'CTC CONTROL:'),
                h('span', { className: 'font-bold text-purple-700 dark:text-purple-400 truncate text-right' }, r.ctcControl || '-')
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
                h('span', { className: 'font-bold text-slate-900 dark:text-white truncate text-right' }, r.frequency || '-')
              ),
              h('div', { className: 'flex items-center justify-between gap-1' },
                h('span', { className: 'text-slate-500 dark:text-slate-400 shrink-0' }, 'วันสอบเทียบ:'),
                h('span', { className: 'font-mono font-bold text-emerald-700 dark:text-emerald-400 truncate text-right' }, r.calDate || '-')
              ),
              h('div', { className: 'flex items-center justify-between gap-1' },
                h('span', { className: 'text-slate-500 dark:text-slate-400 shrink-0' }, 'วันครบกำหนด:'),
                h('span', { className: 'font-mono font-bold text-rose-600 dark:text-rose-400 truncate text-right' }, r.dueDate || '-')
              ),
              h('div', { className: 'flex items-center justify-between gap-1' },
                h('span', { className: 'text-slate-500 dark:text-slate-400 shrink-0' }, 'ปีที่ครบกำหนด:'),
                h('span', { className: 'font-bold text-slate-900 dark:text-white truncate text-right' }, r.dueYear || '-')
              ),
              h('div', { className: 'flex items-center justify-between gap-1' },
                h('span', { className: 'text-slate-500 dark:text-slate-400 shrink-0' }, 'ผู้สอบเทียบ:'),
                h('span', { className: 'font-bold text-amber-700 dark:text-amber-400 truncate text-right max-w-[120px]', title: r.labCal || r.calibratedBy || '-' }, r.labCal || r.calibratedBy || '-')
              )
            )
          )
        ),

        // Remarks / Notes Row (If Available)
        (r.notes || r.remarks) && h('div', {
          className: 'p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 text-[11px] shadow-2xs space-y-0.5'
        },
          h('span', { className: 'font-bold text-amber-900 dark:text-amber-300 flex items-center gap-1' },
            '📝 หมายเหตุเพิ่มเติม:'
          ),
          h('p', { className: 'text-slate-800 dark:text-slate-200 whitespace-pre-wrap pl-4 font-normal' }, r.notes || r.remarks)
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
              const hasPdf = !!(item.pdfUrl || item.certFileData || r.pdfUrl || r.certFileData);
              const pdfData = item.pdfUrl || item.certFileData || r.pdfUrl || r.certFileData;

              return h('div', {
                key: item.id || idx,
                className: 'p-2.5 sm:p-3 rounded-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px]'
              },
                h('div', { className: 'space-y-1 min-w-0' },
                  h('div', { className: 'flex flex-wrap items-center gap-1.5' },
                    h('span', { className: 'font-bold text-slate-900 dark:text-white font-mono text-xs' }, item.certNo || ('CERT-' + (r.codeNo || '1'))),
                    h('span', {
                      className: 'px-2 py-0.2 rounded text-[10px] font-bold ' + ((item.result || 'PASS').toUpperCase() === 'PASS' ? 'bg-emerald-600 text-white' : 'bg-amber-500 text-slate-950')
                    }, item.result || 'PASS'),
                    item.calibratedBy && h('span', { className: 'text-[10px] text-slate-500 dark:text-slate-400 font-medium truncate max-w-[150px]', title: item.calibratedBy }, '• โดย: ' + item.calibratedBy)
                  ),
                  h('div', { className: 'text-[10px] text-slate-600 dark:text-slate-400 flex flex-wrap gap-x-3 gap-y-0.5' },
                    h('span', null, '📅 วันสอบเทียบ: ', h('strong', { className: 'text-slate-900 dark:text-white font-mono' }, item.calDate || '-')),
                    h('span', null, '⏳ วันครบกำหนด: ', h('strong', { className: 'text-slate-900 dark:text-white font-mono' }, item.dueDate || '-')),
                    item.notes && h('span', { className: 'text-slate-700 dark:text-slate-300 truncate max-w-[200px]', title: item.notes }, '💬 ' + item.notes)
                  )
                ),

                // Actions: View PDF / Upload PDF
                h('div', { className: 'flex items-center gap-1.5 shrink-0 self-start sm:self-center' },
                  hasPdf ? h('div', { className: 'flex items-center gap-1.5' },
                    h('button', {
                      type: 'button',
                      onClick: () => {
                        if (typeof window.qapPdfView === 'function') {
                          window.qapPdfView(pdfData, item.certNo || r.certNo, r);
                        } else if (typeof window.qapOpenDocViewer === 'function') {
                          window.qapOpenDocViewer(item, r);
                        } else if (pdfData) {
                          const w = window.open();
                          if (w) w.document.write('<iframe src="' + pdfData + '" style="width:100%;height:100%;border:none;"></iframe>');
                        }
                      },
                      className: 'px-2.5 py-1 rounded-md bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold transition flex items-center gap-1 cursor-pointer shadow-2xs active:scale-95'
                    }, '📄 ดูใบเซอร์ PDF'),
                    h('button', {
                      type: 'button',
                      onClick: () => {
                        if (typeof window.qapPdfRemove === 'function') {
                          window.qapPdfRemove(item.id, r, u);
                        }
                      },
                      className: 'p-1 rounded text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer text-xs',
                      title: 'ลบไฟล์ PDF'
                    }, '🗑️')
                  ) : h('label', {
                    className: 'px-2.5 py-1 rounded-md bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-600 text-[11px] font-bold transition flex items-center gap-1 cursor-pointer active:scale-95'
                  },
                    '📎 แนบไฟล์ PDF',
                    h('input', {
                      type: 'file',
                      accept: 'application/pdf',
                      className: 'hidden',
                      onChange: (evt) => {
                        if (typeof window.qapPdfUpload === 'function') {
                          window.qapPdfUpload(evt, item.id, r, u);
                        }
                      }
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
          'ID: ', r.id || '-'
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
