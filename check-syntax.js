import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { parse } from 'acorn';

const ignoredDirectories = new Set(['.git', 'dist', 'node_modules']);

async function findJavaScriptFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      if (!ignoredDirectories.has(entry.name)) {
        files.push(...await findJavaScriptFiles(fullPath));
      }
    } else if (entry.isFile() && entry.name.endsWith('.js')) {
      files.push(fullPath);
    }
  }

  return files;
}

function parseSource(source, options, label) {
  try {
    parse(source, { ecmaVersion: 'latest', ...options });
  } catch (error) {
    const line = error.loc ? `:${error.loc.line}:${error.loc.column + 1}` : '';
    console.error(`${label}${line}: ${error.message}`);
    process.exitCode = 1;
  }
}

const javascriptFiles = await findJavaScriptFiles('.');
for (const file of javascriptFiles) {
  const source = await readFile(file, 'utf8');
  const sourceType = ['check-syntax.js', 'vite.config.js'].includes(file) ? 'module' : 'script';
  parseSource(source, { sourceType }, file);
}

const html = await readFile('index.html', 'utf8');
const inlineScriptPattern = /<script\b[^>]*>([\s\S]*?)<\/script>/gi;
let match;
let inlineScriptCount = 0;

while ((match = inlineScriptPattern.exec(html))) {
  if (!match[1].trim()) continue;
  inlineScriptCount += 1;
  const line = html.slice(0, match.index).split(/\r?\n/).length;
  parseSource(match[1], { sourceType: 'script' }, `index.html:${line}`);
}

if (!process.exitCode) {
  console.log(`Syntax check passed: ${javascriptFiles.length} JavaScript files and ${inlineScriptCount} inline scripts checked`);
}
