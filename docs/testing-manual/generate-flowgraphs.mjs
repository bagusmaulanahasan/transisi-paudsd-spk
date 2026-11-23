import fs from 'node:fs';
import path from 'node:path';
import { instance } from '@viz-js/viz';
import sharp from 'sharp';

const OUT_DIR = path.resolve('docs/testing-manual');
const IMG_DIR = path.join(OUT_DIR, 'gambar');
fs.mkdirSync(IMG_DIR, { recursive: true });

function makeGraph(name, title, nodes, edges, predicates) {
  const nodeIds = new Set(nodes.map((n) => n.id));
  for (const [from, to] of edges) {
    if (!nodeIds.has(from) || !nodeIds.has(to)) {
      throw new Error(`${name}: edge ${from}->${to} memakai node yang tidak ada`);
    }
  }
  const N = nodes.length;
  const E = edges.length;
  const vgFormula = E - N + 2;
  const vgPredikat = predicates + 1;
  if (vgFormula !== vgPredikat) {
    throw new Error(
      `${name}: V(G) tidak konsisten. E-N+2=${vgFormula}, P+1=${vgPredikat}. ` +
        `N=${N}, E=${E}, P=${predicates}`
    );
  }
  return { name, title, nodes, edges, N, E, P: predicates, vg: vgFormula };
}

const calculateAHP = makeGraph(
  'calculateAHP',
  'Flow Graph calculateAHP',
  [
    { id: 1, label: '1. Mulai\nn = matrix.length', line: 33 },
    { id: 2, label: '2. P1: n === 0', line: 34, decision: true },
    { id: 3, label: '3. return bobot kosong', line: 35 },
    { id: 4, label: '4. P2: n === 1', line: 36, decision: true },
    { id: 5, label: '5. return bobot [1]', line: 37 },
    { id: 6, label: '6. L1: map baris', line: 40, decision: true },
    { id: 7, label: '7. L2: map sel', line: 40, decision: true },
    { id: 8, label: '8. L3: for j colSums', line: 44, decision: true },
    { id: 9, label: '9. L4: for i jumlah kolom', line: 46, decision: true },
    { id: 10, label: '10. L5: for i normalisasi', line: 52, decision: true },
    { id: 11, label: '11. L6: for j normalisasi', line: 53, decision: true },
    { id: 12, label: '12. L7: for i bobot', line: 60, decision: true },
    { id: 13, label: '13. L8: for j bobot', line: 62, decision: true },
    { id: 14, label: '14. L9: for i aw', line: 69, decision: true },
    { id: 15, label: '15. L10: for j aw', line: 71, decision: true },
    { id: 16, label: '16. P11: RANDOM_INDEX[n] || 0', line: 84, decision: true },
    { id: 17, label: '17. ri = RANDOM_INDEX[n]', line: 84 },
    { id: 18, label: '18. ri = 0', line: 84 },
    { id: 19, label: '19. P12: ri ? ... : 0', line: 85, decision: true },
    { id: 20, label: '20. cr = bulat(ci / ri)', line: 85 },
    { id: 21, label: '21. cr = 0', line: 85 },
    { id: 22, label: '22. return hasil', line: 87 },
    { id: 23, label: '23. Selesai', line: 94 }
  ],
  [
    [1, 2],
    [2, 3], [2, 4],
    [3, 23],
    [4, 5], [4, 6],
    [5, 23],
    [6, 7], [6, 8],
    [7, 7], [7, 6],
    [8, 9], [8, 10],
    [9, 9], [9, 8],
    [10, 11], [10, 12],
    [11, 11], [11, 10],
    [12, 13], [12, 14],
    [13, 13], [13, 12],
    [14, 15], [14, 16],
    [15, 15], [15, 14],
    [16, 17], [16, 18],
    [17, 19], [18, 19],
    [19, 20], [19, 21],
    [20, 22], [21, 22],
    [22, 23]
  ],
  14
);

const normalisasiMatriks = makeGraph(
  'normalisasiMatriks',
  'Flow Graph normalisasiMatriks',
  [
    { id: 1, label: '1. Mulai', line: 123 },
    { id: 2, label: '2. P1: matriks.length === 0', line: 124, decision: true },
    { id: 3, label: '3. return []', line: 124 },
    { id: 4, label: '4. L1: for j', line: 129, decision: true },
    { id: 5, label: '5. L2: for i', line: 131, decision: true },
    { id: 6, label: '6. L3: map baris', line: 137, decision: true },
    { id: 7, label: '7. L4: map sel', line: 138, decision: true },
    { id: 8, label: '8. P2: pembagi[j] === 0', line: 138, decision: true },
    { id: 9, label: '9. nilai = 0', line: 138 },
    { id: 10, label: '10. nilai = bulat(nilai / pembagi[j])', line: 138 },
    { id: 11, label: '11. return matriks hasil', line: 137 },
    { id: 12, label: '12. Selesai', line: 140 }
  ],
  [
    [1, 2],
    [2, 3], [2, 4],
    [3, 12],
    [4, 5], [4, 6],
    [5, 5], [5, 4],
    [6, 7], [6, 11],
    [7, 8], [7, 6],
    [8, 9], [8, 10],
    [9, 7], [10, 7],
    [11, 12]
  ],
  6
);

const hitungMoora = makeGraph(
  'hitungMoora',
  'Flow Graph hitungMoora',
  [
    { id: 1, label: '1. Mulai\nsusunMatriksKeputusan', line: 156 },
    { id: 2, label: '2. L1: filter lengkap', line: 157, decision: true },
    { id: 3, label: '3. P1: ahpSiap', line: 162, decision: true },
    { id: 4, label: '4. P2: lengkap.length > 0', line: 162, decision: true },
    { id: 5, label: '5. L2: map lengkap', line: 163, decision: true },
    { id: 6, label: '6. panggil normalisasiMatriks', line: 163 },
    { id: 7, label: '7. L3: map normalisasi', line: 164, decision: true },
    { id: 8, label: '8. L4: map sel', line: 165, decision: true },
    { id: 9, label: '9. P3: bobot[j] ?? 0', line: 165, decision: true },
    { id: 10, label: '10. bobot[j]', line: 165 },
    { id: 11, label: '11. 0', line: 165 },
    { id: 12, label: '12. L5: map barisLengkap', line: 169, decision: true },
    { id: 13, label: '13. P4: nilaiBerbobot[index] ?? null', line: 170, decision: true },
    { id: 14, label: '14. nilaiBerbobot[index]', line: 170 },
    { id: 15, label: '15. null', line: 170 },
    { id: 16, label: '16. P5: ahpSiap', line: 173, decision: true },
    { id: 17, label: '17. P6: berbobot', line: 173, decision: true },
    { id: 18, label: '18. L6: forEach kriteria', line: 175, decision: true },
    { id: 19, label: '19. P7: jenis === cost', line: 176, decision: true },
    { id: 20, label: '20. total -= berbobot[j]', line: 176 },
    { id: 21, label: '21. total += berbobot[j]', line: 176 },
    { id: 22, label: '22. yi = bulat(total)', line: 178 },
    { id: 23, label: '23. return objek baris', line: 181 },
    { id: 24, label: '24. L7: sort Yi', line: 190, decision: true },
    { id: 25, label: '25. P8: b.yi ?? 0', line: 190, decision: true },
    { id: 26, label: '26. b.yi', line: 190 },
    { id: 27, label: '27. 0', line: 190 },
    { id: 28, label: '28. P9: a.yi ?? 0', line: 190, decision: true },
    { id: 29, label: '29. a.yi', line: 190 },
    { id: 30, label: '30. 0', line: 190 },
    { id: 31, label: '31. L8: forEach ranking', line: 192, decision: true },
    { id: 32, label: '32. P10: yi === null', line: 193, decision: true },
    { id: 33, label: '33. return (lewati)', line: 193 },
    { id: 34, label: '34. P11: sebelumnya', line: 195, decision: true },
    { id: 35, label: '35. P12: yi sama', line: 195, decision: true },
    { id: 36, label: '36. ranking = sebelumnya.ranking', line: 196 },
    { id: 37, label: '37. ranking = index + 1', line: 198 },
    { id: 38, label: '38. L9: filter belum lengkap', line: 203, decision: true },
    { id: 39, label: '39. L10: map belum lengkap', line: 204, decision: true },
    { id: 40, label: '40. L11: sort nama', line: 211, decision: true },
    { id: 41, label: '41. P13: a.nama || ""', line: 211, decision: true },
    { id: 42, label: '42. a.nama', line: 211 },
    { id: 43, label: '43. string kosong', line: 211 },
    { id: 44, label: '44. P14: b.nama || ""', line: 211, decision: true },
    { id: 45, label: '45. b.nama', line: 211 },
    { id: 46, label: '46. string kosong', line: 211 },
    { id: 47, label: '47. return hasil akhir', line: 213 },
    { id: 48, label: '48. Selesai', line: 220 }
  ],
  [
    [1, 2],
    [2, 2], [2, 3],
    [3, 4], [3, 12],
    [4, 5], [4, 12],
    [5, 5], [5, 6],
    [6, 7],
    [7, 8], [7, 12],
    [8, 9], [8, 7],
    [9, 10], [9, 11],
    [10, 8], [11, 8],
    [12, 13], [12, 24],
    [13, 14], [13, 15],
    [14, 16], [15, 16],
    [16, 17], [16, 23],
    [17, 18], [17, 23],
    [18, 19], [18, 23],
    [19, 20], [19, 21],
    [20, 18], [21, 18],
    [22, 23],
    [23, 12],
    [24, 25], [24, 31],
    [25, 26], [25, 27],
    [26, 28], [27, 28],
    [28, 29], [28, 30],
    [29, 24], [30, 24],
    [31, 32], [31, 38],
    [32, 33], [32, 34],
    [33, 31],
    [34, 35], [34, 37],
    [35, 36], [35, 37],
    [36, 31], [37, 31],
    [38, 38], [38, 39],
    [39, 39], [39, 40],
    [40, 41], [40, 47],
    [41, 42], [41, 43],
    [42, 44], [43, 44],
    [44, 45], [44, 46],
    [45, 40], [46, 40],
    [47, 48]
  ],
  25
);

const graphs = [calculateAHP, normalisasiMatriks, hitungMoora];

function enumeratePaths(graph, maxPaths = 300000) {
  const adj = new Map();
  for (const n of graph.nodes) adj.set(n.id, []);
  for (const [from, to] of graph.edges) adj.get(from).push(to);
  const start = 1;
  const end = graph.nodes.length;
  const paths = [];
  const queue = [{ path: [start], used: new Set() }];
  let head = 0;

  while (head < queue.length && paths.length < maxPaths) {
    const { path, used } = queue[head++];
    const node = path[path.length - 1];
    if (node === end) {
      paths.push(path);
      continue;
    }
    for (const next of adj.get(node) || []) {
      const key = `${node}->${next}`;
      if (used.has(key)) continue;
      const nextUsed = new Set(used);
      nextUsed.add(key);
      queue.push({ path: [...path, next], used: nextUsed });
    }
  }

  return paths;
}

function edgeSignature(path) {
  const s = [];
  for (let i = 0; i < path.length - 1; i++) s.push(`${path[i]}->${path[i + 1]}`);
  return s;
}

function selectBasisPaths(paths, vg) {
  const unique = new Map();
  for (const p of paths) {
    const sig = p.join('-');
    if (!unique.has(sig)) unique.set(sig, p);
  }
  const list = [...unique.values()].sort((a, b) => a.length - b.length || a.join().localeCompare(b.join()));
  const covered = new Set();
  const selected = [];
  const selectedSig = new Set();

  for (const p of list) {
    if (selected.length >= vg) break;
    const sig = p.join('-');
    if (selectedSig.has(sig)) continue;
    const edges = edgeSignature(p);
    const adds = edges.some((e) => !covered.has(e));
    if (adds || selected.length === 0) {
      selected.push(p);
      selectedSig.add(sig);
      for (const e of edges) covered.add(e);
    }
  }

  for (const p of list) {
    if (selected.length >= vg) break;
    const sig = p.join('-');
    if (selectedSig.has(sig)) continue;
    selected.push(p);
    selectedSig.add(sig);
  }

  return selected;
}

function toDot(graph) {
  const lines = [];
  lines.push('digraph G {');
  lines.push('  rankdir=TB;');
  lines.push('  graph [fontname="Times New Roman", fontsize=10, nodesep=0.25, ranksep=0.28, bgcolor="white"];');
  lines.push('  node [shape=box, style="rounded,filled", fillcolor="#F7F7F7", color="#333333", fontname="Times New Roman", fontsize=9, margin="0.08,0.04"];');
  lines.push('  edge [color="#333333", arrowsize=0.6];');
  for (const n of graph.nodes) {
    const shape = n.decision ? 'diamond' : 'box';
    const fill = n.decision ? '#FFF2CC' : '#F7F7F7';
    const label = n.label.replace(/"/g, '\\"').replace(/\n/g, '\\n');
    lines.push(`  ${n.id} [label="${label}", shape=${shape}, fillcolor="${fill}"];`);
  }
  for (const [from, to] of graph.edges) {
    lines.push(`  ${from} -> ${to};`);
  }
  lines.push('}');
  return lines.join('\n');
}

const viz = await instance();
const output = { generatedAt: new Date().toISOString(), graphs: [] };

for (const graph of graphs) {
  const dot = toDot(graph);
  const svg = viz.renderString(dot, { format: 'svg', engine: 'dot' });
  const pngName = `flowgraph-${graph.name}.png`;
  const pngPath = path.join(IMG_DIR, pngName);
  await sharp(Buffer.from(svg), { density: 160 })
    .resize({ width: 2200, withoutEnlargement: false })
    .png()
    .toFile(pngPath);

  const allPaths = enumeratePaths(graph);
  const basisPaths = selectBasisPaths(allPaths, graph.vg);

  output.graphs.push({
    ...graph,
    dot,
    image: `gambar/${pngName}`,
    totalPathsFound: allPaths.length,
    paths: basisPaths
  });

  console.log(
    `${graph.name}: N=${graph.N} E=${graph.E} P=${graph.P} V(G)=${graph.vg} ` +
      `jalur ditemukan=${allPaths.length} jalur basis=${basisPaths.length}`
  );
}

fs.writeFileSync(path.join(OUT_DIR, 'flowgraph-data.json'), JSON.stringify(output, null, 2), 'utf8');
console.log('Data flow graph ditulis ke docs/testing-manual/flowgraph-data.json');
