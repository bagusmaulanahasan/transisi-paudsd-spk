/**
 * Modul perhitungan MOORA (Multi-Objective Optimization on the Basis of Ratio Analysis).
 * Semua nilai hasil perhitungan dibulatkan 3 angka di belakang koma agar mudah
 * dicocokkan dengan perhitungan manual di kertas.
 */

/**
 * Membulatkan angka menjadi 3 angka di belakang koma.
 */
function bulat3(nilai) {
  return parseFloat(nilai.toFixed(3));
}

/**
 * Menyusun matriks keputusan X: total poin jawaban anak pada setiap kriteria.
 * @param {Array} anakList - Daftar anak (alternatif).
 * @param {Array} kriteriaList - Daftar kriteria (kolom matriks).
 * @param {Array} indikatorList - Seluruh indikator pertanyaan.
 * @param {Array} jawabanList - Baris detail_penilaian yang sudah tersimpan.
 * @returns {Array} Baris per anak: nilai per kriteria, jumlah terjawab, status lengkap.
 */
export function susunMatriksKeputusan(anakList, kriteriaList, indikatorList, jawabanList) {
  const jawabanMap = new Map();
  for (const jawaban of jawabanList) {
    jawabanMap.set(`${jawaban.anak_id}-${jawaban.indikator_id}`, jawaban);
  }

  return anakList.map((anak) => {
    const nilai = kriteriaList.map((kriteria) => {
      const indikatorKriteria = indikatorList.filter((indikator) => indikator.kriteria_id === kriteria.id);
      if (indikatorKriteria.length === 0) return 0;
      const totalPoin = indikatorKriteria.reduce((total, indikator) => {
        const jawaban = jawabanMap.get(`${anak.id}-${indikator.id}`);
        return total + (jawaban ? Number(jawaban.poin) : 0);
      }, 0);
      return bulat3(totalPoin / indikatorKriteria.length);
    });

    const terjawab = indikatorList.filter((indikator) =>
      jawabanMap.has(`${anak.id}-${indikator.id}`)
    ).length;
    const total = indikatorList.length;

    return {
      anak_id: anak.id,
      nis: anak.nis ?? null,
      nama: anak.nama,
      nilai,
      terjawab,
      total,
      lengkap: total > 0 && terjawab === total
    };
  });
}

/**
 * Menormalisasi matriks keputusan dengan rumus rasio MOORA.
 * @param {number[][]} matriks - Matriks keputusan (baris = anak, kolom = kriteria).
 * @returns {number[][]} Matriks normalisasi dengan 3 angka di belakang koma.
 */
export function normalisasiMatriks(matriks) {
  if (matriks.length === 0) return [];

  const jumlahKolom = matriks[0].length;
  const pembagi = [];

  for (let j = 0; j < jumlahKolom; j++) {
    let jumlahKuadrat = 0;
    for (let i = 0; i < matriks.length; i++) {
      jumlahKuadrat += matriks[i][j] ** 2;
    }
    pembagi[j] = Math.sqrt(jumlahKuadrat);
  }

  return matriks.map((baris) =>
    baris.map((nilai, j) => (pembagi[j] === 0 ? 0 : bulat3(nilai / pembagi[j])))
  );
}

/**
 * Menghitung nilai optimasi Yi dan ranking MOORA untuk seluruh anak.
 * Anak dengan jawaban belum lengkap tidak diikutkan dalam ranking.
 * @param {Object} data - { anakList, kriteriaList, indikatorList, jawabanList, bobot, ahpSiap }.
 * @returns {Object} { baris, bobot, ahpSiap, jumlahLengkap, jumlahAnak }.
 */
export function hitungMoora({
  anakList,
  kriteriaList,
  indikatorList,
  jawabanList,
  bobot = [],
  ahpSiap = true
}) {
  const keputusan = susunMatriksKeputusan(anakList, kriteriaList, indikatorList, jawabanList);
  const lengkap = keputusan.filter((baris) => baris.lengkap);

  let normalisasi = [];
  let nilaiBerbobot = [];

  if (ahpSiap && lengkap.length > 0) {
    normalisasi = normalisasiMatriks(lengkap.map((baris) => baris.nilai));
    nilaiBerbobot = normalisasi.map((baris) =>
      baris.map((nilai, j) => bulat3(nilai * (bobot[j] ?? 0)))
    );
  }

  const barisLengkap = lengkap.map((baris, index) => {
    const berbobot = nilaiBerbobot[index] ?? null;
    let yi = null;

    if (ahpSiap && berbobot) {
      let total = 0;
      kriteriaList.forEach((kriteria, j) => {
        total += kriteria.jenis === 'cost' ? -berbobot[j] : berbobot[j];
      });
      yi = bulat3(total);
    }

    return {
      ...baris,
      normalisasi: normalisasi[index] ?? null,
      berbobot,
      yi,
      ranking: null
    };
  });

  barisLengkap.sort((a, b) => (b.yi ?? 0) - (a.yi ?? 0));

  barisLengkap.forEach((baris, index) => {
    if (baris.yi === null) return;
    const sebelumnya = barisLengkap[index - 1];
    if (sebelumnya && sebelumnya.yi === baris.yi) {
      baris.ranking = sebelumnya.ranking;
    } else {
      baris.ranking = index + 1;
    }
  });

  const barisBelumLengkap = keputusan
    .filter((baris) => !baris.lengkap)
    .map((baris) => ({
      ...baris,
      normalisasi: null,
      berbobot: null,
      yi: null,
      ranking: null
    }))
    .sort((a, b) => (a.nama || '').localeCompare(b.nama || ''));

  return {
    ahpSiap,
    bobot,
    baris: [...barisLengkap, ...barisBelumLengkap],
    jumlahLengkap: lengkap.length,
    jumlahAnak: keputusan.length
  };
}

/**
 * Menghasilkan rincian lengkap perhitungan MOORA per tahap (B1 - B6) untuk transparansi laporan.
 * Memakai ulang susunMatriksKeputusan dan normalisasiMatriks.
 * @param {Object} data - { anakList, kriteriaList, indikatorList, jawabanList, bobot, ahpSiap }
 * @returns {Object} Rincian lengkap tahap MOORA
 */
export function getMooraDetail({
  anakList,
  kriteriaList,
  indikatorList,
  jawabanList,
  bobot = [],
  ahpSiap = true
}) {
  const keputusan = susunMatriksKeputusan(anakList, kriteriaList, indikatorList, jawabanList);
  const lengkap = keputusan.filter((baris) => baris.lengkap);
  const belumLengkap = keputusan.filter((baris) => !baris.lengkap);

  if (!ahpSiap || lengkap.length === 0 || kriteriaList.length === 0) {
    return {
      keputusan,
      lengkap,
      belumLengkap,
      pembagi: [],
      normalisasi: [],
      berbobot: [],
      hasilAkhir: [],
      ahpSiap
    };
  }

  const matriksLengkap = lengkap.map((baris) => baris.nilai);
  const numKriteria = kriteriaList.length;
  const pembagi = new Array(numKriteria).fill(0);

  for (let j = 0; j < numKriteria; j++) {
    let sumSq = 0;
    for (let i = 0; i < matriksLengkap.length; i++) {
      sumSq += matriksLengkap[i][j] ** 2;
    }
    pembagi[j] = bulat3(Math.sqrt(sumSq));
  }

  const normalisasi = normalisasiMatriks(matriksLengkap);
  const berbobot = normalisasi.map((baris) =>
    baris.map((nilai, j) => bulat3(nilai * (bobot[j] ?? 0)))
  );

  const hasilAkhir = lengkap.map((baris, index) => {
    const rowNorm = normalisasi[index];
    const rowW = berbobot[index];
    let benefitSum = 0;
    let costSum = 0;

    kriteriaList.forEach((kriteria, j) => {
      const valW = rowW[j] ?? 0;
      if (kriteria.jenis === 'cost') {
        costSum += valW;
      } else {
        benefitSum += valW;
      }
    });

    const yi = bulat3(benefitSum - costSum);

    return {
      ...baris,
      normalisasi: rowNorm,
      berbobot: rowW,
      benefitSum: bulat3(benefitSum),
      costSum: bulat3(costSum),
      yi,
      ranking: null
    };
  });

  hasilAkhir.sort((a, b) => b.yi - a.yi);
  hasilAkhir.forEach((baris, index) => {
    const sebelumnya = hasilAkhir[index - 1];
    if (sebelumnya && sebelumnya.yi === baris.yi) {
      baris.ranking = sebelumnya.ranking;
    } else {
      baris.ranking = index + 1;
    }
  });

  // Pengecekan kesamaan Yi/ranking dengan hitungMoora secara silent (console.warn jika berbeda)
  try {
    const pembanding = hitungMoora({
      anakList,
      kriteriaList,
      indikatorList,
      jawabanList,
      bobot,
      ahpSiap
    });
    const petaPembanding = new Map(pembanding.baris.map((b) => [b.anak_id, b]));
    for (const baris of hasilAkhir) {
      const lain = petaPembanding.get(baris.anak_id);
      if (!lain || lain.yi !== baris.yi || lain.ranking !== baris.ranking) {
        console.warn(
          'getMooraDetail: hasil Yi/ranking berbeda dengan hitungMoora untuk',
          baris.nama
        );
        break;
      }
    }
  } catch (e) {
    console.warn('getMooraDetail assertion error:', e);
  }

  const barisBelumLengkapSorted = belumLengkap.map((baris) => ({
    ...baris,
    normalisasi: null,
    berbobot: null,
    yi: null,
    ranking: null
  })).sort((a, b) => (a.nama || '').localeCompare(b.nama || ''));

  return {
    keputusan,
    lengkap,
    belumLengkap: barisBelumLengkapSorted,
    pembagi,
    normalisasi,
    berbobot,
    hasilAkhir: [...hasilAkhir, ...barisBelumLengkapSorted],
    ahpSiap
  };
}

