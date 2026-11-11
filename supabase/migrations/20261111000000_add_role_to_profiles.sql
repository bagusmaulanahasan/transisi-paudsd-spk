-- Migration: Tambah kolom role pada tabel profiles
-- Role yang diizinkan: 'kepsek' (Kepala Sekolah) dan 'tim_pendidik' (Tim Pendidik/Guru).

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'tim_pendidik'
CHECK (role IN ('kepsek', 'tim_pendidik'));

-- Pastikan seluruh profil lama memiliki role yang valid.
UPDATE public.profiles SET role = 'tim_pendidik' WHERE role IS NULL;
