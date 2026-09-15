import re

with open("supabaseClient.js", "r", encoding="utf-8") as f:
    content = f.read()

# Replace header and loadConfig to support embedded credentials
old_start = """(function () {
  const CONFIG_STORAGE_KEY = "QAP_SUPABASE_CONFIG_V2";"""

new_start = """(function () {
  // =========================================================================
  // ⚡ จุดฝังการเชื่อมต่อฐานข้อมูล SUPABASE ถาวร (EMBEDDED DATABASE CONFIG)
  // เมื่อใส่ค่า URL และ Key ที่นี่ เมื่อเปิดโปรเจกต์ระบบจะดึงข้อมูลล่าสุดจาก Cloud อัตโนมัติทันที
  // ไม่ต้องคอยกรอกหรือตั้งค่าเองใหม่อีกต่อไป
  // =========================================================================
  const EMBEDDED_SUPABASE_CONFIG = {
    // 1. Supabase Project URL (ตัวอย่าง: "https://your-project-id.supabase.co")
    url: (typeof window !== "undefined" && window.__QAP_SUPABASE_URL) || "",
    
    // 2. Supabase Anon Public Key (ตัวอย่าง: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...")
    anonKey: (typeof window !== "undefined" && window.__QAP_SUPABASE_ANON_KEY) || "",
    
    // ซิงก์เรียลไทม์อัตโนมัติ
    autoSync: true,
  };

  const CONFIG_STORAGE_KEY = "QAP_SUPABASE_CONFIG_V2";"""

content = content.replace(old_start, new_start, 1)

# Now update loadConfig
idx_load = content.find("function loadConfig() {")
idx_end_load = content.find("let config = loadConfig();", idx_load)

new_load_func = """function loadConfig() {
    const embeddedUrl = (EMBEDDED_SUPABASE_CONFIG.url || (typeof window !== "undefined" && window.__QAP_SUPABASE_URL) || "").trim().replace(/\\/+$/, "");
    const embeddedKey = (EMBEDDED_SUPABASE_CONFIG.anonKey || (typeof window !== "undefined" && window.__QAP_SUPABASE_ANON_KEY) || "").trim();

    try {
      const stored = localStorage.getItem(CONFIG_STORAGE_KEY) || localStorage.getItem("QAP_SUPABASE_CONFIG_V1");
      if (stored) {
        const parsed = JSON.parse(stored);
        const effectiveUrl = (parsed.url || embeddedUrl || "").trim().replace(/\\/+$/, "");
        const effectiveKey = (parsed.anonKey || embeddedKey || "").trim();
        return {
          url: effectiveUrl,
          anonKey: effectiveKey,
          autoSync: parsed.autoSync !== false,
          lastSync: parsed.lastSync || null,
          status: parsed.status || (effectiveUrl && effectiveKey ? "connected" : "disconnected"),
          tables: PAGE_TABLES,
        };
      }
    } catch (e) {
      console.warn("[Supabase] Failed to parse stored config", e);
    }

    return {
      url: embeddedUrl,
      anonKey: embeddedKey,
      autoSync: true,
      lastSync: null,
      status: embeddedUrl && embeddedKey ? "connected" : "disconnected",
      tables: PAGE_TABLES,
    };
  }

  """

content = content[:idx_load] + new_load_func + content[idx_end_load:]

# Add getEmbeddedConfig to window.qapSupabase exports
idx_exports = content.find("window.qapSupabase = {")
if idx_exports != -1:
    content = content.replace("window.qapSupabase = {", "window.qapSupabase = {\n    getEmbeddedConfig: () => ({ ...EMBEDDED_SUPABASE_CONFIG }),\n    isEmbedded: () => Boolean(EMBEDDED_SUPABASE_CONFIG.url && EMBEDDED_SUPABASE_CONFIG.anonKey),", 1)

with open("supabaseClient.js", "w", encoding="utf-8") as f:
    f.write(content)

print("Updated supabaseClient.js with embedded configuration support")
