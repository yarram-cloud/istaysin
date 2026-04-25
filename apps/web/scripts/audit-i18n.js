// Audit script: find dashboard pages with hardcoded English strings
const fs = require('fs');
const path = require('path');

const dashDir = path.join(__dirname, '..', 'app', 'dashboard');
const issues = [];

function scan(dir) {
  fs.readdirSync(dir, { withFileTypes: true }).forEach(d => {
    const p = path.join(dir, d.name);
    if (d.isDirectory()) scan(p);
    else if (d.name.endsWith('.tsx') || d.name.endsWith('.ts')) {
      const content = fs.readFileSync(p, 'utf8');
      const relPath = path.relative(dashDir, p);
      const hasUseTranslations = content.includes('useTranslations');
      const usesT = content.includes("t('") || content.includes('t("') || content.includes('t(`');
      
      // Check for hardcoded h1/h2/h3 tags with plain text
      const hardcodedHeadings = [];
      const headingRegex = /<h[1-3][^>]*>([A-Z][a-zA-Z\s&]+)<\/h[1-3]>/g;
      let match;
      while ((match = headingRegex.exec(content)) !== null) {
        hardcodedHeadings.push(match[1].trim());
      }
      
      // Check for hardcoded placeholder strings  
      const hardcodedPlaceholders = [];
      const phRegex = /placeholder="([A-Z][^"]+)"/g;
      while ((match = phRegex.exec(content)) !== null) {
        if (!match[1].includes('{') && !match[1].startsWith('e.g') && !match[1].startsWith('http')) {
          hardcodedPlaceholders.push(match[1]);
        }
      }
      
      if (hardcodedHeadings.length > 0 || (!hasUseTranslations && d.name === 'page.tsx')) {
        issues.push({
          file: relPath,
          hasUseTranslations,
          usesT,
          hardcodedHeadings: hardcodedHeadings.slice(0, 5),
          hardcodedPlaceholders: hardcodedPlaceholders.slice(0, 3),
        });
      }
    }
  });
}

scan(dashDir);

console.log('\n=== i18n Audit Report ===\n');
if (issues.length === 0) {
  console.log('✅ No critical issues found!');
} else {
  issues.forEach(i => {
    console.log(`📄 ${i.file}`);
    console.log(`   useTranslations: ${i.hasUseTranslations ? '✅' : '❌ MISSING'}`);
    console.log(`   Uses t(): ${i.usesT ? '✅' : '❌ NOT USED'}`);
    if (i.hardcodedHeadings.length > 0) {
      console.log(`   ⚠️  Hardcoded headings: ${i.hardcodedHeadings.join(' | ')}`);
    }
    if (i.hardcodedPlaceholders.length > 0) {
      console.log(`   ⚠️  Hardcoded placeholders: ${i.hardcodedPlaceholders.join(' | ')}`);
    }
    console.log('');
  });
}

// Also check for raw date formats
console.log('\n=== Date Format Check ===');
function checkDates(dir) {
  fs.readdirSync(dir, { withFileTypes: true }).forEach(d => {
    const p = path.join(dir, d.name);
    if (d.isDirectory()) checkDates(p);
    else if (d.name.endsWith('.tsx')) {
      const content = fs.readFileSync(p, 'utf8');
      const relPath = path.relative(dashDir, p);
      // Find toLocaleDateString with hardcoded 'en-IN'
      const dateMatches = content.match(/toLocaleDateString\('en-IN'/g);
      if (dateMatches) {
        console.log(`⚠️  ${relPath}: ${dateMatches.length} hardcoded 'en-IN' date format(s)`);
      }
    }
  });
}
checkDates(dashDir);

// Check JSON integrity of all locale files
console.log('\n=== Locale File Integrity ===');
const msgDir = path.join(__dirname, '..', 'messages');
const en = require(path.join(msgDir, 'en.json'));
const enKeys = JSON.stringify(Object.keys(en.Dashboard).sort());

fs.readdirSync(msgDir).filter(f => f.endsWith('.json') && f !== 'en.json').forEach(f => {
  try {
    const locale = require(path.join(msgDir, f));
    const localeKeys = JSON.stringify(Object.keys(locale.Dashboard || {}).sort());
    const match = localeKeys === enKeys ? '✅' : '⚠️  key mismatch';
    console.log(`  ${f}: Valid JSON ${match}`);
  } catch(e) {
    console.log(`  ${f}: ❌ INVALID JSON: ${e.message}`);
  }
});
