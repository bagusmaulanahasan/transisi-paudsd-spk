<script>
  import { supabase } from '$lib/db/supabase';
  import { onMount } from 'svelte';
  import { fetchKelasDenganJumlahAnak } from '$lib/services/kelas';
  import { peekMemoryCache, invalidateDataCache } from '$lib/db/cache';
  import { getTahunAjaranBerjalan } from '$lib/dateUtils';
  import { notifyError, notifySuccess } from '$lib/notifications';
  import { confirmAction } from '$lib/confirm';
  import PageHeader from '$lib/components/ui/PageHeader.svelte';
  import LoadingState from '$lib/components/ui/LoadingState.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import { Plus } from 'lucide-svelte';
  import { userProfile } from '$lib/stores/user';
  import KelasListCard from './KelasListCard.svelte';
  import KelasModal from './KelasModal.svelte';

  const CACHE_KELAS = 'kelas-list';

  // Hanya Kepala Sekolah yang boleh menambah, mengubah, dan menghapus kelas.
  $: bolehKelola = $userProfile?.role === 'kepsek';

  // Data cache dipakai lebih dulu agar daftar kelas tampil seketika.
  const dataAwal = peekMemoryCache(CACHE_KELAS);

  // ==================== STATE DAFTAR KELAS ====================
  let kelasList = dataAwal?.kelas ?? [];
  let jumlahAnakMap = dataAwal?.jumlahAnak ?? {};
  let loading = dataAwal === null;
  let saving = false;

  let tahunList = [];
  let selectedTahun = '';

  if (dataAwal) terapkanKelas(dataAwal);

  // ==================== STATE MODAL KELAS ====================
  let showModal = false;
  let isEditing = false;
  let currentId = null;
  let namaKelas = '';
  let tahunAjaran = '';

  /**
   * Menentukan tahun ajaran berjalan (dimulai bulan Juli) sebagai nilai awal form.
   */
  // Diganti oleh getTahunAjaranBerjalan dari dateUtils
  // function tahunAjaranSekarang() { ... }

  onMount(async () => {
    const data = await fetchKelasDenganJumlahAnak(terapkanKelas);
    if (data) terapkanKelas(data);
    loading = false;
  });

  /**
   * Menyimpan hasil pengambilan data ke state halaman.
   * @param {{ kelas: Array, jumlahAnak: Object }} data
   */
  function terapkanKelas(data) {
    kelasList = data.kelas;
    jumlahAnakMap = data.jumlahAnak;

    // Ambil daftar tahun ajaran unik, urutkan descending (terbaru di atas)
    const setTahun = new Set((data.kelas || []).map(k => k.tahun_ajaran).filter(Boolean));
    tahunList = Array.from(setTahun).sort().reverse();

    if (tahunList.length > 0 && (!selectedTahun || !tahunList.includes(selectedTahun))) {
      const berjalan = getTahunAjaranBerjalan();
      if (tahunList.includes(berjalan)) {
        selectedTahun = berjalan;
      } else {
        selectedTahun = tahunList[0]; // Fallback ke tahun ajaran terbaru
      }
    }
  }

  // Kelas yang difilter berdasarkan tahun ajaran terpilih
  $: filteredKelas = selectedTahun
    ? kelasList.filter(k => k.tahun_ajaran === selectedTahun)
    : kelasList;

  /**
   * Memuat ulang daftar kelas dari server setelah data berubah.
   */
  async function fetchKelas() {
    await invalidateDataCache();
    if (kelasList.length === 0) loading = true;

    const data = await fetchKelasDenganJumlahAnak(terapkanKelas);
    if (data) terapkanKelas(data);
    loading = false;
  }

  /**
   * Membuka modal tambah kelas dengan isian awal kosong.
   */
  function openAddModal() {
    isEditing = false;
    currentId = null;
    namaKelas = '';
    tahunAjaran = getTahunAjaranBerjalan();
    showModal = true;
  }

  /**
   * Membuka modal ubah kelas dengan data kelas yang dipilih.
   */
  function openEditModal(item) {
    isEditing = true;
    currentId = item.id;
    namaKelas = item.nama_kelas;
    tahunAjaran = item.tahun_ajaran;
    showModal = true;
  }

  /**
   * Menutup modal kelas tanpa menyimpan perubahan.
   */
  function closeModal() {
    showModal = false;
  }

  /**
   * Menyimpan kelas baru atau perubahan kelas ke Supabase.
   */
  async function saveKelas() {
    if (!namaKelas.trim()) {
      notifyError('Nama kelas wajib diisi.');
      return;
    }
    if (!tahunAjaran.trim()) {
      notifyError('Tahun ajaran wajib diisi.');
      return;
    }

    saving = true;
    const payload = {
      nama_kelas: namaKelas.trim(),
      tahun_ajaran: tahunAjaran.trim()
    };

    if (isEditing) {
      const { error } = await supabase.from('kelas').update(payload).eq('id', currentId);
      if (error) {
        notifyError(error.message);
        saving = false;
        return;
      }
      notifySuccess('Berhasil memperbarui kelas.');
    } else {
      const { error } = await supabase.from('kelas').insert(payload);
      if (error) {
        notifyError(error.message);
        saving = false;
        return;
      }
      notifySuccess('Berhasil menambah kelas baru.');
    }

    await fetchKelas();
    saving = false;
    closeModal();
  }

  /**
   * Menghapus kelas beserta seluruh data anak dan penilaian di dalamnya.
   */
  async function deleteKelas(item) {
    const jumlahAnak = jumlahAnakMap[item.id] || 0;
    const confirmMessage =
      jumlahAnak > 0
        ? `${jumlahAnak} data anak beserta penilaiannya ikut terhapus dan tidak bisa dikembalikan.`
        : 'Data kelas akan dihapus permanen.';

    const confirmed = await confirmAction({
      title: `Hapus kelas "${item.nama_kelas}"?`,
      message: confirmMessage
    });

    if (!confirmed) return;

    const { error } = await supabase.from('kelas').delete().eq('id', item.id);
    if (error) {
      notifyError(error.message);
      return;
    }

    notifySuccess('Berhasil menghapus kelas.');
    await fetchKelas();
  }
</script>

<svelte:head>
  <title>Kelas & Anak - SPK Transisi PAUD-SD</title>
</svelte:head>

<div class="space-y-8">
  <PageHeader
    title="Kelola Kelas & Data Anak"
    subtitle="Buat kelas terlebih dahulu, lalu tambahkan data anak di dalamnya sebagai alternatif yang dinilai pada perhitungan MOORA."
  >
  </PageHeader>

  {#if loading}
    <LoadingState text="Sinkronisasi data kelas..." />
  {:else}
    <!-- Tabel Daftar Kelas -->
    <KelasListCard
      kelasList={filteredKelas}
      {jumlahAnakMap}
      {bolehKelola}
      {tahunList}
      bind:selectedTahun
      {openAddModal}
      {openEditModal}
      {deleteKelas}
    />
  {/if}
</div>

<KelasModal
  bind:isOpen={showModal}
  {isEditing}
  bind:namaKelas
  bind:tahunAjaran
  {saving}
  on:close={closeModal}
  on:save={saveKelas}
/>
