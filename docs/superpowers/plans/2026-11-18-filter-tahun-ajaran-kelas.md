# Filter Tahun Ajaran pada Tabel Kelas

Implementasi filter tahun ajaran pada halaman daftar kelas dengan default tahun ajaran terbaru dari database.

**Goal:** Menambahkan filter dropdown tahun ajaran di halaman 'Kelas & Anak' yang otomatis memilih tahun ajaran terbaru.

**Architecture:**
- Tambahkan logika ekstraksi tahun ajaran unik dari database.
- Tambahkan state `selectedTahun` di `src/routes/kelas/+page.svelte`.
- Gunakan `derived` state atau `reactive statement` untuk memfilter `kelasList` sebelum dikirim ke `KelasListCard`.
- Perbarui `KelasListCard` untuk menampilkan dropdown filter.

**Tech Stack:** Svelte, Lucide Svelte, Supabase.

**Spec:** N/A (User request).

## Global Constraints
- Naming convention: gunakan `selectedTahun`.
- Format tahun ajaran: `YYYY/YYYY` (String).
- Tipe data `tahun_ajaran` di database tetap `TEXT`.

## Review Focus
- Filter harus reaktif ketika dropdown berubah.
- Tahun ajaran terbaru harus otomatis terpilih saat pertama kali data dimuat.
- Jika data kosong, filter tidak boleh menyebabkan error.

---

### Task 1: Update Logika Filtering di `+page.svelte`

**Files:**
- Modify: `src/routes/kelas/+page.svelte`

- [ ] **Step 1: Tambahkan state `selectedTahun` dan logika deteksi tahun terbaru**
- [ ] **Step 2: Buat reactive `filteredKelas`**
- [ ] **Step 3: Kirim `filteredKelas` dan list tahun unik ke `KelasListCard`**

### Task 2: Update UI di `KelasListCard.svelte`

**Files:**
- Modify: `src/routes/kelas/KelasListCard.svelte`

- [ ] **Step 1: Tambahkan props `selectedTahun` (bindable) dan `tahunList`**
- [ ] **Step 2: Implementasi dropdown filter di header card**

### Task 3: Verifikasi

- [ ] **Step 1: Buka halaman Kelas & Anak**
- [ ] **Step 2: Cek apakah defaultnya adalah tahun terbaru (2026/2027)**
- [ ] **Step 3: Coba ganti filter ke tahun lain (2025/2026)**
