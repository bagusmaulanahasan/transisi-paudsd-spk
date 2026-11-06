import test from 'node:test';
import assert from 'node:assert/strict';
import {
  susunMatriksKeputusan,
  normalisasiMatriks,
  hitungMoora
} from './moora.js';

// Data contoh: 4 anak, 2 kriteria (C1 benefit, C2 cost), 3 indikator (2 di C1, 1 di C2).
const anakList = [
  { id: 1, nis: 'A001', nama: 'Ani' },
  { id: 2, nis: 'A002', nama: 'Bimo' },
  { id: 3, nis: 'A003', nama: 'Cici' },
  { id: 4, nis: 'A004', nama: 'Dodi' }
];

const kriteriaList = [
  { id: 10, inisial: 'C1', nama: 'Kognitif', jenis: 'benefit' },
  { id: 20, inisial: 'C2', nama: 'Biaya', jenis: 'cost' }
];

const indikatorList = [
  { id: 100, kriteria_id: 10, pertanyaan: 'Indikator 1' },
  { id: 101, kriteria_id: 10, pertanyaan: 'Indikator 2' },
  { id: 200, kriteria_id: 20, pertanyaan: 'Indikator 3' }
];

// Ani: C1=2+2=4, C2=2 | Bimo: C1=1+1=2, C2=3 | Cici: C1=2+1=3, C2=1
// Dodi hanya menjawab 1 dari 3 indikator sehingga tidak lengkap.
const jawabanList = [
  { anak_id: 1, indikator_id: 100, poin: 2 },
  { anak_id: 1, indikator_id: 101, poin: 2 },
  { anak_id: 1, indikator_id: 200, poin: 2 },
  { anak_id: 2, indikator_id: 100, poin: 1 },
  { anak_id: 2, indikator_id: 101, poin: 1 },
  { anak_id: 2, indikator_id: 200, poin: 3 },
  { anak_id: 3, indikator_id: 100, poin: 2 },
  { anak_id: 3, indikator_id: 101, poin: 1 },
  { anak_id: 3, indikator_id: 200, poin: 1 },
  { anak_id: 4, indikator_id: 100, poin: 1 }
];

test('susunMatriksKeputusan menjumlahkan poin per kriteria dan menandai kelengkapan', () => {
  const hasil = susunMatriksKeputusan(anakList, kriteriaList, indikatorList, jawabanList);
  const ani = hasil.find((b) => b.anak_id === 1);
  const dodi = hasil.find((b) => b.anak_id === 4);

  assert.deepEqual(ani.nilai, [4, 2]);
  assert.equal(ani.terjawab, 3);
  assert.equal(ani.total, 3);
  assert.equal(ani.lengkap, true);

  assert.deepEqual(dodi.nilai, [1, 0]);
  assert.equal(dodi.terjawab, 1);
  assert.equal(dodi.lengkap, false);
});

test('normalisasiMatriks memakai rumus rasio dan dibulatkan 3 desimal', () => {
  const hasil = normalisasiMatriks([
    [4, 2],
    [2, 3],
    [3, 1]
  ]);

  assert.deepEqual(hasil, [
    [0.743, 0.535],
    [0.371, 0.802],
    [0.557, 0.267]
  ]);
});

test('normalisasiMatriks mengembalikan 0 bila seluruh kolom bernilai 0', () => {
  assert.deepEqual(
    normalisasiMatriks([
      [0, 0],
      [0, 0]
    ]),
    [
      [0, 0],
      [0, 0]
    ]
  );
});

test('hitungMoora menghasilkan Yi 3 desimal dan ranking benar (benefit - cost)', () => {
  const hasil = hitungMoora({
    anakList,
    kriteriaList,
    indikatorList,
    jawabanList,
    bobot: [0.667, 0.333]
  });

  const ani = hasil.baris.find((b) => b.anak_id === 1);
  const bimo = hasil.baris.find((b) => b.anak_id === 2);
  const cici = hasil.baris.find((b) => b.anak_id === 3);

  assert.deepEqual(ani.normalisasi, [0.743, 0.535]);
  assert.deepEqual(ani.berbobot, [0.496, 0.178]);
  assert.equal(ani.yi, 0.318);
  assert.equal(ani.ranking, 1);

  assert.equal(cici.yi, 0.283);
  assert.equal(cici.ranking, 2);

  assert.equal(bimo.yi, -0.02);
  assert.equal(bimo.ranking, 3);
});

test('hitungMoora mengeluarkan anak dengan jawaban belum lengkap dari ranking', () => {
  const hasil = hitungMoora({
    anakList,
    kriteriaList,
    indikatorList,
    jawabanList,
    bobot: [0.667, 0.333]
  });

  const dodi = hasil.baris.find((b) => b.anak_id === 4);
  assert.equal(dodi.lengkap, false);
  assert.equal(dodi.yi, null);
  assert.equal(dodi.ranking, null);
  assert.equal(hasil.jumlahLengkap, 3);
  assert.equal(hasil.baris[hasil.baris.length - 1].anak_id, 4);
});

test('hitungMoora tidak menghitung Yi bila bobot AHP belum siap', () => {
  const hasil = hitungMoora({
    anakList,
    kriteriaList,
    indikatorList,
    jawabanList,
    bobot: [],
    ahpSiap: false
  });

  assert.equal(hasil.ahpSiap, false);
  assert.equal(hasil.baris.every((b) => b.yi === null && b.ranking === null), true);
  assert.deepEqual(hasil.baris.find((b) => b.anak_id === 1).nilai, [4, 2]);
});
