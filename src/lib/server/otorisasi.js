import { json } from '@sveltejs/kit';
import { getSupabaseAdmin } from './supabaseAdmin';

/**
 * Memastikan permintaan berasal dari pengguna yang sedang login
 * dan memiliki role 'kepsek'.
 *
 * @param {Request} request - Objek Request dari handler SvelteKit.
 * @returns {Promise<{ admin?: import('@supabase/supabase-js').SupabaseClient, user?: Object, error?: Response }>}
 *   `admin` + `user` bila lolos, atau `error` berisi Response siap dikembalikan.
 */
export async function pastikanKepsek(request) {
  const admin = getSupabaseAdmin();
  if (!admin) {
    return {
      error: json(
        { error: 'SUPABASE_SERVICE_ROLE_KEY belum diset pada file .env server.' },
        { status: 500 }
      )
    };
  }

  const header = request.headers.get('authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
  if (!token) {
    return { error: json({ error: 'Sesi tidak ditemukan. Silakan login ulang.' }, { status: 401 }) };
  }

  const { data: authData, error: authError } = await admin.auth.getUser(token);
  if (authError || !authData?.user) {
    return { error: json({ error: 'Sesi tidak valid. Silakan login ulang.' }, { status: 401 }) };
  }

  const { data: profil } = await admin
    .from('profiles')
    .select('role')
    .eq('id', authData.user.id)
    .single();

  if (profil?.role !== 'kepsek') {
    return { error: json({ error: 'Hanya Kepala Sekolah yang boleh mengakses fitur ini.' }, { status: 403 }) };
  }

  return { admin, user: authData.user };
}
