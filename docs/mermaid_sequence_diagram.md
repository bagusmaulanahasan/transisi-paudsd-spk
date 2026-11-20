# Sequence Diagram SPK AHP-MOORA

Alur mengikuti activity diagram. Simbol: Halaman (*boundary*), Sistem (*control*), Database (*entity*). Gaya diatur lewat config Mermaid.

## 1. Sequence Diagram Login

```
sequenceDiagram
    actor U as Kepala Sekolah / Tim Pendidik
    participant UI@{ "type": "boundary" } as Halaman Login
    participant SIS@{ "type": "control" } as Sistem
    participant DB@{ "type": "entity" } as Database

    activate U
    U->>+UI: Masuk ke halaman login
    UI->>+SIS: Meminta form login
    SIS-->>UI: Form login
    UI-->>U: Menampilkan form login
    U->>UI: Mengisi form email dan password
    UI->>SIS: Mengirim data login
    SIS->>+DB: Memeriksa kesesuaian data
    DB-->>-SIS: Hasil pemeriksaan
    alt Data sesuai
        SIS-->>UI: Login berhasil
        UI-->>U: Menampilkan halaman dashboard
    else Data tidak sesuai
        SIS-->>UI: Login gagal
        UI-->>U: Menampilkan form login kembali
    end
    deactivate SIS
    deactivate UI
    deactivate U
```

## 2. Sequence Diagram Mengelola Data Kelas

```
sequenceDiagram
    actor U as Kepala Sekolah
    participant UI@{ "type": "boundary" } as Halaman Kelas & Anak
    participant SIS@{ "type": "control" } as Sistem
    participant DB@{ "type": "entity" } as Database

    activate U
    U->>+UI: Masuk ke halaman Kelas & Anak
    UI->>+SIS: Meminta data kelas
    SIS->>+DB: Mengambil data kelas
    DB-->>-SIS: Data kelas
    SIS-->>-UI: Data kelas
    UI-->>U: Menampilkan daftar kelas
    alt Tambah / edit data kelas
        U->>UI: Memilih tambah / edit data kelas
        UI->>+SIS: Meminta form data kelas
        SIS-->>-UI: Form data kelas
        UI-->>U: Menampilkan form data kelas
        U->>UI: Mengisi form
        UI->>+SIS: Mengirim data kelas
        SIS->>+DB: Memperbarui data kelas
        DB-->>-SIS: Data berhasil diperbarui
        SIS-->>-UI: Pembaruan berhasil
        UI-->>U: Menampilkan data kelas terbaru
    else Hapus data kelas
        U->>UI: Memilih hapus data kelas
        UI->>+SIS: Mengirim permintaan
        SIS->>+DB: Memperbarui data kelas
        DB-->>-SIS: Data berhasil diperbarui
        SIS-->>-UI: Pembaruan berhasil
        UI-->>U: Menampilkan data kelas terbaru
    end
    deactivate UI
    deactivate U
```

## 3. Sequence Diagram Mengelola Data Anak

```
sequenceDiagram
    actor U as Kepala Sekolah / Tim Pendidik
    participant UI@{ "type": "boundary" } as Halaman Kelas & Anak
    participant SIS@{ "type": "control" } as Sistem
    participant DB@{ "type": "entity" } as Database

    activate U
    U->>+UI: Masuk ke halaman Kelas & Anak
    UI->>+SIS: Meminta data kelas
    SIS->>+DB: Mengambil data kelas
    DB-->>-SIS: Data kelas
    SIS-->>-UI: Data kelas
    UI-->>U: Menampilkan daftar kelas
    U->>UI: Memilih salah satu kelas yang ada
    UI->>+SIS: Meminta data anak
    SIS->>+DB: Mengambil data anak
    DB-->>-SIS: Data anak
    SIS-->>-UI: Data anak
    UI-->>U: Menampilkan daftar anak
    alt Tambah / edit data anak
        U->>UI: Memilih tambah / edit data anak
        UI->>+SIS: Meminta form data anak
        SIS-->>-UI: Form data anak
        UI-->>U: Menampilkan form data anak
        U->>UI: Mengisi form
        UI->>+SIS: Mengirim data anak
        SIS->>+DB: Memperbarui data anak
        DB-->>-SIS: Data berhasil diperbarui
        SIS-->>-UI: Pembaruan berhasil
        UI-->>U: Menampilkan data anak terbaru
    else Hapus data anak
        U->>UI: Memilih hapus data anak
        UI->>+SIS: Mengirim permintaan
        SIS->>+DB: Memperbarui data anak
        DB-->>-SIS: Data berhasil diperbarui
        SIS-->>-UI: Pembaruan berhasil
        UI-->>U: Menampilkan data anak terbaru
    end
    deactivate UI
    deactivate U
```

## 4. Sequence Diagram Mengelola Penilaian

```
sequenceDiagram
    actor U as Kepala Sekolah / Tim Pendidik
    participant UI@{ "type": "boundary" } as Halaman Penilaian
    participant SIS@{ "type": "control" } as Sistem
    participant DB@{ "type": "entity" } as Database

    activate U
    U->>+UI: Masuk ke halaman Penilaian
    UI->>+SIS: Meminta data kelas
    SIS->>+DB: Mengambil data kelas
    DB-->>-SIS: Data kelas
    SIS-->>-UI: Data kelas
    UI-->>U: Menampilkan daftar kelas
    U->>UI: Memilih kelas yang akan dinilai
    UI->>+SIS: Meminta data anak
    SIS->>+DB: Mengambil data anak
    DB-->>-SIS: Data anak
    SIS-->>-UI: Data anak
    UI-->>U: Menampilkan daftar anak
    U->>UI: Memilih anak yang akan dinilai
    UI->>+SIS: Meminta indikator penilaian
    SIS->>+DB: Mengambil data indikator penilaian
    DB-->>-SIS: Data indikator penilaian
    SIS-->>-UI: Data indikator penilaian
    UI-->>U: Menampilkan indikator penilaian
    U->>UI: Mengisi indikator penilaian per kriteria
    UI->>+SIS: Mengirim hasil penilaian
    SIS->>SIS: Melakukan perhitungan MOORA
    SIS->>+DB: Menyimpan penilaian dan hasil perhitungan
    DB-->>-SIS: Data berhasil disimpan
    SIS-->>-UI: Hasil perankingan MOORA
    UI-->>U: Menampilkan hasil perankingan MOORA
    deactivate UI
    deactivate U
```

## 5. Sequence Diagram Melihat Laporan Perhitungan

```
sequenceDiagram
    actor U as Kepala Sekolah / Tim Pendidik
    participant UI@{ "type": "boundary" } as Halaman Laporan Perhitungan
    participant SIS@{ "type": "control" } as Sistem
    participant DB@{ "type": "entity" } as Database

    activate U
    U->>+UI: Masuk ke halaman Laporan Perhitungan
    UI->>+SIS: Meminta data kelas
    SIS->>+DB: Mengambil data kelas
    DB-->>-SIS: Data kelas
    SIS-->>-UI: Data kelas
    UI-->>U: Menampilkan daftar kelas
    U->>UI: Memilih kelas yang tersedia
    UI->>+SIS: Meminta detail perhitungan
    SIS->>+DB: Mengambil data hasil perhitungan
    DB-->>-SIS: Data hasil perhitungan
    SIS-->>-UI: Detail perhitungan
    UI-->>U: Menampilkan detail perhitungan Hybrid AHP-MOORA
    deactivate UI
    deactivate U
```

## 6. Sequence Diagram Mengelola Data Kriteria

```
sequenceDiagram
    actor U as Kepala Sekolah
    participant UI@{ "type": "boundary" } as Halaman Kriteria & Bobot
    participant SIS@{ "type": "control" } as Sistem
    participant DB@{ "type": "entity" } as Database

    activate U
    U->>+UI: Masuk ke halaman Kriteria & Bobot
    UI->>+SIS: Meminta data kriteria
    SIS->>+DB: Mengambil data kriteria
    DB-->>-SIS: Data kriteria
    SIS-->>-UI: Data kriteria
    UI-->>U: Menampilkan daftar kriteria
    alt Tambah / edit data kriteria
        U->>UI: Memilih tambah / edit data kriteria
        UI->>+SIS: Meminta form data kriteria
        SIS-->>-UI: Form data kriteria
        UI-->>U: Menampilkan form data kriteria
        U->>UI: Mengisi form
        UI->>+SIS: Mengirim data kriteria
        SIS->>+DB: Memperbarui data kriteria
        DB-->>-SIS: Data berhasil diperbarui
        SIS-->>-UI: Pembaruan berhasil
        UI-->>U: Menampilkan data kriteria terbaru
    else Hapus data kriteria
        U->>UI: Memilih hapus data kriteria
        UI->>+SIS: Mengirim permintaan
        SIS->>+DB: Memperbarui data kriteria
        DB-->>-SIS: Data berhasil diperbarui
        SIS-->>-UI: Pembaruan berhasil
        UI-->>U: Menampilkan data kriteria terbaru
    end
    deactivate UI
    deactivate U
```

## 7. Sequence Diagram Melakukan Pembobotan Kriteria

```
sequenceDiagram
    actor U as Kepala Sekolah
    participant UI@{ "type": "boundary" } as Halaman Kriteria & Bobot
    participant SIS@{ "type": "control" } as Sistem
    participant DB@{ "type": "entity" } as Database

    activate U
    U->>+UI: Masuk ke halaman Kriteria & Bobot
    UI->>+SIS: Meminta data kriteria dan matriks perbandingan
    SIS->>+DB: Mengambil data kriteria dan matriks perbandingan
    DB-->>-SIS: Data kriteria dan matriks perbandingan
    SIS-->>-UI: Data kriteria dan matriks perbandingan
    UI-->>U: Menampilkan daftar kriteria dan matriks perbandingan
    U->>UI: Memilih edit matriks
    UI->>+SIS: Meminta pengaktifan input matriks
    SIS-->>-UI: Input tabel matriks perbandingan aktif
    UI-->>U: Menampilkan input tabel matriks perbandingan
    U->>UI: Mengisi matriks perbandingan AHP
    UI->>+SIS: Mengirim matriks perbandingan
    SIS->>SIS: Menghitung bobot dan rasio konsistensi (CR)
    alt CR < 0,10
        SIS->>+DB: Memperbarui data pembobotan kriteria
        DB-->>-SIS: Data berhasil diperbarui
        SIS-->>UI: Pembobotan berhasil
        UI-->>U: Menampilkan bobot kriteria
    else CR >= 0,10
        SIS-->>UI: Matriks tidak konsisten
        UI-->>U: Menampilkan pesan agar mengisi ulang matriks
    end
    deactivate SIS
    deactivate UI
    deactivate U
```

## 8. Sequence Diagram Mengelola Indikator Penilaian

```
sequenceDiagram
    actor U as Kepala Sekolah
    participant UI@{ "type": "boundary" } as Halaman Indikator Penilaian
    participant SIS@{ "type": "control" } as Sistem
    participant DB@{ "type": "entity" } as Database

    activate U
    U->>+UI: Masuk ke halaman Indikator Penilaian
    UI->>+SIS: Meminta data kriteria
    SIS->>+DB: Mengambil data kriteria
    DB-->>-SIS: Data kriteria
    SIS-->>-UI: Data kriteria
    UI-->>U: Menampilkan daftar kriteria
    U->>UI: Memilih salah satu kriteria
    UI->>+SIS: Meminta data indikator penilaian
    SIS->>+DB: Mengambil data indikator penilaian
    DB-->>-SIS: Data indikator penilaian
    SIS-->>-UI: Data indikator penilaian
    UI-->>U: Menampilkan daftar indikator penilaian
    alt Tambah / edit data indikator penilaian
        U->>UI: Memilih tambah / edit data indikator penilaian
        UI->>+SIS: Meminta form data indikator penilaian
        SIS-->>-UI: Form data indikator penilaian
        UI-->>U: Menampilkan form data indikator penilaian
        U->>UI: Mengisi form
        UI->>+SIS: Mengirim data indikator penilaian
        SIS->>+DB: Memperbarui data indikator penilaian
        DB-->>-SIS: Data berhasil diperbarui
        SIS-->>-UI: Pembaruan berhasil
        UI-->>U: Menampilkan data indikator penilaian terbaru
    else Hapus data indikator penilaian
        U->>UI: Memilih hapus data indikator penilaian
        UI->>+SIS: Mengirim permintaan
        SIS->>+DB: Memperbarui data indikator penilaian
        DB-->>-SIS: Data berhasil diperbarui
        SIS-->>-UI: Pembaruan berhasil
        UI-->>U: Menampilkan data indikator penilaian terbaru
    end
    deactivate UI
    deactivate U
```

## 9. Sequence Diagram Mengelola Opsi Jawaban

```
sequenceDiagram
    actor U as Kepala Sekolah
    participant UI@{ "type": "boundary" } as Halaman Indikator Penilaian
    participant SIS@{ "type": "control" } as Sistem
    participant DB@{ "type": "entity" } as Database

    activate U
    U->>+UI: Masuk ke halaman Indikator Penilaian
    UI->>+SIS: Meminta data opsi jawaban
    SIS->>+DB: Mengambil data opsi jawaban
    DB-->>-SIS: Data opsi jawaban
    SIS-->>-UI: Data opsi jawaban
    UI-->>U: Menampilkan daftar opsi jawaban
    alt Tambah / edit data opsi jawaban
        U->>UI: Memilih tambah / edit data opsi jawaban
        UI->>+SIS: Meminta form data opsi jawaban
        SIS-->>-UI: Form data opsi jawaban
        UI-->>U: Menampilkan form data opsi jawaban
        U->>UI: Mengisi form
        UI->>+SIS: Mengirim data opsi jawaban
        SIS->>+DB: Memperbarui data opsi jawaban
        DB-->>-SIS: Data berhasil diperbarui
        SIS-->>-UI: Pembaruan berhasil
        UI-->>U: Menampilkan data opsi jawaban terbaru
    else Hapus data opsi jawaban
        U->>UI: Memilih hapus data opsi jawaban
        UI->>+SIS: Mengirim permintaan
        SIS->>+DB: Memperbarui data opsi jawaban
        DB-->>-SIS: Data berhasil diperbarui
        SIS-->>-UI: Pembaruan berhasil
        UI-->>U: Menampilkan data opsi jawaban terbaru
    end
    deactivate UI
    deactivate U
```

## 10. Sequence Diagram Mengelola Akun Pengguna

```
sequenceDiagram
    actor U as Kepala Sekolah
    participant UI@{ "type": "boundary" } as Halaman Akun Pengguna
    participant SIS@{ "type": "control" } as Sistem
    participant DB@{ "type": "entity" } as Database

    activate U
    U->>+UI: Masuk ke halaman Akun Pengguna
    UI->>+SIS: Meminta data akun pengguna
    SIS->>+DB: Mengambil data akun pengguna
    DB-->>-SIS: Data akun pengguna
    SIS-->>-UI: Data akun pengguna
    UI-->>U: Menampilkan daftar akun pengguna
    alt Tambah akun pengguna
        U->>UI: Memilih tambah akun pengguna
        UI->>+SIS: Meminta form pendaftaran akun pengguna
        SIS-->>-UI: Form pendaftaran akun pengguna
        UI-->>U: Menampilkan form pendaftaran akun pengguna
        U->>UI: Mengisi form
        UI->>+SIS: Mengirim data akun pengguna
        SIS->>+DB: Memperbarui data akun pengguna
        DB-->>-SIS: Data berhasil diperbarui
        SIS-->>-UI: Pembaruan berhasil
        UI-->>U: Menampilkan data akun pengguna terbaru
    else Hapus / reset akun pengguna
        U->>UI: Memilih hapus / reset akun pengguna
        UI->>+SIS: Mengirim permintaan
        SIS->>+DB: Memperbarui data akun pengguna
        DB-->>-SIS: Data berhasil diperbarui
        SIS-->>-UI: Pembaruan berhasil
        UI-->>U: Menampilkan data akun pengguna terbaru
    end
    deactivate UI
    deactivate U
```

## 11. Sequence Diagram Mengelola Profil Saya

```
sequenceDiagram
    actor U as Kepala Sekolah / Tim Pendidik
    participant UI@{ "type": "boundary" } as Halaman Profil Saya
    participant SIS@{ "type": "control" } as Sistem
    participant DB@{ "type": "entity" } as Database

    activate U
    U->>+UI: Klik bagian profil dan memilih menu Profil Saya
    UI->>+SIS: Meminta data profil
    SIS->>+DB: Mengambil data profil
    DB-->>-SIS: Data profil
    SIS-->>-UI: Data profil
    UI-->>U: Menampilkan form data profil
    U->>UI: Mengisi data yang ingin diubah
    UI->>+SIS: Mengirim data perubahan
    SIS->>+DB: Memperbarui data profil
    DB-->>-SIS: Data berhasil diperbarui
    SIS-->>-UI: Pembaruan berhasil
    UI-->>U: Menampilkan data profil terbaru
    deactivate UI
    deactivate U
```

## 12. Sequence Diagram Logout

```
sequenceDiagram
    actor U as Kepala Sekolah / Tim Pendidik
    participant UI@{ "type": "boundary" } as Halaman Aplikasi
    participant SIS@{ "type": "control" } as Sistem
    participant DB@{ "type": "entity" } as Database

    activate U
    U->>+UI: Klik bagian profil lalu memilih menu logout
    UI->>+SIS: Mengirim permintaan logout
    SIS->>+DB: Mengakhiri sesi pengguna
    DB-->>-SIS: Sesi berhasil diakhiri
    SIS-->>-UI: Logout berhasil
    UI-->>U: Menampilkan halaman login
    deactivate UI
    deactivate U
```
