import re

# 1. Update supabaseClient.js
with open('supabaseClient.js', 'r', encoding='utf-8') as f:
    supabase_code = f.read()

# Replace parseRow with robust implementation
old_parser_regex = r'function parseRow\(row\)\s*\{[\s\S]*?tabType:\s*row\.tab_type\s*\|\|\s*base\.tabType\s*\|\|\s*"calibration_all",\s*\};\s*\}'

new_parser = '''function parseRow(row, defaultTab = "calibration_all") {
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
  }'''

if re.search(old_parser_regex, supabase_code):
    supabase_code = re.sub(old_parser_regex, new_parser, supabase_code, count=1)
    print("Updated parseRow in supabaseClient.js")
else:
    print("Warning: old_parser_regex not matched directly, trying manual string replace")
    idx1 = supabase_code.find('function parseRow(row)')
    if idx1 != -1:
        idx2 = supabase_code.find('// HTTP Helper', idx1)
        if idx2 != -1:
            supabase_code = supabase_code[:idx1] + new_parser + '\n\n  ' + supabase_code[idx2:]
            print("Manually replaced parseRow in supabaseClient.js")

# Update pullFromTable with fallback query
old_pull = '''  async function pullFromTable(tbl) {
    try {
      const rows = await request(`/${tbl}?select=*&order=no.asc&limit=10000`, {
        method: "GET",
      });
      if (!Array.isArray(rows)) return [];
      return rows.map(parseRow).filter(Boolean);
    } catch (e) {
      console.warn(`[Supabase Pull] Failed for table ${tbl}:`, e);
      return [];
    }
  }'''

new_pull = '''  async function pullFromTable(tbl) {
    try {
      let rows = null;
      try {
        rows = await request(`/${tbl}?select=*&order=no.asc&limit=10000`, { method: "GET" });
      } catch (orderErr) {
        rows = await request(`/${tbl}?select=*&limit=10000`, { method: "GET" });
      }
      if (!Array.isArray(rows)) return [];
      return rows.map((r, idx) => {
        const parsed = parseRow(r, tbl.replace("qap_", ""));
        if (parsed && (!parsed.no || parsed.no <= 0)) parsed.no = idx + 1;
        return parsed;
      }).filter(Boolean);
    } catch (e) {
      console.warn(`[Supabase Pull] Failed for table ${tbl}:`, e);
      return [];
    }
  }'''

if old_pull in supabase_code:
    supabase_code = supabase_code.replace(old_pull, new_pull, 1)
    print("Updated pullFromTable in supabaseClient.js")

with open('supabaseClient.js', 'w', encoding='utf-8') as f:
    f.write(supabase_code)

print("supabaseClient.js updated successfully!")
