<script>
  import { supabase } from '$lib/db/supabase';
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  import { apakahNisDuplikat, normalisasiNis } from '$lib/domain/anak';
  import { cachedFetch, peekMemoryCache, invalidateDataCache } from '$lib/db/cache';
  import { notifyError, notifySuccess } from '$lib/notifications';
  import { confirmAction } from '$lib/confirm';
  import PageHeader from '$lib/components/ui/PageHeader.svelte';
  import LoadingState from '$lib/components/ui/LoadingState.svelte';
  import Card from '$lib/components/ui/Card.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import AnakListCard from './AnakListCard.svelte';
  import AnakModal from './AnakModal.svelte';
  import { ArrowLeft, Plus, AlertCircle } from 'lucide-svelte';

  // ID kelas diambil dari URL, misalnya /kelas/3.
  const kelasId = Number($page.params.id);
  const CACHE_KEY = 'kelas-detail:' + kelasId;

  // Data cache dipakai lebih dulu agar halaman tidak menunggu server saat dibuka ulang.
  const dataAwal = peekMemoryCache(CACHE_KEY);

  // ==================== STATE KELAS & ANAK ====================
  let kelas = dataAwal?.kelas ?? null;
  let anakList = dataAwal?.anak ?? [];
  let loading = dataAwal === null;
  let notFound = false;
  let saving = false;

  if (dataAwal) terapkanDetail(dataAwal);

  // ==================== STATE MODAL ANAK ====================
  let showModal = false;
  let isEditing = false;
  let currentId = null;
  let namaAnak = '';
  let nisAnak = '';

  onMount(async () => {
    const data = await cachedFetch(CACHE_KEY, ambilDetail, terapkanDetail);
    if (data) terapkanDetail(data);
    else if (!kelas) notFound = true;
    loading = false;
  });

  /**
   * Mengambil data kelas dan seluruh anaknya dalam satu permintaan paralel.
   */
  async function ambilDetail() {
    const [kelasRes, anakRes] = await Promise.all([
      supabase.from('kelas').select('*').eq('id', kelasId).single(),
      supabase
        .from('anak')
        .select('*')
        .eq('kelas_id', kelasId)
        .order('nama', { ascending: true })
    ]);

    if (kelasRes.error) throw kelasRes.error;
    if (anakRes.error) throw anakRes.error;

    return { kelas: kelasRes.data, anak: anakRes.data || [] };
  }

  /**
   * Menyimpan data kelas dan anak ke state halaman.
   * @param {{ kelas: Object|null, anak: Array }} data
   */
  function terapkanDetail(data) {
    if (!data.kelas) {
      notFound = true;
      kelas = null;
      anakList = [];
      return;
    }

    notFound = false;
    kelas = data.kelas;
    anakList = data.anak;
  }

  /**
   * Memuat ulang data kelas dan anak dari server setelah ada perubahan.
   */
  async function fetchDetail() {
    await invalidateDataCache();
    if (!kelas) loading = true;

    const data = await cachedFetch(CACHE_KEY, ambilDetail, terapkanDetail);
    if (data) terapkanDetail(data);
    loading = false;
  }

  /**
   * Membuka modal tambah anak dengan isian awal kosong.
   */
  function openAddModal() {
    isEditing = false;
    currentId = null;
    namaAnak = '';
    nisAnak = '';
    showModal = true;
  }

  /**
   * Membuka modal ubah anak, termasuk untuk mengisi NIS yang sebelumnya kosong.
   */
  function openEditModal(item) {
    isEditing = true;
    currentId = item.id;
    namaAnak = item.nama;
    nisAnak = item.nis || '';
    showModal = true;
  }

  /**
   * Menutup modal anak tanpa menyimpan perubahan.
   */
  function closeModal() {
    showModal = false;
  }

  /**
   * Menyimpan anak baru atau perubahan data anak ke Supabase.
   * NIS boleh kosong; bila diisi, NIS harus unik di dalam kelas ini.
   */
  async function saveAnak() {
    if (!namaAnak.trim()) {
      notifyError('Nama lengkap anak wajib diisi.');
      return;
    }

    const nis = normalisasiNis(nisAnak);
    const idYangDiubah = isEditing ? currentId : null;

    if (apakahNisDuplikat(anakList, nis, idYangDiubah)) {
      notifyError('NIS tersebut sudah dipakai anak lain di kelas ini.');
      return;
    }

    saving = true;
    const payload = {
      kelas_id: kelasId,
      nama: namaAnak.trim(),
      nis
    };

    if (isEditing) {
      const { error } = await supabase.from('anak').update(payload).eq('id', currentId);
      if (error) {
        notifyError(error.code === '23505' ? 'NIS tersebut sudah dipakai anak lain di kelas ini.' : error.message);
        saving = false;
        return;
      }
      notifySuccess('Berhasil memperbarui data anak.');
    } else {
      const { error } = await supabase.from('anak').insert(payload);
      if (error) {
        notifyError(error.code === '23505' ? 'NIS tersebut sudah dipakai anak lain di kelas ini.' : error.message);
        saving = false;
        return;
      }
      notifySuccess('Berhasil menambah anak baru.');
    }

    await fetchDetail();
    saving = false;
    closeModal();
  }

  /**
   * Menghapus data anak beserta seluruh penilaian yang terkait.
   */
  async function deleteAnak(item) {
    const confirmed = await confirmAction({
      title: `Hapus data anak "${item.nama}"?`,
      message: 'Seluruh penilaian anak ini ikut terhapus dan tidak bisa dikembalikan.'
    });

    if (!confirmed) return;

    const { error } = await supabase.from('anak').delete().eq('id', item.id);
    if (error) {
      notifyError(error.message);
      return;
    }

    notifySuccess('Berhasil menghapus data anak.');
    await fetchDetail();
  }
</script>

<svelte:head>
  <title>{kelas ? `${kelas.nama_kelas} - SPK Transisi PAUD-SD` : 'Detail Kelas - SPK Transisi PAUD-SD'}</title>
</svelte:head>

<div class="space-y-8">
  <!-- Tautan Kembali -->
  <a
    href="/kelas"
    class="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-blue-600 transition w-fit"
  >
    <ArrowLeft class="w-3.5 h-3.5" />
    <span>Kembali ke Daftar Kelas</span>
  </a>

  {#if loading}
    <LoadingState text="Sinkronisasi data kelas..." />
  {:else if notFound}
    <Card className="p-10 text-center">
      <AlertCircle class="w-10 h-10 text-amber-400 mx-auto mb-3" />
      <p class="text-base font-bold text-slate-800">Kelas tidak ditemukan</p>
      <p class="text-xs text-slate-500 mt-1 mb-5">Kelas mungkin sudah dihapus atau tautannya tidak valid.</p>
      <a
        href="/kelas"
        class="inline-flex items-center px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition shadow-sm shadow-blue-200"
      >
        <ArrowLeft class="w-4 h-4 mr-1.5" />
        <span>Kembali ke Daftar Kelas</span>
      </a>
    </Card>
  {:else}
    <!-- Header Halaman -->
    <PageHeader
      title={kelas.nama_kelas}
      subtitle={`Tahun Ajaran ${kelas.tahun_ajaran} • ${anakList.length} anak terdaftar`}
    >
      <div slot="action">
        <Button on:click={openAddModal}>
          <Plus class="w-4 h-4 mr-1.5" />
          <span>Tambah Data Anak</span>
        </Button>
      </div>
    </PageHeader>

    <AnakListCard
      {anakList}
      {openAddModal}
      {openEditModal}
      {deleteAnak}
    />
  {/if}
</div>

<!-- Modal Tambah / Ubah Data Anak -->
<AnakModal
  bind:isOpen={showModal}
  {isEditing}
  namaKelas={kelas?.nama_kelas ?? ''}
  tahunAjaran={kelas?.tahun_ajaran ?? ''}
  bind:namaAnak
  bind:nisAnak
  {saving}
  on:close={closeModal}
  on:save={saveAnak}
/>
