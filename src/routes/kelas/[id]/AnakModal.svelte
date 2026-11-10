<script>
  import { createEventDispatcher } from 'svelte';
  import Modal from '$lib/components/ui/Modal.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import { AlertCircle } from 'lucide-svelte';

  export let isOpen = false;
  export let isEditing = false;
  export let namaKelas = '';
  export let tahunAjaran = '';
  export let namaAnak = '';
  export let nisAnak = '';
  export let saving = false;

  const dispatch = createEventDispatcher();
</script>

<!-- Modal Tambah / Ubah Data Anak -->
<Modal {isOpen} title={isEditing ? 'Ubah Data Anak' : 'Tambah Data Anak'} on:close>
  <div class="space-y-5">
    <div>
      <span class="block text-[11px] font-extrabold uppercase tracking-widest text-slate-500 mb-2">Kelas</span>
      <div class="w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 text-sm font-semibold cursor-not-allowed">
        {namaKelas} &bull; {tahunAjaran}
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
    <Button variant="ghost" on:click={() => dispatch('close')}>Batal</Button>
    <Button loading={saving} on:click={() => dispatch('save')}>
      <span>{isEditing ? 'Perbarui Data Anak' : 'Simpan Data Anak'}</span>
    </Button>
  </div>
</Modal>
