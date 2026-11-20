# Penjelasan Rancangan Antarmuka (Wireframe) SPK Transisi PAUD–SD

## Gambar 3.1 Rancangan Halaman Login

Halaman login merupakan halaman awal yang harus dilalui pengguna sebelum mengakses sistem. Bagian kiri memuat identitas sistem berupa nama TK Islam Kencana, judul sistem, dan deskripsi singkat metode AHP dan MOORA. Bagian kanan berisi formulir dengan kolom email, kolom password, dan tombol "Masuk". Halaman ini tidak menyediakan pendaftaran mandiri karena akun didaftarkan oleh Kepala Sekolah.

## Gambar 3.2 Rancangan Halaman Dashboard (Kepala Sekolah)

Dashboard tampil setelah pengguna berhasil login dan hanya memuat data kelas dan anak pada tahun ajaran berjalan, yang ditunjukkan label di bawah judul halaman. Semua halaman setelah login memakai kerangka yang sama, yaitu menu navigasi di sisi kiri dan bilah atas yang menampilkan nama serta peran pengguna. Pada akun Kepala Sekolah, menu navigasi memuat kelompok menu Operasional dan kelompok menu khusus Kepala Sekolah. Bagian isi memuat tiga kartu ringkasan (total kelas aktif, total data anak, dan status konsistensi AHP) serta tabel daftar kelas beserta status penilaiannya, yaitu belum dinilai atau sudah dinilai. Tombol “Lihat Laporan” hanya tersedia pada kelas yang sudah dinilai.

## Gambar 3.3 Rancangan Halaman Dashboard (Tim Pendidik)

Dashboard Tim Pendidik memiliki susunan yang sama dengan Gambar 3.31, tetapi menu navigasi hanya memuat kelompok menu Operasional. Pada kartu daftar kelas terdapat tautan “Buka Penilaian” untuk menuju halaman Penilaian. Kolom aksi pada tabel menampilkan tombol “Mulai Penilaian” untuk kelas yang belum dinilai dan tombol “Lihat Laporan” untuk kelas yang sudah dinilai.

## Gambar 3.4 Rancangan Halaman Kelola Kelas

Halaman ini digunakan untuk mengelola data kelas sebagai wadah data anak. Bagian utamanya berupa tabel daftar kelas dengan pilihan tahun ajaran dan tombol "Tambah Kelas" di atasnya. Setiap baris memiliki tombol "Kelola Anak", "Edit", dan "Hapus". Catatan di bagian bawah mengingatkan bahwa menghapus kelas akan menghapus seluruh data anak dan penilaian di dalamnya.

## Gambar 3.5 Rancangan Formulir Tambah Kelas

Formulir ini tampil sebagai jendela pop-up di atas halaman Kelola Kelas setelah tombol "Tambah Kelas" ditekan. Formulir berisi kolom nama kelas dan tahun ajaran yang wajib diisi, serta catatan bahwa data anak ditambahkan setelah kelas dibuat melalui tombol "Kelola Anak". Di bagian bawah terdapat tombol "Batal" dan "Simpan Kelas".

## Gambar 3.6 Rancangan Halaman Daftar Anak

Halaman ini menampilkan data anak pada kelas yang dipilih, lengkap dengan tautan kembali, nama kelas, tahun ajaran, kolom pencarian, dan tombol "Tambah Data Anak". Data ditampilkan dalam tabel berisi kode anak serta tombol "Edit" dan "Hapus". Kode anak dibuat otomatis oleh sistem, sedangkan nama panggilan boleh dikosongkan dan harus unik di dalam kelas.

## Gambar 3.7 Rancangan Formulir Tambah Data Anak

Formulir ini tampil sebagai jendela pop-up di atas halaman Daftar Anak setelah tombol "Tambah Data Anak" ditekan. Kolom kelas terisi otomatis dan tidak dapat diubah, sedangkan pengguna mengisi nama lengkap anak (wajib) dan nama panggilan (opsional, harus unik di dalam kelas). Kode anak tidak diisi manual karena dibuat otomatis oleh sistem setelah data disimpan. Di bagian bawah terdapat tombol "Batal" dan "Simpan Data Anak".

## Gambar 3.8 Rancangan Halaman Penilaian dan Perankingan MOORA

Halaman ini menampilkan hasil perhitungan MOORA untuk satu kelas yang dipilih pengguna. Nilai Yi dan ranking dihitung otomatis dari jawaban terbaru seluruh anak. Hasil disajikan dalam tabel berisi kode anak, nilai kriteria C1 sampai C6, nilai Yi, ranking, dan tombol "Lihat", dilengkapi kolom pencarian, pengurutan, dan keterangan kategori skala nilai. Tampilan awal halaman bersifat hanya baca.

## Gambar 3.9 Rancangan Halaman Detail Penilaian (Mode Lihat)

Halaman ini menampilkan rincian penilaian seorang anak dalam mode hanya baca untuk Kepala Sekolah dan dibuka melalui tombol "Lihat" pada halaman Penilaian. Bagian atas memuat identitas anak berupa kelas, tahun ajaran, nama, kode anak, nama panggilan, dan penanda mode lihat, dilengkapi tombol ikon mata untuk menampilkan atau menyembunyikan nama anak. Di bawahnya terdapat kartu nilai Yi dan ranking. Bagian bawah memuat jawaban penilaian per kriteria beserta filter capaian. Setiap kriteria diawali judul yang menampilkan kode dan nama kriteria, jumlah indikator yang sudah dinilai, serta nilai kriteria beserta kategorinya. Judul tersebut diikuti tabel berisi nomor indikator, teks indikator, dan satu kolom untuk setiap opsi jawaban. Opsi yang dipilih ditandai kotak centang, sedangkan indikator yang belum dinilai diberi tanda peringatan.

## Gambar 3.10 Rancangan Halaman Detail Penilaian (Mode Edit)

Halaman ini memiliki susunan yang sama dengan mode lihat, tetapi digunakan oleh Tim Pendidik untuk mengisi jawaban penilaian. Kartu identitas anak menampilkan penanda mode edit dan tombol "Selesai". Pada bagian jawaban, setiap indikator ditampilkan dengan kode dan teks pertanyaannya, diikuti tombol pilihan opsi jawaban. Opsi yang dipilih ditandai warna hijau dan ikon centang. Jawaban tersimpan otomatis, dan di bawah pilihan opsi ditampilkan status penyimpanan berupa "Menunggu sinkronisasi" atau "Tersinkron". Filter capaian tetap tersedia untuk menampilkan indikator yang belum dinilai.

## Gambar 3.11 Rancangan Halaman Laporan Perhitungan

Halaman laporan menyajikan seluruh tahapan perhitungan secara transparan dan hanya baca. Bagian atas berisi pilihan tahun ajaran dan kelas serta tombol "Download". Setelah kelas dipilih, pengguna dapat melihat tahapan secara berurutan, dimulai dari bobot prioritas kriteria hasil AHP beserta status konsistensi (CR ≤ 0,10). Tahapan berikutnya adalah hasil penilaian dan prioritas stimulasi berupa nilai kriteria, nilai Yi, dan ranking, dilengkapi kolom pencarian, pengurutan, dan keterangan kategori skala nilai, kemudian tahapan perhitungan MOORA lainnya dalam bentuk tabel.

## Gambar 3.12 Rancangan Halaman Kriteria dan Bobot

Halaman khusus Kepala Sekolah ini digunakan untuk mengelola kriteria dan bobot AHP. Bagian pertama berupa tabel daftar kriteria dengan tombol "Tambah Kriteria". Bagian kedua berupa matriks perbandingan berpasangan 6 × 6 yang dapat diubah melalui tombol "Edit Matriks", dilengkapi panduan skala Saaty 1 sampai 9 dan batas konsistensi CR ≤ 0,10. Perubahan disimpan setelah nilai matriks konsisten.

## Gambar 3.13 Rancangan Formulir Tambah Kriteria

Formulir ini tampil sebagai jendela pop-up di atas halaman Kriteria dan Bobot setelah tombol "Tambah Kriteria" ditekan. Inisial kriteria terisi otomatis oleh sistem dan tidak dapat diubah. Pengguna mengisi nama kriteria dan memilih jenis kriteria MOORA, yaitu benefit atau cost, melalui dropdown. Di bagian bawah terdapat tombol "Batal" dan "Simpan Kriteria".

## Gambar 3.14 Rancangan Halaman Opsi Jawaban dan Indikator

Halaman khusus Kepala Sekolah ini terdiri dari dua bagian. Bagian pertama mengelola opsi jawaban, yaitu skala penilaian baku beserta poinnya yang berlaku untuk semua kriteria. Bagian kedua mengelola indikator pertanyaan observasi, di mana pengguna memilih kriteria terlebih dahulu lalu menambah, mengubah, atau menghapus pertanyaan pada kriteria tersebut.

## Gambar 3.15 Rancangan Formulir Tambah Indikator

Formulir ini tampil sebagai jendela pop-up di atas halaman Opsi Jawaban dan Indikator setelah tombol "Tambah Indikator" ditekan. Kolom kriteria penilaian terisi otomatis sesuai kriteria yang dipilih dan tidak dapat diubah, sehingga pengguna hanya mengisi teks pertanyaan observasi. Catatan di bagian bawah menjelaskan bahwa jawaban anak memakai opsi jawaban yang sudah diatur pada halaman yang sama. Di bagian bawah terdapat tombol "Batal" dan "Simpan Indikator".

## Gambar 3.16 Rancangan Halaman Kelola Pengguna

Halaman ini digunakan Kepala Sekolah untuk mengelola akun pengguna. Daftar akun ditampilkan dalam tabel berisi nama, email, peran, dan tanggal dibuat, dengan tombol "Tambah Tim Pendidik" untuk mendaftarkan akun baru. Setiap akun memiliki tombol "Reset Password", yang mengembalikan sandi ke sandi bawaan, dan "Hapus", yang menghapus akun secara permanen.

## Gambar 3.17 Rancangan Formulir Tambah Akun Tim Pendidik

Formulir ini tampil sebagai jendela pop-up di atas halaman Kelola Pengguna setelah tombol "Tambah Tim Pendidik" ditekan. Pengguna mengisi nama lengkap, email, dan password awal yang wajib diisi. Catatan di bagian bawah menjelaskan bahwa akun yang dibuat otomatis berperan sebagai Tim Pendidik dan dapat langsung digunakan untuk login. Di bagian bawah terdapat tombol "Batal" dan "Simpan Akun".

## Gambar 3.18 Rancangan Halaman Kelola Akun

Halaman ini digunakan setiap pengguna untuk mengatur akunnya sendiri dan tidak menampilkan menu navigasi samping. Isinya dua kartu, yaitu "Informasi Profil" untuk mengubah nama dan email, serta "Keamanan" untuk mengganti password dengan konfirmasi password baru.
