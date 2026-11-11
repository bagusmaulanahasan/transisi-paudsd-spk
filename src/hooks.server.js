import { createServerClient } from '@supabase/ssr';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';
import { redirect } from '@sveltejs/kit';

// Path yang tidak perlu dicek sama sekali.
const PREFIX_DILEWATI = ['/login', '/api', '/icons', '/assets', '/favicon'];

// Path yang dibatasi per role. Hanya path ini yang memicu query ke database
// agar request lain (aset, halaman umum) tetap ringan.
const PATH_DIBATASI = ['/kriteria', '/indikator', '/pengguna', '/penilaian'];

// Path yang hanya boleh dibuka tim_pendidik / kepsek.
const PATH_KHUSUS_KEPSEK = ['/kriteria', '/indikator', '/pengguna'];
const PATH_KHUSUS_TIM_PENDIDIK = ['/penilaian'];

/**
 * @param {string} pathname
 * @param {string[]} daftar
 * @returns {boolean}
 */
function cocokPath(pathname, daftar) {
  return daftar.some((awalan) => pathname === awalan || pathname.startsWith(awalan + '/'));
}

/**
 * Guard server-side: menolak akses langsung ke rute yang bukan hak role pengguna.
 * @type {import('@sveltejs/kit').Handle}
 */
export async function handle({ event, resolve }) {
  const { pathname } = event.url;

  // Lewati halaman login, API, aset ikon/gambar, dan berkas statis (mengandung titik).
  if (pathname.includes('.') || PREFIX_DILEWATI.some((awalan) => pathname.startsWith(awalan))) {
    return resolve(event);
  }

  // Tidak ada rute yang dibatasi pada path ini: tidak perlu menyentuh database.
  if (!cocokPath(pathname, PATH_DIBATASI)) {
    return resolve(event);
  }

  const supabase = createServerClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => event.cookies.getAll(),
      setAll: (daftarCookies) => {
        daftarCookies.forEach(({ name, value, options }) => {
          event.cookies.set(name, value, { ...options, path: '/' });
        });
      }
    }
  });

  const {
    data: { user }
  } = await supabase.auth.getUser();

  // Tanpa sesi: biarkan layout yang mengarahkan ke /login.
  if (!user) {
    return resolve(event);
  }

  const { data: profil } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  // Role kosong/tidak dikenal diperlakukan sebagai tim_pendidik.
  const role = profil?.role === 'kepsek' ? 'kepsek' : 'tim_pendidik';

  if (role === 'tim_pendidik' && cocokPath(pathname, PATH_KHUSUS_KEPSEK)) {
    redirect(303, '/');
  }

  if (role === 'kepsek' && cocokPath(pathname, PATH_KHUSUS_TIM_PENDIDIK)) {
    redirect(303, '/');
  }

  return resolve(event);
}
