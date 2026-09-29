with open('/app/applet/app.js', 'r', encoding='utf-8') as f:
    text = f.read()

target_export = 'exportExcelWithExactFormat(items, filename = "INSTRUMENT_CALIBRATION_LIST.xlsx", options = {}) {'

replacement_export = '''exportExcelWithExactFormat(items, filename = "INSTRUMENT_CALIBRATION_LIST.xlsx", options = {}) {  let globalCfg = {};  try { const sc = localStorage.getItem("QAP_DOCUMENT_CONFIG_V1"); if (sc) globalCfg = JSON.parse(sc); } catch(e) {}  const d = new Date();  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];  const issueDateStr = `${String(d.getDate()).padStart(2, '0')}-${months[d.getMonth()]}-${d.getFullYear()}`;  const monthYearStr = options.period || globalCfg.period || `${d.getMonth() + 1}/${d.getFullYear()}`;  const titleText = options.title || globalCfg.title || `Monthly calibration list ’Instrument in due 1/2026`;  const preparedBy = options.preparedBy || globalCfg.preparedBy || "Thawatchai";  const approveBy = options.approveBy || globalCfg.approveBy || "Mr. Wissawat";  const retention = options.retention || globalCfg.retention || "11 Year";  const formatCode = options.formatCode || globalCfg.formatCode || "Format-4 OM (C01-22-BM-002)";  const company = options.company || globalCfg.company || "CARRIER AIR CONDITIONING (THAILAND) CO., LTD [Q/A] (QAA)";  const revisionNo = options.revisionNo || globalCfg.revisionNo || "Revision No.0  08/07/2024";'''

if target_export in text:
    text = text.replace(target_export, replacement_export, 1)
    text = text.replace('rRev.getCell(1).value = "Revision No.0  08/07/2024";', 'rRev.getCell(1).value = revisionNo;')
    with open('/app/applet/app.js', 'w', encoding='utf-8') as f:
        f.write(text)
    print("Successfully updated exportExcelWithExactFormat")
else:
    print("target_export not found")
