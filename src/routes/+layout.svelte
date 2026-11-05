<script>
  import '../app.css';
  import { supabase } from '$lib/supabase'
  import { onMount } from 'svelte'

  let user = null
  let role = null

  onMount(async () => {
    const { data: { session } } = await supabase.auth.getSession()
    user = session?.user || null
    if (user) {
      const { data } = await supabase.from('profiles').select('role, full_name').eq('id', user.id).single()
      role = data?.role || 'guru'
    }
  })

  async function handleLogout() {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }
</script>

<div class="min-h-screen bg-slate-50 flex">
  <!-- Sidebar -->
  <aside class="w-64 bg-white border-r border-slate-200 hidden md:block">
    <div class="p-6">
      <h1 class="text-lg font-bold text-slate-900">SPK Transisi PAUD-SD</h1>
      <p class="text-xs text-slate-500 mt-1">TK Islam Kencana</p>
    </div>
    <nav class="mt-4 space-y-1 px-3">
      <a href="/" class="block px-3 py-2 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-100">Dashboard</a>
    </nav>
  </aside>

  <!-- Main Content -->
  <div class="flex-1 flex flex-col">
    <header class="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6">
      <h2 class="text-sm font-medium text-slate-700">Sistem Penunjang Keputusan</h2>
      {#if user}
        <div class="flex items-center gap-4">
          <span class="text-sm text-slate-600">{user.email}</span>
          <button on:click={handleLogout} class="text-sm text-red-600 hover:underline">Keluar</button>
        </div>
      {:else}
        <a href="/login" class="text-sm text-blue-600 font-medium hover:underline">Login</a>
      {/if}
    </header>

    <main class="flex-1 p-6">
      <slot />
    </main>
  </div>
</div>
