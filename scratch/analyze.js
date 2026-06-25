const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const enPath = path.join(rootDir, 'src/app/shared/i18n/en.json');
const arPath = path.join(rootDir, 'src/app/shared/i18n/ar.json');

const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));
const ar = JSON.parse(fs.readFileSync(arPath, 'utf8'));

// Helper to walk directory
function walkDir(dir, filterFn) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.git' && file !== '.angular' && file !== 'dist') {
        results = results.concat(walkDir(fullPath, filterFn));
      }
    } else {
      if (filterFn(fullPath)) {
        results.push(fullPath);
      }
    }
  });
  return results;
}

const files = walkDir(path.join(rootDir, 'src'), (p) => p.endsWith('.html') || p.endsWith('.ts'));

// Read all files content
const fileContents = files.map(filePath => ({
  path: filePath,
  content: fs.readFileSync(filePath, 'utf8')
}));

// Find key usages
const keyUsages = {};
for (const key of Object.keys(en)) {
  keyUsages[key] = [];
}
for (const key of Object.keys(ar)) {
  if (!keyUsages[key]) keyUsages[key] = [];
}

fileContents.forEach(f => {
  const relPath = path.relative(rootDir, f.path);
  Object.keys(keyUsages).forEach(key => {
    // Check if key is used in html or ts. We look for key as string literal
    if (f.content.includes(`'${key}'`) || f.content.includes(`"${key}"`) || f.content.includes(`\`${key}\``)) {
      keyUsages[key].push(relPath);
    }
  });
});

let report = '';
const log = (msg) => { report += msg + '\n'; };

log(`Loaded English keys: ${Object.keys(en).length}`);
log(`Loaded Arabic keys: ${Object.keys(ar).length}`);

log('\n--- KEYS IN EN.JSON BUT MISSING IN AR.JSON ---');
const missingInAr = [];
Object.keys(en).forEach(key => {
  if (!(key in ar)) {
    missingInAr.push(key);
    log(`${key}: "${en[key]}" (Used in: ${keyUsages[key].length ? keyUsages[key].join(', ') : 'NONE'})`);
  }
});

log('\n--- KEYS IN AR.JSON BUT MISSING IN EN.JSON ---');
const missingInEn = [];
Object.keys(ar).forEach(key => {
  if (!(key in en)) {
    missingInEn.push(key);
    log(`${key}: "${ar[key]}" (Used in: ${keyUsages[key].length ? keyUsages[key].join(', ') : 'NONE'})`);
  }
});

log('\n--- UNUSED KEYS IN EN.JSON (Rule 3 Candidates) ---');
const unusedEn = [];
Object.keys(en).forEach(key => {
  if (keyUsages[key].length === 0) {
    unusedEn.push(key);
    log(`${key}: "${en[key]}"`);
  }
});

log('\n--- UNUSED KEYS IN AR.JSON (Rule 3 Candidates) ---');
const unusedAr = [];
Object.keys(ar).forEach(key => {
  if (keyUsages[key].length === 0) {
    unusedAr.push(key);
    log(`${key}: "${ar[key]}"`);
  }
});

log('\n--- KEYS WHERE AR.JSON HAS VALUE EQUAL TO EN.JSON (AND VALUE HAS ENGLISH ALPHABET) ---');
const sameValue = [];
const englishRegex = /[a-zA-Z]/;
Object.keys(en).forEach(key => {
  if (key in ar && en[key] === ar[key] && englishRegex.test(en[key])) {
    sameValue.push(key);
    log(`${key}: "${en[key]}" (Used in: ${keyUsages[key].length ? keyUsages[key].join(', ') : 'NONE'})`);
  }
});

log('\n--- Summary ---');
log(`Missing in Arabic: ${missingInAr.length}`);
log(`Missing in English: ${missingInEn.length}`);
log(`Unused in English: ${unusedEn.length}`);
log(`Unused in Arabic: ${unusedAr.length}`);
log(`Same value (English in both): ${sameValue.length}`);

fs.writeFileSync(path.join(rootDir, 'scratch/analysis_report.txt'), report, 'utf8');
console.log('Report written to scratch/analysis_report.txt');
