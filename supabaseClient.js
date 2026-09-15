/**
 * Carrier QAP Calibration Control - Supabase Multi-Table Realtime Client
 * Architecture: Separate table per page (หน้าใครหน้ามัน)
 * 1. qap_calibration_all   (CALIBRATION ALL Master List)
 * 2. qap_normal_standard   (NORMAL STANDARD มาตรฐานทั่วไป)
 * 3. qap_centralized       (CENTRALIZED เครื่องมือวัดส่วนกลาง)
 * 4. qap_each_section      (EACH SECTION เครื่องมือวัดตามแผนก)
 * 5. qap_cancel            (CANCEL รายการที่ยกเลิก/จำหน่าย)
 */

(function () {
  // =========================================================================
  // ⚡ จุดฝังการเชื่อมต่อฐานข้อมูล SUPABASE ถาวร (EMBEDDED DATABASE CONFIG)
  // เมื่อใส่ค่า URL และ Key ที่นี่ เมื่อเปิดโปรเจกต์ระบบจะดึงข้อมูลล่าสุดจาก Cloud อัตโนมัติทันที
  // ไม่ต้องคอยกรอกหรือตั้งค่าเองใหม่อีกต่อไป
  // =========================================================================
  const EMBEDDED_SUPABASE_CONFIG = {
    // 1. Supabase Project URL
    url: "https://zndrzdhimcraolpsmfec.supabase.co",
    
    // 2. Supabase Anon Public Key
    anonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpuZHJ6ZGhpbWNyYW9scHNtZmVjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk0Mzc4NzAsImV4cCI6MjEwNTAxMzg3MH0.Fry52efd6Ql1PEQBzduueZpFpTdqXDZhGfAyk8quvdM",
    
    // ซิงก์เรียลไทม์อัตโนมัติ
    autoSync: true,
  };

  const CONFIG_STORAGE_KEY = "QAP_SUPABASE_CONFIG_V2";

  const PAGE_TABLES = {
    calibration_all: "qap_calibration_all",
    normal_standard: "qap_normal_standard",
    centralized: "qap_centralized",
    each_section: "qap_each_section",
    cancel: "qap_cancel",
  };

  const PAGE_NAMES = {
    calibration_all: "CALIBRATION ALL (Master List)",
    normal_standard: "NORMAL STANDARD (มาตรฐานทั่วไป)",
    centralized: "CENTRALIZED (ส่วนกลาง)",
    each_section: "EACH SECTION (ตามแผนก)",
    cancel: "CANCEL (ยกเลิก/จำหน่าย)",
  };

  // Pre-load stored config
  function loadConfig() {
    const embeddedUrl = "https://zndrzdhimcraolpsmfec.supabase.co";
    const embeddedKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpuZHJ6ZGhpbWNyYW9scHNtZmVjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk0Mzc4NzAsImV4cCI6MjEwNTAxMzg3MH0.Fry52efd6Ql1PEQBzduueZpFpTdqXDZhGfAyk8quvdM";

    try {
      const stored = localStorage.getItem(CONFIG_STORAGE_KEY) || localStorage.getItem("QAP_SUPABASE_CONFIG_V1");
      if (stored) {
        const parsed = JSON.parse(stored);
        // If stored config has valid URL and key, use it; otherwise fallback to embedded
        const isPlaceholderUrl = !parsed.url || parsed.url.includes("your-project-id");
        const isPlaceholderKey = !parsed.anonKey || parsed.anonKey.includes("...") || parsed.anonKey.length < 30;
        const effectiveUrl = (!isPlaceholderUrl && parsed.url.startsWith("http") ? parsed.url : embeddedUrl).trim().replace(/\/+$/, "");
        const effectiveKey = (!isPlaceholderKey ? parsed.anonKey : embeddedKey).trim();
        return {
          url: effectiveUrl,
          anonKey: effectiveKey,
          autoSync: parsed.autoSync !== false,
          lastSync: parsed.lastSync || null,
          status: effectiveUrl && effectiveKey ? "connected" : "disconnected",
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
      status: "connected",
      tables: PAGE_TABLES,
    };
  }

  let config = loadConfig();

  function saveConfig(newCfg) {
    config = { ...config, ...newCfg, tables: PAGE_TABLES };
    try {
      localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(config));
    } catch (e) {}
    emitStatus();
    return config;
  }

  function isConfigured() {
    return Boolean(config.url && config.anonKey && config.url.startsWith("http"));
  }

  function emitStatus(extra = {}) {
    try {
      window.dispatchEvent(
        new CustomEvent("qap-supabase-status", {
          detail: {
            ...config,
            isConfigured: isConfigured(),
            pageTables: PAGE_TABLES,
            ...extra,
          },
        })
      );
    } catch (e) {}
  }

  function emitToast(message, type = "info") {
    try {
      window.dispatchEvent(
        new CustomEvent("qap-supabase-toast", {
          detail: { message, type, time: Date.now() },
        })
      );
    } catch (e) {}
  }

  // Generate complete SQL script for all 5 separate tables
  function getSqlSetupScript() {
    const tableKeys = Object.keys(PAGE_TABLES);
    
    let sql = `-- ==========================================================
-- Carrier QAP Calibration Control - Supabase Database Schema
-- จัดเก็บแยกหน้าตามโปรเจกต์ (5 Tables: หน้าใครหน้ามัน)
-- Run this in Supabase SQL Editor (https://supabase.com)
-- ==========================================================

-- 1. ให้สิทธิ์การใช้งาน Schema public
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

`;

    tableKeys.forEach((key, idx) => {
      const tbl = PAGE_TABLES[key];
      const pageName = PAGE_NAMES[key];
      sql += `-- ----------------------------------------------------------
-- ตารางที่ ${idx + 1}: ${tbl} [หน้า ${pageName}]
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.${tbl} (
    id TEXT PRIMARY KEY,
    no INTEGER,
    code_no TEXT,
    instrument_name TEXT NOT NULL,
    serial_no TEXT,
    model TEXT,
    maker_name TEXT,
    category TEXT,
    tab_type TEXT DEFAULT '${key}',
    status TEXT DEFAULT 'in_spec',
    due_date TEXT,
    cal_date TEXT,
    section TEXT,
    sub_section TEXT,
    location TEXT,
    cert_no TEXT,
    accuracy TEXT,
    calibrated_by TEXT,
    notes TEXT,
    data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ให้สิทธิ์ Anon และ Authenticated สำหรับตาราง ${tbl}
GRANT ALL ON TABLE public.${tbl} TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;

-- เปิดใช้งาน Row Level Security (RLS)
ALTER TABLE public.${tbl} ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    DROP POLICY IF EXISTS "Allow public read" ON public.${tbl};
    DROP POLICY IF EXISTS "Allow public insert" ON public.${tbl};
    DROP POLICY IF EXISTS "Allow public update" ON public.${tbl};
    DROP POLICY IF EXISTS "Allow public delete" ON public.${tbl};
END $$;

CREATE POLICY "Allow public read" ON public.${tbl} FOR SELECT USING (true);
CREATE POLICY "Allow public insert" ON public.${tbl} FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update" ON public.${tbl} FOR UPDATE USING (true);
CREATE POLICY "Allow public delete" ON public.${tbl} FOR DELETE USING (true);

-- ดัชนีประสิทธิภาพสูงสำหรับตาราง ${tbl}
CREATE INDEX IF NOT EXISTS idx_${tbl}_code_no ON public.${tbl}(code_no);
CREATE INDEX IF NOT EXISTS idx_${tbl}_status ON public.${tbl}(status);
CREATE INDEX IF NOT EXISTS idx_${tbl}_due_date ON public.${tbl}(due_date);
CREATE INDEX IF NOT EXISTS idx_${tbl}_category ON public.${tbl}(category);

`;
    });

    sql += `-- ----------------------------------------------------------
-- ฟังก์ชัน Auto-Update Timestamp สำหรับทุกตาราง
-- ----------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

`;

    tableKeys.forEach((key) => {
      const tbl = PAGE_TABLES[key];
      sql += `DROP TRIGGER IF EXISTS tr_${tbl}_updated_at ON public.${tbl};
CREATE TRIGGER tr_${tbl}_updated_at
    BEFORE UPDATE ON public.${tbl}
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

`;
    });

    sql += `-- สั่งให้ PostgREST โหลด Schema Cache ใหม่ทันที
NOTIFY pgrst, 'reload schema';

-- ตรวจสอบความสมบูรณ์ของทั้ง 5 ตาราง
SELECT 'qap_calibration_all' AS table_name, count(*) AS count FROM public.qap_calibration_all
UNION ALL
SELECT 'qap_normal_standard', count(*) FROM public.qap_normal_standard
UNION ALL
SELECT 'qap_centralized', count(*) FROM public.qap_centralized
UNION ALL
SELECT 'qap_each_section', count(*) FROM public.qap_each_section
UNION ALL
SELECT 'qap_cancel', count(*) FROM public.qap_cancel;
`;

    return sql;
  }

  // Format local instrument into database row
  function formatRow(inst, tabType = "calibration_all") {
    if (!inst) return null;
    const id = String(inst.id || `inst_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`);
    return {
      id: id,
      no: Number(inst.no) || 0,
      code_no: String(inst.codeNo || "").trim(),
      instrument_name: String(inst.instrumentName || "Unnamed Instrument").trim(),
      serial_no: String(inst.serialNo || "").trim(),
      model: String(inst.model || "").trim(),
      maker_name: String(inst.makerName || "").trim(),
      category: String(inst.category || "").trim(),
      tab_type: String(tabType || inst.tabType || "calibration_all"),
      status: String(inst.status || "in_spec"),
      due_date: inst.dueDate ? String(inst.dueDate).trim() : null,
      cal_date: inst.calDate ? String(inst.calDate).trim() : null,
      section: String(inst.section || "").trim(),
      sub_section: String(inst.subSection || "").trim(),
      location: String(inst.location || "").trim(),
      cert_no: String(inst.certNo || "").trim(),
      accuracy: String(inst.accuracy || "").trim(),
      calibrated_by: String(inst.calibratedBy || "").trim(),
      notes: String(inst.notes || inst.remark || "").trim(),
      data: inst,
      updated_at: new Date().toISOString(),
    };
  }

  // Reconstitute local instrument from database row
  function parseRow(row, defaultTab = "calibration_all") {
    if (!row) return null;
    let base = {};
    if (row.data && typeof row.data === "object") {
      base = { ...row.data };
    }
    
    const getVal = (keys, fallback = "") => {
      for (const k of keys) {
        if (row[k] !== undefined && row[k] !== null && row[k] !== "") return row[k];
        if (base[k] !== undefined && base[k] !== null && base[k] !== "") return base[k];
      }
      return fallback;
    };

    const instName = getVal(["instrument_name", "Instrument Name", "Instrument_Name", "instrumentName", "Instrrument Name", "name", "Name", "INSTRUMENT_NAME"]);
    const codeNo = getVal(["code_no", "Code No.", "Code No", "codeNo", "Code_No", "code", "Code", "CODE_NO"]);
    const serialNo = getVal(["serial_no", "Serial No.", "Serial No", "serialNo", "Serial_No", "serial", "Serial", "SERIAL_NO"]);
    const model = getVal(["model", "Model", "model_no", "Model No.", "MODEL"]);
    const makerName = getVal(["maker_name", "Maker Name", "makerName", "Maker_Name", "maker", "Maker", "brand", "Brand", "MAKER_NAME"]);
    const category = getVal(["category", "Category", "CATEGORY"]);
    const status = getVal(["status", "Status", "STATUS"], "in_spec");
    const dueDate = getVal(["due_date", "Due Date", "dueDate", "Due_Date", "dueYear", "Due Year", "DUE_DATE"]);
    const calDate = getVal(["cal_date", "Cal. Date", "Cal Date", "calDate", "Cal_Date", "CAL_DATE"]);
    const section = getVal(["section", "Section", "SECTION"]);
    const subSection = getVal(["sub_section", "Sub Section", "subSection", "Sub_Section", "SUB_SECTION"]);
    const location = getVal(["location", "Location", "LOCATION"]);
    const certNo = getVal(["cert_no", "Cert No.", "certNo", "Cert_No", "CERT_NO"]);
    const accuracy = getVal(["accuracy", "Accuracy", "ACCURACY"]);
    const calibratedBy = getVal(["calibrated_by", "Calibrated By", "calibratedBy", "Calibrated_By", "CTC CONTROL", "LAB CAL Y2025", "LAB CAL Y2026"]);
    const notes = getVal(["notes", "Notes", "remark", "Remark", "NOTES", "REMARK"]);
    const tabType = getVal(["tab_type", "tabType", "tab", "Tab"], defaultTab);
    const size = getVal(["size", "Size", "SIZE"]);
    const frequency = getVal(["frequency", "Frequency", "FREQUENCY"]);
    const registerDate = getVal(["register_date", "Register Date", "registerDate", "Register date"]);

    const rawNo = getVal(["no", "No", "No.", "N"]);
    const no = typeof rawNo === "number" ? rawNo : (parseInt(rawNo, 10) || 0);
    const id = String(row.id || base.id || (codeNo ? `inst_${codeNo.replace(/[^a-zA-Z0-9_-]/g, '_')}` : `inst_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`));

    return {
      ...base,
      id,
      no,
      codeNo: String(codeNo),
      instrumentName: String(instName || "Unnamed Instrument"),
      serialNo: String(serialNo),
      model: String(model),
      makerName: String(makerName),
      category: String(category),
      status: String(status),
      dueDate: String(dueDate),
      calDate: String(calDate),
      section: String(section),
      subSection: String(subSection),
      location: String(location),
      certNo: String(certNo),
      accuracy: String(accuracy),
      calibratedBy: String(calibratedBy),
      notes: String(notes),
      tabType: String(tabType),
      size: String(size),
      frequency: String(frequency),
      registerDate: String(registerDate),
    };
  }

  // HTTP Helper with timeout and standard PostgREST headers
  async function request(endpoint, options = {}) {
    if (!isConfigured()) {
      throw new Error("ยังไม่ได้ระบุ Supabase URL หรือ Anon Key");
    }

    const cleanUrl = config.url.replace(/\/+$/, "");
    const url = `${cleanUrl}/rest/v1${endpoint.startsWith("/") ? endpoint : "/" + endpoint}`;

    const headers = {
      apikey: config.anonKey,
      Authorization: `Bearer ${config.anonKey}`,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    };

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), options.timeout || 12000);

    try {
      const res = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!res.ok) {
        let errBody = "";
        try {
          const errJson = await res.json();
          errBody = errJson.message || errJson.error || JSON.stringify(errJson);
        } catch {
          errBody = await res.text();
        }
        throw new Error(`Supabase HTTP ${res.status}: ${errBody || res.statusText}`);
      }

      if (res.status === 204) return null;

      const contentType = res.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        return await res.json();
      }
      return await res.text();
    } catch (err) {
      clearTimeout(timeout);
      if (err.name === "AbortError") {
        throw new Error("การเชื่อมต่อหมดเวลา (Timeout 12s) กรุณาตรวจสอบอินเทอร์เน็ตหรือ URL");
      }
      throw err;
    }
  }

  // Get table name for a page
  function getTableForPage(pageKey) {
    if (!pageKey) return PAGE_TABLES.calibration_all;
    const cleanKey = String(pageKey).toLowerCase().replace(/[^a-z0-9_]/g, "_");
    if (cleanKey.includes("cancel")) return PAGE_TABLES.cancel;
    if (cleanKey.includes("central")) return PAGE_TABLES.centralized;
    if (cleanKey.includes("normal")) return PAGE_TABLES.normal_standard;
    if (cleanKey.includes("each") || cleanKey.includes("sec")) return PAGE_TABLES.each_section;
    return PAGE_TABLES.calibration_all;
  }

  // 1. Test Connection for all 5 separate tables
  async function testConnection() {
    if (!isConfigured()) {
      return { ok: false, message: "ยังไม่ได้ระบุ Supabase URL หรือ Anon Key" };
    }

    const startTime = performance.now();
    try {
      emitStatus({ status: "syncing" });
      
      const results = {};
      const errors = [];

      for (const [key, tbl] of Object.entries(PAGE_TABLES)) {
        try {
          const rows = await request(`/${tbl}?select=id&limit=1`, {
            method: "GET",
          });
          results[tbl] = true;
        } catch (err) {
          results[tbl] = false;
          errors.push(`${tbl}: ${err.message}`);
        }
      }

      const allSuccess = Object.values(results).every(Boolean);
      const latencyMs = Math.round(performance.now() - startTime);

      if (allSuccess) {
        saveConfig({ status: "connected", lastError: null });
        emitToast(`✅ เชื่อมต่อครบทั้ง 5 ตารางสำเร็จ (${latencyMs}ms)`, "success");
        return {
          ok: true,
          latencyMs,
          message: `✅ เชื่อมต่อฐานข้อมูล Supabase ครบทั้ง 5 ตารางเรียบร้อย (${latencyMs}ms)`,
          tableStatus: results,
        };
      } else {
        const errMsg = `⚠️ พบปัญหาบางตาราง: กรุณาคัดลอกคำสั่งในแท็บ "📋 คำสั่ง SQL" ไปรันใน Supabase SQL Editor เพื่อสร้างตารางให้ครบทั้ง 5 ตาราง`;
        saveConfig({ status: "error", lastError: errMsg });
        emitToast(errMsg, "error");
        return {
          ok: false,
          message: errMsg,
          tableStatus: results,
          errors,
        };
      }
    } catch (err) {
      const errMsg = `เกิดข้อผิดพลาดในการเชื่อมต่อ: ${err.message}`;
      saveConfig({ status: "error", lastError: errMsg });
      emitToast(errMsg, "error");
      return { ok: false, message: errMsg };
    }
  }

  // Helper to push items to a specific table in chunks
  async function pushToTable(tbl, items, tabType) {
    if (!Array.isArray(items) || items.length === 0) return 0;
    const formatted = items.map((it) => formatRow(it, tabType)).filter(Boolean);
    const CHUNK_SIZE = 150;
    for (let i = 0; i < formatted.length; i += CHUNK_SIZE) {
      const chunk = formatted.slice(i, i + CHUNK_SIZE);
      await request(`/${tbl}`, {
        method: "POST",
        headers: {
          Prefer: "resolution=merge-duplicates,return=minimal",
        },
        body: JSON.stringify(chunk),
      });
    }
    return formatted.length;
  }

  // Helper to pull all items from a specific table
  async function pullFromTable(tbl) {
    try {
      const allRows = [];
      const PAGE_SIZE = 1000;
      let offset = 0;
      let hasMore = true;

      while (hasMore) {
        let rows = null;
        try {
          rows = await request(`/${tbl}?select=*&order=no.asc.nullslast&limit=${PAGE_SIZE}&offset=${offset}`, { method: "GET" });
        } catch (orderErr) {
          try {
            rows = await request(`/${tbl}?select=*&limit=${PAGE_SIZE}&offset=${offset}`, { method: "GET" });
          } catch (fetchErr) {
            console.warn(`[Supabase Pull Page Error] ${tbl} offset ${offset}:`, fetchErr);
            break;
          }
        }

        if (Array.isArray(rows) && rows.length > 0) {
          allRows.push(...rows);
          if (rows.length < PAGE_SIZE) {
            hasMore = false;
          } else {
            offset += PAGE_SIZE;
          }
        } else {
          hasMore = false;
        }
      }

      return allRows.map((r, idx) => {
        const parsed = parseRow(r, tbl.replace("qap_", ""));
        if (parsed && (!parsed.no || parsed.no <= 0)) {
          parsed.no = idx + 1;
        }
        return parsed;
      }).filter(Boolean);
    } catch (e) {
      console.warn(`[Supabase Pull] Failed for table ${tbl}:`, e);
      return [];
    }
  }

  // 2. Push All 5 Pages to their respective 5 tables
  async function pushAll({
    all = [],
    normalStandard = [],
    centralized = [],
    eachSection = [],
    cancel = [],
  } = {}) {
    if (!isConfigured()) {
      return { ok: false, message: "ยังไม่ได้ตั้งค่า Supabase" };
    }

    try {
      emitStatus({ status: "syncing" });

      const counts = {
        calibration_all: await pushToTable(PAGE_TABLES.calibration_all, all, "calibration_all"),
        normal_standard: await pushToTable(PAGE_TABLES.normal_standard, normalStandard, "normal_standard"),
        centralized: await pushToTable(PAGE_TABLES.centralized, centralized, "centralized"),
        each_section: await pushToTable(PAGE_TABLES.each_section, eachSection, "each_section"),
        cancel: await pushToTable(PAGE_TABLES.cancel, cancel, "cancel"),
      };

      const totalCount = Object.values(counts).reduce((a, b) => a + b, 0);

      saveConfig({
        status: "connected",
        lastSync: new Date().toISOString(),
        lastError: null,
      });

      emitToast(`☁️ สำรองข้อมูลแยก 5 ตารางสำเร็จทั้งหมด (${totalCount} รายการ)`, "success");

      return {
        ok: true,
        counts,
        totalCount,
        message: `ส่งข้อมูลแยก 5 ตารางสำเร็จ: All (${counts.calibration_all}), Normal (${counts.normal_standard}), Centralized (${counts.centralized}), Each Section (${counts.each_section}), Cancel (${counts.cancel})`,
      };
    } catch (err) {
      saveConfig({ status: "error", lastError: err.message });
      emitToast(`ส่งขึ้น Supabase ล้มเหลว: ${err.message}`, "error");
      return { ok: false, message: err.message };
    }
  }

  // 3. Pull All 5 Pages from their respective 5 tables
  async function pullAll() {
    if (!isConfigured()) {
      return { ok: false, message: "ยังไม่ได้ตั้งค่า Supabase" };
    }

    try {
      emitStatus({ status: "syncing" });

      const [all, normalStandard, centralized, eachSection, cancel] = await Promise.all([
        pullFromTable(PAGE_TABLES.calibration_all),
        pullFromTable(PAGE_TABLES.normal_standard),
        pullFromTable(PAGE_TABLES.centralized),
        pullFromTable(PAGE_TABLES.each_section),
        pullFromTable(PAGE_TABLES.cancel),
      ]);

      const totalCount = all.length + normalStandard.length + centralized.length + eachSection.length + cancel.length;

      saveConfig({
        status: "connected",
        lastSync: new Date().toISOString(),
        lastError: null,
      });

      emitToast(`📥 ซิงก์ข้อมูลแยก 5 ตารางจาก Supabase สำเร็จ (${totalCount} รายการ)`, "success");

      return {
        ok: true,
        data: {
          all,
          normalStandard,
          centralized,
          eachSection,
          cancel,
        },
        totalCount,
      };
    } catch (err) {
      saveConfig({ status: "error", lastError: err.message });
      emitToast(`ซิงก์ดึงข้อมูลล้มเหลว: ${err.message}`, "error");
      return { ok: false, message: err.message };
    }
  }

  // 4. Realtime Single Instrument Upsert to dedicated table and master list
  async function upsertInstrument(inst, tabType = "calibration_all") {
    if (!isConfigured() || !config.autoSync) return { ok: false, skipped: true };

    try {
      const targetTable = getTableForPage(tabType);
      const row = formatRow(inst, tabType);
      if (!row) return { ok: false, message: "Invalid instrument data" };

      // Save to dedicated table
      await request(`/${targetTable}`, {
        method: "POST",
        headers: {
          Prefer: "resolution=merge-duplicates,return=minimal",
        },
        body: JSON.stringify(row),
      });

      // Also ensure Master List (qap_calibration_all) stays synchronized if not already target
      if (targetTable !== PAGE_TABLES.calibration_all) {
        await request(`/${PAGE_TABLES.calibration_all}`, {
          method: "POST",
          headers: {
            Prefer: "resolution=merge-duplicates,return=minimal",
          },
          body: JSON.stringify(row),
        }).catch(() => {});
      }

      saveConfig({ lastSync: new Date().toISOString(), status: "connected" });
      emitToast(`☁️ ซิงก์บันทึกลงตาราง ${targetTable}: ${inst.codeNo || inst.instrumentName || ""}`, "success");
      return { ok: true };
    } catch (err) {
      console.warn("[Supabase Sync] Upsert failed:", err);
      return { ok: false, error: err.message };
    }
  }

  // 5. Delete single instrument from its dedicated table and master list
  async function deleteInstrument(id, tabType = "calibration_all") {
    if (!isConfigured() || !config.autoSync || !id) return { ok: false, skipped: true };

    try {
      const targetTable = getTableForPage(tabType);
      await request(`/${targetTable}?id=eq.${encodeURIComponent(id)}`, {
        method: "DELETE",
        headers: { Prefer: "return=minimal" },
      });

      if (targetTable !== PAGE_TABLES.calibration_all) {
        await request(`/${PAGE_TABLES.calibration_all}?id=eq.${encodeURIComponent(id)}`, {
          method: "DELETE",
          headers: { Prefer: "return=minimal" },
        }).catch(() => {});
      }

      saveConfig({ lastSync: new Date().toISOString(), status: "connected" });
      emitToast(`☁️ ลบออกจากตาราง ${targetTable} แล้ว`, "info");
      return { ok: true };
    } catch (err) {
      console.warn("[Supabase Sync] Delete failed:", err);
      return { ok: false, error: err.message };
    }
  }

  // 6. Delete multiple instruments (Batch Delete)
  async function deleteInstruments(ids, tabType = "calibration_all") {
    if (!isConfigured() || !config.autoSync || !Array.isArray(ids) || ids.length === 0) {
      return { ok: false, skipped: true };
    }

    try {
      const targetTable = getTableForPage(tabType);
      const idList = ids.map((i) => `"${encodeURIComponent(i)}"`).join(",");
      await request(`/${targetTable}?id=in.(${idList})`, {
        method: "DELETE",
        headers: { Prefer: "return=minimal" },
      });

      if (targetTable !== PAGE_TABLES.calibration_all) {
        await request(`/${PAGE_TABLES.calibration_all}?id=in.(${idList})`, {
          method: "DELETE",
          headers: { Prefer: "return=minimal" },
        }).catch(() => {});
      }

      saveConfig({ lastSync: new Date().toISOString(), status: "connected" });
      emitToast(`☁️ ลบ ${ids.length} รายการจากตาราง ${targetTable} สำเร็จ`, "info");
      return { ok: true };
    } catch (err) {
      console.warn("[Supabase Sync] Batch delete failed:", err);
      return { ok: false, error: err.message };
    }
  }

    // 6.2 Upsert multiple instruments (Batch Upsert)
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
  }

  // Export globally to window
  window.qapSupabase = {
    getEmbeddedConfig: () => ({ ...EMBEDDED_SUPABASE_CONFIG }),
    isEmbedded: () => Boolean(EMBEDDED_SUPABASE_CONFIG.url && EMBEDDED_SUPABASE_CONFIG.anonKey),
    getConfig: () => ({ ...config, isConfigured: isConfigured() }),
    saveConfig,
    isConfigured,
    testConnection,
    upsertInstrument,
    deleteInstrument,
    deleteInstruments,
    deleteAllInstruments,
    upsertInstruments,
    pushSingleTable,
    pullAll,
    pushAll,
    getSqlSetupScript,
    PAGE_TABLES,
    PAGE_NAMES,
    emitToast,
  };

  // Initial status notification after boot
  setTimeout(emitStatus, 300);
})();
