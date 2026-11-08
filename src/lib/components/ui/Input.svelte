<script>
  export let label = '';
  export let value = '';
  export let type = 'text';
  export let placeholder = '';
  export let error = '';
  export let required = false;
  export let disabled = false;
  export let id = '';
  export let className = '';
  export let min = undefined;
  export let max = undefined;
  export let step = undefined;

  const inputId = id || `input-${Math.random().toString(36).substring(2, 9)}`;
</script>

<div class={`flex flex-col gap-1.5 ${className}`}>
  {#if label}
    <label for={inputId} class="text-xs font-extrabold text-slate-700 tracking-tight">
      {label}
      {#if required}
        <span class="text-rose-500 ml-0.5">*</span>
      {/if}
    </label>
  {/if}
  
  <input
    id={inputId}
    {type}
    {placeholder}
    {disabled}
    {min}
    {max}
    {step}
    bind:value
    class={`w-full px-3.5 py-2.5 bg-white text-slate-900 text-xs font-medium rounded-xl border transition duration-150 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-offset-0 disabled:opacity-50 disabled:bg-slate-50 disabled:cursor-not-allowed ${
      error
        ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-200'
        : 'border-slate-200 hover:border-slate-300 focus:border-blue-600 focus:ring-blue-100'
    }`}
    on:input
    on:change
    on:blur
    on:focus
  />

  {#if error}
    <p class="text-[11px] font-bold text-rose-600 mt-0.5">{error}</p>
  {/if}
</div>
