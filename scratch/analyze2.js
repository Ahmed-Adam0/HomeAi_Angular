/**
 * Refined analysis script that detects both:
 * 1. 'KEY' | translate  (in HTML)
 * 2. 'KEY' (in TS as translate service calls)
 * 3. Dynamic key patterns like 'PREFIX.' + var
 */
const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const enPath = path.join(rootDir, 'src/app/shared/i18n/en.json');
const arPath = path.join(rootDir, 'src/app/shared/i18n/ar.json');

const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));
const ar = JSON.parse(fs.readFileSync(arPath, 'utf8'));

function walkDir(dir, filterFn) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      if (!['node_modules', '.git', '.angular', 'dist', 'scratch'].includes(file)) {
        results = results.concat(walkDir(fullPath, filterFn));
      }
    } else if (filterFn(fullPath)) {
      results.push(fullPath);
    }
  });
  return results;
}

const files = walkDir(path.join(rootDir, 'src'), p => p.endsWith('.html') || p.endsWith('.ts'));

const fileContents = files.map(filePath => ({
  path: filePath,
  rel: path.relative(rootDir, filePath),
  content: fs.readFileSync(filePath, 'utf8')
}));

// All keys in both files
const allKeys = new Set([...Object.keys(en), ...Object.keys(ar)]);

// Find used keys - both exact string literals AND dynamic prefix patterns
const keyUsages = {};
allKeys.forEach(k => keyUsages[k] = []);

// Known dynamic prefixes (keys built at runtime via string concatenation)
const dynamicPrefixes = [
  'VENDOR.PAYMENT.',
  'VENDOR.STATUS.',
  'VENDOR.NOTIFICATIONS.TYPE.',
];

// Mark all keys under dynamic prefixes as "dynamically used"
const dynamicKeys = new Set();
allKeys.forEach(key => {
  if (dynamicPrefixes.some(p => key.startsWith(p))) {
    dynamicKeys.add(key);
  }
});

// Also check TS files for any dynamic prefix pattern being concatenated
fileContents.forEach(f => {
  const content = f.content;
  // Look for patterns like 'VENDOR.PAYMENT.' + or translate('VENDOR.STATUS.' +
  const dynPatterns = [
    /['"`](VENDOR\.\w+\.)['"`]\s*[+]/g,
    /translate\(['"`]([\w.]+)['"`]\)/g,
  ];
  let m;
  for (const pat of dynPatterns) {
    while ((m = pat.exec(content)) !== null) {
      const prefix = m[1];
      if (prefix.endsWith('.')) {
        // It's a dynamic prefix being concatenated
        allKeys.forEach(key => {
          if (key.startsWith(prefix)) dynamicKeys.add(key);
        });
      }
    }
  }
});

fileContents.forEach(f => {
  const { rel, content } = f;
  allKeys.forEach(key => {
    if (
      content.includes(`'${key}'`) ||
      content.includes(`"${key}"`) ||
      content.includes(`\`${key}\``)
    ) {
      keyUsages[key].push(rel);
    }
  });
});

// Classify
const unused = [];
const used = [];
const dynamic = [];

allKeys.forEach(key => {
  if (dynamicKeys.has(key)) {
    dynamic.push(key);
  } else if (keyUsages[key].length === 0) {
    unused.push(key);
  } else {
    used.push(key);
  }
});

// Write output
let report = '';
const log = s => { report += s + '\n'; };

log(`Total EN keys: ${Object.keys(en).length}`);
log(`Total AR keys: ${Object.keys(ar).length}`);
log(`Used keys: ${used.length}`);
log(`Dynamically-used keys (safe, do not remove): ${dynamic.length}`);
log(`Unused keys (candidates for removal): ${unused.length}`);

log('\n=== UNUSED KEYS (SAFE TO REMOVE FROM BOTH FILES) ===');
unused.forEach(k => log(`  ${k}`));

log('\n=== DYNAMIC KEYS (KEEP - built at runtime) ===');
dynamic.forEach(k => log(`  ${k}`));

// Also: check for keys in en.json with [object Object] value
log('\n=== CORRUPTED KEYS (value is [object Object]) ===');
Object.keys(en).forEach(k => {
  if (en[k] === '[object Object]' || ar[k] === '[object Object]') {
    log(`  ${k}: en="${en[k]}" ar="${ar[k]}"`);
  }
});

// Write JSON of just unused keys for the cleanup script
const unusedJson = JSON.stringify(unused, null, 2);
fs.writeFileSync(path.join(rootDir, 'scratch/unused_keys.json'), unusedJson, 'utf8');
fs.writeFileSync(path.join(rootDir, 'scratch/analysis2.txt'), report, 'utf8');
console.log(`Done. Unused: ${unused.length}, Dynamic: ${dynamic.length}, Used: ${used.length}`);
