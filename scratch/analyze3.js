const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const enPath = path.join(rootDir, 'src/app/shared/i18n/en.json');
const arPath = path.join(rootDir, 'src/app/shared/i18n/ar.json');

const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));
const ar = JSON.parse(fs.readFileSync(arPath, 'utf8'));

function flattenTranslations(obj, prefix = '') {
  const result = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const value = obj[key];
      const newKey = prefix ? `${prefix}.${key}` : key;
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        Object.assign(result, flattenTranslations(value, newKey));
      } else {
        result[newKey] = String(value);
      }
    }
  }
  return result;
}

const flatEn = flattenTranslations(en);
const flatAr = flattenTranslations(ar);

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

const allKeys = new Set([...Object.keys(flatEn), ...Object.keys(flatAr)]);

const keyUsages = {};
allKeys.forEach(k => keyUsages[k] = []);

const dynamicPrefixes = [
  'VENDOR.PAYMENT.',
  'VENDOR.STATUS.',
  'VENDOR.NOTIFICATIONS.TYPE.',
];

const dynamicKeys = new Set();
allKeys.forEach(key => {
  if (dynamicPrefixes.some(p => key.startsWith(p))) {
    dynamicKeys.add(key);
  }
});

fileContents.forEach(f => {
  const content = f.content;
  const dynPatterns = [
    /['"`](VENDOR\.\w+\.)['"`]\s*[+]/g,
    /translate\(['"`]([\w.]+)['"`]\)/g,
  ];
  let m;
  for (const pat of dynPatterns) {
    while ((m = pat.exec(content)) !== null) {
      const prefix = m[1];
      if (prefix.endsWith('.')) {
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
      content.includes(`\`${key}\``) ||
      content.includes(`>${key}<`) || // tag content e.g. <span translate>KEY</span>
      content.includes(`>${key} <`) ||
      content.includes(` ${key} `)
    ) {
      keyUsages[key].push(rel);
    }
  });
});

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

let report = '';
const log = s => { report += s + '\n'; };

log(`Total Flattened EN keys: ${Object.keys(flatEn).length}`);
log(`Total Flattened AR keys: ${Object.keys(flatAr).length}`);
log(`Used keys: ${used.length}`);
log(`Dynamically-used keys: ${dynamic.length}`);
log(`Unused keys (candidates for removal): ${unused.length}`);

log('\n=== UNUSED KEYS ===');
unused.sort().forEach(k => log(`  ${k}`));

fs.writeFileSync(path.join(rootDir, 'scratch/unused_keys3.json'), JSON.stringify(unused, null, 2), 'utf8');
fs.writeFileSync(path.join(rootDir, 'scratch/analysis3.txt'), report, 'utf8');
console.log(`Done. Unused: ${unused.length}, Dynamic: ${dynamic.length}, Used: ${used.length}`);
