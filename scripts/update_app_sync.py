import re

with open('app.js', 'r', encoding='utf-8') as f:
    code = f.read()

# 1. Replace isQapSampleItem & purgeSampleItems
sample_def_pattern = r'const isQapSampleItem\s*=\s*\(item\)[\s\S]*?const purgeSampleItems\s*=\s*\(list\)[\s\S]*?return list\.filter\(item => !isQapSampleItem\(item\)\)\.map\(item => \{[\s\S]*?\}\);'

new_sample_def = '''const isQapSampleItem = (item) => {
  if (!item) return true;
  const name = String(item.instrumentName || "").trim().toLowerCase();
  const code = String(item.codeNo || "").trim().toLowerCase();
  if (name.startsWith("(qap section") || name === "no." || name === "no" || name === "instrrument name" || name === "instrument name" || name.includes("control of monitoring") || code === "code no." || code === "code no") {
    return true;
  }
  return false;
};
const purgeSampleItems = (list) => {
  if (!Array.isArray(list)) return [];
  return list.filter(item => item && !isQapSampleItem(item));
};'''

if re.search(sample_def_pattern, code):
    code = re.sub(sample_def_pattern, new_sample_def, code, count=1)
    print("Replaced isQapSampleItem and purgeSampleItems via regex")
else:
    print("Trying index-based replacement for isQapSampleItem...")
    idx1 = code.find('const isQapSampleItem = (item)')
    if idx1 != -1:
        idx2 = code.find('const nsStorageKey =', idx1)
        if idx2 != -1:
            code = code[:idx1] + new_sample_def + '\n' + code[idx2:]
            print("Replaced isQapSampleItem via index slice")

# 2. Ensure handleSupabasePullData accepts whatever is returned from Supabase directly
old_pull_handler = '''  const handleSupabasePullData = (data) => {
    if (!data) return;
    if (Array.isArray(data.all) && data.all.length > 0) {
      f(data.all);
      safeSaveStorage(ah, data.all);
    }
    if (Array.isArray(data.normalStandard)) {
      setNsInstruments(data.normalStandard);
      safeSaveStorage(nsStorageKey, data.normalStandard);
    }
    if (Array.isArray(data.centralized)) {
      setCentInstruments(data.centralized);
      safeSaveStorage(centStorageKey, data.centralized);
    }
    if (Array.isArray(data.eachSection)) {
      setEachInstruments(data.eachSection);
      safeSaveStorage(eachStorageKey, data.eachSection);
    }
    if (Array.isArray(data.cancel)) {
      setCancelInstruments(data.cancel);
      safeSaveStorage(cancelStorageKey, data.cancel);
    }
    ae();
  };'''

new_pull_handler = '''  const handleSupabasePullData = (data) => {
    if (!data) return;
    if (Array.isArray(data.all)) {
      f(data.all);
      safeSaveStorage(ah, data.all);
      idbSet(ah, data.all);
    }
    if (Array.isArray(data.normalStandard)) {
      setNsInstruments(data.normalStandard);
      safeSaveStorage(nsStorageKey, data.normalStandard);
      idbSet(nsStorageKey, data.normalStandard);
    }
    if (Array.isArray(data.centralized)) {
      setCentInstruments(data.centralized);
      safeSaveStorage(centStorageKey, data.centralized);
      idbSet(centStorageKey, data.centralized);
    }
    if (Array.isArray(data.eachSection)) {
      setEachInstruments(data.eachSection);
      safeSaveStorage(eachStorageKey, data.eachSection);
      idbSet(eachStorageKey, data.eachSection);
    }
    if (Array.isArray(data.cancel)) {
      setCancelInstruments(data.cancel);
      safeSaveStorage(cancelStorageKey, data.cancel);
      idbSet(cancelStorageKey, data.cancel);
    }
    ae();
  };'''

if old_pull_handler in code:
    code = code.replace(old_pull_handler, new_pull_handler, 1)
    print("Replaced handleSupabasePullData")
else:
    print("Warning: old_pull_handler not found verbatim, checking regex...")
    code = re.sub(
        r'const handleSupabasePullData\s*=\s*\(data\)\s*=>\s*\{[\s\S]*?ae\(\);\s*\};',
        new_pull_handler.strip(),
        code,
        count=1
    )
    print("Replaced handleSupabasePullData via regex")

with open('app.js', 'w', encoding='utf-8') as f:
    f.write(code)

print("app.js updated successfully")
