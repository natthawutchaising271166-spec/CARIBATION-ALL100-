const fs = require('fs');
let code = fs.readFileSync('app.js', 'utf8');

// 1. Add ThresholdSetting definition at the beginning of the IIFE or globally
const thresholdScript = `
window.qapAlertThreshold = 30;
try {
  const stored = localStorage.getItem('QAP_CALIBRATION_THRESHOLD');
  if (stored) window.qapAlertThreshold = parseInt(stored, 10) || 30;
} catch(e) {}
window.setQapAlertThreshold = function(val) {
  window.qapAlertThreshold = val;
  try {
    localStorage.setItem('QAP_CALIBRATION_THRESHOLD', val.toString());
  } catch(e) {}
  window.dispatchEvent(new Event('qap-threshold-changed'));
};
window.ThresholdSetting = function(A, m) {
  const [val, setVal] = A.useState(window.qapAlertThreshold);
  A.useEffect(() => {
    const handler = () => setVal(window.qapAlertThreshold);
    window.addEventListener('qap-threshold-changed', handler);
    return () => window.removeEventListener('qap-threshold-changed', handler);
  }, []);
  return m.jsxDEV("div", {
    className: "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[11px] font-medium transition shadow-xs bg-amber-50 dark:bg-amber-950/40 border-amber-300/70 dark:border-amber-700/70 text-amber-900 dark:text-amber-300 ml-1",
    title: "ตั้งค่าจำนวนวันเตือนล่วงหน้าก่อนครบกำหนด (Threshold Alert)",
    children: [
      m.jsxDEV("span", { className: "font-semibold hidden sm:inline", children: "เตือนล่วงหน้า:" }, void 0, !1, {}, void 0),
      m.jsxDEV("span", { className: "font-semibold sm:hidden", children: "เตือน:" }, void 0, !1, {}, void 0),
      m.jsxDEV("input", {
        type: "number",
        min: "1",
        max: "365",
        value: val,
        onChange: (e) => {
          let v = parseInt(e.target.value, 10);
          if(isNaN(v) || v < 1) v = 1;
          if(v > 365) v = 365;
          window.setQapAlertThreshold(v);
        },
        className: "w-11 text-center font-mono font-bold bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-600 rounded px-1 py-0.5 text-amber-900 dark:text-amber-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
      }, void 0, !1, {}, void 0),
      m.jsxDEV("span", { className: "font-semibold", children: "วัน" }, void 0, !1, {}, void 0)
    ]
  }, void 0, !0, {}, void 0);
};
`;

code = thresholdScript + code;

// 2. Replace hardcoded 30
code = code.replace(/t<=30\?"due_soon"/g, 't<=window.qapAlertThreshold?"due_soon"');
code = code.replace(/Re>=0&&Re<=30/g, 'Re>=0&&Re<=window.qapAlertThreshold');

// 3. Inject ThresholdSetting into InstrumentTable
// Find the 'Add Instrument' button and inject right after it, or right after the 'Status Filter' dropdown.
const targetHtml = `onClick:v,className:"inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-700`;
if (code.includes(targetHtml)) {
  const replacement = targetHtml.replace('onClick:v,className:"inline-flex', 'onClick:v,className:"inline-flex');
  // Wait, let's inject BEFORE the add instrument button in the children array.
  // The children array is `children:[m.jsxDEV("button",{onClick:v...`
  // We can just replace `children:[m.jsxDEV("button",{onClick:v` with `children:[window.ThresholdSetting(A, m), m.jsxDEV("button",{onClick:v`
  
  code = code.replace(
    'children:[m.jsxDEV("button",{onClick:v,className:"inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-700',
    'children:[window.ThresholdSetting(A, m),m.jsxDEV("button",{onClick:v,className:"inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-700'
  );
  console.log("Successfully injected ThresholdSetting");
} else {
  console.log("Could not find Add Instrument button");
}

fs.writeFileSync('app.js', code);
