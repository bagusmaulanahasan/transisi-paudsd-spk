import { describe, it, expect } from 'vitest';
import { formatAngka } from './angka.js';

describe('formatAngka', () => {
  it('menampilkan 4 desimal dengan koma', () => {
    expect(formatAngka(0.4669)).toBe('0,4669');
    expect(formatAngka(1)).toBe('1,0000');
  });

  it('menghormati jumlah digit yang diminta', () => {
    expect(formatAngka(75.66, 1)).toBe('75,7');
    expect(formatAngka(0.58, 2)).toBe('0,58');
  });

  it('mengembalikan tanda hubung untuk nilai kosong', () => {
    expect(formatAngka(null)).toBe('—');
    expect(formatAngka(undefined)).toBe('—');
    expect(formatAngka(NaN)).toBe('—');
  });

  it('menangani angka negatif', () => {
    expect(formatAngka(-0.5, 1)).toBe('-0,5');
  });
});
