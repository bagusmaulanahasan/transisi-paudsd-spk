import test from 'node:test';
import assert from 'node:assert/strict';
import { normalisasiNis, apakahNisDuplikat } from './anak.js';

test('normalisasiNis membuang spasi di awal dan akhir', () => {
  assert.equal(normalisasiNis('  2026001  '), '2026001');
});

test('normalisasiNis mengubah NIS kosong menjadi null', () => {
  assert.equal(normalisasiNis(''), null);
  assert.equal(normalisasiNis('   '), null);
  assert.equal(normalisasiNis(null), null);
  assert.equal(normalisasiNis(undefined), null);
});

test('apakahNisDuplikat bernilai true bila anak lain memakai NIS yang sama', () => {
  const daftar = [
    { id: 1, nis: '2026001' },
    { id: 2, nis: '2026002' }
  ];
  assert.equal(apakahNisDuplikat(daftar, '2026001'), true);
});

test('apakahNisDuplikat mengabaikan anak yang sedang diubah', () => {
  const daftar = [{ id: 1, nis: '2026001' }];
  assert.equal(apakahNisDuplikat(daftar, '2026001', 1), false);
});

test('apakahNisDuplikat selalu false untuk NIS kosong', () => {
  const daftar = [
    { id: 1, nis: null },
    { id: 2, nis: null }
  ];
  assert.equal(apakahNisDuplikat(daftar, ''), false);
  assert.equal(apakahNisDuplikat(daftar, null), false);
});

test('apakahNisDuplikat bernilai false bila NIS belum dipakai', () => {
  const daftar = [{ id: 1, nis: '2026001' }];
  assert.equal(apakahNisDuplikat(daftar, '2026999'), false);
});
