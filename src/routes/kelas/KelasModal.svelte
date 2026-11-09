<script>
  import { createEventDispatcher } from 'svelte';
  import Modal from '$lib/components/ui/Modal.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import Input from '$lib/components/ui/Input.svelte';
  import { AlertCircle } from 'lucide-svelte';

  export let isOpen = false;
  export let isEditing = false;
  export let namaKelas = '';
  export let tahunAjaran = '';
  export let saving = false;

  const dispatch = createEventDispatcher();
</script>

<!-- Modal Tambah / Ubah Kelas -->
<Modal {isOpen} title={isEditing ? 'Ubah Kelas' : 'Tambah Kelas Baru'} on:close>
  <div class="space-y-5">
    <Input
      id="nama-kelas"
      label="Nama Kelas"
      bind:value={namaKelas}
      placeholder="Contoh: Kelas A"
      required
    />

    <Input
      id="tahun-ajaran"
      label="Tahun Ajaran"
      bind:value={tahunAjaran}
      placeholder="Contoh: 2026/2027"
      required
    />

    <div class="p-3.5 bg-blue-50 border border-blue-100 rounded-xl text-[11px] font-medium text-blue-800 leading-relaxed flex items-start gap-2">
      <AlertCircle class="w-4 h-4 shrink-0 mt-0.5" />
      <span>Setelah kelas dibuat, tambahkan data anak melalui halaman detail kelas (tombol <strong>Kelola Anak</strong>).</span>
    </div>
  </div>

  <div slot="footer">
    <Button variant="ghost" on:click={() => dispatch('close')}>Batal</Button>
    <Button loading={saving} on:click={() => dispatch('save')}>
      <span>{isEditing ? 'Perbarui Kelas' : 'Simpan Kelas'}</span>
    </Button>
  </div>
</Modal>
