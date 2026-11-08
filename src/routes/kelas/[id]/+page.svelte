<script>
  import { supabase } from '$lib/db/supabase';
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  import { apakahNisDuplikat, normalisasiNis } from '$lib/domain/anak';
  import { cachedFetch, peekMemoryCache, invalidateDataCache } from '$lib/db/cache';
  import {
    ArrowLeft,
    Plus,
    Trash2,
    Edit2,
    Users,
    Loader2,
    Save,
    X,
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
      alert('Nama lengkap anak wajib diisi.');
      return;
    }

    const nis = normalisasiNis(nisAnak);
    const idYangDiubah = isEditing ? currentId : null;

    if (apakahNisDuplikat(anakList, nis, idYangDiubah)) {
      alert('NIS tersebut sudah dipakai anak lain di kelas ini.');
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
        alert(error.code === '23505' ? 'NIS tersebut sudah dipakai anak lain di kelas ini.' : error.message);
        saving = false;
        return;
      }
    } else {
      const { error } = await supabase.from('anak').insert(payload);
      if (error) {
        alert(error.code === '23505' ? 'NIS tersebut sudah dipakai anak lain di kelas ini.' : error.message);
        saving = false;
        return;
      }
    }

    await fetchDetail();
    saving = false;
    closeModal();
  }

  /**
   * Menghapus data anak beserta seluruh penilaian yang terkait.
   */
  async function deleteAnak(item) {
    const pesan = `Hapus data anak "${item.nama}"?\nSeluruh penilaian anak ini ikut terhapus dan tidak bisa dikembalikan.`;
    if (!confirm(pesan)) return;

    const { error } = await supabase.from('anak').delete().eq('id', item.id);
    if (error) {
      alert(error.message);
      return;
    }

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
    <div class="flex items-center justify-center p-12 bg-white rounded-2xl border border-slate-100 shadow-sm">
      <div class="flex flex-col items-center space-y-3">
        <Loader2 class="w-8 h-8 text-blue-600 animate-spin" />
        <p class="text-slate-500 text-sm font-medium">Sinkronisasi data kelas...</p>
      </div>
    </div>
  {:else if notFound}
    <div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-10 text-center">
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
    </div>
  {:else}
    <!-- Header Halaman -->
    <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
      <div>
        <h1 class="text-2xl font-extrabold text-slate-900 tracking-tight">{kelas.nama_kelas}</h1>
        <p class="text-sm text-slate-500 mt-1 font-medium">
          Tahun Ajaran {kelas.tahun_ajaran} &bull; {anakList.length} anak terdaftar
        </p>
      </div>
      <button
        on:click={openAddModal}
        class="inline-flex items-center px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition shadow-sm shadow-blue-200 w-fit whitespace-nowrap"
      >
        <Plus class="w-4 h-4 mr-1.5" />
        <span>Tambah Data Anak</span>
      </button>
    </div>

    <!-- Tabel Daftar Anak -->
    <section class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
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
          <div class="flex flex-col items-center justify-center p-10 text-center border border-dashed border-slate-300 rounded-xl bg-slate-50/50">
            <UserRound class="w-8 h-8 text-slate-300 mb-3" />
            <p class="text-sm font-bold text-slate-700">Belum ada data anak</p>
            <p class="text-xs text-slate-500 mt-1 mb-4">Tambahkan anak pertama pada kelas ini untuk mulai melakukan penilaian.</p>
            <button
              on:click={openAddModal}
              class="inline-flex items-center px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition shadow-sm shadow-blue-200"
            >
              <Plus class="w-4 h-4 mr-1.5" />
              <span>Tambah Data Anak</span>
            </button>
          </div>
        </div>
      {:else}
        <div class="px-5 md:px-6 pt-4 md:pt-0">
          <p class="xl:hidden text-[11px] text-slate-400 font-medium">Geser tabel ke samping untuk melihat semua kolom.</p>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse min-w-[680px]">
            <thead>
              <tr class="bg-slate-50/50">
                <th class="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest w-16">No.</th>
                <th class="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest w-44">NIS</th>
                <th class="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Nama Lengkap Anak</th>
                <th class="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-right w-48">Aksi</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              {#each anakList as item, index (item.id)}
                <tr class="hover:bg-slate-50/30 transition">
                  <td class="px-6 py-4 text-sm font-bold text-slate-500">{index + 1}</td>
                  <td class="px-6 py-4">
                    {#if item.nis}
                      <span class="text-sm font-semibold text-slate-700">{item.nis}</span>
                    {:else}
                      <span class="inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-100">
                        Belum diisi
                      </span>
                    {/if}
                  </td>
                  <td class="px-6 py-4 text-sm font-bold text-slate-800">{item.nama}</td>
                  <td class="px-6 py-4 text-right whitespace-nowrap space-x-2">
                    {#if !item.nis}
                      <button
                        on:click={() => openEditModal(item)}
                        class="inline-flex items-center gap-1.5 px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg text-[11px] font-bold transition"
                        title="Isi NIS"
                      >
                        <PencilLine class="w-3.5 h-3.5" />
                        <span>Isi NIS</span>
                      </button>
                    {/if}
                    <button
                      on:click={() => openEditModal(item)}
                      class="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition inline-flex items-center align-middle"
                      title="Ubah Data Anak"
                    >
                      <Edit2 class="w-3.5 h-3.5" />
                    </button>
                    <button
                      on:click={() => deleteAnak(item)}
                      class="p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition inline-flex items-center align-middle"
                      title="Hapus Data Anak"
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
            NIS harus unik di dalam satu kelas, tetapi boleh kosong. Anak tanpa NIS tetap dapat dinilai pada perhitungan MOORA.
          </p>
        </div>
      {/if}
    </section>
  {/if}
</div>

<!-- Modal Tambah / Ubah Data Anak -->
{#if showModal}
  <div class="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm transition-all">
    <div class="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
      <div class="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <h3 class="text-lg font-bold text-slate-900">{isEditing ? 'Ubah Data Anak' : 'Tambah Data Anak'}</h3>
        <button
          on:click={closeModal}
          class="text-slate-400 hover:text-slate-600 transition p-1.5 rounded-lg hover:bg-white"
          aria-label="Tutup"
        >
          <X class="w-5 h-5" />
        </button>
      </div>

      <div class="p-6 space-y-5">
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

      <div class="px-6 py-5 bg-slate-50/50 flex items-center justify-end gap-3 border-t border-slate-100">
        <button on:click={closeModal} class="px-4 py-2.5 text-slate-600 hover:text-slate-800 text-xs font-bold transition">
          Batal
        </button>
        <button
          on:click={saveAnak}
          disabled={saving}
          class="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white rounded-xl text-xs font-bold transition shadow-md shadow-blue-200 inline-flex items-center gap-2"
        >
          {#if saving}
            <Loader2 class="w-3.5 h-3.5 animate-spin" />
          {:else}
            <Save class="w-3.5 h-3.5" />
          {/if}
          <span>{isEditing ? 'Perbarui Data Anak' : 'Simpan Data Anak'}</span>
        </button>
      </div>
    </div>
  </div>
{/if}
