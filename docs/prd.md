# Product Requirements Document (PRD)

## Sistem Penunjang Keputusan Prioritas Anak untuk Transisi Stimulasi PAUD--SD

**Metode:** AHP untuk pembobotan kriteria dan MOORA untuk perankingan
alternatif

------------------------------------------------------------------------

## 1. Ringkasan Produk

Aplikasi ini merupakan Sistem Penunjang Keputusan (SPK) berbasis web
untuk membantu tim pendidik menentukan prioritas kebutuhan stimulasi
anak dalam masa transisi PAUD ke SD.

Sistem menggunakan: - **AHP (Analytical Hierarchy Process)** untuk
menentukan bobot setiap kriteria berdasarkan perbandingan berpasangan. -
**MOORA (Multi-Objective Optimization on the Basis of Ratio Analysis)**
untuk menghitung nilai optimasi dan mengurutkan prioritas anak.

Aplikasi dirancang dengan pendekatan **Progressive Web App (PWA)**,
**offline-first**, dan **mobile-first**. Data utama disimpan di
Supabase, sedangkan IndexedDB digunakan untuk menyimpan data lokal agar
aplikasi tetap dapat digunakan ketika perangkat sedang offline setelah
pengguna berhasil login dan data yang diperlukan telah tersedia di
perangkat.

## 2. Tujuan Aplikasi

1.  Membantu tim pendidik mengelola kriteria dan indikator penilaian
    anak.
2.  Memudahkan pendidik mengisi penilaian anak berdasarkan jawaban
    indikator.
3.  Menghitung bobot kriteria secara otomatis menggunakan AHP.
4.  Menghitung nilai dan peringkat prioritas anak menggunakan MOORA.
5.  Menyediakan laporan yang memperlihatkan proses perhitungan dari AHP
    sampai hasil akhir MOORA.
6.  Memungkinkan aplikasi digunakan pada perangkat desktop maupun
    ponsel, termasuk ketika koneksi internet terputus.

## 3. Pengguna dan Hak Akses

### 3.1 Pengguna

Aplikasi digunakan oleh tim pendidik. Untuk versi awal, seluruh tim
menggunakan **satu akun bersama**.

Data akun terdiri dari: - Email - Nama lengkap - Password

### 3.2 Autentikasi

-   Pengguna masuk menggunakan email dan password.
-   Autentikasi menggunakan Supabase Auth.
-   Password tidak boleh disimpan sebagai teks biasa pada tabel profil.
-   Tidak tersedia pendaftaran akun publik.
-   Pembuatan atau pengaturan akun dilakukan melalui mekanisme
    administrator yang ditentukan saat implementasi.

### 3.3 Hak Akses

Semua pengguna yang berhasil login memiliki hak akses yang sama terhadap
fitur aplikasi. Tidak ada pembagian role seperti admin, manager, atau
pendidik pada versi awal.

## 4. Teknologi dan Aturan Pengembangan

  -----------------------------------------------------------------------
  Bagian                              Teknologi / Ketentuan
  ----------------------------------- -----------------------------------
  Framework                           SvelteKit

  Bahasa pemrograman                  JavaScript murni, tanpa TypeScript

  Styling                             Tailwind CSS

  Database dan autentikasi            Supabase

  Penyimpanan offline                 IndexedDB

  PWA                                 Service Worker dan Web App Manifest

  Hosting                             Cloudflare
  -----------------------------------------------------------------------

### 4.1 Aturan penulisan kode

-   Gunakan JavaScript, bukan TypeScript.
-   Kode harus mudah dipahami oleh pemula.
-   Setiap fungsi yang dibuat harus memiliki komentar satu baris yang
    menjelaskan tujuan fungsi tersebut.
-   Gunakan penamaan variabel, fungsi, dan file yang jelas.
-   Pisahkan komponen tampilan, logika bisnis, dan akses database agar
    mudah dirawat.
-   Hindari abstraksi yang terlalu rumit jika belum diperlukan.

### 4.2 PWA, Offline-first, dan Mobile-first

-   Aplikasi harus dapat dipasang sebagai PWA.
-   Setelah pengguna berhasil login dan data yang diperlukan tersimpan
    di perangkat, data tersebut dapat diakses saat offline.
-   Gunakan IndexedDB untuk menyimpan data lokal, termasuk antrean
    perubahan yang belum tersinkronisasi.
-   Ketika koneksi kembali tersedia, aplikasi menyinkronkan perubahan
    lokal ke Supabase.
-   Tampilkan status koneksi dan status sinkronisasi kepada pengguna.
-   Tangani kemungkinan konflik perubahan, kegagalan sinkronisasi, dan
    percobaan sinkronisasi ulang.
-   Data lokal harus dikaitkan dengan akun/perangkat yang sesuai dan
    tidak boleh terbuka untuk pengguna yang tidak berhak.
-   Aplikasi dirancang dengan pendekatan mobile-first.
-   Tabel pada layar kecil harus dapat digulir secara horizontal, bukan
    memaksa seluruh kolom menjadi sangat sempit.
-   Tombol, formulir, pilihan jawaban, dan navigasi harus nyaman
    digunakan melalui layar sentuh.

**Catatan:** Login pertama tetap membutuhkan koneksi internet. Akses
offline hanya dapat dilakukan setelah sesi dan data yang diperlukan
tersedia secara lokal. Perilaku sesi autentikasi ketika offline perlu
diperhatikan saat implementasi.

## 5. Ruang Lingkup Fitur

### 5.1 Login

Pengguna dapat: - Memasukkan email. - Memasukkan password. - Login ke
aplikasi. - Logout dari aplikasi.

Validasi harus memberikan pesan yang mudah dipahami jika email atau
password salah, atau jika koneksi tidak tersedia.

### 5.2 Kelola Data Kriteria

Fitur ini digunakan untuk mengelola kriteria yang menjadi dasar
penilaian.

#### Data kriteria

-   ID kriteria
-   Inisial kriteria
-   Nama kriteria
-   Jenis kriteria MOORA (Benefit atau Cost)

#### Aturan inisial kriteria

-   Inisial dibuat otomatis berdasarkan **jumlah/urutan kriteria**,
    bukan berdasarkan ID database.
-   Format inisial adalah C1, C2, C3, dan seterusnya.
-   Saat pengguna menambahkan kriteria, inisial berikutnya langsung
    ditampilkan di sebelah kiri kolom input nama kriteria.
-   Kolom inisial bersifat nonaktif (disabled) dan tidak dapat diedit
    oleh pengguna.
-   Jika kriteria dihapus, sistem harus menjaga agar inisial tetap
    berurutan dan tidak duplikat. Penyesuaian inisial harus dilakukan
    secara konsisten terhadap data penilaian dan perhitungan yang
    terkait.
-   Nama kriteria mendukung CRUD (Create, Read, Update, Delete).

#### Jenis kriteria MOORA

Setiap kriteria memiliki jenis: - **Benefit:** nilai yang lebih besar
dianggap lebih baik menurut tujuan kriteria. - **Cost:** nilai yang
lebih kecil dianggap lebih baik menurut tujuan kriteria.

Jenis kriteria dapat ditentukan pada data kriteria. Penetapan jenis
untuk masing-masing kriteria belum ditentukan pada tahap spesifikasi ini
dan harus dikonfirmasi berdasarkan definisi operasional kriteria.

#### Perbandingan berpasangan AHP

-   Pengguna mengisi nilai perbandingan berpasangan antar-kriteria.
-   Sistem membentuk matriks perbandingan AHP secara otomatis.
-   Sistem menghitung bobot prioritas setiap kriteria.
-   Sistem menghitung nilai Consistency Index (CI) dan Consistency Ratio
    (CR).
-   Jika CR memenuhi batas konsistensi, yaitu CR ≤ 0,10, hasil
    pembobotan dapat digunakan.
-   Jika CR \> 0,10, sistem menampilkan pemberitahuan bahwa penilaian
    belum konsisten dan meminta pengguna memperbaiki perbandingan.
-   Perubahan jumlah atau susunan kriteria harus membuat matriks
    perbandingan menyesuaikan.

### 5.3 Kelola Data Indikator Pertanyaan

Fitur ini digunakan untuk mengelola pertanyaan yang menjadi dasar
penilaian setiap kriteria.

#### Opsi jawaban

Setiap opsi jawaban memiliki data: - Opsi jawaban - Keterangan - Poin

Aturan poin: - Opsi jawaban pertama yang dibuat memiliki poin 1. - Opsi
berikutnya memiliki poin 2, lalu 3, dan seterusnya. - Poin ditampilkan
di sebelah kiri opsi jawaban. - Poin ditentukan otomatis oleh sistem dan
tidak dapat diubah secara manual. - Jika opsi jawaban ditambah, diubah,
atau dihapus, sistem harus menjaga urutan poin agar tidak menimbulkan
duplikasi atau urutan yang tidak konsisten. - Opsi jawaban mendukung
CRUD.

#### Indikator pertanyaan

Setiap indikator memiliki data: - Kriteria yang menaungi indikator -
Teks pertanyaan - Status atau informasi lain yang diperlukan untuk
pengelolaan

Alur pengelolaan: 1. Pengguna membuka menu indikator pertanyaan. 2.
Pengguna memilih salah satu kriteria. 3. Sistem menampilkan indikator
yang dimiliki kriteria tersebut. 4. Pengguna dapat menambahkan, melihat,
mengubah, atau menghapus indikator. 5. Setiap indikator menggunakan opsi
jawaban yang telah dikelola.

Indikator pertanyaan mendukung CRUD.

### 5.4 Kelola Data Kelas

Data kelas digunakan untuk mengelompokkan anak yang akan dinilai.

Data kelas: - Nama kelas - Tahun ajaran

Aturan tampilan dan penggunaan: - Daftar kelas ditampilkan dalam bentuk
tabel, bukan mini card. - Pengguna dapat menambahkan kelas. - Untuk
mengedit kelas, pengguna mengaktifkan tombol **Edit**, kemudian memilih
data kelas yang ingin diedit. - Pengguna dapat menyimpan perubahan atau
membatalkan proses edit. - Kelas mendukung CRUD. - Pengguna harus
memilih kelas terlebih dahulu sebelum mengelola anak, melakukan
penilaian, atau melihat laporan kelas tersebut.

### 5.5 Kelola Data Anak (Alternatif)

Data anak merupakan alternatif yang akan dinilai menggunakan metode
MOORA.

Data anak: - Nomor urut (No.) - NIS - Nama

Aturan: - Pengguna membuka atau memilih kelas terlebih dahulu. - Jika
data anak belum tersedia, pengguna dapat menambahkannya. - Pengguna
dapat melihat, menambah, mengubah, dan menghapus data anak. - Data anak
dikelola dalam konteks kelas yang dipilih. - NIS harus divalidasi sesuai
aturan keunikan yang ditetapkan untuk data kelas.

#### Tabel data anak dan hasil penilaian

Tabel utama menampilkan: - No. - NIS - Nama - Nilai setiap kriteria (C1,
C2, C3, dan seterusnya) - Nilai Yi / skor kebutuhan - Kategori hasil

Jumlah kolom kriteria harus mengikuti jumlah kriteria yang aktif. Pada
perangkat mobile, tabel dapat digulir secara horizontal.

Pengguna dapat memilih atau mengeklik data anak untuk melihat
halaman/detail penilaian anak. Detail menampilkan seluruh kriteria,
indikator pertanyaan, jawaban yang dipilih, dan poin jawaban.

### 5.6 Penilaian Anak

Alur penilaian: 1. Pengguna memilih kelas. 2. Pengguna memilih anak yang
akan dinilai. 3. Sistem menampilkan daftar kriteria. 4. Pengguna memilih
salah satu kriteria. 5. Sistem menampilkan seluruh indikator pertanyaan
pada kriteria tersebut beserta opsi jawabannya. 6. Pengguna memilih
jawaban untuk setiap indikator. 7. Pengguna dapat berpindah ke kriteria
lain dan mengisi jawabannya. 8. Pengguna dapat menyimpan atau
memperbarui jawaban.

Aturan: - Jawaban setiap indikator menjadi sumber nilai alternatif. -
Jawaban dapat diedit setelah disimpan. - Perubahan jawaban harus
tersimpan secara lokal jika perangkat offline dan masuk antrean
sinkronisasi. - Perubahan jawaban pada kelas yang sudah pernah dihitung
harus memicu pembaruan hasil MOORA sesuai aturan pada bagian 6.5.

### 5.7 Laporan Penilaian Manual (Read Only)

Laporan digunakan untuk memperlihatkan proses perhitungan secara
transparan.

Alur: 1. Pengguna membuka menu laporan penilaian. 2. Pengguna memilih
kelas. 3. Sistem menampilkan proses perhitungan kelas tersebut dari AHP
sampai hasil akhir MOORA.

Laporan bersifat **read only**: - Pengguna tidak mengedit angka
perhitungan secara langsung. - Isi laporan diperbarui otomatis ketika
jawaban penilaian berubah dan proses MOORA selesai dihitung ulang. -
Laporan harus memperlihatkan data dan tahapan perhitungan, bukan hanya
hasil ranking.

Isi laporan minimal: 1. Data kriteria. 2. Matriks perbandingan
berpasangan AHP. 3. Hasil normalisasi dan bobot prioritas AHP. 4.
Perhitungan CI dan CR. 5. Matriks keputusan/nilai alternatif. 6. Matriks
normalisasi MOORA. 7. Nilai normalisasi berbobot. 8. Perhitungan nilai
optimasi Yi. 9. Batas dan interval kategori Yi yang digunakan. 10. Hasil
perankingan seluruh anak.

## 6. Aturan Perhitungan

### 6.1 Nilai Alternatif dari Jawaban Indikator

Nilai alternatif anak pada suatu kriteria diperoleh dari total poin
jawaban seluruh indikator pada kriteria tersebut.

Rumus:

\[ X\_{ij} = `\sum`{=tex}*{k=1}\^{m} P*{ijk} \]

Keterangan: - (X\_{ij}): nilai anak ke-i pada kriteria ke-j. -
(P\_{ijk}): poin jawaban indikator ke-k untuk anak ke-i pada kriteria
ke-j. - (m): jumlah indikator pada kriteria tersebut.

Dengan demikian, nilai alternatif menggunakan **total poin**, bukan
rata-rata poin.

Sistem perlu memastikan seluruh indikator wajib telah dijawab sebelum
penilaian kelas dapat dihitung. Jika ada jawaban yang belum lengkap,
tampilkan informasi anak dan indikator yang belum diisi.

### 6.2 Kategori Nilai Alternatif per Kriteria

Setiap nilai alternatif per kriteria diberi kategori: - Rendah --- label
hijau. - Sedang --- label kuning. - Tinggi --- label merah.

Kategori dihitung berdasarkan rentang total poin yang mungkin diperoleh
pada kriteria tersebut, dengan membagi rentang menjadi tiga bagian sama
besar.

Secara umum: - Nilai minimum teoritis = jumlah indikator × poin minimum
opsi jawaban. - Nilai maksimum teoritis = jumlah indikator × poin
maksimum opsi jawaban. - Rentang tersebut dibagi menjadi tiga interval:
rendah, sedang, dan tinggi.

**Catatan implementasi:** aturan batas interval harus dibuat konsisten,
tidak tumpang tindih, dan tidak menyisakan nilai yang tidak masuk
kategori. Jika jumlah indikator atau skala poin berubah, sistem harus
memperbarui rentang teoritis kategori kriteria tersebut. Kategori ini
digunakan untuk label nilai per kriteria dan berbeda dari kategori Yi
MOORA.

### 6.3 Pembobotan Kriteria dengan AHP

Sistem menggunakan metode AHP untuk mendapatkan bobot prioritas
kriteria.

Tahapan: 1. Membuat matriks perbandingan berpasangan. 2. Menjumlahkan
nilai pada setiap kolom. 3. Melakukan normalisasi matriks. 4. Menghitung
bobot prioritas kriteria. 5. Menghitung nilai eigen maksimum
((`\lambda`{=tex}\_{`\max`{=tex}})). 6. Menghitung Consistency Index
(CI). 7. Menghitung Consistency Ratio (CR). 8. Memastikan CR ≤ 0,10
sebelum bobot digunakan.

Rumus umum:

\[ CI = `\frac{\lambda_{\max}-n}{n-1}`{=tex} \]

\[ CR = `\frac{CI}{RI}`{=tex} \]

Keterangan: - (n): jumlah kriteria. - (RI): Random Index sesuai jumlah
kriteria.

Jika matriks belum konsisten, sistem meminta pengguna mengulang atau
memperbaiki penilaian perbandingan.

### 6.4 Perankingan dengan MOORA

MOORA menggunakan matriks keputusan dari nilai total poin setiap anak
pada setiap kriteria.

Tahapan: 1. Menyusun matriks keputusan (X). 2. Melakukan normalisasi
matriks keputusan. 3. Mengalikan nilai normalisasi dengan bobot AHP. 4.
Menghitung nilai optimasi Yi berdasarkan jenis kriteria benefit dan
cost. 5. Mengurutkan anak berdasarkan nilai Yi.

Normalisasi rasio:

\[ x\_{ij}\^{\*} =
`\frac{x_{ij}}{\sqrt{\sum_{i=1}^{m}x_{ij}^{2}}}`{=tex} \]

Nilai optimasi:

\[ Y_i = `\sum`{=tex}*{j `\in `{=tex}B} w_j x*{ij}\^{*} -
`\sum`{=tex}*{j `\in `{=tex}C} w_j x*{ij}\^{*} \]

Keterangan: - (Y_i): nilai optimasi alternatif ke-i. - (w_j): bobot AHP
kriteria ke-j. - (B): kelompok kriteria benefit. - (C): kelompok
kriteria cost.

Ranking diurutkan berdasarkan nilai Yi sesuai tujuan prioritas yang
telah ditetapkan. Untuk konteks prioritas kebutuhan stimulasi,
interpretasi arah ranking harus dikonfirmasi bersama definisi
operasional kriteria sebelum aplikasi digunakan secara resmi.

### 6.5 Kategori Yi Menggunakan Metode Sturges

Kategori hasil akhir Yi menggunakan metode interval Sturges. Jumlah
kategori ditentukan secara dinamis berdasarkan jumlah anak/alternatif
dalam kelas.

Rumus jumlah kategori:

\[ K = 1 + 3,3`\log`{=tex}\_{10}(n) \]

Keterangan: - (K): jumlah kategori/kelas interval. - (n): jumlah
anak/alternatif yang masuk perhitungan.

Hasil jumlah kategori dibulatkan ke bilangan bulat sesuai aturan
pembulatan yang ditetapkan dalam implementasi.

Lebar interval:

\[ I = `\frac{Y_{\max}-Y_{\min}}{K}`{=tex} \]

Keterangan: - (Y\_{`\max`{=tex}}): nilai Yi maksimum. -
(Y\_{`\min`{=tex}}): nilai Yi minimum. - (K): jumlah kategori. - (I):
lebar interval.

Kategori Yi tidak menggunakan warna rendah/sedang/tinggi. Label kategori
mengikuti interval hasil perhitungan Sturges.

### 6.6 Aturan Perhitungan MOORA Pertama dan Perhitungan Ulang

Perhitungan MOORA memiliki status pada tingkat **kelas**, bukan hanya
pada tingkat anak.

#### A. Kelas belum pernah dihitung

Jika kelas belum pernah menjalani perhitungan MOORA: 1. Pengguna mengisi
jawaban indikator anak. 2. Pengguna menekan tombol **Lakukan
Penilaian**. 3. Sistem memvalidasi kelengkapan jawaban seluruh anak
dalam kelas. 4. Sistem menghitung bobot AHP dan MOORA. 5. Sistem
menghitung Yi seluruh anak. 6. Sistem menghitung jumlah kategori Sturges
berdasarkan jumlah alternatif pada perhitungan pertama. 7. Sistem
menetapkan dan menyimpan: - Jumlah kategori Sturges awal. - Nilai Yi
minimum awal. - Nilai Yi maksimum awal. - Lebar interval awal. - Batas
setiap interval kategori. - Waktu perhitungan pertama. 8. Sistem
menyimpan hasil perhitungan dan menandai kelas sebagai sudah pernah
dihitung.

#### B. Kelas sudah pernah dihitung

Jika kelas sudah memiliki hasil perhitungan MOORA: 1. Pengguna dapat
mengedit jawaban indikator anak. 2. Setelah perubahan jawaban disimpan,
sistem otomatis menjalankan perhitungan ulang MOORA untuk seluruh anak
dalam kelas tersebut. 3. Sistem memperbarui nilai alternatif,
normalisasi, nilai Yi, ranking, dan kategori Yi setiap anak. 4. Sistem
menggunakan konfigurasi interval dari perhitungan pertama. 5. Sistem
**tidak menghitung ulang atau mengubah** jumlah kategori Sturges awal,
batas bawah awal, batas atas awal, lebar interval awal, dan batas setiap
interval yang sudah disimpan.

Dengan aturan tersebut, perubahan jawaban dapat mengubah nilai Yi,
ranking, dan kategori anak, tetapi tidak mengubah standar interval
kategori Yi yang telah ditetapkan saat perhitungan pertama.

#### C. Data baru atau perubahan struktur kelas

Perubahan jawaban anak yang sudah ada hanya memicu perhitungan ulang
dengan interval awal yang tetap.

Namun, penambahan atau penghapusan anak, perubahan jumlah kriteria,
perubahan indikator, perubahan opsi jawaban/poin, atau perubahan bobot
AHP dapat memengaruhi dasar perhitungan. Perlakuan terhadap perubahan
struktur tersebut harus ditangani sebagai perubahan konfigurasi
penilaian dan memerlukan aturan reset/perhitungan ulang baseline yang
jelas.

**Aturan awal yang disarankan:** perubahan struktur yang memengaruhi
matriks keputusan atau skala penilaian tidak boleh diam-diam memakai
baseline lama. Sistem harus memberi peringatan dan meminta pengguna
melakukan perhitungan ulang baseline kelas melalui tindakan yang jelas
dan tercatat.

#### D. Konsistensi dan keamanan proses

-   Proses perhitungan ulang harus memperbarui hasil seluruh anak dalam
    kelas secara konsisten.
-   Jika proses gagal, sistem tidak boleh menampilkan sebagian hasil
    baru bercampur dengan sebagian hasil lama.
-   Simpan waktu perhitungan terakhir.
-   Simpan konfigurasi interval awal secara terpisah dari hasil
    perhitungan terbaru.
-   Perhitungan yang berjalan bersamaan harus dikendalikan agar tidak
    saling menimpa.
-   Perubahan offline masuk antrean sinkronisasi. Perhitungan resmi dan
    pembaruan hasil bersama dilakukan setelah perubahan berhasil
    tersinkronisasi ke server, kecuali aplikasi secara eksplisit
    menampilkan hasil lokal sebagai hasil sementara.

## 7. Kebutuhan Tampilan dan Pengalaman Pengguna

1.  Tampilan menggunakan pendekatan mobile-first.
2.  Navigasi harus mudah dipahami oleh tim pendidik.
3.  Formulir memiliki label yang jelas dan pesan validasi yang mudah
    dimengerti.
4.  Inisial kriteria dan poin opsi jawaban ditampilkan secara otomatis
    dan nonaktif.
5.  Daftar kelas dan data anak menggunakan tabel.
6.  Tabel lebar dapat digulir horizontal pada perangkat mobile.
7.  Detail anak menampilkan seluruh pertanyaan dan jawaban per kriteria.
8.  Status perhitungan kelas harus terlihat, misalnya belum dihitung
    atau sudah dihitung.
9.  Tombol **Lakukan Penilaian** ditampilkan untuk kelas yang belum
    pernah dihitung.
10. Untuk kelas yang sudah dihitung, perubahan jawaban memicu pembaruan
    otomatis dan sistem menampilkan status proses perhitungan.
11. Laporan perhitungan hanya dapat dibaca, bukan diedit.
12. Tampilkan status online/offline dan status sinkronisasi data.

## 8. Kebutuhan Data dan Rancangan Entitas Awal

Berikut entitas awal yang perlu dipertimbangkan untuk database Supabase.
Ini merupakan rancangan konseptual dan belum menjadi skema SQL final.

  -----------------------------------------------------------------------
  Entitas/Tabel                       Kegunaan
  ----------------------------------- -----------------------------------
  profiles                            Menyimpan nama lengkap dan
                                      informasi profil akun

  kriteria                            Menyimpan nama, inisial, urutan,
                                      dan jenis benefit/cost

  perbandingan_ahp                    Menyimpan nilai perbandingan
                                      berpasangan antar-kriteria

  indikator                           Menyimpan pertanyaan dan relasinya
                                      ke kriteria

  opsi_jawaban                        Menyimpan teks opsi, keterangan,
                                      dan poin

  kelas                               Menyimpan nama kelas dan tahun
                                      ajaran

  anak                                Menyimpan NIS, nama, dan relasi
                                      kelas

  penilaian                           Menyimpan status dan informasi
                                      penilaian anak/kelas

  detail_penilaian                    Menyimpan jawaban untuk setiap
                                      indikator

  moora_config_kelas                  Menyimpan baseline Sturges dan
                                      batas interval awal per kelas

  hasil_perhitungan                   Menyimpan hasil AHP, MOORA, Yi,
                                      kategori, dan ranking

  sync_queue (lokal)                  Menyimpan perubahan lokal yang
                                      belum tersinkronisasi di IndexedDB
  -----------------------------------------------------------------------

Relasi, constraint, indeks, kebijakan Row Level Security (RLS), dan
strategi penyimpanan snapshot perhitungan perlu dirinci pada tahap
desain database.

## 9. Kebutuhan Nonfungsional

### 9.1 Keamanan

-   Gunakan Supabase Auth.
-   Terapkan Row Level Security pada tabel yang menyimpan data aplikasi.
-   Jangan menyimpan password secara langsung.
-   Validasi input pada sisi aplikasi dan database.
-   Batasi akses data sesuai akun yang terautentikasi.

### 9.2 Keandalan

-   Perhitungan harus menghasilkan nilai yang konsisten dan dapat
    ditelusuri.
-   Kegagalan proses hitung tidak boleh merusak hasil terakhir yang
    valid.
-   Sinkronisasi harus dapat dilanjutkan setelah koneksi pulih.
-   Simpan waktu perubahan dan waktu perhitungan.

### 9.3 Kemudahan penggunaan

-   Gunakan bahasa Indonesia yang sederhana.
-   Berikan pesan kesalahan yang menjelaskan tindakan yang perlu
    dilakukan.
-   Tampilkan indikator proses saat menyimpan, menyinkronkan, dan
    menghitung.
-   Hindari tampilan tabel yang sulit digunakan di ponsel.

## 10. Kriteria Penerimaan (Acceptance Criteria)

Aplikasi dianggap memenuhi kebutuhan awal jika:

1.  Pengguna dapat login menggunakan email dan password.
2.  Pengguna dapat melakukan CRUD kriteria.
3.  Inisial kriteria dibuat otomatis dengan format C1, C2, dan
    seterusnya.
4.  Pengguna dapat mengisi perbandingan AHP dan melihat hasil CR.
5.  Sistem menolak penggunaan bobot AHP jika CR \> 0,10.
6.  Pengguna dapat melakukan CRUD indikator dan opsi jawaban.
7.  Poin opsi jawaban dibuat otomatis mulai dari 1.
8.  Pengguna dapat melakukan CRUD kelas dan data anak.
9.  Pengguna dapat mengisi dan mengedit jawaban indikator setiap anak.
10. Nilai alternatif setiap kriteria dihitung dari total poin jawaban.
11. Kategori nilai alternatif per kriteria terdiri dari rendah, sedang,
    dan tinggi dengan label warna yang sesuai.
12. Pengguna dapat menekan **Lakukan Penilaian** untuk pertama kali
    menghitung MOORA pada kelas yang belum pernah dihitung.
13. Perhitungan pertama menyimpan konfigurasi awal Sturges dan batas
    interval Yi.
14. Perubahan jawaban pada kelas yang sudah pernah dihitung memicu
    perhitungan ulang seluruh alternatif di kelas tersebut.
15. Perhitungan ulang tidak mengubah jumlah kategori dan batas interval
    Yi yang disimpan pada perhitungan pertama.
16. Ranking dan kategori Yi diperbarui berdasarkan nilai Yi terbaru
    dengan tetap menggunakan interval awal.
17. Laporan menampilkan tahapan AHP dan MOORA serta bersifat read only.
18. Aplikasi dapat dipasang sebagai PWA.
19. Data yang sudah tersedia secara lokal dapat dibaca ketika offline.
20. Perubahan offline dapat disinkronkan kembali ketika koneksi
    tersedia.
21. Tabel dapat digulir secara horizontal pada perangkat mobile.

## 11. Hal yang Masih Perlu Diputuskan

Bagian berikut belum boleh dianggap sebagai keputusan final:

1.  **Jenis benefit/cost setiap kriteria:** ditentukan berdasarkan
    definisi operasional masing-masing kriteria.
2.  **Arah prioritas ranking Yi:** perlu dipastikan apakah nilai Yi
    terbesar berarti kebutuhan stimulasi lebih tinggi dan harus mendapat
    prioritas lebih dahulu.
3.  **Perubahan struktur setelah perhitungan pertama:** perlu ditetapkan
    alur persetujuan/reset baseline jika anak, kriteria, indikator, opsi
    jawaban, poin, atau bobot berubah.
4.  **Aturan pembulatan dan batas interval:** perlu ditetapkan secara
    konsisten, terutama untuk hasil desimal yang berada tepat di batas
    dua kategori.
5.  **Penggunaan satu akun bersama:** perlu dipastikan apakah perangkat
    yang digunakan lebih dari satu dan bagaimana konflik perubahan
    antarperangkat ditangani.

## 12. Di Luar Ruang Lingkup Versi Awal

Hal-hal berikut belum diminta sebagai fitur versi awal: - Banyak role
dengan hak akses berbeda. - Akun individual untuk setiap pendidik. -
Pendaftaran akun publik. - Ekspor laporan ke PDF atau Excel. -
Notifikasi WhatsApp atau email. - Integrasi dengan sistem sekolah lain.

Fitur tambahan dapat dipertimbangkan setelah kebutuhan inti berjalan
dengan baik.

------------------------------------------------------------------------

**Dokumen ini menjadi dasar awal pengembangan aplikasi.** Detail teknis
seperti skema SQL final, struktur folder SvelteKit, desain UI, dan
implementasi algoritma akan dibuat berdasarkan PRD ini setelah keputusan
yang masih terbuka disepakati.
