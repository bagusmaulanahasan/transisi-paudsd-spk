-- Migration: Cegah pengguna biasa (tim_pendidik) menaikkan role dirinya sendiri.
-- Tanpa proteksi ini, siapa pun yang sudah login dapat mengubah kolom `role`
-- pada baris profilnya lewat Supabase client dan mendapat hak akses kepsek.

CREATE OR REPLACE FUNCTION public.cegah_ubah_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pemanggil TEXT;
BEGIN
  IF new.role IS DISTINCT FROM old.role THEN
    -- Service Role (dipakai API server) selalu diizinkan.
    IF coalesce(current_setting('request.jwt.claim.role', true), '') = 'service_role' THEN
      RETURN new;
    END IF;

    SELECT role INTO v_pemanggil FROM public.profiles WHERE id = auth.uid();
    IF v_pemanggil IS DISTINCT FROM 'kepsek' THEN
      RAISE EXCEPTION 'Hanya Kepala Sekolah yang boleh mengubah role pengguna.';
    END IF;
  END IF;

  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS trg_cegah_ubah_role ON public.profiles;

CREATE TRIGGER trg_cegah_ubah_role
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.cegah_ubah_role();
