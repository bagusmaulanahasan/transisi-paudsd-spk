<script>
  import { toasts, tutupToast } from '$lib/notifications';
  import { X, CheckCircle2, AlertCircle } from 'lucide-svelte';
</script>

<div class="fixed top-20 right-6 z-[100] flex flex-col gap-2 w-[calc(100vw-2rem)] max-w-sm pointer-events-none">
  {#each $toasts as toast (toast.id)}
    <div
      role="status"
      class="pointer-events-auto flex items-start gap-3 rounded-xl border px-4 py-3 shadow-xl {toast.tipe === 'error'
        ? 'bg-red-50 border-red-200 text-red-800'
        : toast.tipe === 'success'
          ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
          : 'bg-slate-50 border-slate-200 text-slate-800'}"
    >
      {#if toast.tipe === 'error'}
        <AlertCircle class="w-5 h-5 shrink-0 mt-0.5" />
      {:else if toast.tipe === 'success'}
        <CheckCircle2 class="w-5 h-5 shrink-0 mt-0.5" />
      {:else}
        <AlertCircle class="w-5 h-5 shrink-0 mt-0.5" />
      {/if}

      <p class="flex-1 text-sm font-medium leading-snug">{toast.pesan}</p>

      <button
        type="button"
        class="shrink-0 rounded-lg p-1 opacity-70 transition hover:opacity-100 hover:bg-black/5 focus:outline-none"
        aria-label="Tutup notifikasi"
        on:click={() => tutupToast(toast.id)}
      >
        <X class="w-4 h-4" />
      </button>
    </div>
  {/each}
</div>
