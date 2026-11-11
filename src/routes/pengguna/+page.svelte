<script>
  import { onMount } from 'svelte';
  import { notifyError, notifySuccess } from '$lib/notifications';
  import { confirmAction } from '$lib/confirm';
  import PageHeader from '$lib/components/ui/PageHeader.svelte';
  import LoadingState from '$lib/components/ui/LoadingState.svelte';
  import Card from '$lib/components/ui/Card.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import Table from '$lib/components/ui/Table.svelte';
  import EmptyState from '$lib/components/ui/EmptyState.svelte';
  import Modal from '$lib/components/ui/Modal.svelte';
  import Input from '$lib/components/ui/Input.svelte';
  import { UserCheck, Key, Shield, UserPlus } from 'lucide-svelte';
  import { ambilDaftarPengguna, buatAkunTimPendidik, resetPasswordPengguna } from '$lib/services/pengguna';

  let users = [];
  let loading = true;
  let saving = false;
  let resettingId = null;

  // Modal tambah user
  let showModal = false;
  let namaLengkap = '';
  let email = '';
  let password = '';

  onMount(async () => {
    await fetchUsers();
  });

  async function fetchUsers() {
    loading = true;
    try {
      users = await ambilDaftarPengguna();
    } catch (err) {
      notifyError(err.message);
    } finally {
      loading = false;
    }
  }

  function openAddModal() {
    namaLengkap = '';
    email = '';
    password = '';
    showModal = true;
  }

  function closeModal() {
    showModal = false;
  }

  async function createUser() {
    if (!namaLengkap.trim() || !email.trim() || !password.trim()) {
      notifyError('Semua kolom wajib diisi.');
      return;
    }

    saving = true;
    try {
      await buatAkunTimPendidik({
        nama_lengkap: namaLengkap.trim(),
        email: email.trim(),
        password: password.trim()
      });

      notifySuccess('Berhasil membuat akun tim pendidik baru.');
      closeModal();
      await fetchUsers();
    } catch (err) {
      notifyError(err.message);
    } finally {
      saving = false;
    }
  }

  async function resetPassword(user) {
    const confirmed = await confirmAction({
      title: `Reset Password untuk "${user.nama_lengkap || user.email}"?`,
      message: 'Password akun ini akan di-reset menjadi default: 123123.'
    });

    if (!confirmed) return;

    resettingId = user.id;
    try {
      await resetPasswordPengguna(user.id);

      notifySuccess(`Password ${user.nama_lengkap || user.email} berhasil di-reset ke 123123.`);
    } catch (err) {
      notifyError(err.message);
    } finally {
      resettingId = null;
    }
  }

  function formatDate(isoString) {
    if (!isoString) return '-';
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return isoString;
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  }
</script>

<svelte:head>
  <title>Kelola Pengguna - SPK Transisi PAUD-SD</title>
</svelte:head>

<div class="space-y-8">
  <PageHeader
    title="Kelola Pengguna"
    subtitle="Kelola akun Tim Pendidik dan reset password akun dengan hak akses Kepala Sekolah."
  />

  {#if loading}
    <LoadingState text="Memuat daftar pengguna..." />
  {:else}
    <Card className="p-0">
      <div class="py-4 mb-4 md:p-6 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
            <UserCheck class="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h2 class="text-lg font-bold text-slate-900 tracking-tight">Daftar Akun Pengguna</h2>
            <p class="text-xs text-slate-500 mt-1 leading-relaxed">
              Kepala Sekolah dapat mendaftarkan akun Tim Pendidik baru dan melakukan reset password.
            </p>
          </div>
        </div>
        <div class="flex items-center gap-3">
          <span class="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-lg whitespace-nowrap w-fit">
            Total: {users.length} Akun
          </span>
          <Button on:click={openAddModal}>
            <UserPlus class="w-4 h-4 mr-1.5" />
            <span>Tambah Tim Pendidik</span>
          </Button>
        </div>
      </div>

      {#if users.length === 0}
        <div class="p-5 md:p-6">
          <EmptyState
            title="Belum ada pengguna"
            description="Tambahkan akun tim pendidik baru untuk mulai berkolaborasi."
            icon={UserCheck}
          >
            <div slot="action">
              <Button on:click={openAddModal}>
                <UserPlus class="w-4 h-4 mr-1.5" />
                <span>Tambah Tim Pendidik</span>
              </Button>
            </div>
          </EmptyState>
        </div>
      {:else}
        <Table
          columns={[
            { key: 'no', label: 'No.', class: 'w-16' },
            { key: 'nama_lengkap', label: 'Nama Lengkap' },
            { key: 'email', label: 'Email' },
            { key: 'role', label: 'Role' },
            { key: 'created_at', label: 'Tanggal Dibuat' },
            { key: 'aksi', label: 'Aksi', class: 'text-right w-48' }
          ]}
          data={users.map((u, i) => ({ ...u, no: i + 1 }))}
        >
          <svelte:fragment slot="cell" let:item let:col>
            {#if col.key === 'nama_lengkap'}
              <span class="text-sm font-bold text-slate-800">
                {item.nama_lengkap || '-'}
              </span>
            {:else if col.key === 'email'}
              <span class="text-xs font-medium text-slate-600">
                {item.email || '-'}
              </span>
            {:else if col.key === 'role'}
              {#if item.role === 'kepsek'}
                <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-extrabold uppercase tracking-wider bg-purple-100 text-purple-800 border border-purple-200">
                  <Shield class="w-3 h-3 text-purple-600" />
                  Kepala Sekolah
                </span>
              {:else}
                <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-extrabold uppercase tracking-wider bg-blue-100 text-blue-800 border border-blue-200">
                  <UserCheck class="w-3 h-3 text-blue-600" />
                  Tim Pendidik
                </span>
              {/if}
            {:else if col.key === 'created_at'}
              <span class="text-xs font-medium text-slate-500">
                {formatDate(item.created_at)}
              </span>
            {:else if col.key === 'aksi'}
              <div class="flex justify-end">
                {#if item.role !== 'kepsek'}
                  <Button
                    variant="outline"
                    className="px-3 py-2 h-auto text-[11px] font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 border-amber-200 shadow-none"
                    loading={resettingId === item.id}
                    on:click={() => resetPassword(item)}
                    title="Reset Password ke 123123"
                  >
                    <Key class="w-3.5 h-3.5 mr-1 text-amber-600" />
                    <span>Reset Password</span>
                  </Button>
                {:else}
                  <span class="text-[11px] font-medium text-slate-400">-</span>
                {/if}
              </div>
            {:else}
              {item[col.key] !== undefined && item[col.key] !== null ? item[col.key] : '-'}
            {/if}
          </svelte:fragment>
        </Table>

        <div class="px-6 py-4 bg-slate-50/50 border-t border-slate-100">
          <p class="text-[11px] text-slate-500 font-medium leading-relaxed">
            Tombol <strong>Reset Password</strong> akan mengubah sandi akun pengguna bersangkutan menjadi <code class="bg-slate-200 px-1 py-0.5 rounded text-slate-800 font-mono">123123</code> seketika tanpa mengganggu sesi Anda.
          </p>
        </div>
      {/if}
    </Card>
  {/if}
</div>

<!-- Modal Tambah Tim Pendidik -->
<Modal isOpen={showModal} title="Tambah Akun Tim Pendidik" on:close={closeModal}>
  <div class="space-y-5">
    <Input
      id="nama-lengkap"
      label="Nama Lengkap"
      bind:value={namaLengkap}
      placeholder="Contoh: Siti Aminah, S.Pd."
      required
    />

    <Input
      id="email"
      label="Email"
      type="email"
      bind:value={email}
      placeholder="Contoh: pendidik@tkkencana.sch.id"
      required
    />

    <Input
      id="password"
      label="Password Awal"
      type="password"
      bind:value={password}
      placeholder="Minimal 6 karakter"
      required
    />

    <div class="p-3.5 bg-blue-50 border border-blue-100 rounded-xl text-[11px] font-medium text-blue-800 leading-relaxed flex items-start gap-2">
      <Shield class="w-4 h-4 shrink-0 mt-0.5" />
      <span>Akun yang dibuat otomatis memiliki role <strong>Tim Pendidik</strong> dan dapat langsung digunakan untuk login ke aplikasi.</span>
    </div>
  </div>

  <div slot="footer">
    <Button variant="ghost" on:click={closeModal}>Batal</Button>
    <Button loading={saving} on:click={createUser}>
      <span>Simpan Akun</span>
    </Button>
  </div>
</Modal>
