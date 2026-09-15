import re

with open('supabaseClient.js', 'r', encoding='utf-8') as f:
    code = f.read()

# Enhance deleteAllInstruments and add upsertInstruments & pushSingleTable
old_delete_all = '''  // 7. Delete All for a specific page or all tables
  async function deleteAllInstruments(targetTab = "all") {
    if (!isConfigured() || !config.autoSync) return { ok: false, skipped: true };
    try {
      if (targetTab === "all") {
        for (const tbl of Object.values(PAGE_TABLES)) {
          await request(`/${tbl}?id=neq.dummy_nonexistent_xyz_record`, {
            method: "DELETE",
            headers: { Prefer: "return=minimal" },
          }).catch(() => {});
        }
        emitToast(`☁️ ล้างข้อมูลทั้ง 5 ตารางบน Supabase เรียบร้อย`, "info");
      } else {
        const tbl = getTableForPage(targetTab);
        await request(`/${tbl}?id=neq.dummy_nonexistent_xyz_record`, {
          method: "DELETE",
          headers: { Prefer: "return=minimal" },
        });
        emitToast(`☁️ ล้างข้อมูลตาราง ${tbl} บน Supabase เรียบร้อย`, "info");
      }
      saveConfig({ lastSync: new Date().toISOString(), status: "connected" });
      return { ok: true };
    } catch (err) {
      console.warn("[Supabase Sync] Delete all failed:", err);
      return { ok: false, error: err.message };
    }
  }'''

new_methods = '''  // 6.2 Upsert multiple instruments (Batch Upsert)
  async function upsertInstruments(items, tabType = "calibration_all") {
    if (!isConfigured() || !config.autoSync || !Array.isArray(items) || items.length === 0) {
      return { ok: false, skipped: true };
    }
    try {
      const targetTable = getTableForPage(tabType);
      const formatted = items.map((it) => formatRow(it, tabType)).filter(Boolean);
      const CHUNK_SIZE = 100;
      for (let i = 0; i < formatted.length; i += CHUNK_SIZE) {
        const chunk = formatted.slice(i, i + CHUNK_SIZE);
        await request(`/${targetTable}`, {
          method: "POST",
          headers: {
            Prefer: "resolution=merge-duplicates,return=minimal",
          },
          body: JSON.stringify(chunk),
        });
      }
      if (targetTable !== PAGE_TABLES.calibration_all) {
        for (let i = 0; i < formatted.length; i += CHUNK_SIZE) {
          const chunk = formatted.slice(i, i + CHUNK_SIZE);
          await request(`/${PAGE_TABLES.calibration_all}`, {
            method: "POST",
            headers: {
              Prefer: "resolution=merge-duplicates,return=minimal",
            },
            body: JSON.stringify(chunk),
          }).catch(() => {});
        }
      }
      saveConfig({ lastSync: new Date().toISOString(), status: "connected" });
      emitToast(`☁️ อัปเดตข้อมูล ${formatted.length} รายการลงตาราง ${targetTable} สำเร็จ`, "success");
      return { ok: true, count: formatted.length };
    } catch (err) {
      console.warn("[Supabase Sync] Batch upsert failed:", err);
      return { ok: false, error: err.message };
    }
  }

  // 6.3 Push single table (with optional replace or append)
  async function pushSingleTable(tabType, items, mode = "append") {
    if (!isConfigured() || !config.autoSync) return { ok: false, skipped: true };
    try {
      const targetTable = getTableForPage(tabType);
      if (mode === "replace") {
        await deleteAllInstruments(tabType);
      }
      const count = await pushToTable(targetTable, items, tabType);
      saveConfig({ lastSync: new Date().toISOString(), status: "connected" });
      emitToast(`☁️ นำเข้า ${count} รายการลงตาราง ${targetTable} บน Supabase เรียบร้อย`, "success");
      return { ok: true, count };
    } catch (err) {
      console.warn(`[Supabase Sync] Push single table failed:`, err);
      return { ok: false, error: err.message };
    }
  }

  // 7. Delete All for a specific page or all tables
  async function deleteAllInstruments(targetTab = "all") {
    if (!isConfigured() || !config.autoSync) return { ok: false, skipped: true };
    try {
      const clearTable = async (tbl) => {
        try {
          await request(`/${tbl}?or=(id.not.is.null,no.gte.0)`, {
            method: "DELETE",
            headers: { Prefer: "return=minimal" },
          });
        } catch (e1) {
          try {
            await request(`/${tbl}?id=neq._dummy_key_not_exist_`, {
              method: "DELETE",
              headers: { Prefer: "return=minimal" },
            });
          } catch (e2) {
            console.warn(`[Supabase Clear Table Error] ${tbl}:`, e2);
          }
        }
      };

      if (targetTab === "all") {
        for (const tbl of Object.values(PAGE_TABLES)) {
          await clearTable(tbl);
        }
        emitToast(`☁️ ล้างข้อมูลทั้ง 5 ตารางบน Supabase เรียบร้อยแล้ว`, "info");
      } else {
        const tbl = getTableForPage(targetTab);
        await clearTable(tbl);
        emitToast(`☁️ ล้างข้อมูลตาราง ${tbl} บน Supabase เรียบร้อยแล้ว`, "info");
      }
      saveConfig({ lastSync: new Date().toISOString(), status: "connected" });
      return { ok: true };
    } catch (err) {
      console.warn("[Supabase Sync] Delete all failed:", err);
      return { ok: false, error: err.message };
    }
  }'''

if old_delete_all in code:
    code = code.replace(old_delete_all, new_methods, 1)
    print("Replaced deleteAllInstruments and added batch methods")
else:
    print("Warning: old_delete_all not found verbatim, checking regex...")
    pattern = r'// 7\. Delete All for a specific page or all tables[\s\S]*?async function deleteAllInstruments\(targetTab = "all"\)\s*\{[\s\S]*?return \{ ok: true \};\s*\}\s*catch \(err\) \{\s*console\.warn\("\[Supabase Sync\] Delete all failed:", err\);\s*return \{ ok: false, error: err\.message \};\s*\}\s*\}'
    code = re.sub(pattern, new_methods, code, count=1)
    print("Replaced via regex")

# Export upsertInstruments and pushSingleTable in window.qapSupabase
old_export = 'deleteAllInstruments,\n    pullAll,\n    pushAll,'
new_export = 'deleteAllInstruments,\n    upsertInstruments,\n    pushSingleTable,\n    pullAll,\n    pushAll,'
if old_export in code:
    code = code.replace(old_export, new_export, 1)
    print("Updated window.qapSupabase exports")

with open('supabaseClient.js', 'w', encoding='utf-8') as f:
    f.write(code)

print("supabaseClient.js updated successfully")
