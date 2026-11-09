<script>
  import Modal from '$lib/components/ui/Modal.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import { Save } from 'lucide-svelte';

  export let isOpen = false;
  export let isEditing = false;
  export let opsiText = '';
  export let keteranganText = '';
  export let saving = false;
</script>

<Modal
  {isOpen}
  title={isEditing ? 'Ubah Opsi Jawaban' : 'Tambah Opsi Jawaban'}
  on:close
  maxWidth="max-w-md"
>
  <div class="space-y-5">
    <div>
      <label for="opsi" class="block text-[11px] font-extrabold uppercase tracking-widest text-slate-500 mb-2">Teks Opsi</label>
      <input
        id="opsi"
        type="text"
        bind:value={opsiText}
        placeholder="Contoh: Sesuai Harapan"
        class="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition shadow-sm"
      />
    </div>

    <div>
      <label for="keterangan" class="block text-[11px] font-extrabold uppercase tracking-widest text-slate-500 mb-2">Keterangan (Opsional)</label>
      <input
        id="keterangan"
        type="text"
        bind:value={keteranganText}
        placeholder="Contoh: Menunjukkan perkembangan sesuai tahapan usianya"
        class="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition shadow-sm"
      />
    </div>

    <div class="p-3.5 bg-blue-50 border border-blue-100 rounded-xl text-[11px] font-medium text-blue-800 leading-relaxed">
      Opsi ini berlaku untuk seluruh kriteria dan indikator. Poin dihitung otomatis berdasarkan urutan.
    </div>
  </div>

  <div slot="footer">
    <Button variant="ghost" on:click>
      Batal
    </Button>
    <Button
      on:click
      disabled={saving}
      loading={saving}
    >
      {#if !saving}
        <Save class="w-3.5 h-3.5 mr-2" />
      {/if}
      <span>{isEditing ? 'Perbarui Opsi' : 'Simpan Opsi'}</span>
    </Button>
  </div>
</Modal>
