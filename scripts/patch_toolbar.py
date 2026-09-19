import sys

def main():
    with open("app.js", "r", encoding="utf-8") as f:
        text = f.read()

    start_str = 'me.size>0&&m.jsxDEV("div",{className:"absolute bottom-16'
    end_str = 'fileName:"/app/applet/src/components/InstrumentTable.tsx",lineNumber:1349,columnNumber:9},void 0)'

    idx_start = text.find(start_str)
    idx_end = text.find(end_str, idx_start)

    if idx_start == -1 or idx_end == -1:
        print("Could not find block!")
        sys.exit(1)

    new_block = (
        'me.size>0&&m.jsxDEV("div",{className:"fixed bottom-5 sm:bottom-6 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-1.5rem)] sm:w-auto max-w-[calc(100vw-2rem)] mx-auto animate-in slide-in-from-bottom-5 fade-in duration-200 pointer-events-auto",children:'
        'm.jsxDEV("div",{className:"bg-slate-900/95 dark:bg-slate-950/95 text-white backdrop-blur-xl border border-slate-700/90 dark:border-slate-800 rounded-2xl shadow-[0_20px_50px_-10px_rgba(0,0,0,0.7),0_0_0_1px_rgba(255,255,255,0.08)] p-2.5 sm:px-4 sm:py-2.5 flex flex-col lg:flex-row items-center gap-2 sm:gap-3 text-xs",children:['
        'm.jsxDEV("div",{className:"flex items-center justify-between w-full lg:w-auto gap-2.5 shrink-0 px-1",children:['
        'm.jsxDEV("div",{className:"flex items-center gap-2 font-bold",children:['
        'm.jsxDEV("div",{className:"w-6 h-6 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0",children:'
        'm.jsxDEV(ov,{className:"w-3.5 h-3.5 text-blue-400"},void 0,!1,{fileName:"/app/applet/src/components/InstrumentTable.tsx"},void 0)'
        '},void 0,!1,{fileName:"/app/applet/src/components/InstrumentTable.tsx"},void 0),'
        'm.jsxDEV("span",{className:"text-slate-200 whitespace-nowrap",children:["เลือกแล้ว ",m.jsxDEV("span",{className:"text-blue-400 font-mono font-bold text-sm",children:me.size},void 0,!1,{fileName:"/app/applet/src/components/InstrumentTable.tsx"},void 0)," รายการ"]},void 0,!0,{fileName:"/app/applet/src/components/InstrumentTable.tsx"},void 0),'
        'me.size<ir.length&&m.jsxDEV("button",{type:"button",onClick:yn,className:"text-[11px] text-blue-300 hover:text-white underline underline-offset-2 transition shrink-0 cursor-pointer ml-0.5",title:"เลือกเครื่องมือทั้งหมดที่ผ่านการกรอง",children:["(เลือกทั้งหมด ",ir.length,")"]},void 0,!0,{fileName:"/app/applet/src/components/InstrumentTable.tsx"},void 0)'
        ']},void 0,!0,{fileName:"/app/applet/src/components/InstrumentTable.tsx"},void 0),'
        'm.jsxDEV("button",{type:"button",onClick:Kt,className:"lg:hidden text-slate-400 hover:text-white transition p-1.5 rounded-lg hover:bg-white/10 shrink-0 cursor-pointer",title:"ยกเลิกการเลือกทั้งหมด",children:m.jsxDEV(Xl,{className:"w-4 h-4"},void 0,!1,{fileName:"/app/applet/src/components/InstrumentTable.tsx"},void 0)},void 0,!1,{fileName:"/app/applet/src/components/InstrumentTable.tsx"},void 0)'
        ']},void 0,!0,{fileName:"/app/applet/src/components/InstrumentTable.tsx"},void 0),'
        'm.jsxDEV("div",{className:"hidden lg:block h-5 w-px bg-slate-700/80 shrink-0"},void 0,!1,{fileName:"/app/applet/src/components/InstrumentTable.tsx"},void 0),'
        'm.jsxDEV("div",{className:"lg:hidden w-full h-px bg-slate-800 shrink-0"},void 0,!1,{fileName:"/app/applet/src/components/InstrumentTable.tsx"},void 0),'
        'm.jsxDEV("div",{className:"flex flex-wrap items-center justify-center lg:justify-start gap-1.5 sm:gap-2 w-full lg:w-auto",children:['
        'm.jsxDEV("button",{type:"button",onClick:()=>{setBlkSt("normal");ae(!0)},className:"inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition shadow-md shadow-emerald-950/40 ring-1 ring-emerald-400/40 shrink-0 active:scale-95 cursor-pointer",title:"อัปเดตเครื่องมือที่เลือกเป็น \'สอบเทียบแล้ว\' พร้อมบันทึกวันที่ปัจจุบันทันที",children:['
        'm.jsxDEV(hl,{className:"w-3.5 h-3.5 text-white stroke-[3]"},void 0,!1,{fileName:"/app/applet/src/components/InstrumentTable.tsx"},void 0),'
        'm.jsxDEV("span",{children:"สอบเทียบแล้ว (Calibrated)"},void 0,!1,{fileName:"/app/applet/src/components/InstrumentTable.tsx"},void 0),'
        'm.jsxDEV("span",{className:"bg-emerald-700/90 text-emerald-100 text-[10px] px-1.5 py-0.5 rounded-md font-mono hidden sm:inline",children:"วันนี้"},void 0,!1,{fileName:"/app/applet/src/components/InstrumentTable.tsx"},void 0)'
        ']},void 0,!0,{fileName:"/app/applet/src/components/InstrumentTable.tsx"},void 0),'
        'm.jsxDEV("button",{type:"button",onClick:Ln,className:"inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 font-bold transition shadow-xs text-white shrink-0 active:scale-95 cursor-pointer",title:"เปลี่ยนสถานะเครื่องมือที่เลือกเป็น \'ส่งสอบเทียบ\' ทันที",children:['
        'm.jsxDEV("span",{className:"w-2 h-2 rounded-full bg-white"},void 0,!1,{fileName:"/app/applet/src/components/InstrumentTable.tsx"},void 0),'
        'm.jsxDEV("span",{children:"ส่งสอบเทียบ (In Cal)"},void 0,!1,{fileName:"/app/applet/src/components/InstrumentTable.tsx"},void 0)'
        ']},void 0,!0,{fileName:"/app/applet/src/components/InstrumentTable.tsx"},void 0),'
        'm.jsxDEV("button",{type:"button",onClick:()=>{setBlkSt("in_calibration");ae(!0)},className:"inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 font-semibold transition text-slate-100 shrink-0 active:scale-95 cursor-pointer",title:"เปิดตัวเลือกสถานะอื่นๆ และกำหนดวันที่",children:['
        'm.jsxDEV(Tk,{className:"w-3.5 h-3.5 text-indigo-400"},void 0,!1,{fileName:"/app/applet/src/components/InstrumentTable.tsx"},void 0),'
        'm.jsxDEV("span",{children:"เปลี่ยนสถานะ..."},void 0,!1,{fileName:"/app/applet/src/components/InstrumentTable.tsx"},void 0)'
        ']},void 0,!0,{fileName:"/app/applet/src/components/InstrumentTable.tsx"},void 0),'
        'm.jsxDEV("div",{className:"hidden sm:block h-4 w-px bg-slate-700 shrink-0"},void 0,!1,{fileName:"/app/applet/src/components/InstrumentTable.tsx"},void 0),'
        'm.jsxDEV("button",{type:"button",onClick:()=>{Oa[0]&&u(Oa[0])},className:"inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 font-semibold transition text-slate-200 hover:text-white shrink-0 cursor-pointer",title:"พิมพ์สติ๊กเกอร์ / ใบเซอร์ของรายการที่เลือก",children:['
        'm.jsxDEV(bd,{className:"w-3.5 h-3.5"},void 0,!1,{fileName:"/app/applet/src/components/InstrumentTable.tsx"},void 0),'
        'm.jsxDEV("span",{className:"hidden sm:inline",children:"พิมพ์"},void 0,!1,{fileName:"/app/applet/src/components/InstrumentTable.tsx"},void 0)'
        ']},void 0,!0,{fileName:"/app/applet/src/components/InstrumentTable.tsx"},void 0),'
        'm.jsxDEV("button",{type:"button",onClick:()=>{Oa.length>0&&C4(Oa,"SELECTED_INSTRUMENTS.xlsx")},className:"inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 font-semibold transition text-slate-200 hover:text-white shrink-0 cursor-pointer",title:"ส่งออกเฉพาะรายการที่เลือกเป็นไฟล์ XLS",children:['
        'm.jsxDEV(Sh,{className:"w-3.5 h-3.5"},void 0,!1,{fileName:"/app/applet/src/components/InstrumentTable.tsx"},void 0),'
        'm.jsxDEV("span",{className:"hidden sm:inline",children:"ส่งออก XLS"},void 0,!1,{fileName:"/app/applet/src/components/InstrumentTable.tsx"},void 0)'
        ']},void 0,!0,{fileName:"/app/applet/src/components/InstrumentTable.tsx"},void 0),'
        'm.jsxDEV("button",{type:"button",onClick:()=>{window.confirm(`ยืนยันการลบเครื่องมือวัดที่เลือกจำนวน ${me.size} รายการหรือไม่?`)&&(n?n(Array.from(me),`ลบ ${me.size} รายการ`):me.forEach(j=>r(j)),Ne(new Set))},className:"inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-rose-950/60 hover:bg-rose-900/80 border border-rose-800/80 text-rose-300 font-semibold transition shrink-0 cursor-pointer",title:"ลบเฉพาะรายการที่เลือก",children:['
        'm.jsxDEV(vd,{className:"w-3.5 h-3.5 text-rose-400"},void 0,!1,{fileName:"/app/applet/src/components/InstrumentTable.tsx"},void 0),'
        'm.jsxDEV("span",{className:"hidden sm:inline",children:"ลบที่เลือก"},void 0,!1,{fileName:"/app/applet/src/components/InstrumentTable.tsx"},void 0)'
        ']},void 0,!0,{fileName:"/app/applet/src/components/InstrumentTable.tsx"},void 0),'
        'm.jsxDEV("button",{type:"button",onClick:Kt,className:"hidden lg:flex text-slate-400 hover:text-white transition p-1.5 rounded-lg hover:bg-white/10 shrink-0 cursor-pointer",title:"ยกเลิกการเลือกทั้งหมด",children:m.jsxDEV(Xl,{className:"w-4 h-4"},void 0,!1,{fileName:"/app/applet/src/components/InstrumentTable.tsx"},void 0)},void 0,!1,{fileName:"/app/applet/src/components/InstrumentTable.tsx"},void 0)'
        ']},void 0,!0,{fileName:"/app/applet/src/components/InstrumentTable.tsx"},void 0)'
        ']},void 0,!0,{fileName:"/app/applet/src/components/InstrumentTable.tsx"},void 0)'
        '})'
    )

    new_text = text[:idx_start] + new_block + text[idx_end + len(end_str):]

    with open("app.js", "w", encoding="utf-8") as f:
        f.write(new_text)

    print("Patch applied successfully!")

if __name__ == "__main__":
    main()
