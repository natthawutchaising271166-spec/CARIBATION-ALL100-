with open("index.html", "r", encoding="utf-8") as f:
    text = f.read()

idx_start = text.find("/* Elegant Gray Scrollbars for Tables")
idx_end = text.find("</style>", idx_start)

if idx_start != -1 and idx_end != -1:
    new_style = """/* Elegant Gray Scrollbars for Tables & App Containers (เข้ากับโหมดตารางเสมอ) */
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
      /* Firefox scrollbar support */
      * {
        scrollbar-width: thin;
        scrollbar-color: var(--scrollbar-thumb) var(--scrollbar-track);
      }
      /* Webkit / Chrome / Safari / Edge */
      ::-webkit-scrollbar {
        width: 10px;
        height: 10px;
        display: block;
      }
      ::-webkit-scrollbar-track {
        background: var(--scrollbar-track);
        border-radius: 6px;
      }
      ::-webkit-scrollbar-thumb {
        background: var(--scrollbar-thumb);
        border-radius: 6px;
        border: 2px solid var(--scrollbar-track);
      }
      ::-webkit-scrollbar-thumb:hover {
        background: var(--scrollbar-thumb-hover);
      }
      ::-webkit-scrollbar-corner {
        background: var(--scrollbar-corner);
      }
      /* Table Scroll Container Enhancements */
      .overflow-x-auto,
      .overflow-y-auto,
      .overflow-auto,
      .table-scroll-container,
      table {
        scroll-behavior: smooth;
        scrollbar-width: thin !important;
        scrollbar-color: var(--scrollbar-thumb) var(--scrollbar-track) !important;
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
      }
    """
    text = text[:idx_start] + new_style + text[idx_end:]
    with open("index.html", "w", encoding="utf-8") as f:
        f.write(text)
    print("Updated scrollbar style in index.html successfully")
else:
    print("Could not find style block in index.html")
