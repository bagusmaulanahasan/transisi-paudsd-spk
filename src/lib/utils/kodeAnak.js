/**
 * Utilitas pembuatan kode anak.
 *
 * Format kode: `[Inisial Kelas]-[Nomor Urut]`, misalnya `B3-13`.
 * Kode dibuat sekali saat anak ditambahkan lalu tidak diubah lagi, sehingga
 * nomor milik anak yang sudah dihapus tidak dipakai ulang.
 */

const PADDING_MINIMAL = 2;

/**
 * Mengambil inisial kelas dari nama kelas.
 * Token terakhir dipakai agar "Kelas B3" dan "B3" menghasilkan nilai sama.
 * Bila token terakhir hanya angka ("Kelas B 3"), token sebelumnya ikut
 * digabung selama pendek, sehingga hasilnya tetap "B3".
 *
 * @param {string} namaKelas
 * @returns {string} Inisial huruf besar, atau "ANAK" bila tidak ada karakter valid.
 */
export function inisialKelas(namaKelas) {
  const teks = String(namaKelas ?? '').trim();
  if (!teks) return 'ANAK';

  const token = teks.split(/\s+/).filter(Boolean);
  let kandidat = token[token.length - 1] ?? '';

  const sebelumnya = token[token.length - 2] ?? '';
  if (/^\d+$/.test(kandidat) && sebelumnya.length > 0 && sebelumnya.length <= 3) {
    kandidat = `${sebelumnya}${kandidat}`;
  }

  const bersih = kandidat.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();

  return bersih || 'ANAK';
}

/**
 * Menyusun kode anak dari inisial kelas dan nomor urut.
 *
 * @param {string} inisial - Inisial kelas, misalnya "B3".
 * @param {number} nomorUrut - Nomor urut mulai dari 1.
 * @returns {string} Kode anak, misalnya "B3-13".
 */
export function buatKodeAnak(inisial, nomorUrut) {
  const awalan = String(inisial ?? '').trim().toUpperCase() || 'ANAK';
  const nomor = Number.isFinite(nomorUrut) ? Math.max(1, Math.trunc(nomorUrut)) : 1;

  return `${awalan}-${String(nomor).padStart(PADDING_MINIMAL, '0')}`;
}

/**
 * Menghitung nomor urut berikutnya dari daftar anak pada satu kelas.
 * Nomor tertinggi diambil dari bagian angka pada `kode_anak`, bukan jumlah
 * anak, agar celah akibat penghapusan tidak dipakai ulang.
 *
 * @param {Array<{ kode_anak?: string | null }>} daftarAnak
 * @returns {number} Nomor urut berikutnya (minimal 1).
 */
export function nomorUrutBerikutnya(daftarAnak) {
  let tertinggi = 0;

  for (const anak of daftarAnak ?? []) {
    const kode = String(anak?.kode_anak ?? '');
    const cocok = kode.match(/(\d+)\s*$/);
    if (!cocok) continue;

    const nomor = Number.parseInt(cocok[1], 10);
    if (Number.isFinite(nomor) && nomor > tertinggi) tertinggi = nomor;
  }

  return tertinggi + 1;
}
