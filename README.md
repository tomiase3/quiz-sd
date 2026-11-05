# Math Adventure — Kelas V

Aplikasi belajar matematika interaktif untuk **SD Negeri 020620 Binjai**. Berisi delapan permainan, masing-masing 20 soal, profil siswa, penyesuaian tingkat kesulitan, audio yang dapat dinyalakan/dimatikan, dashboard guru, penyimpanan lokal/cloud, dan ekspor laporan.

## Menjalankan aplikasi

Buka `index.html` di browser modern atau sajikan folder ini melalui static web server. Internet hanya diperlukan untuk mengunduh font Google Fonts dan saat menyinkronkan ke Supabase.

## Fitur

- Materi: Pecahan; Desimal dan Persen; KPK dan FPB; Operasi Bilangan Cacah; Keliling dan Luas Bangun Datar; Sudut; Bangun Datar; Pengolahan Data.
- Setiap misi memiliki 20 soal. Tingkat soal mengikuti performa pemain: dua jawaban benar beruntun dapat menaikkan level; jawaban salah menurunkan level.
- Profil nama dan kelas siswa; ringkasan hasil dan dashboard guru.
- Data dashboard dan ekspor Excel, Word, serta PDF hanya ditampilkan setelah sesi guru berhasil diverifikasi ke Supabase.
- Audio bunyi jawaban dapat dimatikan. Profil, pengaturan, dan hasil tetap tersimpan pada browser ketika offline.
- Ekspor Excel melalui CSV (dibuka oleh Excel), Word melalui `.doc`, dan PDF melalui dialog cetak browser (pilih **Save as PDF / Simpan sebagai PDF**).

## Mengaktifkan Supabase

1. Buat proyek di [Supabase](https://supabase.com).
2. Pada **SQL Editor**, jalankan skrip dalam [`supabase.sql`](./supabase.sql).
3. Matikan **Allow new users to sign up** di **Authentication → Settings → User Signups**, lalu buat setiap akun guru melalui **Authentication → Users → Add user**. Akun yang berhasil login memiliki izin membaca data cloud; jangan aktifkan pendaftaran publik.
4. Project URL dan publishable key proyek sudah dikonfigurasi di aplikasi. Buka melalui VS Code Live Server atau hosting web (jangan `file://`), lalu pilih **Dashboard Guru**.
5. Login pada Dashboard Guru menggunakan akun tadi untuk melihat data cloud. Akun guru tidak disimpan di dalam kode.

Jangan masukkan `service_role` key. Kebijakan Row Level Security pada skrip membolehkan pemain mengirim hasil baru, tetapi hanya akun guru yang terautentikasi yang dapat membaca data cloud. Nonaktifkan pendaftaran publik agar akun luar tidak dapat memperoleh akses tersebut. Skrip sengaja tidak memberi hak update/delete melalui peran `anon`; hapus data cloud melalui Supabase Dashboard sebagai administrator. Pengiriman publik tanpa login tetap perlu proteksi anti-spam/rate limiting sebelum digunakan untuk data siswa sungguhan.
