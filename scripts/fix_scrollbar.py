with open("style.css", "r", encoding="utf-8") as f:
    text = f.read()

# Target the global invisible scrollbar block
old_block = """/* Global Invisible Scrollbar: ซ่อนแถบเลื่อนทั้งหมดทั่วทั้งแอป เลื่อนได้เนียนตาไม่มี Scrollbar บวม */
::-webkit-scrollbar {
  display: none !important;
  width: 0 !important;
  height: 0 !important;
}
::-webkit-scrollbar-track {
  background: transparent !important;
}
::-webkit-scrollbar-thumb {
  background: transparent !important;
}
* {
  -ms-overflow-style: none !important; /* IE and Edge */
  scrollbar-width: none !important; /* Firefox */
}"""

new_block = """/* ==========================================================================
   TABLE & APP SCROLLBAR: แถบเลื่อนสีเทาเข้ากับโหมดตารางเสมอ (Light & Dark Mode)
   ========================================================================== */
:root {
  --scrollbar-track: #f1f5f9;
  --scrollbar-thumb: #94a3b8;
  --scrollbar-thumb-hover: #64748b;
  --scrollbar-corner: #f1f5f9;
}

.dark, [data-theme="dark"], html.dark {
  --scrollbar-track: #0f172a;
  --scrollbar-thumb: #475569;
  --scrollbar-thumb-hover: #64748b;
  --scrollbar-corner: #0f172a;
}

/* Firefox Scrollbar */
* {
  scrollbar-width: thin;
  scrollbar-color: var(--scrollbar-thumb) var(--scrollbar-track);
}

/* Webkit / Chrome / Safari / Edge Scrollbar */
::-webkit-scrollbar {
  width: 10px !important;
  height: 10px !important;
  display: block !important;
}

::-webkit-scrollbar-track {
  background: var(--scrollbar-track) !important;
  border-radius: 6px !important;
}

::-webkit-scrollbar-thumb {
  background: var(--scrollbar-thumb) !important;
  border-radius: 6px !important;
  border: 2px solid var(--scrollbar-track) !important;
}

::-webkit-scrollbar-thumb:hover {
  background: var(--scrollbar-thumb-hover) !important;
}

::-webkit-scrollbar-corner {
  background: var(--scrollbar-corner) !important;
}

/* Table Scrollbar: ชัดเจน ลื่นไหล สีเทาเข้ากับโหมดตารางเสมอ */
.overflow-x-auto,
.overflow-y-auto,
.overflow-auto,
.table-scroll-container {
  scrollbar-width: thin !important;
  scrollbar-color: var(--scrollbar-thumb) var(--scrollbar-track) !important;
  -ms-overflow-style: auto !important;
}

.overflow-x-auto::-webkit-scrollbar,
.overflow-y-auto::-webkit-scrollbar,
.overflow-auto::-webkit-scrollbar,
.table-scroll-container::-webkit-scrollbar {
  width: 10px !important;
  height: 10px !important;
  display: block !important;
}

.overflow-x-auto::-webkit-scrollbar-track,
.overflow-y-auto::-webkit-scrollbar-track,
.overflow-auto::-webkit-scrollbar-track,
.table-scroll-container::-webkit-scrollbar-track {
  background: var(--scrollbar-track) !important;
  border-radius: 6px !important;
}

.overflow-x-auto::-webkit-scrollbar-thumb,
.overflow-y-auto::-webkit-scrollbar-thumb,
.overflow-auto::-webkit-scrollbar-thumb,
.table-scroll-container::-webkit-scrollbar-thumb {
  background: var(--scrollbar-thumb) !important;
  border-radius: 6px !important;
  border: 2px solid var(--scrollbar-track) !important;
}

.overflow-x-auto::-webkit-scrollbar-thumb:hover,
.overflow-y-auto::-webkit-scrollbar-thumb:hover,
.overflow-auto::-webkit-scrollbar-thumb:hover,
.table-scroll-container::-webkit-scrollbar-thumb:hover {
  background: var(--scrollbar-thumb-hover) !important;
}"""

if old_block in text:
    text = text.replace(old_block, new_block, 1)
    with open("style.css", "w", encoding="utf-8") as f:
        f.write(text)
    print("Replaced global invisible scrollbar with gray adaptive scrollbar in style.css")
else:
    print("old_block not found exactly, attempting normalized search")
    # try replacing by finding start and end
    start_str = "/* Global Invisible Scrollbar:"
    end_str = "scrollbar-width: none !important; /* Firefox */\n}"
    idx_s = text.find(start_str)
    idx_e = text.find(end_str, idx_s)
    if idx_s != -1 and idx_e != -1:
        text = text[:idx_s] + new_block + text[idx_e + len(end_str):]
        with open("style.css", "w", encoding="utf-8") as f:
            f.write(text)
        print("Replaced by range successfully!")
    else:
        print("Could not find start/end range")
