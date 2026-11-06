/**
 * Modul perhitungan Analytical Hierarchy Process (AHP) untuk pembobotan kriteria.
 */

// Random Index (RI) standar untuk ukuran matriks 1 sampai 10
const RANDOM_INDEX = {
  1: 0.0,
  2: 0.0,
  3: 0.58,
  4: 0.9,
  5: 1.12,
  6: 1.24,
  7: 1.32,
  8: 1.41,
  9: 1.45,
  10: 1.49,
};

/**
 * Menghitung bobot prioritas kriteria, Consistency Index (CI), dan Consistency Ratio (CR) dari matriks perbandingan berpasangan.
 * Setiap nilai hasil perhitungan dibulatkan menjadi 3 angka di belakang koma (parseFloat(val.toFixed(3))).
 * @param {number[][]} matrix - Matriks perbandingan berpasangan ukuran n x n
 * @returns {Object} { weights: number[], lambdaMax: number, ci: number, cr: number, isConsistent: boolean }
 */
export function calculateAHP(matrix) {
  const n = matrix.length;
  if (n === 0)
    return { weights: [], lambdaMax: 0, ci: 0, cr: 0, isConsistent: false };
  if (n === 1)
    return { weights: [1], lambdaMax: 1, ci: 0, cr: 0, isConsistent: true };

  const round3 = (v) => parseFloat(v.toFixed(3));

  // 1. Jumlah tiap kolom
  const colSums = new Array(n).fill(0);
  for (let j = 0; j < n; j++)
    for (let i = 0; i < n; i++) colSums[j] += matrix[i][j];

  // 2. Normalisasi dan bobot (rata-rata baris), presisi penuh
  const w = new Array(n).fill(0);
  for (let i = 0; i < n; i++) {
    let rowSum = 0;
    for (let j = 0; j < n; j++) rowSum += matrix[i][j] / colSums[j];
    w[i] = rowSum / n;
  }

  // 3. λmax = rata-rata dari (A·w)_i / w_i   <-- diperbaiki: jumlah per BARIS
  let lambdaMax = 0;
  for (let i = 0; i < n; i++) {
    let aw = 0;
    for (let j = 0; j < n; j++) aw += matrix[i][j] * w[j];
    lambdaMax += aw / w[i];
  }
  lambdaMax /= n;

  // 4-5. CI dan CR
  const ci = (lambdaMax - n) / (n - 1);
  const ri = RANDOM_INDEX[n];
  const cr = ri ? ci / ri : 0;

  return {
    weights: w.map(round3),
    lambdaMax: round3(lambdaMax),
    ci: round3(ci),
    cr: round3(cr),
    isConsistent: cr <= 0.1,
  };
}
