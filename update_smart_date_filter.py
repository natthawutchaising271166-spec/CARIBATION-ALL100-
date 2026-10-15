import sys

with open('app.js', 'r', encoding='utf-8') as f:
    code = f.read()

# 1. Add qapParseDateToTimestamp and matchesSmartDateFilter before function Ek(
helper_code = '''
function qapParseDateToTimestamp(val, isEndOfDay = false) {
  if (!val) return null;
  const str = String(val).trim();
  if (!str || str === "-" || str.toLowerCase() === "n/a") return null;
  if (/^\\d{5}$/.test(str)) {
    const serial = parseInt(str, 10);
    const ms = (serial - 25569) * 86400 * 1000;
    const dt = new Date(ms);
    if (!isNaN(dt.getTime())) {
      if (isEndOfDay) dt.setHours(23, 59, 59, 999);
      else dt.setHours(0, 0, 0, 0);
      return dt.getTime();
    }
  }
  let m = str.match(/^(\\d{4})[-/. ](\\d{1,2})[-/. ](\\d{1,2})/);
  if (m) {
    let y = parseInt(m[1], 10);
    const mo = parseInt(m[2], 10) - 1;
    const d = parseInt(m[3], 10);
    if (y > 2400) y -= 543;
    const dt = new Date(y, mo, d);
    if (!isNaN(dt.getTime())) {
      if (isEndOfDay) dt.setHours(23, 59, 59, 999);
      else dt.setHours(0, 0, 0, 0);
      return dt.getTime();
    }
  }
  m = str.match(/^(\\d{1,2})[-/. ](\\d{1,2})[-/. ](\\d{4})/);
  if (m) {
    let d = parseInt(m[1], 10);
    let mo = parseInt(m[2], 10) - 1;
    let y = parseInt(m[3], 10);
    if (y > 2400) y -= 543;
    const dt = new Date(y, mo, d);
    if (!isNaN(dt.getTime())) {
      if (isEndOfDay) dt.setHours(23, 59, 59, 999);
      else dt.setHours(0, 0, 0, 0);
      return dt.getTime();
    }
  }
  const monthNames = {
    jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
    jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
    "ม.ค.": 0, "ก.พ.": 1, "มี.ค.": 2, "เม.ย.": 3, "พ.ค.": 4, "มิ.ย.": 5,
    "ก.ค.": 6, "ส.ค.": 7, "ก.ย.": 8, "ต.ค.": 9, "พ.ย.": 10, "ธ.ค.": 11,
    "ม.ค": 0, "ก.พ": 1, "มี.ค": 2, "เม.ย": 3, "พ.ค": 4, "มิ.ย": 5,
    "ก.ค": 6, "ส.ค": 7, "ก.ย": 8, "ต.ค": 9, "พ.ย": 10, "ธ.ค": 11
  };
  m = str.match(/^(\\d{1,2})[-/\\s]([A-Za-zก-๙.]+)[-/\\s](\\d{2,4})/);
  if (m) {
    const d = parseInt(m[1], 10);
    const mStr = m[2].toLowerCase();
    const mShort = mStr.slice(0, 3);
    const mo = monthNames[mStr] !== undefined ? monthNames[mStr] : monthNames[mShort];
    let y = parseInt(m[3], 10);
    if (y < 100) y += 2000;
    if (y > 2400) y -= 543;
    if (mo !== undefined) {
      const dt = new Date(y, mo, d);
      if (!isNaN(dt.getTime())) {
        if (isEndOfDay) dt.setHours(23, 59, 59, 999);
        else dt.setHours(0, 0, 0, 0);
        return dt.getTime();
      }
    }
  }
  const dt = new Date(str);
  if (!isNaN(dt.getTime())) {
    if (isEndOfDay) dt.setHours(23, 59, 59, 999);
    else dt.setHours(0, 0, 0, 0);
    return dt.getTime();
  }
  return null;
}
window.qapParseDateToTimestamp = qapParseDateToTimestamp;

function matchesSmartDateFilter(dateVal, filter, item) {
  if (!filter || filter.preset === "ALL") return true;
  if (filter.preset === "OVERDUE") {
    if (item && typeof P0 === "function") {
      const st = P0(item);
      if (st === "overdue") return true;
    }
    const ts = qapParseDateToTimestamp(dateVal, true);
    if (!ts) return false;
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return ts < now.getTime();
  }
  const ts = qapParseDateToTimestamp(dateVal, false);
  if (!ts) return false;
  const d = new Date(ts);
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0).getTime();
  if (filter.preset === "TODAY") {
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999).getTime();
    return ts >= todayStart && ts <= todayEnd;
  }
  if (filter.preset === "THIS_MONTH") {
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  }
  if (filter.preset === "NEXT_MONTH") {
    const nextMo = (now.getMonth() + 1) % 12;
    const nextYr = now.getMonth() === 11 ? now.getFullYear() + 1 : now.getFullYear();
    return d.getFullYear() === nextYr && d.getMonth() === nextMo;
  }
  if (filter.preset === "DAYS_30") {
    const end30 = todayStart + (30 * 86400 * 1000) + (86400 * 1000 - 1);
    return ts >= todayStart && ts <= end30;
  }
  if (filter.preset === "DAYS_60") {
    const end60 = todayStart + (60 * 86400 * 1000) + (86400 * 1000 - 1);
    return ts >= todayStart && ts <= end60;
  }
  if (filter.preset === "DAYS_90") {
    const end90 = todayStart + (90 * 86400 * 1000) + (86400 * 1000 - 1);
    return ts >= todayStart && ts <= end90;
  }
  if (filter.preset === "YEAR_2026") {
    return d.getFullYear() === 2026;
  }
  if (filter.preset === "YEAR_2025") {
    return d.getFullYear() === 2025;
  }
  if (filter.preset === "YEAR_2027") {
    return d.getFullYear() === 2027;
  }
  if (typeof filter.preset === "string" && filter.preset.startsWith("MONTH_")) {
    const moIdx = parseInt(filter.preset.replace("MONTH_", ""), 10);
    if (!isNaN(moIdx)) {
      return d.getMonth() === moIdx;
    }
  }
  if (filter.preset === "CUSTOM" || filter.from || filter.to) {
    const fromTs = filter.from ? qapParseDateToTimestamp(filter.from, false) : null;
    const toTs = filter.to ? qapParseDateToTimestamp(filter.to, true) : null;
    if (fromTs && ts < fromTs) return false;
    if (toTs && ts > toTs) return false;
    return true;
  }
  return true;
}
window.matchesSmartDateFilter = matchesSmartDateFilter;
'''

target_ek = 'function Ek(e){'
if target_ek in code:
    code = code.replace(target_ek, helper_code + '\n' + target_ek, 1)
    print("1. Successfully added date parsing and filter helpers")
else:
    print("Error: target_ek not found")
    sys.exit(1)

with open('app.js', 'w', encoding='utf-8') as f:
    f.write(code)
print("Saved step 1")
