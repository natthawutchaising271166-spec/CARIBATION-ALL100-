with open("app.js", "r") as f:
    text = f.read()

idx = text.find("function aSe")
if idx != -1:
    # Let's search for "return " after "function aSe"
    idx_ret = text.find("return", idx + 20)
    print(text[idx_ret:idx_ret+1500])
