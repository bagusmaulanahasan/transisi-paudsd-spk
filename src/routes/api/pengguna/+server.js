import { json } from '@sveltejs/kit';
import { pastikanKepsek } from '$lib/server/otorisasi';

/**
 * Mendaftar seluruh akun (khusus kepsek).
 */
export async function GET({ request }) {
  const { admin, error } = await pastikanKepsek(request);
  if (error) return error;

  const { data: profiles, error: dbError } = await admin
    .from('profiles')
    .select('id, nama_lengkap, email, role, created_at')
    .order('created_at', { ascending: false });

  if (dbError) return json({ error: dbError.message }, { status: 400 });
  return json({ users: profiles || [] });
}

/**
 * Membuat akun baru dengan role 'tim_pendidik' (khusus kepsek).
 * Memakai Admin API sehingga sesi kepsek yang sedang aktif tidak terganggu.
 */
export async function POST({ request }) {
  const { admin, error } = await pastikanKepsek(request);
  if (error) return error;

  const { nama_lengkap, email, password } = await request.json();

  if (!nama_lengkap?.trim() || !email?.trim() || !password?.trim()) {
    return json({ error: 'Nama lengkap, email, dan password wajib diisi.' }, { status: 400 });
  }

  const { data: authUser, error: createError } = await admin.auth.admin.createUser({
    email: email.trim(),
    password: password.trim(),
    email_confirm: true,
    user_metadata: { nama_lengkap: nama_lengkap.trim() }
  });

  if (createError) return json({ error: createError.message }, { status: 400 });

  const { error: profileError } = await admin.from('profiles').upsert({
    id: authUser.user.id,
    nama_lengkap: nama_lengkap.trim(),
    email: email.trim(),
    role: 'tim_pendidik'
  });

  if (profileError) {
    console.error('Gagal menyimpan profil pengguna baru:', profileError);

    // Bersihkan user yang sudah terlanjur dibuat agar tidak ada akun tanpa profil.
    const { error: hapusError } = await admin.auth.admin.deleteUser(authUser.user.id);
    if (hapusError) {
      console.error('Gagal menghapus user yang batal dibuat:', hapusError);
    }

    return json({ error: 'Terjadi kesalahan pada server.' }, { status: 500 });
  }

  return json({ success: true, user: { id: authUser.user.id, email: authUser.user.email } });
}
