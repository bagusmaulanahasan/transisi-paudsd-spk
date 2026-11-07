import test from 'node:test';
import assert from 'node:assert/strict';
import { susunMatriksPerbandingan, hitungBobotAhp } from './ahp.js';

// Tiga kriteria contoh dengan bobot konsisten 0.500, 0.300, 0.200.
const kriteriaList = [
  { id: 1, inisial: 'C1' },
  { id: 2, inisial: 'C2' },
  { id: 3, inisial: 'C3' }
];

const perbandinganKonsisten = [
  { kriteria_1_id: 1, kriteria_2_id: 1, nilai: 1 },
  { kriteria_1_id: 1, kriteria_2_id: 2, nilai: 1.667 },
  { kriteria_1_id: 1, kriteria_2_id: 3, nilai: 2.5 },
  { kriteria_1_id: 2, kriteria_2_id: 1, nilai: 0.6 },
  { kriteria_1_id: 2, kriteria_2_id: 2, nilai: 1 },
  { kriteria_1_id: 2, kriteria_2_id: 3, nilai: 1.5 },
  { kriteria_1_id: 3, kriteria_2_id: 1, nilai: 0.4 },
  { kriteria_1_id: 3, kriteria_2_id: 2, nilai: 0.667 },
  { kriteria_1_id: 3, kriteria_2_id: 3, nilai: 1 }
];

test('susunMatriksPerbandingan mengisi matriks sesuai id kriteria', () => {
  const matrix = susunMatriksPerbandingan(kriteriaList, perbandinganKonsisten);

  assert.deepEqual(matrix, [
    [1, 1.667, 2.5],
    [0.6, 1, 1.5],
    [0.4, 0.667, 1]
  ]);
});

test('susunMatriksPerbandingan memakai nilai 1 bila baris tidak lengkap', () => {
  const matrix = susunMatriksPerbandingan(kriteriaList, []);
  assert.deepEqual(matrix, [
    [1, 1, 1],
    [1, 1, 1],
    [1, 1, 1]
  ]);
});

test('hitungBobotAhp mengembalikan bobot 3 desimal dan status siap', () => {
  const hasil = hitungBobotAhp(kriteriaList, perbandinganKonsisten);

  assert.equal(hasil.ahpSiap, true);
  assert.equal(hasil.pesan, '');
  assert.deepEqual(hasil.bobot, [0.5, 0.3, 0.2]);
});

test('hitungBobotAhp menolak saat perbandingan belum diatur', () => {
  const hasil = hitungBobotAhp(kriteriaList, []);

  assert.equal(hasil.ahpSiap, false);
  assert.deepEqual(hasil.bobot, []);
  assert.match(hasil.pesan, /belum diatur/i);
});

test('hitungBobotAhp menolak matriks yang tidak konsisten', () => {
  const tidakKonsisten = [
    { kriteria_1_id: 1, kriteria_2_id: 1, nilai: 1 },
    { kriteria_1_id: 1, kriteria_2_id: 2, nilai: 9 },
    { kriteria_1_id: 1, kriteria_2_id: 3, nilai: 0.111 },
    { kriteria_1_id: 2, kriteria_2_id: 1, nilai: 0.111 },
    { kriteria_1_id: 2, kriteria_2_id: 2, nilai: 1 },
    { kriteria_1_id: 2, kriteria_2_id: 3, nilai: 9 },
    { kriteria_1_id: 3, kriteria_2_id: 1, nilai: 9 },
    { kriteria_1_id: 3, kriteria_2_id: 2, nilai: 0.111 },
    { kriteria_1_id: 3, kriteria_2_id: 3, nilai: 1 }
  ];

  const hasil = hitungBobotAhp(kriteriaList, tidakKonsisten);

  assert.equal(hasil.ahpSiap, false);
  assert.match(hasil.pesan, /belum konsisten/i);
});

test('hitungBobotAhp memakai bobot 1 bila hanya ada satu kriteria', () => {
  const hasil = hitungBobotAhp([{ id: 1 }], []);

  assert.equal(hasil.ahpSiap, true);
  assert.deepEqual(hasil.bobot, [1]);
});
