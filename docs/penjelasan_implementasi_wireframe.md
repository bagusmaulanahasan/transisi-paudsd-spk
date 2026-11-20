# Penjelasan Hasil Implementasi Antarmuka SPK Transisi PAUD–SD

## Gambar 4.1 Hasil Implementasi Halaman Login

Halaman login merupakan halaman awal yang harus dilalui pengguna sebelum mengakses sistem. Bagian kiri menampilkan identitas sistem berupa label TK Islam Kencana, judul SPK Transisi PAUD–SD, dan deskripsi singkat metode AHP dan MOORA di atas ilustrasi anak-anak yang sedang bermain, serta hak cipta di bagian bawah. Bagian kanan berisi kartu "Masuk ke Akun" dengan kolom email, kolom password, dan tombol biru "Masuk". Halaman ini tidak menyediakan pendaftaran mandiri karena akun didaftarkan oleh Kepala Sekolah.

## Gambar 4.2 Hasil Implementasi Halaman Dashboard (Kepala Sekolah)

Dashboard tampil setelah pengguna berhasil login dan hanya memuat data kelas dan anak pada tahun ajaran berjalan, yang ditunjukkan label di bawah judul halaman. Semua halaman setelah login memakai kerangka yang sama, yaitu menu navigasi di sisi kiri dengan menu aktif berwarna biru, bilah atas yang menampilkan nama serta peran pengguna, dan status koneksi di bagian bawah menu. Pada akun Kepala Sekolah, menu navigasi memuat kelompok menu Operasional (Kelas & Anak, Penilaian, dan Laporan Perhitungan) serta kelompok menu khusus Kepala Sekolah (Kriteria & Bobot, Indikator Penilaian, dan Akun Pengguna). Bagian isi memuat tiga kartu ringkasan, yaitu total kelas aktif, total data anak, dan status konsistensi AHP, serta tabel daftar kelas beserta status penilaiannya. Status belum dinilai ditandai warna kuning dan status sudah dinilai ditandai warna hijau. Tombol "Lihat Laporan" hanya tersedia pada kelas yang sudah dinilai.

## Gambar 4.3 Hasil Implementasi Halaman Dashboard (Tim Pendidik)

Dashboard Tim Pendidik memiliki susunan yang sama dengan Gambar 4.2, tetapi menu navigasi hanya memuat kelompok menu Operasional sehingga menu khusus Kepala Sekolah tidak dapat diakses. Pada kartu daftar kelas terdapat tautan "Buka Penilaian" untuk menuju halaman Penilaian. Kolom aksi pada tabel menampilkan tombol hitam "Mulai Penilaian" untuk kelas yang belum dinilai dan tombol "Lihat Laporan" untuk kelas yang sudah dinilai.

## Gambar 4.4 Hasil Implementasi Halaman Kelola Kelas

Halaman ini digunakan Kepala Sekolah untuk mengelola data kelas sebagai wadah data anak. Bagian utamanya berupa kartu "Daftar Kelas" yang dilengkapi pilihan tahun ajaran, jumlah total kelas, dan tombol biru "Tambah Kelas". Tabel menampilkan nomor, nama kelas, tahun ajaran, dan jumlah anak pada setiap kelas. Setiap baris memiliki tombol "Kelola Anak", "Edit", dan "Hapus" yang berwarna merah. Catatan di bagian bawah mengingatkan bahwa menghapus kelas akan menghapus seluruh data anak dan penilaian di dalamnya.

## Gambar 4.5 Hasil Implementasi Formulir Tambah Kelas

Formulir ini tampil sebagai jendela pop-up di atas halaman Kelola Kelas yang latarnya diburamkan setelah tombol "Tambah Kelas" ditekan. Formulir berisi kolom nama kelas dan tahun ajaran yang wajib diisi dan ditandai tanda bintang merah, dengan tahun ajaran sudah terisi sesuai tahun ajaran berjalan. Catatan berwarna biru menjelaskan bahwa data anak ditambahkan setelah kelas dibuat melalui tombol "Kelola Anak". Di bagian bawah terdapat tombol "Batal" dan "Simpan Kelas".

## Gambar 4.6 Hasil Implementasi Halaman Daftar Anak

Halaman ini menampilkan data anak pada kelas yang dipilih, lengkap dengan tautan kembali ke daftar kelas, nama kelas, tahun ajaran, jumlah anak terdaftar, dan tombol "Tambah Data Anak". Kartu "Daftar Anak" dilengkapi kolom pencarian, pilihan pengurutan (misalnya nama A–Z), dan jumlah total anak. Data ditampilkan dalam tabel berisi nomor dan identitas anak, serta tombol "Edit" dan "Hapus" pada setiap baris. Judul kolom identitas anak berupa dropdown yang digunakan untuk memilih informasi yang ditampilkan, yaitu kode anak, nama, atau nama panggilan. Kode anak dibuat otomatis oleh sistem, sedangkan nama panggilan boleh dikosongkan dan harus unik di dalam kelas.

## Gambar 4.7 Hasil Implementasi Formulir Tambah Data Anak

Formulir ini tampil sebagai jendela pop-up di atas halaman Daftar Anak setelah tombol "Tambah Data Anak" ditekan. Kolom kelas terisi otomatis dan tidak dapat diubah, sedangkan pengguna mengisi nama lengkap anak dan nama panggilan yang bersifat opsional dan harus unik di dalam kelas. Keterangan di bawah kolom nama panggilan menjelaskan bahwa kolom ini boleh dikosongkan dan diisi kapan saja melalui tombol "Ubah Data Anak". Catatan berwarna biru menjelaskan bahwa kode anak dibuat otomatis oleh sistem setelah data disimpan, sehingga tidak perlu diisi manual. Di bagian bawah terdapat tombol "Batal" dan "Simpan Data Anak".

## Gambar 4.8 Hasil Implementasi Halaman Penilaian dan Perankingan MOORA

Halaman ini menampilkan hasil perhitungan MOORA untuk satu kelas yang dipilih pengguna melalui pilihan tahun ajaran dan kelas. Nilai Yi dan ranking dihitung otomatis dari jawaban terbaru seluruh anak, dan penanda "Perhitungan otomatis" ditampilkan di pojok kanan atas. Bagian hasil dilengkapi kolom pencarian, pilihan pengurutan, jumlah anak yang penilaiannya sudah lengkap, dan waktu pembaruan terakhir. Keterangan kategori skala nilai ditampilkan dalam tiga warna, yaitu Rendah (hijau), Sedang (kuning), dan Tinggi (merah), diikuti bobot setiap kriteria C1 sampai C6 beserta jenis kriterianya. Hasil disajikan dalam tabel berisi identitas anak, nilai kriteria C1 sampai C6 yang diberi warna sesuai kategorinya, nilai Yi, ranking, dan tombol "Lihat". Seperti pada Gambar 4.6, judul kolom identitas anak berupa dropdown untuk memilih tampilan kode anak, nama, atau nama panggilan. Tampilan awal halaman bersifat hanya baca.

## Gambar 4.9 Hasil Implementasi Halaman Detail Penilaian (Mode Lihat)

Halaman ini menampilkan rincian penilaian seorang anak dalam mode hanya baca dan dibuka melalui tombol "Lihat" pada halaman Penilaian. Bagian atas memuat identitas anak berupa kelas, tahun ajaran, nama, kode anak, nama panggilan, dan penanda mode lihat, dilengkapi ikon mata untuk menampilkan atau menyembunyikan nama anak sehingga nama dan nama panggilan dapat diganti tanda bintang. Pada akun Kepala Sekolah terdapat penanda "Hanya baca" dan keterangan bahwa halaman ditampilkan dalam mode read-only, sedangkan pada akun Tim Pendidik tersedia tombol hijau "Edit Penilaian". Di bawahnya terdapat kartu nilai Yi dan ranking. Apabila jawaban belum lengkap, kedua kartu menampilkan tanda "—" beserta keterangan jumlah indikator yang sudah dinilai. Kartu "Informasi Capaian" menjelaskan arti setiap poin penilaian, yaitu Sudah Bisa (poin 1), Mulai Bisa (poin 2), dan Belum Bisa (poin 3), beserta deskripsinya. Bagian bawah memuat jawaban penilaian per kriteria beserta filter capaian dan penanda "Lengkap" atau "Belum lengkap". Setiap kriteria diawali judul yang menampilkan kode dan nama kriteria, jumlah indikator yang sudah dinilai, serta nilai kriteria beserta kategorinya. Judul tersebut diikuti tabel berisi nomor indikator, teks indikator, dan satu kolom untuk setiap opsi jawaban. Opsi yang dipilih ditandai kotak centang hijau, sedangkan indikator yang belum dinilai diberi tanda peringatan.

## Gambar 4.10 Hasil Implementasi Halaman Detail Penilaian (Mode Edit)

Halaman ini memiliki susunan yang sama dengan mode lihat, tetapi digunakan oleh Tim Pendidik untuk mengisi jawaban penilaian setelah menekan tombol "Edit Penilaian". Kartu identitas anak menampilkan penanda mode edit berwarna hijau dan tombol biru "Selesai". Pada bagian jawaban, setiap indikator ditampilkan dengan kode dan teks pertanyaannya, diikuti tombol pilihan opsi jawaban. Opsi yang dipilih ditandai warna hijau dan ikon centang. Jawaban tersimpan otomatis setiap kali dipilih, dan nilai Yi serta ranking ikut diperbarui. Filter capaian tetap tersedia untuk menampilkan indikator yang belum dinilai.

## Gambar 4.11 Hasil Implementasi Halaman Laporan Perhitungan

Halaman laporan menyajikan seluruh tahapan perhitungan secara transparan dan hanya baca. Bagian atas berisi pilihan tahun ajaran dan kelas serta tombol hijau "Download". Setelah kelas dipilih, pengguna dapat melihat tahapan secara berurutan, dimulai dari tabel kriteria penilaian dan bobot prioritas hasil AHP yang memuat inisial, nama kriteria, jenis MOORA, dan bobot, beserta status konsistensi (CR ≤ 0,1000). Tahapan berikutnya adalah hasil penilaian dan prioritas stimulasi berupa nilai kriteria, nilai optimasi (Yi), dan ranking, dilengkapi kolom pencarian, pengurutan, keterangan kategori skala nilai, dan dropdown pada judul kolom identitas anak untuk memilih tampilan kode anak, nama, atau nama panggilan, kemudian tahapan perhitungan MOORA lainnya dalam bentuk tabel.

## Gambar 4.12 Hasil Implementasi Halaman Kriteria dan Bobot

Halaman khusus Kepala Sekolah ini digunakan untuk mengelola kriteria dan bobot AHP. Bagian pertama berupa tabel daftar kriteria yang memuat inisial, nama kriteria, jenis kriteria, bobot AHP, serta tombol "Edit" dan "Hapus", dengan tombol "Tambah Kriteria" di bagian atas. Bagian kedua berupa matriks perbandingan berpasangan 6 × 6 yang dapat diubah melalui tombol hijau "Edit Matriks", dilengkapi panduan skala Saaty 1 sampai 9 dan batas konsistensi CR ≤ 0,1000. Sel diagonal matriks bernilai 1 dan ditampilkan berwarna abu-abu. Bobot setiap kriteria tampil pada kolom terakhir matriks. Hasil pemeriksaan konsistensi ditampilkan pada kotak hijau di bawah matriks dengan tulisan "Matriks konsisten" beserta nilai CR, dan keterangan bahwa bobot kriteria sah dan dapat disimpan untuk digunakan pada perankingan MOORA. Perubahan hanya dapat disimpan ke database setelah nilai matriks konsisten.

## Gambar 4.13 Hasil Implementasi Formulir Tambah Kriteria

Formulir ini tampil sebagai jendela pop-up di atas halaman Kriteria dan Bobot setelah tombol "Tambah Kriteria" ditekan. Inisial kriteria terisi otomatis oleh sistem dan tidak dapat diubah. Pengguna mengisi nama kriteria dan memilih jenis kriteria MOORA, yaitu benefit atau cost, melalui dropdown. Di bagian bawah terdapat tombol "Batal" dan "Simpan Kriteria".

## Gambar 4.14 Hasil Implementasi Halaman Opsi Jawaban dan Indikator

Halaman khusus Kepala Sekolah ini terdiri dari dua bagian. Bagian pertama mengelola opsi jawaban, yaitu skala penilaian baku yang berlaku untuk semua kriteria dan indikator. Tabelnya memuat nomor, teks opsi, keterangan, dan poin penilaian (skor kebutuhan), serta tombol "Ubah" dan "Hapus", dengan tombol "Tambah Opsi" dan jumlah total opsi di bagian atas. Bagian kedua mengelola indikator pertanyaan observasi, di mana pengguna memilih kriteria penilaian melalui dropdown lalu menambah, mengubah, atau menghapus pertanyaan pada kriteria tersebut. Setiap pertanyaan ditampilkan dalam kartu bernomor yang memuat kode kriteria dan tombol "Edit" serta "Hapus".

## Gambar 4.15 Hasil Implementasi Formulir Tambah Indikator

Formulir ini tampil sebagai jendela pop-up di atas halaman Opsi Jawaban dan Indikator setelah tombol "Tambah Indikator" ditekan. Kolom kriteria penilaian terisi otomatis sesuai kriteria yang dipilih dan tidak dapat diubah, sehingga pengguna hanya mengisi teks pertanyaan observasi. Catatan di bagian bawah menjelaskan bahwa jawaban anak memakai master opsi jawaban yang sudah diatur pada halaman yang sama. Di bagian bawah terdapat tombol "Batal" dan "Simpan Indikator".

## Gambar 4.16 Hasil Implementasi Halaman Kelola Pengguna

Halaman ini digunakan Kepala Sekolah untuk mengelola akun pengguna. Daftar akun ditampilkan dalam tabel berisi nama, email, peran, dan tanggal dibuat, dengan jumlah total akun dan tombol "Tambah Tim Pendidik" untuk mendaftarkan akun baru. Peran Tim Pendidik dan Kepala Sekolah dibedakan dengan label berwarna biru dan ungu. Akun Tim Pendidik memiliki tombol "Reset Password", yang mengembalikan sandi ke sandi bawaan, dan "Hapus", yang menghapus akun secara permanen, sedangkan akun Kepala Sekolah tidak memiliki tombol aksi.

## Gambar 4.17 Hasil Implementasi Formulir Tambah Akun Tim Pendidik

Formulir ini tampil sebagai jendela pop-up di atas halaman Kelola Pengguna setelah tombol "Tambah Tim Pendidik" ditekan. Pengguna mengisi nama lengkap, email, dan password awal minimal 6 karakter yang wajib diisi. Catatan di bagian bawah menjelaskan bahwa akun yang dibuat otomatis berperan sebagai Tim Pendidik dan dapat langsung digunakan untuk login. Di bagian bawah terdapat tombol "Batal" dan "Simpan Akun".

## Gambar 4.18 Hasil Implementasi Halaman Kelola Akun

Halaman ini digunakan setiap pengguna untuk mengatur akunnya sendiri dan dilengkapi tautan "Kembali ke Dashboard". Isinya dua kartu, yaitu "Informasi Profil" yang berisi kolom nama lengkap dan email dengan tombol biru "Simpan Perubahan", serta "Keamanan" yang berisi kolom password baru dan konfirmasi password dengan tombol merah "Update Password".
