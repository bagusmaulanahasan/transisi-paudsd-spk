-- Migration: Tambah kode anak otomatis dengan format [Inisial Kelas]-[Nomor Urut].
--
-- Nilai dibuat sekali saat anak ditambahkan dan bersifat statis: nomor anak yang
-- sudah dihapus tidak dipakai ulang. Keunikan dijaga per kelas, sehingga kode
-- yang sama boleh muncul di kelas/tahun ajaran lain.

ALTER TABLE public.anak ADD COLUMN IF NOT EXISTS kode_anak TEXT;

-- Backfill data lama: inisial diambil dari token terakhir nama_kelas
-- ("Kelas B3" -> "B3"), nomor urut berdasarkan urutan pembuatan anak.
WITH bernomor AS (
  SELECT
    a.id,
    upper(regexp_replace(k.nama_kelas, '^.*\s', '')) || '-' ||
    lpad(row_number() OVER (PARTITION BY a.kelas_id ORDER BY a.created_at, a.id)::text, 2, '0') AS kode
  FROM public.anak a
  JOIN public.kelas k ON k.id = a.kelas_id
)
UPDATE public.anak a
SET kode_anak = b.kode
FROM bernomor b
WHERE b.id = a.id;

ALTER TABLE public.anak ALTER COLUMN kode_anak SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS anak_kelas_kode_anak_key
  ON public.anak (kelas_id, kode_anak);
