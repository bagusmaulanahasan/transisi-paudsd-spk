<script>
  import Card from '$lib/components/ui/Card.svelte';
  import { Trophy, Target } from 'lucide-svelte';

  export let barisSaya = null;
  export let ahpSiap = false;
  export let jumlahLengkap = 0;
</script>

<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
  <Card className="p-5 md:p-6">
    <div class="flex items-center justify-between gap-3">
      <div>
        <p class="text-[11px] font-extrabold uppercase tracking-widest text-slate-400">Nilai Yi</p>
        <p class="text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
          {barisSaya && barisSaya.lengkap && barisSaya.yi !== null ? barisSaya.yi.toFixed(3) : '—'}
        </p>
      </div>
      <div class="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
        <Trophy class="w-5 h-5 text-blue-600" />
      </div>
    </div>
    <p class="text-[11px] font-medium text-slate-500 mt-3 leading-relaxed">
      {#if !ahpSiap}
        Bobot AHP belum siap sehingga Yi belum dapat dihitung.
      {:else if barisSaya && !barisSaya.lengkap}
        Jawaban belum lengkap ({barisSaya.terjawab}/{barisSaya.total} indikator).
      {:else}
        Nilai optimasi MOORA, dibulatkan 3 angka di belakang koma.
      {/if}
    </p>
  </Card>

  <Card className="p-5 md:p-6">
    <div class="flex items-center justify-between gap-3">
      <div>
        <p class="text-[11px] font-extrabold uppercase tracking-widest text-slate-400">Ranking</p>
        <p class="text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
          {barisSaya && barisSaya.ranking !== null ? `#${barisSaya.ranking}` : '—'}
        </p>
      </div>
      <div class="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
        <Target class="w-5 h-5 text-blue-600" />
      </div>
    </div>
    <p class="text-[11px] font-medium text-slate-500 mt-3 leading-relaxed">
      {#if !ahpSiap}
        Ranking menunggu bobot AHP yang konsisten.
      {:else if barisSaya && !barisSaya.lengkap}
        Belum masuk ranking karena jawaban belum lengkap.
      {:else if barisSaya}
        Peringkat dari {jumlahLengkap} anak yang jawabannya lengkap.
      {:else}
        Ranking belum tersedia.
      {/if}
    </p>
  </Card>
</div>
