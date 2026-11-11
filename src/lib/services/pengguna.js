import { supabase } from '$lib/db/supabase';

const PESAN_KONEKSI = 'Gagal menghubungi server. Periksa koneksi Anda.';

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
 * Menjalankan fetch dan membaca respons JSON dengan penanganan kegagalan jaringan
 * maupun respons yang bukan JSON.
 * @param {string} url
 * @param {RequestInit} [options]
 * @returns {Promise<{ res: Response, data: any }>}
 */
async function mintaJson(url, options) {
  let res;
  try {
    res = await fetch(url, options);
  } catch {
    throw new Error(PESAN_KONEKSI);
  }

  try {
    return { res, data: await res.json() };
  } catch {
    throw new Error(PESAN_KONEKSI);
  }
}

/**
 * Mengambil daftar pengguna (khusus kepsek).
 * @returns {Promise<Array<Object>>} Daftar profil pengguna.
 */
export async function ambilDaftarPengguna() {
  const { res, data } = await mintaJson('/api/pengguna', { headers: await headerOtorisasi() });
  if (!res.ok) throw new Error(data.error || 'Gagal memuat daftar pengguna.');
  return data.users || [];
}

/**
 * Membuat akun tim pendidik baru (khusus kepsek).
 * @param {{ nama_lengkap: string, email: string, password: string }} payload
 * @returns {Promise<Object>} Data user yang dibuat.
 */
export async function buatAkunTimPendidik(payload) {
  const { res, data } = await mintaJson('/api/pengguna', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(await headerOtorisasi()) },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error(data.error || 'Gagal membuat akun tim pendidik.');
  return data.user;
}

export async function resetPasswordPengguna(userId) {
  const { res, data } = await mintaJson('/api/pengguna/reset-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(await headerOtorisasi()) },
    body: JSON.stringify({ userId })
  });
  if (!res.ok) throw new Error(data.error || 'Gagal mereset password.');
  return data.message;
}

/**
 * Menghapus akun pengguna (khusus kepsek).
 * @param {string} userId - ID user yang akan dihapus.
 * @returns {Promise<string>} Pesan sukses dari server.
 */
export async function hapusAkunPengguna(userId) {
  const { res, data } = await mintaJson('/api/pengguna', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json', ...(await headerOtorisasi()) },
    body: JSON.stringify({ userId })
  });
  if (!res.ok) throw new Error(data.error || 'Gagal menghapus akun.');
  return data.message;
}
