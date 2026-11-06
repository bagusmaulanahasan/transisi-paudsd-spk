/**
 * Merapikan nilai NIS: spasi di awal/akhir dibuang dan NIS kosong diubah menjadi null.
 */
export function normalisasiNis(nis) {
  const teks = (nis ?? '').toString().trim();
  return teks === '' ? null : teks;
}

/**
 * Memeriksa apakah NIS sudah dipakai anak lain pada daftar anak yang diberikan.
 * NIS kosong tidak pernah dianggap duplikat karena boleh diisi nanti.
 */
export function apakahNisDuplikat(daftarAnak, nis, kecualiId = null) {
  const nilai = normalisasiNis(nis);
  if (nilai === null) return false;
  return daftarAnak.some((anak) => anak.nis === nilai && anak.id !== kecualiId);
}
