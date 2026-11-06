<script>
  import { supabase } from '$lib/supabase';
  import { calculateAHP } from '$lib/ahp';
  import { 
    Plus, 
    Trash2, 
    Edit2, 
    AlertCircle, 
    CheckCircle2, 
    Calculator,
    Save,
    Loader2
  } from 'lucide-svelte';
  import { onMount } from 'svelte';

  let kriteriaList = [];
  let loading = true;
  let saving = false;

  let showModal = false;
  let isEditing = false;
  let currentId = null;
  let namaKriteria = '';
  let jenisKriteria = 'benefit';

  // Matriks perbandingan berpasangan
  let pairwiseMatrix = [];
  let ahpResult = {
    weights: [],
    lambdaMax: 0,
    ci: 0,
    cr: 0,
    isConsistent: false
  };

  onMount(async () => {
    await fetchKriteria();
  });

  /**
   * Mengambil data kriteria dari Supabase.
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
      await fetchAHPMatrix();
    }
    loading = false;
  }

  /**
   * Mengambil nilai matriks AHP dari database atau inisialisasi jika kosong.
   */
  async function fetchAHPMatrix() {
    const { data, error } = await supabase
      .from('perbandingan_ahp')
      .select('*');

    if (error) {
      console.error('Error fetching AHP matrix:', error);
      return;
    }

    const n = kriteriaList.length;
    // Inisialisasi matriks identitas n x n
    let matrix = Array(n).fill(0).map(() => Array(n).fill(1.0));

    // Map data dari database ke matriks local
    data.forEach(item => {
      const idx1 = kriteriaList.findIndex(k => k.id === item.kriteria_1_id);
      const idx2 = kriteriaList.findIndex(k => k.id === item.kriteria_2_id);
      if (idx1 !== -1 && idx2 !== -1) {
        matrix[idx1][idx2] = parseFloat(item.nilai);
      }
    });

    pairwiseMatrix = matrix;
    recalculateAHP();
  }

  /**
   * Menjalankan kalkulasi AHP secara lokal.
   */
  function recalculateAHP() {
    if (pairwiseMatrix.length > 0) {
      ahpResult = calculateAHP(pairwiseMatrix);
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
      if (error) alert(error.message);
    } else {
      const urutan = kriteriaList.length + 1;
      const inisial = `C${urutan}`;
      const { error } = await supabase
        .from('kriteria')
        .insert([{ inisial, nama: namaKriteria, jenis: jenisKriteria, urutan }]);
      if (error) alert(error.message);
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
      alert('Minimal harus ada 2 kriteria.');
      return;
    }
    if (!confirm('Hapus kriteria ini? Data perbandingan AHP terkait akan ikut terpengaruh.')) return;

    const { error: delError } = await supabase.from('kriteria').delete().eq('id', id);
    if (delError) {
      alert(delError.message);
      return;
    }

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
      alert('Gagal menyimpan matriks: ' + error.message);
    } else {
      alert('Matriks perbandingan dan bobot berhasil disimpan.');
    }
    saving = false;
  }

  $: nextInisial = `C${kriteriaList.length + 1}`;
</script>

<svelte:head>
  <title>Kriteria & AHP - SPK Transisi PAUD-SD</title>
</svelte:head>

<div class="space-y-8">
  <!-- Header Section -->
  <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
    <div>
      <h1 class="text-2xl font-extrabold text-slate-900 tracking-tight">Kelola Kriteria & Pembobotan AHP</h1>
      <p class="text-sm text-slate-500 mt-1 font-medium">Tentukan kriteria penilaian anak beserta bobot prioritas menggunakan perbandingan berpasangan AHP.</p>
    </div>
    <div>
      <button 
        on:click={openAddModal}
        class="inline-flex items-center px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition shadow-sm shadow-blue-200"
      >
        <Plus class="w-4 h-4 mr-1.5" />
        <span>Tambah Kriteria</span>
      </button>
    </div>
  </div>

  {#if loading}
    <div class="flex items-center justify-center p-12 bg-white rounded-2xl border border-slate-100 shadow-sm">
      <div class="flex flex-col items-center space-y-3">
        <Loader2 class="w-8 h-8 text-blue-600 animate-spin" />
        <p class="text-slate-500 text-sm font-medium">Sinkronisasi data database...</p>
      </div>
    </div>
  {:else}
    <!-- Table Kriteria -->
    <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
      <div class="p-5 md:p-6 border-b border-slate-100 flex items-center justify-between">
        <h2 class="text-lg font-bold text-slate-900 tracking-tight">Daftar Kriteria Penilaian</h2>
        <span class="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-lg">
          Total: {kriteriaList.length} Kriteria Aktif
        </span>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse min-w-[700px]">
          <thead>
            <tr class="bg-slate-50/50">
              <th class="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest w-24">Inisial</th>
              <th class="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Nama Kriteria</th>
              <th class="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Jenis MOORA</th>
              <th class="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Bobot AHP ($w_j$)</th>
              <th class="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-right">Aksi</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            {#each kriteriaList as item, index}
              <tr class="hover:bg-slate-50/30 transition">
                <td class="px-6 py-4 text-sm font-extrabold text-blue-600">{item.inisial}</td>
                <td class="px-6 py-4 text-sm font-bold text-slate-800">{item.nama}</td>
                <td class="px-6 py-4">
                  <span class="inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider {item.jenis === 'benefit' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-red-50 text-red-700 border-red-100'} border">
                    {item.jenis}
                  </span>
                </td>
                <td class="px-6 py-4 text-sm font-extrabold text-slate-900">
                  {ahpResult.weights[index] ? ahpResult.weights[index].toFixed(3) : '0.000'}
                </td>
                <td class="px-6 py-4 text-right space-x-2">
                  <button 
                    on:click={() => openEditModal(item)}
                    class="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition inline-flex items-center"
                    title="Edit Kriteria"
                  >
                    <Edit2 class="w-3.5 h-3.5" />
                  </button>
                  <button 
                    on:click={() => deleteKriteria(item.id)}
                    class="p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition inline-flex items-center"
                    title="Hapus Kriteria"
                  >
                    <Trash2 class="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </div>

    <!-- AHP Matrix Section -->
    <div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <h2 class="text-lg font-bold text-slate-900 tracking-tight">Matriks Perbandingan Berpasangan (AHP)</h2>
          <p class="text-xs text-slate-500 mt-0.5">Batas konsistensi yang diizinkan: CR ≤ 0.10. Simpan perubahan ke database setelah nilai konsisten.</p>
        </div>
        <button 
          on:click={saveAHPToDB}
          disabled={saving || !ahpResult.isConsistent}
          class="px-5 py-2.5 bg-slate-900 hover:bg-blue-600 disabled:bg-slate-300 text-white rounded-xl text-xs font-bold transition inline-flex items-center space-x-1.5 w-fit shadow-md"
        >
          {#if saving}
            <Loader2 class="w-4 h-4 animate-spin" />
          {:else}
            <Save class="w-4 h-4" />
          {/if}
          <span>Simpan Matriks & Bobot</span>
        </button>
      </div>

      <!-- Keterangan Skala Saaty -->
      <div class="bg-blue-50/70 border border-blue-100 rounded-xl p-4 text-xs text-blue-900 space-y-2">
        <p class="font-extrabold uppercase tracking-wide flex items-center space-x-1.5">
          <span>ℹ️ Panduan Skala Perbandingan Saaty (1 - 9):</span>
        </p>
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 pt-1 font-medium text-[11px]">
          <div><strong>1</strong> : Sama penting</div>
          <div><strong>3</strong> : Sedikit lebih penting</div>
          <div><strong>5</strong> : Lebih penting</div>
          <div><strong>7</strong> : Sangat lebih penting</div>
          <div><strong>9</strong> : Mutlak lebih penting</div>
          <div class="col-span-full opacity-80 pt-1"><em>Nilai 2, 4, 6, 8 adalah nilai tengah antar penilaian berdekatan.</em></div>
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
    </div>
  {/if}
</div>

<!-- Modal Tambah / Edit Kriteria -->
{#if showModal}
  <div class="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm transition-all">
    <div class="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200">
      <div class="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <h3 class="text-lg font-bold text-slate-900">{isEditing ? 'Ubah Kriteria' : 'Tambah Kriteria Baru'}</h3>
        <button on:click={closeModal} class="text-slate-400 hover:text-slate-600 transition p-1.5 rounded-lg hover:bg-white">&times;</button>
      </div>

      <div class="p-6 space-y-5">
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

      <div class="px-6 py-5 bg-slate-50/50 flex items-center justify-end space-x-3 border-t border-slate-100">
        <button 
          on:click={closeModal}
          class="px-4 py-2.5 text-slate-600 hover:text-slate-800 text-xs font-bold transition"
        >
          Batal
        </button>
        <button 
          on:click={saveKriteria}
          disabled={saving}
          class="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white rounded-xl text-xs font-bold transition shadow-md shadow-blue-200 inline-flex items-center space-x-2"
        >
          {#if saving}
            <Loader2 class="w-3.5 h-3.5 animate-spin" />
          {:else}
            <Save class="w-3.5 h-3.5" />
          {/if}
          <span>{isEditing ? 'Perbarui Kriteria' : 'Simpan Kriteria'}</span>
        </button>
      </div>
    </div>
  </div>
{/if}
