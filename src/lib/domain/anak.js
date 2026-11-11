/**
 * Merapikan nilai nama panggilan: spasi di awal/akhir dibuang dan nilai kosong
 * diubah menjadi null (kolom di database boleh kosong).
 */
export function normalisasiNamaPanggilan(namaPanggilan) {
  const teks = (namaPanggilan ?? '').toString().trim();
  return teks === '' ? null : teks;
}

/**
 * Memeriksa apakah nama panggilan sudah dipakai anak lain pada daftar anak yang
 * diberikan. Perbandingan tidak membedakan huruf besar/kecil dan nilai kosong
 * tidak pernah dianggap duplikat karena boleh diisi nanti.
 */
export function apakahNamaPanggilanDuplikat(daftarAnak, namaPanggilan, kecualiId = null) {
  const nilai = normalisasiNamaPanggilan(namaPanggilan);
  if (nilai === null) return false;

  const kunci = nilai.toLowerCase();
  return daftarAnak.some(
    (anak) =>
      anak.id !== kecualiId &&
      (anak.nama_panggilan ?? '').toString().trim().toLowerCase() === kunci
  );
}
