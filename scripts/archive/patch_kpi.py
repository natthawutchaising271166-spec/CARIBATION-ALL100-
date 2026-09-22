import re

with open("app.js", "r") as f:
    text = f.read()

# I will replace the entire ROW 1 block
start_marker = r"    // =========================================================================\n    // ROW 1: 6 TOP KPI METRIC CARDS"
end_marker = r"    // =========================================================================\n    // ROW 2: 3-COLUMN MAIN WORKSPACE"

m = re.search(start_marker + r".*?" + end_marker, text, re.DOTALL)
if not m:
    print("Could not find ROW 1 block")
    exit(1)

new_kpi_code = """    // =========================================================================
    // ROW 1: 6 TOP KPI METRIC CARDS (Upgraded & Compact)
    // =========================================================================
    h("div", {
      className: "shrink-0 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3"
    },
      // Card 1: เครื่องมือทั้งหมด
      h("div", {
        onClick: () => goToTable("ALL"),
        className: "top-kpi-card bg-white dark:bg-slate-900 rounded-xl p-3 flex flex-col justify-center relative group cursor-pointer border border-slate-200/80 dark:border-slate-800 shadow-sm hover:border-blue-400/50 dark:hover:border-blue-500/50 hover:shadow-md transition-all overflow-hidden"
      },
        h("div", { className: "absolute -right-4 -top-4 w-12 h-12 bg-blue-500/5 dark:bg-blue-400/5 rounded-full blur-xl pointer-events-none group-hover:bg-blue-500/10 transition-colors" }),
        h("div", { className: "flex items-center justify-between mb-1.5" },
          h("div", { className: "flex items-center gap-1.5" },
            h("div", { className: "w-1 h-3 rounded-full bg-blue-500" }),
            h("span", { className: "text-[10px] sm:text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-tight" }, "เครื่องมือทั้งหมด")
          ),
          h("div", { className: "text-blue-500/60 group-hover:text-blue-500 transition-colors" },
            h("svg", { className: "w-3.5 h-3.5", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24" },
              h("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" })
            )
          )
        ),
        h("div", { className: "flex items-baseline gap-2 relative z-10" },
          h("span", { className: "top-kpi-val dashboard-number-animate text-xl sm:text-2xl font-black font-mono text-slate-800 dark:text-white leading-none tracking-tighter" },
            getAnimVal(stats.allCount).toLocaleString()
          )
        )
      ),

      // Card 2: พร้อมใช้งาน (IN-SPEC)
      h("div", {
        onClick: () => goToTable("NORMAL"),
        className: "top-kpi-card bg-white dark:bg-slate-900 rounded-xl p-3 flex flex-col justify-center relative group cursor-pointer border border-slate-200/80 dark:border-slate-800 shadow-sm hover:border-emerald-400/50 dark:hover:border-emerald-500/50 hover:shadow-md transition-all overflow-hidden"
      },
        h("div", { className: "absolute -right-4 -top-4 w-12 h-12 bg-emerald-500/5 dark:bg-emerald-400/5 rounded-full blur-xl pointer-events-none group-hover:bg-emerald-500/10 transition-colors" }),
        h("div", { className: "flex items-center justify-between mb-1.5" },
          h("div", { className: "flex items-center gap-1.5" },
            h("div", { className: "w-1 h-3 rounded-full bg-emerald-500" }),
            h("span", { className: "text-[10px] sm:text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-tight" }, "พร้อมใช้งาน (IN-SPEC)")
          ),
          h("div", { className: "text-emerald-500/60 group-hover:text-emerald-500 transition-colors" },
            h("svg", { className: "w-3.5 h-3.5", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24" },
              h("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2.5", d: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" })
            )
          )
        ),
        h("div", { className: "flex items-baseline gap-2 relative z-10" },
          h("span", { className: "top-kpi-val dashboard-number-animate text-xl sm:text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400 leading-none tracking-tighter" },
            getAnimVal(stats.inSpec).toLocaleString()
          ),
          h("span", { className: "text-[9px] sm:text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 rounded-md border border-emerald-100 dark:border-emerald-800/60" },
            `${stats.inSpecPct}%`
          )
        )
      ),

      // Card 3: ใกล้ครบกำหนด (≤30D)
      h("div", {
        onClick: () => goToTable("DUE_SOON"),
        className: "top-kpi-card bg-white dark:bg-slate-900 rounded-xl p-3 flex flex-col justify-center relative group cursor-pointer border border-slate-200/80 dark:border-slate-800 shadow-sm hover:border-amber-400/50 dark:hover:border-amber-500/50 hover:shadow-md transition-all overflow-hidden"
      },
        h("div", { className: "absolute -right-4 -top-4 w-12 h-12 bg-amber-500/5 dark:bg-amber-400/5 rounded-full blur-xl pointer-events-none group-hover:bg-amber-500/10 transition-colors" }),
        h("div", { className: "flex items-center justify-between mb-1.5" },
          h("div", { className: "flex items-center gap-1.5" },
            h("div", { className: "w-1 h-3 rounded-full bg-amber-500" }),
            h("span", { className: "text-[10px] sm:text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-tight" }, "ใกล้ครบกำหนด (≤30D)")
          ),
          h("div", { className: "text-amber-500/60 group-hover:text-amber-500 transition-colors" },
            h("svg", { className: "w-3.5 h-3.5", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24" },
              h("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" })
            )
          )
        ),
        h("div", { className: "flex items-baseline gap-2 relative z-10" },
          h("span", { className: "top-kpi-val dashboard-number-animate text-xl sm:text-2xl font-black font-mono text-amber-600 dark:text-amber-400 leading-none tracking-tighter" },
            getAnimVal(stats.dueSoon).toLocaleString()
          )
        )
      ),

      // Card 4: เกินกำหนด (OVERDUE)
      h("div", {
        onClick: () => goToTable("OVERDUE"),
        className: "top-kpi-card bg-white dark:bg-slate-900 rounded-xl p-3 flex flex-col justify-center relative group cursor-pointer border border-rose-200 dark:border-rose-900/50 shadow-sm hover:border-rose-400 dark:hover:border-rose-500 hover:shadow-md transition-all overflow-hidden"
      },
        h("div", { className: "absolute -right-4 -top-4 w-12 h-12 bg-rose-500/5 dark:bg-rose-400/5 rounded-full blur-xl pointer-events-none group-hover:bg-rose-500/10 transition-colors" }),
        h("div", { className: "flex items-center justify-between mb-1.5" },
          h("div", { className: "flex items-center gap-1.5" },
            h("div", { className: "w-1 h-3 rounded-full bg-rose-500 animate-pulse" }),
            h("span", { className: "text-[10px] sm:text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-tight" }, "เกินกำหนด (OVERDUE)")
          ),
          h("div", { className: "text-rose-500/60 group-hover:text-rose-500 transition-colors" },
            h("svg", { className: "w-3.5 h-3.5", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24" },
              h("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" })
            )
          )
        ),
        h("div", { className: "flex items-baseline gap-2 relative z-10" },
          h("span", { className: "top-kpi-val dashboard-number-animate text-xl sm:text-2xl font-black font-mono text-rose-600 dark:text-rose-400 leading-none tracking-tighter" },
            getAnimVal(stats.overdue).toLocaleString()
          )
        )
      ),

      // Card 5: ส่งสอบเทียบ (IN LAB)
      h("div", {
        onClick: () => goToTable("IN_LAB"),
        className: "top-kpi-card bg-white dark:bg-slate-900 rounded-xl p-3 flex flex-col justify-center relative group cursor-pointer border border-slate-200/80 dark:border-slate-800 shadow-sm hover:border-sky-400/50 dark:hover:border-sky-500/50 hover:shadow-md transition-all overflow-hidden"
      },
        h("div", { className: "absolute -right-4 -top-4 w-12 h-12 bg-sky-500/5 dark:bg-sky-400/5 rounded-full blur-xl pointer-events-none group-hover:bg-sky-500/10 transition-colors" }),
        h("div", { className: "flex items-center justify-between mb-1.5" },
          h("div", { className: "flex items-center gap-1.5" },
            h("div", { className: "w-1 h-3 rounded-full bg-sky-500" }),
            h("span", { className: "text-[10px] sm:text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-tight" }, "ส่งสอบเทียบ (IN LAB)")
          ),
          h("div", { className: "text-sky-500/60 group-hover:text-sky-500 transition-colors" },
            h("svg", { className: "w-3.5 h-3.5", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24" },
              h("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" }),
              h("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M15 12a3 3 0 11-6 0 3 3 0 016 0z" })
            )
          )
        ),
        h("div", { className: "flex items-baseline gap-2 relative z-10" },
          h("span", { className: "top-kpi-val dashboard-number-animate text-xl sm:text-2xl font-black font-mono text-slate-800 dark:text-white leading-none tracking-tighter" },
            getAnimVal(stats.inLab).toLocaleString()
          )
        )
      ),

      // Card 6: งดใช้ / จำหน่าย (CANCEL)
      h("div", {
        onClick: () => {
          if (onNavigateTab) onNavigateTab("cancel");
          else if (onNavigateToPage) onNavigateToPage("cancel");
        },
        className: "top-kpi-card bg-white dark:bg-slate-900 rounded-xl p-3 flex flex-col justify-center relative group cursor-pointer border border-slate-200/80 dark:border-slate-800 shadow-sm hover:border-slate-400/50 dark:hover:border-slate-500/50 hover:shadow-md transition-all overflow-hidden"
      },
        h("div", { className: "absolute -right-4 -top-4 w-12 h-12 bg-slate-500/5 dark:bg-slate-400/5 rounded-full blur-xl pointer-events-none group-hover:bg-slate-500/10 transition-colors" }),
        h("div", { className: "flex items-center justify-between mb-1.5" },
          h("div", { className: "flex items-center gap-1.5" },
            h("div", { className: "w-1 h-3 rounded-full bg-slate-400" }),
            h("span", { className: "text-[10px] sm:text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-tight" }, "งดใช้ / จำหน่าย")
          ),
          h("div", { className: "text-slate-500/60 group-hover:text-slate-500 transition-colors" },
            h("svg", { className: "w-3.5 h-3.5", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24" },
              h("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" })
            )
          )
        ),
        h("div", { className: "flex items-baseline gap-2 relative z-10" },
          h("span", { className: "top-kpi-val dashboard-number-animate text-xl sm:text-2xl font-black font-mono text-slate-800 dark:text-white leading-none tracking-tighter" },
            getAnimVal(stats.cancelCount).toLocaleString()
          )
        )
      )
    ),
    // =========================================================================
    // ROW 2: 3-COLUMN MAIN WORKSPACE"""

text = text.replace(m.group(0), new_kpi_code)

with open("app.js", "w") as f:
    f.write(text)

print("Patched KPI cards.")
