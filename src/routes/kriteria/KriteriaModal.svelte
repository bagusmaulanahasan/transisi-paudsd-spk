<script>
  import { createEventDispatcher } from 'svelte';
  import Modal from '$lib/components/ui/Modal.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import { Save } from 'lucide-svelte';

  export let isOpen = false;
  export let isEditing = false;
  export let inisial = '';
  export let namaKriteria = '';
  export let jenisKriteria = 'benefit';
  export let saving = false;

  const dispatch = createEventDispatcher();
</script>

<!-- Modal Tambah / Edit Kriteria -->
<Modal
  {isOpen}
  title={isEditing ? 'Ubah Kriteria' : 'Tambah Kriteria Baru'}
  on:close
  maxWidth="max-w-md"
>
  <div class="space-y-5">
    <div>
      <label for="inisial" class="block text-[11px] font-extrabold uppercase tracking-widest text-slate-500 mb-2">Inisial Kriteria (Otomatis)</label>
      <input 
        id="inisial"
        type="text" 
        disabled 
        value={inisial}
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
    <Button variant="ghost" on:click={() => dispatch('close')}>
      Batal
    </Button>
    <Button 
      on:click={() => dispatch('save')}
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
