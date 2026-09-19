import re

with open("app.js", "r") as f:
    text = f.read()

start_marker = r"    // =========================================================================\n    // ROW 1: 6 TOP KPI METRIC CARDS"
end_marker = r"    // =========================================================================\n    // ROW 2: 3-COLUMN MAIN WORKSPACE"

m = re.search(start_marker + r".*?" + end_marker, text, re.DOTALL)
if not m:
    print("Could not find ROW 1 block")
    exit(1)

new_kpi_code = """    // =========================================================================
    // ROW 1: 6 TOP KPI METRIC CARDS (Executive, Beautiful & Comprehensive)
    // =========================================================================
    h("div", {
      className: "shrink-0 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-2.5"
    },
      // Card 1: เครื่องมือทั้งหมด
      h("div", {
        onClick: () => goToTable("ALL"),
        className: "top-kpi-card bg-white dark:bg-slate-900/90 rounded-2xl p-2.5 sm:p-3 flex flex-col justify-between relative group cursor-pointer border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md hover:border-blue-400/60 dark:hover:border-blue-500/50 transition-all duration-300 overflow-hidden"
      },
        h("div", { className: "absolute -right-6 -top-6 w-16 h-16 bg-blue-500/10 dark:bg-blue-400/10 rounded-full blur-xl pointer-events-none group-hover:bg-blue-500/20 transition-all duration-500" }),
        h("div", { className: "flex items-center justify-between mb-1 relative z-10" },
          h("div", { className: "flex items-center gap-1.5 min-w-0" },
            h("span", { className: "w-2 h-2 rounded-full bg-blue-500 shadow-xs ring-2 ring-blue-500/20 shrink-0" }),
            h("span", { className: "text-[11px] font-black text-slate-700 dark:text-slate-200 truncate" }, "เครื่องมือทั้งหมด")
          ),
          h("div", { className: "w-6 h-6 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform shadow-2xs" },
            h("svg", { className: "w-3.5 h-3.5", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24" },
              h("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" })
            )
          )
        ),
        h("div", { className: "my-1 flex items-baseline justify-between relative z-10" },
          h("div", { className: "flex items-baseline gap-1" },
            h("span", { className: "top-kpi-val dashboard-number-animate text-xl sm:text-2xl font-black font-mono text-slate-900 dark:text-white tracking-tight leading-none" },
              getAnimVal(stats.allCount).toLocaleString()
            ),
            h("span", { className: "text-[10px] text-slate-400 font-semibold" }, "รายการ")
          ),
          h("span", { className: "text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/60 font-mono shadow-2xs" },
            "100%"
          )
        ),
        h("div", { className: "w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1 my-1 overflow-hidden" },
          h("div", { className: "bg-blue-500 h-full rounded-full transition-all duration-700", style: { width: "100%" } })
        ),
        h("div", { className: "text-[10px] font-semibold text-blue-600 dark:text-blue-400 truncate flex items-center gap-1 mt-0.5" },
          h("span", { className: "text-[8px] opacity-75" }, "●"),
          "ทะเบียน QAP Master"
        )
      ),

      // Card 2: พร้อมใช้งาน (IN-SPEC)
      h("div", {
        onClick: () => goToTable("NORMAL"),
        className: "top-kpi-card bg-white dark:bg-slate-900/90 rounded-2xl p-2.5 sm:p-3 flex flex-col justify-between relative group cursor-pointer border border-emerald-200/80 dark:border-emerald-950/60 shadow-xs hover:shadow-md hover:border-emerald-400 dark:hover:border-emerald-500 transition-all duration-300 overflow-hidden"
      },
        h("div", { className: "absolute -right-6 -top-6 w-16 h-16 bg-emerald-500/10 dark:bg-emerald-400/10 rounded-full blur-xl pointer-events-none group-hover:bg-emerald-500/20 transition-all duration-500" }),
        h("div", { className: "flex items-center justify-between mb-1 relative z-10" },
          h("div", { className: "flex items-center gap-1.5 min-w-0" },
            h("span", { className: "w-2 h-2 rounded-full bg-emerald-500 shadow-xs ring-2 ring-emerald-500/20 shrink-0" }),
            h("span", { className: "text-[11px] font-black text-emerald-900 dark:text-emerald-300 truncate" }, "พร้อมใช้งาน (IN-SPEC)")
          ),
          h("div", { className: "w-6 h-6 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform shadow-2xs" },
            h("svg", { className: "w-3.5 h-3.5", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24" },
              h("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2.5", d: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" })
            )
          )
        ),
        h("div", { className: "my-1 flex items-baseline justify-between relative z-10" },
          h("div", { className: "flex items-baseline gap-1" },
            h("span", { className: "top-kpi-val dashboard-number-animate text-xl sm:text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400 tracking-tight leading-none" },
              getAnimVal(stats.inSpec).toLocaleString()
            ),
            h("span", { className: "text-[10px] text-slate-400 font-semibold" }, "รายการ")
          ),
          h("span", { className: "text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200/70 dark:border-emerald-800/70 font-mono shadow-2xs" },
            `${stats.inSpecPct}%`
          )
        ),
        h("div", { className: "w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1 my-1 overflow-hidden" },
          h("div", { className: "bg-emerald-500 h-full rounded-full transition-all duration-700", style: { width: `${Math.min(100, stats.inSpecPct)}%` } })
        ),
        h("div", { className: "text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 truncate flex items-center gap-1 mt-0.5" },
          h("span", { className: "text-[8px] opacity-75" }, "●"),
          "ผ่านเกณฑ์มาตรฐาน"
        )
      ),

      // Card 3: ใกล้ครบกำหนด (≤30D)
      h("div", {
        onClick: () => goToTable("DUE_SOON"),
        className: "top-kpi-card bg-white dark:bg-slate-900/90 rounded-2xl p-2.5 sm:p-3 flex flex-col justify-between relative group cursor-pointer border border-amber-200/80 dark:border-amber-950/60 shadow-xs hover:shadow-md hover:border-amber-400 dark:hover:border-amber-500 transition-all duration-300 overflow-hidden"
      },
        h("div", { className: "absolute -right-6 -top-6 w-16 h-16 bg-amber-500/10 dark:bg-amber-400/10 rounded-full blur-xl pointer-events-none group-hover:bg-amber-500/20 transition-all duration-500" }),
        h("div", { className: "flex items-center justify-between mb-1 relative z-10" },
          h("div", { className: "flex items-center gap-1.5 min-w-0" },
            h("span", { className: "w-2 h-2 rounded-full bg-amber-500 shadow-xs ring-2 ring-amber-500/20 shrink-0" }),
            h("span", { className: "text-[11px] font-black text-amber-900 dark:text-amber-300 truncate" }, "ใกล้ครบกำหนด (≤30D)")
          ),
          h("div", { className: "w-6 h-6 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform shadow-2xs" },
            h("svg", { className: "w-3.5 h-3.5", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24" },
              h("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" })
            )
          )
        ),
        h("div", { className: "my-1 flex items-baseline justify-between relative z-10" },
          h("div", { className: "flex items-baseline gap-1" },
            h("span", { className: "top-kpi-val dashboard-number-animate text-xl sm:text-2xl font-black font-mono text-amber-600 dark:text-amber-400 tracking-tight leading-none" },
              getAnimVal(stats.dueSoon).toLocaleString()
            ),
            h("span", { className: "text-[10px] text-slate-400 font-semibold" }, "รายการ")
          ),
          h("span", { className: "text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200/70 dark:border-amber-800/70 font-mono shadow-2xs" },
            `${stats.dueSoonPct}%`
          )
        ),
        h("div", { className: "w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1 my-1 overflow-hidden" },
          h("div", { className: "bg-amber-500 h-full rounded-full transition-all duration-700", style: { width: `${Math.min(100, stats.dueSoonPct)}%` } })
        ),
        h("div", { className: "text-[10px] font-semibold text-amber-600 dark:text-amber-400 truncate flex items-center gap-1 mt-0.5" },
          h("span", { className: "text-[8px] opacity-75" }, "●"),
          "เตรียมส่งสอบเทียบ"
        )
      ),

      // Card 4: เกินกำหนด (OVERDUE)
      h("div", {
        onClick: () => goToTable("OVERDUE"),
        className: "top-kpi-card bg-white dark:bg-slate-900/90 rounded-2xl p-2.5 sm:p-3 flex flex-col justify-between relative group cursor-pointer border border-rose-300/90 dark:border-rose-900/70 shadow-xs hover:shadow-md hover:border-rose-500 dark:hover:border-rose-400 transition-all duration-300 overflow-hidden"
      },
        h("div", { className: "absolute -right-6 -top-6 w-16 h-16 bg-rose-500/10 dark:bg-rose-400/10 rounded-full blur-xl pointer-events-none group-hover:bg-rose-500/25 transition-all duration-500" }),
        h("div", { className: "flex items-center justify-between mb-1 relative z-10" },
          h("div", { className: "flex items-center gap-1.5 min-w-0" },
            h("span", { className: "w-2 h-2 rounded-full bg-rose-500 shadow-xs ring-2 ring-rose-500/20 animate-pulse shrink-0" }),
            h("span", { className: "text-[11px] font-black text-rose-900 dark:text-rose-300 truncate" }, "เกินกำหนด (OVERDUE)")
          ),
          h("div", { className: "w-6 h-6 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform shadow-2xs" },
            h("svg", { className: "w-3.5 h-3.5", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24" },
              h("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" })
            )
          )
        ),
        h("div", { className: "my-1 flex items-baseline justify-between relative z-10" },
          h("div", { className: "flex items-baseline gap-1" },
            h("span", { className: "top-kpi-val dashboard-number-animate text-xl sm:text-2xl font-black font-mono text-rose-600 dark:text-rose-400 tracking-tight leading-none" },
              getAnimVal(stats.overdue).toLocaleString()
            ),
            h("span", { className: "text-[10px] text-slate-400 font-semibold" }, "รายการ")
          ),
          h("span", { className: "text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200/70 dark:border-rose-800/70 font-mono shadow-2xs" },
            `${stats.overduePct}%`
          )
        ),
        h("div", { className: "w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1 my-1 overflow-hidden" },
          h("div", { className: "bg-rose-500 h-full rounded-full transition-all duration-700", style: { width: `${Math.min(100, stats.overduePct)}%` } })
        ),
        h("div", { className: "text-[10px] font-semibold text-rose-600 dark:text-rose-400 truncate flex items-center gap-1 mt-0.5" },
          h("span", { className: "text-[8px] opacity-75" }, "●"),
          "ห้ามใช้เด็ดขาด"
        )
      ),

      // Card 5: ส่งสอบเทียบ (IN LAB)
      h("div", {
        onClick: () => goToTable("IN_LAB"),
        className: "top-kpi-card bg-white dark:bg-slate-900/90 rounded-2xl p-2.5 sm:p-3 flex flex-col justify-between relative group cursor-pointer border border-sky-200/80 dark:border-sky-950/60 shadow-xs hover:shadow-md hover:border-sky-400 dark:hover:border-sky-500 transition-all duration-300 overflow-hidden"
      },
        h("div", { className: "absolute -right-6 -top-6 w-16 h-16 bg-sky-500/10 dark:bg-sky-400/10 rounded-full blur-xl pointer-events-none group-hover:bg-sky-500/20 transition-all duration-500" }),
        h("div", { className: "flex items-center justify-between mb-1 relative z-10" },
          h("div", { className: "flex items-center gap-1.5 min-w-0" },
            h("span", { className: "w-2 h-2 rounded-full bg-sky-500 shadow-xs ring-2 ring-sky-500/20 shrink-0" }),
            h("span", { className: "text-[11px] font-black text-slate-700 dark:text-slate-200 truncate" }, "ส่งสอบเทียบ (IN LAB)")
          ),
          h("div", { className: "w-6 h-6 rounded-lg bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform shadow-2xs" },
            h("svg", { className: "w-3.5 h-3.5", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24" },
              h("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" }),
              h("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M15 12a3 3 0 11-6 0 3 3 0 016 0z" })
            )
          )
        ),
        h("div", { className: "my-1 flex items-baseline justify-between relative z-10" },
          h("div", { className: "flex items-baseline gap-1" },
            h("span", { className: "top-kpi-val dashboard-number-animate text-xl sm:text-2xl font-black font-mono text-slate-800 dark:text-slate-100 tracking-tight leading-none" },
              getAnimVal(stats.inLab).toLocaleString()
            ),
            h("span", { className: "text-[10px] text-slate-400 font-semibold" }, "รายการ")
          ),
          h("span", { className: "text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-sky-50 dark:bg-sky-950/50 text-sky-700 dark:text-sky-300 border border-sky-200/70 dark:border-sky-800/70 font-mono shadow-2xs" },
            `${stats.inLabPct}%`
          )
        ),
        h("div", { className: "w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1 my-1 overflow-hidden" },
          h("div", { className: "bg-sky-500 h-full rounded-full transition-all duration-700", style: { width: `${Math.min(100, stats.inLabPct)}%` } })
        ),
        h("div", { className: "text-[10px] font-semibold text-slate-500 dark:text-slate-400 truncate flex items-center gap-1 mt-0.5" },
          h("span", { className: "text-[8px] opacity-75" }, "●"),
          "อยู่ระหว่างส่งแล็บ"
        )
      ),

      // Card 6: งดใช้ / จำหน่าย (CANCEL)
      h("div", {
        onClick: () => {
          if (onNavigateTab) onNavigateTab("cancel");
          else if (onNavigateToPage) onNavigateToPage("cancel");
        },
        className: "top-kpi-card bg-white dark:bg-slate-900/90 rounded-2xl p-2.5 sm:p-3 flex flex-col justify-between relative group cursor-pointer border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md hover:border-slate-400 dark:hover:border-slate-600 transition-all duration-300 overflow-hidden"
      },
        h("div", { className: "absolute -right-6 -top-6 w-16 h-16 bg-slate-500/10 dark:bg-slate-400/10 rounded-full blur-xl pointer-events-none group-hover:bg-slate-500/20 transition-all duration-500" }),
        h("div", { className: "flex items-center justify-between mb-1 relative z-10" },
          h("div", { className: "flex items-center gap-1.5 min-w-0" },
            h("span", { className: "w-2 h-2 rounded-full bg-slate-400 shadow-xs ring-2 ring-slate-400/20 shrink-0" }),
            h("span", { className: "text-[11px] font-black text-slate-700 dark:text-slate-200 truncate" }, "งดใช้ / จำหน่าย")
          ),
          h("div", { className: "w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform shadow-2xs" },
            h("svg", { className: "w-3.5 h-3.5", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24" },
              h("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" })
            )
          )
        ),
        h("div", { className: "my-1 flex items-baseline justify-between relative z-10" },
          h("div", { className: "flex items-baseline gap-1" },
            h("span", { className: "top-kpi-val dashboard-number-animate text-xl sm:text-2xl font-black font-mono text-slate-800 dark:text-slate-100 tracking-tight leading-none" },
              getAnimVal(stats.cancelCount).toLocaleString()
            ),
            h("span", { className: "text-[10px] text-slate-400 font-semibold" }, "รายการ")
          ),
          h("span", { className: "text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-mono shadow-2xs" },
            `${stats.cancelPct}%`
          )
        ),
        h("div", { className: "w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1 my-1 overflow-hidden" },
          h("div", { className: "bg-slate-400 dark:bg-slate-500 h-full rounded-full transition-all duration-700", style: { width: `${Math.min(100, stats.cancelPct)}%` } })
        ),
        h("div", { className: "text-[10px] font-semibold text-slate-500 dark:text-slate-400 truncate flex items-center gap-1 mt-0.5" },
          h("span", { className: "text-[8px] opacity-75" }, "●"),
          "สำรอง / รอจำหน่าย"
        )
      )
    ),
    // =========================================================================
    // ROW 2: 3-COLUMN MAIN WORKSPACE"""

text = text.replace(m.group(0), new_kpi_code)

with open("app.js", "w") as f:
    f.write(text)

print("Applied executive rich KPI cards!")
