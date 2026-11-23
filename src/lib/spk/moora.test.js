import { describe, it, expect } from 'vitest';
import { normalisasiMatriks, hitungMoora } from './moora.js';

const anak = (id, nama, tambahan = {}) => ({ id, nama, ...tambahan });
const kriteria = (id, jenis) => ({ id, jenis });
const indikator = (id, kriteria_id) => ({ id, kriteria_id });
const jawaban = (anak_id, indikator_id, poin) => ({ anak_id, indikator_id, poin });

const A1 = anak('a1', 'Ahmad');
const A2 = anak('a2', 'Budi');
const A3 = anak('a3', 'Citra');
const K1 = kriteria('k1', 'benefit');
const K2 = kriteria('k2', 'cost');
const K3 = kriteria('k3', 'benefit');
const I1 = indikator('i1', 'k1');
const I2 = indikator('i2', 'k2');
const I3 = indikator('i3', 'k3');

describe('White Box Testing - normalisasiMatriks', () => {
  it('Jalur 1: matriks kosong', () => {
    expect(normalisasiMatriks([])).toEqual([]);
  });

  it('Jalur 2: seluruh kolom bernilai nol', () => {
    expect(normalisasiMatriks([[0, 0], [0, 0]])).toEqual([[0, 0], [0, 0]]);
  });

  it('Jalur 3: satu kolom nol dan satu kolom bernilai', () => {
    expect(normalisasiMatriks([[0, 3], [0, 4]])).toEqual([[0, 0.6], [0, 0.8]]);
  });

  it('Jalur 4: matriks satu baris', () => {
    expect(normalisasiMatriks([[3, 4]])).toEqual([[1, 1]]);
  });

  it('Jalur 5: matriks satu kolom', () => {
    expect(normalisasiMatriks([[3], [4]])).toEqual([[0.6], [0.8]]);
  });

  it('Jalur 6: matriks dua baris dua kolom', () => {
    expect(normalisasiMatriks([[1, 2], [2, 4]])).toEqual([
      [0.4472, 0.4472],
      [0.8944, 0.8944]
    ]);
  });

  it('Jalur 7: matriks tanpa kolom', () => {
    expect(normalisasiMatriks([[]])).toEqual([[]]);
  });
});

describe('White Box Testing - hitungMoora', () => {
  it('Jalur 1: seluruh daftar kosong', () => {
    const hasil = hitungMoora({
      anakList: [],
      kriteriaList: [],
      indikatorList: [],
      jawabanList: [],
      bobot: [],
      ahpSiap: true
    });
    expect(hasil.baris).toEqual([]);
    expect(hasil.jumlahLengkap).toBe(0);
    expect(hasil.jumlahAnak).toBe(0);
  });

  it('Jalur 2: satu anak satu kriteria benefit', () => {
    const hasil = hitungMoora({
      anakList: [A1],
      kriteriaList: [K1],
      indikatorList: [I1],
      jawabanList: [jawaban('a1', 'i1', 3)],
      bobot: [1],
      ahpSiap: true
    });
    expect(hasil.baris[0].yi).toBe(1);
    expect(hasil.baris[0].ranking).toBe(1);
  });

  it('Jalur 3: satu anak satu kriteria cost', () => {
    const hasil = hitungMoora({
      anakList: [A1],
      kriteriaList: [K2],
      indikatorList: [I2],
      jawabanList: [jawaban('a1', 'i2', 3)],
      bobot: [1],
      ahpSiap: true
    });
    expect(hasil.baris[0].yi).toBe(-1);
    expect(hasil.baris[0].ranking).toBe(1);
  });

  it('Jalur 4: satu anak dua kriteria benefit dan cost', () => {
    const hasil = hitungMoora({
      anakList: [A1],
      kriteriaList: [K1, K2],
      indikatorList: [I1, I2],
      jawabanList: [jawaban('a1', 'i1', 3), jawaban('a1', 'i2', 2)],
      bobot: [0.6, 0.4],
      ahpSiap: true
    });
    expect(hasil.baris[0].normalisasi).toEqual([1, 1]);
    expect(hasil.baris[0].berbobot).toEqual([0.6, 0.4]);
    expect(hasil.baris[0].yi).toBe(0.2);
  });

  it('Jalur 5: dua anak dua kriteria benefit', () => {
    const hasil = hitungMoora({
      anakList: [A1, A2],
      kriteriaList: [K1, K3],
      indikatorList: [I1, I3],
      jawabanList: [
        jawaban('a1', 'i1', 3), jawaban('a1', 'i3', 2),
        jawaban('a2', 'i1', 4), jawaban('a2', 'i3', 1)
      ],
      bobot: [0.5, 0.5],
      ahpSiap: true
    });
    expect(hasil.baris.map((b) => b.yi)).toEqual([0.7472, 0.6236]);
    expect(hasil.baris.map((b) => b.ranking)).toEqual([1, 2]);
  });

  it('Jalur 6: dua anak dengan kriteria benefit dan cost', () => {
    const hasil = hitungMoora({
      anakList: [A1, A2],
      kriteriaList: [K1, K2],
      indikatorList: [I1, I2],
      jawabanList: [
        jawaban('a1', 'i1', 3), jawaban('a1', 'i2', 2),
        jawaban('a2', 'i1', 4), jawaban('a2', 'i2', 1)
      ],
      bobot: [0.6, 0.4],
      ahpSiap: true
    });
    expect(hasil.baris[0].anak_id).toBe('a2');
    expect(hasil.baris[0].yi).toBe(0.3011);
    expect(hasil.baris[1].yi).toBe(0.0022);
  });

  it('Jalur 7: dua anak dengan nilai identik menghasilkan ranking kembar', () => {
    const hasil = hitungMoora({
      anakList: [A1, A2],
      kriteriaList: [K1, K3],
      indikatorList: [I1, I3],
      jawabanList: [
        jawaban('a1', 'i1', 3), jawaban('a1', 'i3', 2),
        jawaban('a2', 'i1', 3), jawaban('a2', 'i3', 2)
      ],
      bobot: [0.5, 0.5],
      ahpSiap: true
    });
    expect(hasil.baris[0].yi).toBe(0.7072);
    expect(hasil.baris[1].yi).toBe(0.7072);
    expect(hasil.baris.map((b) => b.ranking)).toEqual([1, 1]);
  });

  it('Jalur 8: tiga anak dengan nilai simetris menghasilkan ranking kembar', () => {
    const hasil = hitungMoora({
      anakList: [A1, A2, A3],
      kriteriaList: [K1, K3],
      indikatorList: [I1, I3],
      jawabanList: [
        jawaban('a1', 'i1', 3), jawaban('a1', 'i3', 1),
        jawaban('a2', 'i1', 2), jawaban('a2', 'i3', 2),
        jawaban('a3', 'i1', 1), jawaban('a3', 'i3', 3)
      ],
      bobot: [0.5, 0.5],
      ahpSiap: true
    });
    expect(hasil.baris.map((b) => b.yi)).toEqual([0.5346, 0.5346, 0.5346]);
    expect(hasil.baris.map((b) => b.ranking)).toEqual([1, 1, 1]);
  });

  it('Jalur 9: tiga anak dengan dua nilai teratas kembar', () => {
    const hasil = hitungMoora({
      anakList: [A1, A2, A3],
      kriteriaList: [K1, K3],
      indikatorList: [I1, I3],
      jawabanList: [
        jawaban('a1', 'i1', 3), jawaban('a1', 'i3', 1),
        jawaban('a2', 'i1', 3), jawaban('a2', 'i3', 1),
        jawaban('a3', 'i1', 1), jawaban('a3', 'i3', 3)
      ],
      bobot: [0.5, 0.5],
      ahpSiap: true
    });
    expect(hasil.baris.map((b) => b.ranking)).toEqual([1, 2, 2]);
  });

  it('Jalur 10: ahpSiap false dengan dua anak lengkap', () => {
    const hasil = hitungMoora({
      anakList: [A1, A2],
      kriteriaList: [K1],
      indikatorList: [I1],
      jawabanList: [jawaban('a1', 'i1', 3), jawaban('a2', 'i1', 2)],
      bobot: [1],
      ahpSiap: false
    });
    expect(hasil.baris).toHaveLength(2);
    expect(hasil.baris.every((b) => b.yi === null)).toBe(true);
    expect(hasil.baris.every((b) => b.ranking === null)).toBe(true);
    expect(hasil.baris.every((b) => b.normalisasi === null)).toBe(true);
    expect(hasil.baris.every((b) => b.berbobot === null)).toBe(true);
  });

  it('Jalur 11: ahpSiap false tanpa anak lengkap', () => {
    const hasil = hitungMoora({
      anakList: [A1],
      kriteriaList: [K1],
      indikatorList: [I1],
      jawabanList: [],
      bobot: [1],
      ahpSiap: false
    });
    expect(hasil.jumlahLengkap).toBe(0);
    expect(hasil.baris[0].yi).toBeNull();
  });

  it('Jalur 12: ahpSiap true tanpa anak lengkap', () => {
    const hasil = hitungMoora({
      anakList: [A1],
      kriteriaList: [K1],
      indikatorList: [I1],
      jawabanList: [],
      bobot: [1],
      ahpSiap: true
    });
    expect(hasil.jumlahLengkap).toBe(0);
    expect(hasil.baris[0].lengkap).toBe(false);
    expect(hasil.baris[0].yi).toBeNull();
  });

  it('Jalur 13: dua anak lengkap dan satu anak belum lengkap', () => {
    const hasil = hitungMoora({
      anakList: [A1, A2, A3],
      kriteriaList: [K1],
      indikatorList: [I1],
      jawabanList: [jawaban('a1', 'i1', 3), jawaban('a2', 'i1', 2)],
      bobot: [1],
      ahpSiap: true
    });
    expect(hasil.jumlahLengkap).toBe(2);
    expect(hasil.baris.map((b) => b.anak_id)).toEqual(['a1', 'a2', 'a3']);
    expect(hasil.baris[2].yi).toBeNull();
  });

  it('Jalur 14: dua anak dengan nama dan kode kosong', () => {
    const hasil = hitungMoora({
      anakList: [
        anak('a1', null, { nama_panggilan: null, kode_anak: null }),
        anak('a2', '')
      ],
      kriteriaList: [K1],
      indikatorList: [I1],
      jawabanList: [],
      bobot: [1],
      ahpSiap: true
    });
    expect(hasil.baris).toHaveLength(2);
    expect(hasil.baris.every((b) => b.nama === null || b.nama === '')).toBe(true);
    expect(hasil.baris.every((b) => b.ranking === null)).toBe(true);
  });

  it('Jalur 15: kriteria kosong tetapi indikator terisi', () => {
    const hasil = hitungMoora({
      anakList: [A1],
      kriteriaList: [],
      indikatorList: [I1],
      jawabanList: [jawaban('a1', 'i1', 3)],
      bobot: [],
      ahpSiap: true
    });
    expect(hasil.baris[0].lengkap).toBe(true);
    expect(hasil.baris[0].normalisasi).toEqual([]);
    expect(hasil.baris[0].yi).toBe(0);
    expect(hasil.baris[0].ranking).toBe(1);
  });

  it('Jalur 16: indikator kosong', () => {
    const hasil = hitungMoora({
      anakList: [A1],
      kriteriaList: [K1],
      indikatorList: [],
      jawabanList: [],
      bobot: [1],
      ahpSiap: true
    });
    expect(hasil.jumlahLengkap).toBe(0);
    expect(hasil.baris[0].lengkap).toBe(false);
  });

  it('Jalur 17: bobot kosong membuat Yi nol', () => {
    const hasil = hitungMoora({
      anakList: [A1, A2],
      kriteriaList: [K1, K3],
      indikatorList: [I1, I3],
      jawabanList: [
        jawaban('a1', 'i1', 3), jawaban('a1', 'i3', 2),
        jawaban('a2', 'i1', 4), jawaban('a2', 'i3', 1)
      ],
      bobot: [],
      ahpSiap: true
    });
    expect(hasil.baris.map((b) => b.yi)).toEqual([0, 0]);
    expect(hasil.baris.map((b) => b.ranking)).toEqual([1, 1]);
  });

  it('Jalur 18: bobot lebih pendek dari kriteria', () => {
    const hasil = hitungMoora({
      anakList: [A1],
      kriteriaList: [K1, K3],
      indikatorList: [I1, I3],
      jawabanList: [jawaban('a1', 'i1', 3), jawaban('a1', 'i3', 2)],
      bobot: [0.5],
      ahpSiap: true
    });
    expect(hasil.baris[0].berbobot).toEqual([0.5, 0]);
    expect(hasil.baris[0].yi).toBe(0.5);
  });

  it('Jalur 19: bobot lebih panjang dari kriteria', () => {
    const hasil = hitungMoora({
      anakList: [A1],
      kriteriaList: [K1, K3],
      indikatorList: [I1, I3],
      jawabanList: [jawaban('a1', 'i1', 3), jawaban('a1', 'i3', 2)],
      bobot: [0.5, 0.3, 0.2],
      ahpSiap: true
    });
    expect(hasil.baris[0].berbobot).toEqual([0.5, 0.3]);
    expect(hasil.baris[0].yi).toBe(0.8);
  });

  it('Jalur 20: seluruh poin nol', () => {
    const hasil = hitungMoora({
      anakList: [A1, A2],
      kriteriaList: [K1],
      indikatorList: [I1],
      jawabanList: [jawaban('a1', 'i1', 0), jawaban('a2', 'i1', 0)],
      bobot: [1],
      ahpSiap: true
    });
    expect(hasil.baris.map((b) => b.yi)).toEqual([0, 0]);
    expect(hasil.baris.map((b) => b.ranking)).toEqual([1, 1]);
  });

  it('Jalur 21: lima anak tiga kriteria', () => {
    const hasil = hitungMoora({
      anakList: [A1, A2, A3, anak('a4', 'Dedi'), anak('a5', 'Eka')],
      kriteriaList: [K1, K2, K3],
      indikatorList: [I1, I2, I3],
      jawabanList: [
        jawaban('a1', 'i1', 3), jawaban('a1', 'i2', 1), jawaban('a1', 'i3', 2),
        jawaban('a2', 'i1', 2), jawaban('a2', 'i2', 2), jawaban('a2', 'i3', 1),
        jawaban('a3', 'i1', 1), jawaban('a3', 'i2', 3), jawaban('a3', 'i3', 3),
        jawaban('a4', 'i1', 3), jawaban('a4', 'i2', 2), jawaban('a4', 'i3', 1),
        jawaban('a5', 'i1', 1), jawaban('a5', 'i2', 1), jawaban('a5', 'i3', 1)
      ],
      bobot: [0.5, 0.3, 0.2],
      ahpSiap: true
    });
    expect(hasil.jumlahLengkap).toBe(5);
    expect(hasil.baris.map((b) => b.ranking)).toEqual([1, 2, 3, 4, 5]);
    expect(hasil.baris[0].yi).toBe(0.3374);
  });

  it('Jalur 22: satu anak lengkap tanpa pembanding', () => {
    const hasil = hitungMoora({
      anakList: [A1],
      kriteriaList: [K1, K3],
      indikatorList: [I1, I3],
      jawabanList: [jawaban('a1', 'i1', 3), jawaban('a1', 'i3', 2)],
      bobot: [0.5, 0.5],
      ahpSiap: true
    });
    expect(hasil.baris[0].yi).toBe(1);
    expect(hasil.baris[0].ranking).toBe(1);
  });

  it('Jalur 23: anak lengkap diikuti anak belum lengkap', () => {
    const hasil = hitungMoora({
      anakList: [anak('a1', 'Zaki'), anak('a2', 'Ani'), A3],
      kriteriaList: [K1],
      indikatorList: [I1],
      jawabanList: [jawaban('a1', 'i1', 3), jawaban('a2', 'i1', 2)],
      bobot: [1],
      ahpSiap: true
    });
    expect(hasil.baris.map((b) => b.anak_id)).toEqual(['a1', 'a2', 'a3']);
    expect(hasil.baris[2].ranking).toBeNull();
  });

  it('Jalur 24: dua anak belum lengkap diurutkan menurut nama', () => {
    const hasil = hitungMoora({
      anakList: [anak('a1', 'Budi'), anak('a2', 'Ani')],
      kriteriaList: [K1],
      indikatorList: [I1],
      jawabanList: [],
      bobot: [1],
      ahpSiap: true
    });
    expect(hasil.baris.map((b) => b.anak_id)).toEqual(['a2', 'a1']);
    expect(hasil.baris.every((b) => b.ranking === null)).toBe(true);
  });

  it('Jalur 25: jawaban ganda untuk indikator yang sama', () => {
    const hasil = hitungMoora({
      anakList: [A1],
      kriteriaList: [K1],
      indikatorList: [I1],
      jawabanList: [jawaban('a1', 'i1', 1), jawaban('a1', 'i1', 3)],
      bobot: [1],
      ahpSiap: true
    });
    expect(hasil.baris[0].yi).toBe(1);
    expect(hasil.baris[0].ranking).toBe(1);
  });

  it('Jalur 26: dua anak tiga kriteria campuran', () => {
    const hasil = hitungMoora({
      anakList: [A1, A2],
      kriteriaList: [K1, K2, K3],
      indikatorList: [I1, I2, I3],
      jawabanList: [
        jawaban('a1', 'i1', 3), jawaban('a1', 'i2', 1), jawaban('a1', 'i3', 2),
        jawaban('a2', 'i1', 2), jawaban('a2', 'i2', 2), jawaban('a2', 'i3', 1)
      ],
      bobot: [0.4, 0.3, 0.3],
      ahpSiap: true
    });
    expect(hasil.baris[0].yi).toBe(0.4669);
    expect(hasil.baris[1].yi).toBe(0.0878);
    expect(hasil.baris.map((b) => b.ranking)).toEqual([1, 2]);
  });
});
