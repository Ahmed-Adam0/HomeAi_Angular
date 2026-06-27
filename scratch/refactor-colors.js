const fs = require('fs');
const path = require('path');

const targetDirs = [
  path.join(__dirname, '..', 'src', 'app', 'features'),
  path.join(__dirname, '..', 'src', 'app', 'shared', 'components'),
  path.join(__dirname, '..', 'src', 'app', 'core', 'components'),
  path.join(__dirname, '..', 'src', 'app', 'core', 'layouts')
];

const replacements = [
  // #ffffff or #fff to --color-surface
  {
    regex: /background(?:-color)?:\s*#(?:fff(?:fff)?)\b(?:\s*!important)?/gi,
    replace: (match) => {
      const isImportant = match.toLowerCase().includes('important');
      return `background-color: var(--color-surface)${isImportant ? ' !important' : ''}`;
    }
  },
  // #faf9f6 or #faf7f2 or #f7f5f2 to --color-background
  {
    regex: /background(?:-color)?:\s*#(?:faf9f6|faf7f2|f7f5f2)\b(?:\s*!important)?/gi,
    replace: (match) => {
      const isImportant = match.toLowerCase().includes('important');
      return `background-color: var(--color-background)${isImportant ? ' !important' : ''}`;
    }
  },
  // #fbfbf9 or #fcfbf9 or #f6f5f2 to --color-card-hover
  {
    regex: /background(?:-color)?:\s*#(?:fbfbf9|fcfbf9|f6f5f2)\b(?:\s*!important)?/gi,
    replace: (match) => {
      const isImportant = match.toLowerCase().includes('important');
      return `background-color: var(--color-card-hover)${isImportant ? ' !important' : ''}`;
    }
  },
  // border-color / border: ... #e8e4dc or #d9d3c7 to --color-border
  {
    regex: /(border(?:-color|-top|-bottom|-left|-right)?:\s*[^;]*?)#(?:e8e4dc|d9d3c7|eee|f3f1ed|e5dfda|e5dfd8)\b(?:\s*!important)?/gi,
    replace: (match, p1) => {
      const isImportant = match.toLowerCase().includes('important');
      return `${p1}var(--color-border)${isImportant ? ' !important' : ''}`;
    }
  },
  // text color: #1e1b18 or #1f1c18 or #38332c or #1e1513 or #544d43 to --color-text
  {
    regex: /color:\s*#(?:1e1b18|1f1c18|38332c|1e1513|544d43)\b(?:\s*!important)?/gi,
    replace: (match) => {
      const isImportant = match.toLowerCase().includes('important');
      return `color: var(--color-text)${isImportant ? ' !important' : ''}`;
    }
  },
  // text color: #8a847c or #8c8375 or #64748b or #796e65 or #a09a90 or #8a857f to --color-text-muted
  {
    regex: /color:\s*#(?:8a847c|8c8375|64748b|796e65|a09a90|8a857f)\b(?:\s*!important)?/gi,
    replace: (match) => {
      const isImportant = match.toLowerCase().includes('important');
      return `color: var(--color-text-muted)${isImportant ? ' !important' : ''}`;
    }
  }
];

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;
  let modified = false;

  for (const rep of replacements) {
    if (rep.regex.test(content)) {
      content = content.replace(rep.regex, rep.replace);
      modified = true;
    }
  }

  if (modified && content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Processed: ${filePath}`);
  }
}

function walkDir(dir) {
  if (!fs.existsSync(dir)) return;
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      walkDir(filePath);
    } else if (file.endsWith('.css')) {
      processFile(filePath);
    }
  });
}

console.log('Starting visual color refactoring audit...');
targetDirs.forEach(walkDir);
console.log('Color refactoring audit completed successfully.');
