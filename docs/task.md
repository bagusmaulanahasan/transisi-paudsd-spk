# Daftar Task Pengembangan SPK Transisi PAUD-SD

## 1. Inisialisasi & Skema Database Supabase
- **Detail:** Buat migration SQL untuk tabel: `profiles`, `kriteria`, `perbandingan_ahp`, `indikator`, `opsi_jawaban`, `kelas`, `anak`, `penilaian`, `detail_penilaian`, `moora_config_kelas`, `hasil_perhitungan`. Aktifkan RLS dan buat policy keamanan yang tepat.
- **Cara Cek:** Jalankan kueri SQL di Supabase atau periksa tab Table Editor untuk memastikan semua tabel dan RLS aktif tanpa error.

## 2. Autentikasi & Manajemen Sesi (SvelteKit + Supabase Auth)
- **Detail:** Buat halaman Login (`/login`) dengan email & password, validasi error, enkripsi/keamanan sesi, proteksi rute, dan fungsi Logout.
- **Cara Cek:** Buka aplikasi di browser, coba login dengan akun yang valid, pastikan diarahkan ke halaman utama, dan coba akses rute terlindung saat belum login (harus ter-redirect).

## 3. Fitur Kelola Kriteria & AHP
- **Detail:** Halaman CRUD Kriteria dengan inisial otomatis (`C1`, `C2`, ... disable). Form Perbandingan Berpasangan AHP, hitung normalisasi, bobot, CI, dan CR. Validasi CR ≤ 0,10.
- **Cara Cek:** Tambah beberapa kriteria, isi matriks perbandingan, pastikan CR dihitung benar dan menolak jika CR > 0,10.

## 4. Fitur Kelola Indikator Pertanyaan & Opsi Jawaban
- **Detail:** CRUD Opsi Jawaban dengan penomoran poin otomatis (1, 2, 3, ... disable). CRUD Indikator Pertanyaan per kriteria yang dipilih.
- **Cara Cek:** Pilih kriteria, tambahkan indikator pertanyaan dan opsi jawaban, pastikan poin terisi otomatis mulai dari 1.

## 5. Fitur Kelola Kelas & Data Anak (Alternatif)
- **Detail:** CRUD Data Kelas (tampilan tabel, tombol Edit khusus). CRUD Data Anak (NIS, Nama) dalam konteks kelas yang dipilih dengan validasi NIS unik.
- **Cara Cek:** Pilih kelas, tambahkan data anak ke kelas tersebut, pastikan tabel dapat digulir horizontal pada layar kecil.

## 6. Fitur Penilaian Anak
- **Detail:** Pilih kelas lalu anak, tampilkan daftar kriteria dan indikator pertanyaan beserta opsi jawaban. Simpan jawaban, hitung total poin per kriteria, beri label warna kategori (Rendah=Hijau, Sedang=Kuning, Tinggi=Merah).
- **Cara Cek:** Isi penilaian untuk setiap anak, lalu periksa apakah nilai alternatif dan kategori warna muncul dengan benar.

## 7. Perhitungan MOORA, Konfigurasi Sturges, & Perankingan
- **Detail:** Tombol **Lakukan Penilaian** untuk kelas baru (matriks keputusan, normalisasi rasio, bobot AHP, nilai Yi, kategori Sturges awal, simpan konfigurasi). Perhitungan ulang otomatis saat jawaban diubah tanpa mengubah baseline interval Sturges awal.
- **Cara Cek:** Klik "Lakukan Penilaian", periksa hasil nilai Yi dan perankingan, ubah salah satu jawaban anak, pastikan ranking/Yi ter-update tanpa merubah batas interval Sturges awal.

## 8. Laporan Penilaian (Read Only)
- **Detail:** Halaman laporan per kelas yang menampilkan tahapan transparan (kriteria, matriks AHP, bobot, CR, matriks keputusan, normalisasi, nilai berbobot, Yi, interval Sturges, ranking akhir).
- **Cara Cek:** Buka menu laporan per kelas, verifikasi bahwa data bersifat *read-only* dan mencakup rincian lengkap dari AHP sampai MOORA.

## 9. PWA, Offline-First (IndexedDB), & Mobile-First UI
- **Detail:** Konfigurasi Service Worker, Web App Manifest, dan sinkronisasi lokal IndexedDB ke Supabase saat online.
- **Cara Cek:** Uji instalasi PWA, matikan koneksi internet, pastikan data tersimpan lokal bisa dibaca, dan lakukan perubahan offline untuk diuji sinkronisasinya saat online kembali.
