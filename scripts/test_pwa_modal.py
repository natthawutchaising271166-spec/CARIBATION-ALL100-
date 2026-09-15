code = """
function PwaInstallModal({ isOpen, onClose, onDirectInstall, canPrompt }) {
  if (!isOpen) return null;
  const h = React.createElement;
  
  return h("div", {
    className: "fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-xs transition-opacity animate-in fade-in duration-200",
    onClick: (e) => { if (e.target === e.currentTarget) onClose(); }
  },
    h("div", {
      className: "relative w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden p-6 text-slate-800 dark:text-slate-100"
    },
      // Header
      h("div", { className: "flex items-start justify-between pb-4 border-b border-slate-100 dark:border-slate-800" },
        h("div", { className: "flex items-center gap-3" },
          h("div", { className: "w-11 h-11 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md font-bold text-lg" },
            "QAP"
          ),
          h("div", null,
            h("h3", { className: "text-base font-bold text-slate-900 dark:text-white" }, "ติดตั้งแอปพลิเคชัน (PWA App)"),
            h("p", { className: "text-xs text-slate-500 dark:text-slate-400" }, "Carrier QAP Calibration Control System")
          )
        ),
        h("button", {
          onClick: onClose,
          className: "p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
        }, "✕")
      ),
      // Body
      h("div", { className: "py-4 space-y-4 text-xs" },
        h("div", { className: "p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 text-blue-900 dark:text-blue-200" },
          h("p", { className: "font-semibold mb-1 flex items-center gap-1.5" },
            h("span", null, "✨"),
            "ข้อดีของการติดตั้งเป็นแอปพลิเคชัน:"
          ),
          h("ul", { className: "list-disc list-inside space-y-0.5 text-[11px] opacity-90 pl-1" },
            h("li", null, "เปิดใช้งานได้ทันทีจาก Desktop / Start Menu หรือหน้าจอมือถือ"),
            h("li", null, "แสดงผลเต็มจอแบบ Standalone ไม่มีแถบ URL เบราว์เซอร์มาเกะกะ"),
            h("li", null, "ทำงานออฟไลน์และแคชข้อมูลอัตโนมัติ โหลดเร็วลื่นไหลทุกหน้า"),
            h("li", null, "เชื่อมต่อฐานข้อมูล Supabase Cloud อัตโนมัติทุกครั้งที่เปิดแอป")
          )
        ),
        h("div", { className: "space-y-3 pt-1" },
          h("div", { className: "font-bold text-slate-800 dark:text-slate-200 text-xs flex items-center gap-1.5" },
            h("span", { className: "w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px]" }, "1"),
            "วิธีที่ 1: ติดตั้งจากแถบลิ้งค์ (Address Bar ด้านบนสุด)"
          ),
          h("div", { className: "ml-6 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-[11px] text-slate-600 dark:text-slate-300 space-y-1" },
            h("p", null, "มองหาไอคอน ", h("strong", { className: "text-blue-600 dark:text-blue-400 font-bold" }, "[ 💻 ⬇ ]"), " หรือ ", h("strong", { className: "text-blue-600 dark:text-blue-400 font-bold" }, "[ ⊕ ติดตั้ง ]"), " ที่", h("span", { className: "underline font-semibold" }, "ปลายขวาสุดของช่องพิมพ์ URL (แถบลิ้งค์)"), " ใน Microsoft Edge หรือ Chrome"),
            h("p", null, "แล้วกดคลิกที่ไอคอนนั้น จากนั้นกดปุ่ม ", h("strong", { className: "text-emerald-600 dark:text-emerald-400 font-bold" }, "\"ติดตั้ง\" (Install)"))
          ),
          h("div", { className: "font-bold text-slate-800 dark:text-slate-200 text-xs flex items-center gap-1.5 pt-1" },
            h("span", { className: "w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px]" }, "2"),
            "วิธีที่ 2: ติดตั้งผ่านเมนูเบราว์เซอร์ (ปุ่ม 3 จุด ... มุมขวาบน)"
          ),
          h("div", { className: "ml-6 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-[11px] text-slate-600 dark:text-slate-300" },
            h("p", null, "คลิกเมนู ", h("strong", null, "3 จุด (...)"), " ของเบราว์เซอร์ ➔ เลือกเมนู ", h("strong", { className: "text-indigo-600 dark:text-indigo-400" }, "\"แอป\" (Apps)"), " ➔ คลิก ", h("strong", { className: "text-emerald-600 dark:text-emerald-400" }, "\"ติดตั้งไซต์นี้เป็นแอป\" (Install this site as an app)"))
          )
        )
      ),
      // Footer Actions
      h("div", { className: "pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2" },
        h("button", {
          onClick: onClose,
          className: "px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition cursor-pointer"
        }, "ปิด"),
        canPrompt && h("button", {
          onClick: () => { onDirectInstall(); onClose(); },
          className: "px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md transition cursor-pointer flex items-center gap-1.5"
        },
          h("span", null, "📲"),
          "กดติดตั้งทันที (Direct Install)"
        )
      )
    )
  );
}
"""
print("PwaInstallModal syntax check ok")
