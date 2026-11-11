<script>
  import { supabase } from '$lib/db/supabase';
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import Card from '$lib/components/ui/Card.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import Input from '$lib/components/ui/Input.svelte';
  import { ArrowLeft } from 'lucide-svelte';

  let user = null;
  let profile = null;
  let loadingProfile = true;
  let loadingNama = false;
  let loadingEmail = false;
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
    const { data, error } = await supabase
      .from('profiles')
      .select('nama_lengkap')
      .eq('id', user.id)
      .single();
    if (data) namaLengkap = data.nama_lengkap;
    loadingProfile = false;
  }

  async function updateNama() {
    loadingNama = true;
    errorNama = '';
    const { error } = await supabase
      .from('profiles')
      .update({ nama_lengkap: namaLengkap })
      .eq('id', user.id);
    if (error) errorNama = error.message;
    loadingNama = false;
  }

  async function updateEmail() {
    loadingEmail = true;
    errorEmail = '';
    const { error } = await supabase.auth.updateUser({ email });
    if (error) errorEmail = error.message;
    else alert('Email berhasil diperbarui. Silakan cek email lama dan baru untuk konfirmasi.');
    loadingEmail = false;
  }

  async function updatePassword() {
    errorPassword = '';
    if (newPassword !== confirmPassword) {
      errorPassword = 'Konfirmasi password tidak cocok';
      return;
    }
    loadingPassword = true;
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) errorPassword = error.message;
    else {
      alert('Password berhasil diperbarui');
      newPassword = '';
      confirmPassword = '';
    }
    loadingPassword = false;
  }
</script>

<div class="max-w-5xl mx-auto space-y-6">
  <a href="/" class="inline-flex items-center text-sm font-semibold text-slate-600 hover:text-blue-600 transition mb-2">
    <ArrowLeft class="w-4 h-4 mr-1.5" /> Kembali ke Dashboard
  </a>
  
  <h1 class="text-2xl font-bold text-slate-900">Kelola Akun</h1>

  {#if loadingProfile}
    <p>Memuat...</p>
  {:else}
    <div class="grid md:grid-cols-2 gap-6">
      <Card className="space-y-6 h-fit">
        <h2 class="text-lg font-bold text-slate-900">Informasi Profil</h2>
        <div class="space-y-4">
          <Input label="Nama Lengkap" bind:value={namaLengkap} error={errorNama} />
          <Button on:click={updateNama} loading={loadingNama} className="w-full">Simpan Nama</Button>
          
          <Input label="Email" type="email" bind:value={email} error={errorEmail} />
          <Button on:click={updateEmail} loading={loadingEmail} variant="outline" className="w-full">Update Email</Button>
        </div>
      </Card>

      <Card className="space-y-6 h-fit">
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
