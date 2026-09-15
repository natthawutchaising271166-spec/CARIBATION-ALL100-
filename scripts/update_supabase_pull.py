import re

with open('supabaseClient.js', 'r', encoding='utf-8') as f:
    code = f.read()

# Replace pullFromTable
old_pull_pattern = r'async function pullFromTable\(tbl\)\s*\{[\s\S]*?catch \(e\) \{\s*console\.warn\(`\[Supabase Pull\] Failed for table \$\{tbl\}:`, e\);\s*return \[\];\s*\}\s*\}'

new_pull = '''async function pullFromTable(tbl) {
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
  }'''

if re.search(old_pull_pattern, code):
    code = re.sub(old_pull_pattern, new_pull, code, count=1)
    print("Replaced pullFromTable using regex")
else:
    print("Regex didn't match, using find/replace")
    idx = code.find('async function pullFromTable(tbl)')
    idx2 = code.find('// 2. Push All 5 Pages', idx)
    if idx != -1 and idx2 != -1:
        code = code[:idx] + new_pull + '\n\n  ' + code[idx2:]
        print("Replaced pullFromTable using index slice")

with open('supabaseClient.js', 'w', encoding='utf-8') as f:
    f.write(code)

print("supabaseClient.js updated successfully")
