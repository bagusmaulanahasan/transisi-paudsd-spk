<script>
  import Modal from '$lib/components/ui/Modal.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import { Save } from 'lucide-svelte';

  export let isOpen = false;
  export let isEditing = false;
  export let pertanyaan = '';
  export let judulKriteria = '';
  export let saving = false;
</script>

<Modal
  {isOpen}
  title={isEditing ? 'Ubah Pertanyaan' : 'Tambah Indikator Baru'}
  on:close
  maxWidth="max-w-lg"
>
  <div class="space-y-5">
    <div>
      <span class="block text-[11px] font-extrabold uppercase tracking-widest text-slate-500 mb-2">Kriteria Penilaian</span>
      <div class="w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 text-sm font-semibold cursor-not-allowed">
        {judulKriteria}
      </div>
    </div>

    <div>
      <label for="pertanyaan" class="block text-[11px] font-extrabold uppercase tracking-widest text-slate-500 mb-2">Teks Pertanyaan Observasi</label>
      <textarea
        id="pertanyaan"
        bind:value={pertanyaan}
        rows="3"
        placeholder="Contoh: Anak mampu mengenali dan menyebutkan simbol huruf/angka dasar."
        class="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition shadow-sm resize-none"
      ></textarea>
    </div>

    <div class="p-3.5 bg-blue-50 border border-blue-100 rounded-xl text-[11px] font-medium text-blue-800 leading-relaxed">
      Jawaban anak memakai <strong>Master Opsi Jawaban</strong> yang sudah diatur pada section atas, sehingga tidak perlu diatur ulang per pertanyaan.
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
      <span>{isEditing ? 'Perbarui Pertanyaan' : 'Simpan Indikator'}</span>
    </Button>
  </div>
</Modal>
