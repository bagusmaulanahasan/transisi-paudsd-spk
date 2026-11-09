<script>
  import { supabase } from '$lib/db/supabase';
  import { aturPoinOpsi } from '$lib/domain/opsi';
  import { cachedFetch, peekMemoryCache, invalidateDataCache } from '$lib/db/cache';
  import { notifyError, notifySuccess } from '$lib/notifications';
  import { confirmAction } from '$lib/confirm';
  import PageHeader from '$lib/components/ui/PageHeader.svelte';
  import Card from '$lib/components/ui/Card.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import Modal from '$lib/components/ui/Modal.svelte';
  import LoadingState from '$lib/components/ui/LoadingState.svelte';
  import EmptyState from '$lib/components/ui/EmptyState.svelte';
  import Table from '$lib/components/ui/Table.svelte';
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
  const opsiAwal = peekMemoryCache('indikator:opsi');
  const kriteriaAwal = peekMemoryCache('indikator:kriteria');
  const kriteriaIdAwal = kriteriaAwal?.[0]?.id ?? null;
  const indikatorAwal = kriteriaIdAwal ? peekMemoryCache('indikator:list:' + kriteriaIdAwal) : null;

  let masterOpsi = opsiAwal || [];
  let showOpsiModal = false;
  let isEditingOpsi = false;
  let currentOpsiId = null;
  let opsiText = '';
  let keteranganText = '';

  // ==================== SECTION 2: INDIKATOR PERTANYAAN ====================
  let kriteriaList = kriteriaAwal || [];
  let selectedKriteriaId = kriteriaIdAwal;
  let indikatorList = indikatorAwal || [];
  let loading = !(opsiAwal && kriteriaAwal && indikatorAwal);
  let saving = false;

  // State modal indikator (tambah / ubah)
  let showIndikatorModal = false;
  let isEditingIndikator = false;
  let currentIndikatorId = null;
  let pertanyaan = '';

  onMount(async () => {
    await Promise.all([fetchMasterOpsi(), fetchKriteria()]);
    loading = false;
  });

  /**
   * Mengambil master opsi jawaban global (indikator_id NULL) yang berlaku untuk semua kriteria.
   */
  async function fetchMasterOpsi() {
    const data = await cachedFetch(
      'indikator:opsi',
      () => supabase
        .from('opsi_jawaban')
        .select('*')
        .order('poin', { ascending: true }),
      (opsiBaru) => { masterOpsi = opsiBaru; }
    );

    if (data) masterOpsi = data;
  }

  /**
   * Mengambil daftar kriteria lalu memuat indikator kriteria pertama.
   */
  async function fetchKriteria() {
    if (kriteriaList.length === 0) loading = true;

    const data = await cachedFetch(
      'indikator:kriteria',
      () => supabase.from('kriteria').select('*').order('urutan', { ascending: true }),
      (kriteriaBaru) => terapkanKriteria(kriteriaBaru)
    );

    if (data) terapkanKriteria(data);
    await fetchIndikator();
  }

  /**
   * Menyimpan daftar kriteria ke state dan memilih kriteria pertama bila belum ada pilihan.
   * @param {Array} kriteriaBaru
   */
  function terapkanKriteria(kriteriaBaru) {
    kriteriaList = kriteriaBaru;
    if (!selectedKriteriaId && kriteriaList.length > 0) {
      selectedKriteriaId = kriteriaList[0].id;
    }
  }

  /**
   * Mengambil indikator milik kriteria yang sedang dipilih.
   */
  async function fetchIndikator() {
    if (!selectedKriteriaId) {
      indikatorList = [];
      return;
    }

    const kriteriaId = selectedKriteriaId;

    const data = await cachedFetch(
      'indikator:list:' + kriteriaId,
      () => supabase
        .from('indikator')
        .select('*')
        .eq('kriteria_id', kriteriaId)
        .order('id', { ascending: true }),
      (indikatorBaru) => {
        if (selectedKriteriaId === kriteriaId) indikatorList = indikatorBaru;
      }
    );

    if (data) indikatorList = data;
  }

  /**
   * Menangani pergantian kriteria pada dropdown filter.
   */
  function onKriteriaChange() {
    indikatorList = peekMemoryCache('indikator:list:' + selectedKriteriaId) || [];
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
      notifyError('Teks opsi wajib diisi.');
      return;
    }

    saving = true;

    if (isEditingOpsi) {
      const { error } = await supabase
        .from('opsi_jawaban')
        .update({ opsi: opsiText.trim(), keterangan: keteranganText.trim() || null })
        .eq('id', currentOpsiId);
      if (error) {
        notifyError(error.message);
      } else {
        notifySuccess('Berhasil memperbarui opsi jawaban.');
      }
    } else {
      const { error } = await supabase.from('opsi_jawaban').insert({
        opsi: opsiText.trim(),
        keterangan: keteranganText.trim() || null,
        poin: masterOpsi.length + 1
      });
      if (error) {
        notifyError(error.message);
      } else {
        notifySuccess('Berhasil menambah opsi jawaban baru.');
      }
    }

    await invalidateDataCache();
    await fetchMasterOpsi();
    saving = false;
    closeOpsiModal();
  }

  /**
   * Menghapus master opsi lalu menyinkronkan ulang poin menjadi 1..n berurutan.
   */
  async function deleteOpsi(opsi) {
    const confirmed = await confirmAction({
      title: `Hapus opsi "${opsi.opsi}"?`,
      message: 'Opsi ini berlaku untuk semua kriteria dan penilaian anak yang memakainya ikut terhapus.'
    });

    if (!confirmed) return;

    const { error } = await supabase.from('opsi_jawaban').delete().eq('id', opsi.id);
    if (error) {
      notifyError(error.message);
      return;
    }

    notifySuccess('Berhasil menghapus opsi jawaban.');
    await invalidateDataCache();
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
      notifyError('Teks pertanyaan wajib diisi.');
      return;
    }

    saving = true;

    if (isEditingIndikator) {
      const { error } = await supabase
        .from('indikator')
        .update({ pertanyaan: pertanyaan.trim() })
        .eq('id', currentIndikatorId);
      if (error) {
        notifyError(error.message);
      } else {
        notifySuccess('Berhasil memperbarui indikator.');
      }
    } else {
      const { error } = await supabase
        .from('indikator')
        .insert({ kriteria_id: selectedKriteriaId, pertanyaan: pertanyaan.trim() });
      if (error) {
        notifyError(error.message);
      } else {
        notifySuccess('Berhasil menambah indikator baru.');
      }
    }

    await invalidateDataCache();
    await fetchIndikator();
    saving = false;
    closeIndikatorModal();
  }

  /**
   * Menghapus indikator beserta penilaian anak terkait (ikut terhapus via cascade).
   */
  async function deleteIndikator(item) {
    const confirmed = await confirmAction({
      title: `Hapus indikator "${item.pertanyaan.slice(0, 40)}..."?`,
      message: 'Data penilaian anak pada indikator ini ikut terhapus.'
    });

    if (!confirmed) return;

    const { error } = await supabase.from('indikator').delete().eq('id', item.id);
    if (error) {
      notifyError(error.message);
      return;
    }

    notifySuccess('Berhasil menghapus indikator.');
    await invalidateDataCache();
    await fetchIndikator();
  }

  $: kriteriaAktif = kriteriaList.find((k) => k.id === selectedKriteriaId) || null;
  $: judulKriteria = kriteriaAktif ? `${kriteriaAktif.inisial} - ${kriteriaAktif.nama}` : '';
</script>

<svelte:head>
  <title>Indikator Pertanyaan - SPK Transisi PAUD-SD</title>
</svelte:head>

<div class="space-y-8">
<PageHeader 
    title="Kelola Opsi Jawaban & Indikator Pertanyaan" 
    subtitle="Atur skala jawaban baku untuk semua kriteria, lalu susun pertanyaan observasi per kriteria."
  />

  {#if loading}
    <LoadingState text="Sinkronisasi data database..." />
  {:else}
    <!-- ==================== SECTION ATAS: MASTER OPSI JAWABAN ==================== -->
    <Card className="overflow-hidden">
      <div class="p-5 md:p-6 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4 -mx-6 -mt-6 mb-6">
        <div class="flex items-center gap-3">
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
          <Button on:click={openAddOpsi}>
            <Plus class="w-4 h-4 mr-1.5" />
            <span>Tambah Opsi</span>
          </Button>
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
          <Table
            columns={[
              { key: 'no', label: 'No.', class: 'w-20' },
              { key: 'opsi', label: 'Teks Opsi' },
              { key: 'keterangan', label: 'Keterangan' },
              { key: 'poin', label: 'Poin (Otomatis)', class: 'text-center whitespace-nowrap' },
              { key: 'aksi', label: 'Aksi', class: 'text-right w-32' }
            ]}
            data={masterOpsi.map((o, i) => ({ ...o, no: i + 1 }))}
          >
            <svelte:fragment slot="cell" let:item let:col>
              {#if col.key === 'no'}
                <span class="text-sm font-bold text-slate-500">{item.no}</span>
              {:else if col.key === 'opsi'}
                <span class="text-sm font-bold text-slate-800">{item.opsi}</span>
              {:else if col.key === 'keterangan'}
                <span class="text-xs text-slate-500 leading-relaxed">{item.keterangan || '—'}</span>
              {:else if col.key === 'poin'}
                <span class="inline-flex items-center justify-center min-w-[34px] px-2.5 py-1 bg-blue-600 text-white text-xs font-extrabold rounded-lg">
                  {item.poin}
                </span>
              {:else if col.key === 'aksi'}
                <div class="space-x-2 whitespace-nowrap">
                  <Button variant="ghost" className="p-2" title="Ubah Opsi" on:click={() => openEditOpsi(item)}>
                    <Edit2 class="w-3.5 h-3.5" />
                  </Button>
                  <Button variant="danger" className="p-2 bg-rose-50 text-rose-600 hover:bg-rose-100 shadow-none border-none" title="Hapus Opsi" on:click={() => deleteOpsi(item)}>
                    <Trash2 class="w-3.5 h-3.5" />
                  </Button>
                </div>
              {:else}
                {item[col.key] !== undefined && item[col.key] !== null ? item[col.key] : '-'}
              {/if}
            </svelte:fragment>
          </Table>
        </div>

        <div class="px-6 py-4 bg-slate-50/50 border-t border-slate-100 -mx-6 -mb-6 mt-6">
          <p class="text-[11px] text-slate-500 font-medium leading-relaxed">
            Poin dihitung otomatis 1, 2, 3, ... berdasarkan urutan opsi dan tidak dapat diubah manual.
          </p>
        </div>
      {/if}
    </Card>

    <!-- ==================== SECTION BAWAH: KELOLA INDIKATOR PERTANYAAN ==================== -->
    <Card className="overflow-hidden">
      <div class="p-5 md:p-6 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4 -mx-6 -mt-6 mb-6">
        <div class="flex items-center gap-3">
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

        <Button
          on:click={openAddIndikator}
          disabled={!kriteriaAktif}
        >
          <Plus class="w-4 h-4 mr-1.5" />
          <span>Tambah Indikator</span>
        </Button>
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
                  <Button variant="ghost" className="p-2 bg-white border border-slate-200" title="Ubah Pertanyaan" on:click={() => openEditIndikator(item)}>
                    <Edit2 class="w-3.5 h-3.5" />
                  </Button>
                  <Button variant="danger" className="p-2 bg-rose-50 text-rose-600 hover:bg-rose-100 shadow-none border-none" title="Hapus Indikator" on:click={() => deleteIndikator(item)}>
                    <Trash2 class="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            {/each}
          </div>
        {/if}
      </div>
    </Card>
  {/if}
</div>

<!-- Modal Tambah / Ubah Master Opsi Jawaban -->
<Modal
  isOpen={showOpsiModal}
  title={isEditingOpsi ? 'Ubah Opsi Jawaban' : 'Tambah Opsi Jawaban'}
  on:close={closeOpsiModal}
  maxWidth="max-w-md"
>
  <div class="space-y-5">
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

  <div slot="footer">
    <Button variant="ghost" on:click={closeOpsiModal}>
      Batal
    </Button>
    <Button
      on:click={saveOpsi}
      disabled={saving}
      loading={saving}
    >
      {#if !saving}
        <Save class="w-3.5 h-3.5 mr-2" />
      {/if}
      <span>{isEditingOpsi ? 'Perbarui Opsi' : 'Simpan Opsi'}</span>
    </Button>
  </div>
</Modal>

<!-- Modal Tambah / Ubah Indikator -->
<Modal
  isOpen={showIndikatorModal}
  title={isEditingIndikator ? 'Ubah Pertanyaan' : 'Tambah Indikator Baru'}
  on:close={closeIndikatorModal}
  maxWidth="max-w-lg"
>

    <div class="space-y-5">
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

    <div slot="footer">
      <Button variant="ghost" on:click={closeIndikatorModal}>
        Batal
      </Button>
      <Button
        on:click={saveIndikator}
        disabled={saving}
        loading={saving}
      >
        {#if !saving}
          <Save class="w-3.5 h-3.5 mr-2" />
        {/if}
        <span>{isEditingIndikator ? 'Perbarui Pertanyaan' : 'Simpan Indikator'}</span>
      </Button>
    </div>
</Modal>
