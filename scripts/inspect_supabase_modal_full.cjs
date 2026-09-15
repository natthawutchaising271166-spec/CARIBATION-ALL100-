const fs = require("fs");
const code = fs.readFileSync("./app.js", "utf8");

let start = code.indexOf("function SupabaseModal");
let end = code.indexOf("function App(", start);
if (end === -1) end = code.indexOf("const App=", start);
if (end === -1) end = start + 5000;

console.log(code.substring(start, start + 2500));
