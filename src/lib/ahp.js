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

/**
 * Menyusun matriks perbandingan berpasangan n x n dari data kriteria dan baris tabel perbandingan_ahp.
 * Nilai yang tidak tersedia dianggap 1 (sama penting).
 * @param {Array} kriteriaList - Daftar kriteria terurut.
 * @param {Array} perbandinganList - Baris tabel perbandingan_ahp.
 * @returns {number[][]} Matriks perbandingan ukuran n x n.
 */
export function susunMatriksPerbandingan(kriteriaList, perbandinganList) {
  const n = kriteriaList.length;
  const matrix = Array.from({ length: n }, () => Array(n).fill(1));

  for (const item of perbandinganList) {
    const i = kriteriaList.findIndex((kriteria) => kriteria.id === item.kriteria_1_id);
    const j = kriteriaList.findIndex((kriteria) => kriteria.id === item.kriteria_2_id);
    if (i !== -1 && j !== -1) matrix[i][j] = parseFloat(item.nilai);
  }

  return matrix;
}

/**
 * Menghitung bobot AHP dari data kriteria dan baris perbandingan.
 * Mengembalikan pesan yang bisa langsung ditampilkan bila bobot belum siap dipakai.
 * @param {Array} kriteriaList - Daftar kriteria terurut.
 * @param {Array} perbandinganList - Baris tabel perbandingan_ahp.
 * @returns {{ bobot: number[], ahpSiap: boolean, pesan: string }}
 */
export function hitungBobotAhp(kriteriaList, perbandinganList) {
  const n = kriteriaList.length;

  if (n === 0) {
    return {
      bobot: [],
      ahpSiap: false,
      pesan: 'Belum ada kriteria penilaian. Tambahkan kriteria terlebih dahulu.'
    };
  }

  if (n === 1) {
    return { bobot: [1], ahpSiap: true, pesan: '' };
  }

  if (perbandinganList.length === 0) {
    return {
      bobot: [],
      ahpSiap: false,
      pesan: 'Bobot AHP belum diatur. Isi matriks perbandingan berpasangan terlebih dahulu.'
    };
  }

  const hasil = calculateAHP(susunMatriksPerbandingan(kriteriaList, perbandinganList));

  return {
    bobot: hasil.weights,
    ahpSiap: hasil.isConsistent,
    pesan: hasil.isConsistent
      ? ''
      : `Matriks AHP belum konsisten (CR = ${hasil.cr.toFixed(3)}, batas 0.100). Perbaiki perbandingan agar bobot dapat dipakai.`
  };
}

/**
 * Menghitung rincian langkah-langkah AHP secara transparan untuk tampilan detail laporan.
 * @param {number[][]} matrix - Matriks perbandingan berpasangan n x n
 * @returns {Object} { n, colSums, normalizedMatrix, weights, awVector, lambdaMax, ci, ri, cr, isConsistent }
 */
export function getAHPDetail(matrix) {
  const n = matrix.length;
  const round3 = (v) => parseFloat(v.toFixed(3));

  if (n === 0) {
    return {
      n: 0,
      colSums: [],
      normalizedMatrix: [],
      weights: [],
      awVector: [],
      lambdaMax: 0,
      ci: 0,
      ri: 0,
      cr: 0,
      isConsistent: false
    };
  }

  if (n === 1) {
    return {
      n: 1,
      colSums: [matrix[0][0] || 1],
      normalizedMatrix: [[1]],
      weights: [1],
      awVector: [1],
      lambdaMax: 1,
      ci: 0,
      ri: 0,
      cr: 0,
      isConsistent: true
    };
  }

  // 1. Jumlah tiap kolom
  const colSums = new Array(n).fill(0);
  for (let j = 0; j < n; j++) {
    for (let i = 0; i < n; i++) {
      colSums[j] += matrix[i][j];
    }
  }

  // 2. Matriks normalisasi dan bobot (rata-rata baris)
  const normalizedMatrix = Array.from({ length: n }, () => new Array(n).fill(0));
  const w = new Array(n).fill(0);

  for (let i = 0; i < n; i++) {
    let rowSum = 0;
    for (let j = 0; j < n; j++) {
      const normVal = matrix[i][j] / colSums[j];
      normalizedMatrix[i][j] = normVal;
      rowSum += normVal;
    }
    w[i] = rowSum / n;
  }

  // 3. Vektor (A · w)_i dan λmax
  const awVector = new Array(n).fill(0);
  let lambdaMax = 0;
  for (let i = 0; i < n; i++) {
    let aw = 0;
    for (let j = 0; j < n; j++) {
      aw += matrix[i][j] * w[j];
    }
    awVector[i] = aw;
    lambdaMax += aw / w[i];
  }
  lambdaMax /= n;

  // 4. CI, RI, CR
  const ci = (lambdaMax - n) / (n - 1);
  const ri = RANDOM_INDEX[n] || 0;
  const cr = ri ? ci / ri : 0;

  return {
    n,
    colSums: colSums.map(round3),
    normalizedMatrix: normalizedMatrix.map((row) => row.map(round3)),
    weights: w.map(round3),
    awVector: awVector.map(round3),
    lambdaMax: round3(lambdaMax),
    ci: round3(ci),
    ri,
    cr: round3(cr),
    isConsistent: cr <= 0.1
  };
}

