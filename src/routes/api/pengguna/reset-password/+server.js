import { json } from '@sveltejs/kit';
import { pastikanKepsek } from '$lib/server/otorisasi';

/**
 * Mereset password akun menjadi default '123123' (khusus kepsek).
 */
export async function POST({ request }) {
  const { admin, error } = await pastikanKepsek(request);
  if (error) return error;

  const { userId, newPassword = '123123' } = await request.json();

  if (!userId) {
    return json({ error: 'User ID wajib disertakan.' }, { status: 400 });
  }

  const { error: resetError } = await admin.auth.admin.updateUserById(userId, {
    password: newPassword
  });

  if (resetError) return json({ error: resetError.message }, { status: 400 });

  return json({ success: true, message: `Password berhasil di-reset ke ${newPassword}` });
}
