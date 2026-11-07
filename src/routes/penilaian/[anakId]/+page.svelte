<script>
  import { supabase } from '$lib/supabase';
  import { page } from '$app/stores';
  import { hitungBobotAhp } from '$lib/ahp';
  import { hitungMoora } from '$lib/moora';
  import { simpanHasilPerhitungan } from '$lib/hasil';
  import { cachedFetch, peekMemoryCache, mutateCache, invalidateCache } from '$lib/cache';
  import { onMount } from 'svelte';
  import {
    ArrowLeft,
    Loader2,
    UserRound,
    CheckCircle2,
    AlertCircle,
    ArrowRight,
    ClipboardList,
    Trophy,
    Target,
    PencilLine,
    School
  } from 'lucide-svelte';

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
      supabase.from('opsi_jawaban').select('*').is('indikator_id', null).order('poin', { ascending: true }),
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
      alert('Perangkat sedang offline. Sambungkan internet agar jawaban dapat disimpan.');
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
      alert('Gagal menyimpan jawaban: ' + error.message);
      menyimpan = null;
      return;
    }

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
    <div class="flex items-center justify-center p-12 bg-white rounded-2xl border border-slate-100 shadow-sm">
      <div class="flex flex-col items-center space-y-3">
        <Loader2 class="w-8 h-8 text-blue-600 animate-spin" />
        <p class="text-slate-500 text-sm font-medium">Memuat data penilaian anak...</p>
      </div>
    </div>
  {:else if notFound}
    <div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-10 text-center">
      <AlertCircle class="w-10 h-10 text-amber-400 mx-auto mb-3" />
      <p class="text-base font-bold text-slate-800">Data anak tidak ditemukan</p>
      <p class="text-xs text-slate-500 mt-1 mb-5">Anak mungkin sudah dihapus dari kelas ini.</p>
      <a
        href="/penilaian"
        class="inline-flex items-center px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition shadow-sm shadow-blue-200"
      >
        <ArrowLeft class="w-4 h-4 mr-1.5" />
        <span>Kembali ke Daftar Penilaian</span>
      </a>
    </div>
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
    <section class="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 md:p-6">
      <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
        <div class="flex items-start gap-4">
          <div class="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center shrink-0">
            <UserRound class="w-7 h-7 text-blue-600" />
          </div>
          <div>
            <p class="text-[11px] font-extrabold uppercase tracking-widest text-slate-400 mb-1">
              {kelas ? `${kelas.nama_kelas} — ${kelas.tahun_ajaran}` : 'Data kelas tidak ditemukan'}
            </p>
            <h1 class="text-2xl font-extrabold text-slate-900 tracking-tight">{anak.nama}</h1>
            <div class="flex flex-wrap items-center gap-2 mt-2">
              {#if anak.nis}
                <span class="inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 border border-slate-200">
                  NIS {anak.nis}
                </span>
              {:else}
                <span class="inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-100">
                  NIS belum diisi
                </span>
              {/if}
              <span class="inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider {modeEdit ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-blue-50 text-blue-700 border border-blue-100'}">
                {modeEdit ? 'Mode edit' : 'Mode lihat'}
              </span>
            </div>
          </div>
        </div>

        <div class="flex items-center gap-2">
          {#if modeEdit}
            <button
              on:click={selesaiEdit}
              class="inline-flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-sm shadow-emerald-200"
            >
              <CheckCircle2 class="w-4 h-4" />
              Selesai
            </button>
          {:else}
            <button
              on:click={mulaiEdit}
              class="inline-flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-sm shadow-blue-200"
            >
              <PencilLine class="w-4 h-4" />
              Edit Penilaian
            </button>
          {/if}
        </div>
      </div>
    </section>

    <!-- Ringkasan Yi & Ranking -->
    <section class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 md:p-6">
        <div class="flex items-center justify-between gap-3">
          <div>
            <p class="text-[11px] font-extrabold uppercase tracking-widest text-slate-400">Nilai Yi</p>
            <p class="text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
              {barisSaya && barisSaya.lengkap && barisSaya.yi !== null ? barisSaya.yi.toFixed(3) : '—'}
            </p>
          </div>
          <div class="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
            <Trophy class="w-5 h-5 text-blue-600" />
          </div>
        </div>
        <p class="text-[11px] font-medium text-slate-500 mt-3 leading-relaxed">
          {#if !ahpSiap}
            Bobot AHP belum siap sehingga Yi belum dapat dihitung.
          {:else if barisSaya && !barisSaya.lengkap}
            Jawaban belum lengkap ({barisSaya.terjawab}/{barisSaya.total} indikator).
          {:else}
            Nilai optimasi MOORA, dibulatkan 3 angka di belakang koma.
          {/if}
        </p>
      </div>

      <div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 md:p-6">
        <div class="flex items-center justify-between gap-3">
          <div>
            <p class="text-[11px] font-extrabold uppercase tracking-widest text-slate-400">Ranking</p>
            <p class="text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
              {barisSaya && barisSaya.ranking !== null ? `#${barisSaya.ranking}` : '—'}
            </p>
          </div>
          <div class="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
            <Target class="w-5 h-5 text-blue-600" />
          </div>
        </div>
        <p class="text-[11px] font-medium text-slate-500 mt-3 leading-relaxed">
          {#if !ahpSiap}
            Ranking menunggu bobot AHP yang konsisten.
          {:else if barisSaya && !barisSaya.lengkap}
            Belum masuk ranking karena jawaban belum lengkap.
          {:else if barisSaya}
            Peringkat dari {hasil.jumlahLengkap} anak yang jawabannya lengkap.
          {:else}
            Ranking belum tersedia.
          {/if}
        </p>
      </div>
    </section>

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
    <section class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div class="p-5 md:p-6 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div class="flex items-start gap-3">
          <div class="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
            <ClipboardList class="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h2 class="text-lg font-bold text-slate-900 tracking-tight">Jawaban Penilaian</h2>
            <p class="text-xs text-slate-500 mt-1 leading-relaxed">
              {modeEdit
                ? 'Mode edit — setiap jawaban yang dipilih langsung tersimpan otomatis.'
                : 'Mode lihat — tekan Edit Penilaian untuk mengubah jawaban.'}
            </p>
          </div>
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <span class="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-lg whitespace-nowrap">
            Terjawab {terjawabAnak}/{indikatorList.length}
          </span>
          {#if indikatorList.length > 0 && terjawabAnak === indikatorList.length}
            <span class="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-lg whitespace-nowrap">
              <CheckCircle2 class="w-3.5 h-3.5" /> Lengkap
            </span>
          {:else}
            <span class="inline-flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-50 border border-amber-100 px-3 py-1 rounded-lg whitespace-nowrap">
              <AlertCircle class="w-3.5 h-3.5" /> Belum lengkap
            </span>
          {/if}
        </div>
      </div>

      <div class="p-5 md:p-6 space-y-6">
        {#if kriteriaList.length === 0}
          <p class="text-sm text-slate-500">Belum ada kriteria penilaian.</p>
        {:else}
          {#each indikatorPerKriteria as kriteria, kriteriaIndex (kriteria.id)}
            <div class="space-y-3">
              <div class="flex flex-wrap items-center gap-2 border-b border-slate-100 pb-3">
                <span class="inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-100">
                  {kriteria.inisial}
                </span>
                <h3 class="text-sm font-bold text-slate-900">{kriteria.nama}</h3>
                <span class="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border {kriteria.jenis === 'benefit' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-red-50 text-red-700 border-red-100'}">
                  {kriteria.jenis}
                </span>
                <span class="ml-auto text-[11px] font-semibold text-slate-400 whitespace-nowrap">
                  Bobot {bobot[kriteriaIndex] !== undefined ? bobot[kriteriaIndex].toFixed(3) : '—'}
                </span>
              </div>

              {#if kriteria.indikator.length === 0}
                <p class="text-xs text-slate-400 font-medium">Belum ada indikator pada kriteria ini.</p>
              {:else}
                {#each kriteria.indikator as indikator, indikatorIndex (indikator.id)}
                  <div class="rounded-xl border border-slate-200 bg-slate-50 p-4 md:p-5 space-y-3 transition hover:bg-white">
                    <div class="space-y-1">
                      <div class="flex items-center justify-between gap-2">
                        <span class="text-[10px] font-bold uppercase tracking-wider text-blue-600">
                          Indikator #{indikatorIndex + 1} — {kriteria.inisial}
                        </span>
                        {#if !modeEdit && jawabanAnakMap[indikator.id]}
                          <span class="inline-flex items-center gap-1 shrink-0 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-100">
                            <CheckCircle2 class="w-3 h-3" /> Terjawab
                          </span>
                        {/if}
                      </div>
                      <p class="text-sm font-medium text-slate-900 leading-relaxed">
                        {indikator.pertanyaan}
                      </p>
                    </div>

                    {#if modeEdit}
                      <div class="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
                        {#each opsiList as opsi (opsi.id)}
                          <button
                            on:click={() => pilihJawaban(indikator, opsi)}
                            disabled={menyimpan === indikator.id}
                            title={opsi.keterangan || ''}
                            class="px-3 py-2 rounded-lg border text-xs font-bold text-left transition disabled:opacity-60 {jawabanAnakMap[indikator.id]?.opsi_jawaban_id === opsi.id
                              ? 'bg-blue-600 border-blue-600 text-white shadow-sm shadow-blue-200'
                              : 'bg-white border-slate-200 text-slate-600 hover:border-blue-300 hover:text-blue-700'}"
                          >
                            Poin {opsi.poin}: {opsi.opsi}
                          </button>
                        {/each}
                        {#if menyimpan === indikator.id}
                          <Loader2 class="w-4 h-4 text-blue-600 animate-spin" />
                        {/if}
                      </div>
                    {:else if jawabanAnakMap[indikator.id]}
                      <div class="flex flex-wrap items-center gap-2 rounded-lg border border-blue-100 bg-blue-50/60 px-3 py-2.5">
                        <CheckCircle2 class="w-4 h-4 text-blue-600 shrink-0" />
                        <span class="text-sm font-bold text-slate-800">
                          {opsiMap[jawabanAnakMap[indikator.id].opsi_jawaban_id]?.opsi ?? 'Jawaban tersimpan'}
                        </span>
                        <span class="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-white text-blue-700 border border-blue-100">
                          Poin {jawabanAnakMap[indikator.id].poin}
                        </span>
                      </div>
                    {:else}
                      <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-100">
                        <AlertCircle class="w-3 h-3" /> Belum dijawab
                      </span>
                    {/if}
                  </div>
                {/each}
              {/if}
            </div>
          {/each}
        {/if}
      </div>

      <div class="px-6 py-4 bg-slate-50/50 border-t border-slate-100">
        <p class="text-[11px] text-slate-500 font-medium leading-relaxed">
          {modeEdit
            ? 'Jawaban disimpan otomatis setiap kali dipilih. Nilai Yi dan ranking seluruh anak di kelas ini ikut diperbarui.'
            : 'Tampilan ini hanya untuk melihat hasil. Tekan tombol Edit Penilaian di atas untuk mengubah jawaban.'}
        </p>
      </div>
    </section>

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
