<script>
  import { hitungBobotAhp, susunMatriksPerbandingan, getAHPDetail } from '$lib/spk/ahp';
  import { hitungMoora, getMooraDetail } from '$lib/spk/moora';
  import { fetchMasterData } from '$lib/services/masterData';
  import { fetchKelasPenilaian } from '$lib/services/penilaian';
  import { peekMemoryCache } from '$lib/db/cache';
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  import DetailAHP from './DetailAHP.svelte';
  import DetailMoora from './DetailMoora.svelte';
  import TahapBobot from './TahapBobot.svelte';
  import TahapMatriks from './TahapMatriks.svelte';
  import TahapHasil from './TahapHasil.svelte';
  import { FileText, Loader2, School, Printer } from 'lucide-svelte';
  import OfflineNotice from '$lib/components/ui/OfflineNotice.svelte';
  import { online } from '$lib/stores/koneksi';

  const kelasAwal = peekMemoryCache('master:kelas');
  const kriteriaAwal = peekMemoryCache('master:kriteria');
  const indikatorAwal = peekMemoryCache('master:indikator');
  const ahpAwal = peekMemoryCache('master:ahp');

  let kelasList = kelasAwal || [];
  let kriteriaList = kriteriaAwal || [];
  let indikatorList = indikatorAwal || [];
  let perbandinganList = ahpAwal || [];

  let selectedKelasId = pilihKelas(kelasAwal || []);

  const kelasDataAwal = selectedKelasId
    ? peekMemoryCache('penilaian:kelas:' + selectedKelasId)
    : null;

  let anakList = kelasDataAwal?.anak ?? [];
  let jawabanList = kelasDataAwal?.jawaban ?? [];

  let loadingMaster = !(kelasAwal && kriteriaAwal && indikatorAwal && ahpAwal);
  let loadingKelas = selectedKelasId !== null && kelasDataAwal === null;
  let bobot = [];
  let ahpSiap = false;
  let pesanAhp = '';
  let hasil = { baris: [], jumlahLengkap: 0, jumlahAnak: 0 };

  // Detail Perhitungan State
  let ahpDetail = null;
  let mooraDetail = null;

  if (kelasDataAwal && !loadingMaster) hitungUlang();

  onMount(async () => {
    await fetchMaster();
    loadingMaster = false;
  });

  function pilihKelas(daftarKelas) {
    const kelasDariUrl = Number($page.url.searchParams.get('kelas'));
    const adaDiUrl = daftarKelas.some((kelas) => kelas.id === kelasDariUrl);
    return adaDiUrl ? kelasDariUrl : daftarKelas[0]?.id ?? null;
  }

  async function fetchMaster() {
    const master = await fetchMasterData();

    kelasList = master.kelas;
    kriteriaList = master.kriteria;
    indikatorList = master.indikator;
    perbandinganList = master.perbandingan;

    if (kelasList.length > 0) {
      if (!selectedKelasId) selectedKelasId = pilihKelas(kelasList);
      await fetchKelasData();
    }
  }

  async function fetchKelasData() {
    if (!selectedKelasId) {
      anakList = [];
      jawabanList = [];
      loadingKelas = false;
      hitungUlang();
      return;
    }

    const cacheKey = 'penilaian:kelas:' + selectedKelasId;
    const cacheTersedia = peekMemoryCache(cacheKey);
    loadingKelas = cacheTersedia === null;

    const data = await fetchKelasPenilaian(selectedKelasId);

    anakList = data?.anak || [];
    jawabanList = data?.jawaban || [];
    loadingKelas = false;
    hitungUlang();
  }

  function hitungUlang() {
    const matrix = susunMatriksPerbandingan(kriteriaList, perbandinganList);
    const hasilAhp = hitungBobotAhp(kriteriaList, perbandinganList);
    
    bobot = hasilAhp.bobot;
    ahpSiap = hasilAhp.ahpSiap;
    pesanAhp = hasilAhp.pesan;

    // Hitung rincian untuk transparansi
    ahpDetail = getAHPDetail(matrix);
    
    mooraDetail = getMooraDetail({
      anakList,
      kriteriaList,
      indikatorList,
      jawabanList,
      bobot,
      ahpSiap
    });

    hasil = hitungMoora({
      anakList,
      kriteriaList,
      indikatorList,
      jawabanList,
      bobot,
      ahpSiap
    });
  }

  function cetakLaporan() {
    window.print();
  }
</script>


<svelte:head>
  <title>Laporan Perhitungan - SPK Transisi PAUD-SD</title>
</svelte:head>

<div class="space-y-8 print:space-y-4">
  <!-- Header Layar (disembunyikan saat cetak) -->
  <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
    <div>
      <h1 class="text-2xl font-bold text-slate-900 tracking-tight">Laporan Perhitungan SPK</h1>
      <p class="text-slate-500 text-sm mt-1">
        Laporan transparan read-only menampilkan seluruh tahapan AHP hingga perankingan MOORA.
      </p>
    </div>
    <div class="flex items-center gap-2">
      <button
        on:click={cetakLaporan}
        class="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition shadow-sm"
      >
        <Printer class="w-4 h-4" />
        <span>Cetak Laporan</span>
      </button>
    </div>
  </div>

  <!-- Pemilih Kelas -->
  <div class="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 print:p-0 print:border-none print:shadow-none">
    <label for="pilih-kelas-laporan" class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
      PILIH KELAS
    </label>
    <select
      id="pilih-kelas-laporan"
      bind:value={selectedKelasId}
      on:change={fetchKelasData}
      class="w-full md:w-80 px-4 py-2.5 rounded-xl border bg-white border-slate-200 text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none print:hidden"
    >
      {#each kelasList as item}
        <option value={item.id}>{item.nama_kelas} — {item.tahun_ajaran}</option>
      {/each}
    </select>
  </div>

  {#if !$online}
    <OfflineNotice />
  {:else if loadingMaster || loadingKelas}
    <div class="flex items-center justify-center p-12 bg-white rounded-2xl border border-slate-100 shadow-sm print:hidden">
      <div class="flex flex-col items-center space-y-3">
        <Loader2 class="w-8 h-8 text-blue-600 animate-spin" />
        <p class="text-slate-500 text-sm font-medium">Memuat data laporan...</p>
      </div>
    </div>
  {:else if kelasList.length === 0}
    <div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-10 text-center">
      <School class="w-10 h-10 text-slate-300 mx-auto mb-3" />
      <p class="text-base font-bold text-slate-800">Belum ada kelas</p>
      <p class="text-xs text-slate-500 mt-1">Tambahkan kelas terlebih dahulu untuk melihat laporan.</p>
    </div>
  {:else}
    <TahapBobot {kriteriaList} {bobot} {ahpSiap} />
    <TahapMatriks {kriteriaList} {hasil} />
    <TahapHasil {hasil} />

    <!-- DETAIL PERHITUNGAN -->
    <div class="bg-slate-50 rounded-2xl border border-slate-200 p-6 space-y-6">
      <div class="flex items-center gap-3">
        <div class="p-3 bg-white rounded-xl border border-slate-200">
          <FileText class="w-6 h-6 text-blue-600" />
        </div>
        <div>
          <h2 class="text-xl font-extrabold text-slate-900">Detail Perhitungan</h2>
          <p class="text-sm text-slate-500 font-medium">Transparansi langkah perhitungan AHP & MOORA.</p>
        </div>
      </div>
      
      <DetailAHP {kriteriaList} {perbandinganList} ahpDetail={ahpDetail} />
      <DetailMoora {kriteriaList} mooraDetail={mooraDetail} bobot={bobot} />
    </div>
  {/if}
</div>
