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
  import TahapMatriksHasil from './TahapMatriksHasil.svelte';
  import PageHeader from '$lib/components/ui/PageHeader.svelte';
  import { FileText, Loader2, School, Printer, Download, FileSpreadsheet, FileCode } from 'lucide-svelte';
  import OfflineNotice from '$lib/components/ui/OfflineNotice.svelte';
  import { online } from '$lib/stores/koneksi';
  import * as XLSX from 'xlsx';

  const kelasAwal = peekMemoryCache('master:kelas');
  const kriteriaAwal = peekMemoryCache('master:kriteria');
  const indikatorAwal = peekMemoryCache('master:indikator');
  const ahpAwal = peekMemoryCache('master:ahp');

  let kelasList = kelasAwal || [];
  let kriteriaList = kriteriaAwal || [];
  let indikatorList = indikatorAwal || [];
  let perbandinganList = ahpAwal || [];

  let tahunList = [];
  let selectedTahun = '';
  let filteredKelas = [];
  let selectedKelasId = '';

  let anakList = [];
  let jawabanList = [];

  let bobot = [];
  let ahpSiap = false;
  let pesanAhp = '';
  let ahpDetail = null;
  let mooraDetail = null;
  let hasil = { baris: [] };

  let loadingMaster = !kelasAwal || !kriteriaAwal;
  let loadingKelas = false;
  let showDownloadDropdown = false;

  onMount(async () => {
    try {
      const data = await fetchMasterData();
      kelasList = data.kelas || [];
      kriteriaList = data.kriteria || [];
      indikatorList = data.indikator || [];
      perbandinganList = data.perbandingan || [];

      tahunList = [...new Set(kelasList.map(k => k.tahun_ajaran))].sort().reverse();
      if (tahunList.length > 0) {
        selectedTahun = tahunList[0];
        gantiTahun();
      }
      loadingMaster = false;
    } catch (err) {
      console.error('Gagal memuat master data:', err);
      loadingMaster = false;
    }
  });

  function gantiTahun() {
    filteredKelas = kelasList.filter(k => k.tahun_ajaran === selectedTahun);
    if (filteredKelas.length > 0) {
      selectedKelasId = filteredKelas[0].id;
      fetchKelasData();
    } else {
      selectedKelasId = '';
      anakList = [];
      jawabanList = [];
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

  function handleDownloadPDF() {
    showDownloadDropdown = false;
    window.print();
  }

  function handleDownloadExcel() {
    showDownloadDropdown = false;
    const kelasObj = kelasList.find(k => k.id === selectedKelasId);
    const namaKelas = kelasObj ? kelasObj.nama_kelas : 'Kelas';
    
    // Total columns for main table = 2 (No, Nama Anak) + kriteriaList.length + 2 (Nilai Yi, Ranking)
    const totalCols = 2 + kriteriaList.length + 2;
    const maxCols = Math.max(totalCols, 5);

    let wsData = [
      ["LAPORAN PENILAIAN PERHITUNGAN SPK"],
      ["Tahun Ajaran:", selectedTahun],
      ["Kelas:", namaKelas],
      [],
      ["BOBOT KRITERIA"],
      ["No", "Kode & Nama Kriteria", "Jenis", "Bobot (Wj)"]
    ];

    kriteriaList.forEach((k, i) => {
      const kodeNama = `(C${k.urutan || i + 1}) ${k.nama || k.nama_kriteria || ''}`;
      wsData.push([i + 1, kodeNama, k.jenis, bobot[i] !== undefined ? Number(bobot[i].toFixed(4)) : 0]);
    });

    wsData.push([], [], ["HASIL PENILAIAN DAN PRIORITAS STIMULASI"]);
    
    let headers = ["No", "Nama Anak"];
    kriteriaList.forEach((k, i) => headers.push(`C${k.urutan || i + 1}`));
    headers.push("Nilai Yi", "Ranking");
    wsData.push(headers);

    hasil.baris.forEach((baris, idx) => {
      let row = [idx + 1, baris.nama];
      (baris.nilai || []).forEach(val => row.push(Number(val.toFixed(4))));
      row.push(baris.yi !== null ? Number(baris.yi.toFixed(4)) : "Belum Lengkap");
      row.push(baris.ranking !== null ? baris.ranking : "-");
      wsData.push(row);
    });

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // Merge & center headers
    if (!ws['!merges']) ws['!merges'] = [];
    ws['!merges'].push(
      { s: { r: 0, c: 0 }, e: { r: 0, c: maxCols - 1 } }, // Title
      { s: { r: 4, c: 0 }, e: { r: 4, c: 3 } },          // BOBOT KRITERIA
      { s: { r: kriteriaList.length + 8, c: 0 }, e: { r: kriteriaList.length + 8, c: maxCols - 1 } } // HASIL PENILAIAN
    );

    XLSX.utils.book_append_sheet(wb, ws, "Laporan Penilaian");
    XLSX.writeFile(wb, `Laporan_SPK_${namaKelas.replace(/\s+/g, '_')}_${selectedTahun.replace(/\//g, '-')}.xlsx`);
  }

  // Close dropdown on outside click
  function handleClickOutside(event) {
    if (!event.target.closest('#download-dropdown-container')) {
      showDownloadDropdown = false;
    }
  }
</script>

<svelte:window on:click={handleClickOutside} />

<svelte:head>
  <title>Laporan Perhitungan - SPK Transisi PAUD-SD</title>
</svelte:head>

<div class="space-y-8 print:space-y-4">
  <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 print:hidden">
    <PageHeader 
      title="Laporan Perhitungan SPK" 
      subtitle="Laporan transparan read-only menampilkan seluruh tahapan AHP hingga perankingan MOORA."
    />
  </div>

  <!-- Pemilih Tahun Ajaran & Kelas + Tombol Download di Kanan -->
  <div class="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 print:p-0 print:border-none print:shadow-none flex flex-col md:flex-row md:items-end md:justify-between gap-4">
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl w-full">
      <div>
        <label for="pilih-tahun-laporan" class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
          PILIH TAHUN AJARAN
        </label>
        <select
          id="pilih-tahun-laporan"
          bind:value={selectedTahun}
          on:change={gantiTahun}
          class="w-full px-4 py-2.5 rounded-xl border bg-white border-slate-200 text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none print:hidden"
        >
          {#each tahunList as th}
            <option value={th}>{th}</option>
          {/each}
        </select>
      </div>

      <div>
        <label for="pilih-kelas-laporan" class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
          PILIH KELAS
        </label>
        <select
          id="pilih-kelas-laporan"
          bind:value={selectedKelasId}
          on:change={fetchKelasData}
          class="w-full px-4 py-2.5 rounded-xl border bg-white border-slate-200 text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none print:hidden"
        >
          {#each filteredKelas as item}
            <option value={item.id}>{item.nama_kelas}</option>
          {/each}
        </select>
      </div>
    </div>

    <!-- Tombol Download Dropdown di Paling Kanan -->
    {#if kelasList.length > 0 && !loadingMaster && !loadingKelas}
      <div class="relative print:hidden" id="download-dropdown-container">
        <button
          type="button"
          on:click={() => showDownloadDropdown = !showDownloadDropdown}
          class="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-bold shadow-sm shadow-blue-500/20 hover:bg-blue-700 active:scale-95 transition-all"
        >
          <Download class="w-4 h-4" />
          Download Laporan
        </button>

        {#if showDownloadDropdown}
          <div class="absolute right-0 mt-2 w-48 rounded-xl bg-white border border-slate-200 shadow-xl py-1 z-50 animate-in fade-in zoom-in-95 duration-100">
            <button
              type="button"
              on:click={handleDownloadPDF}
              class="w-full flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <Printer class="w-4 h-4 text-blue-600" />
              Cetak / Unduh PDF
            </button>
            <button
              type="button"
              on:click={handleDownloadExcel}
              class="w-full flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <FileSpreadsheet class="w-4 h-4 text-emerald-600" />
              Unduh Excel (.xlsx)
            </button>
          </div>
        {/if}
      </div>
    {/if}
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
    <!-- Header khusus cetak PDF -->
    <div class="hidden print:block mb-6 text-center border-b border-slate-300 pb-4">
      <h1 class="text-xl font-extrabold text-slate-900 uppercase">Laporan Penilaian SPK Transisi PAUD-SD</h1>
      <p class="text-sm font-semibold text-slate-600 mt-1">
        Tahun Ajaran: {selectedTahun} | Kelas: {kelasList.find(k => k.id === selectedKelasId)?.nama_kelas || '-'}
      </p>
    </div>

    <TahapBobot {kriteriaList} {bobot} {ahpSiap} />
    <TahapMatriksHasil {kriteriaList} {hasil} />

    <!-- DETAIL PERHITUNGAN -->
    <div class="bg-slate-50 rounded-2xl border border-slate-200 p-6 space-y-6 print:bg-white print:border-none print:p-0">
      <div class="flex items-center gap-3 print:hidden">
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
