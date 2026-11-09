<script>
  import { supabase } from '$lib/db/supabase';
  import { aturPoinOpsi } from '$lib/domain/opsi';
  import { cachedFetch, peekMemoryCache, invalidateDataCache } from '$lib/db/cache';
  import { notifyError, notifySuccess } from '$lib/notifications';
  import { confirmAction } from '$lib/confirm';
  import PageHeader from '$lib/components/ui/PageHeader.svelte';
  import MasterOpsiCard from './MasterOpsiCard.svelte';
  import IndikatorListCard from './IndikatorListCard.svelte';
  import OpsiModal from './OpsiModal.svelte';
  import IndikatorModal from './IndikatorModal.svelte';
  import LoadingState from '$lib/components/ui/LoadingState.svelte';
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
   * Nilai dari elemen select berupa string, sedangkan kriteria.id berupa angka.
   * @param {string} nilaiBaru
   */
  function onKriteriaChange(nilaiBaru) {
    const kriteriaId = Number(nilaiBaru);

    if (Number.isNaN(kriteriaId)) return;
    if (!kriteriaList.some((k) => k.id === kriteriaId)) return;

    selectedKriteriaId = kriteriaId;
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
    <MasterOpsiCard 
      {masterOpsi}
      {openAddOpsi}
      {openEditOpsi}
      {deleteOpsi}
    />

    <!-- ==================== SECTION BAWAH: KELOLA INDIKATOR PERTANYAAN ==================== -->
    <IndikatorListCard
      {kriteriaList}
      {selectedKriteriaId}
      {indikatorList}
      {kriteriaAktif}
      {onKriteriaChange}
      {openAddIndikator}
      {openEditIndikator}
      {deleteIndikator}
    />
  {/if}
</div>

<!-- Modal Tambah / Ubah Master Opsi Jawaban -->
<OpsiModal
  isOpen={showOpsiModal}
  isEditing={isEditingOpsi}
  bind:opsiText={opsiText}
  bind:keteranganText={keteranganText}
  {saving}
  on:close={closeOpsiModal}
  on:save={saveOpsi}
/>

<!-- Modal Tambah / Ubah Indikator -->
<IndikatorModal
  isOpen={showIndikatorModal}
  isEditing={isEditingIndikator}
  bind:pertanyaan={pertanyaan}
  {judulKriteria}
  {saving}
  on:close={closeIndikatorModal}
  on:save={saveIndikator}
/>

