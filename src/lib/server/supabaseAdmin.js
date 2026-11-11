import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';
import { env } from '$env/dynamic/private';

/**
 * Client Supabase dengan hak akses admin (Service Role Key).
 *
 * Dibuat secara lazy agar proses build tidak gagal ketika
 * SUPABASE_SERVICE_ROLE_KEY belum tersedia di environment.
 *
 * @returns {import('@supabase/supabase-js').SupabaseClient | null}
 *   Client admin, atau null bila SUPABASE_SERVICE_ROLE_KEY belum diset.
 */
let cachedClient = null;

export function getSupabaseAdmin() {
  if (cachedClient) return cachedClient;

  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) return null;

  cachedClient = createClient(PUBLIC_SUPABASE_URL, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  return cachedClient;
}
