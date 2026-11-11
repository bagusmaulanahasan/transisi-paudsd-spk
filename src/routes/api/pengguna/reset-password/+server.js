import { json } from '@sveltejs/kit';
import { pastikanKepsek } from '$lib/server/otorisasi';

// Password default yang selalu dipakai server; nilai dari body diabaikan.
const PASSWORD_DEFAULT = '123123';

/**
 * Mereset password akun tim pendidik menjadi default '123123' (khusus kepsek).
 */
export async function POST({ request }) {
  const { admin, error } = await pastikanKepsek(request);
  if (error) return error;

  const { userId } = await request.json();

  if (!userId) {
    return json({ error: 'User ID wajib disertakan.' }, { status: 400 });
  }

  const { data: target, error: targetError } = await admin
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .maybeSingle();

  if (targetError) {
    console.error('Gagal membaca profil target reset password:', targetError);
    return json({ error: 'Terjadi kesalahan pada server.' }, { status: 500 });
  }

  if (!target) {
    return json({ error: 'Pengguna tidak ditemukan.' }, { status: 404 });
  }

  if (target.role !== 'tim_pendidik') {
    return json(
      { error: 'Password akun Kepala Sekolah tidak dapat direset dari halaman ini.' },
      { status: 403 }
    );
  }

  const { error: resetError } = await admin.auth.admin.updateUserById(userId, {
    password: PASSWORD_DEFAULT
  });

  if (resetError) {
    console.error('Gagal mereset password pengguna:', resetError);
    return json({ error: 'Gagal mereset password pengguna.' }, { status: 500 });
  }

  return json({ success: true, message: 'Password berhasil di-reset ke 123123.' });
}
