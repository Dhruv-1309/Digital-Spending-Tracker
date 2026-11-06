const fs = require('fs');

const checklist = fs.readFileSync('docs/readiness/CHECKLIST.md', 'utf8');
const audit = fs.readFileSync('docs/readiness/AUDIT.md', 'utf8');

// Parse priorities from CHECKLIST.md
const priorities = {};
const checkMatches = checklist.match(/\|\s*([A-Z]+-[0-9]+)\s*\|[^\n]+/g) || [];
for (const row of checkMatches) {
  const parts = row.split('|').map(s => s.trim());
  const id = parts[1];
  // In CHECKLIST.md:
  // For DIFF: | ID | Feature | What it does | Builds on | Effort | (default priority P2 in prompt)
  // For sections 4-14: | ID | Check | Priority | -> parts[3]
  if (id.startsWith('DIFF-')) {
    const num = parseInt(id.replace('DIFF-', ''), 10);
    priorities[id] = num >= 7 ? 'P3' : 'P2';
  } else if (parts[3] && parts[3].match(/P[0-3]/)) {
    priorities[id] = parts[3].match(/P[0-3]/)[0];
  }
}

// Operational additions defaults
priorities['X-1'] = 'P0';
priorities['X-2'] = 'P1';
priorities['X-3'] = 'P2';
priorities['X-4'] = 'P3';

// Parse statuses from AUDIT.md
const auditMatches = audit.match(/\|\s*\*\*([A-Z]+-[0-9]+)\*\*\s*\|[^\n]+/g) || [];
const items = [];
const statusCounts = {};
const catScores = {};

const weights = { P0: 4, P1: 3, P2: 2, P3: 1 };
let earnedTotal = 0;
let applicableTotal = 0;

for (const row of auditMatches) {
  const parts = row.split('|').map(s => s.trim());
  const idMatch = parts[1].match(/\*\*(([A-Z]+)-[0-9]+)\*\*/);
  if (!idMatch) continue;
  const id = idMatch[1];
  const cat = idMatch[2];
  const statusMatch = parts[3].match(/`?([A-Z-]+)`?/);
  const status = statusMatch ? statusMatch[1] : 'UNKNOWN';
  const priority = priorities[id] || 'P2';

  statusCounts[status] = (statusCounts[status] || 0) + 1;

  if (!catScores[cat]) {
    catScores[cat] = { earned: 0, applicable: 0, count: 0 };
  }
  catScores[cat].count++;

  if (status !== 'NOT-APPLICABLE') {
    const w = weights[priority] || 2;
    applicableTotal += w;
    catScores[cat].applicable += w;

    if (status === 'DONE') {
      earnedTotal += w;
      catScores[cat].earned += w;
    } else if (status === 'PARTIAL') {
      earnedTotal += w * 0.5;
      catScores[cat].earned += w * 0.5;
    }
  }

  items.push({ id, cat, priority, status });
}

console.log('=== OVERALL SCORE ===');
const pct = ((earnedTotal / applicableTotal) * 100).toFixed(1);
console.log(`Earned: ${earnedTotal}, Applicable: ${applicableTotal}, Score: ${pct}%`);

console.log('\n=== STATUS COUNTS ===');
console.log(statusCounts);

console.log('\n=== CATEGORY SCORES ===');
for (const [cat, s] of Object.entries(catScores)) {
  const catPct = s.applicable > 0 ? ((s.earned / s.applicable) * 100).toFixed(1) : '100.0';
  console.log(`${cat}: ${catPct}% (${s.earned}/${s.applicable} pts) [${s.count} items]`);
}
