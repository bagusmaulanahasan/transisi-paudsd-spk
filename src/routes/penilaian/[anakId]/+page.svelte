<script>
  import { supabase } from '$lib/db/supabase';
  import { page } from '$app/stores';
  import { hitungBobotAhp } from '$lib/spk/ahp';
  import { hitungMoora } from '$lib/spk/moora';
  import { simpanHasilPerhitungan } from '$lib/services/hasil';
  import { cachedFetch, peekMemoryCache, mutateCache, invalidateCache } from '$lib/db/cache';
  import { notifyError, notifySuccess } from '$lib/notifications';
  import { confirmAction } from '$lib/confirm';
  import { onMount } from 'svelte';
  import { ArrowLeft, AlertCircle, ArrowRight, School } from 'lucide-svelte';
  import LoadingState from '$lib/components/ui/LoadingState.svelte';
  import EmptyState from '$lib/components/ui/EmptyState.svelte';
  import AnakIdentityCard from './AnakIdentityCard.svelte';
  import AnakScoreSummaryCard from './AnakScoreSummaryCard.svelte';
  import AnakPenilaianFormCard from './AnakPenilaianFormCard.svelte';

  // ID anak diambil dari URL, misalnya /penilaian/12.
  const anakId = Number($page.params.anakId);
  const CACHE_KEY = 'penilaian:detail:' + anakId;

  // Data cache dipakai lebih dulu agar halaman tampil seketika saat dibuka ulang.
  const dataAwal = peekMemoryCache(CACHE_KEY);

  // ==================== DATA ====================
  let anak = dataAwal?.anak ?? null;
  let kelas = dataAwal?.kelas ?? null;
  let anakList = dataAwal?.anakList ?? [];
  let jawabanList = dataAwal?.jawaban ?? [];
  let kriteriaList = dataAwal?.kriteria ?? [];
  let indikatorList = dataAwal?.indikator ?? [];
  let opsiList = dataAwal?.opsi ?? [];
  let perbandinganList = dataAwal?.perbandingan ?? [];

  // ==================== STATUS ====================
  let loading = dataAwal === null;
  let notFound = false;
  let modeEdit = false;
  let menyimpan = null;
  let bobot = [];
  let ahpSiap = false;
  let pesanAhp = '';
  let hasil = { baris: [], jumlahLengkap: 0, jumlahAnak: 0 };
  let statusSimpanHasil = '';
  let waktuPerhitungan = null;

  if (dataAwal) terapkanData(dataAwal);

  onMount(async () => {
    const data = await cachedFetch(CACHE_KEY, ambilData, (dataBaru) => {
      // Jangan timpa pilihan pengguna saat sedang mode edit.
      if (!modeEdit) terapkanData(dataBaru);
    });

    if (data && data !== dataAwal) terapkanData(data);
    else if (!data && !anak) notFound = true;

    loading = false;
  });

  /**
   * Mengambil data anak, kelas, master penilaian, dan jawaban seluruh anak sekelas.
   */
  async function ambilData() {
    const { data: anakData, error: anakError } = await supabase
      .from('anak')
      .select('*')
      .eq('id', anakId)
      .single();

    if (anakError) throw anakError;
    if (!anakData) return { anak: null };

    const [kelasRes, kriteriaRes, indikatorRes, opsiRes, ahpRes, anakRes] = await Promise.all([
      supabase.from('kelas').select('*').eq('id', anakData.kelas_id).single(),
      supabase.from('kriteria').select('*').order('urutan', { ascending: true }),
      supabase.from('indikator').select('*').order('id', { ascending: true }),
      supabase.from('opsi_jawaban').select('*').order('poin', { ascending: true }),
      supabase.from('perbandingan_ahp').select('*'),
      supabase.from('anak').select('*').eq('kelas_id', anakData.kelas_id).order('nama', { ascending: true })
    ]);

    if (kelasRes.error) throw kelasRes.error;
    if (kriteriaRes.error) throw kriteriaRes.error;
    if (indikatorRes.error) throw indikatorRes.error;
    if (opsiRes.error) throw opsiRes.error;
    if (ahpRes.error) throw ahpRes.error;
    if (anakRes.error) throw anakRes.error;

    const daftarAnak = anakRes.data?.length ? anakRes.data : [anakData];
    const anakIds = daftarAnak.map((item) => item.id);

    const { data: jawabanData, error: jawabanError } = await supabase
      .from('detail_penilaian')
      .select('*')
      .in('anak_id', anakIds);

    if (jawabanError) throw jawabanError;

    return {
      anak: anakData,
      kelas: kelasRes.data,
      kriteria: kriteriaRes.data || [],
      indikator: indikatorRes.data || [],
      opsi: opsiRes.data || [],
      perbandingan: ahpRes.data || [],
      anakList: daftarAnak,
      jawaban: jawabanData || []
    };
  }

  /**
   * Menyimpan seluruh data hasil pengambilan ke state halaman.
   * @param {Object} data - Hasil dari ambilData().
   */
  function terapkanData(data) {
    if (!data.anak) {
      notFound = true;
      anak = null;
      return;
    }

    notFound = false;
    anak = data.anak;
    kelas = data.kelas;
    kriteriaList = data.kriteria;
    indikatorList = data.indikator;
    opsiList = data.opsi;
    perbandinganList = data.perbandingan;
    anakList = data.anakList;
    jawabanList = data.jawaban;
    hitungUlang();
  }

  /**
   * Menghitung bobot AHP dan MOORA untuk seluruh anak di kelas ini.
   */
  function hitungUlang() {
    const hasilAhp = hitungBobotAhp(kriteriaList, perbandinganList);
    bobot = hasilAhp.bobot;
    ahpSiap = hasilAhp.ahpSiap;
    pesanAhp = hasilAhp.pesan;

    hasil = hitungMoora({
      anakList,
      kriteriaList,
      indikatorList,
      jawabanList,
      bobot,
      ahpSiap
    });

    if (ahpSiap && kelas) {
      simpanHasil(hasil);
    } else {
      statusSimpanHasil = '';
    }
  }

  /**
   * Menyimpan hasil MOORA terakhir ke tabel hasil_perhitungan (best effort).
   */
  async function simpanHasil(data) {
    const status = await simpanHasilPerhitungan(supabase, kelas.id, kriteriaList, data);
    statusSimpanHasil = status.pesan;
    if (status.ok) waktuPerhitungan = new Date();
  }

  /**
   * Menyimpan jawaban indikator yang dipilih lalu menghitung ulang MOORA.
   */
  async function pilihJawaban(indikator, opsi) {
    if (!anak) return;

    if (!navigator.onLine) {
      notifyError('Perangkat sedang offline. Sambungkan internet agar jawaban dapat disimpan.');
      return;
    }

    menyimpan = indikator.id;

    const payload = {
      anak_id: anak.id,
      indikator_id: indikator.id,
      opsi_jawaban_id: opsi.id,
      poin: opsi.poin
    };

    const { error } = await supabase
      .from('detail_penilaian')
      .upsert(payload, { onConflict: 'anak_id,indikator_id' });

    if (error) {
      notifyError('Gagal menyimpan jawaban: ' + error.message);
      menyimpan = null;
      return;
    }

    notifySuccess('Berhasil menyimpan penilaian.');

    const index = jawabanList.findIndex(
      (jawaban) => jawaban.anak_id === anak.id && jawaban.indikator_id === indikator.id
    );

    if (index >= 0) {
      const salinan = [...jawabanList];
      salinan[index] = { ...salinan[index], ...payload };
      jawabanList = salinan;
    } else {
      jawabanList = [...jawabanList, payload];
    }

    // Perbarui cache halaman detail dan daftar tanpa menghapusnya agar navigasi tetap instan.
    mutateCache(CACHE_KEY, (lama) => ({ ...lama, jawaban: jawabanList }));
    mutateCache('penilaian:kelas:' + anak.kelas_id, (lama) => ({
      ...lama,
      jawaban: [
        ...lama.jawaban.filter(
          (jawaban) => !(jawaban.anak_id === anak.id && jawaban.indikator_id === indikator.id)
        ),
        payload
      ]
    }));

    // Status penilaian di dashboard berubah, jadi cache dashboard dibuang.
    invalidateCache('dashboard');

    menyimpan = null;
    hitungUlang();
  }

  /**
   * Mengaktifkan mode edit sehingga pilihan jawaban bisa diubah.
   */
  function mulaiEdit() {
    modeEdit = true;
  }

  /**
   * Mengembalikan halaman ke mode lihat saja.
   */
  function selesaiEdit() {
    modeEdit = false;
  }

  // Baris hasil MOORA milik anak yang sedang dibuka.
  $: barisSaya = hasil.baris.find((baris) => baris.anak_id === anakId) || null;

  // Indikator dikelompokkan per kriteria agar mudah dibaca.
  $: indikatorPerKriteria = kriteriaList.map((kriteria) => ({
    ...kriteria,
    indikator: indikatorList.filter((indikator) => indikator.kriteria_id === kriteria.id)
  }));

  // Peta jawaban indikator_id -> jawaban milik anak ini.
  $: jawabanAnakMap = (() => {
    const map = {};
    for (const jawaban of jawabanList) {
      if (jawaban.anak_id === anakId) map[jawaban.indikator_id] = jawaban;
    }
    return map;
  })();

  // Peta opsi_jawaban_id -> data opsi untuk menampilkan teks jawaban.
  $: opsiMap = Object.fromEntries(opsiList.map((opsi) => [opsi.id, opsi]));

  // Jumlah indikator yang sudah dijawab anak ini.
  $: terjawabAnak = indikatorList.filter((indikator) => jawabanAnakMap[indikator.id]).length;
</script>

<svelte:head>
  <title>{anak ? `Penilaian ${anak.nama}` : 'Penilaian Anak'} - SPK Transisi PAUD-SD</title>
</svelte:head>

<div class="space-y-8">
  {#if loading}
    <LoadingState text="Memuat data penilaian anak..." />
  {:else if notFound}
    <EmptyState
      title="Data anak tidak ditemukan"
      description="Anak mungkin sudah dihapus dari kelas ini."
      icon={AlertCircle}
    >
      <svelte:fragment slot="action">
        <a
          href="/penilaian"
          class="inline-flex items-center px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition shadow-sm shadow-blue-200"
        >
          <ArrowLeft class="w-4 h-4 mr-1.5" />
          <span>Kembali ke Daftar Penilaian</span>
        </a>
      </svelte:fragment>
    </EmptyState>
  {:else}
    <!-- Tombol kembali -->
    <a
      href={`/penilaian?kelas=${anak.kelas_id}`}
      class="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-blue-700 transition"
    >
      <ArrowLeft class="w-4 h-4" />
      Kembali ke Daftar Penilaian
    </a>

    <!-- Identitas Anak -->
    <AnakIdentityCard
      {anak}
      {kelas}
      {modeEdit}
      onMulaiEdit={mulaiEdit}
      onSelesaiEdit={selesaiEdit}
    />

    <!-- Ringkasan Yi & Ranking -->
    <AnakScoreSummaryCard
      {barisSaya}
      {ahpSiap}
      jumlahLengkap={hasil.jumlahLengkap}
    />

    {#if !ahpSiap}
      <div class="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex flex-col sm:flex-row sm:items-center gap-3">
        <div class="flex items-start gap-2.5 flex-1">
          <AlertCircle class="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <p class="text-xs font-medium text-amber-800 leading-relaxed">
            {pesanAhp} Nilai Yi dan ranking belum dapat dihitung.
          </p>
        </div>
        <a href="/kriteria" class="inline-flex items-center px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-[11px] font-bold transition w-fit whitespace-nowrap">
          Buka Kriteria & AHP
          <ArrowRight class="w-3.5 h-3.5 ml-1" />
        </a>
      </div>
    {/if}

    {#if indikatorList.length === 0}
      <div class="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex flex-col sm:flex-row sm:items-center gap-3">
        <div class="flex items-start gap-2.5 flex-1">
          <AlertCircle class="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <p class="text-xs font-medium text-amber-800">Belum ada indikator pertanyaan. Tambahkan indikator agar anak dapat dinilai.</p>
        </div>
        <a href="/indikator" class="inline-flex items-center px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-[11px] font-bold transition w-fit whitespace-nowrap">
          Buka Indikator
          <ArrowRight class="w-3.5 h-3.5 ml-1" />
        </a>
      </div>
    {/if}

    {#if opsiList.length === 0}
      <div class="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex flex-col sm:flex-row sm:items-center gap-3">
        <div class="flex items-start gap-2.5 flex-1">
          <AlertCircle class="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <p class="text-xs font-medium text-amber-800">Master opsi jawaban masih kosong. Tambahkan opsi terlebih dahulu.</p>
        </div>
        <a href="/indikator" class="inline-flex items-center px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-[11px] font-bold transition w-fit whitespace-nowrap">
          Buka Opsi Jawaban
          <ArrowRight class="w-3.5 h-3.5 ml-1" />
        </a>
      </div>
    {/if}

    <!-- Jawaban Penilaian -->
    <AnakPenilaianFormCard
      {kriteriaList}
      {indikatorPerKriteria}
      {opsiList}
      {bobot}
      {modeEdit}
      {menyimpan}
      {jawabanAnakMap}
      {opsiMap}
      {terjawabAnak}
      jumlahIndikator={indikatorList.length}
      onPilihJawaban={pilihJawaban}
    />

    {#if statusSimpanHasil}
      <div class="flex items-center gap-2 text-[11px] font-medium text-slate-500">
        <School class="w-3.5 h-3.5" />
        <span>{statusSimpanHasil}</span>
        {#if waktuPerhitungan}
          <span class="text-slate-400">Diperbarui {waktuPerhitungan.toLocaleTimeString('id-ID')}</span>
        {/if}
      </div>
    {/if}
  {/if}
</div>
