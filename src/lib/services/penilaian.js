/**
 * Service data penilaian per kelas: anak dan seluruh jawaban detail_penilaian.
 */
import { supabase } from '$lib/db/supabase';
import { cachedFetch } from '$lib/db/cache';

/**
 * Mengambil anak pada satu kelas beserta seluruh jawaban detail_penilaian.
 * @param {number} kelasId
 * @returns {Promise<{ anak: Array, jawaban: Array } | null>}
 */
export async function fetchKelasPenilaian(kelasId) {
  return cachedFetch('penilaian:kelas:' + kelasId, async () => {
    const { data: anakData, error: anakError } = await supabase
      .from('anak')
      .select('*')
      .eq('kelas_id', kelasId)
      .order('nama', { ascending: true });

    if (anakError) throw anakError;

    const daftarAnak = anakData || [];
    if (daftarAnak.length === 0) return { anak: [], jawaban: [] };

    const anakIds = daftarAnak.map((anak) => anak.id);
    const { data: jawabanData, error: jawabanError } = await supabase
      .from('detail_penilaian')
      .select('*')
      .in('anak_id', anakIds);

    if (jawabanError) throw jawabanError;

    return { anak: daftarAnak, jawaban: jawabanData || [] };
  });
}
