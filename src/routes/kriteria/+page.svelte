<script>
  import { supabase } from '$lib/db/supabase';
  import { calculateAHP } from '$lib/spk/ahp';
  import { cachedFetch, peekMemoryCache, invalidateDataCache } from '$lib/db/cache';
  import { notifyError, notifySuccess } from '$lib/notifications';
  import { confirmAction } from '$lib/confirm';
  import PageHeader from '$lib/components/ui/PageHeader.svelte';
  import Card from '$lib/components/ui/Card.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import Modal from '$lib/components/ui/Modal.svelte';
  import LoadingState from '$lib/components/ui/LoadingState.svelte';
  import Table from '$lib/components/ui/Table.svelte';
  import { 
    Plus, 
    Trash2, 
    Edit2, 
    AlertCircle, 
    CheckCircle2, 
    Calculator,
    Save,
    Loader2,
    ListTree,
    Scale
  } from 'lucide-svelte';
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

  /**
   * Menjalankan kalkulasi AHP secara lokal.
   */
  function recalculateAHP() {
    if (pairwiseMatrix.length > 0) {
      ahpResult = calculateAHP(pairwiseMatrix);
    }
  }

  function batalkanEditMatriks() {
    modeEditMatriks = false;
    // Kembalikan ke data asli dari cache/state awal
    const data = dataAwal || { kriteria: kriteriaList, perbandingan: [] };
    // Jika dataAwal null (baru fetch), kita perlu data asli yang belum dirubah. 
    // Cara termudah: panggil ulang terapkanKriteria dengan data yang ada di memory cache.
    const cacheData = peekMemoryCache(CACHE_KRITERIA);
    if (cacheData) {
      terapkanKriteria(cacheData);
    }
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
    <Card className="flex flex-col">
       <div class="p-5 md:p-6 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4 -mx-6 -mt-6 mb-6">
        <div class="flex items-center space-x-3">
          <div class="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
            <ListTree class="w-5 h-5" />
          </div>
          <div>
            <h2 class="text-lg font-bold text-slate-900 tracking-tight">Daftar Kriteria Penilaian</h2>
            <p class="text-xs text-slate-500 mt-0.5">Daftar kriteria aktif yang digunakan dalam perhitungan.</p>
          </div>
        </div>
        <div class="flex items-center gap-3">
          <span class="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-lg">
            Total: {kriteriaList.length} Kriteria
          </span>
          <Button on:click={openAddModal}>
            <Plus class="w-4 h-5 mr-1.5" />
            <span>Tambah Kriteria</span>
          </Button>
        </div>
      </div>

      <div class="overflow-x-auto">
        <Table 
          columns={[
            { key: 'inisial', label: 'Inisial', class: 'w-24' },
            { key: 'nama', label: 'Nama Kriteria' },
            { key: 'jenis', label: 'Jenis MOORA' },
            { key: 'bobot', label: 'Bobot AHP ($w_j$)' },
            { key: 'aksi', label: 'Aksi', class: 'text-right' }
          ]}
          data={kriteriaList}
        >
          <svelte:fragment slot="cell" let:item let:index let:col>
            {#if col.key === 'inisial'}
              <span class="font-extrabold text-blue-600">{item.inisial}</span>
            {:else if col.key === 'nama'}
              <span class="font-bold text-slate-800">{item.nama}</span>
            {:else if col.key === 'jenis'}
              <span class="inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider {item.jenis === 'benefit' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-red-50 text-red-700 border-red-100'} border">
                {item.jenis}
              </span>
            {:else if col.key === 'bobot'}
              <span class="font-extrabold text-slate-900">{ahpResult.weights[index] ? ahpResult.weights[index].toFixed(3) : '0.000'}</span>
            {:else if col.key === 'aksi'}
              <div class="space-x-2">
                <Button variant="ghost" className="p-2" on:click={() => openEditModal(item)}>
                  <Edit2 class="w-3.5 h-3.5" />
                </Button>
                <Button variant="danger" className="p-2 bg-rose-50 text-rose-600 hover:bg-rose-100 shadow-none border-none" on:click={() => deleteKriteria(item.id)}>
                  <Trash2 class="w-3.5 h-3.5" />
                </Button>
              </div>
            {:else}
              {item[col.key] !== undefined && item[col.key] !== null ? item[col.key] : '-'}
            {/if}
          </svelte:fragment>
        </Table>
      </div>
    </Card>

    <!-- AHP Matrix Section -->
    <Card className="space-y-6">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4 -mx-6 -mt-6 p-6 mb-0">
        <div class="flex items-center space-x-3">
          <div class="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
            <Scale class="w-5 h-5" />
          </div>
          <div>
            <h2 class="text-lg font-bold text-slate-900 tracking-tight">Matriks Perbandingan Berpasangan (AHP)</h2>
            <p class="text-xs text-slate-500 mt-0.5">Batas konsistensi yang diizinkan: CR ≤ 0.10. Simpan perubahan ke database setelah nilai konsisten.</p>
          </div>
        </div>
        <div class="flex items-center gap-2">
          {#if !modeEditMatriks}
            <Button on:click={() => modeEditMatriks = true} className="bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200">
              <Edit2 class="w-4 h-4 mr-1.5" />
              <span>Edit Matriks</span>
            </Button>
          {:else}
            <Button variant="ghost" on:click={batalkanEditMatriks}>
              <span>Batal</span>
            </Button>
            <Button 
              on:click={saveAHPToDB}
              disabled={saving || !ahpResult.isConsistent}
              variant="secondary"
              loading={saving}
            >
              {#if !saving}
                <Save class="w-4 h-4 mr-1.5" />
              {/if}
              <span>Simpan Perubahan</span>
            </Button>
          {/if}
        </div>
      </div>

      <!-- Keterangan Skala Saaty -->
      <div class="bg-blue-50/70 border border-blue-100 rounded-xl p-4 text-xs text-blue-900 space-y-2">
        <p class="font-extrabold uppercase tracking-wide flex items-center space-x-1.5">
          <span>Panduan Skala Perbandingan Saaty (1 - 9):</span>
        </p>
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2 pt-1 font-medium text-[11px]">
          <div><strong>1</strong> : Sama penting</div>
          <div><strong>3</strong> : Sedikit lebih penting</div>
          <div><strong>5</strong> : Lebih penting</div>
          <div><strong>7</strong> : Sangat lebih penting</div>
          <div><strong>9</strong> : Mutlak lebih penting</div>
          <div class="col-span-full"><em>Nilai 2, 4, 6, 8 adalah nilai tengah antar penilaian berdekatan.</em></div>
        </div>
      </div>

      <!-- Matrix Table -->
      <div class="overflow-x-auto">
        <table class="w-full text-center border-collapse text-xs min-w-[700px]">
          <thead>
            <tr class="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider">
              <th class="p-3 text-left border border-slate-200">Kriteria</th>
              {#each kriteriaList as k}
                <th class="p-3 border border-slate-200">{k.inisial}</th>
              {/each}
              <th class="p-3 border border-slate-200 bg-blue-50/50 text-blue-800">Bobot ($w_j$)</th>
            </tr>
          </thead>
          <tbody>
            {#each kriteriaList as ki, i}
              <tr>
                <td class="p-3 text-left font-bold text-slate-800 border border-slate-200 bg-slate-50/50">
                  {ki.inisial} 
                </td>
                {#each kriteriaList as kj, j}
                  <td class="p-2 border border-slate-200">
                    {#if i === j}
                      <div class="w-20 mx-auto py-1.5 px-2 bg-slate-100 text-slate-400 font-bold rounded-lg border border-transparent">1.0</div>
                    {:else if i < j}
                      {#if modeEditMatriks}
                        <input 
                          type="number" 
                          step="0.01" 
                          min="0.1" 
                          max="9"
                          bind:value={pairwiseMatrix[i][j]} 
                          on:input={() => {
                            pairwiseMatrix[j][i] = parseFloat((1 / pairwiseMatrix[i][j]).toFixed(3));
                            recalculateAHP();
                          }}
                          class="w-20 text-center py-1.5 px-2 bg-blue-50 border border-blue-200 rounded-lg text-xs font-bold text-blue-800 focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none transition"
                        />
                      {:else}
                        <div class="w-20 mx-auto py-1.5 px-2 bg-slate-50 text-slate-700 font-semibold rounded-lg border border-slate-100">
                          {pairwiseMatrix[i][j]}
                        </div>
                      {/if}
                    {:else}
                      <div class="w-20 mx-auto py-1.5 px-2 bg-slate-50 text-slate-500 font-medium rounded-lg border border-slate-100">
                        {pairwiseMatrix[i][j]}
                      </div>
                    {/if}
                  </td>
                {/each}
                <td class="p-3 font-extrabold text-blue-700 border border-slate-200 bg-blue-50/30">
                  {ahpResult.weights[i] ? ahpResult.weights[i].toFixed(3) : '0.000'}
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>

      <!-- CR Status Banner -->
      <div class={`p-4 rounded-xl border flex items-start space-x-3 transition-colors ${ahpResult.isConsistent ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
        {#if ahpResult.isConsistent}
          <CheckCircle2 class="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <p class="text-xs font-extrabold uppercase tracking-wide">Matriks Konsisten (CR = {ahpResult.cr.toFixed(3)})</p>
            <p class="text-[11px] mt-0.5 opacity-90 font-medium text-emerald-700/80">Bobot kriteria sah dan dapat disimpan untuk digunakan pada perankingan MOORA.</p>
          </div>
        {:else}
          <AlertCircle class="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div>
            <p class="text-xs font-extrabold uppercase tracking-wide">Belum Konsisten (CR = {ahpResult.cr.toFixed(3)})</p>
            <p class="text-[11px] mt-0.5 opacity-90 font-medium text-red-700/80">Rasio konsistensi melebihi 0.10. Harap perbaiki perbandingan nilai antar kriteria.</p>
          </div>
        {/if}
      </div>
    </Card>
  {/if}
</div>

<!-- Modal Tambah / Edit Kriteria -->
<Modal
  isOpen={showModal}
  title={isEditing ? 'Ubah Kriteria' : 'Tambah Kriteria Baru'}
  on:close={closeModal}
  maxWidth="max-w-md"
>
  <div class="space-y-5">
    <div>
      <label for="inisial" class="block text-[11px] font-extrabold uppercase tracking-widest text-slate-500 mb-2">Inisial Kriteria (Otomatis)</label>
      <input 
        id="inisial"
        type="text" 
        disabled 
        value={isEditing ? kriteriaList.find(k => k.id === currentId)?.inisial : nextInisial}
        class="w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded-xl text-slate-400 font-bold text-sm cursor-not-allowed shadow-inner"
      />
    </div>

    <div>
      <label for="nama" class="block text-[11px] font-extrabold uppercase tracking-widest text-slate-500 mb-2">Nama Kriteria</label>
      <input 
        id="nama"
        type="text" 
        bind:value={namaKriteria}
        placeholder="Masukkan nama kriteria..."
        class="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition shadow-sm"
      />
    </div>

    <div>
      <label for="jenis" class="block text-[11px] font-extrabold uppercase tracking-widest text-slate-500 mb-2">Jenis Kriteria MOORA</label>
      <select 
        id="jenis"
        bind:value={jenisKriteria}
        class="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition shadow-sm cursor-pointer"
      >
        <option value="benefit">Benefit (Nilai besar lebih baik)</option>
        <option value="cost">Cost (Nilai kecil lebih baik)</option>
      </select>
    </div>
  </div>

  <div slot="footer">
    <Button variant="ghost" on:click={closeModal}>
      Batal
    </Button>
    <Button 
      on:click={saveKriteria}
      disabled={saving}
      loading={saving}
    >
      {#if !saving}
        <Save class="w-3.5 h-3.5 mr-2" />
      {/if}
      <span>{isEditing ? 'Perbarui Kriteria' : 'Simpan Kriteria'}</span>
    </Button>
  </div>
</Modal>
