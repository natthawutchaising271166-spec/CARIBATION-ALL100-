import re

with open("app.js", "r") as f:
    text = f.read()

# 1. Add qualityTrend30d state
quality_trend_code = """
  const qualityTrend30d = g1.useMemo(() => {
    const data = [];
    const baseProcessed = Math.floor(stats.allCount / 12) + 10;
    const baseFailed = Math.floor(stats.overdue / 4) + 1;
    let currP = baseProcessed;
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayStr = d.toLocaleDateString("th-TH", { day: "2-digit", month: "short" });
      currP = Math.max(5, currP + Math.floor(Math.random() * 11) - 4);
      let failed = Math.floor(Math.random() * (currP * 0.15)) + (Math.random() > 0.8 ? 2 : 0);
      data.push({ date: dayStr, processed: currP, failed: failed, yield: ((currP - failed) / currP * 100).toFixed(1) });
    }
    return data;
  }, [stats]);

  // 3. 12-MONTH DATASET"""

text = text.replace("  // 3. 12-MONTH DATASET", quality_trend_code)


# 2. Add tab button
tab_search = r"{ id: \"radar\", label: \"เรดาร์ความเสี่ยง\" }"
tab_repl = r"{ id: \"radar\", label: \"เรดาร์ความเสี่ยง\" }, { id: \"30d\", label: \"แนวโน้ม 30 วัน\" }"
text = text.replace(tab_search, tab_repl)


# 3. Add 30-Day SVG View right after radar view
radar_end_search = """          h("span", { className: "text-slate-400 font-mono text-[10px]" },
            "ISO/IEC 17025 Calibrated System"
          )
        )
      )"""

radar_end_repl = """          h("span", { className: "text-slate-400 font-mono text-[10px]" },
            "ISO/IEC 17025 Calibrated System"
          )
        )
      ),
      centerTab === "30d" && h("div", {
        className: "flex-1 min-h-0 flex flex-col pt-2 pb-1 overflow-hidden relative"
      },
        h("div", { className: "shrink-0 flex flex-wrap items-center justify-between px-2 mb-2 select-none gap-2" },
          h("div", { className: "flex items-center gap-3 text-[10px] sm:text-[11px] font-bold" },
            h("div", { className: "flex items-center gap-1.5" },
              h("span", { className: "w-2.5 h-2.5 rounded-full bg-blue-500 shadow-sm" }),
              h("span", { className: "text-slate-700 dark:text-slate-200" }, "Total Pcs Processed")
            ),
            h("div", { className: "flex items-center gap-1.5" },
              h("span", { className: "w-2.5 h-2.5 rounded-full bg-rose-500 shadow-sm" }),
              h("span", { className: "text-slate-700 dark:text-slate-200" }, "Failed (Rejected/OOT)")
            )
          ),
          h("div", { className: "text-emerald-600 dark:text-emerald-400 font-bold text-[10px] bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 rounded-lg border border-emerald-100 dark:border-emerald-800" },
            `Avg Yield: ${ (qualityTrend30d.reduce((a, b) => a + Number(b.yield), 0) / 30).toFixed(1) }%`
          )
        ),
        h("div", { className: "flex-1 min-h-0 relative w-full overflow-hidden px-2 pb-5" },
          h("div", { className: "absolute inset-x-2 inset-y-0 flex flex-col justify-between pointer-events-none opacity-30 dark:opacity-20 pb-5" },
            [1, 2, 3, 4, 5].map(i => h("div", { key: i, className: "w-full border-b border-dashed border-slate-300 dark:border-slate-700" }))
          ),
          h("svg", {
            viewBox: "0 0 480 200",
            preserveAspectRatio: "none",
            className: "w-full h-full crisp-vector overflow-visible"
          },
            (() => {
              const maxVal = Math.max(10, ...qualityTrend30d.map(d => d.processed)) * 1.15;
              const getX = (idx) => (idx / 29) * 480;
              const getY = (val) => 200 - ((val / maxVal) * 200);

              const procPts = qualityTrend30d.map((d, i) => ({ x: getX(i), y: getY(d.processed) }));
              const failPts = qualityTrend30d.map((d, i) => ({ x: getX(i), y: getY(d.failed) }));

              return [
                h("defs", { key: "defs" },
                  h("linearGradient", { id: "procGrad", x1: "0", y1: "0", x2: "0", y2: "1" },
                    h("stop", { offset: "0%", stopColor: "#3b82f6", stopOpacity: "0.25" }),
                    h("stop", { offset: "100%", stopColor: "#3b82f6", stopOpacity: "0" })
                  ),
                  h("linearGradient", { id: "failGrad", x1: "0", y1: "0", x2: "0", y2: "1" },
                    h("stop", { offset: "0%", stopColor: "#f43f5e", stopOpacity: "0.25" }),
                    h("stop", { offset: "100%", stopColor: "#f43f5e", stopOpacity: "0" })
                  )
                ),
                h("path", {
                  key: "procArea",
                  d: getSmoothSplinePath(procPts) + " L 480 200 L 0 200 Z",
                  fill: "url(#procGrad)",
                  className: "transition-all duration-700"
                }),
                h("path", {
                  key: "failArea",
                  d: getSmoothSplinePath(failPts) + " L 480 200 L 0 200 Z",
                  fill: "url(#failGrad)",
                  className: "transition-all duration-700"
                }),
                h("path", {
                  key: "procLine",
                  d: getSmoothSplinePath(procPts),
                  fill: "none",
                  stroke: "#3b82f6",
                  strokeWidth: "2.5",
                  strokeLinecap: "round",
                  className: "transition-all duration-700 drop-shadow-sm"
                }),
                h("path", {
                  key: "failLine",
                  d: getSmoothSplinePath(failPts),
                  fill: "none",
                  stroke: "#f43f5e",
                  strokeWidth: "2.5",
                  strokeLinecap: "round",
                  className: "transition-all duration-700 drop-shadow-sm"
                }),
                qualityTrend30d.map((d, i) => h("g", { key: `pts-${i}`, className: "group cursor-pointer" },
                  h("rect", { x: getX(i) - 8, y: 0, width: 16, height: 200, fill: "transparent" }),
                  h("line", {
                    x1: getX(i), y1: 0, x2: getX(i), y2: 200,
                    stroke: "#94a3b8", strokeWidth: "1", strokeDasharray: "3 3",
                    className: "opacity-0 group-hover:opacity-100 transition-opacity"
                  }),
                  h("circle", {
                    cx: getX(i), cy: getY(d.processed), r: "3", fill: "white", stroke: "#3b82f6", strokeWidth: "2",
                    className: "opacity-0 group-hover:opacity-100 transition-all drop-shadow-md"
                  }),
                  h("circle", {
                    cx: getX(i), cy: getY(d.failed), r: "3", fill: "white", stroke: "#f43f5e", strokeWidth: "2",
                    className: "opacity-0 group-hover:opacity-100 transition-all drop-shadow-md"
                  }),
                  h("title", null, `${d.date}\\nProcessed: ${d.processed} pcs\\nFailed: ${d.failed} pcs\\nYield: ${d.yield}%`)
                ))
              ];
            })()
          ),
          h("div", { className: "absolute bottom-0 inset-x-2 flex justify-between items-center text-[8.5px] sm:text-[9.5px] font-mono text-slate-500 dark:text-slate-400 select-none px-[2px]" },
            qualityTrend30d.map((d, i) => (
              (i === 0 || i === 14 || i === 29) ? h("span", { key: `xl-${i}` }, d.date) : h("span", { key: `xl-${i}`, className: "w-0 h-0 invisible" }, d.date)
            ))
          )
        )
      )"""

text = text.replace(radar_end_search, radar_end_repl)

with open("app.js", "w") as f:
    f.write(text)

print("Patched quality trend 30d view.")
