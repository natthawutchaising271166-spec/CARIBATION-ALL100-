import sys

with open('app.js', 'r', encoding='utf-8') as f:
    code = f.read()

# 1. Update Q3e start to add smartDateFilter state
q3e_decl = 'Q3e=({instruments:e = [],cancelInstruments:cancelInstrumentsProp = [],onEdit:t,onDelete:r,onBulkDelete:n,onClearAll:l,onResetToDefault:o,onPrintCert:u,onViewImage:c,onViewDetail:f,onOpenImport:p,onExport:h,onOpenAddModal:v,statusFilter:g,setStatusFilter:N,onBulkUpdateStatus:y,pageTitle:customTitle,viewMode:customViewMode,onDownloadTemplate:customDownload})=>'
q3e_init = '''{
  const [smartDateFilter, setSmartDateFilter] = A.useState(() => window.qapActiveDateFilter || { preset: "ALL", targetField: "dueDate", label: "ทั้งหมด" });
  A.useEffect(() => {
    const handler = (ev) => {
      if (ev && ev.detail) setSmartDateFilter(ev.detail);
    };
    window.addEventListener("qap-date-filter-change", handler);
    return () => window.removeEventListener("qap-date-filter-change", handler);
  }, []);'''

if q3e_decl + '{' in code:
    code = code.replace(q3e_decl + '{', q3e_decl + q3e_init, 1)
    print("1. Successfully hooked smartDateFilter state in Q3e")
else:
    print("Error: q3e_decl not found")
    sys.exit(1)

# 2. Update ir filter in Q3e
target_filter_end = 'if(String(ce[Oe]||"").trim().toLowerCase()!==Be.toLowerCase())return!1}return!(E.trim()&&!ut.has(ce.id))'
replacement_filter_end = '''if(String(ce[Oe]||"").trim().toLowerCase()!==Be.toLowerCase())return!1}
      if(smartDateFilter && smartDateFilter.preset && smartDateFilter.preset !== "ALL"){
        let dateVal = null;
        if(smartDateFilter.targetField === "calDate"){
          dateVal = ce.calDate || ce.lastCalDate || ce.cal_date || ce.last_cal_date;
        } else if(smartDateFilter.targetField === "registerDate"){
          dateVal = ce.registerDate || ce.register_date || ce.acceptanceDate;
        } else {
          dateVal = ce.dueDate || ce.next_due_date || ce.nextDueDate || ce.due_date || ce.dueYear;
        }
        if(!matchesSmartDateFilter(dateVal, smartDateFilter, ce)){
          return false;
        }
      }
      return!(E.trim()&&!ut.has(ce.id))'''

if target_filter_end in code:
    code = code.replace(target_filter_end, replacement_filter_end, 1)
    print("2. Successfully injected smart date filtering inside ir")
else:
    print("Error: target_filter_end not found")
    sys.exit(1)

# 3. Update ir dependency array
target_ir_deps = '[activeSourceList,g,I,K,E,ut,T,pe,G,getInstrumentStatus]'
replacement_ir_deps = '[activeSourceList,g,I,K,E,ut,T,pe,G,getInstrumentStatus,smartDateFilter]'
if target_ir_deps in code:
    code = code.replace(target_ir_deps, replacement_ir_deps, 1)
    print("3. Successfully updated ir dependency array")
else:
    print("Error: target_ir_deps not found")
    sys.exit(1)

# 4. Update $i and kl
target_dollar_i = '$i=E!==""||g!=="all"||I||Object.keys(K).length>0'
replacement_dollar_i = '$i=E!==""||g!=="all"||I||Object.keys(K).length>0||(smartDateFilter&&smartDateFilter.preset!=="ALL")'
if target_dollar_i in code:
    code = code.replace(target_dollar_i, replacement_dollar_i, 1)
    print("4. Successfully updated $i for active filter detection")
else:
    print("Error: target_dollar_i not found")
    sys.exit(1)

target_kl = 'kl=()=>{w(""),X({}),N("all"),P(!1),je(1),F(null)}'
replacement_kl = 'kl=()=>{w(""),X({}),N("all"),P(!1),je(1),F(null),window.qapResetSmartDateFilter&&window.qapResetSmartDateFilter()}'
if target_kl in code:
    code = code.replace(target_kl, replacement_kl, 1)
    print("5. Successfully updated kl clear function")
else:
    print("Error: target_kl not found")
    sys.exit(1)

# 6. Add active filter badge tag in InstrumentTable toolbar if smartDateFilter is active
target_table_toolbar = 'm.jsxDEV(K3e,{instruments:e,searchTerm:E,onSearchChange:j=>{w(j),je(1)},searchScope:k,onScopeChange:_,sortByRelevance:T,onToggleSortByRelevance:C,onSelectInstrument:Tr,onViewDetail:f,onPrintCert:u,onEdit:t},void 0,!1,{fileName:"/app/applet/src/components/InstrumentTable.tsx",lineNumber:862,columnNumber:15},void 0)},void 0,!1,{fileName:"/app/applet/src/components/InstrumentTable.tsx",lineNumber:861,columnNumber:13},void 0),'
replacement_table_toolbar = target_table_toolbar + '''(smartDateFilter && smartDateFilter.preset !== "ALL" && m.jsxDEV("div", {
  className: "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-950/70 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-xs font-bold shrink-0 animate-in fade-in",
  children: [
    m.jsxDEV("span", { children: "📅 " + smartDateFilter.label }),
    m.jsxDEV("span", { className: "px-1.5 py-0.2 rounded-full bg-blue-600 text-white text-[10px] font-mono", children: ir.length }),
    m.jsxDEV("button", {
      type: "button",
      onClick: () => window.qapResetSmartDateFilter && window.qapResetSmartDateFilter(),
      className: "ml-0.5 hover:bg-blue-200/60 dark:hover:bg-blue-900 rounded-full p-0.5 text-blue-500 hover:text-rose-600 cursor-pointer font-bold leading-none text-[11px]",
      title: "ล้างตัวกรองวันที่"
    }, "✕")
  ]
})),'''

if target_table_toolbar in code:
    code = code.replace(target_table_toolbar, replacement_table_toolbar, 1)
    print("6. Successfully added active date filter chip in InstrumentTable toolbar")
else:
    print("Error: target_table_toolbar not found")
    sys.exit(1)

# 7. Add currentHeaderInstruments in App component and replace global-dark-mode-toggle button
target_dark_button_start = 'm.jsxDEV("button",{id:"global-dark-mode-toggle",'
pos_btn = code.find(target_dark_button_start)
if pos_btn == -1:
    print("Error: target_dark_button_start not found")
    sys.exit(1)

pos_btn_end = code.find('{fileName:"/app/applet/src/App.tsx",lineNumber:423,columnNumber:15},this)', pos_btn)
if pos_btn_end == -1:
    print("Error: pos_btn_end not found")
    sys.exit(1)

full_dark_button = code[pos_btn:pos_btn_end + len('{fileName:"/app/applet/src/App.tsx",lineNumber:423,columnNumber:15},this)')]

replacement_dark_button = 'm.jsxDEV(QapSmartDateFilterWithThemeGroup,{isDark:r,onToggleDark:l,currentTab:e,instruments:e==="calibration_all"?c:e==="normal_standard"?nsInstruments:e==="centralized"?centInstruments:e==="each_section"?eachInstruments:e==="cancel"?cancelInstruments:c},void 0,!1,{fileName:"/app/applet/src/App.tsx",lineNumber:423,columnNumber:15},this)'

code = code[:pos_btn] + replacement_dark_button + code[pos_btn + len(full_dark_button):]
print("7. Successfully replaced global-dark-mode-toggle with grouped QapSmartDateFilterWithThemeGroup")

with open('app.js', 'w', encoding='utf-8') as f:
    f.write(code)

print("ALL UPDATES SUCCESSFULLY APPLIED TO app.js!")
