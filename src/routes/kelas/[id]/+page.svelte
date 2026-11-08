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
  import EmptyState from '$lib/components/ui/EmptyState.svelte';
  import Card from '$lib/components/ui/Card.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import Modal from '$lib/components/ui/Modal.svelte';
  import Table from '$lib/components/ui/Table.svelte';
  import {
    ArrowLeft,
    Plus,
    Trash2,
    Edit2,
    Users,
    UserRound,
    AlertCircle,
    PencilLine
  } from 'lucide-svelte';

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

    <!-- Tabel Daftar Anak -->
    <Card padding="p-0">
      <div class="p-5 md:p-6 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div class="flex items-start gap-3">
          <div class="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
            <Users class="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h2 class="text-lg font-bold text-slate-900 tracking-tight">Daftar Anak</h2>
            <p class="text-xs text-slate-500 mt-1 leading-relaxed">
              NIS bersifat opsional, boleh dikosongkan sekarang dan diisi nanti melalui tombol ubah.
            </p>
          </div>
        </div>
        <span class="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-lg whitespace-nowrap w-fit">
          Total: {anakList.length} Anak
        </span>
      </div>

      {#if anakList.length === 0}
        <div class="p-5 md:p-6">
          <EmptyState
            title="Belum ada data anak"
            description="Tambahkan anak pertama pada kelas ini untuk mulai melakukan penilaian."
            icon={UserRound}
          >
            <div slot="action">
              <Button on:click={openAddModal}>
                <Plus class="w-4 h-4 mr-1.5" />
                <span>Tambah Data Anak</span>
              </Button>
            </div>
          </EmptyState>
        </div>
      {:else}
        <div class="overflow-x-auto">
          <Table
            columns={[
              { key: 'no', label: 'No.', class: 'w-16' },
              { key: 'nis', label: 'NIS', class: 'w-44' },
              { key: 'nama', label: 'Nama Lengkap Anak' },
              { key: 'aksi', label: 'Aksi', class: 'text-right w-48' }
            ]}
            data={anakList.map((item, index) => ({ ...item, no: index + 1 }))}
          >
            <svelte:fragment slot="nis" let:item>
              {#if item.nis}
                <span class="text-sm font-semibold text-slate-700">{item.nis}</span>
              {:else}
                <span class="inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-100">
                  Belum diisi
                </span>
              {/if}
            </svelte:fragment>
            <svelte:fragment slot="nama" let:item>
              <span class="text-sm font-bold text-slate-800">{item.nama}</span>
            </svelte:fragment>
            <svelte:fragment slot="aksi" let:item>
              <div class="text-right whitespace-nowrap space-x-2">
                {#if !item.nis}
                  <Button
                    variant="outline"
                    className="bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-100 gap-1.5 px-3 py-2 h-auto text-[11px]"
                    on:click={() => openEditModal(item)}
                    title="Isi NIS"
                  >
                    <PencilLine class="w-3.5 h-3.5" />
                    <span>Isi NIS</span>
                  </Button>
                {/if}
                <Button variant="outline" className="p-2 h-auto" on:click={() => openEditModal(item)} title="Ubah Data Anak">
                  <Edit2 class="w-3.5 h-3.5" />
                </Button>
                <Button variant="danger" className="p-2 h-auto bg-red-50 hover:bg-red-100 text-red-600 border-red-100 shadow-none" on:click={() => deleteAnak(item)} title="Hapus Data Anak">
                  <Trash2 class="w-3.5 h-3.5" />
                </Button>
              </div>
            </svelte:fragment>
          </Table>
        </div>

        <div class="px-6 py-4 bg-slate-50/50 border-t border-slate-100">
          <p class="text-[11px] text-slate-500 font-medium leading-relaxed">
            NIS harus unik di dalam satu kelas, tetapi boleh kosong. Anak tanpa NIS tetap dapat dinilai pada perhitungan MOORA.
          </p>
        </div>
      {/if}
    </Card>
  {/if}
</div>

<!-- Modal Tambah / Ubah Data Anak -->
<Modal isOpen={showModal} title={isEditing ? 'Ubah Data Anak' : 'Tambah Data Anak'} on:close={closeModal}>
  <div class="space-y-5">
    <div>
      <span class="block text-[11px] font-extrabold uppercase tracking-widest text-slate-500 mb-2">Kelas</span>
      <div class="w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 text-sm font-semibold cursor-not-allowed">
        {kelas.nama_kelas} &bull; {kelas.tahun_ajaran}
      </div>
    </div>

    <div>
      <label for="nama-anak" class="block text-[11px] font-extrabold uppercase tracking-widest text-slate-500 mb-2">Nama Lengkap Anak</label>
      <input
        id="nama-anak"
        type="text"
        bind:value={namaAnak}
        placeholder="Contoh: Aisyah Putri"
        class="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition shadow-sm"
      />
    </div>

    <div>
      <label for="nis-anak" class="block text-[11px] font-extrabold uppercase tracking-widest text-slate-500 mb-2">
        NIS <span class="text-slate-400 normal-case tracking-normal font-semibold">(Opsional)</span>
      </label>
      <input
        id="nis-anak"
        type="text"
        bind:value={nisAnak}
        placeholder="Contoh: 2026001"
        class="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition shadow-sm"
      />
      <p class="text-[11px] text-slate-400 font-medium mt-2 leading-relaxed">
        Boleh dikosongkan sekarang. NIS dapat diisi kapan saja melalui tombol <strong>Ubah Data Anak</strong>.
      </p>
    </div>

    <div class="p-3.5 bg-blue-50 border border-blue-100 rounded-xl text-[11px] font-medium text-blue-800 leading-relaxed flex items-start gap-2">
      <AlertCircle class="w-4 h-4 shrink-0 mt-0.5" />
      <span>NIS harus unik di dalam kelas ini. Anak tanpa NIS tetap dapat dinilai pada perhitungan MOORA.</span>
    </div>
  </div>

  <div slot="footer">
    <Button variant="ghost" on:click={closeModal}>Batal</Button>
    <Button loading={saving} on:click={saveAnak}>
      <span>{isEditing ? 'Perbarui Data Anak' : 'Simpan Data Anak'}</span>
    </Button>
  </div>
</Modal>
