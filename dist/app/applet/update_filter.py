with open('app.js', 'r', encoding='utf-8') as f:
    text = f.read()

target = '    if((H.includes("control of monitoring")||H.includes("qap section")||H.includes("form no"))&&!R&&!M&&!I||H.startsWith("total")||H.startsWith("รวมทั้งหมด")||H.startsWith("summary")||!V&&!M&&!R&&!B&&!I||/^\d+$/.test(V)&&!M&&!R&&!B&&!I)continue;'

replacement = '    if(!V)continue;\n    if(H.includes("control of monitoring")||H.includes("qap section")||H.includes("form no")||H.startsWith("total")||H.startsWith("รวมทั้งหมด")||H.startsWith("summary")||H.startsWith("sum")||H.startsWith("grand total")||H.startsWith("รวม"))continue;\n    if(!B&&!I&&!R&&!M&&(/^\d+[\\.\\)]/.test(V)||V.length<3||/^\\d+$/.test(V)||V.toUpperCase().includes("SECTION")||V.toUpperCase().includes("DEPARTMENT")||V.toUpperCase().includes("GROUP")||V.toUpperCase().includes("CATEGORY")||V.toUpperCase().includes("STANDARD")||V.toUpperCase().includes("CENTRAL")||V.toUpperCase().includes("CANCEL")))continue;'

if target in text:
    text = text.replace(target, replacement)
    with open('app.js', 'w', encoding='utf-8') as f:
        f.write(text)
    print("Successfully updated H3e filtering in app.js")
else:
    print("Target not found in app.js")
