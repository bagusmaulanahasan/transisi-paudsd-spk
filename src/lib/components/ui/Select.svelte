<script>
  export let label = '';
  export let value = '';
  export let options = []; // Array of { value, label }
  export let placeholder = 'Pilih...';
  export let error = '';
  export let required = false;
  export let disabled = false;
  export let id = '';
  export let className = '';

  const selectId = id || `select-${Math.random().toString(36).substring(2, 9)}`;
</script>

<div class={`flex flex-col gap-1.5 ${className}`}>
  {#if label}
    <label for={selectId} class="text-xs font-extrabold text-slate-700 tracking-tight">
      {label}
      {#if required}
        <span class="text-rose-500 ml-0.5">*</span>
      {/if}
    </label>
  {/if}

  <div class="relative">
    <select
      id={selectId}
      {disabled}
      bind:value
      class={`w-full appearance-none px-3.5 py-2.5 bg-white text-slate-900 text-xs font-medium rounded-xl border transition duration-150 focus:outline-none focus:ring-2 focus:ring-offset-0 disabled:opacity-50 disabled:bg-slate-50 disabled:cursor-not-allowed pr-10 ${
        error
          ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-200'
          : 'border-slate-200 hover:border-slate-300 focus:border-blue-600 focus:ring-blue-100'
      }`}
      on:change
      on:blur
      on:focus
    >
      {#if placeholder}
        <option value="" disabled selected={!value}>{placeholder}</option>
      {/if}
      {#each options as opt}
        <option value={opt.value}>
          {opt.label}
        </option>
      {/each}
    </select>
    
    <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500">
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
      </svg>
    </div>
  </div>

  {#if error}
    <p class="text-[11px] font-bold text-rose-600 mt-0.5">{error}</p>
  {/if}
</div>
