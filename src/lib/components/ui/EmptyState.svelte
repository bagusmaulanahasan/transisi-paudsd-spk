<script>
  import { FolderSearch } from 'lucide-svelte';

  export let title = 'Tidak ada data';
  export let description = 'Belum ada data yang tersedia untuk ditampilkan saat ini.';
  export let icon = null;
  export let className = '';
</script>

<div class={`flex flex-col items-center justify-center p-12 text-center bg-white rounded-2xl border border-slate-200/80 shadow-sm ${className}`}>
  <div class="p-4 rounded-2xl bg-blue-50 text-blue-600 mb-4 shadow-sm">
    {#if icon}
      <svelte:component this={icon} class="w-8 h-8" />
    {:else}
      <FolderSearch class="w-8 h-8" />
    {/if}
  </div>
  
  <h3 class="text-base font-extrabold text-slate-900 tracking-tight">{title}</h3>
  <p class="text-xs text-slate-500 mt-1 max-w-sm font-medium">{description}</p>

  {#if $$slots.action}
    <div class="mt-6">
      <slot name="action" />
    </div>
  {/if}
</div>
