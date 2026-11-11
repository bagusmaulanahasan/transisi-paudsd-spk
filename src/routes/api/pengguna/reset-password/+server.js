import { json } from '@sveltejs/kit';
import { supabaseAdmin } from '$lib/server/supabaseAdmin';

export async function POST({ request }) {
  const { userId, newPassword = '123123' } = await request.json();

  if (!userId) {
    return json({ error: 'User ID wajib disertakan.' }, { status: 400 });
  }

  const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
    password: newPassword
  });

  if (error) return json({ error: error.message }, { status: 400 });

  return json({ success: true, message: `Password berhasil di-reset ke ${newPassword}` });
}
