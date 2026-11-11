import { supabase } from '$lib/db/supabase';

/**
 * Mengambil access token sesi aktif untuk dikirim ke API server.
 * @returns {Promise<Object>} Header Authorization siap pakai.
 */
async function headerOtorisasi() {
  const { data } = await supabase.auth.getSession();
  const token = data?.session?.access_token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/**
 * Mengambil daftar pengguna (khusus kepsek).
 * @returns {Promise<Array<Object>>} Daftar profil pengguna.
 */
export async function ambilDaftarPengguna() {
  const res = await fetch('/api/pengguna', { headers: await headerOtorisasi() });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Gagal memuat daftar pengguna.');
  return data.users || [];
}

/**
 * Membuat akun tim pendidik baru (khusus kepsek).
 * @param {{ nama_lengkap: string, email: string, password: string }} payload
 * @returns {Promise<Object>} Data user yang dibuat.
 */
export async function buatAkunTimPendidik(payload) {
  const res = await fetch('/api/pengguna', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(await headerOtorisasi()) },
    body: JSON.stringify(payload)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Gagal membuat akun tim pendidik.');
  return data.user;
}

/**
 * Mereset password akun ke default '123123' (khusus kepsek).
 * @param {string} userId - ID user yang akan direset.
 * @returns {Promise<string>} Pesan sukses dari server.
 */
export async function resetPasswordPengguna(userId) {
  const res = await fetch('/api/pengguna/reset-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(await headerOtorisasi()) },
    body: JSON.stringify({ userId, newPassword: '123123' })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Gagal mereset password.');
  return data.message;
}
