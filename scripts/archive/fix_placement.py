with open("app.js", "r") as f:
    text = f.read()

# We need to find the entire centerTab === "30d" section up to its end.
start_idx = text.find("centerTab === \"30d\" && h(\"div\", {")
if start_idx != -1:
    # let's find the end of this block by finding the start of the next known block or end of Ube?
    # Actually, it's followed by `// -----------------------------------------------------------------------`
    # Wait, the next column starts with `// COLUMN 3` or similar. Let's see what follows it.
    end_idx = text.find("      // -----------------------------------------------------------------------", start_idx)
    
    if end_idx != -1:
        block = text[start_idx:end_idx]
        
        # Remove block from current position
        # Be careful to remove the comma before it if it exists.
        text = text[:start_idx-1] + text[end_idx:]
        
        # Now find where it SHOULD be: before `// Bottom Footer in Column 2`
        target_idx = text.find("        // Bottom Footer in Column 2")
        
        if target_idx != -1:
            text = text[:target_idx] + block + ",\n" + text[target_idx:]
            with open("app.js", "w") as f:
                f.write(text)
            print("Fixed successfully!")
        else:
            print("Target not found")
    else:
        print("End of block not found")
else:
    print("Start of block not found")

