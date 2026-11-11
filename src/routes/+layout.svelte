<script>
  import '../app.css';
  import { supabase } from '$lib/db/supabase';
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { 
    LayoutDashboard, 
    Scale, 
    HelpCircle, 
    Users, 
    Calculator, 
    FileText, 
    Menu, 
    X, 
    User, 
    LogOut, 
    Settings, 
    Wifi, 
    WifiOff,
    BarChart3,
    UserCheck
  } from 'lucide-svelte';
  import { cachedFetch } from '$lib/db/cache';
  import ToastHost from '$lib/components/ToastHost.svelte';
  import ConfirmModal from '$lib/components/ConfirmModal.svelte';

  let user = null;
  let profile = null;
  let loading = true;
  let onlineStatus = true;
  let mobileMenuOpen = false;
  let profileDropdownOpen = false;

  onMount(async () => {
    onlineStatus = navigator.onLine;
    window.addEventListener('online', () => onlineStatus = true);
    window.addEventListener('offline', () => onlineStatus = false);

    const { data: { session } } = await supabase.auth.getSession();
    user = session?.user || null;
    
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }

    if (user) {
      await muatProfil(user.id);
    }

    loading = false;

    if (!user && $page.url.pathname !== '/login') {
      goto('/login');
    }

    supabase.auth.onAuthStateChange(async (event, session) => {
      user = session?.user || null;
      if (user) {
        await muatProfil(user.id);
      } else {
        profile = null;
      }
      if (!user && window.location.pathname !== '/login') {
        goto('/login');
      }
    });
  });

  /**
   * Memuat profil user dari cache lokal lebih dulu, lalu memperbaruinya dari Supabase di latar belakang.
   * @param {string} userId - ID user yang sedang login.
   */
  async function muatProfil(userId) {
    const data = await cachedFetch(
      'user_profile_' + userId,
      () => supabase.from('profiles').select('nama_lengkap, email, role').eq('id', userId).single(),
      (profilBaru) => { profile = profilBaru; }
    );
    if (data) profile = data;
  }

  function checkRouteGuard(userProfile, path) {
    // Role kosong/tidak dikenal diperlakukan sebagai tim_pendidik (default aman).
    const role = userProfile?.role === 'kepsek' ? 'kepsek' : 'tim_pendidik';
    if (role === 'tim_pendidik') {
      if (path.startsWith('/kriteria') || path.startsWith('/indikator') || path.startsWith('/pengguna')) {
        goto('/', { replaceState: true });
      }
    } else if (role === 'kepsek') {
      if (path.startsWith('/penilaian')) {
        goto('/', { replaceState: true });
      }
    }
  }

  $: if (profile && $page.url.pathname) {
    checkRouteGuard(profile, $page.url.pathname);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    goto('/login');
  }

  function getInitials(name, email) {
    if (name) {
      return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
    }
    if (email) {
      return email.substring(0, 2).toUpperCase();
    }
    return 'TP';
  }

  $: isLoginPage = $page.url.pathname === '/login';
</script>

{#if loading}
  <div class="min-h-screen flex items-center justify-center bg-slate-50">
    <div class="text-slate-500 text-sm font-medium animate-pulse">Memuat aplikasi SPK PAUD-SD...</div>
  </div>
{:else if isLoginPage}
  <slot />
{:else}
  <div class="h-screen bg-slate-50 flex flex-col md:flex-row overflow-hidden relative">
    
    <!-- Mobile Header with Hamburger & Profile -->
    <header class="md:hidden h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 z-30 shrink-0">
      <div class="flex items-center space-x-3">
        <button 
          on:click={() => mobileMenuOpen = !mobileMenuOpen}
          class="p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition focus:outline-none"
          aria-label="Toggle Menu"
        >
          {#if mobileMenuOpen}
            <X class="w-6 h-6" />
          {:else}
            <Menu class="w-6 h-6" />
          {/if}
        </button>
        <span class="font-bold text-slate-900 text-base">SPK PAUD-SD</span>
      </div>

      <!-- Profile Dropdown Mobile -->
      <div class="relative">
        <button 
          on:click={() => profileDropdownOpen = !profileDropdownOpen}
          class="flex items-center space-x-2 focus:outline-none"
        >
          <div class="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold text-xs shadow-sm">
            {getInitials(profile?.nama_lengkap, user?.email)}
          </div>
        </button>

        {#if profileDropdownOpen}
          <div class="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-lg border border-slate-200 py-3 px-4 z-50">
            <div class="border-b border-slate-100 pb-3 mb-2">
              <p class="font-semibold text-slate-900 text-sm">{profile?.nama_lengkap || 'Tim Pendidik'}</p>
              <p class="text-[10px] text-blue-600 font-bold uppercase tracking-wider mt-0.5">{profile?.role === 'kepsek' ? 'Kepala Sekolah' : 'Tim Pendidik'}</p>
              <p class="text-xs text-slate-500 truncate mt-1">{user?.email}</p>
            </div>
            <a href="/profil" class="flex items-center space-x-2.5 py-2 px-2 rounded-xl text-xs font-medium text-slate-700 hover:bg-slate-50 transition">
              <Settings class="w-4 h-4 text-slate-500" />
              <span>Kelola Akun</span>
            </a>
            <button 
              on:click={handleLogout}
              class="w-full flex items-center space-x-2.5 py-2 px-2 rounded-xl text-xs font-medium text-red-600 hover:bg-red-50 transition mt-1"
            >
              <LogOut class="w-4 h-4 text-red-500" />
              <span>Logout</span>
            </button>
          </div>
        {/if}
      </div>
    </header>

    <!-- Overlay Mobile Menu -->
    {#if mobileMenuOpen}
      <div 
        class="fixed inset-0 bg-slate-900/40 z-40 md:hidden backdrop-blur-xs transition-opacity"
        on:click={() => mobileMenuOpen = false}
      ></div>
    {/if}

    <!-- Sidebar / Sidenav (Desktop & Mobile Drawer) -->
    <aside class={`
      fixed md:static inset-y-0 left-0 z-50 w-72 h-full bg-white border-r border-slate-200 flex flex-col transition-transform duration-300 ease-in-out shrink-0
      ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
    `}>
      <div class="p-6 border-b border-slate-100 hidden md:flex items-center justify-between">
        <div>
          <h1 class="text-lg font-bold text-slate-900 tracking-tight">SPK Transisi PAUD–SD</h1>
          <p class="text-xs text-slate-500 mt-0.5">TK Islam Kencana</p>
        </div>
      </div>

      <nav class="flex-1 p-4 space-y-1.5 overflow-y-auto">
        <a 
          href="/" 
          on:click={() => mobileMenuOpen = false}
          class="flex items-center space-x-3 px-3.5 py-3 rounded-xl text-sm font-medium transition {$page.url.pathname === '/' ? 'bg-blue-600 text-white font-semibold shadow-sm' : 'text-slate-600 hover:bg-slate-50'}"
        >
          <LayoutDashboard class="w-5 h-5 shrink-0" />
          <span>Dashboard</span>
        </a>

        {#if profile?.role === 'kepsek'}
          <a 
            href="/kriteria" 
            on:click={() => mobileMenuOpen = false}
            class="flex items-center space-x-3 px-3.5 py-3 rounded-xl text-sm font-medium transition {$page.url.pathname.startsWith('/kriteria') ? 'bg-blue-600 text-white font-semibold shadow-sm' : 'text-slate-600 hover:bg-slate-50'}"
          >
            <Scale class="w-5 h-5 shrink-0" />
            <span>Kriteria & AHP</span>
          </a>
          <a 
            href="/kelas" 
            on:click={() => mobileMenuOpen = false}
            class="flex items-center space-x-3 px-3.5 py-3 rounded-xl text-sm font-medium transition {$page.url.pathname.startsWith('/kelas') ? 'bg-blue-600 text-white font-semibold shadow-sm' : 'text-slate-600 hover:bg-slate-50'}"
          >
            <Users class="w-5 h-5 shrink-0" />
            <span>Kelas & Anak</span>
          </a>
          <a 
            href="/indikator" 
            on:click={() => mobileMenuOpen = false}
            class="flex items-center space-x-3 px-3.5 py-3 rounded-xl text-sm font-medium transition {$page.url.pathname.startsWith('/indikator') ? 'bg-blue-600 text-white font-semibold shadow-sm' : 'text-slate-600 hover:bg-slate-50'}"
          >
            <HelpCircle class="w-5 h-5 shrink-0" />
            <span>Indikator Pertanyaan</span>
          </a>
          <a 
            href="/laporan" 
            on:click={() => mobileMenuOpen = false}
            class="flex items-center space-x-3 px-3.5 py-3 rounded-xl text-sm font-medium transition {$page.url.pathname.startsWith('/laporan') ? 'bg-blue-600 text-white font-semibold shadow-sm' : 'text-slate-600 hover:bg-slate-50'}"
          >
            <FileText class="w-5 h-5 shrink-0" />
            <span>Laporan Perhitungan</span>
          </a>
          <a 
            href="/pengguna" 
            on:click={() => mobileMenuOpen = false}
            class="flex items-center space-x-3 px-3.5 py-3 rounded-xl text-sm font-medium transition {$page.url.pathname.startsWith('/pengguna') ? 'bg-blue-600 text-white font-semibold shadow-sm' : 'text-slate-600 hover:bg-slate-50'}"
          >
            <UserCheck class="w-5 h-5 shrink-0" />
            <span>Kelola Pengguna</span>
          </a>
        {:else}
          <!-- Default / tim_pendidik role -->
          <a 
            href="/kelas" 
            on:click={() => mobileMenuOpen = false}
            class="flex items-center space-x-3 px-3.5 py-3 rounded-xl text-sm font-medium transition {$page.url.pathname.startsWith('/kelas') ? 'bg-blue-600 text-white font-semibold shadow-sm' : 'text-slate-600 hover:bg-slate-50'}"
          >
            <Users class="w-5 h-5 shrink-0" />
            <span>Kelas & Anak</span>
          </a>
          <a 
            href="/penilaian" 
            on:click={() => mobileMenuOpen = false}
            class="flex items-center space-x-3 px-3.5 py-3 rounded-xl text-sm font-medium transition {$page.url.pathname.startsWith('/penilaian') ? 'bg-blue-600 text-white font-semibold shadow-sm' : 'text-slate-600 hover:bg-slate-50'}"
          >
            <Calculator class="w-5 h-5 shrink-0" />
            <span>Penilaian</span>
          </a>
          <a 
            href="/laporan" 
            on:click={() => mobileMenuOpen = false}
            class="flex items-center space-x-3 px-3.5 py-3 rounded-xl text-sm font-medium transition {$page.url.pathname.startsWith('/laporan') ? 'bg-blue-600 text-white font-semibold shadow-sm' : 'text-slate-600 hover:bg-slate-50'}"
          >
            <FileText class="w-5 h-5 shrink-0" />
            <span>Laporan Perhitungan</span>
          </a>
        {/if}
      </nav>

      <!-- Status Jaringan di Sidebar Bawah -->
      <div class="p-4 border-t border-slate-100 bg-slate-50/50">
        <div class="flex items-center justify-between">
          <span class="text-xs font-medium text-slate-500">Status Koneksi</span>
          <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium {onlineStatus ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}">
            {#if onlineStatus}
              <Wifi class="w-3 h-3 mr-1 text-emerald-600" /> Online
            {:else}
              <WifiOff class="w-3 h-3 mr-1 text-amber-600" /> Offline
            {/if}
          </span>
        </div>
      </div>
    </aside>

    <!-- Main Content Area -->
    <div class="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
      <!-- Desktop Header with Profile Dropdown -->
      <header class="hidden md:flex h-16 bg-white border-b border-slate-200 items-center justify-between px-8 shrink-0">
        <div class="text-sm font-semibold text-slate-800 flex items-center space-x-2">
          <BarChart3 class="w-4 h-4 text-blue-600" />
          <span>Sistem Penunjang Keputusan Prioritas Stimulasi Anak (PAUD–SD)</span>
        </div>

        <div class="relative">
          <button 
            on:click={() => profileDropdownOpen = !profileDropdownOpen}
            class="flex items-center space-x-3 focus:outline-none p-1.5 rounded-xl hover:bg-slate-50 transition border border-transparent hover:border-slate-200"
          >
            <div class="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold text-xs shadow-sm">
              {getInitials(profile?.nama_lengkap, user?.email)}
            </div>
            <div class="text-left">
              <p class="text-xs font-bold text-slate-800">{profile?.nama_lengkap || 'Tim Pendidik'}</p>
            </div>
          </button>

          {#if profileDropdownOpen}
            <div class="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-200 py-3 px-4 z-50">
              <div class="border-b border-slate-100 pb-3 mb-2">
                <p class="font-bold text-slate-900 text-sm">{profile?.nama_lengkap || 'Tim Pendidik'}</p>
                <p class="text-[10px] text-blue-600 font-bold uppercase tracking-wider mt-0.5">{profile?.role === 'kepsek' ? 'Kepala Sekolah' : 'Tim Pendidik'}</p>
                <p class="text-xs text-slate-500 truncate mt-1">{user?.email}</p>
              </div>
              <a href="/profil" class="flex items-center space-x-2.5 py-2 px-2 rounded-xl text-xs font-medium text-slate-700 hover:bg-slate-50 transition">
                <Settings class="w-4 h-4 text-slate-500" />
                <span>Kelola Akun</span>
              </a>
              <button 
                on:click={handleLogout}
                class="w-full flex items-center space-x-2.5 py-2 px-2 rounded-xl text-xs font-medium text-red-600 hover:bg-red-50 transition mt-1"
              >
                <LogOut class="w-4 h-4 text-red-500" />
                <span>Logout</span>
              </button>
            </div>
          {/if}
        </div>
      </header>

      <main class="flex-1 p-6 md:p-8 overflow-y-auto">
        <slot />
      </main>
    </div>
  </div>
{/if}

<ToastHost />
<ConfirmModal />
