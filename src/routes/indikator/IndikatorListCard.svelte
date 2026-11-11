<script>
  import Card from '$lib/components/ui/Card.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import {
    Plus,
    Trash2,
    Edit2,
    HelpCircle,
    AlertCircle,
    MessageSquareText
  } from 'lucide-svelte';

  export let kriteriaList = [];
  export let selectedKriteriaId = null;
  export let indikatorList = [];
  export let kriteriaAktif = null;
  export let onKriteriaChange = () => {};
  export let openAddIndikator = () => {};
  export let openEditIndikator = () => {};
  export let deleteIndikator = () => {};
</script>

<Card className="overflow-hidden">
  <div class="p-5 md:p-6 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4 -mx-6 -mt-6 mb-6">
    <div class="flex items-center gap-3">
      <div class="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
        <MessageSquareText class="w-5 h-5 text-blue-600" />
      </div>
      <div>
        <h2 class="text-lg font-bold text-slate-900 tracking-tight">Kelola Indikator Pertanyaan</h2>
        <p class="text-xs text-slate-500 mt-1 leading-relaxed max-w-xl">
          Daftar pertanyaan observasi mengikuti kriteria yang dipilih pada dropdown di bawah.
        </p>
      </div>
    </div>

    <Button
      on:click={openAddIndikator}
      disabled={!kriteriaAktif}
    >
      <Plus class="w-4 h-4 mr-1.5" />
      <span>Tambah Indikator</span>
    </Button>
  </div>

  <!-- Toolbar Filter Kriteria -->
  <div class="md:px-6 py-4 bg-slate-50/60 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center gap-3">
    <label for="filter-kriteria" class="text-[11px] font-extrabold uppercase tracking-widest text-slate-500 shrink-0">
      Pilih Kriteria Penilaian
    </label>
    <select
      id="filter-kriteria"
      value={selectedKriteriaId}
      on:change={(e) => onKriteriaChange(e.target.value)}
      disabled={kriteriaList.length === 0}
      class="w-full lg:w-auto lg:min-w-[340px] px-4 py-3 bg-white border border-slate-200 rounded-xl text-blue-700 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition cursor-pointer disabled:cursor-not-allowed disabled:bg-slate-100"
    >
      {#each kriteriaList as k (k.id)}
        <option value={k.id}>{k.inisial} — {k.nama}</option>
      {/each}
    </select>
    <span class="text-xs font-semibold text-slate-500 bg-white border border-slate-200 px-3 py-1.5 rounded-lg lg:ml-auto w-fit whitespace-nowrap">
      Total: {indikatorList.length} Indikator
    </span>
  </div>

  <div class="md:p-6">
    {#if kriteriaList.length === 0}
      <div class="flex flex-col items-center justify-center p-10 text-center border border-dashed border-slate-300 rounded-xl bg-slate-50/50">
        <AlertCircle class="w-8 h-8 text-amber-400 mb-3" />
        <p class="text-sm font-bold text-slate-700">Belum ada kriteria penilaian</p>
        <p class="text-xs text-slate-500 mt-1">
          Tambahkan kriteria terlebih dahulu pada menu
          <a href="/kriteria" class="text-blue-600 font-semibold underline">Data Kriteria & AHP</a>.
        </p>
      </div>
    {:else if indikatorList.length === 0}
      <div class="flex flex-col items-center justify-center p-10 text-center border border-dashed border-slate-300 rounded-xl bg-slate-50/50">
        <HelpCircle class="w-8 h-8 text-slate-300 mb-3" />
        <p class="text-sm font-bold text-slate-700">Belum ada indikator pada kriteria ini</p>
        <p class="text-xs text-slate-500 mt-1">Klik "Tambah Indikator" untuk membuat pertanyaan observasi pertama.</p>
      </div>
    {:else}
      <div class="space-y-3">
        {#each indikatorList as item, index (item.id)}
          <div class="flex flex-col gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 md:p-5 transition hover:border-blue-300 hover:bg-white hover:shadow-sm md:flex-row md:items-center md:justify-between">
            <div class="min-w-0 space-y-2">
              <div class="flex flex-wrap items-center gap-2">
                <span class="inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-100">
                  Pertanyaan #{index + 1}
                </span>
                <span class="inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-white text-slate-500 border border-slate-200">
                  {kriteriaAktif?.inisial}
                </span>
              </div>
              <p class="text-sm font-medium text-slate-900 leading-relaxed break-words">{item.pertanyaan}</p>
            </div>

            <div class="flex items-center gap-2 shrink-0 self-end md:self-center">
              <Button variant="ghost" className="p-2 bg-white border border-slate-200" title="Ubah Pertanyaan" on:click={() => openEditIndikator(item)}>
                <Edit2 class="w-3.5 h-3.5 mr-1 " />
                <span>Edit</span>
              </Button>
              <Button variant="danger" className="p-2 bg-rose-50 text-rose-600 hover:bg-rose-100 shadow-none border-none" title="Hapus Indikator" on:click={() => deleteIndikator(item)}>
                <Trash2 class="w-3.5 h-3.5 mr-1 " />
                  <span>Hapus</span>
              </Button>
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </div>
</Card>
