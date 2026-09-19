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

-- สั่งให้ PostgREST โหลด Schema Cache ใหม่ทันที
NOTIFY pgrst, 'reload schema';

-- ตรวจสอบความสมบูรณ์ของทั้ง 5 ตาราง และตารางไฟล์ qap_files
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
SELECT 'qap_files (แยกไฟล์)', count(*) FROM public.qap_files;
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
    return formatted.length;
  }

  // Safe upsert single row with fallback if remote table lacks pdf columns
  async function safeUpsertRow(tbl, row) {
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
  // Dedicated File Storage & Decoupled Linker (qap_files)
  // แยกเก็บไฟล์ PDF ลงตาราง qap_files ต่างหาก ไม่เก็บซ้ำซ้อนใน data (JSONB)
  // ----------------------------------------------------------

  // Save single file record to qap_files table
  async function saveFileRecord({
    instrumentId,
    codeNo,
    certNo = "",
    fileName = "",
    fileSize = 0,
    fileUrl = "",
    tabType = "calibration_all",
  } = {}) {
    if (!isConfigured() || !config.autoSync || !fileUrl) return { ok: false, skipped: true };
    try {
      const cleanInstId = String(instrumentId || "").trim();
      const cleanCodeNo = String(codeNo || "").trim();
      const fileId = `file_${cleanCodeNo ? cleanCodeNo.replace(/[^a-zA-Z0-9_-]/g, "_") : (cleanInstId || Date.now())}`;

      const payload = {
        id: fileId,
        instrument_id: cleanInstId || null,
        code_no: cleanCodeNo,
        cert_no: String(certNo || "").trim(),
        file_name: String(fileName || "").trim(),
        file_size: parseByteSize(fileSize),
        file_url: String(fileUrl).trim(),
        tab_type: String(tabType || "calibration_all"),
        updated_at: new Date().toISOString(),
      };

      await request(`/${FILES_TABLE}`, {
        method: "POST",
        headers: {
          Prefer: "resolution=merge-duplicates,return=minimal",
        },
        body: JSON.stringify(payload),
      });

      return { ok: true, fileId };
    } catch (err) {
      console.warn("[Supabase File Sync] Save file record failed:", err);
      return { ok: false, error: err.message };
    }
  }

  // Delete file record from qap_files table
  async function deleteFileRecord(instrumentId, codeNo, fileId) {
    if (!isConfigured() || !config.autoSync) return { ok: false, skipped: true };
    try {
      const deleteCalls = [];
      if (fileId) {
        deleteCalls.push(request(`/${FILES_TABLE}?id=eq.${encodeURIComponent(fileId)}`, {
          method: "DELETE",
          headers: { Prefer: "return=minimal" },
        }).catch(() => {}));
      }
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
        deleteCalls.push(request(`/${FILES_TABLE}?code_no=ilike.${encodeURIComponent(cleanCode)}`, {
          method: "DELETE",
          headers: { Prefer: "return=minimal" },
        }).catch(() => {}));
        const fileIdCode = `file_${cleanCode.replace(/[^a-zA-Z0-9_-]/g, "_")}`;
        deleteCalls.push(request(`/${FILES_TABLE}?id=eq.${encodeURIComponent(fileIdCode)}`, {
          method: "DELETE",
          headers: { Prefer: "return=minimal" },
        }).catch(() => {}));
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
  // ใช้หน้าเวปเป็นตัวดึงข้อมูล แล้วเชื่อมข้อมูลให้ตรงกันเองว่า เครื่องมือไหน ไฟล์ไหน
  function linkFilesToInstruments(instruments = [], fileRows = []) {
    if (!Array.isArray(instruments) || instruments.length === 0) return instruments;
    if (!Array.isArray(fileRows)) fileRows = [];

    const fileByInstId = new Map();
    const fileByCodeNo = new Map();
    const fileByCertNo = new Map();

    for (const f of fileRows) {
      if (!f) continue;
      if (f.instrument_id) fileByInstId.set(String(f.instrument_id).trim(), f);
      if (f.code_no) fileByCodeNo.set(String(f.code_no).trim().toUpperCase(), f);
      if (f.cert_no) fileByCertNo.set(String(f.cert_no).trim().toUpperCase(), f);
    }

    for (const inst of instruments) {
      if (!inst) continue;
      const instId = String(inst.id || "").trim();
      const codeNo = String(inst.codeNo || "").trim().toUpperCase();
      const certNo = String(inst.certNo || "").trim().toUpperCase();

      const matchedFile = fileByCodeNo.get(codeNo) || fileByInstId.get(instId) || (certNo ? fileByCertNo.get(certNo) : null);
      if (matchedFile) {
        const fileUrl = matchedFile.file_url || null;
        const fileName = matchedFile.file_name || null;
        const fileSize = matchedFile.file_size || null;

        inst.pdfUrl = fileUrl;
        inst.certFileData = fileUrl;
        inst.certFileName = fileName;
        inst.fileSize = fileSize;

        // Also link to first history item
        if (Array.isArray(inst.history) && inst.history.length > 0) {
          inst.history[0].pdfUrl = fileUrl;
          inst.history[0].certFileData = fileUrl;
          inst.history[0].certFileName = fileName;
          inst.history[0].fileSize = fileSize;
        }
        if (Array.isArray(inst.calibrationHistory) && inst.calibrationHistory.length > 0) {
          inst.calibrationHistory[0].pdfUrl = fileUrl;
          inst.calibrationHistory[0].certFileData = fileUrl;
          inst.calibrationHistory[0].certFileName = fileName;
          inst.calibrationHistory[0].fileSize = fileSize;
        }

        // Link individual history certificates if matching records exist
        if (Array.isArray(inst.history)) {
          for (const h of inst.history) {
            if (h && h.certNo) {
              const hCert = String(h.certNo).trim().toUpperCase();
              const hFile = fileByCertNo.get(hCert);
              if (hFile) {
                h.pdfUrl = hFile.file_url || fileUrl;
                h.certFileData = hFile.file_url || fileUrl;
                h.certFileName = hFile.file_name || fileName;
                h.fileSize = hFile.file_size || fileSize;
              }
            }
          }
        }
      } else {
        // If no file in qap_files, ensure cleared
        inst.pdfUrl = null;
        inst.certFileData = null;
        inst.certFileName = null;
        inst.fileSize = null;
        if (Array.isArray(inst.history) && inst.history.length > 0) {
          inst.history[0].pdfUrl = null;
          inst.history[0].certFileData = null;
          inst.history[0].certFileName = null;
          inst.history[0].fileSize = null;
        }
        if (Array.isArray(inst.calibrationHistory) && inst.calibrationHistory.length > 0) {
          inst.calibrationHistory[0].pdfUrl = null;
          inst.calibrationHistory[0].certFileData = null;
          inst.calibrationHistory[0].certFileName = null;
          inst.calibrationHistory[0].fileSize = null;
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
      if (Array.isArray(fileRows) && fileRows.length > 0) {
        linkFilesToInstruments(all, fileRows);
        linkFilesToInstruments(normalStandard, fileRows);
        linkFilesToInstruments(centralized, fileRows);
        linkFilesToInstruments(eachSection, fileRows);
        linkFilesToInstruments(cancel, fileRows);
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

  // 4. Realtime Single Instrument Upsert to dedicated table and master list
  async function upsertInstrument(inst, tabType = "calibration_all") {
    if (!isConfigured() || !config.autoSync) return { ok: false, skipped: true };

    try {
      const targetTable = getTableForPage(tabType);
      const row = formatRow(inst, tabType);
      if (!row) return { ok: false, message: "Invalid instrument data" };

      // Save file record to qap_files table separately (decoupled from data jsonb)
      const hasPdf = !!(inst.pdfUrl || inst.certFileData);
      if (hasPdf) {
        await saveFileRecord({
          instrumentId: inst.id,
          codeNo: inst.codeNo,
          certNo: inst.certNo,
          fileName: inst.certFileName,
          fileSize: inst.fileSize,
          fileUrl: inst.pdfUrl || inst.certFileData,
          tabType: tabType,
        }).catch(err => console.warn("[Supabase Sync] File record save warning:", err));
      } else if (inst.id || inst.codeNo) {
        // If instrument previously had a file that was removed, clean from qap_files
        await deleteFileRecord(inst.id, inst.codeNo).catch(() => {});
      }

      // Save instrument row with clean data jsonb
      await safeUpsertRow(targetTable, row);

      // Also ensure Master List (qap_calibration_all) stays synchronized if not already target
      if (targetTable !== PAGE_TABLES.calibration_all) {
        await safeUpsertRow(PAGE_TABLES.calibration_all, row).catch(() => {});
      }

      saveConfig({ lastSync: new Date().toISOString(), status: "connected" });
      const pdfNote = hasPdf ? " (บันทึกไฟล์ลงตาราง qap_files แยกต่างหาก)" : "";
      emitToast(`☁️ ซิงก์บันทึกลงตาราง ${targetTable}: ${inst.codeNo || inst.instrumentName || ""}${pdfNote}`, "success");
      return { ok: true };
    } catch (err) {
      console.warn("[Supabase Sync] Upsert failed:", err);
      return { ok: false, error: err.message };
    }
  }

  // 5. Delete single instrument from its dedicated table, master list, and qap_files
  async function deleteInstrument(id, tabType = "calibration_all", codeNo = "") {
    if (!isConfigured() || !config.autoSync || !id) return { ok: false, skipped: true };

    try {
      const targetTable = getTableForPage(tabType);
      const cleanId = typeof id === "object" ? String(id.id || "") : String(id);
      const cleanCode = typeof id === "object" ? String(id.codeNo || "") : String(codeNo || "");

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
      emitToast(`☁️ ลบออกจากตาราง ${targetTable} และตาราง qap_files แล้ว`, "info");
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
            // Fallback to individual eq. delete if in. operator has syntax/schema limitation
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
          // If deleting from calibration_all, clean from all sub-tables too
          for (const tbl of [PAGE_TABLES.normal_standard, PAGE_TABLES.centralized, PAGE_TABLES.each_section, PAGE_TABLES.cancel]) {
            deleteFromTable(tbl).catch(() => {});
          }
        }
      }

      saveConfig({ lastSync: new Date().toISOString(), status: "connected" });
      emitToast(`☁️ ลบ ${idStrings.length} รายการจากตาราง ${targetTable} สำเร็จ`, "info");
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
    saveFileRecord,
    deleteFileRecord,
    pullFilesFromSupabase,
    linkFilesToInstruments,
    FILES_TABLE,
    PAGE_TABLES,
    PAGE_NAMES,
    emitToast,
  };

  // Initial status notification after boot
  setTimeout(emitStatus, 300);
})();
