<script>
  import { Loader2, CheckCircle2, Check, CloudOff } from 'lucide-svelte';

  export let kriteria;
  export let opsiList = [];
  export let menyimpan = null;
  export let jawabanAnakMap = {};
  export let statusLokal = {};
  export let onPilihJawaban = () => {};
  /** Set id indikator yang ditampilkan; null = tampilkan semua. */
  export let filterId = null;
</script>

{#if !kriteria?.indikator || kriteria.indikator.length === 0}
  <p class="text-xs text-slate-400 font-medium">Belum ada indikator pada kriteria ini.</p>
{:else}
  <div class="space-y-3">
    {#each kriteria.indikator as indikator, indikatorIndex (indikator.id)}
      <!-- Nomor (C1.1, C1.2, ...) memakai urutan asli, jadi tetap benar saat difilter. -->
      {#if !filterId || filterId.has(indikator.id)}
        <div class="rounded-xl border border-slate-200 bg-slate-50 p-4 md:p-5 space-y-3 transition hover:bg-white">
          <div class="flex items-start gap-2">
            <span class="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold font-mono bg-blue-50 text-blue-700 border border-blue-100 shrink-0 mt-0.5">
              {kriteria.inisial}.{indikatorIndex + 1}
            </span>
            <p class="text-sm font-medium text-slate-900 leading-relaxed">
              {indikator.pertanyaan}
            </p>
          </div>

          <div class="grid grid-cols-1 gap-2 sm:flex sm:flex-wrap sm:items-center">
            {#each opsiList as opsi (opsi.id)}
              {@const terpilih = jawabanAnakMap[indikator.id]?.opsi_jawaban_id === opsi.id}
              <button
                type="button"
                on:click={() => onPilihJawaban(indikator, opsi)}
                disabled={menyimpan === indikator.id}
                title={opsi.keterangan || ''}
                class="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-bold text-left transition disabled:opacity-60 {terpilih
                  ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm shadow-emerald-200'
                  : 'bg-white border-slate-200 text-slate-600 hover:border-emerald-300 hover:text-emerald-700'}"
              >
                {#if terpilih}
                  <Check class="w-3.5 h-3.5 shrink-0" />
                {/if}
                {opsi.opsi}
              </button>
            {/each}
            {#if menyimpan === indikator.id}
              <Loader2 class="w-4 h-4 text-blue-600 animate-spin" />
            {/if}
          </div>

          {#if statusLokal[indikator.id] === 'menunggu_sinkronisasi'}
            <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 border border-slate-200">
              <CloudOff class="w-3 h-3" /> Tersimpan di perangkat, menunggu sinkronisasi
            </span>
          {:else if statusLokal[indikator.id] === 'tersinkron'}
            <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-100">
              <CheckCircle2 class="w-3 h-3" /> Tersinkron
            </span>
          {/if}
        </div>
      {/if}
    {/each}
  </div>
{/if}