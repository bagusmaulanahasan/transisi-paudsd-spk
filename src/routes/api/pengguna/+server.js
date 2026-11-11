import { json } from '@sveltejs/kit';
import { supabaseAdmin } from '$lib/server/supabaseAdmin';

export async function GET({ request }) {
  const { data: profiles, error } = await supabaseAdmin
    .from('profiles')
    .select('id, nama_lengkap, email, role, created_at')
    .order('created_at', { ascending: false });

  if (error) return json({ error: error.message }, { status: 400 });
  return json({ users: profiles });
}

export async function POST({ request }) {
  const { nama_lengkap, email, password } = await request.json();

  if (!nama_lengkap || !email || !password) {
    return json({ error: 'Nama lengkap, email, dan password wajib diisi.' }, { status: 400 });
  }

  const { data: authUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { nama_lengkap }
  });

  if (createError) return json({ error: createError.message }, { status: 400 });

  const { error: profileError } = await supabaseAdmin.from('profiles').upsert({
    id: authUser.user.id,
    nama_lengkap,
    email,
    role: 'tim_pendidik'
  });

  if (profileError) return json({ error: profileError.message }, { status: 400 });

  return json({ success: true, user: authUser.user });
}
