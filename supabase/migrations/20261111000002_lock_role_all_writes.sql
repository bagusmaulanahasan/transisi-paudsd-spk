-- Migration: Kunci kolom `role` pada semua jalur tulis (INSERT, UPDATE, DELETE).
--
-- Migrasi sebelumnya hanya menjaga UPDATE sehingga:
--   1. INSERT dari pengguna terautentikasi masih bisa membuat profil dengan role apa pun,
--   2. DELETE profil tidak dibatasi sama sekali.
--
-- Migrasi ini:
--   * Memaksa role 'tim_pendidik' pada INSERT bila pemanggil bukan service_role/kepsek.
--   * Menolak perubahan role pada UPDATE bila pemanggil bukan service_role/kepsek.
--   * Menolak DELETE profil dari peran API (anon/authenticated) kecuali service_role.
--   * Merapikan RLS policy profiles agar tidak lagi memberi akses penuh ke authenticated.

-- ---------------------------------------------------------------------------
-- Helper: apakah pemanggil saat ini berperan sebagai Kepala Sekolah.
-- SECURITY DEFINER agar tidak memicu rekursi policy SELECT pada profiles.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.saya_kepsek()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT coalesce(
    (SELECT p.role = 'kepsek' FROM public.profiles p WHERE p.id = auth.uid()),
    false
  );
$$;

-- ---------------------------------------------------------------------------
-- Trigger INSERT/UPDATE: jaga kolom role.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.jaga_role_profil()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role_pemanggil TEXT;
BEGIN
  -- Service Role (dipakai API server) selalu diizinkan.
  IF coalesce(current_setting('request.jwt.claim.role', true), '') = 'service_role' THEN
    RETURN NEW;
  END IF;

  SELECT p.role INTO v_role_pemanggil FROM public.profiles p WHERE p.id = auth.uid();

  IF TG_OP = 'INSERT' THEN
    -- Pengguna biasa tidak boleh menentukan role saat membuat profil.
    IF v_role_pemanggil IS DISTINCT FROM 'kepsek' THEN
      NEW.role := 'tim_pendidik';
    END IF;
    RETURN NEW;
  END IF;

  IF NEW.role IS DISTINCT FROM OLD.role AND v_role_pemanggil IS DISTINCT FROM 'kepsek' THEN
    RAISE EXCEPTION 'Hanya Kepala Sekolah yang boleh mengubah role pengguna.'
      USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_cegah_ubah_role ON public.profiles;
DROP TRIGGER IF EXISTS trg_jaga_role_profil ON public.profiles;

CREATE TRIGGER trg_jaga_role_profil
BEFORE INSERT OR UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.jaga_role_profil();

-- ---------------------------------------------------------------------------
-- Trigger DELETE: hanya service_role (atau peran internal database) yang boleh
-- menghapus profil. Peran internal tetap diizinkan agar cascade dari
-- auth.users (mis. admin.auth.admin.deleteUser) tidak ikut gagal.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.tolak_hapus_profil()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF current_user IN ('anon', 'authenticated')
     AND coalesce(current_setting('request.jwt.claim.role', true), '') <> 'service_role' THEN
    RAISE EXCEPTION 'Menghapus profil hanya diizinkan melalui layanan server.'
      USING ERRCODE = '42501';
  END IF;

  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS trg_tolak_hapus_profil ON public.profiles;

CREATE TRIGGER trg_tolak_hapus_profil
BEFORE DELETE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.tolak_hapus_profil();

-- ---------------------------------------------------------------------------
-- RLS policy profiles: baca profil sendiri (atau semua oleh kepsek),
-- ubah profil sendiri (kolom role tetap dijaga trigger), tanpa akses
-- INSERT/DELETE untuk authenticated.
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.profiles;
DROP POLICY IF EXISTS "profil_baca_sendiri_atau_kepsek" ON public.profiles;
DROP POLICY IF EXISTS "profil_ubah_sendiri" ON public.profiles;

CREATE POLICY "profil_baca_sendiri_atau_kepsek"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id OR public.saya_kepsek());

CREATE POLICY "profil_ubah_sendiri"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Sengaja tidak ada policy INSERT/DELETE untuk authenticated:
-- kedua operasi hanya boleh lewat service_role (bypass RLS).
