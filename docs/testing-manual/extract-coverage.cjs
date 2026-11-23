const fs = require('fs');
const cov = JSON.parse(fs.readFileSync('coverage/coverage-final.json', 'utf8'));
const keys = Object.keys(cov);
const targets = [
  ['ahp.js', 32, 94, 'calculateAHP'],
  ['moora.js', 123, 140, 'normalisasiMatriks'],
  ['moora.js', 148, 220, 'hitungMoora']
];
const result = [];
for (const [file, a, b, name] of targets) {
  const key = keys.find((k) => k.includes('spk') && k.endsWith(file));
  const c = cov[key];
  let stTotal = 0, stCov = 0, brTotal = 0, brCov = 0, fnTotal = 0, fnCov = 0;
  for (const [id, loc] of Object.entries(c.statementMap)) {
    if (loc.start.line >= a && loc.start.line <= b) {
      stTotal++;
      if (c.s[id] > 0) stCov++;
    }
  }
  for (const [id, loc] of Object.entries(c.branchMap)) {
    if (loc.loc.start.line >= a && loc.loc.start.line <= b) {
      for (const n of c.b[id]) {
        brTotal++;
        if (n > 0) brCov++;
      }
    }
  }
  for (const [id, loc] of Object.entries(c.fnMap)) {
    if (loc.decl.start.line >= a && loc.decl.start.line <= b) {
      fnTotal++;
      if (c.f[id] > 0) fnCov++;
    }
  }
  result.push({
    name, file, stTotal, stCov, stPct: +(stCov / stTotal * 100).toFixed(2),
    brTotal, brCov, brPct: +(brCov / brTotal * 100).toFixed(2),
    fnTotal, fnCov, fnPct: +(fnCov / fnTotal * 100).toFixed(2)
  });
}
for (const f of ['ahp.js', 'moora.js']) {
  const key = keys.find((k) => k.includes('spk') && k.endsWith(f));
  const c = cov[key];
  let st = 0, sc = 0, br = 0, bc = 0, fn = 0, fc = 0;
  for (const [id] of Object.entries(c.statementMap)) { st++; if (c.s[id] > 0) sc++; }
  for (const [id] of Object.entries(c.branchMap)) { for (const n of c.b[id]) { br++; if (n > 0) bc++; } }
  for (const [id] of Object.entries(c.fnMap)) { fn++; if (c.f[id] > 0) fc++; }
  result.push({
    name: 'FILE ' + f, file: f, stTotal: st, stCov: sc, stPct: +(sc / st * 100).toFixed(2),
    brTotal: br, brCov: bc, brPct: +(bc / br * 100).toFixed(2),
    fnTotal: fn, fnCov: fc, fnPct: +(fc / fn * 100).toFixed(2)
  });
}
console.log(JSON.stringify(result, null, 2));
fs.writeFileSync('docs/testing-manual/coverage-summary.json', JSON.stringify(result, null, 2));
