<script>
  import Card from '$lib/components/ui/Card.svelte';

  export let kelasList = [];
  export let tahunList = [];
  export let selectedTahun = '';
  export let selectedKelasId = null;
  export let onGantiTahun = () => {};
  export let onGantiKelas = () => {};

  $: filteredKelas = kelasList.filter(k => k.tahun_ajaran === selectedTahun);
</script>

<Card className="p-5 md:p-6 space-y-4">
  <div class="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
    <div>
      <label for="pilih-tahun" class="block text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-2">Pilih Tahun Ajaran</label>
      <select
        id="pilih-tahun"
        bind:value={selectedTahun}
        on:change={onGantiTahun}
        class="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition cursor-pointer"
      >
        {#each tahunList as th}
          <option value={th}>{th}</option>
        {/each}
      </select>
    </div>

    <div>
      <label for="pilih-kelas" class="block text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-2">Pilih Kelas</label>
      <select
        id="pilih-kelas"
        bind:value={selectedKelasId}
        on:change={onGantiKelas}
        class="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition cursor-pointer"
      >
        {#each filteredKelas as kelas (kelas.id)}
          <option value={kelas.id}>{kelas.nama_kelas}</option>
        {/each}
      </select>
    </div>
  </div>
  <p class="text-[11px] text-slate-400 font-medium leading-relaxed">
    Nilai Yi dan ranking dihitung otomatis dari jawaban terbaru seluruh anak di kelas ini.
  </p>
</Card>
