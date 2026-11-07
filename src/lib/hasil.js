/**
 * Helper penyimpanan hasil perhitungan MOORA ke tabel hasil_perhitungan.
 */

/**
 * Menyimpan hasil MOORA ke tabel hasil_perhitungan.
 * Anak yang jawabannya belum lengkap dihapus dari tabel agar tidak menampilkan hasil lama.
 * @param {Object} supabase - Klien Supabase yang sudah terautentikasi.
 * @param {number} kelasId - ID kelas yang sedang dihitung.
 * @param {Array} kriteriaList - Daftar kriteria untuk kunci nilai_kriteria.
 * @param {Object} data - Hasil dari hitungMoora().
 * @returns {Promise<{ ok: boolean, pesan: string }>} Status penyimpanan dan pesan untuk pengguna.
 */
export async function simpanHasilPerhitungan(supabase, kelasId, kriteriaList, data) {
  try {
    const lengkap = data.baris.filter((baris) => baris.lengkap);
    const belumLengkap = data.baris.filter((baris) => !baris.lengkap);

    if (lengkap.length > 0) {
      const rows = lengkap.map((baris) => ({
        kelas_id: kelasId,
        anak_id: baris.anak_id,
        nilai_kriteria: Object.fromEntries(
          kriteriaList.map((kriteria, index) => [kriteria.inisial, baris.nilai[index]])
        ),
        yi_score: baris.yi,
        ranking: baris.ranking
      }));

      const { error } = await supabase
        .from('hasil_perhitungan')
        .upsert(rows, { onConflict: 'kelas_id,anak_id' });

      if (error) throw error;
    }

    if (belumLengkap.length > 0) {
      const anakIds = belumLengkap.map((baris) => baris.anak_id);
      const { error } = await supabase
        .from('hasil_perhitungan')
        .delete()
        .eq('kelas_id', kelasId)
        .in('anak_id', anakIds);

      if (error) throw error;
    }

    return { ok: true, pesan: 'Hasil perhitungan tersimpan otomatis.' };
  } catch (error) {
    console.warn('Gagal menyimpan hasil perhitungan:', error);
    return {
      ok: false,
      pesan: 'Hasil tampil di layar, tetapi gagal disimpan ke server.'
    };
  }
}
