# SPK Transisi Stimulasi PAUD-SD Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Membangun aplikasi SPK AHP-MOORA berbasis SvelteKit (JavaScript murni), Supabase Auth/DB, IndexedDB offline-first, dan PWA sesuai PRD.

**Architecture:** Frontend SPA/SSR menggunakan SvelteKit dengan koneksi Supabase client, penyimpanan lokal IndexedDB dengan antrean sinkronisasi, dan kalkulator matematis mandiri untuk AHP serta MOORA.

**Tech Stack:** SvelteKit, JavaScript (tanpa TypeScript), Tailwind CSS, Supabase, IndexedDB, Service Worker / PWA.

**Spec:** `docs/prd.md`

## Global Constraints

- Gunakan JavaScript murni, bukan TypeScript.
- Pendekatan mobile-first; tabel responsif dengan scroll horizontal.
- Inisial kriteria otomatis (C1, C2, dst.) dan poin opsi jawaban otomatis (1, 2, dst.).
- Nilai $Y_i$ MOORA tidak dikategorikan (cukup nilai dan ranking).

## Review Focus

- Validasi Consistency Ratio (CR) AHP harus ≤ 0,10 sebelum bobot dapat digunakan.
- Validasi kelengkapan jawaban indikator sebelum perhitungan MOORA dilakukan.
- Penanganan sinkronisasi offline ke Supabase via antrean IndexedDB.

---

### Task 1: Inisialisasi Proyek, Konfigurasi Tailwind & IndexedDB Helper

**Files:**

- Create: `src/lib/db.js` (IndexedDB helper)
- Modify: `tailwind.config.js`

**Interfaces:**

- Consumes: Supabase client dari `src/lib/supabase.js`.
- Produces: Helper IndexedDB untuk penyimpanan lokal dan antrean sinkronisasi (`sync_queue`).

- [x] **Step 1: Periksa dan verifikasi `src/lib/supabase.js` yang sudah ada**
- [x] **Step 2: Buat helper IndexedDB `src/lib/db.js` untuk cache data dan `sync_queue`**
- [x] **Step 3: Commit perubahan awal**

---

### Task 2: Modul Autentikasi (Login & Proteksi Route)

**Files:**

- Create: `src/routes/login/+page.svelte`
- Modify: `src/routes/+layout.svelte`, `src/routes/+layout.js` (atau hook proteksi session)

**Interfaces:**

- Consumes: Supabase Auth (`supabase.auth.signInWithPassword`, `supabase.auth.signOut`).
- Produces: Halaman login, validasi sesi aktif, dan proteksi akses dashboard/menu utama (wajib login).

- [x] **Step 1: Buat halaman login `src/routes/login/+page.svelte` dengan validasi email dan password**
- [x] **Step 2: Konfigurasi layout utama `src/routes/+layout.svelte` dengan styling Tailwind, status indikator online/offline, dan tombol logout**
- [x] **Step 3: Tambahkan pemeriksaan sesi auth agar pengguna wajib login sebelum mengakses fitur aplikasi**
- [x] **Step 4: Commit modul autentikasi**

---

### Task 3: Modul Kelola Kriteria & Perbandingan AHP

**Files:**

- Create: `src/routes/kriteria/+page.svelte`, `src/lib/ahp.js`
- Test: `src/lib/ahp.test.js` (atau test manual via konsol/halaman uji)

**Interfaces:**

- Consumes: Daftar kriteria dengan jenis (Benefit/Cost) dan nilai matriks perbandingan berpasangan.
- Produces: Bobot prioritas kriteria ($w_j$), Consistency Index (CI), dan Consistency Ratio (CR).

- [x] **Step 1: Buat fungsi perhitungan AHP di `src/lib/ahp.js` (normalisasi matriks, bobot eigen, CI, CR)**
- [x] **Step 2: Buat halaman CRUD kriteria `src/routes/kriteria/+page.svelte` dengan inisial otomatis C1, C2, dll.**
- [x] **Step 3: Tambahkan modul input matriks perbandingan AHP dan validasi CR ≤ 0,10**
- [x] **Step 4: Commit fitur kriteria & AHP**

---

### Task 4: Modul Kelola Indikator Pertanyaan & Opsi Jawaban

**Files:**

- Create: `src/routes/indikator/+page.svelte`
- Create: `src/lib/opsi.js`, `src/lib/opsi.test.js`
- Create: `docs/design-test.md` (panduan test design universal)
- Modify: `src/routes/kriteria/+page.svelte` (jika diperlukan relasi)

**Interfaces:**

- Consumes: Kriteria ID dan data opsi jawaban.
- Produces: CRUD Indikator pertanyaan dan opsi jawaban dengan poin otomatis (1, 2, 3, dst.).

- [x] **Step 1: Buat halaman pengelolaan indikator dan opsi jawaban `src/routes/indikator/+page.svelte`**
- [x] **Step 2: Terapkan aturan poin otomatis (1, 2, 3, ...) pada opsi poin jawaban yang tidak dapat diubah manual**
- [x] **Step 3: Commit modul indikator & opsi jawaban**

---

### Task 5: Modul Kelola Kelas dan Data Anak (Alternatif)

**Files:**

- Create: `src/routes/kelas/+page.svelte`, `src/routes/kelas/[id]/+page.svelte`
- Create: `src/lib/anak.js`, `src/lib/anak.test.js`

**Interfaces:**

- Consumes: Data kelas (nama, tahun ajaran) dan data anak (NIS, nama, kelas_id).
- Produces: Manajemen kelas dan daftar anak per kelas.

- [x] **Step 1: Buat halaman CRUD Kelas dalam bentuk tabel `src/routes/kelas/+page.svelte`**
- [x] **Step 2: Buat halaman detail kelas & CRUD Data Anak `src/routes/kelas/[id]/+page.svelte` dengan validasi NIS unik**
- [x] **Step 3: Commit modul kelas dan anak**

---

### Task 6: Modul Penilaian Anak & Algoritma MOORA

**Files:**

- Create: `src/routes/penilaian/+page.svelte`, `src/lib/moora.js`

**Interfaces:**

- Consumes: Bobot AHP, jawaban indikator anak, dan jenis kriteria (Benefit/Cost).
- Produces: Total skor alternatif per kriteria ($X_{ij}$), matriks normalisasi, nilai $Y_i$, dan ranking.

- [x] **Step 1: Buat fungsi perhitungan MOORA di `src/lib/moora.js`**
- [x] **Step 2: Buat halaman pengisian penilaian anak `src/routes/penilaian/+page.svelte` (validasi kelengkapan jawaban indikator)**
- [x] **Step 3: Integrasikan tombol "Lakukan Penilaian" dan pembaruan otomatis saat ada perubahan jawaban atau penambahan anak**
- [x] **Step 4: Commit modul penilaian dan MOORA**

---

### Task 7: Modul Laporan Penilaian Read-Only & PWA Support

**Files:**

- Create: `src/routes/laporan/+page.svelte`
- Modify: `static/manifest.json`, Service Worker registration

**Interfaces:**

- Consumes: Data kriteria, matriks AHP, bobot, matriks keputusan, normalisasi, nilai $Y_i$, dan ranking.
- Produces: Haporan transparan read-only dan dukungan PWA offline-first.

- [ ] **Step 1: Buat halaman laporan read-only `src/routes/laporan/+page.svelte` menampilkan tahapan dari AHP hingga ranking MOORA**
- [ ] **Step 2: Konfigurasi Web App Manifest dan Service Worker untuk PWA & offline-first**
- [ ] **Step 3: Commit laporan dan PWA**
