<script>
  import Card from '$lib/components/ui/Card.svelte';

  export let kelasList = [];
  export let selectedKelasId = null;
  export let onGantiKelas = () => {};
</script>

<Card className="p-5 md:p-6 space-y-4">
  <div class="max-w-md">
    <label for="pilih-kelas" class="block text-[11px] font-extrabold uppercase tracking-widest text-slate-500 mb-2">Pilih Kelas</label>
    <select
      id="pilih-kelas"
      bind:value={selectedKelasId}
      on:change={onGantiKelas}
      class="w-full md:w-80 px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition cursor-pointer"
    >
      {#each kelasList as kelas (kelas.id)}
        <option value={kelas.id}>{kelas.nama_kelas} — {kelas.tahun_ajaran}</option>
      {/each}
    </select>
  </div>
  <p class="text-[11px] text-slate-400 font-medium leading-relaxed">
    Nilai Yi dan ranking dihitung otomatis dari jawaban terbaru seluruh anak di kelas ini.
  </p>
</Card>
