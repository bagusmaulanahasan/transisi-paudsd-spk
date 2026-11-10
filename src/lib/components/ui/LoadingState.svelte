<script>
  import { Loader2 } from 'lucide-svelte';

  export let text = 'Memuat data...';
  export let className = '';
</script>

<div class={`flex flex-col items-center justify-center p-12 bg-white rounded-2xl border border-slate-200/80 shadow-sm ${className}`}>
  <div class="flex flex-col items-center space-y-3">
    <Loader2 class="w-8 h-8 text-blue-600 animate-spin" />
    {#if text}
      <p class="text-slate-500 text-xs font-bold tracking-tight">{text}</p>
    {/if}
  </div>
</div>
