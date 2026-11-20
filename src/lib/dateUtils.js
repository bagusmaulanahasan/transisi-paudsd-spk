/**
 * Menghitung tahun ajaran berjalan berdasarkan tanggal saat ini.
 * Juli (bulan 6) - Desember (bulan 11) -> tahun / (tahun+1)
 * Januari (bulan 0) - Juni (bulan 5) -> (tahun-1) / tahun
 */
export function getTahunAjaranBerjalan(tanggal = new Date()) {
  const tahun = tanggal.getFullYear();
  const bulan = tanggal.getMonth(); // 0-indexed

  if (bulan >= 6) {
    return `${tahun}/${tahun + 1}`;
  } else {
    return `${tahun - 1}/${tahun}`;
  }
}
