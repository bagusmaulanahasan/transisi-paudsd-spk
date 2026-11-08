<script>
  import { confirmState } from '$lib/confirm';
  import { AlertTriangle, X } from 'lucide-svelte';
  import { fade, scale } from 'svelte/transition';

  function close(value) {
    if ($confirmState.resolve) {
      $confirmState.resolve(value);
    }
    confirmState.update(s => ({ ...s, isOpen: false, resolve: null }));
  }

  function handleKeydown(e) {
    if (e.key === 'Escape' && $confirmState.isOpen) {
      close(false);
    }
  }
</script>

<svelte:window on:keydown={handleKeydown} />

{#if $confirmState.isOpen}
  <!-- Backdrop -->
  <div 
    class="fixed inset-0 z-[60] bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4"
    transition:fade={{ duration: 150 }}
    on:click|self={() => close(false)}
  >
    <!-- Modal Content -->
    <div 
      class="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-slate-200"
      transition:scale={{ duration: 200, start: 0.95 }}
    >
      <div class="p-6">
        <div class="flex items-start justify-between">
          <div class="flex items-center space-x-3 text-red-600 bg-red-50 p-2 rounded-xl">
            <AlertTriangle class="w-6 h-6" />
          </div>
          <button 
            on:click={() => close(false)}
            class="p-2 rounded-lg text-slate-400 hover:bg-slate-100 transition"
          >
            <X class="w-5 h-5" />
          </button>
        </div>

        <div class="mt-4">
          <h3 class="text-lg font-bold text-slate-900">{$confirmState.title}</h3>
          <p class="mt-2 text-sm text-slate-500 leading-relaxed">
            {$confirmState.message}
          </p>
        </div>

        <div class="mt-8 flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-3 space-y-3 space-y-reverse sm:space-y-0">
          <button
            type="button"
            on:click={() => close(false)}
            class="px-5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition"
          >
            {$confirmState.cancelText}
          </button>
          <button
            type="button"
            on:click={() => close(true)}
            class="px-5 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 shadow-sm shadow-red-200 transition"
          >
            {$confirmState.confirmText}
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}
