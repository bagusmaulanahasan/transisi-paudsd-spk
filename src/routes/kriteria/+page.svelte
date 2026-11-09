<script>
  import { supabase } from '$lib/db/supabase';
  import { calculateAHP } from '$lib/spk/ahp';
  import { cachedFetch, peekMemoryCache, invalidateDataCache } from '$lib/db/cache';
  import { notifyError, notifySuccess } from '$lib/notifications';
  import { confirmAction } from '$lib/confirm';
  import PageHeader from '$lib/components/ui/PageHeader.svelte';
  import LoadingState from '$lib/components/ui/LoadingState.svelte';
  import KriteriaListCard from './KriteriaListCard.svelte';
  import AhpMatrixCard from './AhpMatrixCard.svelte';
  import KriteriaModal from './KriteriaModal.svelte';
  import { onMount } from 'svelte';

  const CACHE_KRITERIA = 'kriteria';

  // Pakai cache memori bila ada agar halaman langsung tampil tanpa loading.
  const dataAwal = peekMemoryCache(CACHE_KRITERIA);

  let kriteriaList = dataAwal?.kriteria ?? [];
  let loading = dataAwal === null;
  let saving = false;

  let showModal = false;
  let isEditing = false;
  let currentId = null;
  let namaKriteria = '';
  let jenisKriteria = 'benefit';
  let modeEditMatriks = false;

  // Matriks perbandingan berpasangan
  let pairwiseMatrix = [];
  let ahpResult = {
    weights: [],
    lambdaMax: 0,
    ci: 0,
    cr: 0,
    isConsistent: false
  };

  if (dataAwal) terapkanKriteria(dataAwal);

  onMount(async () => {
    const data = await cachedFetch(CACHE_KRITERIA, ambilKriteria, terapkanKriteria);
    if (data) terapkanKriteria(data);
    loading = false;
  });

  /**
   * Mengambil data kriteria dan matriks perbandingan AHP sekaligus.
   */
  async function ambilKriteria() {
    const [kriteriaRes, ahpRes] = await Promise.all([
      supabase.from('kriteria').select('*').order('urutan', { ascending: true }),
      supabase.from('perbandingan_ahp').select('*')
    ]);

    if (kriteriaRes.error) throw kriteriaRes.error;
    if (ahpRes.error) throw ahpRes.error;

    return {
      kriteria: kriteriaRes.data || [],
      perbandingan: ahpRes.data || []
    };
  }

  /**
   * Menyusun matriks perbandingan dari data tersimpan lalu menghitung bobot AHP.
   * @param {{ kriteria: Array, perbandingan: Array }} data
   */
  function terapkanKriteria(data) {
    kriteriaList = data.kriteria;

    const n = kriteriaList.length;
    // Inisialisasi matriks identitas n x n
    const matrix = Array.from({ length: n }, () => Array(n).fill(1.0));

    for (const item of data.perbandingan) {
      const idx1 = kriteriaList.findIndex((k) => k.id === item.kriteria_1_id);
      const idx2 = kriteriaList.findIndex((k) => k.id === item.kriteria_2_id);
      if (idx1 !== -1 && idx2 !== -1) {
        matrix[idx1][idx2] = parseFloat(item.nilai);
      }
    }

    pairwiseMatrix = matrix;
    recalculateAHP();
  }

  /**
   * Memuat ulang data kriteria dari server setelah ada perubahan.
   */
  async function fetchKriteria() {
    await invalidateDataCache();
    if (kriteriaList.length === 0) loading = true;

    const data = await cachedFetch(CACHE_KRITERIA, ambilKriteria, terapkanKriteria);
    if (data) terapkanKriteria(data);
    loading = false;
  }

  let matriksSebelumEdit = null;

  /**
   * Menjalankan kalkulasi AHP secara lokal.
   */
  function recalculateAHP() {
    if (pairwiseMatrix.length > 0) {
      ahpResult = calculateAHP(pairwiseMatrix);
    }
  }

  /**
   * Menyimpan nilai sel matriks dan pasangannya (1/nilai), lalu menghitung ulang AHP.
   * @param {number} i
   * @param {number} j
   * @param {string} nilaiBaru
   */
  function ubahNilaiMatriks(i, j, nilaiBaru) {
    const nilai = Number(nilaiBaru);
    const matriks = pairwiseMatrix.map((row) => [...row]);
    matriks[i][j] = nilai;
    matriks[j][i] = parseFloat((1 / nilai).toFixed(3));
    pairwiseMatrix = matriks;
    recalculateAHP();
  }

  function mulaiEditMatriks() {
    matriksSebelumEdit = pairwiseMatrix.map((row) => [...row]);
    modeEditMatriks = true;
  }

  function batalkanEditMatriks() {
    if (matriksSebelumEdit) {
      pairwiseMatrix = matriksSebelumEdit.map((row) => [...row]);
    }
    recalculateAHP();
    modeEditMatriks = false;
  }

  function openAddModal() {
    isEditing = false;
    currentId = null;
    namaKriteria = '';
    jenisKriteria = 'benefit';
    showModal = true;
  }

  function openEditModal(item) {
    isEditing = true;
    currentId = item.id;
    namaKriteria = item.nama;
    jenisKriteria = item.jenis;
    showModal = true;
  }

  function closeModal() {
    showModal = false;
  }

  /**
   * Menyimpan kriteria ke Supabase.
   */
  async function saveKriteria() {
    if (!namaKriteria.trim()) return;
    saving = true;

    if (isEditing) {
      const { error } = await supabase
        .from('kriteria')
        .update({ nama: namaKriteria, jenis: jenisKriteria })
        .eq('id', currentId);
      if (error) {
        notifyError(error.message);
      } else {
        notifySuccess('Berhasil memperbarui kriteria.');
      }
    } else {
      const urutan = kriteriaList.length + 1;
      const inisial = `C${urutan}`;
      const { error } = await supabase
        .from('kriteria')
        .insert([{ inisial, nama: namaKriteria, jenis: jenisKriteria, urutan }]);
      if (error) {
        notifyError(error.message);
      } else {
        notifySuccess('Berhasil menambah kriteria baru.');
      }
    }

    await fetchKriteria();
    saving = false;
    closeModal();
  }

  /**
   * Menghapus kriteria dan melakukan re-index urutan serta inisial.
   */
  async function deleteKriteria(id) {
    if (kriteriaList.length <= 2) {
      notifyError('Minimal harus ada 2 kriteria.');
      return;
    }

    const confirmed = await confirmAction({
      title: 'Hapus kriteria ini?',
      message: 'Data perbandingan AHP terkait akan ikut terpengaruh.'
    });

    if (!confirmed) return;

    const { error: delError } = await supabase.from('kriteria').delete().eq('id', id);
    if (delError) {
      notifyError(delError.message);
      return;
    }

    notifySuccess('Berhasil menghapus kriteria.');

    // Ambil data terbaru untuk re-index urutan & inisial
    const { data } = await supabase.from('kriteria').select('*').order('urutan', { ascending: true });
    
    // Update urutan dan inisial agar tetap konsisten C1, C2, dst
    for (let i = 0; i < data.length; i++) {
      const newUrutan = i + 1;
      const newInisial = `C${newUrutan}`;
      await supabase.from('kriteria').update({ urutan: newUrutan, inisial: newInisial }).eq('id', data[i].id);
    }

    await fetchKriteria();
  }

  /**
   * Menyimpan seluruh nilai matriks perbandingan ke database.
   */
  async function saveAHPToDB() {
    saving = true;
    const records = [];
    
    for (let i = 0; i < kriteriaList.length; i++) {
      for (let j = 0; j < kriteriaList.length; j++) {
        records.push({
          kriteria_1_id: kriteriaList[i].id,
          kriteria_2_id: kriteriaList[j].id,
          nilai: pairwiseMatrix[i][j]
        });
      }
    }

    // Gunakan upsert dengan memanfaatkan constraint unik (jika ada) atau hapus dulu baru insert
    // Untuk kesederhanaan di awal: hapus semua perbandingan lalu insert baru
    await supabase.from('perbandingan_ahp').delete().filter('kriteria_1_id', 'in', `(${kriteriaList.map(k => k.id).join(',')})`);
    
    const { error } = await supabase.from('perbandingan_ahp').insert(records);
    if (error) {
      notifyError('Gagal menyimpan matriks: ' + error.message);
    } else {
      // Hapus cache data agar halaman penilaian memakai bobot terbaru.
      await invalidateDataCache();
      modeEditMatriks = false;
      notifySuccess('Matriks perbandingan dan bobot berhasil disimpan.');
    }
    saving = false;
  }

  $: nextInisial = `C${kriteriaList.length + 1}`;
  $: inisialAktif = isEditing
    ? kriteriaList.find((k) => k.id === currentId)?.inisial ?? ''
    : nextInisial;
</script>

<svelte:head>
  <title>Kriteria & AHP - SPK Transisi PAUD-SD</title>
</svelte:head>

<div class="space-y-8">
<PageHeader 
    title="Kelola Kriteria & Pembobotan AHP" 
    subtitle="Tentukan kriteria penilaian anak beserta bobot prioritas menggunakan perbandingan berpasangan AHP."
  />

  {#if loading}
    <LoadingState text="Sinkronisasi data database..." />
  {:else}
    <!-- Table Kriteria -->
    <KriteriaListCard
      {kriteriaList}
      {ahpResult}
      {openAddModal}
      {openEditModal}
      {deleteKriteria}
    />

    <!-- AHP Matrix Section -->
    <AhpMatrixCard
      {kriteriaList}
      {pairwiseMatrix}
      {ahpResult}
      {modeEditMatriks}
      {saving}
      onStartEdit={mulaiEditMatriks}
      onCancelEdit={batalkanEditMatriks}
      onSave={saveAHPToDB}
      onNilaiChange={ubahNilaiMatriks}
    />
  {/if}
</div>

<!-- Modal Tambah / Edit Kriteria -->
<KriteriaModal
  bind:isOpen={showModal}
  {isEditing}
  bind:namaKriteria
  bind:jenisKriteria
  {saving}
  inisial={inisialAktif}
  on:close={closeModal}
  on:save={saveKriteria}
/>
