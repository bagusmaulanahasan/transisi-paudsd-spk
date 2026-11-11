<script>
  import Card from '$lib/components/ui/Card.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import { UserRound, CheckCircle2, PencilLine } from 'lucide-svelte';

  export let anak = null;
  export let kelas = null;
  export let modeEdit = false;
  export let readOnly = false;
  export let onMulaiEdit = () => {};
  export let onSelesaiEdit = () => {};
</script>

<Card className="p-5 md:p-6">
  <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
    <div class="flex items-center gap-4">
      <div class="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center shrink-0">
        <UserRound class="w-7 h-7 text-blue-600" />
      </div>
      <div>
        <p class="text-[11px] font-extrabold uppercase tracking-widest text-slate-400 mb-1">
          {kelas ? `${kelas.nama_kelas} — ${kelas.tahun_ajaran}` : 'Data kelas tidak ditemukan'}
        </p>
        <h1 class="text-2xl font-extrabold text-slate-900 tracking-tight">{anak.nama}</h1>
        <div class="flex flex-wrap items-center gap-2 mt-2">
          {#if anak.kode_anak}
            <span class="inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200 font-mono">
              Kode: {anak.kode_anak}
            </span>
          {/if}
          {#if anak.nama_panggilan}
            <span class="inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 border border-slate-200">
              Panggilan: {anak.nama_panggilan}
            </span>
          {/if}
          <span class="inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider {modeEdit ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-blue-50 text-blue-700 border border-blue-100'}">
            {modeEdit ? 'Mode edit' : 'Mode lihat'}
          </span>
        </div>
      </div>
    </div>

    <div class="flex items-center gap-2">
      {#if readOnly}
        <span class="inline-flex items-center gap-1.5 px-3 py-2 bg-sky-50 border border-sky-100 text-sky-700 rounded-xl text-[11px] font-bold">
          Hanya baca
        </span>
      {:else if modeEdit}
        <Button variant="primary" on:click={onSelesaiEdit} className="shadow-sm shadow-emerald-200">
          <CheckCircle2 class="w-4 h-4 mr-1.5" />
          Selesai
        </Button>
      {:else}
        <Button variant="primary" on:click={onMulaiEdit} className="bg-green-600 hover:bg-green-700 shadow-sm shadow-blue-200">
          <PencilLine class="w-4 h-4 mr-1.5" />
          Edit Penilaian
        </Button>
      {/if}
    </div>
  </div>
</Card>
