-- Migration: Ganti kolom NIS menjadi nama panggilan anak.
-- Nama panggilan boleh kosong, tetapi bila diisi harus unik di dalam satu kelas
-- (perbandingan case-insensitive agar "Budi" dan "budi" dianggap sama).

ALTER TABLE public.anak RENAME COLUMN nis TO nama_panggilan;

-- Constraint lama (anak_kelas_id_nis_key) otomatis mengikuti nama kolom baru,
-- tetapi masih case-sensitive. Ganti dengan unique index case-insensitive
-- yang tetap mengizinkan NULL.
ALTER TABLE public.anak DROP CONSTRAINT IF EXISTS anak_kelas_id_nis_key;

CREATE UNIQUE INDEX IF NOT EXISTS anak_kelas_nama_panggilan_key
  ON public.anak (kelas_id, lower(nama_panggilan))
  WHERE nama_panggilan IS NOT NULL;
