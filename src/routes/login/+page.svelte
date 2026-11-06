<script>
  import { supabase } from '$lib/supabase';
  import { goto } from '$app/navigation';

  let email = '';
  let password = '';
  let loading = false;
  let errorMessage = '';

  /**
   * Menangani proses login pengguna menggunakan Supabase Auth.
   */
  async function handleLogin() {
    loading = true;
    errorMessage = '';

    if (!navigator.onLine) {
      errorMessage = 'Koneksi internet tidak tersedia. Login pertama membutuhkan koneksi online.';
      loading = false;
      return;
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      errorMessage = error.message === 'Invalid login credentials' 
        ? 'Email atau password yang Anda masukkan salah.' 
        : error.message;
      loading = false;
    } else {
      goto('/');
    }
  }
</script>

<svelte:head>
  <title>Login - SPK Transisi PAUD-SD</title>
</svelte:head>

<div class="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-slate-50 text-slate-800">
  <!-- Panel Kiri: Hero Image & Branding (Tampil pada layar besar LG) -->
  <div class="hidden lg:flex flex-col justify-between p-12 bg-blue-900 text-white relative overflow-hidden">
    <div class="absolute inset-0 z-0 opacity-25">
      <img 
        src="https://i.pinimg.com/736x/d4/8b/1a/d48b1adc24b4ec15d9617eaeeff82c2a.jpg" 
        alt="Anak-anak belajar dan bermain" 
        class="w-full h-full object-cover"
      />
    </div>
    
    <div class="relative z-10">
      <span class="inline-block px-3 py-1 bg-blue-700/60 rounded-full text-xs font-semibold tracking-wide uppercase text-blue-200 backdrop-blur-sm mb-4">
        SPK TK Islam Kencana
      </span>
      <h1 class="text-4xl font-extrabold tracking-tight leading-tight">
        SPK Transisi PAUD–SD
      </h1>
      <p class="mt-3 text-lg text-blue-100 max-w-md">
        Sistem Penunjang Keputusan Prioritas Kebutuhan Stimulasi Anak Menggunakan Metode AHP dan MOORA.
      </p>
    </div>

    <div class="relative z-10 text-xs text-blue-200">
      &copy; 2026 TK Islam Kencana. Hak cipta dilindungi.
    </div>
  </div>

  <!-- Panel Kanan: Form Login Responsif -->
  <div class="flex items-center justify-center p-6 sm:p-12">
    <div class="w-full max-w-md bg-white p-8 sm:p-10 rounded-2xl shadow-sm border border-slate-200">
      <div class="mb-8">
        <h2 class="text-2xl font-bold text-slate-900">Masuk ke Akun Pendidik</h2>
        <p class="mt-2 text-sm text-slate-500">
          Gunakan akun bersama tim pendidik untuk masuk.
        </p>
      </div>

      {#if errorMessage}
        <div class="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm flex items-start space-x-3">
          <svg class="w-5 h-5 text-red-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
          </svg>
          <span>{errorMessage}</span>
        </div>
      {/if}

      <form on:submit|preventDefault={handleLogin} class="space-y-6">
        <div>
          <label for="email" class="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2">
            Email Pendidik
          </label>
          <input
            id="email"
            type="email"
            bind:value={email}
            required
            placeholder="pendidik@sekolah.sch.id"
            class="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition text-slate-900 bg-slate-50/50"
          />
        </div>

        <div>
          <label for="password" class="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2">
            Password
          </label>
          <input
            id="password"
            type="password"
            bind:value={password}
            required
            placeholder="••••••••"
            class="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition text-slate-900 bg-slate-50/50"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          class="w-full py-3.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold rounded-xl transition shadow-sm flex items-center justify-center space-x-2"
        >
          {#if loading}
            <svg class="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Memproses...</span>
          {:else}
            <span>Masuk</span>
          {/if}
        </button>
      </form>
    </div>
  </div>
</div>
