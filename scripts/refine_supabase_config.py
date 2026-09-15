with open("supabaseClient.js", "r", encoding="utf-8") as f:
    text = f.read()

target = """        const effectiveUrl = (parsed.url && parsed.url.startsWith("http") ? parsed.url : embeddedUrl).trim().replace(/\\/+$/, "");
        const effectiveKey = (parsed.anonKey && parsed.anonKey.length > 20 ? parsed.anonKey : embeddedKey).trim();"""

replacement = """        const isPlaceholderUrl = !parsed.url || parsed.url.includes("your-project-id");
        const isPlaceholderKey = !parsed.anonKey || parsed.anonKey.includes("...") || parsed.anonKey.length < 30;
        const effectiveUrl = (!isPlaceholderUrl && parsed.url.startsWith("http") ? parsed.url : embeddedUrl).trim().replace(/\\/+$/, "");
        const effectiveKey = (!isPlaceholderKey ? parsed.anonKey : embeddedKey).trim();"""

if target in text:
    text = text.replace(target, replacement, 1)
    with open("supabaseClient.js", "w", encoding="utf-8") as f:
        f.write(text)
    print("Refined loadConfig to ignore placeholders successfully")
else:
    print("Target string not found, check lines")
