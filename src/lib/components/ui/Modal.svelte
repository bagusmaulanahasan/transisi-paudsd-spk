<script>
  import { createEventDispatcher, onMount, onDestroy } from 'svelte';
  import { X } from 'lucide-svelte';

  export let isOpen = false;
  export let title = '';
  export let maxWidth = 'max-w-xl';

  const dispatch = createEventDispatcher();

  function close() {
    dispatch('close');
  }

  function handleKeydown(e) {
    if (e.key === 'Escape' && isOpen) {
      close();
    }
  }

  onMount(() => {
    window.addEventListener('keydown', handleKeydown);
  });

  onDestroy(() => {
    window.removeEventListener('keydown', handleKeydown);
  });
</script>

{#if isOpen}
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm transition-opacity">
    <div 
      class={`w-full ${maxWidth} bg-white rounded-2xl shadow-xl border border-slate-200/80 overflow-hidden transform transition-all flex flex-col max-h-[90vh]`}
      role="dialog"
      aria-modal="true"
    >
      <!-- Header -->
      <div class="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <h3 class="text-base font-extrabold text-slate-900 tracking-tight">{title}</h3>
        <button 
          type="button" 
          aria-label="Tutup"
          class="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition"
          on:click={close}
        >
          <X class="w-5 h-5" />
        </button>
      </div>

      <!-- Body -->
      <div class="p-6 overflow-y-auto flex-1 text-sm text-slate-600">
        <slot />
      </div>

      <!-- Footer (jika ada slot footer) -->
      {#if $$slots.footer}
        <div class="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-end space-x-3">
          <slot name="footer" />
        </div>
      {/if}
    </div>
  </div>
{/if}
