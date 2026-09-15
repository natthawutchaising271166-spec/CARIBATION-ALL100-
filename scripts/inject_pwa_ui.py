with open("app.js", "r", encoding="utf-8") as f:
    text = f.read()

# 1. Define PwaInstallModal component
modal_code = """
function PwaInstallModal({ isOpen, onClose, onDirectInstall, canPrompt }) {
  if (!isOpen) return null;
  const h = A.createElement;
  
  return h("div", {
    className: "fixed inset-0 z-[999999] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xs transition-opacity animate-in fade-in duration-200",
    onClick: (e) => { if (e.target === e.currentTarget) onClose(); }
  },
    h("div", {
      className: "relative w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden p-6 text-slate-800 dark:text-slate-100"
    },
      // Header
      h("div", { className: "flex items-start justify-between pb-4 border-b border-slate-100 dark:border-slate-800" },
        h("div", { className: "flex items-center gap-3" },
          h("div", { className: "w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 flex items-center justify-center text-white shadow-lg font-black text-xl tracking-tight" },
            "QAP"
          ),
          h("div", null,
            h("div", { className: "flex items-center gap-2" },
              h("h3", { className: "text-base font-bold text-slate-900 dark:text-white" }, "ติดตั้งแอปพลิเคชัน (PWA)"),
              h("span", { className: "px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-800" }, "App Available")
            ),
            h("p", { className: "text-xs text-slate-500 dark:text-slate-400 mt-0.5" }, "Carrier QAP Calibration Control System")
          )
        ),
        h("button", {
          onClick: onClose,
          className: "p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
        }, "✕")
      ),
      // Body
      h("div", { className: "py-4 space-y-3.5 text-xs" },
        h("div", { className: "p-3.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 text-blue-900 dark:text-blue-200" },
          h("p", { className: "font-bold mb-1.5 flex items-center gap-1.5 text-xs" },
            h("span", null, "⚡"),
            "ทำไมควรติดตั้งเป็นแอปพลิเคชัน?"
          ),
          h("ul", { className: "list-disc list-inside space-y-1 text-[11px] opacity-90 pl-1" },
            h("li", null, "เปิดใช้งานได้ทันทีจาก Desktop / Start Menu โดยตรง"),
            h("li", null, "หน้าต่างแยกอิสระ (Standalone Window) ไม่มีแถบเบราว์เซอร์มาบังตาราง"),
            h("li", null, "แคชหน้าเว็บและตารางออฟไลน์ โหลดข้อมูลเร็วลื่นไหลทุกอุปกรณ์"),
            h("li", null, "ซิงก์ดึงข้อมูลจริงจาก Supabase Cloud อัตโนมัติทุกครั้งที่เปิด")
          )
        ),
        h("div", { className: "space-y-2.5 pt-1" },
          h("div", { className: "font-bold text-slate-800 dark:text-slate-200 text-xs flex items-center gap-2" },
            h("span", { className: "w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0" }, "1"),
            "วิธีที่ 1: ติดตั้งจากแถบลิ้งค์ (Address Bar ด้านบนสุดของเบราว์เซอร์)"
          ),
          h("div", { className: "ml-7 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-[11px] text-slate-600 dark:text-slate-300 space-y-1.5" },
            h("p", null, "มองหาไอคอน ", h("strong", { className: "text-blue-600 dark:text-blue-400 font-bold bg-blue-50 dark:bg-blue-900/40 px-1.5 py-0.5 rounded border border-blue-300 dark:border-blue-700" }, "[ 💻 ⬇ ] ติดตั้ง"), " หรือ ", h("strong", { className: "text-blue-600 dark:text-blue-400 font-bold bg-blue-50 dark:bg-blue-900/40 px-1.5 py-0.5 rounded border border-blue-300 dark:border-blue-700" }, "[ ⊕ ]"), " ที่", h("span", { className: "underline font-semibold" }, "ปลายขวาสุดของช่องพิมพ์ URL (แถบลิ้งค์)"), " ใน Microsoft Edge หรือ Google Chrome"),
            h("p", null, "คลิกที่ไอคอนนั้น แล้วกดปุ่ม ", h("strong", { className: "text-emerald-600 dark:text-emerald-400 font-bold" }, "\"ติดตั้ง\" (Install)"))
          ),
          h("div", { className: "font-bold text-slate-800 dark:text-slate-200 text-xs flex items-center gap-2 pt-1" },
            h("span", { className: "w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0" }, "2"),
            "วิธีที่ 2: ติดตั้งผ่านเมนูของเบราว์เซอร์ (ปุ่ม 3 จุด ... มุมขวาบน)"
          ),
          h("div", { className: "ml-7 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-[11px] text-slate-600 dark:text-slate-300" },
            h("p", null, "คลิกเมนู ", h("strong", null, "3 จุด (...)"), " ของเบราว์เซอร์ ➔ เลือก ", h("strong", { className: "text-indigo-600 dark:text-indigo-400" }, "\"แอป\" (Apps)"), " ➔ คลิก ", h("strong", { className: "text-emerald-600 dark:text-emerald-400 font-bold" }, "\"ติดตั้งไซต์นี้เป็นแอป\" (Install this site as an app)"))
          )
        )
      ),
      // Footer Actions
      h("div", { className: "pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between" },
        h("span", { className: "text-[11px] text-slate-400" }, "Carrier QAP Calibration v4.0 PWA"),
        h("div", { className: "flex items-center gap-2" },
          h("button", {
            onClick: onClose,
            className: "px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition cursor-pointer"
          }, "ปิด"),
          canPrompt && h("button", {
            onClick: () => { onDirectInstall(); onClose(); },
            className: "px-4 py-2 rounded-xl text-xs font-bold bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md transition cursor-pointer flex items-center gap-1.5 active:scale-95"
          },
            h("span", null, "📲"),
            "กดติดตั้งทันที (Direct Install)"
          )
        )
      )
    )
  );
}
"""

# Place PwaInstallModal before function aSe
idx_ase = text.find("function aSe(){")
text = text[:idx_ase] + modal_code + "\n" + text[idx_ase:]

# 2. Add PWA states inside aSe()
pwa_states = """  const [isPwaModalOpen, setIsPwaModalOpen] = A.useState(false);
  const [isPwaInstalled, setIsPwaInstalled] = A.useState(() => {
    if (typeof window === "undefined") return false;
    return Boolean(window.__isPwaInstalled || (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches));
  });
  const [canPromptPwa, setCanPromptPwa] = A.useState(() => {
    if (typeof window === "undefined") return false;
    return Boolean(window.__deferredPwaPrompt);
  });

  A.useEffect(() => {
    const handleInstallable = () => setCanPromptPwa(true);
    const handleInstalled = () => {
      setIsPwaInstalled(true);
      setCanPromptPwa(false);
    };
    window.addEventListener("qap-pwa-installable", handleInstallable);
    window.addEventListener("qap-pwa-installed", handleInstalled);
    return () => {
      window.removeEventListener("qap-pwa-installable", handleInstallable);
      window.removeEventListener("qap-pwa-installed", handleInstalled);
    };
  }, []);

  const handlePwaInstallAction = async () => {
    if (window.__triggerPwaInstall && window.__deferredPwaPrompt) {
      const res = await window.__triggerPwaInstall();
      if (res && res.installed) {
        setIsPwaInstalled(true);
        return;
      }
    }
    setIsPwaModalOpen(true);
  };
"""

target_state = "const [isSupabaseModalOpen, setIsSupabaseModalOpen] = A.useState(false);"
text = text.replace(target_state, target_state + "\n" + pwa_states, 1)

# 3. Add PWA Install button in Header before or next to global-dark-mode-toggle
target_btn = 'm.jsxDEV("button",{id:"global-dark-mode-toggle"'
pwa_btn = """!isPwaInstalled && m.jsxDEV("button", {
            id: "pwa-install-app-header-btn",
            onClick: handlePwaInstallAction,
            className: "inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-bold transition shadow-xs active:scale-95 bg-linear-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-800 text-white border-blue-400/40 cursor-pointer animate-pulse",
            title: "คลิกเพื่อติดตั้ง Carrier QAP Control เป็นแอปพลิเคชัน (หรือติดตั้งผ่านไอคอนบนแถบลิ้งค์)",
            children: [
              m.jsxDEV("svg", {
                className: "w-3.5 h-3.5",
                fill: "none",
                stroke: "currentColor",
                viewBox: "0 0 24 24",
                children: m.jsxDEV("path", {
                  strokeLinecap: "round",
                  strokeLinejoin: "round",
                  strokeWidth: "2",
                  d: "M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                }, void 0, !1, { fileName: "/app/applet/src/App.tsx" }, this)
              }, void 0, !1, { fileName: "/app/applet/src/App.tsx" }, this),
              m.jsxDEV("span", null, "📲 ติดตั้งแอป", void 0, !1, { fileName: "/app/applet/src/App.tsx" }, this)
            ]
          }, void 0, !0, { fileName: "/app/applet/src/App.tsx" }, this),
          """

text = text.replace(target_btn, pwa_btn + target_btn, 1)

# 4. Render PwaInstallModal inside aSe()
target_modal = "A.createElement(SupabaseModal,{"
pwa_modal_elem = "A.createElement(PwaInstallModal, { isOpen: isPwaModalOpen, onClose: () => setIsPwaModalOpen(false), onDirectInstall: handlePwaInstallAction, canPrompt: canPromptPwa }),\n"
text = text.replace(target_modal, pwa_modal_elem + target_modal, 1)

with open("app.js", "w", encoding="utf-8") as f:
    f.write(text)

print("Successfully injected PWA UI and modal into app.js")
