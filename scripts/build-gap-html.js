const fs = require('fs');

const md = fs.readFileSync('C:/Users/rajya/.gemini/antigravity/brain/4b1f95e9-ec87-484a-aabb-547cf3b48e94/gap_analysis.md', 'utf8');

function escHtml(s) {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function inline(s) {
  s = s.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
  s = s.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  s = s.replace(/\*(.+?)\*/g, '<em>$1</em>');
  s = s.replace(/`([^`]+)`/g, '<code>$1</code>');
  s = s.replace(/❌/g, '<span class="no">✗</span>');
  s = s.replace(/✅/g, '<span class="yes">✓</span>');
  s = s.replace(/⚠️|⚠/g, '<span class="warn">⚠</span>');
  s = s.replace(/🟡/g, '<span class="dot y">●</span>');
  s = s.replace(/🔴/g, '<span class="dot r">●</span>');
  s = s.replace(/🟢/g, '<span class="dot g">●</span>');
  s = s.replace(/🔵/g, '<span class="dot b">●</span>');
  s = s.replace(/🟠/g, '<span class="dot o">●</span>');
  return s;
}

function convert(text) {
  const lines = text.split('\n');
  let html = '';
  let inTable = false;
  let tableHead = true;
  let inCode = false;
  let inList = false;

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const line = raw.trimEnd();

    if (line.startsWith('```')) {
      if (inList) { html += '</ul>'; inList = false; }
      if (!inCode) { inCode = true; html += '<pre><code>'; }
      else { inCode = false; html += '</code></pre>\n'; }
      continue;
    }
    if (inCode) { html += escHtml(line) + '\n'; continue; }

    if (line.startsWith('|')) {
      if (inList) { html += '</ul>'; inList = false; }
      if (!inTable) { inTable = true; tableHead = true; html += '<table>\n'; }
      if (/^\|[-| :]+\|$/.test(line)) { tableHead = false; continue; }
      const cells = line.split('|').filter((_, i, a) => i > 0 && i < a.length - 1);
      const tag = tableHead ? 'th' : 'td';
      html += '<tr>' + cells.map(c => `<${tag}>${inline(escHtml(c.trim()))}</${tag}>`).join('') + '</tr>\n';
      continue;
    } else if (inTable) { inTable = false; tableHead = true; html += '</table>\n'; }

    if (line.startsWith('### ')) { if(inList){html+='</ul>';inList=false;} html += `<h3>${inline(escHtml(line.slice(4)))}</h3>\n`; continue; }
    if (line.startsWith('## '))  { if(inList){html+='</ul>';inList=false;} html += `<h2>${inline(escHtml(line.slice(3)))}</h2>\n`; continue; }
    if (line.startsWith('# '))   { if(inList){html+='</ul>';inList=false;} html += `<h1>${inline(escHtml(line.slice(2)))}</h1>\n`; continue; }
    if (line.startsWith('> '))   { if(inList){html+='</ul>';inList=false;} html += `<blockquote>${inline(escHtml(line.slice(2)))}</blockquote>\n`; continue; }
    if (line.startsWith('- '))   { if(!inList){html+='<ul>';inList=true;} html += `<li>${inline(escHtml(line.slice(2)))}</li>\n`; continue; }
    if (line.startsWith('---'))  { if(inList){html+='</ul>';inList=false;} html += '<hr>\n'; continue; }
    if (line.trim() === '')      { if(inList){html+='</ul>';inList=false;} continue; }

    if (inList) { html += '</ul>'; inList = false; }
    html += `<p>${inline(escHtml(line))}</p>\n`;
  }
  if (inTable) html += '</table>\n';
  if (inList) html += '</ul>\n';
  return html;
}

const body = convert(md);

const css = `
:root{--bg:#0f1117;--surf:#1a1d27;--card:#1e2235;--bord:#2a2f4a;--text:#e2e8f0;--muted:#94a3b8;--pri:#6366f1;--grn:#22c55e;--yel:#eab308;--red:#ef4444;--org:#f97316;--blu:#3b82f6;}
*{box-sizing:border-box;margin:0;padding:0;}
body{background:var(--bg);color:var(--text);font-family:Inter,system-ui,sans-serif;font-size:15px;line-height:1.7;padding:24px 16px;}
.wrap{max-width:1020px;margin:0 auto;}
.hero{background:linear-gradient(135deg,#1e1b4b 0%,#1a1d27 100%);border:1px solid #3730a3;border-radius:16px;padding:32px;margin-bottom:32px;}
.hero h1{font-size:2rem;font-weight:800;background:linear-gradient(135deg,#818cf8,#c4b5fd);-webkit-background-clip:text;-webkit-text-fill-color:transparent;margin-bottom:6px;}
.hero p{color:#a5b4fc;font-size:1rem;}
.tags{display:flex;flex-wrap:wrap;gap:10px;margin-top:16px;}
.tag{background:var(--card);border:1px solid var(--bord);padding:4px 12px;border-radius:20px;font-size:12px;color:var(--muted);}
h1{font-size:1.8rem;color:#fff;margin:32px 0 6px;}
h2{font-size:1.25rem;color:var(--pri);margin:28px 0 10px;padding-bottom:6px;border-bottom:2px solid var(--bord);}
h3{font-size:1rem;color:#c4b5fd;margin:18px 0 8px;}
p{color:var(--muted);margin:5px 0;}
blockquote{border-left:3px solid var(--pri);background:var(--card);border-radius:0 8px 8px 0;padding:10px 16px;margin:10px 0;font-size:13.5px;color:var(--muted);}
hr{border:none;border-top:1px solid var(--bord);margin:24px 0;}
pre{background:#0d1117;border:1px solid var(--bord);border-radius:10px;padding:16px;overflow-x:auto;margin:12px 0;}
code{background:var(--card);color:#a78bfa;padding:2px 6px;border-radius:4px;font-size:13px;font-family:'Courier New',monospace;}
pre code{background:none;padding:0;color:#e2e8f0;}
table{width:100%;border-collapse:collapse;margin:10px 0;border-radius:10px;overflow:hidden;font-size:13.5px;box-shadow:0 1px 3px rgba(0,0,0,.4);}
th{background:#2a2f4a;color:#fff;padding:10px 14px;text-align:left;font-weight:600;font-size:13px;}
td{padding:9px 14px;border-top:1px solid var(--bord);color:var(--text);vertical-align:top;}
tr:hover td{background:rgba(99,102,241,.06);}
ul{margin:6px 0 6px 20px;}
li{color:var(--muted);margin:3px 0;}
li strong{color:var(--text);}
strong{color:#fff;}
em{color:#c4b5fd;}
.yes{color:var(--grn);font-weight:700;}
.no{color:var(--red);font-weight:700;}
.warn{color:var(--yel);font-weight:700;}
.dot{font-size:9px;margin-right:3px;}
.dot.g{color:var(--grn);}
.dot.y{color:var(--yel);}
.dot.r{color:var(--red);}
.dot.o{color:var(--org);}
.dot.b{color:var(--blu);}
.verdict{text-align:center;background:linear-gradient(135deg,#1e1b4b,#0f172a);border:2px solid var(--pri);border-radius:16px;padding:32px;margin:32px 0;}
.verdict .num{font-size:5rem;font-weight:900;background:linear-gradient(135deg,#6366f1,#a78bfa);-webkit-background-clip:text;-webkit-text-fill-color:transparent;}
.verdict p{color:var(--muted);max-width:560px;margin:10px auto 0;}
@media(max-width:640px){table{font-size:12px;}th,td{padding:7px 9px;}.hero{padding:20px;}}
@media print{body{background:#fff;color:#000;}table{border:1px solid #ccc;}th{background:#eee;color:#000;}h1,h2,h3,strong{color:#000;-webkit-text-fill-color:#000;}blockquote{background:#f5f5f5;border-color:#999;}}
`;

const out = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>iStays — Gap Analysis (Code-Verified)</title>
<style>${css}</style>
</head>
<body>
<div class="wrap">
<div class="hero">
  <h1>iStays — Gap Analysis</h1>
  <p>Code-Verified &amp; Self-Corrected &mdash; April 27, 2026</p>
  <div class="tags">
    <span class="tag">&#128230; 25 API Modules Audited</span>
    <span class="tag">&#127917; 35 Playwright Specs Mapped</span>
    <span class="tag">&#128274; 6 Middleware Layers Inspected</span>
    <span class="tag">&#9989; 11 Previous Mistakes Corrected</span>
  </div>
</div>
${body}
<div class="verdict">
  <div class="num">8/10</div>
  <p style="color:#a5b4fc;font-size:1.1rem;margin-top:4px;">Overall Confidence Rating</p>
  <p>All gaps are code-verified via grep. Uncertainty remains in IBE analytics (no GTM/GA4 instrumentation), CI pass rates across 35 specs, and OTA channel manager completeness beyond the service layer.</p>
</div>
</div>
</body>
</html>`;

fs.writeFileSync('C:/Users/rajya/.gemini/antigravity/playground/istays/gap_analysis.html', out, 'utf8');
const size = fs.statSync('C:/Users/rajya/.gemini/antigravity/playground/istays/gap_analysis.html').size;
console.log('Done. Size:', size, 'bytes');
