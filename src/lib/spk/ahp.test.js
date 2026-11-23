import { describe, it, expect } from 'vitest';
import { calculateAHP } from './ahp.js';

const matriksKonsisten = (bobot) =>
  bobot.map((wi, i) => bobot.map((wj, j) => (i === j ? 1 : wi / wj)));

describe('White Box Testing - calculateAHP', () => {
  it('Jalur 1: n = 0 mengembalikan hasil kosong', () => {
    const hasil = calculateAHP([]);
    expect(hasil).toEqual({ weights: [], lambdaMax: 0, ci: 0, cr: 0, isConsistent: false });
  });

  it('Jalur 2: n = 1 mengembalikan bobot satu', () => {
    const hasil = calculateAHP([[1]]);
    expect(hasil).toEqual({ weights: [1], lambdaMax: 1, ci: 0, cr: 0, isConsistent: true });
  });

  it('Jalur 3: n = 2 dengan RI nol', () => {
    const hasil = calculateAHP([[1, 3], [1 / 3, 1]]);
    expect(hasil.weights).toEqual([0.75, 0.25]);
    expect(hasil.lambdaMax).toBe(2);
    expect(hasil.cr).toBe(0);
    expect(hasil.isConsistent).toBe(true);
  });

  it('Jalur 4: n = 3 konsisten sempurna', () => {
    const hasil = calculateAHP(matriksKonsisten([0.6, 0.3, 0.1]));
    expect(hasil.weights).toEqual([0.6, 0.3, 0.1]);
    expect(hasil.lambdaMax).toBe(3);
    expect(hasil.ci).toBe(0);
    expect(hasil.cr).toBe(0);
    expect(hasil.isConsistent).toBe(true);
  });

  it('Jalur 5: n = 3 tidak konsisten', () => {
    const hasil = calculateAHP([
      [1, 5, 1],
      [1 / 5, 1, 7],
      [1, 1 / 7, 1]
    ]);
    expect(hasil.weights).toEqual([0.4598, 0.3438, 0.1963]);
    expect(hasil.lambdaMax).toBe(4.6741);
    expect(hasil.cr).toBe(1.4433);
    expect(hasil.isConsistent).toBe(false);
  });

  it('Jalur 6: n = 4 dengan CR 0,0999 masih konsisten', () => {
    const hasil = calculateAHP([
      [1, 1, 1, 9],
      [1, 1, 5, 8],
      [1, 0.2, 1, 4],
      [1 / 9, 0.125, 0.25, 1]
    ]);
    expect(hasil.cr).toBe(0.0999);
    expect(hasil.isConsistent).toBe(true);
  });

  it('Jalur 7: n = 4 dengan CR tepat 0,1 masih konsisten', () => {
    const hasil = calculateAHP([
      [1, 1, 1, 3],
      [1, 1, 4, 2],
      [1, 0.25, 1, 2],
      [1 / 3, 0.5, 0.5, 1]
    ]);
    expect(hasil.cr).toBe(0.1);
    expect(hasil.lambdaMax).toBe(4.27);
    expect(hasil.ci).toBe(0.09);
    expect(hasil.isConsistent).toBe(true);
  });

  it('Jalur 8: n = 4 dengan CR 0,1001 tidak konsisten', () => {
    const hasil = calculateAHP([
      [1, 1, 1, 2],
      [1, 1, 4, 9],
      [1, 0.25, 1, 2],
      [0.5, 1 / 9, 0.5, 1]
    ]);
    expect(hasil.cr).toBe(0.1001);
    expect(hasil.isConsistent).toBe(false);
  });

  it('Jalur 9: n = 4 dengan CR 0,11 tidak konsisten', () => {
    const hasil = calculateAHP([
      [1, 1, 1, 7],
      [1, 1, 2, 3],
      [1, 0.5, 1, 9],
      [1 / 7, 1 / 3, 1 / 9, 1]
    ]);
    expect(hasil.cr).toBe(0.11);
    expect(hasil.isConsistent).toBe(false);
  });

  it('Jalur 10: n = 4 konsisten sempurna', () => {
    const hasil = calculateAHP(matriksKonsisten([0.4, 0.3, 0.2, 0.1]));
    expect(hasil.weights).toEqual([0.4, 0.3, 0.2, 0.1]);
    expect(hasil.lambdaMax).toBe(4);
    expect(hasil.isConsistent).toBe(true);
  });

  it('Jalur 11: n = 5 konsisten sempurna', () => {
    const hasil = calculateAHP(matriksKonsisten([0.3, 0.25, 0.2, 0.15, 0.1]));
    expect(hasil.weights).toEqual([0.3, 0.25, 0.2, 0.15, 0.1]);
    expect(hasil.lambdaMax).toBe(5);
    expect(hasil.cr).toBe(0);
  });

  it('Jalur 12: n = 10 memakai nilai RI tabel', () => {
    const hasil = calculateAHP(matriksKonsisten(Array.from({ length: 10 }, (_, i) => i + 1)));
    expect(hasil.weights).toHaveLength(10);
    expect(hasil.weights[9]).toBe(0.1818);
    expect(hasil.cr).toBeCloseTo(0);
    expect(hasil.isConsistent).toBe(true);
  });

  it('Jalur 13: n = 11 memakai RI nol karena di luar tabel', () => {
    const hasil = calculateAHP(matriksKonsisten(Array.from({ length: 11 }, (_, i) => i + 1)));
    expect(hasil.weights).toHaveLength(11);
    expect(hasil.cr).toBe(0);
    expect(hasil.isConsistent).toBe(true);
  });

  it('Jalur 14: n = 12 memakai RI nol karena di luar tabel', () => {
    const hasil = calculateAHP(matriksKonsisten(Array.from({ length: 12 }, (_, i) => i + 1)));
    expect(hasil.weights).toHaveLength(12);
    expect(hasil.cr).toBe(0);
    expect(hasil.isConsistent).toBe(true);
  });

  it('Jalur 15: n = 3 semua elemen satu', () => {
    const hasil = calculateAHP([
      [1, 1, 1],
      [1, 1, 1],
      [1, 1, 1]
    ]);
    expect(hasil.weights).toEqual([0.3333, 0.3333, 0.3333]);
    expect(hasil.cr).toBe(0);
    expect(hasil.isConsistent).toBe(true);
  });
});
