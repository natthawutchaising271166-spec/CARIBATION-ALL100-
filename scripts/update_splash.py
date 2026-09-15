import sys
import re

with open('app.js', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Define AppLoadingSplash component
splash_component = '''
function AppLoadingSplash({ isVisible, isFadingOut, progress, statusText, totalLoaded }) {
  if (!isVisible) return null;
  return A.createElement("div", {
    id: "qap-app-loading-splash",
    className: "fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-[#070d1d] text-white transition-all duration-500 ease-out select-none " + (isFadingOut ? "opacity-0 pointer-events-none scale-105" : "opacity-100 scale-100")
  },
    // Background ambient lighting
    A.createElement("div", {
      className: "absolute inset-0 overflow-hidden pointer-events-none flex items-center justify-center"
    },
      A.createElement("div", {
        className: "w-[600px] h-[600px] rounded-full bg-blue-600/20 blur-[140px] animate-pulse"
      }),
      A.createElement("div", {
        className: "absolute w-[350px] h-[350px] rounded-full bg-emerald-500/15 blur-[100px]"
      })
    ),

    // Content Box
    A.createElement("div", {
      className: "relative z-10 flex flex-col items-center max-w-md w-full px-6 text-center"
    },
      // Logo Container with glowing ring
      A.createElement("div", {
        className: "relative mb-6 flex items-center justify-center"
      },
        A.createElement("div", {
          className: "absolute -inset-3 rounded-3xl bg-blue-500/25 blur-lg animate-pulse"
        }),
        A.createElement("div", {
          className: "relative px-6 py-4 rounded-2xl bg-slate-900/90 border border-blue-500/30 shadow-2xl backdrop-blur-xl"
        },
          A.createElement(X8, { width: 190, height: 78, primaryColor: "#00358e" })
        )
      ),

      // Titles
      A.createElement("div", { className: "space-y-1 mb-6" },
        A.createElement("h1", {
          className: "text-base font-black tracking-wider text-white uppercase flex items-center justify-center gap-2"
        },
          "QAP CALIBRATION CONTROL",
          A.createElement("span", {
            className: "px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-500/20 text-blue-300 border border-blue-400/30"
          }, "METROLOGY")
        ),
        A.createElement("p", {
          className: "text-xs text-slate-400 font-medium"
        }, "ระบบบริหารจัดการและควบคุมการสอบเทียบเครื่องมือวัด")
      ),

      // Loading Progress Box
      A.createElement("div", {
        className: "w-full space-y-3 bg-slate-900/80 p-4 rounded-2xl border border-slate-800/90 backdrop-blur-xl shadow-2xl"
      },
        A.createElement("div", { className: "flex items-center justify-between text-xs" },
          A.createElement("div", { className: "flex items-center gap-2 font-semibold text-slate-300 truncate" },
            A.createElement("span", { className: "inline-block w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" }),
            A.createElement("span", { className: "truncate text-[11px]" }, statusText)
          ),
          A.createElement("span", { className: "font-mono font-black text-emerald-400 shrink-0 ml-2 text-xs" }, String(progress) + "%")
        ),
        A.createElement("div", { className: "w-full h-2 rounded-full bg-slate-800 overflow-hidden relative" },
          A.createElement("div", {
            className: "h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-400 rounded-full transition-all duration-300 ease-out shadow-[0_0_12px_rgba(59,130,246,0.6)]",
            style: { width: String(progress) + "%" }
          })
        ),
        totalLoaded > 0 && A.createElement("div", {
          className: "flex items-center justify-center gap-1.5 text-[11px] text-slate-400 pt-1"
        },
          A.createElement("span", { className: "text-slate-500" }, "โหลดข้อมูลเครื่องมือวัดแล้ว:"),
          A.createElement("span", { className: "font-bold font-mono text-emerald-400" }, totalLoaded.toLocaleString()),
          A.createElement("span", { className: "text-slate-500" }, "รายการ")
        )
      ),

      // Footer
      A.createElement("div", {
        className: "mt-6 flex items-center gap-2 text-[11px] text-slate-500"
      },
        A.createElement("span", null, "⚡ Zero Dependency"),
        A.createElement("span", null, "•"),
        A.createElement("span", null, "Multi-Table Database")
      )
    )
  );
}
'''

# Find place right before function SupabaseModal
target_insert = 'function SupabaseModal({'
if target_insert in content:
    content = content.replace(target_insert, splash_component + '\n' + target_insert, 1)
    print('Inserted AppLoadingSplash component definition!')
else:
    print('ERROR: SupabaseModal not found')
    sys.exit(1)

# Now in the main App component, add splash state & startup effect
old_state_marker = 'const [isSupabaseModalOpen, setIsSupabaseModalOpen] = A.useState(false);'
new_state_additions = '''const [isSupabaseModalOpen, setIsSupabaseModalOpen] = A.useState(false);
  const [appInitializing, setAppInitializing] = A.useState(true);
  const [splashFadeOut, setSplashFadeOut] = A.useState(false);
  const [loadingProgress, setLoadingProgress] = A.useState(15);
  const [loadingStatusText, setLoadingStatusText] = A.useState("กำลังเชื่อมต่อฐานข้อมูลและเริ่มต้นระบบ...");
  const [loadedDbCount, setLoadedDbCount] = A.useState(0);'''

if old_state_marker in content:
    content = content.replace(old_state_marker, new_state_additions, 1)
    print('Added splash states to App component!')
else:
    print('ERROR: old_state_marker not found')
    sys.exit(1)

# Add startup database loading effect
startup_effect = '''
  A.useEffect(() => {
    let isMounted = true;
    const initDatabaseLoad = async () => {
      try {
        if (!isMounted) return;
        setLoadingProgress(25);
        setLoadingStatusText("กำลังตรวจสอบการเชื่อมต่อฐานข้อมูล...");
        
        const hasSupabase = window.qapSupabase && window.qapSupabase.isConfigured && window.qapSupabase.isConfigured();
        
        if (hasSupabase) {
          if (!isMounted) return;
          setLoadingProgress(45);
          setLoadingStatusText("กำลังดึงข้อมูลเครื่องมือวัดจาก Supabase Cloud (5 ตาราง)...");
          try {
            const res = await window.qapSupabase.pullAll();
            if (res && res.ok && res.data) {
              handleSupabasePullData(res.data);
              if (isMounted) {
                const count = (res.data.all?.length || 0) + (res.data.normalStandard?.length || 0) + (res.data.centralized?.length || 0) + (res.data.eachSection?.length || 0) + (res.data.cancel?.length || 0);
                setLoadedDbCount(count);
                setLoadingProgress(80);
                setLoadingStatusText("ดึงข้อมูลจากฐานข้อมูล Supabase สำเร็จ (" + count.toLocaleString() + " รายการ)");
              }
            }
          } catch (err) {
            console.warn("Supabase pull error on boot:", err);
          }
        } else {
          if (!isMounted) return;
          setLoadingProgress(55);
          setLoadingStatusText("กำลังโหลดข้อมูลเครื่องมือวัดจากฐานข้อมูลภายในระบบ...");
        }

        if (!isMounted) return;
        setLoadingProgress(95);
        setLoadingStatusText("กำลังจัดเตรียมระบบและแดชบอร์ด...");
        await new Promise(r => setTimeout(r, 600));

        if (!isMounted) return;
        setLoadingProgress(100);
        setLoadingStatusText("พร้อมใช้งาน");
        
        await new Promise(r => setTimeout(r, 400));
        if (isMounted) setSplashFadeOut(true);
        await new Promise(r => setTimeout(r, 500));
        if (isMounted) setAppInitializing(false);
      } catch (err) {
        console.error("Initialization error:", err);
        if (isMounted) {
          setSplashFadeOut(true);
          setTimeout(() => setAppInitializing(false), 500);
        }
      }
    };

    initDatabaseLoad();
    return () => { isMounted = false; };
  }, []);
'''

# Add startup effect right after handleSupabasePullData definition
handle_pull_marker = 'handleSupabasePullData = (data) => {'
idx_handle_pull = content.find(handle_pull_marker)
if idx_handle_pull != -1:
    end_of_handle_pull = content.find('  };', idx_handle_pull)
    if end_of_handle_pull != -1:
        insert_pos = end_of_handle_pull + 4
        content = content[:insert_pos] + startup_effect + content[insert_pos:]
        print('Added startup database loading effect!')
    else:
        print('ERROR: could not find end of handleSupabasePullData')
        sys.exit(1)
else:
    print('ERROR: handleSupabasePullData not found')
    sys.exit(1)

# Now render AppLoadingSplash inside the return of App
app_return_marker = 'A.createElement(SupabaseModal,'
idx_modal = content.find(app_return_marker)
if idx_modal != -1:
    total_inst_calc = 'c.length + nsInstruments.length + centInstruments.length + eachInstruments.length + cancelInstruments.length'
    render_splash = f'A.createElement(AppLoadingSplash, {{ isVisible: appInitializing, isFadingOut: splashFadeOut, progress: loadingProgress, statusText: loadingStatusText, totalLoaded: loadedDbCount || ({total_inst_calc}) }}),\n'
    content = content[:idx_modal] + render_splash + content[idx_modal:]
    print('Rendered AppLoadingSplash component in App!')
else:
    print('ERROR: SupabaseModal render not found')
    sys.exit(1)

with open('app.js', 'w', encoding='utf-8') as f:
    f.write(content)

print('app.js updated successfully!')
