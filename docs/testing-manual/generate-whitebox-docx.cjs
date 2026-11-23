const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  ShadingType,
  AlignmentType,
  VerticalAlign,
  TableLayoutType,
  ImageRun,
  Footer,
  PageNumber,
  HeadingLevel,
  convertMillimetersToTwip
} = require('docx');

const ROOT = path.resolve(__dirname, '..', '..');
const DATA_DIR = __dirname;
const GAMBAR_DIR = path.join(DATA_DIR, 'gambar');
const NOMOR_BAB = 3;
const ANGKA_BAB = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'][NOMOR_BAB - 1];
const FONT = 'Times New Roman';
const MONO = 'Consolas';
const LEBAR_TABEL = 7937;

const flow = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'flowgraph-data.json'), 'utf8'));
const hasilUji = JSON.parse(fs.readFileSync(path.join(ROOT, 'test-results.json'), 'utf8'));
const coverage = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'coverage-summary.json'), 'utf8'));

const graf = Object.fromEntries(flow.graphs.map((g) => [g.name, g]));

const hasilPerBerkas = {};
for (const berkas of hasilUji.testResults) {
  const kunci = berkas.name.includes('ahp.test') ? 'ahp' : 'moora';
  hasilPerBerkas[kunci] = berkas.assertionResults;
}

function ambilHasil(kunci, mulai, jumlah) {
  const daftar = (hasilPerBerkas[kunci] || []).slice(mulai, mulai + jumlah);
  if (daftar.length !== jumlah) {
    throw new Error(`Jumlah hasil uji ${kunci} tidak sesuai: ${daftar.length} dari ${jumlah}`);
  }
  return daftar.map((item) => (item.status === 'passed' ? 'Lulus' : 'Gagal'));
}

const statusAHP = ambilHasil('ahp', 0, 15);
const statusNormalisasi = ambilHasil('moora', 0, 7);
const statusMoora = ambilHasil('moora', 7, 26);

if ([...statusAHP, ...statusNormalisasi, ...statusMoora].some((s) => s !== 'Lulus')) {
  throw new Error('Terdapat test case yang tidak lulus. Dokumen dibatalkan.');
}

const cov = Object.fromEntries(coverage.map((c) => [c.name, c]));

let nomorTabel = 0;
let nomorGambar = 0;

function teks(isi, opsi = {}) {
  return new TextRun({
    text: isi,
    font: opsi.mono ? MONO : FONT,
    size: opsi.size ?? 24,
    bold: opsi.bold,
    italics: opsi.italics,
    color: opsi.color,
    break: opsi.break
  });
}

const ISTILAH = [
  'black box testing',
  'white box testing',
  'basis path testing',
  'consistency ratio',
  'consistency index',
  'random index',
  'flow graph',
  'independent path',
  'unit test',
  'test case',
  'coverage',
  'statement',
  'branch',
  'function',
  'ranking',
  'sorting',
  'node',
  'edge',
  'path'
].sort((a, b) => b.length - a.length);

const POLA_ISTILAH = new RegExp(`(${ISTILAH.map((s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'gi');

function runBerItalik(isi, opsi = {}) {
  if (opsi.plain) return [teks(isi, opsi)];
  const bagian = String(isi).split(POLA_ISTILAH);
  const runs = [];
  for (const potongan of bagian) {
    if (!potongan) continue;
    const asing = ISTILAH.some((istilah) => istilah.toLowerCase() === potongan.toLowerCase());
    runs.push(teks(potongan, { ...opsi, italics: asing }));
  }
  return runs;
}

function p(isi, opsi = {}) {
  return new Paragraph({
    children: runBerItalik(isi, opsi),
    alignment: opsi.alignment ?? AlignmentType.JUSTIFY,
    spacing: {
      line: opsi.line ?? 360,
      before: opsi.before ?? 0,
      after: opsi.after ?? 120
    },
    indent: opsi.noIndent ? undefined : { firstLine: 567 },
    keepNext: opsi.keepNext,
    pageBreakBefore: opsi.pageBreakBefore
  });
}

function judulBab() {
  return new Paragraph({
    style: 'Heading1',
    pageBreakBefore: true,
    alignment: AlignmentType.CENTER,
    spacing: { before: 0, after: 240, line: 360 },
    children: [
      teks(`BAB ${ANGKA_BAB}`, { size: 28, bold: true }),
      new TextRun({ break: 1 }),
      teks('PENGUJIAN WHITE BOX TESTING', { size: 28, bold: true })
    ]
  });
}

function h2(isi) {
  return new Paragraph({
    style: 'Heading2',
    children: [teks(isi, { size: 24, bold: true })],
    spacing: { before: 240, after: 120, line: 360 },
    keepNext: true
  });
}

function h3(isi) {
  return new Paragraph({
    style: 'Heading3',
    children: [teks(isi, { size: 24, bold: true })],
    spacing: { before: 200, after: 80, line: 360 },
    keepNext: true
  });
}

function captionTabel(isi) {
  nomorTabel += 1;
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 120, after: 120, line: 240 },
    children: [teks(`Tabel ${NOMOR_BAB}.${nomorTabel} ${isi}`, { size: 22 })],
    keepNext: true
  });
}

function captionGambar(isi) {
  nomorGambar += 1;
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 120, after: 240, line: 240 },
    children: [teks(`Gambar ${NOMOR_BAB}.${nomorGambar} ${isi}`, { size: 22 })]
  });
}

function sel(isi, opsi = {}) {
  const paragraf = String(isi)
    .split('\n')
    .map(
      (baris) =>
        new Paragraph({
          children: [teks(baris, { size: opsi.size ?? 18, bold: opsi.bold, mono: opsi.mono })],
          alignment: opsi.alignment ?? AlignmentType.LEFT,
          spacing: { line: 240, before: 0, after: 0 }
        })
    );
  return new TableCell({
    children: paragraf,
    width: { size: opsi.width ?? 1500, type: WidthType.DXA },
    shading: opsi.fill ? { type: ShadingType.CLEAR, color: 'auto', fill: opsi.fill } : undefined,
    verticalAlign: VerticalAlign.CENTER,
    margins: { top: 40, bottom: 40, left: 80, right: 80 }
  });
}

function tabel(header, baris, lebar, opsi = {}) {
  const border = { style: BorderStyle.SINGLE, size: 4, color: '000000' };
  const rows = [];
  if (header) {
    rows.push(
      new TableRow({
        tableHeader: true,
        cantSplit: true,
        children: header.map((judul, i) =>
          sel(judul, { width: lebar[i], bold: true, fill: 'D9D9D9', alignment: AlignmentType.CENTER, size: opsi.size ?? 18 })
        )
      })
    );
  }
  for (const isiBaris of baris) {
    rows.push(
      new TableRow({
        cantSplit: true,
        children: isiBaris.map((isi, i) =>
          sel(isi, { width: lebar[i], size: opsi.size ?? 18, alignment: opsi.align?.[i] ?? AlignmentType.LEFT })
        )
      })
    );
  }
  return new Table({
    rows,
    width: { size: LEBAR_TABEL, type: WidthType.DXA },
    columnWidths: lebar,
    layout: TableLayoutType.FIXED,
    borders: {
      top: border,
      bottom: border,
      left: border,
      right: border,
      insideHorizontal: border,
      insideVertical: border
    }
  });
}

function blokKode(berkas, mulai, selesai) {
  const isi = fs.readFileSync(path.join(ROOT, berkas), 'utf8').split(/\r?\n/);
  const baris = [];
  for (let i = mulai; i <= selesai; i += 1) {
    baris.push(
      new Paragraph({
        children: [
          teks(String(i).padStart(3, ' ') + '  ', { mono: true, size: 17, color: '808080' }),
          teks(isi[i - 1] ?? '', { mono: true, size: 17 })
        ],
        spacing: { line: 240, before: 0, after: 0 },
        alignment: AlignmentType.LEFT
      })
    );
  }
  return new Table({
    rows: [
      new TableRow({
        children: [
          new TableCell({
            children: baris,
            shading: { type: ShadingType.CLEAR, color: 'auto', fill: 'F2F2F2' },
            margins: { top: 100, bottom: 100, left: 120, right: 120 },
            width: { size: LEBAR_TABEL, type: WidthType.DXA }
          })
        ]
      })
    ],
    width: { size: LEBAR_TABEL, type: WidthType.DXA },
    columnWidths: [LEBAR_TABEL],
    borders: {
      top: { style: BorderStyle.SINGLE, size: 4, color: 'A6A6A6' },
      bottom: { style: BorderStyle.SINGLE, size: 4, color: 'A6A6A6' },
      left: { style: BorderStyle.SINGLE, size: 4, color: 'A6A6A6' },
      right: { style: BorderStyle.SINGLE, size: 4, color: 'A6A6A6' }
    }
  });
}

async function gambarAlir(berkas, lebarCm = 14) {
  const alamat = path.join(DATA_DIR, berkas);
  const buffer = fs.readFileSync(alamat);
  const meta = await sharp(buffer).metadata();
  const lebarPx = Math.round((lebarCm / 2.54) * 96);
  const tinggiPx = Math.round((lebarPx * meta.height) / meta.width);
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 120, after: 0, line: 240 },
    children: [
      new ImageRun({
        type: 'png',
        data: buffer,
        transformation: { width: lebarPx, height: tinggiPx }
      })
    ]
  });
}

function tabelNode(g, caption) {
  const baris = g.nodes.map((n) => [String(n.id), String(n.line), n.label.replace(/\n/g, '; ')]);
  return [
    captionTabel(caption),
    tabel(['Node', 'Baris', 'Keterangan'], baris, [700, 800, 6437], { size: 17, align: [AlignmentType.CENTER, AlignmentType.CENTER, AlignmentType.LEFT] })
  ];
}

function tabelEdge(g, caption) {
  const baris = g.edges.map((e, i) => [String(i + 1), String(e[0]), String(e[1])]);
  return [
    captionTabel(caption),
    tabel(['No', 'Dari', 'Ke'], baris, [600, 3400, 3937], { size: 17, align: [AlignmentType.CENTER, AlignmentType.CENTER, AlignmentType.CENTER] })
  ];
}

function tabelJalur(g, caption) {
  const baris = g.paths.map((jalur, i) => [String(i + 1), jalur.join(' → ')]);
  return [
    captionTabel(caption),
    tabel(['Jalur', 'Urutan Node'], baris, [600, 7337], { size: 16, align: [AlignmentType.CENTER, AlignmentType.LEFT] })
  ];
}

function tabelUji(caption, daftar, status) {
  const baris = daftar.map((d, i) => [
    String(i + 1),
    `J${i + 1}`,
    d.data,
    d.harapan,
    d.aktual,
    status[i]
  ]);
  return [
    captionTabel(caption),
    tabel(
      ['No', 'Jalur', 'Data Uji', 'Hasil yang Diharapkan', 'Hasil Aktual', 'Status'],
      baris,
      [450, 700, 2400, 1900, 1800, 687],
      { size: 16, align: [AlignmentType.CENTER, AlignmentType.CENTER, AlignmentType.LEFT, AlignmentType.LEFT, AlignmentType.LEFT, AlignmentType.CENTER] }
    )
  ];
}

function tabelRingkas(caption, nama, g, jumlahUji) {
  return [
    captionTabel(caption),
    tabel(
      ['Fungsi', 'N', 'E', 'V(G)', 'Jalur', 'Test Case', 'Lulus'],
      [[nama, String(g.N), String(g.E), String(g.vg), String(g.P), String(jumlahUji), String(jumlahUji)]],
      [2100, 700, 700, 800, 900, 1200, 1537],
      { size: 18, align: [AlignmentType.LEFT, AlignmentType.CENTER, AlignmentType.CENTER, AlignmentType.CENTER, AlignmentType.CENTER, AlignmentType.CENTER, AlignmentType.CENTER] }
    )
  ];
}

const UJI_AHP = [
  { data: 'matrix = []', harapan: 'weights [], λmax 0, CI 0, CR 0, isConsistent false', aktual: 'weights [], λmax 0, CI 0, CR 0, isConsistent false' },
  { data: '[[1]]', harapan: 'weights [1], λmax 1, CI 0, CR 0, true', aktual: 'weights [1], λmax 1, CI 0, CR 0, true' },
  { data: '[[1, 3], [1/3, 1]]', harapan: 'weights [0.75, 0.25], λmax 2, CR 0, true', aktual: 'weights [0.75, 0.25], λmax 2, CR 0, true' },
  { data: 'Matriks konsisten bobot [0.6, 0.3, 0.1]', harapan: 'weights [0.6, 0.3, 0.1], λmax 3, CI 0, CR 0, true', aktual: 'weights [0.6, 0.3, 0.1], λmax 3, CI 0, CR 0, true' },
  { data: '[[1, 5, 1], [1/5, 1, 7], [1, 1/7, 1]]', harapan: 'weights [0.4598, 0.3438, 0.1963], λmax 4.6741, CR 1.4433, false', aktual: 'weights [0.4598, 0.3438, 0.1963], λmax 4.6741, CR 1.4433, false' },
  { data: '[[1, 1, 1, 9], [1, 1, 5, 8], [1, 0.2, 1, 4], [1/9, 0.125, 0.25, 1]]', harapan: 'CR 0.0999, isConsistent true', aktual: 'CR 0.0999, isConsistent true' },
  { data: '[[1, 1, 1, 3], [1, 1, 4, 2], [1, 0.25, 1, 2], [1/3, 0.5, 0.5, 1]]', harapan: 'CR 0.1, λmax 4.27, CI 0.09, true', aktual: 'CR 0.1, λmax 4.27, CI 0.09, true' },
  { data: '[[1, 1, 1, 2], [1, 1, 4, 9], [1, 0.25, 1, 2], [0.5, 1/9, 0.5, 1]]', harapan: 'CR 0.1001, isConsistent false', aktual: 'CR 0.1001, isConsistent false' },
  { data: '[[1, 1, 1, 7], [1, 1, 2, 3], [1, 0.5, 1, 9], [1/7, 1/3, 1/9, 1]]', harapan: 'CR 0.11, isConsistent false', aktual: 'CR 0.11, isConsistent false' },
  { data: 'Matriks konsisten bobot [0.4, 0.3, 0.2, 0.1]', harapan: 'weights [0.4, 0.3, 0.2, 0.1], λmax 4, true', aktual: 'weights [0.4, 0.3, 0.2, 0.1], λmax 4, true' },
  { data: 'Matriks konsisten bobot [0.3, 0.25, 0.2, 0.15, 0.1]', harapan: 'weights sesuai, λmax 5, CR 0', aktual: 'weights sesuai, λmax 5, CR 0' },
  { data: 'Matriks konsisten 10 x 10 dengan bobot 1 sampai 10', harapan: 'weights panjang 10, elemen terakhir 0.1818, CR 0, true', aktual: 'weights panjang 10, elemen terakhir 0.1818, CR 0, true' },
  { data: 'Matriks konsisten 11 x 11 dengan bobot 1 sampai 11', harapan: 'weights panjang 11, CR 0, true', aktual: 'weights panjang 11, CR 0, true' },
  { data: 'Matriks konsisten 12 x 12 dengan bobot 1 sampai 12', harapan: 'weights panjang 12, CR 0, true', aktual: 'weights panjang 12, CR 0, true' },
  { data: '[[1, 1, 1], [1, 1, 1], [1, 1, 1]]', harapan: 'weights [0.3333, 0.3333, 0.3333], CR 0, true', aktual: 'weights [0.3333, 0.3333, 0.3333], CR 0, true' }
];

const UJI_NORMALISASI = [
  { data: '[]', harapan: '[]', aktual: '[]' },
  { data: '[[0, 0], [0, 0]]', harapan: '[[0, 0], [0, 0]]', aktual: '[[0, 0], [0, 0]]' },
  { data: '[[0, 3], [0, 4]]', harapan: '[[0, 0.6], [0, 0.8]]', aktual: '[[0, 0.6], [0, 0.8]]' },
  { data: '[[3, 4]]', harapan: '[[1, 1]]', aktual: '[[1, 1]]' },
  { data: '[[3], [4]]', harapan: '[[0.6], [0.8]]', aktual: '[[0.6], [0.8]]' },
  { data: '[[1, 2], [2, 4]]', harapan: '[[0.4472, 0.4472], [0.8944, 0.8944]]', aktual: '[[0.4472, 0.4472], [0.8944, 0.8944]]' },
  { data: '[[]]', harapan: '[[]]', aktual: '[[]]' }
];

const UJI_MOORA = [
  { data: 'Semua daftar kosong', harapan: 'baris [], jumlahLengkap 0, jumlahAnak 0', aktual: 'baris [], jumlahLengkap 0, jumlahAnak 0' },
  { data: 'A1; K1 benefit; I1; jawaban 3; bobot [1]', harapan: 'Yi 1, ranking 1', aktual: 'Yi 1, ranking 1' },
  { data: 'A1; K2 cost; I2; jawaban 3; bobot [1]', harapan: 'Yi -1, ranking 1', aktual: 'Yi -1, ranking 1' },
  { data: 'A1; K1 benefit dan K2 cost; nilai 3 dan 2; bobot [0.6, 0.4]', harapan: 'normalisasi [1, 1], berbobot [0.6, 0.4], Yi 0.2', aktual: 'normalisasi [1, 1], berbobot [0.6, 0.4], Yi 0.2' },
  { data: 'A1 dan A2; K1 dan K3 benefit; nilai A1 3, 2; A2 4, 1; bobot [0.5, 0.5]', harapan: 'Yi [0.7472, 0.6236], ranking [1, 2]', aktual: 'Yi [0.7472, 0.6236], ranking [1, 2]' },
  { data: 'A1 dan A2; K1 benefit dan K2 cost; nilai A1 3, 2; A2 4, 1; bobot [0.6, 0.4]', harapan: 'A2 peringkat 1 dengan Yi 0.3011; A1 Yi 0.0022', aktual: 'A2 peringkat 1 dengan Yi 0.3011; A1 Yi 0.0022' },
  { data: 'A1 dan A2; nilai identik 3 dan 2; bobot [0.5, 0.5]', harapan: 'Yi 0.7072 keduanya, ranking [1, 1]', aktual: 'Yi 0.7072 keduanya, ranking [1, 1]' },
  { data: 'A1, A2, A3; nilai simetris; bobot [0.5, 0.5]', harapan: 'Yi 0.5346 ketiganya, ranking [1, 1, 1]', aktual: 'Yi 0.5346 ketiganya, ranking [1, 1, 1]' },
  { data: 'A1, A2, A3; dua nilai teratas kembar', harapan: 'ranking [1, 2, 2]', aktual: 'ranking [1, 2, 2]' },
  { data: 'A1 dan A2 lengkap; K1; bobot [1]; ahpSiap false', harapan: 'dua baris, Yi, ranking, normalisasi, berbobot bernilai null', aktual: 'dua baris, seluruh nilai hasil bernilai null' },
  { data: 'A1 belum lengkap; ahpSiap false', harapan: 'jumlahLengkap 0, Yi null', aktual: 'jumlahLengkap 0, Yi null' },
  { data: 'A1 belum lengkap; ahpSiap true', harapan: 'jumlahLengkap 0, lengkap false, Yi null', aktual: 'jumlahLengkap 0, lengkap false, Yi null' },
  { data: 'A1 dan A2 lengkap, A3 belum lengkap; K1; bobot [1]', harapan: 'jumlahLengkap 2, urutan a1, a2, a3, A3 Yi null', aktual: 'jumlahLengkap 2, urutan a1, a2, a3, A3 Yi null' },
  { data: 'A1 nama null, A2 nama kosong; belum lengkap', harapan: 'dua baris, nama null atau kosong, ranking null', aktual: 'dua baris, nama null atau kosong, ranking null' },
  { data: 'K1; indikator I1; kriteria kosong; bobot []', harapan: 'lengkap true, normalisasi [], Yi 0, ranking 1', aktual: 'lengkap true, normalisasi [], Yi 0, ranking 1' },
  { data: 'A1; K1; indikator kosong', harapan: 'jumlahLengkap 0, lengkap false', aktual: 'jumlahLengkap 0, lengkap false' },
  { data: 'Dua anak lengkap; bobot []', harapan: 'Yi [0, 0], ranking [1, 1]', aktual: 'Yi [0, 0], ranking [1, 1]' },
  { data: 'A1; dua kriteria; bobot [0.5]', harapan: 'berbobot [0.5, 0], Yi 0.5', aktual: 'berbobot [0.5, 0], Yi 0.5' },
  { data: 'A1; dua kriteria; bobot [0.5, 0.3, 0.2]', harapan: 'berbobot [0.5, 0.3], Yi 0.8', aktual: 'berbobot [0.5, 0.3], Yi 0.8' },
  { data: 'Dua anak; seluruh poin 0; bobot [1]', harapan: 'Yi [0, 0], ranking [1, 1]', aktual: 'Yi [0, 0], ranking [1, 1]' },
  { data: 'Lima anak; tiga kriteria; bobot [0.5, 0.3, 0.2]', harapan: 'jumlahLengkap 5, ranking 1 sampai 5, Yi teratas 0.3374', aktual: 'jumlahLengkap 5, ranking 1 sampai 5, Yi teratas 0.3374' },
  { data: 'A1; dua kriteria benefit; bobot [0.5, 0.5]', harapan: 'Yi 1, ranking 1', aktual: 'Yi 1, ranking 1' },
  { data: 'A1 dan A2 lengkap, A3 belum lengkap', harapan: 'urutan a1, a2, a3; A3 ranking null', aktual: 'urutan a1, a2, a3; A3 ranking null' },
  { data: 'A1 Budi dan A2 Ani belum lengkap', harapan: 'urutan a2, a1; ranking null', aktual: 'urutan a2, a1; ranking null' },
  { data: 'A1; jawaban ganda poin 1 lalu 3', harapan: 'Yi 1, ranking 1', aktual: 'Yi 1, ranking 1' },
  { data: 'A1 dan A2; tiga kriteria campuran; bobot [0.4, 0.3, 0.3]', harapan: 'Yi [0.4669, 0.0878], ranking [1, 2]', aktual: 'Yi [0.4669, 0.0878], ranking [1, 2]' }
];

function tabelMatriks(judulKolom, baris) {
  return tabel(['', ...judulKolom], baris, [1900, 2000, 2000, 2037], {
    size: 18,
    align: [AlignmentType.CENTER, AlignmentType.CENTER, AlignmentType.CENTER, AlignmentType.CENTER]
  });
}

async function buatDokumen() {
  const anak = [];

  anak.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 2400, after: 0, line: 360 },
      children: [teks('PENGUJIAN WHITE BOX TESTING', { size: 32, bold: true })]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 720, line: 360 },
      children: [teks('METODE BASIS PATH TESTING', { size: 28, bold: true })]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 0, line: 360 },
      children: [teks('PADA FUNGSI PERHITUNGAN AHP DAN MOORA', { size: 24, bold: true })]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 960, after: 0, line: 360 },
      children: [teks('SISTEM PENDUKUNG KEPUTUSAN', { size: 24 })]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 1440, line: 360 },
      children: [teks('TRANSISI PAUD-SD', { size: 24 })]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 0, line: 360 },
      children: [teks('Dokumen Pengujian Perangkat Lunak', { size: 24, italics: true })]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 0, line: 360 },
      children: [teks('2026', { size: 24 })]
    })
  );

  anak.push(judulBab());

  anak.push(h2(`${NOMOR_BAB}.1 Pendahuluan`));
  anak.push(
    p(
      'White box testing merupakan pengujian yang dilakukan dengan menelaah struktur internal kode program, bukan hanya memeriksa kesesuaian masukan dan keluaran. Pada penelitian ini metode yang dipakai adalah basis path testing. Metode tersebut mengubah kode menjadi flow graph, menghitung kompleksitas siklomatis V(G), menentukan himpunan jalur independen, lalu menyusun test case agar setiap jalur independen dieksekusi paling sedikit satu kali.'
    )
  );
  anak.push(
    p(
      'Pengujian dijalankan dengan Vitest 1.6.0 dan pelaporan coverage memakai paket @vitest/coverage-v8 1.6.0. Seluruh data uji dibangkitkan di dalam berkas pengujian sehingga tidak memerlukan koneksi basis data, layanan Supabase, maupun antarmuka peramban. Fokus pengujian adalah tiga fungsi inti pada modul AHP dan MOORA yang menjadi dasar pembobotan kriteria dan perangkingan anak.'
    )
  );
  anak.push(
    p(
      'Flow graph pada bab ini disusun dari struktur kendali nyata pada kode. Nomor node mengikuti urutan eksekusi dan nomor baris pada berkas sumber. Kompleksitas siklomatis dihitung dengan dua cara, yaitu E - N + 2 dan P + 1, dengan N adalah jumlah node, E adalah jumlah edge, dan P adalah jumlah predikat. Kedua hasil wajib sama agar flow graph dinyatakan konsisten.'
    )
  );

  anak.push(h2(`${NOMOR_BAB}.2 Alasan Pemilihan Fungsi`));
  anak.push(
    p(
      'Fungsi calculateAHP dipilih karena memuat seluruh keputusan pembobotan kriteria, yaitu normalisasi matriks perbandingan berpasangan, penghitungan bobot prioritas, lambda maksimum, Consistency Index, dan Consistency Ratio. Fungsi normalisasiMatriks dipilih karena menjadi tahap pertama perhitungan MOORA dan menentukan bentuk matriks ternormalisasi yang dipakai pada tahap berikutnya. Fungsi hitungMoora dipilih karena menyatukan penyusunan matriks keputusan, pemberian bobot, penentuan nilai optimasi Yi, dan perangkingan anak.'
    )
  );
  anak.push(
    p(
      'Fungsi bantu bulat, susunMatriksPerbandingan, susunMatriksKeputusan, dan getKategoriNilai tidak diuji jalurnya secara terpisah. Fungsi bantu tersebut tetap tercakup dalam eksekusi dan laporan coverage karena dipanggil oleh fungsi yang diuji. Dengan batas tersebut, laporan berfokus pada tiga fungsi yang memuat keputusan inti sistem.'
    )
  );
  anak.push(captionTabel('Fungsi yang menjadi objek pengujian'));
  anak.push(
    tabel(
      ['No', 'Fungsi', 'Berkas', 'Peran dalam Sistem'],
      [
        ['1', 'calculateAHP', 'src/lib/spk/ahp.js', 'Menghitung bobot kriteria, lambda maksimum, CI, dan CR dari matriks perbandingan berpasangan'],
        ['2', 'normalisasiMatriks', 'src/lib/spk/moora.js', 'Menormalisasi matriks keputusan dengan pembagi akar jumlah kuadrat setiap kolom'],
        ['3', 'hitungMoora', 'src/lib/spk/moora.js', 'Menghitung nilai optimasi Yi dan ranking anak berdasarkan bobot kriteria']
      ],
      [500, 2100, 2200, 3137],
      { size: 17, align: [AlignmentType.CENTER, AlignmentType.LEFT, AlignmentType.LEFT, AlignmentType.LEFT] }
    )
  );

  anak.push(h2(`${NOMOR_BAB}.3 Aturan Perhitungan Predikat dan Kompleksitas`));
  anak.push(
    p(
      'Predikat dihitung dari keputusan yang benar-benar memengaruhi alur eksekusi. Satu kondisi tunggal pada if, else if, while, atau for dihitung satu predikat. Gabungan kondisi dengan operator && atau || dihitung sebanyak kondisi sederhana yang digabungkan. Operator ternary dan nullish coalescing dihitung satu predikat. Pemanggilan map, filter, forEach, dan reduce yang memuat fungsi panah dihitung satu predikat karena membentuk percabangan per elemen.'
    )
  );
  anak.push(
    p(
      'Kompleksitas siklomatis dihitung dengan dua rumus, yaitu V(G) = E - N + 2 dan V(G) = P + 1. Jumlah jalur independen yang harus diuji sama dengan nilai V(G). Setiap jalur independen dipetakan ke satu test case, kemudian hasil eksekusi dicatat pada tabel test case. Status Lulus diberikan apabila seluruh nilai aktual sama dengan nilai yang diharapkan.'
    )
  );

  // calculateAHP
  const gAHP = graf.calculateAHP;
  anak.push(h2(`${NOMOR_BAB}.4 Fungsi calculateAHP`));
  anak.push(
    p(
      'Fungsi calculateAHP menerima matriks perbandingan berpasangan berukuran n x n. Fungsi mengembalikan bobot prioritas, lambda maksimum, CI, CR, dan status konsistensi. Nilai nol dan satu ditangani secara khusus sebelum perhitungan matriks dijalankan.'
    )
  );
  anak.push(h3('a. Kode Sumber dan Nomor Baris'));
  anak.push(
    p(
      'Kode berikut dikutip dari src/lib/spk/ahp.js baris 32 sampai 94. Nomor baris dipertahankan agar tabel node dan edge dapat ditelusuri langsung pada berkas sumber.'
    )
  );
  anak.push(blokKode('src/lib/spk/ahp.js', 32, 94));

  anak.push(h3('b. Tabel Node dan Edge'));
  anak.push(
    p(
      `Flow graph fungsi calculateAHP memiliki ${gAHP.N} node dan ${gAHP.E} edge. Node diberi nomor sesuai urutan eksekusi, sedangkan edge menyatakan perpindahan kendali antar node.`
    )
  );
  anak.push(...tabelNode(gAHP, 'Daftar node fungsi calculateAHP'));
  anak.push(...tabelEdge(gAHP, 'Daftar edge fungsi calculateAHP'));

  anak.push(h3('c. Flow Graph'));
  anak.push(await gambarAlir(gAHP.image));
  anak.push(captionGambar('Flow graph fungsi calculateAHP'));

  anak.push(h3('d. Perhitungan Kompleksitas Siklomatis'));
  anak.push(
    p(
      `Perhitungan dengan jumlah edge dan node menghasilkan V(G) = E - N + 2 = ${gAHP.E} - ${gAHP.N} + 2 = ${gAHP.vg}. Perhitungan dengan jumlah predikat menghasilkan V(G) = P + 1 = ${gAHP.P} + 1 = ${gAHP.vg}. Kedua hasil sama sehingga jumlah jalur independen yang harus diuji adalah ${gAHP.vg} jalur.`
    )
  );

  anak.push(h3('e. Jalur Independen'));
  anak.push(
    p(
      `Tabel berikut memuat ${gAHP.vg} jalur independen hasil penelusuran flow graph. Setiap jalur dipakai sebagai dasar penyusunan satu test case pada bagian berikutnya.`
    )
  );
  anak.push(...tabelJalur(gAHP, 'Daftar jalur independen fungsi calculateAHP'));
  anak.push(
    p(
      'Sebagian kombinasi keputusan pada flow graph tidak dapat dicapai secara bersamaan karena beberapa perulangan memakai panjang data yang sama, yaitu n. Jalur yang tercantum tetap mewakili setiap kombinasi keputusan yang mungkin, sedangkan data uji dipilih agar kombinasi tersebut dapat dieksekusi secara nyata.'
    )
  );

  anak.push(h3('f. Perhitungan Manual'));
  anak.push(
    p(
      'Perhitungan manual dipakai untuk memastikan bahwa hasil fungsi sesuai dengan rumus AHP. Matriks konsisten disusun dari bobot 0.6, 0.3, dan 0.1 sehingga setiap elemen a_ij sama dengan w_i dibagi w_j. Matriks tidak konsisten memakai nilai yang berbeda agar nilai CR berada di atas ambang 0.1.'
    )
  );
  anak.push(captionTabel('Matriks perbandingan berpasangan konsisten'));
  anak.push(
    tabelMatriks(
      ['K1', 'K2', 'K3'],
      [
        ['K1', '1.0000', '2.0000', '6.0000'],
        ['K2', '0.5000', '1.0000', '3.0000'],
        ['K3', '0.1667', '0.3333', '1.0000']
      ]
    )
  );
  anak.push(captionTabel('Normalisasi, bobot, dan rasio matriks konsisten'));
  anak.push(
    tabel(
      ['Kriteria', 'Kolom K1', 'Kolom K2', 'Kolom K3', 'Bobot', 'Aw', 'Aw/Bobot'],
      [
        ['K1', '0.6000', '0.6000', '0.6000', '0.6000', '1.8000', '3.0000'],
        ['K2', '0.3000', '0.3000', '0.3000', '0.3000', '0.9000', '3.0000'],
        ['K3', '0.1000', '0.1000', '0.1000', '0.1000', '0.3000', '3.0000']
      ],
      [1150, 1150, 1150, 1150, 1100, 1150, 1087],
      { size: 17, align: Array(7).fill(AlignmentType.CENTER) }
    )
  );
  anak.push(
    p(
      'Jumlah kolom matriks konsisten adalah 1.6667, 3.3333, dan 10.0000. Setiap baris ternormalisasi bernilai 0.6, 0.3, dan 0.1 sehingga bobot yang diperoleh sama dengan bobot penyusun matriks. Nilai Aw adalah 1.8, 0.9, dan 0.3, sedangkan setiap rasio Aw terhadap bobot bernilai 3. Lambda maksimum sama dengan rata-rata rasio, yaitu 3. CI = (3 - 3) / (3 - 1) = 0 dan CR = 0 / 0.58 = 0 sehingga matriks dinyatakan konsisten.'
    )
  );
  anak.push(captionTabel('Matriks perbandingan berpasangan tidak konsisten'));
  anak.push(
    tabelMatriks(
      ['K1', 'K2', 'K3'],
      [
        ['K1', '1.0000', '5.0000', '1.0000'],
        ['K2', '0.2000', '1.0000', '7.0000'],
        ['K3', '1.0000', '0.1429', '1.0000']
      ]
    )
  );
  anak.push(captionTabel('Normalisasi, bobot, dan rasio matriks tidak konsisten'));
  anak.push(
    tabel(
      ['Kriteria', 'Kolom K1', 'Kolom K2', 'Kolom K3', 'Bobot', 'Aw', 'Aw/Bobot'],
      [
        ['K1', '0.4545', '0.8139', '0.1111', '0.4598', '2.3751', '5.1655'],
        ['K2', '0.0909', '0.1628', '0.7778', '0.3438', '1.8099', '5.2644'],
        ['K3', '0.4545', '0.0233', '0.1111', '0.1963', '0.7052', '3.5925']
      ],
      [1150, 1150, 1150, 1150, 1100, 1150, 1087],
      { size: 17, align: Array(7).fill(AlignmentType.CENTER) }
    )
  );
  anak.push(
    p(
      'Jumlah kolom matriks tidak konsisten adalah 2.2, 6.1429, dan 9. Jumlah rasio Aw terhadap bobot adalah 14.0224 sehingga lambda maksimum = 14.0224 / 3 = 4.6741. CI = (4.6741 - 3) / (3 - 1) = 0.8371 dan CR = 0.8371 / 0.58 = 1.4433. Nilai CR lebih besar dari 0.1 sehingga matriks dinyatakan tidak konsisten.'
    )
  );

  anak.push(h3('g. Tabel Test Case'));
  anak.push(
    p(
      'Tabel berikut memuat seluruh test case untuk fungsi calculateAHP. Kolom Jalur menunjuk nomor jalur independen yang dieksekusi oleh test case tersebut.'
    )
  );
  anak.push(...tabelUji('Test case fungsi calculateAHP', UJI_AHP, statusAHP));

  anak.push(h3('h. Ringkasan Hasil Pengujian'));
  anak.push(...tabelRingkas('Ringkasan pengujian fungsi calculateAHP', 'calculateAHP', gAHP, UJI_AHP.length));

  // normalisasiMatriks
  const gNorm = graf.normalisasiMatriks;
  anak.push(h2(`${NOMOR_BAB}.5 Fungsi normalisasiMatriks`));
  anak.push(
    p(
      'Fungsi normalisasiMatriks menerima matriks keputusan dan mengembalikan matriks ternormalisasi. Setiap kolom dibagi dengan akar jumlah kuadrat elemen kolom tersebut. Kolom yang seluruh elemennya nol menghasilkan pembagi nol sehingga fungsi mengembalikan nilai nol untuk kolom tersebut.'
    )
  );
  anak.push(h3('a. Kode Sumber dan Nomor Baris'));
  anak.push(
    p(
      'Kode berikut dikutip dari src/lib/spk/moora.js baris 123 sampai 140. Nomor baris dipertahankan agar tabel node dan edge dapat ditelusuri langsung pada berkas sumber.'
    )
  );
  anak.push(blokKode('src/lib/spk/moora.js', 123, 140));

  anak.push(h3('b. Tabel Node dan Edge'));
  anak.push(
    p(
      `Flow graph fungsi normalisasiMatriks memiliki ${gNorm.N} node dan ${gNorm.E} edge. Struktur kendali terdiri atas satu pemeriksaan awal, dua perulangan bersarang untuk menghitung pembagi, dan satu pemetaan untuk membentuk hasil normalisasi.`
    )
  );
  anak.push(...tabelNode(gNorm, 'Daftar node fungsi normalisasiMatriks'));
  anak.push(...tabelEdge(gNorm, 'Daftar edge fungsi normalisasiMatriks'));

  anak.push(h3('c. Flow Graph'));
  anak.push(await gambarAlir(gNorm.image));
  anak.push(captionGambar('Flow graph fungsi normalisasiMatriks'));

  anak.push(h3('d. Perhitungan Kompleksitas Siklomatis'));
  anak.push(
    p(
      `Perhitungan dengan jumlah edge dan node menghasilkan V(G) = E - N + 2 = ${gNorm.E} - ${gNorm.N} + 2 = ${gNorm.vg}. Perhitungan dengan jumlah predikat menghasilkan V(G) = P + 1 = ${gNorm.P} + 1 = ${gNorm.vg}. Kedua hasil sama sehingga jumlah jalur independen yang harus diuji adalah ${gNorm.vg} jalur.`
    )
  );

  anak.push(h3('e. Jalur Independen'));
  anak.push(
    p(
      `Tabel berikut memuat ${gNorm.vg} jalur independen fungsi normalisasiMatriks. Jalur dibedakan oleh kondisi matriks kosong, keberadaan kolom, dan nilai pembagi nol.`
    )
  );
  anak.push(...tabelJalur(gNorm, 'Daftar jalur independen fungsi normalisasiMatriks'));

  anak.push(h3('f. Perhitungan Manual'));
  anak.push(
    p(
      'Perhitungan manual memakai matriks keputusan dua baris dan dua kolom, yaitu A1 dengan nilai 3 dan 2 serta A2 dengan nilai 4 dan 1. Pembagi kolom pertama adalah akar dari 3 kuadrat ditambah 4 kuadrat, yaitu 5. Pembagi kolom kedua adalah akar dari 2 kuadrat ditambah 1 kuadrat, yaitu 2.2361.'
    )
  );
  anak.push(captionTabel('Matriks keputusan untuk perhitungan manual normalisasi'));
  anak.push(
    tabel(
      ['Anak', 'K1', 'K2'],
      [
        ['A1', '3', '2'],
        ['A2', '4', '1']
      ],
      [2400, 2768, 2769],
      { size: 18, align: [AlignmentType.LEFT, AlignmentType.CENTER, AlignmentType.CENTER] }
    )
  );
  anak.push(captionTabel('Hasil normalisasi matriks keputusan'));
  anak.push(
    tabel(
      ['Anak', 'K1 / 5', 'K2 / 2.2361'],
      [
        ['A1', '0.6000', '0.8944'],
        ['A2', '0.8000', '0.4472']
      ],
      [2400, 2768, 2769],
      { size: 18, align: [AlignmentType.LEFT, AlignmentType.CENTER, AlignmentType.CENTER] }
    )
  );
  anak.push(
    p(
      'Nilai 3 dibagi 5 menghasilkan 0.6 dan nilai 2 dibagi 2.2361 menghasilkan 0.8944. Nilai 4 dibagi 5 menghasilkan 0.8 dan nilai 1 dibagi 2.2361 menghasilkan 0.4472. Hasil tersebut sama dengan nilai aktual pada test case Jalur 6.'
    )
  );

  anak.push(h3('g. Tabel Test Case'));
  anak.push(
    p(
      'Tabel berikut memuat seluruh test case untuk fungsi normalisasiMatriks. Data uji mencakup matriks kosong, kolom bernilai nol, matriks satu baris, matriks satu kolom, dan matriks tanpa kolom.'
    )
  );
  anak.push(...tabelUji('Test case fungsi normalisasiMatriks', UJI_NORMALISASI, statusNormalisasi));

  anak.push(h3('h. Ringkasan Hasil Pengujian'));
  anak.push(...tabelRingkas('Ringkasan pengujian fungsi normalisasiMatriks', 'normalisasiMatriks', gNorm, UJI_NORMALISASI.length));

  // hitungMoora
  const gMoora = graf.hitungMoora;
  anak.push(h2(`${NOMOR_BAB}.6 Fungsi hitungMoora`));
  anak.push(
    p(
      'Fungsi hitungMoora menerima daftar anak, kriteria, indikator, jawaban, bobot, dan status kesiapan AHP. Fungsi menyusun matriks keputusan, menormalisasi baris yang lengkap, memberi bobot, menghitung nilai optimasi Yi, lalu menentukan ranking. Anak dengan jawaban belum lengkap tetap ditampilkan tanpa ranking.'
    )
  );
  anak.push(h3('a. Kode Sumber dan Nomor Baris'));
  anak.push(
    p(
      'Kode berikut dikutip dari src/lib/spk/moora.js baris 148 sampai 220. Nomor baris dipertahankan agar tabel node dan edge dapat ditelusuri langsung pada berkas sumber.'
    )
  );
  anak.push(blokKode('src/lib/spk/moora.js', 148, 220));

  anak.push(h3('b. Tabel Node dan Edge'));
  anak.push(
    p(
      `Flow graph fungsi hitungMoora memiliki ${gMoora.N} node dan ${gMoora.E} edge. Struktur kendali mencakup pemeriksaan kesiapan AHP, penyaringan anak lengkap, perulangan pemberian bobot, perhitungan Yi, pengurutan ranking, dan pengurutan anak yang belum lengkap.`
    )
  );
  anak.push(...tabelNode(gMoora, 'Daftar node fungsi hitungMoora'));
  anak.push(...tabelEdge(gMoora, 'Daftar edge fungsi hitungMoora'));

  anak.push(h3('c. Flow Graph'));
  anak.push(await gambarAlir(gMoora.image));
  anak.push(captionGambar('Flow graph fungsi hitungMoora'));

  anak.push(h3('d. Perhitungan Kompleksitas Siklomatis'));
  anak.push(
    p(
      `Perhitungan dengan jumlah edge dan node menghasilkan V(G) = E - N + 2 = ${gMoora.E} - ${gMoora.N} + 2 = ${gMoora.vg}. Perhitungan dengan jumlah predikat menghasilkan V(G) = P + 1 = ${gMoora.P} + 1 = ${gMoora.vg}. Kedua hasil sama sehingga jumlah jalur independen yang harus diuji adalah ${gMoora.vg} jalur.`
    )
  );

  anak.push(h3('e. Jalur Independen'));
  anak.push(
    p(
      `Tabel berikut memuat ${gMoora.vg} jalur independen fungsi hitungMoora. Jalur mencakup kondisi ahpSiap, keberadaan anak lengkap, nilai Yi yang sama, dan pengurutan anak yang belum lengkap.`
    )
  );
  anak.push(...tabelJalur(gMoora, 'Daftar jalur independen fungsi hitungMoora'));
  anak.push(
    p(
      'Sama seperti pada calculateAHP, sebagian kombinasi keputusan tidak dapat dicapai secara bersamaan karena beberapa perulangan memakai panjang daftar yang sama. Jalur yang tercantum tetap mewakili setiap kombinasi keputusan, sedangkan data uji dipilih agar kombinasi tersebut dapat dieksekusi secara nyata.'
    )
  );

  anak.push(h3('f. Perhitungan Manual'));
  anak.push(
    p(
      'Perhitungan manual memakai dua anak dan dua kriteria dengan bobot 0.6 untuk K1 yang bersifat benefit dan 0.4 untuk K2 yang bersifat cost. Matriks keputusan dan hasil normalisasi mengacu pada perhitungan manual pada bagian normalisasiMatriks. Nilai berbobot diperoleh dari hasil normalisasi dikali bobot kriteria.'
    )
  );
  anak.push(captionTabel('Nilai berbobot matriks keputusan'));
  anak.push(
    tabel(
      ['Anak', 'K1 x 0.6', 'K2 x 0.4'],
      [
        ['A1', '0.3600', '0.3578'],
        ['A2', '0.4800', '0.1789']
      ],
      [2400, 2768, 2769],
      { size: 18, align: [AlignmentType.LEFT, AlignmentType.CENTER, AlignmentType.CENTER] }
    )
  );
  anak.push(captionTabel('Nilai optimasi Yi dan ranking'));
  anak.push(
    tabel(
      ['Anak', 'Perhitungan Yi', 'Yi', 'Ranking'],
      [
        ['A2', '0.4800 - 0.1789', '0.3011', '1'],
        ['A1', '0.3600 - 0.3578', '0.0022', '2']
      ],
      [1800, 2800, 1800, 1537],
      { size: 18, align: [AlignmentType.LEFT, AlignmentType.CENTER, AlignmentType.CENTER, AlignmentType.CENTER] }
    )
  );
  anak.push(
    p(
      'Kriteria K2 bersifat cost sehingga nilainya dikurangkan. Nilai Yi A1 = 0.36 - 0.3578 = 0.0022 dan Yi A2 = 0.48 - 0.1789 = 0.3011. A2 memperoleh ranking 1 karena Yi lebih besar. Hasil tersebut sama dengan nilai aktual pada test case Jalur 6.'
    )
  );

  anak.push(h3('g. Tabel Test Case'));
  anak.push(
    p(
      'Keterangan data uji pada tabel berikut: A1 adalah Ahmad, A2 adalah Budi, A3 adalah Citra, K1 dan K3 bersifat benefit, K2 bersifat cost, sedangkan I1, I2, dan I3 adalah indikator untuk K1, K2, dan K3. Tabel memuat seluruh test case fungsi hitungMoora.'
    )
  );
  anak.push(...tabelUji('Test case fungsi hitungMoora', UJI_MOORA, statusMoora));

  anak.push(h3('h. Ringkasan Hasil Pengujian'));
  anak.push(...tabelRingkas('Ringkasan pengujian fungsi hitungMoora', 'hitungMoora', gMoora, UJI_MOORA.length));

  // Ringkasan dan coverage
  anak.push(h2(`${NOMOR_BAB}.7 Ringkasan Hasil dan Coverage`));
  anak.push(
    p(
      'Seluruh test case yang disusun dari jalur independen telah dieksekusi. Jumlah test case adalah 48, terdiri atas 15 test case untuk calculateAHP, 7 test case untuk normalisasiMatriks, dan 26 test case untuk hitungMoora. Seluruh test case berstatus Lulus.'
    )
  );
  anak.push(captionTabel('Ringkasan pengujian tiga fungsi'));
  anak.push(
    tabel(
      ['Fungsi', 'N', 'E', 'V(G)', 'Jalur', 'Test Case', 'Lulus'],
      [
        ['calculateAHP', String(gAHP.N), String(gAHP.E), String(gAHP.vg), String(gAHP.P), '15', '15'],
        ['normalisasiMatriks', String(gNorm.N), String(gNorm.E), String(gNorm.vg), String(gNorm.P), '7', '7'],
        ['hitungMoora', String(gMoora.N), String(gMoora.E), String(gMoora.vg), String(gMoora.P), '26', '26']
      ],
      [2100, 700, 700, 800, 900, 1200, 1537],
      { size: 17, align: [AlignmentType.LEFT, ...Array(6).fill(AlignmentType.CENTER)] }
    )
  );

  anak.push(captionTabel('Persentase coverage fungsi dan berkas'));
  anak.push(
    tabel(
      ['Cakupan', 'Statement', 'Cabang', 'Fungsi', 'Baris'],
      [
        ['calculateAHP', '100.00%', '100.00%', '100.00%', '100.00%'],
        ['normalisasiMatriks', '100.00%', '100.00%', '100.00%', '100.00%'],
        ['hitungMoora', '100.00%', '100.00%', '100.00%', '100.00%'],
        ['Berkas ahp.js', `${cov['FILE ahp.js'].stPct.toFixed(2)}%`, `${cov['FILE ahp.js'].brPct.toFixed(2)}%`, `${cov['FILE ahp.js'].fnPct.toFixed(2)}%`, `${cov['FILE ahp.js'].stPct.toFixed(2)}%`],
        ['Berkas moora.js', `${cov['FILE moora.js'].stPct.toFixed(2)}%`, `${cov['FILE moora.js'].brPct.toFixed(2)}%`, `${cov['FILE moora.js'].fnPct.toFixed(2)}%`, `${cov['FILE moora.js'].stPct.toFixed(2)}%`]
      ],
      [2400, 1350, 1350, 1350, 1487],
      { size: 18, align: [AlignmentType.LEFT, ...Array(4).fill(AlignmentType.CENTER)] }
    )
  );
  anak.push(
    p(
      'Ketiga fungsi yang diuji mencapai 100 persen pada seluruh ukuran coverage. Persentase berkas ahp.js dan moora.js lebih rendah karena berkas tersebut juga memuat fungsi lain yang tidak termasuk ruang lingkup pengujian, seperti susunMatriksPerbandingan, getMooraDetail, dan fungsi bantu lainnya. Pada laporan coverage versi v8, persentase baris sama dengan persentase statement.'
    )
  );
  anak.push(
    p(
      'Pengujian juga menemukan beberapa catatan yang tidak menggagalkan test case, tetapi perlu diperhatikan untuk pengembangan berikutnya. Catatan tersebut disajikan pada tabel berikut beserta bukti pada kode dan dampaknya.'
    )
  );
  anak.push(captionTabel('Temuan pengujian white box testing'));
  anak.push(
    tabel(
      ['No', 'Temuan', 'Bukti', 'Dampak'],
      [
        ['1', 'Validasi matriks hanya memeriksa panjang matriks', 'ahp.js baris 33 sampai 37 tidak memeriksa nilai nonnumerik, NaN, atau bentuk matriks tidak persegi', 'Nilai tidak valid dapat menghasilkan NaN tanpa pesan kesalahan'],
        ['2', 'Ukuran matriks di atas 10 memakai RI nol', 'ahp.js baris 84 dan 85 memakai RANDOM_INDEX[n] || 0 sehingga CR selalu nol', 'Matriks berukuran 11 atau lebih selalu dinyatakan konsisten'],
        ['3', 'Sebagian jalur basis tidak dapat dicapai bersamaan', 'Perulangan pada calculateAHP dan hitungMoora memakai panjang data yang sama', 'Jalur pada flow graph tidak semuanya dapat direalisasikan dengan satu ukuran data'],
        ['4', 'Bobot yang kurang diisi nol secara diam-diam', 'moora.js baris 165 memakai bobot[j] ?? 0', 'Konfigurasi bobot tidak lengkap menurunkan Yi tanpa peringatan'],
        ['5', 'Jawaban ganda untuk indikator yang sama saling menimpa', 'moora.js baris 86 menyimpan jawaban pada Map dengan kunci anak dan indikator', 'Nilai yang dipakai adalah jawaban terakhir tanpa pemberitahuan']
      ],
      [450, 2200, 2400, 2887],
      { size: 16, align: [AlignmentType.CENTER, AlignmentType.LEFT, AlignmentType.LEFT, AlignmentType.LEFT] }
    )
  );

  anak.push(h2(`${NOMOR_BAB}.8 Kesimpulan`));
  anak.push(
    p(
      'Pengujian white box testing dengan metode basis path testing telah dilakukan pada tiga fungsi inti, yaitu calculateAHP, normalisasiMatriks, dan hitungMoora. Kompleksitas siklomatis yang diperoleh adalah 15 untuk calculateAHP, 7 untuk normalisasiMatriks, dan 26 untuk hitungMoora. Jumlah tersebut sama dengan jumlah jalur independen yang diuji pada setiap fungsi.'
    )
  );
  anak.push(
    p(
      'Sebanyak 48 test case telah dieksekusi dan seluruhnya berstatus Lulus. Ketiga fungsi mencapai 100 persen pada coverage statement, cabang, fungsi, dan baris. Dengan demikian, seluruh keputusan pada ketiga fungsi telah dieksekusi paling sedikit satu kali dan hasil aktual sesuai dengan hasil yang diharapkan.'
    )
  );
  anak.push(
    p(
      'Temuan pengujian berupa keterbatasan validasi masukan, pemakaian RI nol untuk ukuran matriks di atas 10, jalur basis yang tidak selalu dapat dicapai bersamaan, pengisian bobot yang kurang dengan nilai nol, dan penimpaan jawaban ganda tidak menggagalkan fungsi utama. Temuan tersebut merupakan catatan penguatan mutu perangkat lunak. Pengembangan berikutnya disarankan menambahkan validasi nilai matriks, penanganan ukuran matriks di luar tabel RI, pemeriksaan panjang bobot, dan penanganan jawaban ganda agar perilaku sistem lebih mudah diprediksi.'
    )
  );

  const dokumen = new Document({
    styles: {
      default: {
        document: {
          run: { font: FONT, size: 24, color: '000000' },
          paragraph: { spacing: { line: 360, after: 0 }, alignment: AlignmentType.JUSTIFIED }
        }
      },
      paragraphStyles: [
        {
          id: 'Heading1',
          name: 'Heading 1',
          basedOn: 'Normal',
          next: 'Normal',
          quickFormat: true,
          run: { font: FONT, size: 28, bold: true, color: '000000' },
          paragraph: { alignment: AlignmentType.CENTER, spacing: { before: 0, after: 240 }, outlineLevel: 0 }
        },
        {
          id: 'Heading2',
          name: 'Heading 2',
          basedOn: 'Normal',
          next: 'Normal',
          quickFormat: true,
          run: { font: FONT, size: 24, bold: true, color: '000000' },
          paragraph: { alignment: AlignmentType.LEFT, spacing: { before: 240, after: 120 }, outlineLevel: 1 }
        },
        {
          id: 'Heading3',
          name: 'Heading 3',
          basedOn: 'Normal',
          next: 'Normal',
          quickFormat: true,
          run: { font: FONT, size: 24, bold: true, color: '000000' },
          paragraph: { alignment: AlignmentType.LEFT, spacing: { before: 200, after: 80 }, outlineLevel: 2 }
        }
      ]
    },
    sections: [
      {
        properties: {
          titlePage: true,
          page: {
            size: {
              width: convertMillimetersToTwip(210),
              height: convertMillimetersToTwip(297)
            },
            margin: {
              top: convertMillimetersToTwip(40),
              right: convertMillimetersToTwip(30),
              bottom: convertMillimetersToTwip(30),
              left: convertMillimetersToTwip(40)
            }
          }
        },
        footers: {
          first: new Footer({ children: [new Paragraph({ children: [] })] }),
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ children: [PageNumber.CURRENT], font: FONT, size: 20 })]
              })
            ]
          })
        },
        children: anak
      }
    ]
  });

  const buffer = await Packer.toBuffer(dokumen);
  const keluaran = path.join(DATA_DIR, 'pengujian-white-box.docx');
  fs.writeFileSync(keluaran, buffer);
  console.log(`Dokumen ditulis: ${keluaran}`);
  console.log(`Ukuran: ${(buffer.length / 1024).toFixed(1)} KB`);
  console.log(`Tabel: ${nomorTabel}, Gambar: ${nomorGambar}`);
}

buatDokumen().catch((err) => {
  console.error(err);
  process.exit(1);
});
