const fs = require('fs');
const { Document, Packer, Paragraph, Table, TableRow, TableCell, WidthType, HeadingLevel } = require('docx');

const menus = [
  {
    title: "1. Halaman Login",
    data: [
      ['No', 'Fitur', 'Skenario Pengujian', 'Input', 'Output yang diharapkan', 'Hasil (Screenshoot)', 'Status'],
      ['1', 'Login Valid', 'Menguji login dengan kredensial akun Guru/Admin yang benar', 'Username: guru_b1, Password: password123', 'Berhasil masuk ke halaman dashboard dan menampilkan pesan sukses', '[Screenshoot Dashboard]', 'Valid'],
      ['2', 'Login Invalid (Password Salah)', 'Menguji login dengan password salah', 'Username: guru_b1, Password: wrongpass', 'Gagal masuk, muncul pesan error kredensial salah', '[Screenshoot Error Login]', 'Valid'],
      ['3', 'Login Kosong', 'Menguji login tanpa mengisi input', 'Username: (kosong), Password: (kosong)', 'Muncul validasi field wajib diisi', '[Screenshoot Validasi Kosong]', 'Valid']
    ]
  },
  {
    title: "2. Halaman Dashboard",
    data: [
      ['No', 'Fitur', 'Skenario Pengujian', 'Input', 'Output yang diharapkan', 'Hasil (Screenshoot)', 'Status'],
      ['1', 'Ringkasan Data', 'Melihat informasi statistik jumlah kelas dan anak didik', 'Akses halaman dashboard', 'Menampilkan total kelas, total anak didik kelas B1 2026/2027, dan grafik', '[Screenshoot Dashboard Ringkasan]', 'Valid']
    ]
  },
  {
    title: "3. Halaman Kelas",
    data: [
      ['No', 'Fitur', 'Skenario Pengujian', 'Input', 'Output yang diharapkan', 'Hasil (Screenshoot)', 'Status'],
      ['1', 'Tambah Kelas', 'Menambahkan data kelas baru', 'Nama: B1, Tahun Ajaran: 2026/2027, Guru: Bunda Siti', 'Data kelas baru tersimpan dan muncul di tabel daftar kelas', '[Screenshoot Tambah Kelas]', 'Valid'],
      ['2', 'Edit Kelas', 'Mengubah informasi data kelas', 'Ubah Nama Kelas menjadi: B1 - Unggulan', 'Data kelas terupdate pada tabel', '[Screenshoot Edit Kelas]', 'Valid'],
      ['3', 'Hapus Kelas', 'Menghapus data kelas dari sistem', 'Klik tombol Hapus pada baris kelas B1', 'Data kelas terhapus dari daftar kelas', '[Screenshoot Hapus Kelas]', 'Valid'],
      ['4', 'Tambah Anak', 'Menambahkan data anak didik ke kelas B1 2026/2027', 'Nama: Ahmad Zaki, Kode/NISN: KOD001, JK: Laki-laki', 'Data anak didik masuk ke dalam list kelas B1', '[Screenshoot Tambah Anak]', 'Valid'],
      ['5', 'Edit Anak', 'Mengubah data anak didik', 'Ubah Nama Anak menjadi: Ahmad Zaki Pratama', 'Data anak terupdate', '[Screenshoot Edit Anak]', 'Valid'],
      ['6', 'Hapus Anak', 'Menghapus data anak didik dari kelas', 'Klik tombol Hapus pada baris anak', 'Data anak terhapus dari kelas', '[Screenshoot Hapus Anak]', 'Valid']
    ]
  },
  {
    title: "4. Halaman Kriteria (AHP)",
    data: [
      ['No', 'Fitur', 'Skenario Pengujian', 'Input', 'Output yang diharapkan', 'Hasil (Screenshoot)', 'Status'],
      ['1', 'Tambah Kriteria', 'Menambahkan kriteria penilaian baru', 'Kode: C7, Nama Kriteria: Kreativitas, Bobot: -', 'Kriteria baru berhasil ditambahkan', '[Screenshoot Tambah Kriteria]', 'Valid'],
      ['2', 'Edit Kriteria', 'Mengubah nama atau atribut kriteria', 'Ubah Nama Kriteria menjadi: Kreativitas & Seni', 'Data kriteria terupdate', '[Screenshoot Edit Kriteria]', 'Valid'],
      ['3', 'Hapus Kriteria', 'Menghapus kriteria penilaian', 'Klik Hapus pada kriteria tertentu', 'Kriteria terhapus dari daftar', '[Screenshoot Hapus Kriteria]', 'Valid'],
      ['4', 'Matriks Perbandingan Berpasangan', 'Mengisi perbandingan berpasangan antar kriteria AHP', 'Input skala perbandingan Saaty antar kriteria', 'Matriks tersimpan dan Consistency Ratio (CR < 0.1) tervalidasi', '[Screenshoot Matriks AHP]', 'Valid']
    ]
  },
  {
    title: "5. Halaman Penilaian Capaian Pembelajaran",
    data: [
      ['No', 'Fitur', 'Skenario Pengujian', 'Input', 'Output yang diharapkan', 'Hasil (Screenshoot)', 'Status'],
      ['1', 'Input Penilaian Anak', 'Mengisi nilai capaian sub-kriteria untuk siswa kelas B1 2026/2027', 'Pilih anak Ahmad Zaki, beri nilai pada tiap indikator', 'Data capaian anak tersimpan dengan sukses', '[Screenshoot Form Penilaian]', 'Valid'],
      ['2', 'Edit Penilaian Anak', 'Memperbarui nilai capaian anak didik', 'Ubah nilai pada indikator tertentu', 'Nilai capaian anak terupdate dengan benar', '[Screenshoot Edit Penilaian]', 'Valid'],
      ['3', 'Hapus Penilaian Anak', 'Menghapus data penilaian anak', 'Klik tombol Hapus/Reset nilai', 'Data penilaian anak terhapus', '[Screenshoot Hapus Penilaian]', 'Valid']
    ]
  },
  {
    title: "6. Halaman Laporan & Perhitungan SPK (MOORA)",
    data: [
      ['No', 'Fitur', 'Skenario Pengujian', 'Input', 'Output yang diharapkan', 'Hasil (Screenshoot)', 'Status'],
      ['1', 'Proses Hitung MOORA', 'Melakukan perhitungan metode MOORA untuk kelas B1 2026/2027', 'Filter Kelas: B1 2026/2027, Klik tombol Proses Hitung', 'Tampil Matriks Keputusan, Normalisasi, Nilai Optimasi Yi, dan Perangkingan', '[Screenshoot Hasil MOORA]', 'Valid'],
      ['2', 'Export Laporan', 'Mengekspor laporan hasil perangkingan SPK', 'Klik tombol Export / Cetak Laporan', 'File laporan terunduh dalam format PDF/Excel', '[Screenshoot Export Laporan]', 'Valid']
    ]
  },
  {
    title: "7. Halaman Manajemen Pengguna",
    data: [
      ['No', 'Fitur', 'Skenario Pengujian', 'Input', 'Output yang diharapkan', 'Hasil (Screenshoot)', 'Status'],
      ['1', 'Tambah Pengguna', 'Menambahkan akun pengguna baru (Guru/Admin)', 'Nama: Guru B1, Username: gurub1, Role: Guru', 'Akun pengguna baru berhasil ditambahkan', '[Screenshoot Tambah Pengguna]', 'Valid'],
      ['2', 'Edit Pengguna', 'Mengubah data atau role pengguna', 'Ubah Role menjadi Admin', 'Data pengguna berhasil diperbarui', '[Screenshoot Edit Pengguna]', 'Valid'],
      ['3', 'Hapus Pengguna', 'Menghapus akun pengguna dari sistem', 'Klik Hapus pada baris pengguna', 'Akun pengguna terhapus', '[Screenshoot Hapus Pengguna]', 'Valid']
    ]
  }
];

const docChildren = [];

menus.forEach(menu => {
  docChildren.push(new Paragraph({ text: menu.title, heading: HeadingLevel.HEADING_1 }));
  docChildren.push(new Paragraph(''));
  
  const rows = menu.data.map(row => new TableRow({
    children: row.map(cellText => new TableCell({
      children: [new Paragraph(cellText)],
      width: { size: 1428, type: WidthType.DXA }
    }))
  }));

  docChildren.push(new Table({ rows }));
  docChildren.push(new Paragraph(''));
  docChildren.push(new Paragraph(''));
});

const doc = new Document({
  sections: [{
    properties: {},
    children: docChildren
  }]
});

Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync('docs/testing-manual/blackbox.docx', buffer);
  console.log('Success comprehensive docx generated.');
});
