<script>
  import { supabase } from '$lib/db/supabase';
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import Card from '$lib/components/ui/Card.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import Input from '$lib/components/ui/Input.svelte';
  import { notifySuccess, notifyError } from '$lib/notifications';
  import { invalidateCache } from '$lib/db/cache';
  import { ArrowLeft } from 'lucide-svelte';

  let user = null;
  let profile = null;
  let loadingProfile = true;
  let loadingProfil = false;
  let loadingPassword = false;

  let namaLengkap = '';
  let email = '';
  let newPassword = '';
  let confirmPassword = '';

  let errorNama = '';
  let errorEmail = '';
  let errorPassword = '';

  onMount(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      goto('/login');
      return;
    }
    user = session.user;
    email = user.email;
    await muatProfil();
  });

  async function muatProfil() {
    const { data } = await supabase
      .from('profiles')
      .select('nama_lengkap')
      .eq('id', user.id)
      .single();
    if (data) namaLengkap = data.nama_lengkap;
    loadingProfile = false;
  }

  /**
   * Menyimpan perubahan nama lengkap dan email sekaligus.
   * Email hanya dikirim bila benar-benar berubah.
   */
  async function simpanProfil() {
    errorNama = '';
    errorEmail = '';

    if (!namaLengkap.trim()) {
      errorNama = 'Nama lengkap tidak boleh kosong.';
      return;
    }
    if (!email.trim()) {
      errorEmail = 'Email tidak boleh kosong.';
      return;
    }

    loadingProfil = true;
    const emailLama = user.email;
    const emailBerubah = email.trim() !== emailLama;
    let errEmailBaru = null;

    // 1. Simpan nama lengkap ke tabel profiles.
    const { error: errProfil } = await supabase
      .from('profiles')
      .update({ nama_lengkap: namaLengkap.trim() })
      .eq('id', user.id);

    if (errProfil) {
      errorNama = errProfil.message;
    } else {
      await invalidateCache('user_profile_' + user.id);
      window.dispatchEvent(
        new CustomEvent('profil-diubah', { detail: { nama_lengkap: namaLengkap.trim() } })
      );
    }

    // 2. Simpan email ke Supabase Auth bila berubah.
    if (emailBerubah) {
      const { error } = await supabase.auth.updateUser({ email: email.trim() });
      if (error) {
        errEmailBaru = error;
        errorEmail = error.message;
      }
    }

    loadingProfil = false;

    if (!errProfil && !errEmailBaru) {
      notifySuccess(
        emailBerubah
          ? 'Profil diperbarui. Cek email lama dan baru untuk konfirmasi perubahan email.'
          : 'Nama lengkap berhasil diperbarui.'
      );
    } else {
      notifyError('Ada perubahan yang gagal disimpan. Periksa pesan kesalahan pada isian.');
    }
  }

  async function updatePassword() {
    errorPassword = '';
    if (!newPassword) {
      errorPassword = 'Password baru tidak boleh kosong.';
      return;
    }
    if (newPassword !== confirmPassword) {
      errorPassword = 'Konfirmasi password tidak cocok.';
      return;
    }
    loadingPassword = true;
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      errorPassword = error.message;
      notifyError('Gagal memperbarui password: ' + error.message);
    } else {
      notifySuccess('Password berhasil diperbarui.');
      newPassword = '';
      confirmPassword = '';
    }
    loadingPassword = false;
  }
</script>

<div class="w-full flex justify-center">
  <div class="w-full max-w-4xl space-y-6">
    <a href="/" class="inline-flex items-center text-sm font-semibold text-slate-600 hover:text-blue-600 transition mb-2">
      <ArrowLeft class="w-4 h-4 mr-1.5" /> Kembali ke Dashboard
    </a>

    <h1 class="text-2xl font-bold text-slate-900">Kelola Akun</h1>

    {#if loadingProfile}
      <p>Memuat...</p>
    {:else}
      <div class="grid md:grid-cols-2 gap-6 items-start">
        <Card className="space-y-6">
          <h2 class="text-lg font-bold text-slate-900">Informasi Profil</h2>
          <div class="space-y-4">
            <Input label="Nama Lengkap" bind:value={namaLengkap} error={errorNama} />
            <Input label="Email" type="email" bind:value={email} error={errorEmail} />
            <Button on:click={simpanProfil} loading={loadingProfil} className="w-full">Simpan Perubahan</Button>
          </div>
        </Card>

        <Card className="space-y-6">
          <h2 class="text-lg font-bold text-slate-900">Keamanan</h2>
          <div class="space-y-4">
            <Input label="Password Baru" type="password" bind:value={newPassword} />
            <Input label="Konfirmasi Password" type="password" bind:value={confirmPassword} error={errorPassword} />
            <Button on:click={updatePassword} loading={loadingPassword} variant="danger" className="w-full">Update Password</Button>
          </div>
        </Card>
      </div>
    {/if}
  </div>
</div>
