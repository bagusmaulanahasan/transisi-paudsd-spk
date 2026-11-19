/**
 * Modul perhitungan Analytical Hierarchy Process (AHP) untuk pembobotan kriteria.
 * Setiap nilai hasil perhitungan dibulatkan menjadi 4 angka di belakang koma.
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

const DESIMAL = 4;
const FAKTOR = 10 ** DESIMAL;
// Pembulatan setengah ke atas (half-up) agar cocok dengan pembulatan manual/Excel.
const bulat = (v) =>
  (Math.sign(v) * Math.round((Math.abs(v) + Number.EPSILON) * FAKTOR)) / FAKTOR;

/**
 * Menghitung bobot prioritas kriteria, Consistency Index (CI), dan Consistency Ratio (CR) dari matriks perbandingan berpasangan.
 * Setiap nilai hasil perhitungan dibulatkan menjadi 4 angka di belakang koma.
 * @param {number[][]} matrix - Matriks perbandingan berpasangan ukuran n x n
 * @returns {Object} { weights: number[], lambdaMax: number, ci: number, cr: number, isConsistent: boolean }
 */
export function calculateAHP(matrix) {
  const n = matrix.length;
  if (n === 0)
    return { weights: [], lambdaMax: 0, ci: 0, cr: 0, isConsistent: false };
  if (n === 1)
    return { weights: [1], lambdaMax: 1, ci: 0, cr: 0, isConsistent: true };

  // 1. Setiap elemen matriks a_ij dibulatkan 4 desimal saat dibaca
  const roundedMatrix = matrix.map((row) => row.map(bulat));

  // 2. colSums[j] = bulat(jumlah kolom dari elemen yang sudah dibulatkan)
  const colSums = new Array(n).fill(0);
  for (let j = 0; j < n; j++) {
    let sum = 0;
    for (let i = 0; i < n; i++) sum += roundedMatrix[i][j];
    colSums[j] = bulat(sum);
  }

  // 3. normalisasi = bulat(a_ij / colSums[j])
  const normalizedMatrix = Array.from({ length: n }, () => new Array(n).fill(0));
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      normalizedMatrix[i][j] = bulat(roundedMatrix[i][j] / colSums[j]);
    }
  }

  // 4. w[i] = bulat(rata-rata baris dari normalisasi yang sudah dibulatkan)
  const w = new Array(n).fill(0);
  for (let i = 0; i < n; i++) {
    let rowSum = 0;
    for (let j = 0; j < n; j++) rowSum += normalizedMatrix[i][j];
    w[i] = bulat(rowSum / n);
  }

  // 5. aw[i] = bulat(sum_j a_ij * w[j]) memakai a_ij dan w yang sudah dibulatkan
  const awVector = new Array(n).fill(0);
  let lambdaSum = 0;
  for (let i = 0; i < n; i++) {
    let aw = 0;
    for (let j = 0; j < n; j++) {
      aw += roundedMatrix[i][j] * w[j];
    }
    awVector[i] = bulat(aw);
    // 6. rasio[i] = bulat(aw[i] / w[i])
    lambdaSum += bulat(awVector[i] / w[i]);
  }

  // lambdaMax = bulat(rata-rata rasio)
  const lambdaMax = bulat(lambdaSum / n);

  // 7. ci = bulat((lambdaMax - n) / (n - 1)); cr = bulat(ci / ri)
  const ci = bulat((lambdaMax - n) / (n - 1));
  const ri = RANDOM_INDEX[n] || 0;
  const cr = ri ? bulat(ci / ri) : 0;

  return {
    weights: w,
    lambdaMax,
    ci,
    cr,
    isConsistent: cr <= 0.1,
  };
}

/**
 * Menyusun matriks perbandingan berpasangan n x n dari data kriteria dan baris tabel perbandingan_ahp.
 * Hanya nilai di atas diagonal yang dipakai; nilai kebalikan dihitung ulang dengan helper 4 desimal
 * sehingga tidak bergantung pada nilai kebalikan yang tersimpan. Pasangan yang tersimpan terbalik
 * (kriteria_1 berada setelah kriteria_2) tetap ditangani.
 * Nilai yang tidak tersedia dianggap 1 (sama penting).
 * @param {Array} kriteriaList - Daftar kriteria terurut.
 * @param {Array} perbandinganList - Baris tabel perbandingan_ahp.
 * @returns {number[][]} Matriks perbandingan ukuran n x n.
 */
export function susunMatriksPerbandingan(kriteriaList, perbandinganList) {
  const n = kriteriaList.length;
  const matrix = Array.from({ length: n }, () => Array(n).fill(1));
  const terpakai = new Set();

  const pasangan = [];
  for (const item of perbandinganList) {
    const i = kriteriaList.findIndex((kriteria) => kriteria.id === item.kriteria_1_id);
    const j = kriteriaList.findIndex((kriteria) => kriteria.id === item.kriteria_2_id);
    if (i === -1 || j === -1 || i === j) continue;
    const nilai = parseFloat(item.nilai);
    if (!Number.isFinite(nilai) || nilai <= 0) continue;
    pasangan.push({ i, j, nilai });
  }

  // Utamakan pasangan yang tersimpan di atas diagonal (i < j).
  for (const { i, j, nilai } of pasangan) {
    if (i >= j) continue;
    matrix[i][j] = nilai;
    matrix[j][i] = bulat(1 / nilai);
    terpakai.add(`${i}-${j}`);
  }

  // Pasangan yang hanya tersimpan terbalik (i > j): nilai tersimpan adalah a[j][i].
  for (const { i, j, nilai } of pasangan) {
    if (i <= j) continue;
    const kunci = `${j}-${i}`;
    if (terpakai.has(kunci)) continue;
    const atas = bulat(1 / nilai);
    matrix[j][i] = atas;
    matrix[i][j] = bulat(1 / atas);
    terpakai.add(kunci);
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
      : `Matriks AHP belum konsisten (CR = ${hasil.cr.toFixed(4)}, batas 0.1000). Perbaiki perbandingan agar bobot dapat dipakai.`
  };
}

/**
 * Menghitung rincian langkah-langkah AHP secara transparan untuk tampilan detail laporan.
 * @param {number[][]} matrix - Matriks perbandingan berpasangan n x n
 * @returns {Object} { n, colSums, normalizedMatrix, weights, awVector, lambdaMax, ci, ri, cr, isConsistent }
 */
export function getAHPDetail(matrix) {
  const n = matrix.length;

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
      colSums: [bulat(matrix[0][0] || 1)],
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

  // 1. Setiap elemen matriks a_ij dibulatkan 4 desimal
  const roundedMatrix = matrix.map((row) => row.map(bulat));

  // 2. Jumlah tiap kolom
  const colSums = new Array(n).fill(0);
  for (let j = 0; j < n; j++) {
    let sum = 0;
    for (let i = 0; i < n; i++) {
      sum += roundedMatrix[i][j];
    }
    colSums[j] = bulat(sum);
  }

  // 3. Matriks normalisasi
  const normalizedMatrix = Array.from({ length: n }, () => new Array(n).fill(0));
  const w = new Array(n).fill(0);

  for (let i = 0; i < n; i++) {
    let rowSum = 0;
    for (let j = 0; j < n; j++) {
      const normVal = bulat(roundedMatrix[i][j] / colSums[j]);
      normalizedMatrix[i][j] = normVal;
      rowSum += normVal;
    }
    w[i] = bulat(rowSum / n);
  }

  // 4. Vektor (A · w)_i dan λmax
  const awVector = new Array(n).fill(0);
  let lambdaSum = 0;
  for (let i = 0; i < n; i++) {
    let aw = 0;
    for (let j = 0; j < n; j++) {
      aw += roundedMatrix[i][j] * w[j];
    }
    awVector[i] = bulat(aw);
    lambdaSum += bulat(awVector[i] / w[i]);
  }
  const lambdaMax = bulat(lambdaSum / n);

  // 5. CI, RI, CR
  const ci = bulat((lambdaMax - n) / (n - 1));
  const ri = RANDOM_INDEX[n] || 0;
  const cr = ri ? bulat(ci / ri) : 0;

  return {
    n,
    colSums,
    normalizedMatrix,
    weights: w,
    awVector,
    lambdaMax,
    ci,
    ri,
    cr,
    isConsistent: cr <= 0.1
  };
}

