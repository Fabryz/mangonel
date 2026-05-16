const fs = require('fs');
const path = require('path');

const roots = ['server.js', 'public/js'];
const ignore = ['public/js/vendor'];

function walk(target) {
  const stat = fs.statSync(target);
  if (stat.isFile()) return [target];
  return fs.readdirSync(target).flatMap((entry) => walk(path.join(target, entry)));
}

const files = roots.flatMap((r) => walk(r)).filter((file) => file.endsWith('.js') && !ignore.some((i) => file.startsWith(i)));
let failed = false;

for (const file of files) {
  const src = fs.readFileSync(file, 'utf8');
  if (/\s+$/.test(src)) {
    console.error(`${file}: contains trailing whitespace`);
    failed = true;
  }
}

if (failed) process.exit(1);
console.log(`lint: checked ${files.length} files`);
