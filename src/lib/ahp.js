/**
 * Modul perhitungan Analytical Hierarchy Process (AHP) untuk pembobotan kriteria.
 */

// Random Index (RI) standar untuk ukuran matriks 1 sampai 10
const RANDOM_INDEX = {
  1: 0.00,
  2: 0.00,
  3: 0.58,
  4: 0.90,
  5: 1.12,
  6: 1.24,
  7: 1.32,
  8: 1.41,
  9: 1.45,
  10: 1.49
};

/**
 * Menghitung bobot prioritas kriteria, Consistency Index (CI), dan Consistency Ratio (CR) dari matriks perbandingan berpasangan.
 * @param {number[][} matrix - Matriks perbandingan berpasangan ukuran n x n
 * @returns {Object} { weights: number[], lambdaMax: number, ci: number, cr: number, isConsistent: boolean }
 */
export function calculateAHP(matrix) {
  const n = matrix.length;
  if (n === 0) return { weights: [], lambdaMax: 0, ci: 0, cr: 0, isConsistent: false };
  if (n === 1) return { weights: [1.0], lambdaMax: 1, ci: 0, cr: 0, isConsistent: true };

  // 1. Hitung jumlah setiap kolom
  const colSums = new Array(n).fill(0);
  for (let j = 0; j < n; j++) {
    for (let i = 0; i < n; i++) {
      colSums[j] += matrix[i][j];
    }
  }

  // 2. Normalisasi matriks perbandingan berpasangan & hitung bobot prioritas (rata-rata baris)
  const normalizedMatrix = [];
  const weights = new Array(n).fill(0);

  for (let i = 0; i < n; i++) {
    normalizedMatrix[i] = [];
    let rowSum = 0;
    for (let j = 0; j < n; j++) {
      const val = colSums[j] !== 0 ? matrix[i][j] / colSums[j] : 0;
      normalizedMatrix[i][j] = val;
      rowSum += val;
    }
    weights[i] = rowSum / n;
  }

  // 3. Hitung lambda max (λ_max)
  let lambdaMax = 0;
  for (let j = 0; j < n; j++) {
    let weightedSumCol = 0;
    for (let i = 0; i < n; i++) {
      weightedSumCol += matrix[i][j] * weights[i];
    }
    lambdaMax += weightedSumCol / (weights[j] !== 0 ? weights[j] : 1);
  }
  lambdaMax = lambdaMax / n;

  // 4. Hitung Consistency Index (CI)
  const ci = (lambdaMax - n) / (n - 1 > 0 ? n - 1 : 1);

  // 5. Hitung Consistency Ratio (CR)
  const ri = RANDOM_INDEX[n] || 1.49;
  const cr = ri !== 0 ? ci / ri : 0;

  // Batas konsistensi CR <= 0.10
  const isConsistent = cr <= 0.10;

  return {
    weights,
    lambdaMax,
    ci,
    cr,
    isConsistent
  };
}
