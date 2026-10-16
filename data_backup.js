(function () {
  const PAGE_CONFIG = [
    {
      key: "all",
      dataKey: "all",
      storageKey: "QAP_CALIBRATION_INSTRUMENTS_V1",
      label: "CALIBRATION ALL",
      category: "CALIBRATION ALL",
      tabType: "calibration_all",
    },
    {
      key: "normalStandard",
      dataKey: "normalStandard",
      storageKey: "QAP_NORMAL_STANDARD_INSTRUMENTS_V1",
      label: "NORMAL STANDARD",
      category: "NORMAL STANDARD",
      tabType: "normal_standard",
    },
    {
      key: "centralized",
      dataKey: "centralized",
      storageKey: "QAP_CENTRALIZED_INSTRUMENTS_V1",
      label: "CENTRALIZED",
      category: "CENTRALIZED",
      tabType: "centralized",
    },
    {
      key: "eachSection",
      dataKey: "eachSection",
      storageKey: "QAP_EACH_SECTION_INSTRUMENTS_V1",
      label: "EACH SECTION",
      category: "EACH SECTION",
      tabType: "each_section",
    },
    {
      key: "cancel",
      dataKey: "cancel",
      storageKey: "QAP_CANCEL_INSTRUMENTS_V1",
      label: "CANCEL",
      category: "CANCEL",
      tabType: "cancel",
    },
  ];
  const PAGE_BY_KEY = new Map(PAGE_CONFIG.map((page) => [page.key, page]));
  const META_COLUMNS = new Set(["__qap_page", "__qap_schema", "__qap_record"]);
  const CSV_SCHEMA_VERSION = "1";
  const FIELD_ORDER = ["id", "codeNo", "instrumentName", "status", "category", "no"];

  function getPageKey(value) {
    const normalized = String(value || "").trim().toLowerCase().replace(/[^a-z0-9]/g, "");
    const aliases = {
      all: "all",
      calibrationall: "all",
      master: "all",
      masterlist: "all",
      normalstandard: "normalStandard",
      centralized: "centralized",
      eachsection: "eachSection",
      cancel: "cancel",
      cancelled: "cancel",
    };
    return aliases[normalized] || null;
  }

  function csvCell(value) {
    if (value === null || value === undefined) return "";
    if (typeof value === "object") return JSON.stringify(value);
    return String(value);
  }

  function getCurrentStatus(item, pageKey) {
    if (pageKey === "cancel") return "inactive";
    if (typeof window.qapComputeInstrumentStatus === "function") {
      return window.qapComputeInstrumentStatus(item);
    }
    return item.status || "normal";
  }

  function escapeSpreadsheetCell(value) {
    const cell = csvCell(value);
    return /^[\s]*[=+\-@]/.test(cell) ? `'${cell}` : cell;
  }

  function encodeCsvCell(value) {
    return `"${String(value).replace(/"/g, '""')}"`;
  }

  function buildCsv(data) {
    const rows = [];
    const fields = new Set();
    for (const page of PAGE_CONFIG) {
      const items = Array.isArray(data[page.dataKey]) ? data[page.dataKey] : [];
      for (const item of items) {
        if (item && typeof item === "object" && !Array.isArray(item)) {
          const record = JSON.parse(JSON.stringify(item));
          record.status = getCurrentStatus(record, page.key);
          Object.keys(record).forEach((key) => {
            if (!META_COLUMNS.has(key)) fields.add(key);
          });
          rows.push({ page, item: record });
        }
      }
    }

    const orderedFields = [
      ...FIELD_ORDER.filter((field) => fields.has(field)),
      ...[...fields].filter((field) => !FIELD_ORDER.includes(field)).sort((a, b) => a.localeCompare(b)),
    ];
    const headers = ["__qap_page", "__qap_schema", ...orderedFields, "__qap_record"];
    const csvRows = [headers.map(encodeCsvCell).join(",")];

    for (const { page, item } of rows) {
      const cells = [
        page.key,
        CSV_SCHEMA_VERSION,
        ...orderedFields.map((field) => escapeSpreadsheetCell(item[field])),
        JSON.stringify(item),
      ];
      csvRows.push(cells.map(encodeCsvCell).join(","));
    }

    return `\uFEFF${csvRows.join("\r\n")}`;
  }

  function parseCsv(text) {
    const source = String(text || "").replace(/^\uFEFF/, "");
    const rows = [];
    let row = [];
    let cell = "";
    let inQuotes = false;

    for (let index = 0; index < source.length; index += 1) {
      const char = source[index];
      if (inQuotes) {
        if (char === '"' && source[index + 1] === '"') {
          cell += '"';
          index += 1;
        } else if (char === '"') {
          inQuotes = false;
        } else {
          cell += char;
        }
      } else if (char === '"' && cell.length === 0) {
        inQuotes = true;
      } else if (char === ",") {
        row.push(cell);
        cell = "";
      } else if (char === "\n" || char === "\r") {
        row.push(cell);
        if (row.some((value) => value !== "")) rows.push(row);
        row = [];
        cell = "";
        if (char === "\r" && source[index + 1] === "\n") index += 1;
      } else {
        cell += char;
      }
    }

    if (inQuotes) throw new Error("ไฟล์ CSV มีเครื่องหมายอัญประกาศไม่ครบ");
    row.push(cell);
    if (row.some((value) => value !== "")) rows.push(row);
    if (rows.length < 2) throw new Error("ไม่พบรายการข้อมูลในไฟล์ CSV");

    const headers = rows[0].map((header) => header.trim());
    const normalizedHeaders = headers.map((header) => header.toLowerCase());
    if (new Set(normalizedHeaders).size !== normalizedHeaders.length) {
      throw new Error("ไฟล์ CSV มีชื่อคอลัมน์ซ้ำกัน");
    }

    const pageIndex = normalizedHeaders.indexOf("__qap_page");
    if (pageIndex < 0) throw new Error("ไม่พบคอลัมน์ __qap_page สำหรับระบุหน้า");
    const recordIndex = normalizedHeaders.indexOf("__qap_record");
    const parsedRows = [];
    const errors = [];

    for (let rowIndex = 1; rowIndex < rows.length; rowIndex += 1) {
      const values = rows[rowIndex];
      if (values.length > headers.length && values.slice(headers.length).some((value) => value !== "")) {
        errors.push(`แถว ${rowIndex + 1}: จำนวนคอลัมน์ไม่ตรงกับหัวตาราง`);
        continue;
      }
      const pageValue = values[pageIndex] || "";
      const pageKey = getPageKey(pageValue);
      if (!pageKey) {
        errors.push(`แถว ${rowIndex + 1}: ไม่รู้จักหน้าข้อมูล "${pageValue}"`);
        continue;
      }

      const recordCell = recordIndex >= 0 ? values[recordIndex] || "" : "";
      let record = {};
      if (recordCell) {
        try {
          record = JSON.parse(recordCell);
          if (!record || typeof record !== "object" || Array.isArray(record)) {
            throw new Error("ข้อมูลรายการต้องเป็น object");
          }
        } catch (error) {
          errors.push(`แถว ${rowIndex + 1}: อ่านข้อมูลสำรองไม่ได้ (${error.message})`);
          continue;
        }
      }

      for (let columnIndex = 0; columnIndex < headers.length; columnIndex += 1) {
        const header = headers[columnIndex];
        if (META_COLUMNS.has(header.toLowerCase())) continue;
        const cellValue = values[columnIndex] || "";
        if (recordCell) {
          const originalDisplay = escapeSpreadsheetCell(record[header]);
          if (cellValue !== originalDisplay) {
            const valueWithoutFormulaGuard = /^'[ \t]*[=+\-@]/.test(cellValue) ? cellValue.slice(1) : cellValue;
            const original = record[header];
            if (typeof original === "number" && valueWithoutFormulaGuard.trim() !== "") {
              const numberValue = Number(valueWithoutFormulaGuard);
              record[header] = Number.isFinite(numberValue) ? numberValue : valueWithoutFormulaGuard;
            } else if (typeof original === "boolean") {
              record[header] = valueWithoutFormulaGuard.toLowerCase() === "true";
            } else if (original && typeof original === "object") {
              try {
                record[header] = JSON.parse(valueWithoutFormulaGuard);
              } catch {
                record[header] = valueWithoutFormulaGuard;
              }
            } else if (cellValue !== "") {
              record[header] = valueWithoutFormulaGuard;
            }
          }
        } else if (cellValue !== "") {
          let parsedValue = cellValue;
          if (/^[\[{]/.test(cellValue)) {
            try {
              parsedValue = JSON.parse(cellValue);
            } catch {}
          }
          record[header] = parsedValue;
        }
      }

      const id = String(record.id || "").trim();
      const codeNo = String(record.codeNo || record.code_no || "").trim();
      if (!id && !codeNo) {
        errors.push(`แถว ${rowIndex + 1}: ต้องมี id หรือ codeNo เพื่อจับคู่รายการ`);
        continue;
      }
      if (!id) record.id = `csv_${codeNo.toLowerCase().replace(/[^a-z0-9_-]/g, "_")}`;
      if (!record.codeNo && record.code_no) record.codeNo = record.code_no;
      parsedRows.push({ pageKey, record, rowNumber: rowIndex + 1 });
    }

    if (errors.length) {
      const displayErrors = errors.slice(0, 8).join("\n");
      const remainder = errors.length > 8 ? `\nและอีก ${errors.length - 8} ข้อผิดพลาด` : "";
      throw new Error(`ตรวจพบข้อผิดพลาด ${errors.length} จุด:\n${displayErrors}${remainder}`);
    }
    if (!parsedRows.length) throw new Error("ไม่พบรายการที่นำเข้าได้");
    return parsedRows;
  }

  function identityMatches(left, right) {
    const leftId = String(left && left.id || "").trim();
    const rightId = String(right && right.id || "").trim();
    if (leftId && rightId && leftId === rightId) return true;
    const leftCode = String(left && (left.codeNo || left.code_no) || "").trim().toUpperCase();
    const rightCode = String(right && (right.codeNo || right.code_no) || "").trim().toUpperCase();
    return Boolean(leftCode && rightCode && leftCode === rightCode);
  }

  function upsertLocalPage(items, incoming) {
    const index = items.findIndex((item) => identityMatches(item, incoming));
    if (index < 0) {
      items.push({ ...incoming });
      return;
    }
    items[index] = { ...items[index], ...incoming };
  }

  function isInactive(item) {
    const status = String(item && item.status || "").trim().toLowerCase();
    const category = String(item && item.category || "").trim().toUpperCase();
    return status === "inactive" || status.includes("cancel") || status.includes("ปลดระวาง")
      || category === "CANCEL" || category.includes("CANCEL");
  }

  function removeMatchingItems(items, target) {
    return items.filter((item) => !identityMatches(item, target));
  }

  function uniqueRows(items) {
    const unique = [];
    for (const item of items) {
      const index = unique.findIndex((existing) => identityMatches(existing, item));
      if (index < 0) unique.push(item);
      else unique[index] = { ...unique[index], ...item };
    }
    return unique;
  }

  function normalizePage(items, page) {
    return items.map((item, index) => {
      const normalized = {
        ...item,
        no: index + 1,
        category: page.category,
        tabType: page.tabType,
      };
      normalized.status = getCurrentStatus(normalized, page.key);
      return normalized;
    });
  }

  function mergeImportedData(baseData, importedRows) {
    const merged = Object.fromEntries(PAGE_CONFIG.map((page) => [
      page.dataKey,
      Array.isArray(baseData[page.dataKey]) ? baseData[page.dataKey].map((item) => ({ ...item })) : [],
    ]));
    const activeChanges = new Map(PAGE_CONFIG.filter((page) => page.key !== "cancel").map((page) => [page.key, []]));
    const cancelledChanges = [];
    const reactivatedItems = [];
    const movedItems = new Map(PAGE_CONFIG.filter((page) => !["all", "cancel"].includes(page.key)).map((page) => [page.key, []]));
    let routedToCancel = 0;

    const pendingActive = importedRows.filter(({ pageKey, record }) => pageKey !== "cancel" && !isInactive(record));
    const pendingCancel = importedRows.filter(({ pageKey, record }) => pageKey === "cancel" || isInactive(record));

    for (const { pageKey, record } of pendingActive) {
      const page = PAGE_BY_KEY.get(pageKey);
      const incoming = {
        ...record,
        category: page.key === "all" ? (record.category || page.category) : page.category,
        tabType: page.tabType,
      };
      const oldCancel = merged.cancel.find((item) => identityMatches(item, incoming));
      if (oldCancel) {
        reactivatedItems.push(incoming);
        merged.cancel = removeMatchingItems(merged.cancel, incoming);
      }

      if (page.key !== "all") {
        for (const otherPage of PAGE_CONFIG.filter((candidate) =>
          !["all", "cancel", page.key].includes(candidate.key))) {
          const previous = merged[otherPage.dataKey].find((item) => identityMatches(item, incoming));
          if (previous) {
            movedItems.get(otherPage.key).push(previous);
            merged[otherPage.dataKey] = removeMatchingItems(merged[otherPage.dataKey], incoming);
          }
        }
      }

      upsertLocalPage(merged[page.dataKey], incoming);
      activeChanges.get(page.key).push(incoming);
      if (page.key !== "all") {
        const masterRecord = { ...incoming, category: "CALIBRATION ALL", tabType: "calibration_all" };
        upsertLocalPage(merged.all, masterRecord);
        activeChanges.get("all").push(masterRecord);
      }
    }

    for (const { record } of pendingCancel) {
      const incoming = {
        ...record,
        status: "inactive",
        category: "CANCEL",
        tabType: "cancel",
      };
      for (const page of PAGE_CONFIG.filter((candidate) => candidate.key !== "cancel")) {
        merged[page.dataKey] = removeMatchingItems(merged[page.dataKey], incoming);
      }
      upsertLocalPage(merged.cancel, incoming);
      cancelledChanges.push(incoming);
      routedToCancel += 1;
    }

    for (const page of PAGE_CONFIG) {
      merged[page.dataKey] = normalizePage(merged[page.dataKey], page);
    }

    return {
      data: merged,
      activeChanges: Object.fromEntries([...activeChanges].map(([key, rows]) => [
        key,
        uniqueRows(rows.map((row) => ({
          ...row,
          ...(key === "all" ? { category: "CALIBRATION ALL", tabType: "calibration_all" } : {
            category: PAGE_BY_KEY.get(key).category,
            tabType: PAGE_BY_KEY.get(key).tabType,
          }),
          status: getCurrentStatus(row, key),
        }))),
      ])),
      cancelledChanges: uniqueRows(cancelledChanges),
      reactivatedItems: uniqueRows(reactivatedItems),
      movedItems: Object.fromEntries([...movedItems].map(([key, rows]) => [key, uniqueRows(rows)])),
      routedToCancel,
    };
  }

  function countRows(data) {
    return Object.fromEntries(PAGE_CONFIG.map((page) => [
      page.key,
      Array.isArray(data[page.dataKey]) ? data[page.dataKey].length : 0,
    ]));
  }

  async function readIndexedDbValue(key) {
    if (!("indexedDB" in window)) return null;
    return new Promise((resolve, reject) => {
      const openRequest = indexedDB.open("QAP_CALIBRATION_DB", 1);
      openRequest.onerror = () => reject(openRequest.error || new Error("เปิด IndexedDB ไม่สำเร็จ"));
      openRequest.onupgradeneeded = () => {
        const db = openRequest.result;
        if (!db.objectStoreNames.contains("keyval")) db.createObjectStore("keyval");
      };
      openRequest.onsuccess = () => {
        const db = openRequest.result;
        try {
          const request = db.transaction("keyval", "readonly").objectStore("keyval").get(key);
          request.onsuccess = () => {
            db.close();
            resolve(request.result ?? null);
          };
          request.onerror = () => {
            db.close();
            reject(request.error || new Error("อ่าน IndexedDB ไม่สำเร็จ"));
          };
        } catch (error) {
          db.close();
          reject(error);
        }
      };
    });
  }

  async function getLocalData() {
    const data = {};
    for (const page of PAGE_CONFIG) {
      let storedValue = null;
      const raw = localStorage.getItem(page.storageKey);
      if (raw !== null) {
        try {
          storedValue = JSON.parse(raw);
        } catch (error) {
          console.warn(`Invalid local storage data for ${page.storageKey}`, error);
        }
      }
      if (!Array.isArray(storedValue)) {
        storedValue = await readIndexedDbValue(page.storageKey);
      }
      data[page.dataKey] = Array.isArray(storedValue) ? storedValue : [];
    }
    return data;
  }

  function renderButton(sidebar) {
    if (sidebar.querySelector("#qap-csv-backup-btn")) return;
    const button = document.createElement("button");
    button.id = "qap-csv-backup-btn";
    button.type = "button";
    button.title = "นำเข้าและสำรองข้อมูลทุกหน้าเป็น CSV";
    button.className = "flex items-center gap-3 px-3.5 py-3 rounded-xl text-white transition shadow-lg cursor-pointer text-left group shrink-0";
    button.style.cssText = "margin:8px 12px 8px;width:calc(100% - 24px);background:linear-gradient(110deg,#047857,#0f766e);color:#fff;border:1px solid #059669;";
    button.addEventListener("mouseenter", () => {
      button.style.background = "linear-gradient(110deg,#065f46,#115e59)";
    });
    button.addEventListener("mouseleave", () => {
      button.style.background = "linear-gradient(110deg,#047857,#0f766e)";
    });
    button.addEventListener("focus", () => {
      button.style.outline = "3px solid #a7f3d0";
      button.style.outlineOffset = "2px";
    });
    button.addEventListener("blur", () => {
      button.style.outline = "";
      button.style.outlineOffset = "";
    });
    button.innerHTML = `
      <span class="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center text-white shrink-0 font-bold text-lg">📦</span>
      <span class="truncate">
        <span class="block text-[13px] font-bold tracking-tight text-white leading-tight">CSV Backup / Restore</span>
        <span class="block text-[11px] text-white mt-0.5 leading-tight">สำรองและนำเข้าข้อมูล 5 หน้า</span>
      </span>
    `;
    button.querySelectorAll("span").forEach((span) => {
      span.style.color = "#fff";
    });
    button.querySelector("span span").style.color = "#d1fae5";
    button.addEventListener("click", openBackupModal);
    const documentButton = sidebar.querySelector("#qap-sidebar-doc-btn");
    if (documentButton) sidebar.insertBefore(button, documentButton);
    else sidebar.appendChild(button);
  }

  function observeSidebar() {
    const sidebar = document.querySelector("aside") || document.querySelector('[role="complementary"]');
    if (!sidebar) return;
    renderButton(sidebar);
  }

  function showStatus(status, message, isError) {
    status.textContent = message;
    status.style.color = isError ? "#fecaca" : "#bbf7d0";
    status.style.display = message ? "block" : "none";
  }

  function openBackupModal() {
    const existing = document.getElementById("qap-csv-backup-modal");
    if (existing) existing.remove();

    const overlay = document.createElement("div");
    overlay.id = "qap-csv-backup-modal";
    overlay.style.cssText = "position:fixed;inset:0;z-index:100001;background:rgba(15,23,42,.82);backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;padding:16px;font-family:Prompt,-apple-system,BlinkMacSystemFont,sans-serif;";
    overlay.innerHTML = `
      <style>
        #qap-csv-backup-modal [data-panel] { background:#fff !important; color:#0f172a !important; }
        #qap-csv-backup-modal [data-description] { color:#334155 !important; }
        #qap-csv-backup-modal [data-file-name] { color:#1e293b !important; }
        #qap-csv-backup-modal [data-close-secondary] { background:#fff !important; color:#334155 !important; border-color:#94a3b8 !important; }
        #qap-csv-backup-modal button:focus-visible { outline:3px solid #60a5fa !important; outline-offset:2px; }
        html.dark #qap-csv-backup-modal [data-panel],
        .dark #qap-csv-backup-modal [data-panel],
        html[data-theme="dark"] #qap-csv-backup-modal [data-panel],
        [data-theme="dark"] #qap-csv-backup-modal [data-panel] { background:#0f172a !important; color:#f8fafc !important; }
        html.dark #qap-csv-backup-modal [data-description],
        .dark #qap-csv-backup-modal [data-description],
        html[data-theme="dark"] #qap-csv-backup-modal [data-description],
        [data-theme="dark"] #qap-csv-backup-modal [data-description] { color:#cbd5e1 !important; }
        html.dark #qap-csv-backup-modal [data-file-name],
        .dark #qap-csv-backup-modal [data-file-name],
        html[data-theme="dark"] #qap-csv-backup-modal [data-file-name],
        [data-theme="dark"] #qap-csv-backup-modal [data-file-name] { color:#e2e8f0 !important; }
        html.dark #qap-csv-backup-modal [data-close-secondary],
        .dark #qap-csv-backup-modal [data-close-secondary],
        html[data-theme="dark"] #qap-csv-backup-modal [data-close-secondary],
        [data-theme="dark"] #qap-csv-backup-modal [data-close-secondary] { background:#1e293b !important; color:#f1f5f9 !important; border-color:#475569 !important; }
        html.dark #qap-csv-backup-modal [data-status],
        .dark #qap-csv-backup-modal [data-status],
        html[data-theme="dark"] #qap-csv-backup-modal [data-status],
        [data-theme="dark"] #qap-csv-backup-modal [data-status] { background:#1e293b !important; color:#bbf7d0 !important; }
      </style>
      <section data-panel role="dialog" aria-modal="true" aria-labelledby="qap-csv-backup-title" style="background:#fff;width:100%;max-width:640px;border-radius:20px;overflow:hidden;box-shadow:0 25px 60px rgba(0,0,0,.4);">
        <header style="padding:20px 24px;background:linear-gradient(135deg,#064e3b,#0f172a);color:#fff;display:flex;align-items:center;justify-content:space-between;gap:16px;">
          <div>
            <h2 id="qap-csv-backup-title" style="margin:0;font-size:19px;font-weight:700;">สำรอง / กู้คืนข้อมูล CSV</h2>
            <p style="margin:5px 0 0;color:#a7f3d0;font-size:12px;">ข้อมูลทั้ง 5 หน้า พร้อมประวัติ สถานะ และรหัสสำหรับจัดหน้า</p>
          </div>
          <button type="button" data-close aria-label="ปิดหน้าต่าง" style="width:36px;height:36px;border:0;border-radius:50%;background:#ffffff22;color:#fff;font-size:20px;cursor:pointer;">×</button>
        </header>
        <div data-panel-content style="padding:24px;color:#0f172a;">
          <p data-description style="margin:0 0 18px;color:#334155;font-size:13px;line-height:1.6;">ไฟล์เดียวจะเก็บรายการจาก CALIBRATION ALL, NORMAL STANDARD, CENTRALIZED, EACH SECTION และ CANCEL โดยระบุหน้าของแต่ละรายการไว้อย่างชัดเจน</p>
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px;">
            <button type="button" data-export style="padding:14px;border:0;border-radius:12px;background:#2563eb;color:#fff;font-weight:700;cursor:pointer;">⬇️ ดาวน์โหลด CSV สำรองทุกหน้า</button>
            <button type="button" data-select style="padding:14px;border:0;border-radius:12px;background:#059669;color:#fff;font-weight:700;cursor:pointer;">⬆️ เลือกไฟล์ CSV เพื่อนำเข้า</button>
          </div>
          <p data-file-name style="display:none;margin:14px 0 0;color:#334155;font-size:12px;overflow-wrap:anywhere;"></p>
          <p data-status role="status" aria-live="polite" style="display:none;margin:14px 0 0;padding:10px 12px;border-radius:10px;background:#0f172a;color:#bbf7d0;font-size:12px;line-height:1.6;white-space:pre-line;"></p>
          <div style="display:flex;justify-content:flex-end;gap:10px;margin-top:18px;">
            <button type="button" data-import disabled style="padding:10px 18px;border:0;border-radius:10px;background:#94a3b8;color:#fff;font-weight:700;cursor:not-allowed;">เริ่มนำเข้าข้อมูล</button>
            <button type="button" data-close data-close-secondary style="padding:10px 18px;border:1px solid #94a3b8;border-radius:10px;background:#fff;color:#334155;font-weight:600;cursor:pointer;">ปิด</button>
          </div>
          <input data-file-input type="file" accept=".csv,text/csv" style="display:none;">
        </div>
      </section>
    `;
    document.body.appendChild(overlay);

    const status = overlay.querySelector("[data-status]");
    const fileName = overlay.querySelector("[data-file-name]");
    const fileInput = overlay.querySelector("[data-file-input]");
    const importButton = overlay.querySelector("[data-import]");
    let parsedRows = null;
    let isBusy = false;

    const close = () => {
      if (!isBusy) {
        overlay.remove();
        window.removeEventListener("keydown", onEscape);
      }
    };
    overlay.querySelectorAll("[data-close]").forEach((button) => button.addEventListener("click", close));
    overlay.addEventListener("click", (event) => {
      if (event.target === overlay) close();
    });
    const onEscape = (event) => {
      if (event.key === "Escape") close();
    };
    window.addEventListener("keydown", onEscape);

    overlay.querySelector("[data-select]").addEventListener("click", () => fileInput.click());
    fileInput.addEventListener("change", async () => {
      const file = fileInput.files && fileInput.files[0];
      parsedRows = null;
      importButton.disabled = true;
      importButton.style.background = "#94a3b8";
      importButton.style.cursor = "not-allowed";
      if (!file) return;
      fileName.textContent = `ไฟล์ที่เลือก: ${file.name}`;
      fileName.style.display = "block";
      try {
        const rows = parseCsv(await file.text());
        const counts = Object.fromEntries(PAGE_CONFIG.map((page) => [
          page.label,
          rows.filter((row) => row.pageKey === page.key).length,
        ]));
        parsedRows = rows;
        importButton.disabled = false;
        importButton.style.background = "#059669";
        importButton.style.cursor = "pointer";
        showStatus(status, `ตรวจสอบไฟล์ผ่าน ${rows.length.toLocaleString()} รายการ\n${Object.entries(counts).map(([label, count]) => `${label}: ${count.toLocaleString()}`).join("  |  ")}`, false);
      } catch (error) {
        showStatus(status, error.message, true);
      }
    });

    overlay.querySelector("[data-export]").addEventListener("click", async () => {
      if (isBusy) return;
      isBusy = true;
      showStatus(status, "กำลังเตรียมข้อมูลทุกหน้า...", false);
      try {
        const data = await getLocalData();
        const count = Object.values(countRows(data)).reduce((sum, value) => sum + value, 0);
        if (count === 0) throw new Error("ไม่พบข้อมูลในทั้ง 5 หน้า จึงยังสร้างไฟล์สำรองไม่ได้");
        const blob = new Blob([buildCsv(data)], { type: "text/csv;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = `carrier-qap-backup-${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        const counts = countRows(data);
        showStatus(status, `สำรองสำเร็จ ${count.toLocaleString()} รายการ\n${PAGE_CONFIG.map((page) => `${page.label}: ${counts[page.key].toLocaleString()}`).join("  |  ")}`, false);
      } catch (error) {
        console.error("[CSV Backup] Export failed:", error);
        showStatus(status, `สำรองไม่สำเร็จ: ${error.message}`, true);
      } finally {
        isBusy = false;
      }
    });

    importButton.addEventListener("click", async () => {
      if (isBusy || !parsedRows) return;
      const counts = Object.fromEntries(PAGE_CONFIG.map((page) => [
        page.dataKey,
        parsedRows.filter((row) => row.pageKey === page.key).length,
      ]));
      const summary = PAGE_CONFIG.map((page) => `${page.label}: ${counts[page.dataKey]}`).join("\n");
      if (!window.confirm(`จะนำเข้าและรวมข้อมูล ${parsedRows.length.toLocaleString()} รายการ โดยไม่ลบรายการเดิม\n${summary}\n\nรายการสถานะยกเลิกจะถูกจัดเข้าหน้า CANCEL ต้องการดำเนินการต่อหรือไม่?`)) return;

      isBusy = true;
      importButton.disabled = true;
      importButton.textContent = "กำลังนำเข้า...";
      overlay.querySelector("[data-export]").disabled = true;
      overlay.querySelector("[data-select]").disabled = true;
      showStatus(status, "กำลังตรวจสอบข้อมูลเดิมและซิงก์ข้อมูล...", false);
      try {
        const backupApi = window.qapSupabase;
        let baseData;
        if (backupApi && backupApi.isConfigured()) {
          if (!backupApi.autoSync && backupApi.getConfig && backupApi.getConfig().autoSync === false) {
            throw new Error("ปิดการซิงก์ฐานข้อมูลอยู่ กรุณาเปิด Auto-Sync ก่อนนำเข้า");
          }
          const connection = await backupApi.testConnection();
          if (!connection.ok) throw new Error(connection.message || "เชื่อมต่อฐานข้อมูลไม่ได้ จึงหยุดการนำเข้า");
          const pulled = await backupApi.pullAll();
          if (!pulled.ok || !pulled.data) throw new Error(pulled.message || "อ่านข้อมูลเดิมจากฐานข้อมูลไม่สำเร็จ");
          baseData = pulled.data;
        } else {
          baseData = await getLocalData();
        }

        const merged = mergeImportedData(baseData, parsedRows);
        if (backupApi && backupApi.isConfigured()) {
          const apiResult = async (result, label) => {
            if (!result || !result.ok) {
              throw new Error(`${label}: ${(result && (result.error || result.message)) || (result && result.skipped ? "ไม่ได้ซิงก์" : "ไม่ทราบสาเหตุ")}`);
            }
          };

          for (const page of PAGE_CONFIG.filter((candidate) => candidate.key !== "cancel")) {
            const items = merged.activeChanges[page.key] || [];
            if (items.length) await apiResult(await backupApi.upsertInstruments(items, page.tabType), `บันทึกหน้า ${page.label}`);
          }
          for (const page of PAGE_CONFIG.filter((candidate) => !["all", "cancel"].includes(candidate.key))) {
            const moved = merged.movedItems[page.key] || [];
            if (moved.length) {
              await apiResult(await backupApi.removeFromPage(moved, page.tabType), `ย้ายออกจากหน้า ${page.label}`);
            }
          }
          if (merged.reactivatedItems.length) {
            await apiResult(await backupApi.removeFromCancel(merged.reactivatedItems), "นำรายการที่กลับมาใช้งานออกจากหน้า CANCEL");
          }
          if (merged.cancelledChanges.length) {
            await apiResult(await backupApi.upsertInstruments(merged.cancelledChanges, "cancel"), "บันทึกหน้า CANCEL");
          }
        }

        if (typeof window.qapApplyImportedData !== "function") {
          throw new Error("ไม่พบตัวเชื่อมต่ออัปเดตแดชบอร์ด กรุณารีเฟรชหน้าแล้วลองอีกครั้ง");
        }
        window.qapApplyImportedData(merged.data);
        window.dispatchEvent(new CustomEvent("qap-threshold-changed"));
        const countsAfter = countRows(merged.data);
        const totalAfter = Object.values(countsAfter).reduce((sum, value) => sum + value, 0);
        showStatus(status, `นำเข้าสำเร็จและอัปเดตแดชบอร์ดทันที\nข้อมูลรวม ${totalAfter.toLocaleString()} รายการ${merged.routedToCancel ? `\nจัดเข้าหน้า CANCEL ${merged.routedToCancel.toLocaleString()} รายการ` : ""}`, false);
        parsedRows = null;
        fileInput.value = "";
        fileName.textContent = "นำเข้าและอัปเดตข้อมูลเรียบร้อย";
        importButton.textContent = "นำเข้าเสร็จแล้ว";
      } catch (error) {
        console.error("[CSV Backup] Import failed:", error);
        showStatus(status, `นำเข้าไม่สำเร็จ: ${error.message}`, true);
        importButton.disabled = false;
        importButton.textContent = "ลองนำเข้าอีกครั้ง";
      } finally {
        isBusy = false;
        overlay.querySelector("[data-export]").disabled = false;
        overlay.querySelector("[data-select]").disabled = false;
      }
    });
  }

  window.qapDataBackup = { buildCsv, parseCsv, mergeImportedData, getPageKey };
  const observer = new MutationObserver(() => {
    const sidebar = document.querySelector("aside") || document.querySelector('[role="complementary"]');
    if (sidebar) renderButton(sidebar);
  });

  function initialize() {
    observeSidebar();
    if (document.body) observer.observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialize, { once: true });
  } else {
    initialize();
  }
})();
