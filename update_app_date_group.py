import re

with open('app.js', 'r', encoding='utf-8') as f:
    code = f.read()

# Let's write the QapSmartDateFilterWithThemeGroup component
component_code = '''
// =========================================================================
// QAP SMART DATE FILTER & THEME TOGGLE GROUP (ROUNDED CAPSULE DESIGN)
// ออกแบบเป็นกรุ๊ป โค้งมน สวยงาม วางข้างๆ โหมดมืด/สว่าง
// =========================================================================
function QapSmartDateFilterWithThemeGroup({ isDark, onToggleDark, currentTab, instruments = [] }) {
  const [filter, setFilter] = A.useState(() => {
    return window.qapActiveDateFilter || {
      preset: "ALL",
      targetField: "dueDate",
      from: "",
      to: "",
      label: "ทั้งหมด"
    };
  });
  const [isOpen, setIsOpen] = A.useState(false);
  const [customFrom, setCustomFrom] = A.useState(filter.from || "");
  const [customTo, setCustomTo] = A.useState(filter.to || "");
  const popoverRef = A.useRef(null);

  // Sync to window global and notify all subscribers
  const applyFilter = (newFilter) => {
    setFilter(newFilter);
    window.qapActiveDateFilter = newFilter;
    window.dispatchEvent(new CustomEvent("qap-date-filter-change", { detail: newFilter }));
  };

  A.useEffect(() => {
    window.qapResetSmartDateFilter = () => {
      const resetF = {
        preset: "ALL",
        targetField: filter.targetField || "dueDate",
        from: "",
        to: "",
        label: "ทั้งหมด"
      };
      setFilter(resetF);
      setCustomFrom("");
      setCustomTo("");
      window.qapActiveDateFilter = resetF;
      window.dispatchEvent(new CustomEvent("qap-date-filter-change", { detail: resetF }));
    };
  }, [filter.targetField]);

  // Click outside to close popover
  A.useEffect(() => {
    const onMouseDown = (e) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, []);

  // Compute live match count on current page
  const matchCount = A.useMemo(() => {
    if (!Array.isArray(instruments)) return 0;
    if (!filter || filter.preset === "ALL") return instruments.length;
    return instruments.filter(item => {
      let dateVal = null;
      if (filter.targetField === "calDate") {
        dateVal = item.calDate || item.lastCalDate || item.cal_date || item.last_cal_date;
      } else if (filter.targetField === "registerDate") {
        dateVal = item.registerDate || item.register_date || item.acceptanceDate;
      } else {
        dateVal = item.dueDate || item.next_due_date || item.nextDueDate || item.due_date || item.dueYear;
      }
      return matchesSmartDateFilter(dateVal, filter, item);
    }).length;
  }, [instruments, filter]);

  const hasActiveFilter = filter && filter.preset !== "ALL";

  const monthShorts = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
  const curMo = new Date().getMonth();
  const nextMo = (curMo + 1) % 12;

  const targetFieldLabel = filter.targetField === "calDate" ? "วันสอบเทียบ" : filter.targetField === "registerDate" ? "วันลงทะเบียน" : "วันครบกำหนด";

  return A.createElement("div", {
    id: "qap-header-smart-tools-group",
    className: "flex items-center bg-slate-100/90 dark:bg-slate-800/80 p-0.5 rounded-full border border-slate-200/90 dark:border-slate-700/80 shadow-2xs gap-0.5 shrink-0"
  },
    // 1. SMART DATE FILTER BUTTON & POPOVER
    A.createElement("div", {
      ref: popoverRef,
      className: "relative"
    },
      A.createElement("button", {
        id: "global-smart-date-filter-toggle",
        type: "button",
        onClick: () => setIsOpen(prev => !prev),
        className: `inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition shadow-2xs active:scale-95 cursor-pointer select-none ${
          hasActiveFilter
            ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xs ring-1 ring-blue-400/50"
            : "bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-200 border border-slate-200/70 dark:border-slate-700/60"
        }`,
        title: "ตัวกรองวันที่อัจฉริยะ (Smart Date Filter)"
      },
        // Calendar Icon
        A.createElement("svg", {
          className: `w-3.5 h-3.5 shrink-0 ${hasActiveFilter ? "text-amber-300" : "text-blue-600 dark:text-blue-400"}`,
          fill: "none",
          stroke: "currentColor",
          viewBox: "0 0 24 24"
        },
          A.createElement("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" })
        ),
        A.createElement("span", { className: "text-[11px] font-bold whitespace-nowrap" },
          hasActiveFilter ? filter.label : "ฟิลเตอร์วันที่"
        ),
        hasActiveFilter && A.createElement("span", {
          className: "px-1.5 py-0.2 rounded-full bg-white/20 text-white text-[10px] font-mono font-black leading-none"
        }, matchCount),
        hasActiveFilter ? A.createElement("span", {
          role: "button",
          onClick: (ev) => {
            ev.stopPropagation();
            applyFilter({
              preset: "ALL",
              targetField: filter.targetField || "dueDate",
              from: "",
              to: "",
              label: "ทั้งหมด"
            });
            setCustomFrom("");
            setCustomTo("");
          },
          title: "ล้างตัวกรองวันที่ (แสดงทั้งหมด)",
          className: "ml-0.5 p-0.5 rounded-full hover:bg-white/25 text-white/90 hover:text-white transition text-[10px] leading-none cursor-pointer font-bold"
        }, "✕") : A.createElement("svg", {
          className: `w-3 h-3 text-slate-400 transition-transform duration-200 ${isOpen ? "rotate-180 text-blue-600" : ""}`,
          fill: "none",
          stroke: "currentColor",
          viewBox: "0 0 24 24"
        },
          A.createElement("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2.5", d: "M19 9l-7 7-7-7" })
        )
      ),

      // FLOATING SMART DATE FILTER POPOVER
      isOpen && A.createElement("div", {
        className: "absolute right-0 top-full mt-2 w-[340px] sm:w-[390px] bg-white dark:bg-[#0f172a] rounded-2xl shadow-2xl border border-slate-200/90 dark:border-slate-800 p-4 text-slate-800 dark:text-slate-100 z-50 select-none animate-in fade-in zoom-in-95 duration-150"
      },
        // Header
        A.createElement("div", { className: "flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-3" },
          A.createElement("div", { className: "flex items-center gap-2" },
            A.createElement("div", { className: "w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-sm" }, "📅"),
            A.createElement("div", null,
              A.createElement("div", { className: "text-xs font-black tracking-tight text-slate-900 dark:text-white uppercase" }, "ตัวกรองวันที่อัจฉริยะ"),
              A.createElement("div", { className: "text-[10px] text-slate-400 dark:text-slate-500 font-medium" }, "Smart Date Filter • " + targetFieldLabel)
            )
          ),
          hasActiveFilter && A.createElement("button", {
            type: "button",
            onClick: () => {
              applyFilter({
                preset: "ALL",
                targetField: filter.targetField || "dueDate",
                from: "",
                to: "",
                label: "ทั้งหมด"
              });
              setCustomFrom("");
              setCustomTo("");
            },
            className: "text-[11px] font-bold text-rose-500 hover:text-rose-600 dark:hover:text-rose-400 hover:underline cursor-pointer"
          }, "✕ ล้างตัวกรอง")
        ),

        // Section 1: Target Field
        A.createElement("div", { className: "mb-3" },
          A.createElement("div", { className: "text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1 flex items-center justify-between" },
            A.createElement("span", null, "1. ประเภทวันที่เป้าหมาย (Date Field):"),
            A.createElement("span", { className: "text-blue-600 dark:text-blue-400 font-bold" }, targetFieldLabel)
          ),
          A.createElement("div", { className: "grid grid-cols-3 gap-1 bg-slate-100 dark:bg-slate-800/80 p-0.5 rounded-xl border border-slate-200/80 dark:border-slate-700/80 text-center" },
            A.createElement("button", {
              type: "button",
              onClick: () => applyFilter({ ...filter, targetField: "dueDate" }),
              className: `py-1 text-[11px] font-bold rounded-lg transition cursor-pointer ${filter.targetField === "dueDate" ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-300 shadow-xs" : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"}`
            }, "🎯 วันครบกำหนด"),
            A.createElement("button", {
              type: "button",
              onClick: () => applyFilter({ ...filter, targetField: "calDate" }),
              className: `py-1 text-[11px] font-bold rounded-lg transition cursor-pointer ${filter.targetField === "calDate" ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-300 shadow-xs" : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"}`
            }, "🛠️ วันสอบเทียบ"),
            A.createElement("button", {
              type: "button",
              onClick: () => applyFilter({ ...filter, targetField: "registerDate" }),
              className: `py-1 text-[11px] font-bold rounded-lg transition cursor-pointer ${filter.targetField === "registerDate" ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-300 shadow-xs" : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"}`
            }, "📝 วันลงทะเบียน")
          )
        ),

        // Section 2: Quick Presets
        A.createElement("div", { className: "mb-3" },
          A.createElement("div", { className: "text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5" }, "2. ทางลัดด่วนอัจฉริยะ (Smart Presets):"),
          A.createElement("div", { className: "flex flex-wrap gap-1.5" },
            [
              { key: "ALL", label: "🌐 ทั้งหมด", fullLabel: "ทั้งหมด" },
              { key: "OVERDUE", label: "⚠️ เกินกำหนด", fullLabel: "⚠️ เกินกำหนด" },
              { key: "DAYS_30", label: "⚡ 30 วัน", fullLabel: "⚡ 30 วันข้างหน้า" },
              { key: "DAYS_60", label: "⚡ 60 วัน", fullLabel: "⚡ 60 วันข้างหน้า" },
              { key: "DAYS_90", label: "⚡ 90 วัน", fullLabel: "⚡ 90 วันข้างหน้า" },
              { key: "THIS_MONTH", label: `📅 เดือนนี้ (${monthShorts[curMo]})`, fullLabel: `เดือนนี้ (${monthShorts[curMo]})` },
              { key: "NEXT_MONTH", label: `⏭️ เดือนหน้า (${monthShorts[nextMo]})`, fullLabel: `เดือนหน้า (${monthShorts[nextMo]})` },
              { key: "YEAR_2026", label: "🌟 ปี 2026", fullLabel: "ปี 2026" },
              { key: "YEAR_2025", label: "⏳ ปี 2025", fullLabel: "ปี 2025" }
            ].map(p => {
              const isSelected = filter.preset === p.key;
              return A.createElement("button", {
                key: p.key,
                type: "button",
                onClick: () => {
                  applyFilter({
                    preset: p.key,
                    targetField: filter.targetField || "dueDate",
                    from: "",
                    to: "",
                    label: p.fullLabel
                  });
                  setCustomFrom("");
                  setCustomTo("");
                },
                className: `px-2.5 py-1 rounded-full text-[11px] font-bold transition cursor-pointer ${
                  isSelected
                    ? "bg-blue-600 text-white shadow-xs ring-1 ring-blue-400"
                    : "bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
                }`
              }, p.label);
            })
          )
        ),

        // Section 3: Month Quick Grid
        A.createElement("div", { className: "mb-3" },
          A.createElement("div", { className: "text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5" }, "3. เลือกดูตามเดือน (Month Filter):"),
          A.createElement("div", { className: "grid grid-cols-6 gap-1" },
            monthShorts.map((moName, idx) => {
              const isSelected = filter.preset === `MONTH_${idx}`;
              return A.createElement("button", {
                key: `mo_${idx}`,
                type: "button",
                onClick: () => {
                  applyFilter({
                    preset: `MONTH_${idx}`,
                    targetField: filter.targetField || "dueDate",
                    from: "",
                    to: "",
                    label: `เดือน ${moName}`
                  });
                  setCustomFrom("");
                  setCustomTo("");
                },
                className: `py-1 text-[10.5px] font-bold rounded-lg transition text-center cursor-pointer ${
                  isSelected
                    ? "bg-blue-600 text-white shadow-xs font-black"
                    : idx === curMo
                    ? "bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
                    : "bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
                }`
              }, moName);
            })
          )
        ),

        // Section 4: Custom Date Range
        A.createElement("div", { className: "mb-3 pt-2.5 border-t border-slate-100 dark:border-slate-800" },
          A.createElement("div", { className: "text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5" }, "4. กำหนดช่วงวันที่เอง (Custom Range):"),
          A.createElement("div", { className: "grid grid-cols-2 gap-2 mb-2" },
            A.createElement("div", null,
              A.createElement("label", { className: "text-[9px] font-bold text-slate-400 block mb-0.5" }, "วันที่เริ่มต้น (From):"),
              A.createElement("input", {
                type: "date",
                value: customFrom,
                onChange: (e) => setCustomFrom(e.target.value),
                className: "w-full text-xs px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono text-slate-800 dark:text-slate-100"
              })
            ),
            A.createElement("div", null,
              A.createElement("label", { className: "text-[9px] font-bold text-slate-400 block mb-0.5" }, "วันที่สิ้นสุด (To):"),
              A.createElement("input", {
                type: "date",
                value: customTo,
                onChange: (e) => setCustomTo(e.target.value),
                className: "w-full text-xs px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono text-slate-800 dark:text-slate-100"
              })
            )
          ),
          (customFrom || customTo) && A.createElement("button", {
            type: "button",
            onClick: () => {
              applyFilter({
                preset: "CUSTOM",
                targetField: filter.targetField || "dueDate",
                from: customFrom,
                to: customTo,
                label: `ช่วง ${customFrom || "เริ่มต้น"} ถึง ${customTo || "สิ้นสุด"}`
              });
            },
            className: "w-full py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition cursor-pointer"
          }, "✓ นำช่วงวันที่ไปใช้ (Apply Range)")
        ),

        // Footer
        A.createElement("div", { className: "pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between" },
          A.createElement("div", { className: "text-[11px] font-medium text-slate-500 dark:text-slate-400" },
            "พบ ",
            A.createElement("span", { className: "font-mono font-bold text-blue-600 dark:text-blue-400" }, matchCount),
            " รายการ"
          ),
          A.createElement("button", {
            type: "button",
            onClick: () => setIsOpen(false),
            className: "px-3.5 py-1 rounded-full bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs transition cursor-pointer"
          }, "ปิด")
        )
      )
    ),

    // 2. SLEEK DIVIDER
    A.createElement("div", {
      className: "w-px h-3.5 bg-slate-300/80 dark:bg-slate-700/80 mx-0.5 shrink-0"
    }),

    // 3. DARK / LIGHT MODE BUTTON (เดิม แต่จัดเข้ากลุ่มโค้งมน สวยงาม)
    A.createElement("button", {
      id: "global-dark-mode-toggle",
      onClick: onToggleDark,
      className: `inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition shadow-2xs active:scale-95 cursor-pointer ${
        isDark
          ? "bg-slate-800 hover:bg-slate-700 text-amber-300 ring-1 ring-amber-400/30"
          : "bg-white hover:bg-slate-50 text-slate-700"
      }`,
      title: isDark ? "คลิกเพื่อสลับเป็นโหมดสว่าง (Light Mode)" : "คลิกเพื่อสลับเป็นโหมดมืด (Dark Mode)"
    },
      isDark ? A.createElement(m.Fragment, null,
        A.createElement(WX, { className: "w-3.5 h-3.5 text-amber-400" }),
        A.createElement("span", { className: "text-[11px] font-semibold" }, "โหมดมืด ON")
      ) : A.createElement(m.Fragment, null,
        A.createElement(DX, { className: "w-3.5 h-3.5 text-slate-600" }),
        A.createElement("span", { className: "text-[11px] font-semibold" }, "โหมดมืด")
      )
    )
  );
}
'''

# Insert QapSmartDateFilterWithThemeGroup right before aSe function (App component)
pos_app = code.find('function aSe(){')
if pos_app == -1:
    print("Error: function aSe(){ not found")
    exit(1)

code = code[:pos_app] + component_code + '\n' + code[pos_app:]
print("Inserted QapSmartDateFilterWithThemeGroup before aSe")

with open('app.js', 'w', encoding='utf-8') as f:
    f.write(code)
print("Saved component definition")
