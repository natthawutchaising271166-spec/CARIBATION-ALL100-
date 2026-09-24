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

  // Dedicated Table for PDF Certificate Files
  const FILES_TABLE = "qap_files";

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

  // Memory cache to hold preloaded calibration history records for instant load times (ISO/IEC 17025)
  const _historyCache = new Map();
  let _filesCache = [];
  let _historyTableAvailable = null; // null = untested, true = available, false = not available
  let _historyTableEndpoint = null;

  // Helper to determine Calibration Folder Color status:
  // Green: All records have files attached
  // Yellow: Partial attachments (some records have files, but not all)
  // White: No files attached at all
  function getFolderStatus(inst) {
    if (!inst) return { status: "white", color: "white", attachedCount: 0, totalCount: 0 };
    const c = String(inst.codeNo || inst.code_no || "").trim();
    const i = String(inst.id || "").trim();

    // 1. Get history array from memory cache or instrument object
    let h = null;
    if (_historyCache && (c || i)) {
      h = _historyCache.get(c) || _historyCache.get(i);
    }
    if (!h || !h.length) {
      if (Array.isArray(inst.calibrationHistory) && inst.calibrationHistory.length > 0) {
        h = inst.calibrationHistory;
      } else if (Array.isArray(inst.history) && inst.history.length > 0) {
        h = inst.history;
      }
    }

    const allFiles = Array.isArray(_filesCache) ? _filesCache : [];
    // Filter files matching this instrument's code_no or instrument_id
    const cUpper = c.toUpperCase();
    const instDbFiles = allFiles.filter(f => {
      if (!f) return false;
      const fCode = f.code_no ? String(f.code_no).trim().toUpperCase() : "";
      const fId = f.instrument_id ? String(f.instrument_id).trim() : "";
      return (cUpper && fCode === cUpper) || (i && fId === i);
    });

    // Case A: Instrument has no history list -> single record
    if (!h || h.length === 0) {
      const hasDirectFile = Boolean(inst.pdfUrl || inst.certFileData || inst.file_url);
      const hasDbFile = instDbFiles.length > 0;
      if (hasDirectFile || hasDbFile) {
        return { status: "green", color: "green", attachedCount: 1, totalCount: 1 };
      }
      return { status: "white", color: "white", attachedCount: 0, totalCount: 0 };
    }

    // Case B: Instrument has history records list
    const sorted = [...h].sort((a, b) => {
      const da = normalizeDateUniform(a.calDate || a.cal_date || 0);
      const db = normalizeDateUniform(b.calDate || b.cal_date || 0);
      return new Date(db).getTime() - new Date(da).getTime() || String(db).localeCompare(String(da));
    });
    const latest = sorted[0];

    let attachedCount = 0;
    const usedDbFileKeys = new Set();

    for (const item of sorted) {
      const isLatest = (item === latest);
      const hasDirect = Boolean(item.pdfUrl || item.certFileData || item.file_url);
      const hasLatestInstFile = isLatest && Boolean(inst.pdfUrl || inst.certFileData);

      if (hasDirect || hasLatestInstFile) {
        attachedCount++;
        continue;
      }

      // Try matching against instDbFiles
      const itemCert = String(item.certNo || item.cert_no || "").trim().toUpperCase();
      const itemDate = normalizeDateUniform(item.calDate || item.cal_date);

      let matchedFile = null;
      // 1. Try exact cert match
      if (itemCert) {
        matchedFile = instDbFiles.find(f => {
          const fKey = f.id || f.file_url;
          if (usedDbFileKeys.has(fKey)) return false;
          return f.cert_no && String(f.cert_no).trim().toUpperCase() === itemCert;
        });
      }
      // 2. Try date match
      if (!matchedFile && itemDate) {
        matchedFile = instDbFiles.find(f => {
          const fKey = f.id || f.file_url;
          if (usedDbFileKeys.has(fKey)) return false;
          return f.cal_date && isSameDate(f.cal_date, itemDate);
        });
      }
      // 3. Fallback: match any unallocated file for this instrument
      if (!matchedFile && instDbFiles.length > 0) {
        matchedFile = instDbFiles.find(f => {
          const fKey = f.id || f.file_url;
          return !usedDbFileKeys.has(fKey);
        });
      }

      if (matchedFile) {
        usedDbFileKeys.add(matchedFile.id || matchedFile.file_url);
        attachedCount++;
      }
    }

    const totalCount = h.length;
    if (attachedCount === 0) {
      return { status: "white", color: "white", attachedCount: 0, totalCount };
    } else if (attachedCount >= totalCount) {
      return { status: "green", color: "green", attachedCount, totalCount };
    } else {
      return { status: "yellow", color: "yellow", attachedCount, totalCount };
    }
  }

  // Bind to window immediately so React can call it anytime
  if (typeof window !== "undefined") {
    window.qapGetFolderStatus = getFolderStatus;
  }

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
    pdf_url TEXT,
    cert_file_name TEXT,
    file_size BIGINT,
    data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- อัปเดตตารางเดิมให้รองรับการจัดเก็บไฟล์ PDF และชื่อไฟล์โดยอัตโนมัติ
ALTER TABLE public.${tbl} ADD COLUMN IF NOT EXISTS pdf_url TEXT;
ALTER TABLE public.${tbl} ADD COLUMN IF NOT EXISTS cert_file_name TEXT;
ALTER TABLE public.${tbl} ADD COLUMN IF NOT EXISTS file_size BIGINT;

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

    sql += `-- ----------------------------------------------------------
-- ตารางแยกสำหรับจัดเก็บไฟล์ PDF (qap_files)
-- ป้องกันการบันทึกซ้ำซ้อนลงในตารางช่อง data (JSONB)
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.qap_files (
    id TEXT PRIMARY KEY,
    instrument_id TEXT,
    code_no TEXT,
    cert_no TEXT,
    file_name TEXT,
    file_size BIGINT,
    file_url TEXT NOT NULL,
    tab_type TEXT DEFAULT 'calibration_all',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ให้สิทธิ์ Anon และ Authenticated สำหรับตาราง qap_files
GRANT ALL ON TABLE public.qap_files TO anon, authenticated, service_role;

-- เปิดใช้งาน RLS สำหรับ qap_files
ALTER TABLE public.qap_files ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    DROP POLICY IF EXISTS "Allow public all access on qap_files" ON public.qap_files;
END $$;

CREATE POLICY "Allow public all access on qap_files"
    ON public.qap_files
    FOR ALL
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

-- ดัชนีประสิทธิภาพสำหรับ qap_files
CREATE INDEX IF NOT EXISTS idx_qap_files_inst_id ON public.qap_files(instrument_id);
CREATE INDEX IF NOT EXISTS idx_qap_files_code_no ON public.qap_files(code_no);
CREATE INDEX IF NOT EXISTS idx_qap_files_cert_no ON public.qap_files(cert_no);

DROP TRIGGER IF EXISTS tr_qap_files_updated_at ON public.qap_files;
CREATE TRIGGER tr_qap_files_updated_at
    BEFORE UPDATE ON public.qap_files
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- ----------------------------------------------------------
-- ฟังก์ชัน Auto-Extract และ Sanitization ลิ้งก์ไฟล์ในฐานข้อมูล
-- แยกไฟล์ PDF เข้าสู่ตาราง qap_files และล้างช่อง data (JSONB) อัตโนมัติในระดับ Database Trigger
-- ----------------------------------------------------------
CREATE OR REPLACE FUNCTION public.clean_qap_notes(raw_notes text)
RETURNS text AS $$
BEGIN
    IF raw_notes IS NULL THEN
        RETURN '';
    END IF;
    RETURN trim(regexp_replace(
        regexp_replace(
            regexp_replace(raw_notes, '\[(?:ไฟล์|PDF|File|Link|แนบไฟล์)[^\]]*\]', '', 'gi'),
            'https?://[^\s]+(?:\.pdf|/storage/v1/[^\s]+)', '', 'gi'),
        'data:application/pdf[^\s]*', '', 'gi'
    ));
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.handle_qap_instrument_sync_files()
RETURNS TRIGGER AS $$
DECLARE
    f_url text;
    f_name text;
    f_size bigint;
    h_elem jsonb;
    cleaned_hist jsonb := '[]'::jsonb;
    inst_code text;
    inst_cert text;
    file_record_id text;
    target_tab text;
BEGIN
    inst_code := COALESCE(NEW.code_no, '');
    inst_cert := COALESCE(NEW.cert_no, '');
    target_tab := COALESCE(NEW.tab_type, TG_TABLE_NAME);
    
    -- 1. ตรวจสอบและดึงไฟล์จาก NEW.pdf_url หรือ NEW.data
    f_url := NULL;
    IF NEW.pdf_url IS NOT NULL AND length(trim(NEW.pdf_url)) > 10 THEN
        f_url := NEW.pdf_url;
        f_name := NEW.cert_file_name;
        f_size := NEW.file_size;
    ELSIF NEW.data IS NOT NULL THEN
        IF NEW.data ? 'pdfUrl' AND NEW.data->>'pdfUrl' IS NOT NULL AND length(trim(NEW.data->>'pdfUrl')) > 10 THEN
            f_url := NEW.data->>'pdfUrl';
        ELSIF NEW.data ? 'certFileData' AND NEW.data->>'certFileData' IS NOT NULL AND length(trim(NEW.data->>'certFileData')) > 10 THEN
            f_url := NEW.data->>'certFileData';
        ELSIF NEW.data ? 'file_url' AND NEW.data->>'file_url' IS NOT NULL AND length(trim(NEW.data->>'file_url')) > 10 THEN
            f_url := NEW.data->>'file_url';
        END IF;
        
        IF f_url IS NOT NULL THEN
            f_name := COALESCE(NEW.data->>'certFileName', NEW.data->>'cert_file_name', NEW.cert_file_name, 'certificate.pdf');
            f_size := COALESCE((NEW.data->>'fileSize')::bigint, (NEW.data->>'file_size')::bigint, NEW.file_size, 0);
        END IF;
    END IF;

    -- หากมีไฟล์ ให้ทำการ Upsert เข้าสู่ตาราง qap_files โดยอัตโนมัติ
    IF f_url IS NOT NULL AND length(f_url) > 10 THEN
        file_record_id := 'file_' || regexp_replace(COALESCE(inst_code, NEW.id, gen_random_uuid()::text), '[^a-zA-Z0-9_-]', '_', 'g');
        INSERT INTO public.qap_files (id, instrument_id, code_no, cert_no, file_name, file_size, file_url, tab_type, updated_at)
        VALUES (
            file_record_id,
            NEW.id,
            inst_code,
            inst_cert,
            COALESCE(f_name, 'certificate.pdf'),
            COALESCE(f_size, 0),
            f_url,
            target_tab,
            NOW()
        )
        ON CONFLICT (id) DO UPDATE
        SET instrument_id = EXCLUDED.instrument_id,
            code_no = EXCLUDED.code_no,
            cert_no = EXCLUDED.cert_no,
            file_name = EXCLUDED.file_name,
            file_size = EXCLUDED.file_size,
            file_url = EXCLUDED.file_url,
            tab_type = EXCLUDED.tab_type,
            updated_at = NOW();
    END IF;

    -- 2. วนลูปตรวจสอบ history ใน NEW.data หากมีไฟล์แนบ ให้บันทึกลง qap_files และตัดออกจาก history jsonb
    IF NEW.data IS NOT NULL AND (NEW.data ? 'history' OR NEW.data ? 'calibrationHistory') THEN
        cleaned_hist := '[]'::jsonb;
        FOR h_elem IN SELECT * FROM jsonb_array_elements(COALESCE(NEW.data->'history', NEW.data->'calibrationHistory', '[]'::jsonb))
        LOOP
            IF h_elem ? 'pdfUrl' AND h_elem->>'pdfUrl' IS NOT NULL AND length(trim(h_elem->>'pdfUrl')) > 10 THEN
                INSERT INTO public.qap_files (id, instrument_id, code_no, cert_no, file_name, file_size, file_url, tab_type, updated_at)
                VALUES (
                    'file_' || regexp_replace(COALESCE(h_elem->>'id', (NEW.id || '_' || COALESCE(h_elem->>'certNo', '1'))), '[^a-zA-Z0-9_-]', '_', 'g'),
                    NEW.id,
                    inst_code,
                    COALESCE(h_elem->>'certNo', inst_cert),
                    COALESCE(h_elem->>'certFileName', 'certificate.pdf'),
                    COALESCE((h_elem->>'fileSize')::bigint, 0),
                    h_elem->>'pdfUrl',
                    target_tab,
                    NOW()
                )
                ON CONFLICT (id) DO UPDATE
                SET file_url = EXCLUDED.file_url,
                    file_name = EXCLUDED.file_name,
                    file_size = EXCLUDED.file_size,
                    updated_at = NOW();
            END IF;

            -- ล้างฟิลด์ไฟล์ออกจาก history element
            cleaned_hist := cleaned_hist || jsonb_build_array(
                h_elem - 'pdfUrl' - 'certFileData' - 'certFileName' - 'fileSize' - 'originalFileSize' - 'file_url' - 'file_data' - 'link' - 'url' - 'docUrl'
            );
        END LOOP;

        IF NEW.data ? 'history' THEN
            NEW.data := jsonb_set(NEW.data, '{history}', cleaned_hist);
        END IF;
        IF NEW.data ? 'calibrationHistory' THEN
            NEW.data := jsonb_set(NEW.data, '{calibrationHistory}', cleaned_hist);
        END IF;
    END IF;

    -- 3. ล้างฟิลด์ไฟล์และคอลัมน์ซ้ำซ้อนออกจาก NEW.data (JSONB)
    IF NEW.data IS NOT NULL THEN
        NEW.data := NEW.data - 'pdfUrl' - 'certFileData' - 'pdf_url' - 'cert_file_data' - 'certFileName' - 'cert_file_name' - 'fileSize' - 'file_size' - 'originalFileSize' - 'original_file_size' - 'file_url' - 'fileData' - 'file_data' - 'url' - 'link' - 'fileLink' - 'file_link' - 'filePath' - 'file_path' - 'blobUrl' - 'blob_url' - 'storageUrl' - 'storage_url' - 'attachment' - 'attachments' - 'docUrl' - 'doc_url';
        
        -- ล้างคอลัมน์หลักเพื่อไม่ให้ซ้ำซ้อนใน data jsonb
        NEW.data := NEW.data - 'id' - 'no' - 'code_no' - 'codeNo' - 'instrument_name' - 'instrumentName' - 'serial_no' - 'serialNo' - 'model' - 'maker_name' - 'makerName' - 'category' - 'tab_type' - 'tabType' - 'status' - 'due_date' - 'dueDate' - 'cal_date' - 'calDate' - 'section' - 'sub_section' - 'subSection' - 'location' - 'cert_no' - 'certNo' - 'accuracy' - 'calibrated_by' - 'calibratedBy' - 'notes' - 'remark';
    END IF;

    -- 4. ตั้งค่าคอลัมน์ไฟล์ในตารางหลักเป็น NULL เพื่อความสะอาด 100% (เพราะแยกเก็บใน qap_files แล้ว)
    NEW.pdf_url := NULL;
    NEW.cert_file_name := NULL;
    NEW.file_size := NULL;

    -- 5. ทำความสะอาดช่อง notes
    NEW.notes := public.clean_qap_notes(NEW.notes);
    NEW.updated_at := NOW();

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- เชื่อมต่อ Trigger ให้กับทั้ง 5 ตารางหลักเพื่อแยกไฟล์และล้างข้อมูลอัตโนมัติ
`;

    tableKeys.forEach((key) => {
      const tbl = PAGE_TABLES[key];
      sql += `DROP TRIGGER IF EXISTS tr_${tbl}_sync_files ON public.${tbl};
CREATE TRIGGER tr_${tbl}_sync_files
    BEFORE INSERT OR UPDATE ON public.${tbl}
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_qap_instrument_sync_files();

`;
    });

    sql += `-- คัดลอกไฟล์เดิมที่มีอยู่ในตารางหลักเข้าสู่ตารางแยก qap_files แบบอัตโนมัติ (Migration)
INSERT INTO public.qap_files (id, instrument_id, code_no, cert_no, file_name, file_size, file_url, tab_type)
SELECT 
    'file_' || regexp_replace(COALESCE(code_no, id), '[^a-zA-Z0-9_-]', '_', 'g') AS id,
    id AS instrument_id,
    code_no,
    cert_no,
    cert_file_name AS file_name,
    file_size,
    pdf_url AS file_url,
    tab_type
FROM public.qap_calibration_all
WHERE pdf_url IS NOT NULL AND trim(pdf_url) != ''
ON CONFLICT (id) DO UPDATE 
SET file_url = EXCLUDED.file_url,
    file_name = EXCLUDED.file_name,
    file_size = EXCLUDED.file_size,
    updated_at = NOW();

-- ----------------------------------------------------------
-- ล้างคอลัมน์ไฟล์เดิมออกจากตารางหลักทั้ง 5 ตาราง เพื่อให้ไม่มีข้อมูลลิ้งก์ไฟล์ไปต่อกับข้อความในตาราง
-- ----------------------------------------------------------
DO $$
DECLARE
    tbl text;
BEGIN
    FOR tbl IN SELECT unnest(ARRAY['qap_calibration_all', 'qap_normal_standard', 'qap_centralized', 'qap_each_section', 'qap_cancel']) LOOP
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name=tbl AND column_name='pdf_url') THEN
            EXECUTE format('UPDATE public.%I SET pdf_url = NULL, cert_file_name = NULL, file_size = NULL WHERE pdf_url IS NOT NULL', tbl);
        END IF;
    END LOOP;
END $$;

-- ----------------------------------------------------------
-- ปรับคอลัมน์ data (JSONB) ให้สะอาด 100%
-- ลบทุกฟิลด์ที่เกี่ยวกับไฟล์และลิ้งก์ ป้องกันการบันทึกซ้ำซ้อน
-- ----------------------------------------------------------
UPDATE public.qap_calibration_all SET data = data - 'pdfUrl' - 'certFileData' - 'pdf_url' - 'cert_file_data' - 'certFileName' - 'cert_file_name' - 'fileSize' - 'file_size' - 'originalFileSize' - 'original_file_size' - 'file_url' - 'fileData' - 'file_data' - 'url' - 'link' - 'fileLink' - 'file_link' - 'filePath' - 'file_path' - 'blobUrl' - 'blob_url' - 'storageUrl' - 'storage_url' - 'attachment' - 'attachments' - 'docUrl' - 'doc_url' WHERE data IS NOT NULL;
UPDATE public.qap_normal_standard SET data = data - 'pdfUrl' - 'certFileData' - 'pdf_url' - 'cert_file_data' - 'certFileName' - 'cert_file_name' - 'fileSize' - 'file_size' - 'originalFileSize' - 'original_file_size' - 'file_url' - 'fileData' - 'file_data' - 'url' - 'link' - 'fileLink' - 'file_link' - 'filePath' - 'file_path' - 'blobUrl' - 'blob_url' - 'storageUrl' - 'storage_url' - 'attachment' - 'attachments' - 'docUrl' - 'doc_url' WHERE data IS NOT NULL;
UPDATE public.qap_centralized SET data = data - 'pdfUrl' - 'certFileData' - 'pdf_url' - 'cert_file_data' - 'certFileName' - 'cert_file_name' - 'fileSize' - 'file_size' - 'originalFileSize' - 'original_file_size' - 'file_url' - 'fileData' - 'file_data' - 'url' - 'link' - 'fileLink' - 'file_link' - 'filePath' - 'file_path' - 'blobUrl' - 'blob_url' - 'storageUrl' - 'storage_url' - 'attachment' - 'attachments' - 'docUrl' - 'doc_url' WHERE data IS NOT NULL;
UPDATE public.qap_each_section SET data = data - 'pdfUrl' - 'certFileData' - 'pdf_url' - 'cert_file_data' - 'certFileName' - 'cert_file_name' - 'fileSize' - 'file_size' - 'originalFileSize' - 'original_file_size' - 'file_url' - 'fileData' - 'file_data' - 'url' - 'link' - 'fileLink' - 'file_link' - 'filePath' - 'file_path' - 'blobUrl' - 'blob_url' - 'storageUrl' - 'storage_url' - 'attachment' - 'attachments' - 'docUrl' - 'doc_url' WHERE data IS NOT NULL;
UPDATE public.qap_cancel SET data = data - 'pdfUrl' - 'certFileData' - 'pdf_url' - 'cert_file_data' - 'certFileName' - 'cert_file_name' - 'fileSize' - 'file_size' - 'originalFileSize' - 'original_file_size' - 'file_url' - 'fileData' - 'file_data' - 'url' - 'link' - 'fileLink' - 'file_link' - 'filePath' - 'file_path' - 'blobUrl' - 'blob_url' - 'storageUrl' - 'storage_url' - 'attachment' - 'attachments' - 'docUrl' - 'doc_url' WHERE data IS NOT NULL;

-- ล้างฟิลด์ไฟล์ที่อาจตกค้างในอาเรย์ history ภายใน data jsonb
UPDATE public.qap_calibration_all
SET data = jsonb_set(
    data,
    '{history}',
    (
        SELECT COALESCE(jsonb_agg(h - 'pdfUrl' - 'certFileData' - 'certFileName' - 'fileSize' - 'originalFileSize' - 'file_url' - 'file_data' - 'link' - 'url'), '[]'::jsonb)
        FROM jsonb_array_elements(COALESCE(data->'history', '[]'::jsonb)) AS h
    )
)
WHERE data ? 'history';

-- ----------------------------------------------------------
-- ตารางสำหรับประวัติการสอบเทียบย้อนหลัง (CalibrationHistory)
-- เพื่อความโปร่งใส ตรวจสอบย้อนหลัง (Audit Log) ตามมาตรฐาน ISO 17025
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS public."CalibrationHistory" (
    id TEXT PRIMARY KEY,
    instrument_id TEXT,
    code_no TEXT NOT NULL,
    instrument_name TEXT,
    cert_no TEXT,
    cal_date TEXT,
    due_date TEXT,
    calibrated_by TEXT,
    result TEXT DEFAULT 'PASS',
    accuracy TEXT,
    notes TEXT,
    pdf_url TEXT,
    cert_file_name TEXT,
    file_size BIGINT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.calibration_history (
    id TEXT PRIMARY KEY,
    instrument_id TEXT,
    code_no TEXT NOT NULL,
    instrument_name TEXT,
    cert_no TEXT,
    cal_date TEXT,
    due_date TEXT,
    calibrated_by TEXT,
    result TEXT DEFAULT 'PASS',
    accuracy TEXT,
    notes TEXT,
    pdf_url TEXT,
    cert_file_name TEXT,
    file_size BIGINT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

GRANT ALL ON TABLE public."CalibrationHistory" TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.calibration_history TO anon, authenticated, service_role;

ALTER TABLE public."CalibrationHistory" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calibration_history ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    DROP POLICY IF EXISTS "Allow public all access on CalibrationHistory" ON public."CalibrationHistory";
    DROP POLICY IF EXISTS "Allow public all access on calibration_history" ON public.calibration_history;
END $$;

CREATE POLICY "Allow public all access on CalibrationHistory"
    ON public."CalibrationHistory" FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow public all access on calibration_history"
    ON public.calibration_history FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_cal_hist_code_no ON public."CalibrationHistory"(code_no);
CREATE INDEX IF NOT EXISTS idx_cal_hist_inst_id ON public."CalibrationHistory"(instrument_id);
CREATE INDEX IF NOT EXISTS idx_cal_hist_cal_date ON public."CalibrationHistory"(cal_date);
CREATE INDEX IF NOT EXISTS idx_cal_hist_cert_no ON public."CalibrationHistory"(cert_no);

-- สั่งให้ PostgREST โหลด Schema Cache ใหม่ทันที
NOTIFY pgrst, 'reload schema';

-- ตรวจสอบความสมบูรณ์ของทั้ง 5 ตาราง ตารางไฟล์ และตารางประวัติการสอบเทียบ
SELECT 'qap_calibration_all' AS table_name, count(*) AS count FROM public.qap_calibration_all
UNION ALL
SELECT 'qap_normal_standard', count(*) FROM public.qap_normal_standard
UNION ALL
SELECT 'qap_centralized', count(*) FROM public.qap_centralized
UNION ALL
SELECT 'qap_each_section', count(*) FROM public.qap_each_section
UNION ALL
SELECT 'qap_cancel', count(*) FROM public.qap_cancel
UNION ALL
SELECT 'qap_files (แยกไฟล์)', count(*) FROM public.qap_files
UNION ALL
SELECT 'CalibrationHistory (ประวัติ)', count(*) FROM public."CalibrationHistory";
`;

    return sql;
  }

  // Parse byte size from number or human readable string
  function parseByteSize(val) {
    if (val === undefined || val === null || val === "") return null;
    if (typeof val === "number") return Math.round(val);
    const str = String(val).trim();
    const num = parseFloat(str.replace(/[^0-9.]/g, ""));
    if (isNaN(num)) return null;
    if (/gb/i.test(str)) return Math.round(num * 1024 * 1024 * 1024);
    if (/mb/i.test(str)) return Math.round(num * 1024 * 1024);
    if (/kb/i.test(str)) return Math.round(num * 1024);
    return Math.round(num);
  }

  // Helper to remove attached file links or URLs from notes/remark text
  // ป้องกันการเอาลิ้งก์ไฟล์ไปต่อท้ายหรือปนในข้อความของตาราง
  function cleanNotes(notes) {
    if (!notes || typeof notes !== "string") return "";
    return notes
      .replace(/(?:\[(?:ไฟล์|PDF|File|Link|แนบไฟล์)[^\]]*\])/gi, "")
      .replace(/https?:\/\/[^\s]+(?:\.pdf|\/storage\/v1\/[^\s]+)/gi, "")
      .replace(/data:application\/pdf[^\s]*/gi, "")
      .trim();
  }

  // Format local instrument into database row
  function formatRow(inst, tabType = "calibration_all") {
    if (!inst) return null;
    const id = String(inst.id || `inst_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`);

    const certNo = inst.certNo || (Array.isArray(inst.history) && inst.history[0] && inst.history[0].certNo) || "";
    const calibratedBy = inst.calibratedBy || (Array.isArray(inst.history) && inst.history[0] && (inst.history[0].calibratedBy || inst.history[0].labCal)) || "";

    // Clean and strictly remove ALL PDF base64, URLs, and file metadata fields from inner JSONB
    // so data (jsonb) remains purely non-column instrument properties and NEVER contains any file link or info
    function sanitizeCleanData(obj) {
      if (!obj || typeof obj !== "object") return {};

      const fileKeyRegex = /^(pdf|file|cert_file|cert_data|attachment|blob|link|url|download|storage)/i;
      const isUrlOrFileData = (val) => {
        if (typeof val !== "string") return false;
        const s = val.trim();
        if (/^(https?:\/\/|data:|blob:)/i.test(s)) return true;
        if (/\.(pdf|jpg|jpeg|png|webp)($|\?)/i.test(s)) return true;
        if (s.includes("/storage/v1/") || s.includes("supabase.co")) return true;
        if (s.length > 250 && !s.includes(" ")) return true;
        return false;
      };

      const rootCols = new Set([
        "id", "no", "codeNo", "code_no", "instrumentName", "instrument_name",
        "serialNo", "serial_no", "model", "makerName", "maker_name",
        "category", "tabType", "tab_type", "status", "dueDate", "due_date",
        "calDate", "cal_date", "section", "subSection", "sub_section",
        "location", "certNo", "cert_no", "accuracy", "calibratedBy", "calibrated_by",
        "notes", "remark", "created_at", "updated_at", "pdf_url", "cert_file_name", "file_size"
      ]);

      const out = {};
      for (const [k, v] of Object.entries(obj)) {
        if (rootCols.has(k)) continue; // Never duplicate primary table columns in data jsonb
        if (fileKeyRegex.test(k)) continue; // Never store any file key in data jsonb
        if (isUrlOrFileData(v)) continue; // Never store URL or base64 in data jsonb

        if (k === "history" || k === "calibrationHistory") {
          if (Array.isArray(v)) {
            const cleanHist = v.map((h) => {
              if (!h || typeof h !== "object") return null;
              const hClean = {};
              for (const [hk, hv] of Object.entries(h)) {
                if (fileKeyRegex.test(hk)) continue;
                if (isUrlOrFileData(hv)) continue;
                if (hk === "notes" || hk === "remark") {
                  hClean[hk] = cleanNotes(hv);
                } else {
                  hClean[hk] = hv;
                }
              }
              return hClean;
            }).filter(Boolean);
            if (cleanHist.length > 0) out[k] = cleanHist;
          }
        } else if (v && typeof v === "object" && !Array.isArray(v)) {
          const sub = {};
          for (const [sk, sv] of Object.entries(v)) {
            if (fileKeyRegex.test(sk)) continue;
            if (isUrlOrFileData(sv)) continue;
            sub[sk] = sv;
          }
          if (Object.keys(sub).length > 0) out[k] = sub;
        } else if (v !== undefined && v !== null && v !== "") {
          out[k] = v;
        }
      }
      return out;
    }

    const cleanData = typeof inst === "object" ? sanitizeCleanData(inst) : {};

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
      due_date: (inst.next_due_date || inst.nextDueDate || inst.dueDate) ? String(inst.next_due_date || inst.nextDueDate || inst.dueDate).trim() : null,
      next_due_date: (inst.next_due_date || inst.nextDueDate || inst.dueDate) ? String(inst.next_due_date || inst.nextDueDate || inst.dueDate).trim() : null,
      cal_date: inst.calDate ? String(inst.calDate).trim() : null,
      section: String(inst.section || "").trim(),
      sub_section: String(inst.subSection || "").trim(),
      location: String(inst.location || "").trim(),
      cert_no: String(certNo).trim(),
      accuracy: String(inst.accuracy || "").trim(),
      calibrated_by: String(calibratedBy).trim(),
      notes: cleanNotes(inst.notes || inst.remark || ""),
      pdf_url: null, // Strictly decoupled: NEVER saved into instrument table rows
      cert_file_name: null,
      file_size: null,
      data: cleanData, // Strictly cleansed of any file URLs, keys, or base64
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
    const dueDate = getVal(["next_due_date", "nextDueDate", "due_date", "Due Date", "dueDate", "Due_Date", "dueYear", "Due Year", "DUE_DATE", "NEXT_DUE_DATE"]);
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

    const rawPdf = getVal(["pdf_url", "pdfUrl", "cert_file_data", "certFileData"]);
    const certFileName = getVal(["cert_file_name", "certFileName"]);
    const fileSize = getVal(["file_size", "fileSize"]);

    // Ensure history array has consistent PDF properties
    const histList = Array.isArray(base.history) && base.history.length > 0
      ? base.history
      : Array.isArray(base.calibrationHistory) && base.calibrationHistory.length > 0
      ? base.calibrationHistory
      : [];
    const normalizedHistory = histList.map((h, i) => {
      const hPdf = h.pdfUrl || h.certFileData || (i === 0 ? rawPdf : null);
      return {
        ...h,
        pdfUrl: hPdf || null,
        certFileData: hPdf || null,
        certFileName: h.certFileName || (i === 0 ? certFileName : null),
        fileSize: h.fileSize || (i === 0 ? fileSize : null),
      };
    });

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
      nextDueDate: String(dueDate),
      next_due_date: String(dueDate),
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
      pdfUrl: rawPdf || null,
      certFileData: rawPdf || null,
      certFileName: certFileName || null,
      fileSize: fileSize || null,
      history: normalizedHistory,
      calibrationHistory: normalizedHistory,
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
    const timeout = setTimeout(() => controller.abort(), options.timeout || 30000);

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

  // Helper to sync history and files of imported/pushed instruments to dedicated tables
  async function syncHistoryAndFilesOfInstruments(items, tabType) {
    if (!isConfigured() || !config.autoSync || !Array.isArray(items) || items.length === 0) return;
    try {
      const filePayloads = [];
      const historyPayloads = [];
      const nowStr = new Date().toISOString();

      items.forEach((it) => {
        if (!it) return;
        const cleanInstId = String(it.id || "").trim();
        const cleanCodeNo = String(it.codeNo || it.code_no || "").trim();
        const cleanInstName = String(it.instrumentName || it.instrument_name || "").trim();

        // 1. Check instrument-level file
        const rootUrl = String(it.pdfUrl || it.certFileData || "").trim();
        if (rootUrl) {
          const rootCertNo = String(it.certNo || it.cert_no || "").trim();
          const rootFileName = String(it.certFileName || it.cert_file_name || "").trim();
          const rootFileSize = parseByteSize(it.fileSize || it.file_size);
          const fileId = `file_${cleanCodeNo ? cleanCodeNo.replace(/[^a-zA-Z0-9_-]/g, "_") : (cleanInstId || Date.now())}`;
          filePayloads.push({
            id: fileId,
            instrument_id: cleanInstId || null,
            code_no: cleanCodeNo,
            cert_no: rootCertNo,
            file_name: rootFileName,
            file_size: rootFileSize,
            file_url: rootUrl,
            tab_type: String(tabType || "calibration_all"),
            updated_at: nowStr,
          });
        }

        // 2. Check historical records
        const histList = Array.isArray(it.calibrationHistory) && it.calibrationHistory.length > 0
          ? it.calibrationHistory
          : Array.isArray(it.history) && it.history.length > 0
          ? it.history
          : [];

        histList.forEach((h, hIdx) => {
          if (!h) return;
          const rId = h.id || `hist_${cleanCodeNo.replace(/[^a-zA-Z0-9_-]/g, "_") || cleanInstId || "import"}_${hIdx}_${Math.random().toString(36).substr(2, 4)}`;
          const cert = String(h.certNo || h.cert_no || it.certNo || it.cert_no || `CERT-${cleanCodeNo}-${hIdx}`).trim();
          const cDate = h.calDate || h.cal_date || "";
          const dDate = h.dueDate || h.due_date || "";
          const calBy = h.calibratedBy || h.calibrated_by || it.labCal || it.calibratedBy || "-";
          const res = String(h.result || "PASS").toUpperCase();
          const acc = h.accuracy || it.accuracy || "";
          const nts = h.notes || h.remarks || h.remark || "";
          const pUrl = String(h.pdfUrl || h.pdf_url || h.certFileData || "").trim();
          const fName = String(h.certFileName || h.cert_file_name || "").trim();
          const fSize = parseByteSize(h.fileSize || h.file_size);

          historyPayloads.push({
            id: rId,
            instrument_id: cleanInstId || null,
            code_no: cleanCodeNo,
            instrument_name: cleanInstName,
            cert_no: cert,
            cal_date: cDate,
            due_date: dDate,
            calibrated_by: calBy,
            result: res,
            accuracy: acc,
            notes: nts,
            pdf_url: pUrl || null,
            cert_file_name: fName || null,
            file_size: fSize,
            created_at: h.createdAt || h.created_at || nowStr,
            updated_at: nowStr,
          });

          // If the history item has a PDF, add it as a file payload too!
          if (pUrl) {
            const hFileId = `file_${cleanCodeNo ? cleanCodeNo.replace(/[^a-zA-Z0-9_-]/g, "_") : (cleanInstId || Date.now())}_h${hIdx}`;
            filePayloads.push({
              id: hFileId,
              instrument_id: cleanInstId || null,
              code_no: cleanCodeNo,
              cert_no: cert,
              file_name: fName || `${cert}.pdf`,
              file_size: fSize,
              file_url: pUrl,
              tab_type: String(tabType || "calibration_all"),
              updated_at: nowStr,
            });
          }
        });
      });

      // Batch insert filePayloads to qap_files (FILES_TABLE)
      if (filePayloads.length > 0) {
        // Dedup file payloads by id
        const seenF = new Set();
        const uniqueFiles = [];
        for (const fp of filePayloads) {
          if (!seenF.has(fp.id)) {
            seenF.add(fp.id);
            uniqueFiles.push(fp);
          }
        }

        // Chunk files upload
        const fChunks = [];
        for (let i = 0; i < uniqueFiles.length; i += 50) {
          fChunks.push(uniqueFiles.slice(i, i + 50));
        }
        for (const ch of fChunks) {
          await request(`/${FILES_TABLE}`, {
            method: "POST",
            headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
            body: JSON.stringify(ch),
          }).catch((err) => {
            console.warn("[Supabase Sync] Batch file insert failed, falling back to clean files:", err);
            // Fallback: strip file payloads that might cause issues and retry
            const fallbackCh = ch.map(item => {
              const copy = { ...item };
              delete copy.file_size;
              return copy;
            });
            request(`/${FILES_TABLE}`, {
              method: "POST",
              headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
              body: JSON.stringify(fallbackCh),
            }).catch(() => {});
          });
        }

        // Merge into local _filesCache
        uniqueFiles.forEach(payload => {
          const idx = _filesCache.findIndex(f => f.id === payload.id);
          if (idx >= 0) {
            _filesCache[idx] = { ..._filesCache[idx], ...payload };
          } else {
            _filesCache.push(payload);
          }
        });
        if (typeof window !== "undefined" && window.qapSupabase) {
          window.qapSupabase._filesCache = _filesCache;
        }
      }

      // Batch insert historyPayloads to CalibrationHistory
      if (historyPayloads.length > 0) {
        // Dedup history payloads by id or (codeNo + certNo)
        const seenH = new Set();
        const uniqueHist = [];
        for (const hp of historyPayloads) {
          const key = hp.id || `${hp.code_no}_${hp.cert_no}`;
          if (!seenH.has(key)) {
            seenH.add(key);
            uniqueHist.push(hp);
          }
        }

        // Chunk history upload
        const hChunks = [];
        for (let i = 0; i < uniqueHist.length; i += 50) {
          hChunks.push(uniqueHist.slice(i, i + 50));
        }
        if (_historyTableAvailable !== false) {
          for (const ch of hChunks) {
            const targetEp = _historyTableEndpoint || "/CalibrationHistory";
            try {
              await request(targetEp, {
                method: "POST",
                headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
                body: JSON.stringify(ch),
              });
              _historyTableAvailable = true;
              _historyTableEndpoint = targetEp;
            } catch (e1) {
              const err1 = String(e1 && e1.message ? e1.message : "");
              if (err1.includes("404") || err1.includes("PGRST205") || err1.includes("schema cache")) {
                try {
                  await request("/calibration_history", {
                    method: "POST",
                    headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
                    body: JSON.stringify(ch),
                  });
                  _historyTableAvailable = true;
                  _historyTableEndpoint = "/calibration_history";
                } catch (e2) {
                  _historyTableAvailable = false;
                }
              }
            }
          }
        }
      }
    } catch (err) {
      console.warn("[Supabase Sync] syncHistoryAndFilesOfInstruments failed:", err);
    }
  }

  // Helper to push items to a specific table in chunks
  async function pushToTable(tbl, items, tabType) {
    if (!Array.isArray(items) || items.length === 0) return 0;
    const formatted = items.map((it) => formatRow(it, tabType)).filter(Boolean);

    // Group chunks intelligently so that payload does not exceed 2.5MB per batch
    const chunks = [];
    let currentChunk = [];
    let currentBytes = 0;
    const MAX_CHUNK_BYTES = 2.5 * 1024 * 1024; // 2.5MB safe payload limit
    const MAX_CHUNK_COUNT = 80;

    for (const row of formatted) {
      const rowBytes = (row.pdf_url ? row.pdf_url.length : 0) + 1200;
      if (currentChunk.length >= MAX_CHUNK_COUNT || (currentBytes + rowBytes > MAX_CHUNK_BYTES && currentChunk.length > 0)) {
        chunks.push(currentChunk);
        currentChunk = [row];
        currentBytes = rowBytes;
      } else {
        currentChunk.push(row);
        currentBytes += rowBytes;
      }
    }
    if (currentChunk.length > 0) {
      chunks.push(currentChunk);
    }

    for (const chunk of chunks) {
      try {
        await request(`/${tbl}`, {
          method: "POST",
          headers: {
            Prefer: "resolution=merge-duplicates,return=minimal",
          },
          body: JSON.stringify(chunk),
          timeout: 45000,
        });
      } catch (chunkErr) {
        const msg = String(chunkErr && chunkErr.message ? chunkErr.message : chunkErr);
        if (msg.includes("does not exist") && (msg.includes("pdf_url") || msg.includes("cert_file_name") || msg.includes("file_size"))) {
          const fallbackChunk = chunk.map((r) => {
            const copy = { ...r };
            delete copy.pdf_url;
            delete copy.cert_file_name;
            delete copy.file_size;
            return copy;
          });
          await request(`/${tbl}`, {
            method: "POST",
            headers: {
              Prefer: "resolution=merge-duplicates,return=minimal",
            },
            body: JSON.stringify(fallbackChunk),
            timeout: 30000,
          });
        } else {
          throw chunkErr;
        }
      }
    }

    try {
      await syncHistoryAndFilesOfInstruments(items, tabType);
    } catch (syncErr) {
      console.warn("[Supabase Sync] syncHistoryAndFilesOfInstruments failed inside pushToTable:", syncErr);
    }

    return formatted.length;
  }

  // Safe upsert single row with fallback if remote table lacks pdf columns
  async function safeUpsertRow(tbl, row) {
    const codeNo = String(row.code_no || (row.data && row.data.codeNo) || "").trim();
    if (codeNo) {
      try {
        // Attempt updating existing row by code_no to preserve table-specific ID
        const patchRes = await request(`/${tbl}?code_no=eq.${encodeURIComponent(codeNo)}`, {
          method: "PATCH",
          headers: {
            Prefer: "return=representation",
          },
          body: JSON.stringify(row),
        });
        if (Array.isArray(patchRes) && patchRes.length > 0) {
          return patchRes;
        }
      } catch (patchErr) {
        const msg = String(patchErr && patchErr.message ? patchErr.message : patchErr);
        if (msg.includes("does not exist") && (msg.includes("pdf_url") || msg.includes("cert_file_name") || msg.includes("file_size"))) {
          const fallback = { ...row };
          delete fallback.pdf_url;
          delete fallback.cert_file_name;
          delete fallback.file_size;
          try {
            const pRes = await request(`/${tbl}?code_no=eq.${encodeURIComponent(codeNo)}`, {
              method: "PATCH",
              headers: { Prefer: "return=representation" },
              body: JSON.stringify(fallback),
            });
            if (Array.isArray(pRes) && pRes.length > 0) return pRes;
          } catch (e) {}
        }
      }
    }

    try {
      return await request(`/${tbl}`, {
        method: "POST",
        headers: {
          Prefer: "resolution=merge-duplicates,return=minimal",
        },
        body: JSON.stringify(row),
      });
    } catch (err) {
      const msg = String(err && err.message ? err.message : err);
      if (msg.includes("does not exist") && (msg.includes("pdf_url") || msg.includes("cert_file_name") || msg.includes("file_size"))) {
        const fallback = { ...row };
        delete fallback.pdf_url;
        delete fallback.cert_file_name;
        delete fallback.file_size;
        return await request(`/${tbl}`, {
          method: "POST",
          headers: {
            Prefer: "resolution=merge-duplicates,return=minimal",
          },
          body: JSON.stringify(fallback),
        });
      }
      throw err;
    }
  }

  // ----------------------------------------------------------
  // Exact Date Normalization & Matching Utilities (ISO/IEC 17025)
  // ----------------------------------------------------------
  function normalizeDateUniform(dateStr) {
    if (!dateStr) return "";
    const str = String(dateStr).trim();
    if (!str || str === "-" || str === "null" || str === "undefined") return "";

    // 1. Check YYYY-MM-DD
    const isoMatch = str.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
    if (isoMatch) {
      let y = parseInt(isoMatch[1], 10);
      const m = String(parseInt(isoMatch[2], 10)).padStart(2, "0");
      const d = String(parseInt(isoMatch[3], 10)).padStart(2, "0");
      if (y > 2400) y -= 543; // Buddhist Era conversion
      return `${y}-${m}-${d}`;
    }

    // 2. Check DD/MM/YYYY or DD-MM-YYYY
    const dmyMatch = str.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})/);
    if (dmyMatch) {
      const d = String(parseInt(dmyMatch[1], 10)).padStart(2, "0");
      const m = String(parseInt(dmyMatch[2], 10)).padStart(2, "0");
      let y = parseInt(dmyMatch[3], 10);
      if (y < 100) y = y < 50 ? 2000 + y : 1900 + y;
      if (y > 2400) y -= 543;
      return `${y}-${m}-${d}`;
    }

    // 3. Check English/Thai month names e.g. "20-Jun-26", "22-Sep-2026", "15 ม.ค. 2569"
    const monthMap = {
      jan: "01", feb: "02", mar: "03", apr: "04", may: "05", jun: "06",
      jul: "07", aug: "08", sep: "09", oct: "10", nov: "11", dec: "12",
      "ม.ค.": "01", "ก.พ.": "02", "มี.ค.": "03", "เม.ย.": "04", "พ.ค.": "05", "มิ.ย.": "06",
      "ก.ค.": "07", "ส.ค.": "08", "ก.ย.": "09", "ต.ค.": "10", "พ.ย.": "11", "ธ.ค.": "12",
      "มกราคม": "01", "กุมภาพันธ์": "02", "มีนาคม": "03", "เมษายน": "04", "พฤษภาคม": "05", "มิถุนายน": "06",
      "กรกฎาคม": "07", "สิงหาคม": "08", "กันยายน": "09", "ตุลาคม": "10", "พฤศจิกายน": "11", "ธันวาคม": "12"
    };

    const textMatch = str.match(/^(\d{1,2})[-/.\s]+([A-Za-zก-๙.]+)[-/.\s]+(\d{2,4})/);
    if (textMatch) {
      const d = String(parseInt(textMatch[1], 10)).padStart(2, "0");
      const mKey = textMatch[2].toLowerCase().replace(/[^a-zก-๙.]/g, "").substring(0, 3);
      const m = monthMap[mKey] || monthMap[textMatch[2].toLowerCase()] || "01";
      let y = parseInt(textMatch[3], 10);
      if (y < 100) y = y < 50 ? 2000 + y : 1900 + y;
      if (y > 2400) y -= 543;
      return `${y}-${m}-${d}`;
    }

    // 4. Check Excel numeric serial date (e.g. 45000)
    if (/^\d{5}$/.test(str)) {
      const serial = parseInt(str, 10);
      const dateObj = new Date((serial - 25569) * 86400 * 1000);
      if (!isNaN(dateObj.getTime())) {
        const y = dateObj.getUTCFullYear();
        const m = String(dateObj.getUTCMonth() + 1).padStart(2, "0");
        const d = String(dateObj.getUTCDate()).padStart(2, "0");
        return `${y}-${m}-${d}`;
      }
    }

    // 5. Fallback date parse
    const parsed = new Date(str);
    if (!isNaN(parsed.getTime())) {
      const y = parsed.getFullYear();
      const m = String(parsed.getMonth() + 1).padStart(2, "0");
      const d = String(parsed.getDate()).padStart(2, "0");
      return `${y}-${m}-${d}`;
    }

    return str;
  }

  function isSameDate(d1, d2) {
    if (!d1 && !d2) return true;
    if (!d1 || !d2) return false;
    const n1 = normalizeDateUniform(d1);
    const n2 = normalizeDateUniform(d2);
    return n1 === n2 || String(d1).trim().toLowerCase() === String(d2).trim().toLowerCase();
  }

  // ----------------------------------------------------------
  // Dedicated File Storage & Decoupled Linker (qap_files)
  // แยกเก็บไฟล์ PDF ลงตาราง qap_files ต่างหาก ไม่เก็บซ้ำซ้อนใน data (JSONB)
  // ----------------------------------------------------------

  // Save single file record to qap_files table
  async function saveFileRecord({
    instrumentId,
    codeNo,
    certNo = "",
    calDate = "",
    fileName = "",
    fileSize = 0,
    fileUrl = "",
    tabType = "calibration_all",
  } = {}) {
    if (!isConfigured() || !config.autoSync || !fileUrl) return { ok: false, skipped: true };
    try {
      const cleanInstId = String(instrumentId || "").trim();
      const cleanCodeNo = String(codeNo || "").trim();
      const cleanCertNo = String(certNo || "").trim();
      const normDate = normalizeDateUniform(calDate);
      const certSlug = cleanCertNo ? cleanCertNo.replace(/[^a-zA-Z0-9_-]/g, "_") : (normDate ? normDate.replace(/[^0-9]/g, "") : "");
      const fileId = `file_${cleanCodeNo ? cleanCodeNo.replace(/[^a-zA-Z0-9_-]/g, "_") : (cleanInstId || Date.now())}${certSlug ? "_" + certSlug : ""}`;

      const payload = {
        id: fileId,
        instrument_id: cleanInstId || null,
        code_no: cleanCodeNo,
        cert_no: cleanCertNo,
        file_name: String(fileName || "").trim(),
        file_size: parseByteSize(fileSize),
        file_url: String(fileUrl).trim(),
        tab_type: String(tabType || "calibration_all"),
        updated_at: new Date().toISOString(),
      };

      const sendPayload = async (dataObj) => {
        try {
          await request(`/${FILES_TABLE}`, {
            method: "POST",
            headers: {
              Prefer: "resolution=merge-duplicates,return=minimal",
            },
            body: JSON.stringify(dataObj),
          });
        } catch (postErr) {
          const errMsg = String(postErr.message || "");
          const match = errMsg.match(/Could not find the '([^']+)' column/);
          if (match && match[1] && dataObj[match[1]] !== undefined) {
            const retryObj = { ...dataObj };
            delete retryObj[match[1]];
            await request(`/${FILES_TABLE}`, {
              method: "POST",
              headers: {
                Prefer: "resolution=merge-duplicates,return=minimal",
              },
              body: JSON.stringify(retryObj),
            });
            return;
          }
          throw postErr;
        }
      };

      await sendPayload(payload);

      // In-memory representation retains cal_date for ultra-accurate client-side linking
      const cacheObj = { ...payload, cal_date: normDate || null };

      // Update in-memory _filesCache in real time
      const existingIdx = _filesCache.findIndex(f => f.id === payload.id || (
        f.code_no && payload.code_no && f.code_no.trim().toUpperCase() === payload.code_no.trim().toUpperCase() &&
        f.cert_no && payload.cert_no && f.cert_no.trim().toUpperCase() === payload.cert_no.trim().toUpperCase()
      ));
      if (existingIdx >= 0) {
        _filesCache[existingIdx] = { ..._filesCache[existingIdx], ...payload };
      } else {
        _filesCache.push(payload);
      }
      if (typeof window !== "undefined" && window.qapSupabase) {
        window.qapSupabase._filesCache = _filesCache;
      }

      // Update _historyCache for this instrument referencing exact cert and date
      const histLists = [];
      if (cleanCodeNo && _historyCache.has(cleanCodeNo)) histLists.push(_historyCache.get(cleanCodeNo));
      if (cleanInstId && _historyCache.has(cleanInstId)) histLists.push(_historyCache.get(cleanInstId));
      histLists.forEach(hist => {
        if (Array.isArray(hist)) {
          const certSearch = cleanCertNo.toUpperCase();
          hist.forEach(h => {
            const hCert = String(h.certNo || h.cert_no || "").trim().toUpperCase();
            const dateMatch = normDate && isSameDate(h.calDate || h.cal_date, normDate);
            if ((certSearch && hCert === certSearch) || (dateMatch && !h.pdfUrl) || (hist.length === 1 && !h.pdfUrl)) {
              h.pdfUrl = payload.file_url;
              h.certFileName = payload.file_name || h.certFileName;
              h.fileSize = payload.file_size || h.fileSize;
            }
          });
        }
      });

      return { ok: true, fileId };
    } catch (err) {
      console.warn("[Supabase File Sync] Save file record failed:", err);
      return { ok: false, error: err.message };
    }
  }

  // Delete file record from qap_files table
  async function deleteFileRecord(instIdOrOpts, codeNoArg, fileIdArg, certNoArg) {
    let instrumentId = "";
    let codeNo = "";
    let fileId = "";
    let certNo = "";
    let fileUrl = "";

    if (instIdOrOpts && typeof instIdOrOpts === "object") {
      instrumentId = String(instIdOrOpts.instrumentId || instIdOrOpts.instrument_id || instIdOrOpts.id || "").trim();
      codeNo = String(instIdOrOpts.codeNo || instIdOrOpts.code_no || "").trim();
      fileId = String(instIdOrOpts.fileId || instIdOrOpts.file_id || "").trim();
      certNo = String(instIdOrOpts.certNo || instIdOrOpts.cert_no || "").trim();
      fileUrl = String(instIdOrOpts.fileUrl || instIdOrOpts.file_url || "").trim();
    } else {
      instrumentId = String(instIdOrOpts || "").trim();
      codeNo = String(codeNoArg || "").trim();
      fileId = String(fileIdArg || "").trim();
      certNo = String(certNoArg || "").trim();
    }

    try {
      // Clean up in-memory _filesCache
      _filesCache = _filesCache.filter(f => {
        if (fileId && f.id === fileId) return false;
        if (fileUrl && (f.file_url === fileUrl || f.url === fileUrl)) return false;
        if (certNo && f.cert_no && String(f.cert_no).trim().toUpperCase() === certNo.toUpperCase()) {
          if (!codeNo && !instrumentId) return false;
          if (codeNo && f.code_no && String(f.code_no).trim().toUpperCase() === codeNo.toUpperCase()) return false;
          if (instrumentId && f.instrument_id && String(f.instrument_id).trim() === instrumentId) return false;
        }
        if (!certNo && !fileId && !fileUrl) {
          if (instrumentId && f.instrument_id === instrumentId) return false;
          if (codeNo && f.code_no && String(f.code_no).trim().toUpperCase() === codeNo.toUpperCase()) return false;
        }
        return true;
      });
      if (typeof window !== "undefined" && window.qapSupabase) {
        window.qapSupabase._filesCache = _filesCache;
      }

      if (!isConfigured() || !config.autoSync) return { ok: true };

      const deleteCalls = [];
      if (fileId) {
        deleteCalls.push(request(`/${FILES_TABLE}?id=eq.${encodeURIComponent(fileId)}`, {
          method: "DELETE",
          headers: { Prefer: "return=minimal" },
        }).catch(() => {}));
      }
      if (certNo && (codeNo || instrumentId)) {
        const cParam = codeNo ? `&code_no=eq.${encodeURIComponent(codeNo)}` : "";
        deleteCalls.push(request(`/${FILES_TABLE}?cert_no=eq.${encodeURIComponent(certNo)}${cParam}`, {
          method: "DELETE",
          headers: { Prefer: "return=minimal" },
        }).catch(() => {}));
      }
      if (!certNo && !fileId && !fileUrl) {
        if (instrumentId) {
          const cleanInstId = String(instrumentId).trim();
          deleteCalls.push(request(`/${FILES_TABLE}?instrument_id=eq.${encodeURIComponent(cleanInstId)}`, {
            method: "DELETE",
            headers: { Prefer: "return=minimal" },
          }).catch(() => {}));
          const fileIdInst = `file_${cleanInstId.replace(/[^a-zA-Z0-9_-]/g, "_")}`;
          deleteCalls.push(request(`/${FILES_TABLE}?id=eq.${encodeURIComponent(fileIdInst)}`, {
            method: "DELETE",
            headers: { Prefer: "return=minimal" },
          }).catch(() => {}));
        }
        if (codeNo) {
          const cleanCode = String(codeNo).trim();
          deleteCalls.push(request(`/${FILES_TABLE}?code_no=eq.${encodeURIComponent(cleanCode)}`, {
            method: "DELETE",
            headers: { Prefer: "return=minimal" },
          }).catch(() => {}));
          const fileIdCode = `file_${cleanCode.replace(/[^a-zA-Z0-9_-]/g, "_")}`;
          deleteCalls.push(request(`/${FILES_TABLE}?id=eq.${encodeURIComponent(fileIdCode)}`, {
            method: "DELETE",
            headers: { Prefer: "return=minimal" },
          }).catch(() => {}));
        }
      }
      await Promise.all(deleteCalls);
      return { ok: true };
    } catch (err) {
      console.warn("[Supabase File Sync] Delete file record failed:", err);
      return { ok: false, error: err.message };
    }
  }

  // Pull all file records from qap_files table
  async function pullFilesFromSupabase() {
    if (!isConfigured()) return [];
    try {
      const rows = await request(`/${FILES_TABLE}?select=*&limit=5000`, { method: "GET" });
      return Array.isArray(rows) ? rows : [];
    } catch (err) {
      console.warn("[Supabase File Sync] Pull files failed (table may not exist yet):", err && err.message);
      return [];
    }
  }

  // Client-side dynamic linker: links instruments with files from qap_files
  // ใช้หน้าเวปเป็นตัวดึงข้อมูล แล้วเชื่อมข้อมูลให้ตรงตามรายการโดยอ้างอิงจากวันที่และเลขที่ใบรับรองอย่างละเอียด
  function linkFilesToInstruments(instruments = [], fileRows = []) {
    if (!Array.isArray(instruments) || instruments.length === 0) return instruments;
    if (!Array.isArray(fileRows)) fileRows = [];

    const fileByCertNo = new Map();
    const filesByCodeNo = new Map();
    const fileByInstId = new Map();

    for (const f of fileRows) {
      if (!f) continue;
      const cNo = f.code_no ? String(f.code_no).trim().toUpperCase() : "";
      const certNo = f.cert_no ? String(f.cert_no).trim().toUpperCase() : "";
      const instId = f.instrument_id ? String(f.instrument_id).trim() : "";

      if (certNo) fileByCertNo.set(certNo, f);
      if (instId) fileByInstId.set(instId, f);
      if (cNo) {
        if (!filesByCodeNo.has(cNo)) filesByCodeNo.set(cNo, []);
        filesByCodeNo.get(cNo).push(f);
      }
    }

    for (const inst of instruments) {
      if (!inst) continue;
      const instId = String(inst.id || "").trim();
      const codeNo = String(inst.codeNo || inst.code_no || "").trim().toUpperCase();
      const certNo = String(inst.certNo || inst.cert_no || "").trim().toUpperCase();
      const codeFiles = (codeNo ? filesByCodeNo.get(codeNo) : null) || (instId ? [fileByInstId.get(instId)].filter(Boolean) : []);

      const usedFiles = new Set();

      // Link each cycle in history to its exact matching certificate or date
      const linkList = (list) => {
        if (!Array.isArray(list) || list.length === 0) return;
        const sorted = [...list].sort((a, b) => new Date(normalizeDateUniform(b.calDate || b.cal_date || 0)).getTime() - new Date(normalizeDateUniform(a.calDate || a.cal_date || 0)).getTime());
        const latest = sorted[0];

        for (const h of sorted) {
          if (!h) continue;
          if (h.pdfUrl || h.certFileData) {
            continue; // Already has file attached
          }
          const hCert = String(h.certNo || h.cert_no || "").trim().toUpperCase();
          const hDate = normalizeDateUniform(h.calDate || h.cal_date);

          let matched = null;
          if (hCert) {
            matched = codeFiles.find(cf => !usedFiles.has(cf.id || cf.file_url) && cf.cert_no && String(cf.cert_no).trim().toUpperCase() === hCert) || fileByCertNo.get(hCert);
          }
          if (!matched && hDate) {
            matched = codeFiles.find(cf => !usedFiles.has(cf.id || cf.file_url) && cf.cal_date && isSameDate(cf.cal_date, hDate));
          }
          if (!matched && codeFiles.length > 0) {
            matched = codeFiles.find(cf => !usedFiles.has(cf.id || cf.file_url));
          }

          if (matched) {
            usedFiles.add(matched.id || matched.file_url);
            h.pdfUrl = matched.file_url || h.pdfUrl;
            h.certFileData = matched.file_url || h.certFileData;
            h.certFileName = matched.file_name || h.certFileName;
            h.fileSize = matched.file_size || h.fileSize;
          }
        }
      };

      linkList(inst.history);
      linkList(inst.calibrationHistory);

      // Now set top-level instrument file based on top/latest calibration cycle
      const instHistory = (Array.isArray(inst.calibrationHistory) && inst.calibrationHistory.length > 0)
        ? inst.calibrationHistory
        : (Array.isArray(inst.history) && inst.history.length > 0 ? inst.history : []);

      const sortedHist = [...instHistory].sort((a, b) => new Date(normalizeDateUniform(b.calDate || b.cal_date || 0)).getTime() - new Date(normalizeDateUniform(a.calDate || a.cal_date || 0)).getTime());
      const topCycle = sortedHist[0];

      if (topCycle && (topCycle.pdfUrl || topCycle.certFileData)) {
        inst.pdfUrl = topCycle.pdfUrl || topCycle.certFileData;
        inst.certFileData = topCycle.pdfUrl || topCycle.certFileData;
        inst.certFileName = topCycle.certFileName || inst.certFileName || null;
        inst.fileSize = topCycle.fileSize || inst.fileSize || null;
      } else if (!inst.pdfUrl && !inst.certFileData) {
        const directFile = (certNo ? fileByCertNo.get(certNo) : null) || (codeFiles.length > 0 ? codeFiles[0] : null) || (instId ? fileByInstId.get(instId) : null);
        if (directFile) {
          inst.pdfUrl = directFile.file_url;
          inst.certFileData = directFile.file_url;
          inst.certFileName = directFile.file_name;
          inst.fileSize = directFile.file_size;
        }
      }
    }

    return instruments;
  }

  // Helper to pull all items from a specific table
  async function pullFromTable(tbl, shouldLinkFiles = true) {
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

      const parsedItems = allRows.map((r, idx) => {
        const parsed = parseRow(r, tbl.replace("qap_", ""));
        if (parsed && (!parsed.no || parsed.no <= 0)) {
          parsed.no = idx + 1;
        }
        return parsed;
      }).filter(Boolean);

      if (shouldLinkFiles) {
        const fileRows = await pullFilesFromSupabase();
        if (Array.isArray(fileRows) && fileRows.length > 0) {
          linkFilesToInstruments(parsedItems, fileRows);
        }
      }

      return parsedItems;
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

      // Also batch save files to qap_files
      const allItems = [...all, ...normalStandard, ...centralized, ...eachSection, ...cancel];
      for (const it of allItems) {
        if (it && (it.pdfUrl || it.certFileData)) {
          saveFileRecord({
            instrumentId: it.id,
            codeNo: it.codeNo,
            certNo: it.certNo,
            fileName: it.certFileName,
            fileSize: it.fileSize,
            fileUrl: it.pdfUrl || it.certFileData,
            tabType: it.tabType,
          }).catch(() => {});
        }
      }

      const totalCount = Object.values(counts).reduce((a, b) => a + b, 0);

      saveConfig({
        status: "connected",
        lastSync: new Date().toISOString(),
        lastError: null,
      });

      emitToast(`☁️ สำรองข้อมูลแยก 5 ตารางและตารางไฟล์สำเร็จทั้งหมด (${totalCount} รายการ)`, "success");

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

  // 3. Pull All 5 Pages from their respective 5 tables and link files from qap_files
  async function pullAll() {
    if (!isConfigured()) {
      return { ok: false, message: "ยังไม่ได้ตั้งค่า Supabase" };
    }

    try {
      emitStatus({ status: "syncing" });

      const [all, normalStandard, centralized, eachSection, cancel, fileRows] = await Promise.all([
        pullFromTable(PAGE_TABLES.calibration_all, false),
        pullFromTable(PAGE_TABLES.normal_standard, false),
        pullFromTable(PAGE_TABLES.centralized, false),
        pullFromTable(PAGE_TABLES.each_section, false),
        pullFromTable(PAGE_TABLES.cancel, false),
        pullFilesFromSupabase(),
      ]);

      // Dynamically link files to instruments on the webpage
      _filesCache = Array.isArray(fileRows) ? fileRows : [];
      if (typeof window !== "undefined" && window.qapSupabase) {
        window.qapSupabase._filesCache = _filesCache;
      }

      if (_filesCache.length > 0) {
        linkFilesToInstruments(all, _filesCache);
        linkFilesToInstruments(normalStandard, _filesCache);
        linkFilesToInstruments(centralized, _filesCache);
        linkFilesToInstruments(eachSection, _filesCache);
        linkFilesToInstruments(cancel, _filesCache);
      }

      // Preload Calibration Histories in the background to ensure instant clicks later
      const allInstruments = [...all, ...normalStandard, ...centralized, ...eachSection, ...cancel];
      try {
        await preloadCalibrationHistory(_filesCache, allInstruments);
      } catch (historyErr) {
        console.warn("[Supabase Pull] Failed to preload histories:", historyErr);
      }

      const totalCount = all.length + normalStandard.length + centralized.length + eachSection.length + cancel.length;

      saveConfig({
        status: "connected",
        lastSync: new Date().toISOString(),
        lastError: null,
      });

      const fileNote = fileRows.length > 0 ? ` พร้อมเชื่อมโยง ${fileRows.length} ไฟล์` : "";
      emitToast(`📥 ซิงก์ข้อมูลแยก 5 ตารางจาก Supabase สำเร็จ (${totalCount} รายการ${fileNote})`, "success");

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

  // 3.5 Preload ALL Calibration History records into memory cache for instant loads
  async function preloadCalibrationHistory(fileRows = [], allInstruments = []) {
    if (!isConfigured()) return;
    try {
      if (Array.isArray(fileRows) && fileRows.length > 0) {
        _filesCache = fileRows;
        if (typeof window !== "undefined" && window.qapSupabase) {
          window.qapSupabase._filesCache = _filesCache;
        }
      }
      let rawRecords = [];
      if (_historyTableAvailable !== false) {
        const endpoints = _historyTableEndpoint 
          ? [_historyTableEndpoint + "?order=cal_date.desc,created_at.desc&limit=10000"]
          : [
              "/CalibrationHistory?order=cal_date.desc,created_at.desc&limit=10000",
              "/calibration_history?order=cal_date.desc,created_at.desc&limit=10000"
            ];
        for (const ep of endpoints) {
          try {
            const res = await request(ep);
            if (Array.isArray(res)) {
              rawRecords = res;
              _historyTableAvailable = true;
              _historyTableEndpoint = ep.split("?")[0];
              break;
            }
          } catch (e) {
            const errStr = String(e && e.message ? e.message : "");
            if (errStr.includes("404") || errStr.includes("PGRST205") || errStr.includes("schema cache")) {
              _historyTableAvailable = false;
            }
          }
        }
      }

      _historyCache.clear();

      // Collect records grouped by code_no
      const codeRecordsMap = new Map();

      const addRecordToCode = (code, rec) => {
        if (!code || !rec) return;
        const cKey = String(code).trim();
        if (!cKey) return;
        if (!codeRecordsMap.has(cKey)) codeRecordsMap.set(cKey, []);
        const list = codeRecordsMap.get(cKey);
        // Avoid duplicate by id or (calDate + certNo)
        const isDup = list.some(item => (rec.id && item.id && item.id === rec.id) || (item.calDate === rec.calDate && item.certNo === rec.certNo));
        if (!isDup) {
          list.push(rec);
        }
      };

      if (rawRecords.length > 0) {
        rawRecords.forEach((r, i) => {
          const codeNo = String(r.code_no || r.codeNo || "").trim();
          const instId = String(r.instrument_id || r.instrumentId || "").trim();
          
          const rec = {
            id: r.id || `hist_${i}`,
            instrumentId: r.instrument_id || r.instrumentId || instId,
            codeNo: r.code_no || r.codeNo || codeNo,
            certNo: r.cert_no || r.certNo || `CERT-${codeNo || i + 1}`,
            calDate: r.cal_date || r.calDate || "",
            dueDate: r.due_date || r.dueDate || r.next_due_date || "",
            calibratedBy: r.calibrated_by || r.calibratedBy || r.labCal || "-",
            result: (r.result || "PASS").toUpperCase(),
            accuracy: r.accuracy || "",
            notes: r.notes || r.remark || r.remarks || "",
            pdfUrl: r.pdf_url || r.pdfUrl || null,
            certFileName: r.cert_file_name || r.certFileName || null,
            fileSize: r.file_size || r.fileSize || null,
            createdAt: r.created_at || r.createdAt || null,
            sourceTable: "CalibrationHistory (Preloaded)",
          };

          if (codeNo) addRecordToCode(codeNo, rec);
        });
      }

      // Merge and complement records using allInstruments from page tables
      if (Array.isArray(allInstruments) && allInstruments.length > 0) {
        allInstruments.forEach((inst) => {
          if (!inst) return;
          const codeNo = String(inst.codeNo || inst.code_no || "").trim();
          const instId = String(inst.id || "").trim();
          if (!codeNo && !instId) return;

          const rawHist = (Array.isArray(inst.calibrationHistory) && inst.calibrationHistory.length > 0)
            ? inst.calibrationHistory
            : (Array.isArray(inst.history) && inst.history.length > 0)
            ? inst.history
            : [];

          if (rawHist.length > 0) {
            rawHist.forEach((h, i) => {
              const rec = {
                id: h.id || `hist_${instId || codeNo}_${i}`,
                instrumentId: instId,
                codeNo: codeNo,
                certNo: h.certNo || h.cert_no || inst.certNo || `CERT-${codeNo || i + 1}`,
                calDate: h.calDate || h.cal_date || "",
                dueDate: h.dueDate || h.due_date || "",
                calibratedBy: h.calibratedBy || h.calibrated_by || inst.labCal || inst.calibratedBy || "-",
                result: (h.result || "PASS").toUpperCase(),
                accuracy: h.accuracy || inst.accuracy || "",
                notes: h.notes || h.remarks || h.remark || "",
                pdfUrl: h.pdfUrl || h.certFileData || null,
                certFileName: h.certFileName || null,
                fileSize: h.fileSize || null,
                createdAt: h.createdAt || null,
              };
              if (codeNo) addRecordToCode(codeNo, rec);
            });
          } else if (inst.calDate || inst.certNo || inst.pdfUrl || inst.certFileData) {
            const baseRec = {
              id: `curr_${instId || codeNo}`,
              instrumentId: instId,
              codeNo: codeNo,
              certNo: inst.certNo || `CERT-${codeNo || "1"}`,
              calDate: inst.calDate || inst.cal_date || "",
              dueDate: inst.dueDate || inst.due_date || "",
              calibratedBy: inst.labCal || inst.calibratedBy || "-",
              result: "PASS",
              accuracy: inst.accuracy || "",
              notes: inst.notes || "",
              pdfUrl: inst.pdfUrl || inst.certFileData || null,
              certFileName: inst.certFileName || null,
              fileSize: inst.fileSize || null,
              createdAt: null,
            };
            if (codeNo) addRecordToCode(codeNo, baseRec);
          }
        });

        // Link files from _filesCache and sort each code's history
        for (const [cKey, recs] of codeRecordsMap.entries()) {
          recs.sort((a, b) => new Date(b.calDate || 0).getTime() - new Date(a.calDate || 0).getTime());
          const latestRec = recs[0];
          const usedPreloadKeys = new Set();

          recs.forEach(rec => {
            if (rec.pdfUrl) return;
            if (Array.isArray(_filesCache) && _filesCache.length > 0) {
              const recCert = String(rec.certNo || "").trim().toUpperCase();
              let matched = null;
              if (rec === latestRec || recs.length === 1) {
                matched = _filesCache.find(f => {
                  const fKey = f.id || f.file_url;
                  if (usedPreloadKeys.has(fKey)) return false;
                  return (recCert && String(f.cert_no || "").trim().toUpperCase() === recCert) ||
                    (cKey && String(f.code_no || "").trim().toUpperCase() === cKey.toUpperCase());
                });
              } else if (_filesCache.length > 1 && recCert) {
                matched = _filesCache.find(f => {
                  const fKey = f.id || f.file_url;
                  return !usedPreloadKeys.has(fKey) && String(f.cert_no || "").trim().toUpperCase() === recCert;
                });
              }
              if (matched) {
                usedPreloadKeys.add(matched.id || matched.file_url);
                rec.pdfUrl = matched.file_url;
                rec.certFileName = matched.file_name || rec.certFileName;
                rec.fileSize = matched.file_size || rec.fileSize;
              }
            }
          });
          _historyCache.set(cKey, recs);
        }

        // Apply unified history and synchronized calibration fields across EVERY instrument in memory
        allInstruments.forEach((inst) => {
          if (!inst) return;
          const codeNo = String(inst.codeNo || inst.code_no || "").trim();
          const instId = String(inst.id || "").trim();
          const unified = codeRecordsMap.get(codeNo) || [];
          if (instId) {
            _historyCache.set(instId, unified);
          }
          inst.history = [...unified];
          inst.calibrationHistory = [...unified];
          if (unified.length > 0) {
            const latest = unified[0];
            if (latest.calDate && (!inst.calDate || inst.calDate === "-")) inst.calDate = latest.calDate;
            if (latest.dueDate && (!inst.dueDate || inst.dueDate === "-")) inst.dueDate = latest.dueDate;
            if (latest.certNo && (!inst.certNo || inst.certNo === "-")) inst.certNo = latest.certNo;
            if (latest.calibratedBy && (!inst.calibratedBy || inst.calibratedBy === "-")) inst.calibratedBy = latest.calibratedBy;
            if (latest.pdfUrl && !inst.pdfUrl) inst.pdfUrl = latest.pdfUrl;
            if (latest.certFileName && !inst.certFileName) inst.certFileName = latest.certFileName;
          }
        });
      }

      console.log(`[Supabase Preloader] Unified and cached calibration history for ${_historyCache.size} instruments/codes`);
    } catch (err) {
      console.warn("[Supabase Preloader] Failed to preload calibration history:", err);
    }
  }

  // 4. Realtime Single Instrument Upsert to dedicated table and master list
  async function upsertInstrument(inst, tabType = "calibration_all") {
    if (!isConfigured() || !config.autoSync) return { ok: false, skipped: true };
    try {
      const isCancel = (inst.category || "").trim().toUpperCase() === "CANCEL" ||
        String(inst.status || "").toLowerCase().trim() === "inactive" ||
        String(inst.status || "").toLowerCase().trim() === "cancel" ||
        String(inst.status || "").includes("ปลดระวาง") ||
        tabType === "cancel" ||
        tabType === "qap_cancel";

      const effectiveTab = isCancel ? "cancel" : tabType;
      const targetTable = getTableForPage(effectiveTab);
      const row = formatRow({
        ...inst,
        category: isCancel ? "CANCEL" : (inst.category || (effectiveTab === "centralized" ? "CENTRALIZED" : effectiveTab === "each_section" ? "EACH SECTION" : "NORMAL STANDARD")),
        status: isCancel ? (inst.status || "inactive") : (inst.status || "normal")
      }, effectiveTab);

      if (!row) return { ok: false, message: "Invalid instrument data" };

      // Save all cycle files and root file to qap_files separately
      const rawHist = Array.isArray(inst.calibrationHistory) && inst.calibrationHistory.length > 0
        ? inst.calibrationHistory
        : Array.isArray(inst.history) && inst.history.length > 0
        ? inst.history
        : [];

      for (const h of rawHist) {
        if (h && (h.pdfUrl || h.certFileData)) {
          await saveFileRecord({
            instrumentId: inst.id,
            codeNo: inst.codeNo,
            certNo: h.certNo || inst.certNo,
            calDate: h.calDate || h.cal_date || inst.calDate,
            fileName: h.certFileName || inst.certFileName,
            fileSize: h.fileSize || inst.fileSize,
            fileUrl: h.pdfUrl || h.certFileData,
            tabType: effectiveTab,
          }).catch(() => {});
        }
      }

      if (inst.pdfUrl || inst.certFileData) {
        await saveFileRecord({
          instrumentId: inst.id,
          codeNo: inst.codeNo,
          certNo: inst.certNo,
          calDate: inst.calDate,
          fileName: inst.certFileName,
          fileSize: inst.fileSize,
          fileUrl: inst.pdfUrl || inst.certFileData,
          tabType: effectiveTab,
        }).catch(err => console.warn("[Supabase Sync] File record save warning:", err));
      }

      // Save instrument row with clean data jsonb
      await safeUpsertRow(targetTable, row);

      if (isCancel || targetTable === PAGE_TABLES.cancel) {
        // When cancelled, remove from ALL active tables in database
        for (const tbl of [PAGE_TABLES.calibration_all, PAGE_TABLES.normal_standard, PAGE_TABLES.centralized, PAGE_TABLES.each_section]) {
          request(`/${tbl}?id=eq.${encodeURIComponent(row.id)}`, {
            method: "DELETE",
            headers: { Prefer: "return=minimal" },
          }).catch(() => {});
        }
      } else {
        // Also ensure Master List (qap_calibration_all) stays synchronized if not already target
        if (targetTable !== PAGE_TABLES.calibration_all) {
          await safeUpsertRow(PAGE_TABLES.calibration_all, row).catch(() => {});
        } else {
          // If targetTable is calibration_all, find its category table and sync it too
          const cat = (inst.category || "").toUpperCase();
          const catTab = cat === "CENTRALIZED" ? PAGE_TABLES.centralized
            : cat === "EACH SECTION" ? PAGE_TABLES.each_section
            : cat === "NORMAL STANDARD" ? PAGE_TABLES.normal_standard
            : cat === "CANCEL" ? PAGE_TABLES.cancel : null;
          if (catTab) {
            await safeUpsertRow(catTab, row).catch(() => {});
          }
        }
        // Remove from cancel table if active
        request(`/${PAGE_TABLES.cancel}?id=eq.${encodeURIComponent(row.id)}`, {
          method: "DELETE",
          headers: { Prefer: "return=minimal" },
        }).catch(() => {});
      }

      saveConfig({ lastSync: new Date().toISOString(), status: "connected" });
      const pdfNote = hasPdf ? " (บันทึกไฟล์ลงตาราง qap_files แยกต่างหาก)" : "";
      const actionMsg = isCancel ? "ย้ายไปตาราง qap_cancel และลบออกจากตารางใช้งานปกติในฐานข้อมูล" : `ซิงก์บันทึกลงตาราง ${targetTable}`;
      emitToast(`☁️ ${actionMsg}: ${inst.codeNo || inst.instrumentName || ""}${pdfNote}`, "success");
      return { ok: true };
    } catch (err) {
      console.warn("[Supabase Sync] Upsert failed:", err);
      return { ok: false, error: err.message };
    }
  }

  // Helper: Move single or multiple instruments to cancel in database
  async function moveToCancel(instrumentOrItems) {
    if (!isConfigured() || !config.autoSync || !instrumentOrItems) return { ok: false, skipped: true };
    try {
      const items = Array.isArray(instrumentOrItems) ? instrumentOrItems : [instrumentOrItems];
      if (items.length === 0) return { ok: true, count: 0 };
      const cancelItems = items.map(x => ({
        ...x,
        category: "CANCEL",
        status: "inactive"
      }));

      // 1. Upsert into qap_cancel
      await upsertInstruments(cancelItems, "cancel");

      // 2. Delete from active tables in database
      const idStrings = cancelItems.map(x => (x && x.id ? String(x.id).trim() : "")).filter(Boolean);
      if (idStrings.length > 0) {
        await deleteInstruments(idStrings, "calibration_all");
        await deleteInstruments(idStrings, "normal_standard");
        await deleteInstruments(idStrings, "centralized");
        await deleteInstruments(idStrings, "each_section");
      }

      emitToast(`☁️ บันทึกลงฐานข้อมูล qap_cancel และลบออกจากตาราง ALL เรียบร้อย (${cancelItems.length} รายการ)`, "success");
      return { ok: true, count: cancelItems.length };
    } catch (err) {
      console.warn("[Supabase Sync] Move to cancel failed:", err);
      return { ok: false, error: err.message };
    }
  }

  // 5. Delete single instrument from its dedicated table, master list, and qap_files
  async function deleteInstrument(arg1, arg2 = "calibration_all", codeNo = "") {
    if (!isConfigured() || !config.autoSync || !arg1) return { ok: false, skipped: true };
    try {
      const knownTables = ["calibration_all", "normal_standard", "centralized", "each_section", "cancel", "qap_calibration_all", "qap_normal_standard", "qap_centralized", "qap_each_section", "qap_cancel", "all"];
      let cleanId = "";
      let tabType = "calibration_all";
      let cleanCode = codeNo || "";

      if (typeof arg1 === "string" && knownTables.includes(arg1.toLowerCase()) && typeof arg2 === "string" && !knownTables.includes(arg2.toLowerCase())) {
        tabType = arg1;
        cleanId = arg2;
      } else {
        cleanId = typeof arg1 === "object" ? String(arg1.id || "") : String(arg1);
        tabType = typeof arg2 === "string" ? arg2 : "calibration_all";
        cleanCode = typeof arg1 === "object" ? String(arg1.codeNo || "") : String(codeNo || "");
      }

      const targetTable = getTableForPage(tabType);

      // Clean file record from qap_files
      await deleteFileRecord(cleanId, cleanCode).catch(() => {});

      await request(`/${targetTable}?id=eq.${encodeURIComponent(cleanId)}`, {
        method: "DELETE",
        headers: { Prefer: "return=minimal" },
      });

      if (targetTable !== PAGE_TABLES.calibration_all) {
        await request(`/${PAGE_TABLES.calibration_all}?id=eq.${encodeURIComponent(cleanId)}`, {
          method: "DELETE",
          headers: { Prefer: "return=minimal" },
        }).catch(() => {});
      } else {
        // If deleting from calibration_all, also clean from all child tables
        for (const tbl of [PAGE_TABLES.normal_standard, PAGE_TABLES.centralized, PAGE_TABLES.each_section, PAGE_TABLES.cancel]) {
          request(`/${tbl}?id=eq.${encodeURIComponent(cleanId)}`, {
            method: "DELETE",
            headers: { Prefer: "return=minimal" },
          }).catch(() => {});
        }
      }

      saveConfig({ lastSync: new Date().toISOString(), status: "connected" });
      emitToast(`☁️ ลบออกจากฐานข้อมูลตาราง ${targetTable} แล้ว`, "info");
      return { ok: true };
    } catch (err) {
      console.warn("[Supabase Sync] Delete failed:", err);
      return { ok: false, error: err.message };
    }
  }

  // 6. Delete multiple instruments (Batch Delete with safe chunking and error resilience)
  async function deleteInstruments(ids, tabType = "calibration_all") {
    if (!isConfigured() || !config.autoSync || !Array.isArray(ids) || ids.length === 0) {
      return { ok: false, skipped: true };
    }
    try {
      const targetTable = getTableForPage(tabType);
      // Clean file records from qap_files
      for (const item of ids) {
        const cleanId = typeof item === "object" ? String(item.id || "") : String(item);
        const cleanCode = typeof item === "object" ? String(item.codeNo || "") : "";
        deleteFileRecord(cleanId, cleanCode).catch(() => {});
      }

      const idStrings = ids
        .map((item) => (typeof item === "object" ? String(item.id || "") : String(item)))
        .map((id) => id.trim())
        .filter(Boolean);

      if (idStrings.length === 0) return { ok: true, count: 0 };

      // Chunk in batches of 40 to avoid HTTP 414 URI Too Long errors
      const CHUNK_SIZE = 40;
      for (let i = 0; i < idStrings.length; i += CHUNK_SIZE) {
        const chunk = idStrings.slice(i, i + CHUNK_SIZE);
        const idList = chunk.map((id) => encodeURIComponent(id)).join(",");
        if (!idList) continue;

        const deleteFromTable = async (tbl) => {
          try {
            await request(`/${tbl}?id=in.(${idList})`, {
              method: "DELETE",
              headers: { Prefer: "return=minimal" },
            });
          } catch (inErr) {
            for (const singleId of chunk) {
              await request(`/${tbl}?id=eq.${encodeURIComponent(singleId)}`, {
                method: "DELETE",
                headers: { Prefer: "return=minimal" },
              }).catch(() => {});
            }
          }
        };

        await deleteFromTable(targetTable);

        if (targetTable !== PAGE_TABLES.calibration_all) {
          deleteFromTable(PAGE_TABLES.calibration_all).catch(() => {});
        } else {
          for (const tbl of [PAGE_TABLES.normal_standard, PAGE_TABLES.centralized, PAGE_TABLES.each_section, PAGE_TABLES.cancel]) {
            deleteFromTable(tbl).catch(() => {});
          }
        }
      }

      saveConfig({ lastSync: new Date().toISOString(), status: "connected" });
      emitToast(`☁️ ลบ ${idStrings.length} รายการจากตาราง ${targetTable} ในฐานข้อมูลสำเร็จ`, "info");
      return { ok: true, count: idStrings.length };
    } catch (err) {
      console.warn("[Supabase Sync] Batch delete failed:", err && err.message);
      return { ok: false, error: err && err.message };
    }
  }

  // 6.2 Upsert multiple instruments (Batch Upsert)
  async function upsertInstruments(items, tabType = "calibration_all") {
    if (!isConfigured() || !config.autoSync || !Array.isArray(items) || items.length === 0) {
      return { ok: false, skipped: true };
    }
    try {
      const isCancel = tabType === "cancel" || tabType === "qap_cancel";
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

      if (isCancel || targetTable === PAGE_TABLES.cancel) {
        // When cancelled, remove from ALL active tables in database
        const idStrings = formatted.map(r => r.id).filter(Boolean);
        for (let i = 0; i < idStrings.length; i += CHUNK_SIZE) {
          const chunk = idStrings.slice(i, i + CHUNK_SIZE);
          const idList = chunk.map((id) => encodeURIComponent(id)).join(",");
          if (!idList) continue;
          for (const tbl of [PAGE_TABLES.calibration_all, PAGE_TABLES.normal_standard, PAGE_TABLES.centralized, PAGE_TABLES.each_section]) {
            request(`/${tbl}?id=in.(${idList})`, {
              method: "DELETE",
              headers: { Prefer: "return=minimal" },
            }).catch(() => {});
          }
        }
      } else if (targetTable !== PAGE_TABLES.calibration_all) {
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

      // Also save files to qap_files for items with files
      for (const it of items) {
        if (it && (it.pdfUrl || it.certFileData)) {
          saveFileRecord({
            instrumentId: it.id,
            codeNo: it.codeNo,
            certNo: it.certNo,
            fileName: it.certFileName,
            fileSize: it.fileSize,
            fileUrl: it.pdfUrl || it.certFileData,
            tabType,
          }).catch(() => {});
        }
      }

      saveConfig({ lastSync: new Date().toISOString(), status: "connected" });
      emitToast(`☁️ อัปเดตข้อมูล ${formatted.length} รายการลงตาราง ${targetTable} ในฐานข้อมูลสำเร็จ`, "success");
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
        await clearTable(FILES_TABLE).catch(() => {});
        emitToast(`☁️ ล้างข้อมูลทั้ง 5 ตารางและตารางไฟล์บน Supabase เรียบร้อยแล้ว`, "info");
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

  // 8. Fetch Calibration History for an instrument directly from Supabase (with fallback & qap_files linking)
  async function fetchCalibrationHistory(inst) {
    if (!inst) return { ok: false, records: [], source: "none", error: "No instrument provided" };
    const codeNo = String(inst.codeNo || inst.code_no || "").trim();
    const instId = String(inst.id || "").trim();

    // Check preloaded memory cache first for sub-millisecond click response (ISO/IEC 17025)
    const cached = _historyCache.get(codeNo) || _historyCache.get(instId);
    if (cached && Array.isArray(cached) && cached.length > 0) {
      return {
        ok: true,
        records: [...cached].sort((a, b) => new Date(b.calDate || 0).getTime() - new Date(a.calDate || 0).getTime()),
        source: "Supabase Preloaded Cache (ISO/IEC 17025)",
        lastSync: new Date().toISOString(),
        codeNo,
        instrumentId: instId,
      };
    }

    let records = [];
    let source = "none";

    // 8.1 Try querying public.CalibrationHistory / calibration_history table
    if (isConfigured() && _historyTableAvailable !== false) {
      const endpointsToTry = _historyTableEndpoint
        ? [
            codeNo ? `${_historyTableEndpoint}?or=(code_no.eq.${encodeURIComponent(codeNo)},codeNo.eq.${encodeURIComponent(codeNo)})&order=cal_date.desc,created_at.desc` : null,
            instId ? `${_historyTableEndpoint}?instrument_id=eq.${encodeURIComponent(instId)}&order=cal_date.desc,created_at.desc` : null,
          ].filter(Boolean)
        : [
            codeNo ? `/CalibrationHistory?or=(code_no.eq.${encodeURIComponent(codeNo)},codeNo.eq.${encodeURIComponent(codeNo)})&order=cal_date.desc,created_at.desc` : null,
            instId ? `/CalibrationHistory?instrument_id=eq.${encodeURIComponent(instId)}&order=cal_date.desc,created_at.desc` : null,
            codeNo ? `/calibration_history?or=(code_no.eq.${encodeURIComponent(codeNo)},instrument_id.eq.${encodeURIComponent(instId)})&order=cal_date.desc,created_at.desc` : null,
          ].filter(Boolean);

      for (const ep of endpointsToTry) {
        try {
          const res = await request(ep);
          if (Array.isArray(res) && res.length > 0) {
            records = res.map((r, i) => {
              const calBy = (r.calibrated_by && r.calibrated_by !== '-') ? r.calibrated_by : (r.calibratedBy && r.calibratedBy !== '-' ? r.calibratedBy : (r.labCal && r.labCal !== '-' ? r.labCal : (inst.labCal && inst.labCal !== '-' ? inst.labCal : (inst.calibratedBy && inst.calibratedBy !== '-' ? inst.calibratedBy : "NA CALTECHNOLOGIES"))));
              const stdInst = (r.standard_instrument && r.standard_instrument !== '-') ? r.standard_instrument : (r.standardInstrument && r.standardInstrument !== '-' ? r.standardInstrument : (r.standardUsed && r.standardUsed !== '-' ? r.standardUsed : (inst.standardInstrument && inst.standardInstrument !== '-' ? inst.standardInstrument : (inst.standardUsed && inst.standardUsed !== '-' ? inst.standardUsed : (inst.labCal ? (String(inst.labCal).toUpperCase().startsWith('LAB') ? inst.labCal : 'LAB ' + inst.labCal) : "LAB NA CALtechnologies")))));
              const remark = (r.notes && r.notes !== '-') ? r.notes : (r.remark && r.remark !== '-' ? r.remark : (r.remarks && r.remarks !== '-' ? r.remarks : (inst.notes && inst.notes !== '-' ? inst.notes : (inst.remark && inst.remark !== '-' ? inst.remark : (inst.remarks && inst.remarks !== '-' ? inst.remarks : "REFERENCE TO TS1-14-02")))));
              return {
                id: r.id || `hist_${i}`,
                instrumentId: r.instrument_id || instId,
                codeNo: r.code_no || codeNo,
                certNo: r.cert_no || r.certNo || `CERT-${codeNo || i + 1}`,
                calDate: r.cal_date || r.calDate || inst.calDate || "",
                dueDate: r.due_date || r.dueDate || r.next_due_date || inst.dueDate || "",
                calibratedBy: calBy,
                standardInstrument: stdInst,
                result: (r.result || "PASS").toUpperCase(),
                accuracy: r.accuracy || inst.accuracy || "",
                notes: remark,
                remark: remark,
                pdfUrl: r.pdf_url || r.pdfUrl || null,
                certFileName: r.cert_file_name || r.certFileName || null,
                fileSize: r.file_size || r.fileSize || null,
                createdAt: r.created_at || r.createdAt || null,
                sourceTable: "CalibrationHistory (Cloud Supabase)",
              };
            });
            _historyTableAvailable = true;
            _historyTableEndpoint = ep.split("?")[0];
            source = "CalibrationHistory (Supabase Cloud Table)";
            break;
          }
        } catch (e) {
          const errStr = String(e && e.message ? e.message : "");
          if (errStr.includes("404") || errStr.includes("PGRST205") || errStr.includes("schema cache")) {
            _historyTableAvailable = false;
          }
        }
      }

      // 8.2 If no records from dedicated table, query instrument row from page tables in Supabase
      if (records.length === 0) {
        const pageTables = Object.values(PAGE_TABLES);
        for (const tbl of pageTables) {
          try {
            const queryEp = codeNo
              ? `/${tbl}?code_no=eq.${encodeURIComponent(codeNo)}&select=id,code_no,cert_no,cal_date,due_date,calibrated_by,notes,data&limit=1`
              : `/${tbl}?id=eq.${encodeURIComponent(instId)}&select=id,code_no,cert_no,cal_date,due_date,calibrated_by,notes,data&limit=1`;
            const rows = await request(queryEp);
            if (Array.isArray(rows) && rows.length > 0) {
              const row = rows[0];
              const d = (row && typeof row.data === "object") ? row.data : {};
              const rawHist = (Array.isArray(d.calibrationHistory) && d.calibrationHistory.length > 0)
                ? d.calibrationHistory
                : (Array.isArray(d.history) && d.history.length > 0)
                ? d.history
                : [];
              if (rawHist.length > 0) {
                records = rawHist.map((h, i) => {
                  const calBy = (h.calibratedBy && h.calibratedBy !== '-') ? h.calibratedBy : (h.calibrated_by && h.calibrated_by !== '-' ? h.calibrated_by : (h.labCal && h.labCal !== '-' ? h.labCal : (row.calibrated_by && row.calibrated_by !== '-' ? row.calibrated_by : (inst.labCal && inst.labCal !== '-' ? inst.labCal : (inst.calibratedBy && inst.calibratedBy !== '-' ? inst.calibratedBy : "NA CALTECHNOLOGIES")))));
                  const stdInst = (h.standardInstrument && h.standardInstrument !== '-') ? h.standardInstrument : (h.standard_instrument && h.standard_instrument !== '-' ? h.standard_instrument : (h.standardUsed && h.standardUsed !== '-' ? h.standardUsed : (inst.standardInstrument && inst.standardInstrument !== '-' ? inst.standardInstrument : (inst.standardUsed && inst.standardUsed !== '-' ? inst.standardUsed : (inst.labCal ? (String(inst.labCal).toUpperCase().startsWith('LAB') ? inst.labCal : 'LAB ' + inst.labCal) : "LAB NA CALtechnologies")))));
                  const remark = (h.notes && h.notes !== '-') ? h.notes : (h.remarks && h.remarks !== '-' ? h.remarks : (h.remark && h.remark !== '-' ? h.remark : (row.notes && row.notes !== '-' ? row.notes : (inst.notes && inst.notes !== '-' ? inst.notes : (inst.remark && inst.remark !== '-' ? inst.remark : "REFERENCE TO TS1-14-02")))));
                  return {
                    id: h.id || `hist_${row.id}_${i}`,
                    instrumentId: row.id,
                    codeNo: row.code_no || codeNo,
                    certNo: h.certNo || h.cert_no || row.cert_no || `CERT-${codeNo || i + 1}`,
                    calDate: h.calDate || h.cal_date || row.cal_date || inst.calDate || "",
                    dueDate: h.dueDate || h.due_date || row.due_date || inst.dueDate || "",
                    calibratedBy: calBy,
                    standardInstrument: stdInst,
                    result: (h.result || "PASS").toUpperCase(),
                    accuracy: h.accuracy || inst.accuracy || "",
                    notes: remark,
                    remark: remark,
                    pdfUrl: h.pdfUrl || h.certFileData || null,
                    certFileName: h.certFileName || null,
                    fileSize: h.fileSize || null,
                    createdAt: h.createdAt || null,
                    sourceTable: `${tbl} (data.calibrationHistory)`,
                  };
                });
                source = `${tbl} (Supabase Cloud Record)`;
                break;
              }
            }
          } catch (e) {}
        }
      }

      // 8.3 Cross-reference certificates from qap_files table to ensure file attachment links
      try {
        const fileEp = codeNo
          ? `/${FILES_TABLE}?code_no=eq.${encodeURIComponent(codeNo)}&select=*`
          : `/${FILES_TABLE}?instrument_id=eq.${encodeURIComponent(instId)}&select=*`;
        const files = await request(fileEp);
        if (Array.isArray(files) && files.length > 0) {
          const sortedRecs = [...records].sort((a, b) => new Date(b.calDate || 0).getTime() - new Date(a.calDate || 0).getTime());
          const latestRec = sortedRecs[0];
          const usedFetchKeys = new Set();

          records = sortedRecs.map(rec => {
            if (rec.pdfUrl) return rec;
            const recCert = String(rec.certNo || "").trim().toUpperCase();
            let matchedFile = null;
            if (rec === latestRec || sortedRecs.length === 1) {
              matchedFile = files.find(f => {
                const fKey = f.id || f.file_url;
                if (usedFetchKeys.has(fKey)) return false;
                return (f.cert_no && recCert && String(f.cert_no).trim().toUpperCase() === recCert) ||
                       (codeNo && f.code_no && String(f.code_no).trim().toUpperCase() === codeNo.toUpperCase()) ||
                       (instId && f.instrument_id === instId);
              });
            } else if (files.length > 1 && recCert) {
              matchedFile = files.find(f => {
                const fKey = f.id || f.file_url;
                return !usedFetchKeys.has(fKey) && f.cert_no && String(f.cert_no).trim().toUpperCase() === recCert;
              });
            }
            if (matchedFile) {
              usedFetchKeys.add(matchedFile.id || matchedFile.file_url);
              return {
                ...rec,
                pdfUrl: matchedFile.file_url,
                certFileName: matchedFile.file_name || rec.certFileName,
                fileSize: matchedFile.file_size || rec.fileSize,
              };
            }
            return rec;
          });
        }
      } catch (e) {}
    }

    // 8.4 Fallback to local instrument data if still empty
    if (records.length === 0) {
      const localHist = (Array.isArray(inst.calibrationHistory) && inst.calibrationHistory.length > 0)
        ? inst.calibrationHistory
        : (Array.isArray(inst.history) && inst.history.length > 0)
        ? inst.history
        : [];
      if (localHist.length > 0) {
        records = localHist.map((h, i) => {
          const calBy = (h.calibratedBy && h.calibratedBy !== '-') ? h.calibratedBy : (h.labCal && h.labCal !== '-' ? h.labCal : (inst.labCal && inst.labCal !== '-' ? inst.labCal : (inst.calibratedBy && inst.calibratedBy !== '-' ? inst.calibratedBy : "NA CALTECHNOLOGIES")));
          const stdInst = (h.standardInstrument && h.standardInstrument !== '-') ? h.standardInstrument : (h.standardUsed && h.standardUsed !== '-' ? h.standardUsed : (inst.standardInstrument && inst.standardInstrument !== '-' ? inst.standardInstrument : (inst.standardUsed && inst.standardUsed !== '-' ? inst.standardUsed : (inst.labCal ? (String(inst.labCal).toUpperCase().startsWith('LAB') ? inst.labCal : 'LAB ' + inst.labCal) : "LAB NA CALtechnologies"))));
          const remark = (h.notes && h.notes !== '-') ? h.notes : (h.remarks && h.remarks !== '-' ? h.remarks : (h.remark && h.remark !== '-' ? h.remark : (inst.notes && inst.notes !== '-' ? inst.notes : (inst.remark && inst.remark !== '-' ? inst.remark : "REFERENCE TO TS1-14-02"))));
          return {
            id: h.id || `local_hist_${i}`,
            instrumentId: instId,
            codeNo: codeNo,
            certNo: h.certNo || inst.certNo || `CERT-${codeNo || i + 1}`,
            calDate: h.calDate || inst.calDate || "",
            dueDate: h.dueDate || inst.dueDate || "",
            calibratedBy: calBy,
            standardInstrument: stdInst,
            result: (h.result || "PASS").toUpperCase(),
            accuracy: h.accuracy || inst.accuracy || "",
            notes: remark,
            remark: remark,
            pdfUrl: h.pdfUrl || h.certFileData || inst.pdfUrl || inst.certFileData || null,
            certFileName: h.certFileName || inst.certFileName || null,
            fileSize: h.fileSize || inst.fileSize || null,
            createdAt: h.createdAt || null,
            sourceTable: "Local Storage (Device Cache)",
          };
        });
        source = "Local Storage (Device Cache)";
      } else if (inst.calDate || inst.dueDate || inst.certNo) {
        // If instrument has current calibration info, present it as cycle 1 baseline
        const calBy = (inst.labCal && inst.labCal !== '-') ? inst.labCal : (inst.calibratedBy && inst.calibratedBy !== '-' ? inst.calibratedBy : "NA CALTECHNOLOGIES");
        const stdInst = (inst.standardInstrument && inst.standardInstrument !== '-') ? inst.standardInstrument : (inst.standardUsed && inst.standardUsed !== '-' ? inst.standardUsed : (inst.labCal ? (String(inst.labCal).toUpperCase().startsWith('LAB') ? inst.labCal : 'LAB ' + inst.labCal) : "LAB NA CALtechnologies"));
        const remark = (inst.notes && inst.notes !== '-') ? inst.notes : (inst.remark && inst.remark !== '-' ? inst.remark : (inst.remarks && inst.remarks !== '-' ? inst.remarks : "REFERENCE TO TS1-14-02"));
        records = [{
          id: `curr_${inst.id || Date.now()}`,
          instrumentId: instId,
          codeNo: codeNo,
          certNo: inst.certNo || `CERT-${codeNo || "CURRENT"}`,
          calDate: inst.calDate || "",
          dueDate: inst.dueDate || "",
          calibratedBy: calBy,
          standardInstrument: stdInst,
          result: "PASS",
          accuracy: inst.accuracy || "",
          notes: remark,
          remark: remark,
          pdfUrl: inst.pdfUrl || inst.certFileData || null,
          certFileName: inst.certFileName || null,
          fileSize: inst.fileSize || null,
          createdAt: inst.updated_at || new Date().toISOString(),
          sourceTable: "Current Calibration (รอบปัจจุบัน)",
        }];
        source = source !== "none" ? source : "Current Calibration Baseline";
      }
    }

    const sorted = records.sort((a, b) => new Date(normalizeDateUniform(b.calDate || 0)).getTime() - new Date(normalizeDateUniform(a.calDate || 0)).getTime());
    if (codeNo && sorted.length > 0) _historyCache.set(codeNo, sorted);
    if (instId && sorted.length > 0) _historyCache.set(instId, sorted);

    return {
      ok: true,
      records: sorted,
      source,
      lastSync: new Date().toISOString(),
      codeNo,
      instrumentId: instId,
    };
  }

  // 9. Save new calibration record to Supabase CalibrationHistory table & sync to instrument
  async function addCalibrationHistoryRecord(inst, record, tabType = "calibration_all") {
    if (!inst || !record) return { ok: false, error: "Missing instrument or record" };
    const codeNo = String(inst.codeNo || inst.code_no || "").trim();
    const instId = String(inst.id || "").trim();
    const normCalDate = normalizeDateUniform(record.calDate);
    const normDueDate = normalizeDateUniform(record.dueDate);
    const recordId = record.id || `hist_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;

    const newHistItem = {
      id: recordId,
      instrument_id: instId,
      code_no: codeNo,
      instrument_name: inst.instrumentName || "",
      cert_no: record.certNo || `CERT-${codeNo}-${normCalDate ? normCalDate.replace(/-/g, "") : Date.now()}`,
      cal_date: normCalDate || record.calDate || "",
      due_date: normDueDate || record.dueDate || "",
      calibrated_by: record.calibratedBy || inst.labCal || "Internal QA",
      result: (record.result || "PASS").toUpperCase(),
      accuracy: record.accuracy || inst.accuracy || "",
      notes: record.notes || record.remarks || "",
      pdf_url: record.pdfUrl || null,
      cert_file_name: record.certFileName || null,
      file_size: parseByteSize(record.fileSize),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    let tableSaved = false;
    if (isConfigured() && _historyTableAvailable !== false) {
      const targetEp = _historyTableEndpoint || "/CalibrationHistory";
      try {
        await request(targetEp, {
          method: "POST",
          headers: { Prefer: "return=representation" },
          body: JSON.stringify(newHistItem),
        });
        tableSaved = true;
        _historyTableAvailable = true;
        _historyTableEndpoint = targetEp;
      } catch (e1) {
        const err1 = String(e1 && e1.message ? e1.message : "");
        if (err1.includes("404") || err1.includes("PGRST205") || err1.includes("schema cache")) {
          try {
            await request("/calibration_history", {
              method: "POST",
              headers: { Prefer: "return=representation" },
              body: JSON.stringify(newHistItem),
            });
            tableSaved = true;
            _historyTableAvailable = true;
            _historyTableEndpoint = "/calibration_history";
          } catch (e2) {
            _historyTableAvailable = false;
          }
        }
      }
    }

      // 9.2 Also sync to instrument data jsonb in main table
      try {
        const normalizedItem = {
          id: recordId,
          certNo: newHistItem.cert_no,
          calDate: newHistItem.cal_date,
          dueDate: newHistItem.due_date,
          calibratedBy: newHistItem.calibrated_by,
          result: newHistItem.result,
          accuracy: newHistItem.accuracy,
          notes: newHistItem.notes,
          pdfUrl: newHistItem.pdf_url,
          certFileName: newHistItem.cert_file_name,
          fileSize: newHistItem.file_size,
          createdAt: newHistItem.created_at,
        };

        const cachedList = (codeNo && _historyCache.get(codeNo)) || (instId && _historyCache.get(instId)) || [];
        const instHist = Array.isArray(inst.calibrationHistory) && inst.calibrationHistory.length > 0
          ? inst.calibrationHistory
          : Array.isArray(inst.history) && inst.history.length > 0
          ? inst.history
          : [];
        const combined = [...cachedList, ...instHist];
        const deduped = [];
        for (const h of combined) {
          const isSame = (h.id && h.id === recordId) ||
                         (h.certNo && normalizedItem.certNo && String(h.certNo).trim().toUpperCase() === String(normalizedItem.certNo).trim().toUpperCase()) ||
                         (isSameDate(h.calDate, normalizedItem.calDate) && String(h.certNo || "").trim() === String(normalizedItem.certNo || "").trim());
          if (!isSame) {
            deduped.push(h);
          }
        }
        const updatedHist = [normalizedItem, ...deduped].sort((a, b) => new Date(normalizeDateUniform(b.calDate || 0)).getTime() - new Date(normalizeDateUniform(a.calDate || 0)).getTime());

        if (codeNo) _historyCache.set(codeNo, updatedHist);
        if (instId) _historyCache.set(instId, updatedHist);

        const latestRec = updatedHist[0] || normalizedItem;
        const updatedInst = {
          ...inst,
          calDate: latestRec.calDate || record.calDate || inst.calDate,
          dueDate: latestRec.dueDate || record.dueDate || inst.dueDate,
          next_due_date: latestRec.dueDate || record.dueDate || inst.dueDate,
          certNo: latestRec.certNo || newHistItem.cert_no || inst.certNo,
          calibratedBy: latestRec.calibratedBy || newHistItem.calibrated_by || inst.calibratedBy,
          pdfUrl: latestRec.pdfUrl || record.pdfUrl || inst.pdfUrl || null,
          certFileData: latestRec.pdfUrl || record.pdfUrl || inst.certFileData || null,
          certFileName: latestRec.certFileName || record.certFileName || null,
          fileSize: latestRec.fileSize || record.fileSize || null,
          history: updatedHist,
          calibrationHistory: updatedHist,
        };

        await upsertInstrument(updatedInst, tabType);
      } catch (e3) {
        console.warn("[Supabase] Failed to sync history to instrument table:", e3);
      }

      // 9.3 If record contains PDF file, save to qap_files
      if (record.pdfUrl) {
        saveFileRecord({
          instrumentId: instId,
          codeNo: codeNo,
          certNo: newHistItem.cert_no,
          calDate: newHistItem.cal_date,
          fileName: record.certFileName || "certificate.pdf",
          fileSize: record.fileSize,
          fileUrl: record.pdfUrl,
          tabType,
        }).catch(() => {});
      }

      // Update local memory cache so click matches instantly (ISO/IEC 17025)
      try {
        const cacheItem = {
          id: recordId,
          instrumentId: instId,
          codeNo: codeNo,
          certNo: newHistItem.cert_no,
          calDate: newHistItem.cal_date,
          dueDate: newHistItem.due_date,
          calibratedBy: newHistItem.calibrated_by,
          result: newHistItem.result,
          accuracy: newHistItem.accuracy,
          notes: newHistItem.notes,
          pdfUrl: newHistItem.pdf_url,
          certFileName: newHistItem.cert_file_name,
          fileSize: newHistItem.file_size,
          createdAt: newHistItem.created_at,
          sourceTable: "CalibrationHistory (Preloaded)",
        };

        const updateCachedList = (key) => {
          if (!key) return;
          const currentList = _historyCache.get(key) || [];
          const filtered = currentList.filter(item => !(
            (item.id && item.id === recordId) ||
            (item.certNo && cacheItem.certNo && String(item.certNo).trim().toUpperCase() === String(cacheItem.certNo).trim().toUpperCase()) ||
            (isSameDate(item.calDate, cacheItem.calDate) && String(item.certNo || "").trim() === String(cacheItem.certNo || "").trim())
          ));
          const updatedList = [cacheItem, ...filtered].sort((a, b) => new Date(normalizeDateUniform(b.calDate || 0)).getTime() - new Date(normalizeDateUniform(a.calDate || 0)).getTime());
          _historyCache.set(key, updatedList);
        };

        updateCachedList(codeNo);
        updateCachedList(instId);
      } catch (cacheErr) {
        console.warn("[Supabase Cache Sync] Failed to update cache:", cacheErr);
      }

      emitToast(`✓ บันทึกประวัติสอบเทียบของ ${codeNo} (${newHistItem.cal_date || "-"}) สำเร็จ`, "success");
      return { ok: true, record: newHistItem, tableSaved };
    }

  // 10. Delete a calibration history record strictly by exact date and certNo reference
  async function deleteCalibrationHistoryRecord(inst, recordIdOrItem, tabType = "calibration_all") {
    if (!inst || !recordIdOrItem) return { ok: false, error: "Missing instrument or record ID" };

    const recordId = typeof recordIdOrItem === "object" ? String(recordIdOrItem.id || "").trim() : String(recordIdOrItem).trim();
    const certNo = typeof recordIdOrItem === "object" ? String(recordIdOrItem.certNo || recordIdOrItem.cert_no || "").trim() : "";
    const calDate = typeof recordIdOrItem === "object" ? String(recordIdOrItem.calDate || recordIdOrItem.cal_date || "").trim() : "";
    const pdfUrl = typeof recordIdOrItem === "object" ? String(recordIdOrItem.pdfUrl || recordIdOrItem.file_url || "").trim() : "";
    const codeNo = String(inst.codeNo || inst.code_no || "").trim();
    const instId = String(inst.id || "").trim();
    const normCalDate = normalizeDateUniform(calDate);

    // 1. Delete from Supabase CalibrationHistory table
    if (isConfigured() && _historyTableAvailable !== false) {
      const targetEp = _historyTableEndpoint || "/CalibrationHistory";
      const tryDelete = async (ep) => {
        const calls = [];
        if (recordId) {
          calls.push(request(`${ep}?id=eq.${encodeURIComponent(recordId)}`, {
            method: "DELETE",
            headers: { Prefer: "return=minimal" }
          }));
        }
        if (certNo && (codeNo || instId)) {
          const cParam = codeNo ? `&code_no=eq.${encodeURIComponent(codeNo)}` : `&instrument_id=eq.${encodeURIComponent(instId)}`;
          calls.push(request(`${ep}?cert_no=eq.${encodeURIComponent(certNo)}${cParam}`, {
            method: "DELETE",
            headers: { Prefer: "return=minimal" }
          }));
        }
        if (normCalDate && (codeNo || instId)) {
          const cParam = codeNo ? `&code_no=eq.${encodeURIComponent(codeNo)}` : `&instrument_id=eq.${encodeURIComponent(instId)}`;
          calls.push(request(`${ep}?cal_date=eq.${encodeURIComponent(normCalDate)}${cParam}`, {
            method: "DELETE",
            headers: { Prefer: "return=minimal" }
          }));
        }
        await Promise.all(calls);
      };

      try {
        await tryDelete(targetEp);
        _historyTableAvailable = true;
        _historyTableEndpoint = targetEp;
      } catch (e1) {
        const err1 = String(e1 && e1.message ? e1.message : "");
        if (err1.includes("404") || err1.includes("PGRST205") || err1.includes("schema cache")) {
          try {
            await tryDelete("/calibration_history");
            _historyTableAvailable = true;
            _historyTableEndpoint = "/calibration_history";
          } catch (e2) {
            _historyTableAvailable = false;
          }
        }
      }
    }

    // 2. Clean up associated file in qap_files & _filesCache strictly for this cycle
    try {
      await deleteFileRecord({
        instrumentId: instId,
        codeNo: codeNo,
        certNo: certNo,
        calDate: normCalDate,
        fileUrl: pdfUrl
      });
    } catch (fErr) {}

    // 3. Update local memory cache and get updated list
    let updatedHist = [];
    try {
      const currentList = (codeNo && _historyCache.get(codeNo)) || (instId && _historyCache.get(instId)) || (
        Array.isArray(inst.calibrationHistory) ? inst.calibrationHistory : Array.isArray(inst.history) ? inst.history : []
      );
      updatedHist = currentList.filter(item => {
        if (recordId && item.id && item.id === recordId) return false;
        const sameCert = certNo && (item.certNo || item.cert_no) && String(item.certNo || item.cert_no).trim().toUpperCase() === certNo.toUpperCase();
        const sameDate = normCalDate && isSameDate(item.calDate || item.cal_date, normCalDate);
        if (sameCert && sameDate) return false;
        if (sameCert && !calDate) return false;
        if (sameDate && !certNo) return false;
        return true;
      }).sort((a, b) => new Date(normalizeDateUniform(b.calDate || b.cal_date || 0)).getTime() - new Date(normalizeDateUniform(a.calDate || a.cal_date || 0)).getTime());

      if (codeNo) _historyCache.set(codeNo, updatedHist);
      if (instId) _historyCache.set(instId, updatedHist);
    } catch (cacheErr) {
      console.warn("[Supabase Cache Sync] Failed to delete from cache:", cacheErr);
    }

    // 4. Sync updated history and latest cycle to instrument table
    try {
      const latestCycle = updatedHist[0] || null;
      const updatedInst = {
        ...inst,
        history: updatedHist,
        calibrationHistory: updatedHist,
        calDate: latestCycle ? (latestCycle.calDate || latestCycle.cal_date || inst.calDate || "") : "",
        dueDate: latestCycle ? (latestCycle.dueDate || latestCycle.due_date || inst.dueDate || "") : "",
        next_due_date: latestCycle ? (latestCycle.dueDate || latestCycle.due_date || inst.dueDate || "") : "",
        certNo: latestCycle ? (latestCycle.certNo || latestCycle.cert_no || "") : "",
        calibratedBy: latestCycle ? (latestCycle.calibratedBy || latestCycle.calibrated_by || inst.calibratedBy || "") : "",
        pdfUrl: latestCycle ? (latestCycle.pdfUrl || latestCycle.certFileData || latestCycle.file_url || null) : null,
        certFileData: latestCycle ? (latestCycle.certFileData || latestCycle.pdfUrl || latestCycle.file_url || null) : null,
        certFileName: latestCycle ? (latestCycle.certFileName || latestCycle.file_name || null) : null,
        fileSize: latestCycle ? (latestCycle.fileSize || latestCycle.file_size || null) : null,
      };
      await upsertInstrument(updatedInst, tabType);
    } catch (e3) {}

    emitToast(`🗑️ ลบรายการประวัติการสอบเทียบรอบวันที่ ${calDate || "-"} เรียบร้อย`, "info");
    return { ok: true, updatedHistory: updatedHist };
  }

  window.qapSupabase = {
    _historyCache,
    _filesCache,
    getFolderStatus,
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
    saveFileRecord,
    deleteFileRecord,
    pullFilesFromSupabase,
    linkFilesToInstruments,
    fetchCalibrationHistory,
    addCalibrationHistoryRecord,
    deleteCalibrationHistoryRecord,
    FILES_TABLE,
    PAGE_TABLES,
    PAGE_NAMES,
    emitToast,
    moveToCancel,
  };

  // Initial status notification after boot
  setTimeout(emitStatus, 300);
})();
