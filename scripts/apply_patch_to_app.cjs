// scripts/apply_patch_to_app.cjs
const fs = require('fs');

let appCode = fs.readFileSync('app.js', 'utf8');
const patchedJ3e = fs.readFileSync('scripts/j3e_patched.js', 'utf8');

// 1. Locate J3e in app.js
const startIdx = appCode.indexOf('const J3e = ({ isOpen:');
let endIdx = appCode.indexOf('const eSe=({isOpen:e', startIdx);
if (endIdx === -1) {
  endIdx = appCode.indexOf(',eSe=({isOpen:e', startIdx);
  if (endIdx === -1) {
    endIdx = appCode.indexOf('eSe=({isOpen:e', startIdx);
  }
}

if (startIdx === -1 || endIdx === -1) {
  console.error('Could not find J3e boundaries in app.js');
  process.exit(1);
}

console.log('Replacing J3e from index', startIdx, 'to', endIdx);
const replacement = patchedJ3e + (appCode.slice(endIdx).startsWith('const eSe') ? '\n' : ';\nconst ');
const eSeRealStart = appCode.slice(endIdx).startsWith('const eSe') ? endIdx : (appCode.slice(endIdx).startsWith(',eSe') ? endIdx + 1 : endIdx);
appCode = appCode.slice(0, startIdx) + patchedJ3e + ';\nconst ' + appCode.slice(appCode.indexOf('eSe=({isOpen:e', startIdx));

// 2. Fix onOpenAddModal calls in App.tsx
// Instead of setting instrumentToEdit (y({category:...})), always clear instrumentToEdit to null (y(null))
const targets = [
  'onOpenAddModal:()=>{y({category:"NORMAL STANDARD"});g(!0)}',
  'onOpenAddModal:()=>{y({category:"CENTRALIZED"});g(!0)}',
  'onOpenAddModal:()=>{y({category:"EACH SECTION"});g(!0)}',
  'onOpenAddModal:()=>{y({category:"CANCEL",status:"inactive"});g(!0)}'
];

targets.forEach(target => {
  if (appCode.includes(target)) {
    appCode = appCode.replace(target, 'onOpenAddModal:()=>{y(null);g(!0)}');
    console.log('Replaced target:', target);
  } else {
    console.warn('Target not found:', target);
  }
});

// 3. Update J3e invocation to pass defaultCategory, currentTab, and activeTab
const oldJ3eCall = 'm.jsxDEV(J3e,{isOpen:v,onClose:()=>g(!1),onSave:Ee,instrumentToEdit:N,defaultCategory:e==="cancel"?"CANCEL":e==="centralized"?"CENTRALIZED":e==="each_section"?"EACH SECTION":"NORMAL STANDARD",totalInstrumentsCount:c.length},void 0,!1,{fileName:"/app/applet/src/App.tsx",lineNumber:502,columnNumber:7},this)';
const newJ3eCall = 'm.jsxDEV(J3e,{isOpen:v,onClose:()=>g(!1),onSave:Ee,instrumentToEdit:N,defaultCategory:e==="cancel"?"CANCEL":e==="centralized"?"CENTRALIZED":e==="each_section"?"EACH SECTION":"NORMAL STANDARD",totalInstrumentsCount:c.length,activeTab:e,currentTab:e},void 0,!1,{fileName:"/app/applet/src/App.tsx",lineNumber:502,columnNumber:7},this)';

if (appCode.includes(oldJ3eCall)) {
  appCode = appCode.replace(oldJ3eCall, newJ3eCall);
  console.log('Successfully updated J3e invocation in App.tsx');
} else {
  console.warn('Could not find exact oldJ3eCall, checking if already has activeTab');
}

// 4. Upgrade Ee to guarantee saving into the currently open page e
const oldEeStart = appCode.indexOf('Ee=de=>{');
const oldEeEnd = appCode.indexOf('F=de=>{', oldEeStart);
if (oldEeStart !== -1 && oldEeEnd !== -1) {
  const newEeCode = `Ee=(de,targetTabArg)=>{
    const targetTab = targetTabArg || de.targetTab || (e && e !== "dashboard" ? e : (de.category === "CANCEL" ? "cancel" : de.category === "CENTRALIZED" ? "centralized" : de.category === "EACH SECTION" ? "each_section" : de.category === "NORMAL STANDARD" ? "normal_standard" : "calibration_all"));
    const finalCategory = targetTab === "cancel" ? "CANCEL" : targetTab === "centralized" ? "CENTRALIZED" : targetTab === "each_section" ? "EACH SECTION" : targetTab === "normal_standard" ? "NORMAL STANDARD" : (de.category || "NORMAL STANDARD");
    const finalItem = { ...de, category: finalCategory, status: targetTab === "cancel" ? (de.status || "inactive") : (de.status || "normal") };

    if (targetTab === "cancel" || finalCategory === "CANCEL") {
      setCancelInstruments(Re => Re.some(te => te.id === finalItem.id) ? Re.map(te => te.id === finalItem.id ? finalItem : te) : [{ ...finalItem, status: "inactive" }, ...Re]);
      f(Re => Re.some(te => te.id === finalItem.id) ? Re.map(te => te.id === finalItem.id ? finalItem : te) : [{ ...finalItem, status: "inactive" }, ...Re]);
    } else if (targetTab === "centralized" || finalCategory === "CENTRALIZED") {
      setCentInstruments(Re => Re.some(te => te.id === finalItem.id) ? Re.map(te => te.id === finalItem.id ? finalItem : te) : [finalItem, ...Re]);
      f(Re => Re.some(te => te.id === finalItem.id) ? Re.map(te => te.id === finalItem.id ? finalItem : te) : [finalItem, ...Re]);
    } else if (targetTab === "each_section" || finalCategory === "EACH SECTION") {
      setEachInstruments(Re => Re.some(te => te.id === finalItem.id) ? Re.map(te => te.id === finalItem.id ? finalItem : te) : [finalItem, ...Re]);
      f(Re => Re.some(te => te.id === finalItem.id) ? Re.map(te => te.id === finalItem.id ? finalItem : te) : [finalItem, ...Re]);
    } else if (targetTab === "normal_standard" || finalCategory === "NORMAL STANDARD") {
      setNsInstruments(Re => Re.some(te => te.id === finalItem.id) ? Re.map(te => te.id === finalItem.id ? finalItem : te) : [finalItem, ...Re]);
      f(Re => Re.some(te => te.id === finalItem.id) ? Re.map(te => te.id === finalItem.id ? finalItem : te) : [finalItem, ...Re]);
    } else {
      f(Re => Re.some(te => te.id === finalItem.id) ? Re.map(te => te.id === finalItem.id ? finalItem : te) : [finalItem, ...Re]);
      if (finalCategory === "NORMAL STANDARD") {
        setNsInstruments(Re => Re.some(te => te.id === finalItem.id) ? Re.map(te => te.id === finalItem.id ? finalItem : te) : [finalItem, ...Re]);
      } else if (finalCategory === "CENTRALIZED") {
        setCentInstruments(Re => Re.some(te => te.id === finalItem.id) ? Re.map(te => te.id === finalItem.id ? finalItem : te) : [finalItem, ...Re]);
      } else if (finalCategory === "EACH SECTION") {
        setEachInstruments(Re => Re.some(te => te.id === finalItem.id) ? Re.map(te => te.id === finalItem.id ? finalItem : te) : [finalItem, ...Re]);
      } else if (finalCategory === "CANCEL") {
        setCancelInstruments(Re => Re.some(te => te.id === finalItem.id) ? Re.map(te => te.id === finalItem.id ? finalItem : te) : [finalItem, ...Re]);
      }
    }
    ae();
    try {
      if (window.qapSupabase && window.qapSupabase.isConfigured()) {
        window.qapSupabase.upsertInstrument(finalItem, targetTab);
      }
    } catch (err) {}
  },`;
  appCode = appCode.slice(0, oldEeStart) + newEeCode + appCode.slice(oldEeEnd);
  console.log('Successfully upgraded Ee in App.tsx');
}

fs.writeFileSync('app.js', appCode);
console.log('✅ app.js successfully updated! New size:', fs.statSync('app.js').size);
