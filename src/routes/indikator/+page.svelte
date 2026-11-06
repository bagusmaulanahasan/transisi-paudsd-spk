<script>
  import { supabase } from '$lib/supabase';
  import { aturPoinOpsi } from '$lib/opsi';
  import {
    Plus,
    Trash2,
    Edit2,
    Loader2,
    Save,
    X,
    ListChecks,
    HelpCircle,
    AlertCircle,
    MessageSquareText
  } from 'lucide-svelte';
  import { onMount } from 'svelte';

  // ==================== SECTION 1: MASTER OPSI JAWABAN ====================
  let masterOpsi = [];
  let showOpsiModal = false;
  let isEditingOpsi = false;
  let currentOpsiId = null;
  let opsiText = '';
  let keteranganText = '';

  // ==================== SECTION 2: INDIKATOR PERTANYAAN ====================
  let kriteriaList = [];
  let selectedKriteriaId = null;
  let indikatorList = [];
  let loading = true;
  let saving = false;

  // State modal indikator (tambah / ubah)
  let showIndikatorModal = false;
  let isEditingIndikator = false;
  let currentIndikatorId = null;
  let pertanyaan = '';

  onMount(async () => {
    await Promise.all([fetchMasterOpsi(), fetchKriteria()]);
  });

  /**
   * Mengambil master opsi jawaban global (indikator_id NULL) yang berlaku untuk semua kriteria.
   */
  async function fetchMasterOpsi() {
    const { data, error } = await supabase
      .from('opsi_jawaban')
      .select('*')
      .is('indikator_id', null)
      .order('poin', { ascending: true });

    if (error) {
      console.error('Error fetching master opsi:', error);
      return;
    }
    masterOpsi = data;
  }

  /**
   * Mengambil daftar kriteria lalu memuat indikator kriteria pertama.
   */
  async function fetchKriteria() {
    loading = true;
    const { data, error } = await supabase
      .from('kriteria')
      .select('*')
      .order('urutan', { ascending: true });

    if (error) {
      console.error('Error fetching kriteria:', error);
    } else {
      kriteriaList = data;
      if (!selectedKriteriaId && kriteriaList.length > 0) {
        selectedKriteriaId = kriteriaList[0].id;
      }
      await fetchIndikator();
    }
    loading = false;
  }

  /**
   * Mengambil indikator milik kriteria yang sedang dipilih.
   */
  async function fetchIndikator() {
    if (!selectedKriteriaId) {
      indikatorList = [];
      return;
    }

    const { data, error } = await supabase
      .from('indikator')
      .select('*')
      .eq('kriteria_id', selectedKriteriaId)
      .order('id', { ascending: true });

    if (error) {
      console.error('Error fetching indikator:', error);
      return;
    }
    indikatorList = data;
  }

  /**
   * Menangani pergantian kriteria pada dropdown filter.
   */
  function onKriteriaChange() {
    fetchIndikator();
  }

  // ==================== AKSI MASTER OPSI JAWABAN ====================

  /**
   * Membuka modal tambah master opsi jawaban.
   */
  function openAddOpsi() {
    isEditingOpsi = false;
    currentOpsiId = null;
    opsiText = '';
    keteranganText = '';
    showOpsiModal = true;
  }

  /**
   * Membuka modal ubah master opsi jawaban.
   */
  function openEditOpsi(opsi) {
    isEditingOpsi = true;
    currentOpsiId = opsi.id;
    opsiText = opsi.opsi;
    keteranganText = opsi.keterangan || '';
    showOpsiModal = true;
  }

  /**
   * Menutup modal opsi jawaban.
   */
  function closeOpsiModal() {
    showOpsiModal = false;
  }

  /**
   * Menyimpan master opsi jawaban ke Supabase.
   */
  async function saveOpsi() {
    if (!opsiText.trim()) {
      alert('Teks opsi wajib diisi.');
      return;
    }

    saving = true;

    if (isEditingOpsi) {
      const { error } = await supabase
        .from('opsi_jawaban')
        .update({ opsi: opsiText.trim(), keterangan: keteranganText.trim() || null })
        .eq('id', currentOpsiId);
      if (error) alert(error.message);
    } else {
      const { error } = await supabase.from('opsi_jawaban').insert({
        indikator_id: null,
        opsi: opsiText.trim(),
        keterangan: keteranganText.trim() || null,
        poin: masterOpsi.length + 1
      });
      if (error) alert(error.message);
    }

    await fetchMasterOpsi();
    saving = false;
    closeOpsiModal();
  }

  /**
   * Menghapus master opsi lalu menyinkronkan ulang poin menjadi 1..n berurutan.
   */
  async function deleteOpsi(opsi) {
    if (!confirm(`Hapus opsi "${opsi.opsi}"?\nOpsi ini berlaku untuk semua kriteria dan penilaian anak yang memakainya ikut terhapus.`)) {
      return;
    }

    const { error } = await supabase.from('opsi_jawaban').delete().eq('id', opsi.id);
    if (error) {
      alert(error.message);
      return;
    }

    await fetchMasterOpsi();
    await syncPoinMaster();
  }

  /**
   * Menyinkronkan ulang poin master opsi menjadi 1..n sesuai urutan.
   */
  async function syncPoinMaster() {
    const tersinkron = aturPoinOpsi(masterOpsi);

    for (let i = 0; i < tersinkron.length; i++) {
      if (tersinkron[i].poin !== masterOpsi[i].poin) {
        await supabase.from('opsi_jawaban').update({ poin: tersinkron[i].poin }).eq('id', masterOpsi[i].id);
      }
    }
    await fetchMasterOpsi();
  }

  // ==================== AKSI INDIKATOR PERTANYAAN ====================

  /**
   * Membuka modal tambah indikator pada kriteria yang sedang dipilih.
   */
  function openAddIndikator() {
    isEditingIndikator = false;
    currentIndikatorId = null;
    pertanyaan = '';
    showIndikatorModal = true;
  }

  /**
   * Membuka modal ubah indikator.
   */
  function openEditIndikator(item) {
    isEditingIndikator = true;
    currentIndikatorId = item.id;
    pertanyaan = item.pertanyaan;
    showIndikatorModal = true;
  }

  /**
   * Menutup modal indikator.
   */
  function closeIndikatorModal() {
    showIndikatorModal = false;
  }

  /**
   * Menyimpan indikator ke Supabase pada kriteria terpilih.
   */
  async function saveIndikator() {
    if (!pertanyaan.trim()) {
      alert('Teks pertanyaan wajib diisi.');
      return;
    }

    saving = true;

    if (isEditingIndikator) {
      const { error } = await supabase
        .from('indikator')
        .update({ pertanyaan: pertanyaan.trim() })
        .eq('id', currentIndikatorId);
      if (error) alert(error.message);
    } else {
      const { error } = await supabase
        .from('indikator')
        .insert({ kriteria_id: selectedKriteriaId, pertanyaan: pertanyaan.trim() });
      if (error) alert(error.message);
    }

    await fetchIndikator();
    saving = false;
    closeIndikatorModal();
  }

  /**
   * Menghapus indikator beserta penilaian anak terkait (ikut terhapus via cascade).
   */
  async function deleteIndikator(item) {
    if (!confirm(`Hapus indikator "${item.pertanyaan.slice(0, 40)}..."?\nData penilaian anak pada indikator ini ikut terhapus.`)) {
      return;
    }

    const { error } = await supabase.from('indikator').delete().eq('id', item.id);
    if (error) {
      alert(error.message);
      return;
    }
    await fetchIndikator();
  }

  $: kriteriaAktif = kriteriaList.find((k) => k.id === selectedKriteriaId) || null;
  $: judulKriteria = kriteriaAktif ? `${kriteriaAktif.inisial} - ${kriteriaAktif.nama}` : '';
</script>

<svelte:head>
  <title>Indikator Pertanyaan - SPK Transisi PAUD-SD</title>
</svelte:head>

<div class="space-y-8">
  <!-- Header Halaman -->
  <div>
    <h1 class="text-2xl font-extrabold text-slate-900 tracking-tight">Kelola Opsi Jawaban & Indikator Pertanyaan</h1>
    <p class="text-sm text-slate-500 mt-1 font-medium">Atur skala jawaban baku untuk semua kriteria, lalu susun pertanyaan observasi per kriteria.</p>
  </div>

  {#if loading}
    <div class="flex items-center justify-center p-12 bg-white rounded-2xl border border-slate-100 shadow-sm">
      <div class="flex flex-col items-center space-y-3">
        <Loader2 class="w-8 h-8 text-blue-600 animate-spin" />
        <p class="text-slate-500 text-sm font-medium">Sinkronisasi data database...</p>
      </div>
    </div>
  {:else}
    <!-- ==================== SECTION ATAS: MASTER OPSI JAWABAN ==================== -->
    <section class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div class="p-5 md:p-6 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div class="flex items-start gap-3">
          <div class="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
            <ListChecks class="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h2 class="text-lg font-bold text-slate-900 tracking-tight">Master Opsi Jawaban</h2>
            <p class="text-xs text-slate-500 mt-1 leading-relaxed max-w-xl">
              Skala penilaian baku yang berlaku untuk <strong>semua kriteria & indikator</strong>. Poin diisi otomatis sesuai urutan.
            </p>
          </div>
        </div>

        <div class="flex items-center gap-3 sm:shrink-0">
          <span class="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-lg whitespace-nowrap">
            Total: {masterOpsi.length} Opsi
          </span>
          <button
            on:click={openAddOpsi}
            class="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition inline-flex items-center shadow-sm shadow-blue-200 whitespace-nowrap"
          >
            <Plus class="w-4 h-4 mr-1.5" />
            <span>Tambah Opsi</span>
          </button>
        </div>
      </div>

      {#if masterOpsi.length === 0}
        <div class="p-5 md:p-6">
          <div class="flex flex-col items-center justify-center p-10 text-center border border-dashed border-slate-300 rounded-xl bg-slate-50/50">
            <HelpCircle class="w-8 h-8 text-slate-300 mb-3" />
            <p class="text-sm font-bold text-slate-700">Belum ada opsi jawaban baku</p>
            <p class="text-xs text-slate-500 mt-1">Tambahkan minimal 2 opsi agar penilaian anak bermakna.</p>
          </div>
        </div>
      {:else}
        <div class="px-5 md:px-6 pt-4 md:pt-0">
          <p class="md:hidden text-[11px] text-slate-400 font-medium">Geser tabel ke samping untuk melihat semua kolom.</p>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse min-w-[720px]">
            <thead>
              <tr class="bg-slate-50/50">
                <th class="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest w-20">No.</th>
                <th class="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Teks Opsi</th>
                <th class="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Keterangan</th>
                <th class="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-center whitespace-nowrap">Poin (Otomatis)</th>
                <th class="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-right w-32">Aksi</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              {#each masterOpsi as opsi, index (opsi.id)}
                <tr class="hover:bg-slate-50/30 transition">
                  <td class="px-6 py-4 text-sm font-bold text-slate-500">{index + 1}</td>
                  <td class="px-6 py-4 text-sm font-bold text-slate-800">{opsi.opsi}</td>
                  <td class="px-6 py-4 text-xs text-slate-500 leading-relaxed">{opsi.keterangan || '—'}</td>
                  <td class="px-6 py-4 text-center">
                    <span class="inline-flex items-center justify-center min-w-[34px] px-2.5 py-1 bg-blue-600 text-white text-xs font-extrabold rounded-lg">
                      {opsi.poin}
                    </span>
                  </td>
                  <td class="px-6 py-4 text-right space-x-2 whitespace-nowrap">
                    <button
                      on:click={() => openEditOpsi(opsi)}
                      class="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition inline-flex items-center"
                      title="Ubah Opsi"
                    >
                      <Edit2 class="w-3.5 h-3.5" />
                    </button>
                    <button
                      on:click={() => deleteOpsi(opsi)}
                      class="p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition inline-flex items-center"
                      title="Hapus Opsi"
                    >
                      <Trash2 class="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>

        <div class="px-6 py-4 bg-slate-50/50 border-t border-slate-100">
          <p class="text-[11px] text-slate-500 font-medium leading-relaxed">
            Poin dihitung otomatis 1, 2, 3, ... berdasarkan urutan opsi dan tidak dapat diubah manual.
          </p>
        </div>
      {/if}
    </section>

    <!-- ==================== SECTION BAWAH: KELOLA INDIKATOR PERTANYAAN ==================== -->
    <section class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div class="p-5 md:p-6 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div class="flex items-start gap-3">
          <div class="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
            <MessageSquareText class="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h2 class="text-lg font-bold text-slate-900 tracking-tight">Kelola Indikator Pertanyaan</h2>
            <p class="text-xs text-slate-500 mt-1 leading-relaxed max-w-xl">
              Daftar pertanyaan observasi mengikuti kriteria yang dipilih pada dropdown di bawah.
            </p>
          </div>
        </div>

        <button
          on:click={openAddIndikator}
          disabled={!kriteriaAktif}
          class="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded-xl text-xs font-bold transition inline-flex items-center shadow-sm shadow-blue-200 whitespace-nowrap sm:shrink-0 w-fit"
        >
          <Plus class="w-4 h-4 mr-1.5" />
          <span>Tambah Indikator</span>
        </button>
      </div>

      <!-- Toolbar Filter Kriteria -->
      <div class="px-5 md:px-6 py-4 bg-slate-50/60 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center gap-3">
        <label for="filter-kriteria" class="text-[11px] font-extrabold uppercase tracking-widest text-slate-500 shrink-0">
          Pilih Kriteria Penilaian
        </label>
        <select
          id="filter-kriteria"
          bind:value={selectedKriteriaId}
          on:change={onKriteriaChange}
          disabled={kriteriaList.length === 0}
          class="w-full lg:w-auto lg:min-w-[340px] px-4 py-3 bg-white border border-slate-200 rounded-xl text-blue-700 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition cursor-pointer disabled:cursor-not-allowed disabled:bg-slate-100"
        >
          {#each kriteriaList as k (k.id)}
            <option value={k.id}>{k.inisial} — {k.nama}</option>
          {/each}
        </select>
        <span class="text-xs font-semibold text-slate-500 bg-white border border-slate-200 px-3 py-1.5 rounded-lg lg:ml-auto w-fit whitespace-nowrap">
          Total: {indikatorList.length} Indikator
        </span>
      </div>

      <div class="p-5 md:p-6">
        {#if kriteriaList.length === 0}
          <div class="flex flex-col items-center justify-center p-10 text-center border border-dashed border-slate-300 rounded-xl bg-slate-50/50">
            <AlertCircle class="w-8 h-8 text-amber-400 mb-3" />
            <p class="text-sm font-bold text-slate-700">Belum ada kriteria penilaian</p>
            <p class="text-xs text-slate-500 mt-1">
              Tambahkan kriteria terlebih dahulu pada menu
              <a href="/kriteria" class="text-blue-600 font-semibold underline">Data Kriteria & AHP</a>.
            </p>
          </div>
        {:else if indikatorList.length === 0}
          <div class="flex flex-col items-center justify-center p-10 text-center border border-dashed border-slate-300 rounded-xl bg-slate-50/50">
            <HelpCircle class="w-8 h-8 text-slate-300 mb-3" />
            <p class="text-sm font-bold text-slate-700">Belum ada indikator pada kriteria ini</p>
            <p class="text-xs text-slate-500 mt-1">Klik "Tambah Indikator" untuk membuat pertanyaan observasi pertama.</p>
          </div>
        {:else}
          <div class="space-y-3">
            {#each indikatorList as item, index (item.id)}
              <div class="flex flex-col gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 md:p-5 transition hover:border-blue-300 hover:bg-white hover:shadow-sm md:flex-row md:items-center md:justify-between">
                <div class="min-w-0 space-y-2">
                  <div class="flex flex-wrap items-center gap-2">
                    <span class="inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-100">
                      Pertanyaan #{index + 1}
                    </span>
                    <span class="inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-white text-slate-500 border border-slate-200">
                      {kriteriaAktif?.inisial}
                    </span>
                  </div>
                  <p class="text-sm font-medium text-slate-900 leading-relaxed break-words">{item.pertanyaan}</p>
                </div>

                <div class="flex items-center gap-2 shrink-0 self-end md:self-center">
                  <button
                    on:click={() => openEditIndikator(item)}
                    class="p-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-lg transition inline-flex items-center"
                    title="Ubah Pertanyaan"
                  >
                    <Edit2 class="w-3.5 h-3.5" />
                  </button>
                  <button
                    on:click={() => deleteIndikator(item)}
                    class="p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition inline-flex items-center"
                    title="Hapus Indikator"
                  >
                    <Trash2 class="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            {/each}
          </div>
        {/if}
      </div>
    </section>
  {/if}
</div>

<!-- Modal Tambah / Ubah Master Opsi Jawaban -->
{#if showOpsiModal}
  <div class="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm transition-all">
    <div class="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
      <div class="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <h3 class="text-lg font-bold text-slate-900">{isEditingOpsi ? 'Ubah Opsi Jawaban' : 'Tambah Opsi Jawaban'}</h3>
        <button
          on:click={closeOpsiModal}
          class="text-slate-400 hover:text-slate-600 transition p-1.5 rounded-lg hover:bg-white"
          aria-label="Tutup"
        >
          <X class="w-5 h-5" />
        </button>
      </div>

      <div class="p-6 space-y-5">
        <div>
          <label for="opsi" class="block text-[11px] font-extrabold uppercase tracking-widest text-slate-500 mb-2">Teks Opsi</label>
          <input
            id="opsi"
            type="text"
            bind:value={opsiText}
            placeholder="Contoh: Sesuai Harapan"
            class="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition shadow-sm"
          />
        </div>

        <div>
          <label for="keterangan" class="block text-[11px] font-extrabold uppercase tracking-widest text-slate-500 mb-2">Keterangan (Opsional)</label>
          <input
            id="keterangan"
            type="text"
            bind:value={keteranganText}
            placeholder="Contoh: Menunjukkan perkembangan sesuai tahapan usianya"
            class="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition shadow-sm"
          />
        </div>

        <div class="p-3.5 bg-blue-50 border border-blue-100 rounded-xl text-[11px] font-medium text-blue-800 leading-relaxed">
          Opsi ini berlaku untuk seluruh kriteria dan indikator. Poin dihitung otomatis berdasarkan urutan.
        </div>
      </div>

      <div class="px-6 py-5 bg-slate-50/50 flex items-center justify-end gap-3 border-t border-slate-100">
        <button on:click={closeOpsiModal} class="px-4 py-2.5 text-slate-600 hover:text-slate-800 text-xs font-bold transition">
          Batal
        </button>
        <button
          on:click={saveOpsi}
          disabled={saving}
          class="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white rounded-xl text-xs font-bold transition shadow-md shadow-blue-200 inline-flex items-center gap-2"
        >
          {#if saving}
            <Loader2 class="w-3.5 h-3.5 animate-spin" />
          {:else}
            <Save class="w-3.5 h-3.5" />
          {/if}
          <span>{isEditingOpsi ? 'Perbarui Opsi' : 'Simpan Opsi'}</span>
        </button>
      </div>
    </div>
  </div>
{/if}

<!-- Modal Tambah / Ubah Indikator -->
{#if showIndikatorModal}
  <div class="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm transition-all">
    <div class="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
      <div class="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <h3 class="text-lg font-bold text-slate-900">{isEditingIndikator ? 'Ubah Pertanyaan' : 'Tambah Indikator Baru'}</h3>
        <button
          on:click={closeIndikatorModal}
          class="text-slate-400 hover:text-slate-600 transition p-1.5 rounded-lg hover:bg-white"
          aria-label="Tutup"
        >
          <X class="w-5 h-5" />
        </button>
      </div>

      <div class="p-6 space-y-5">
        <div>
          <span class="block text-[11px] font-extrabold uppercase tracking-widest text-slate-500 mb-2">Kriteria Penilaian</span>
          <div class="w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 text-sm font-semibold cursor-not-allowed">
            {judulKriteria}
          </div>
        </div>

        <div>
          <label for="pertanyaan" class="block text-[11px] font-extrabold uppercase tracking-widest text-slate-500 mb-2">Teks Pertanyaan Observasi</label>
          <textarea
            id="pertanyaan"
            bind:value={pertanyaan}
            rows="3"
            placeholder="Contoh: Anak mampu mengenali dan menyebutkan simbol huruf/angka dasar."
            class="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition shadow-sm resize-none"
          ></textarea>
        </div>

        <div class="p-3.5 bg-blue-50 border border-blue-100 rounded-xl text-[11px] font-medium text-blue-800 leading-relaxed">
          Jawaban anak memakai <strong>Master Opsi Jawaban</strong> yang sudah diatur pada section atas, sehingga tidak perlu diatur ulang per pertanyaan.
        </div>
      </div>

      <div class="px-6 py-5 bg-slate-50/50 flex items-center justify-end gap-3 border-t border-slate-100">
        <button on:click={closeIndikatorModal} class="px-4 py-2.5 text-slate-600 hover:text-slate-800 text-xs font-bold transition">
          Batal
        </button>
        <button
          on:click={saveIndikator}
          disabled={saving}
          class="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white rounded-xl text-xs font-bold transition shadow-md shadow-blue-200 inline-flex items-center gap-2"
        >
          {#if saving}
            <Loader2 class="w-3.5 h-3.5 animate-spin" />
          {:else}
            <Save class="w-3.5 h-3.5" />
          {/if}
          <span>{isEditingIndikator ? 'Perbarui Pertanyaan' : 'Simpan Indikator'}</span>
        </button>
      </div>
    </div>
  </div>
{/if}
