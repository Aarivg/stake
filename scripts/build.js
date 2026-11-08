// Inlines src/ into one self-contained index.html (no dependencies, no bundler).
// Styles and app modules are concatenated in file-name order.
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const read = p => fs.readFileSync(path.join(root, p), 'utf8');
const dir = d => fs.readdirSync(path.join(root, d)).filter(f => !f.startsWith('.')).sort().map(f => read(path.join(d, f)));

const css = dir('src/styles').join('\n');
const app = "(function () {\n  'use strict';\n" + dir('src/app').join('\n') + '})();\n';
const html = read('src/template.html')
  .replace('/*STYLE*/', () => css)
  .replace('/*ENGINE*/', () => read('src/engine.js'))
  .replace('/*APP*/', () => app);
fs.writeFileSync(path.join(root, 'index.html'), html);
console.log(`index.html written (${(html.length / 1024).toFixed(0)} KB)`);
