<script>
  import { supabase } from '$lib/db/supabase';
  import { onMount } from 'svelte';
  import { fetchKelasDenganJumlahAnak } from '$lib/services/kelas';
  import { peekMemoryCache, invalidateDataCache } from '$lib/db/cache';
  import { notifyError, notifySuccess } from '$lib/notifications';
  import { confirmAction } from '$lib/confirm';
  import PageHeader from '$lib/components/ui/PageHeader.svelte';
  import LoadingState from '$lib/components/ui/LoadingState.svelte';
  import EmptyState from '$lib/components/ui/EmptyState.svelte';
  import Card from '$lib/components/ui/Card.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import Modal from '$lib/components/ui/Modal.svelte';
  import {
    Plus,
    Trash2,
    Edit2,
    Users,
    School,
    AlertCircle
  } from 'lucide-svelte';

  const CACHE_KELAS = 'kelas-list';

  // Data cache dipakai lebih dulu agar daftar kelas tampil seketika.
  const dataAwal = peekMemoryCache(CACHE_KELAS);

  // ==================== STATE DAFTAR KELAS ====================
  let kelasList = dataAwal?.kelas ?? [];
  let jumlahAnakMap = dataAwal?.jumlahAnak ?? {};
  let loading = dataAwal === null;
  let saving = false;

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
  function tahunAjaranSekarang() {
    const sekarang = new Date();
    const tahun = sekarang.getFullYear();
    const tahunMulai = sekarang.getMonth() >= 6 ? tahun : tahun - 1;
    return `${tahunMulai}/${tahunMulai + 1}`;
  }

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
  }

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
    tahunAjaran = tahunAjaranSekarang();
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
    <div slot="action">
      <Button on:click={openAddModal}>
        <Plus class="w-4 h-4 mr-1.5" />
        <span>Tambah Kelas</span>
      </Button>
    </div>
  </PageHeader>

  {#if loading}
    <LoadingState text="Sinkronisasi data kelas..." />
  {:else}
    <!-- Tabel Daftar Kelas -->
    <Card padding="p-0">
      <div class="p-5 md:p-6 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
            <School class="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h2 class="text-lg font-bold text-slate-900 tracking-tight">Daftar Kelas</h2>
            <p class="text-xs text-slate-500 mt-1 leading-relaxed">
              Klik <strong>Kelola Anak</strong> untuk melihat dan menambah anak pada kelas tersebut.
            </p>
          </div>
        </div>
        <div class="flex items-center gap-3">
          <span class="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-lg whitespace-nowrap w-fit">
            Total: {kelasList.length} Kelas
          </span>
          <Button on:click={openAddModal}>
            <Plus class="w-4 h-4 mr-1.5" />
            <span>Tambah Kelas</span>
          </Button>
        </div>
      </div>

      {#if kelasList.length === 0}
        <div class="p-5 md:p-6">
          <EmptyState
            title="Belum ada kelas"
            description="Tambahkan kelas pertama, misalnya 'Kelas A' untuk tahun ajaran berjalan."
            icon={School}
          >
            <div slot="action">
              <Button on:click={openAddModal}>
                <Plus class="w-4 h-4 mr-1.5" />
                <span>Tambah Kelas</span>
              </Button>
            </div>
          </EmptyState>
        </div>
      {:else}
        <div class="px-5 md:px-6 pt-4 md:pt-0">
          <p class="xl:hidden text-[11px] text-slate-400 font-medium">Geser tabel ke samping untuk melihat semua kolom.</p>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse min-w-[720px]">
            <thead>
              <tr class="bg-slate-50/50">
                <th class="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest w-16">No.</th>
                <th class="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Nama Kelas</th>
                <th class="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Tahun Ajaran</th>
                <th class="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-center">Jumlah Anak</th>
                <th class="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-right w-48">Aksi</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              {#each kelasList as item, index (item.id)}
                <tr class="hover:bg-slate-50/30 transition">
                  <td class="px-6 py-4 text-sm font-bold text-slate-500">{index + 1}</td>
                  <td class="px-6 py-4">
                    <a
                      href={`/kelas/${item.id}`}
                      class="text-sm font-bold text-slate-800 hover:text-blue-600 transition"
                    >
                      {item.nama_kelas}
                    </a>
                  </td>
                  <td class="px-6 py-4">
                    <span class="inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 border border-slate-200">
                      {item.tahun_ajaran}
                    </span>
                  </td>
                  <td class="px-6 py-4 text-center">
                    <span class="inline-flex items-center gap-1.5 text-sm font-bold text-slate-700">
                      <Users class="w-3.5 h-3.5 text-slate-400" />
                      {jumlahAnakMap[item.id] || 0}
                    </span>
                  </td>
                  <td class="px-6 py-4 text-right whitespace-nowrap space-x-2">
                    <a
                      href={`/kelas/${item.id}`}
                      class="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-[11px] font-bold transition"
                      title="Kelola Anak"
                    >
                      <Users class="w-3.5 h-3.5" />
                      <span>Kelola Anak</span>
                    </a>
                    <Button variant="outline" className="p-2 h-auto" on:click={() => openEditModal(item)} title="Ubah Kelas">
                      <Edit2 class="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="danger" className="p-2 h-auto bg-red-50 hover:bg-red-100 text-red-600 border-red-100 shadow-none" on:click={() => deleteKelas(item)} title="Hapus Kelas">
                      <Trash2 class="w-3.5 h-3.5" />
                    </Button>
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>

        <div class="px-6 py-4 bg-slate-50/50 border-t border-slate-100">
          <p class="text-[11px] text-slate-500 font-medium leading-relaxed">
            Menghapus kelas akan menghapus seluruh data anak dan penilaian di dalamnya. Pastikan data sudah tidak dibutuhkan.
          </p>
        </div>
      {/if}
    </Card>
  {/if}
</div>

<!-- Modal Tambah / Ubah Kelas -->
<Modal isOpen={showModal} title={isEditing ? 'Ubah Kelas' : 'Tambah Kelas Baru'} on:close={closeModal}>
  <div class="space-y-5">
    <div>
      <label for="nama-kelas" class="block text-[11px] font-extrabold uppercase tracking-widest text-slate-500 mb-2">Nama Kelas</label>
      <input
        id="nama-kelas"
        type="text"
        bind:value={namaKelas}
        placeholder="Contoh: Kelas A"
        class="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition shadow-sm"
      />
    </div>

    <div>
      <label for="tahun-ajaran" class="block text-[11px] font-extrabold uppercase tracking-widest text-slate-500 mb-2">Tahun Ajaran</label>
      <input
        id="tahun-ajaran"
        type="text"
        bind:value={tahunAjaran}
        placeholder="Contoh: 2026/2027"
        class="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition shadow-sm"
      />
    </div>

    <div class="p-3.5 bg-blue-50 border border-blue-100 rounded-xl text-[11px] font-medium text-blue-800 leading-relaxed flex items-start gap-2">
      <AlertCircle class="w-4 h-4 shrink-0 mt-0.5" />
      <span>Setelah kelas dibuat, tambahkan data anak melalui halaman detail kelas (tombol <strong>Kelola Anak</strong>).</span>
    </div>
  </div>

  <div slot="footer">
    <Button variant="ghost" on:click={closeModal}>Batal</Button>
    <Button loading={saving} on:click={saveKelas}>
      <span>{isEditing ? 'Perbarui Kelas' : 'Simpan Kelas'}</span>
    </Button>
  </div>
</Modal>
