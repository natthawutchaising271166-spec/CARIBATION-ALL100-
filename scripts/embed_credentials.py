import re

supabase_url = "https://zndrzdhimcraolpsmfec.supabase.co"
supabase_key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpuZHJ6ZGhpbWNyYW9scHNtZmVjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk0Mzc4NzAsImV4cCI6MjEwNTAxMzg3MH0.Fry52efd6Ql1PEQBzduueZpFpTdqXDZhGfAyk8quvdM"

with open("supabaseClient.js", "r", encoding="utf-8") as f:
    code = f.read()

# Replace EMBEDDED_SUPABASE_CONFIG
embed_pattern = r"const EMBEDDED_SUPABASE_CONFIG = \{[\s\S]*?\};"

new_embed_config = f"""const EMBEDDED_SUPABASE_CONFIG = {{
    // 1. Supabase Project URL
    url: "{supabase_url}",
    
    // 2. Supabase Anon Public Key
    anonKey: "{supabase_key}",
    
    // ซิงก์เรียลไทม์อัตโนมัติ
    autoSync: true,
  }};"""

code = re.sub(embed_pattern, new_embed_config, code)

# Ensure loadConfig always favors the embedded config or valid credentials
old_load = """function loadConfig() {"""
idx_load = code.find(old_load)
idx_end_load = code.find("let config = loadConfig();", idx_load)

new_load = f"""function loadConfig() {{
    const embeddedUrl = "{supabase_url}";
    const embeddedKey = "{supabase_key}";

    try {{
      const stored = localStorage.getItem(CONFIG_STORAGE_KEY) || localStorage.getItem("QAP_SUPABASE_CONFIG_V1");
      if (stored) {{
        const parsed = JSON.parse(stored);
        // If stored config has valid URL and key, use it; otherwise fallback to embedded
        const effectiveUrl = (parsed.url && parsed.url.startsWith("http") ? parsed.url : embeddedUrl).trim().replace(/\\/+$/, "");
        const effectiveKey = (parsed.anonKey && parsed.anonKey.length > 20 ? parsed.anonKey : embeddedKey).trim();
        return {{
          url: effectiveUrl,
          anonKey: effectiveKey,
          autoSync: parsed.autoSync !== false,
          lastSync: parsed.lastSync || null,
          status: effectiveUrl && effectiveKey ? "connected" : "disconnected",
          tables: PAGE_TABLES,
        }};
      }}
    }} catch (e) {{
      console.warn("[Supabase] Failed to parse stored config", e);
    }}

    return {{
      url: embeddedUrl,
      anonKey: embeddedKey,
      autoSync: true,
      lastSync: null,
      status: "connected",
      tables: PAGE_TABLES,
    }};
  }}

  """

code = code[:idx_load] + new_load + code[idx_end_load:]

with open("supabaseClient.js", "w", encoding="utf-8") as f:
    f.write(code)

print("Successfully embedded Supabase credentials into supabaseClient.js")
