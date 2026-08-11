# Panduan dan Kesepakatan Pengembangan (Development Guidelines)

File ini menyimpan kesepakatan, aturan, dan komitmen antara Pengguna (User) dan AI Agent untuk menjaga konsistensi, keandalan, dan keselamatan aplikasi ini. AI Agent berikutnya wajib membaca dan mematuhi instruksi dalam file ini sepenuhnya.

---

## 1. Kesepakatan Utama: Tanya Jawab & Konfirmasi Ulang (MANDATORY)
* **Aturan Emas**: AI Agent **DILARANG KERAS** langsung mengeksekusi penulisan kode atau perubahan fitur secara sepihak setelah menerima instruksi pertama dari User.
* **Prosedur Wajib**:
  1. **Diskusikan Terlebih Dahulu**: Berikan analisis, pandangan, atau opini mengenai request tersebut.
  2. **Minta Konfirmasi**: Jelaskan rancangan perubahan secara singkat dan minta persetujuan eksplisit dari User (misalnya: *"Apakah Anda setuju jika bagian ini kita ubah seperti ini?"*).
  3. **Eksekusi Hanya Setelah Disetujui**: Setelah User memberikan persetujuan eksplisit (seperti *"Ya, kerjakan"*, *"Lanjut"*, dll.), barulah AI Agent boleh menulis kode atau melakukan modifikasi.

---

## 2. Keselamatan Data (Data Safety & Preservation)
* **Proteksi Excel Import**: Ketika melakukan import data keanggotaan (membership) melalui Excel, data yang sudah ada (termasuk foto/avatar dan tanda tangan digital) **tidak boleh tertimpa, terhapus, atau hilang** jika data tersebut diidentifikasi sebagai anggota yang sama. Lakukan proses merge/update secara aman.
* **No Destructive Actions**: Selalu prioritaskan keamanan database dan status antrian yang sedang berjalan. Jangan menghapus atau me-reset data tanpa konfirmasi berlapis.

---

## 3. Gaya Menu Navigasi & Tema Admin (Admin Themes)
Aplikasi ini mendukung beberapa variasi tata letak (layout) dan tema khusus untuk Dashboard Admin yang dapat diubah melalui tab **Sistem** di Pengaturan:
1. **Modern (Sidebar)**: Tampilan bawaan menggunakan Sidebar fungsional (Violet/Zinc).
2. **Cosmic (Teal Neon)**: Tema futuristik gelap/terang dengan aksen Teal neon bercahaya (glowing).
3. **Compact (Minimal)**: Meminimalkan navigasi sidebar hanya menjadi ikon (icon-only) serta menyembunyikan panel statistik sekunder untuk menghemat ruang kerja.
4. **Executive (Top Menu)**: Memindahkan seluruh menu navigasi dari sidebar vertikal ke bar horizontal di bagian atas halaman (horizontal top menu).
5. **Cyberpunk (Sunset)**: Tema retro futuristik dengan aksen magenta/fuchsia bercahaya (glowing).
6. **Forest (Organic)**: Tema ramah lingkungan dengan aksen hijau segar (emerald/mint).
7. **Terminal (Amber)**: Tema retro bergaya konsol dengan font monospaced dan warna kuning amber klasik.
8. **Ocean Breeze**: Tema sejuk dengan nuansa gradasi biru samudra dan aksen es es krim yang menyegarkan.
9. **Sakura Dream**: Tema estetis bertema bunga sakura dengan warna merah muda pastel yang sangat lembut.
10. **Royal Velvet**: Tema premium eksklusif memadukan ungu beludru tua dan sentuhan aksen emas kerajaan yang elegan.

*Setiap perubahan fitur di masa mendatang **harus mempertahankan kecocokan (compatibility)** di semua tata letak dan tema admin tersebut tanpa merusak fungsionalitas utama.*

---

## 4. Pemisahan Desain & Fitur User vs Admin
* **Skema Warna Navigasi & Tema**:
  * **Halaman Admin**: Menggunakan tema warna aksen **Biru (Blue/Sky)** untuk item aktif dan tombol navigasi utama. Menu "Tiket" di Admin menggunakan format dropdown/grouping.
  * **Halaman User (Public)**: Menggunakan tema warna aksen **Hijau (Emerald/Green)** untuk item aktif dan tombol navigasi utama. Menu "Tiket" di halaman User ditampilkan langsung (tanpa dropdown/toggle) agar mudah diakses langsung.
* **Eliminasi Tab Menu Ganda (Single Tab Navigation)**:
  * Pada tampilan Admin (terutama mobile/layar kecil), tab filter tiket ("Hari Ini", "Semua", "Tiket Saya") **TIDAK BOHLEH ganda**.
  * Tab bagian atas pada `MobileAppNav` disembunyikan saat daftar tiket aktif, sehingga navigasi tab hanya fokus dan terpusat satu kali pada baris utama `TicketList`.
* **Prinsip**: Desain dan pembeda visual antara halaman User dan Admin harus selalu konsisten dan dapat dibedakan dengan jelas.

---

## 5. Aturan Penanganan SLA Tiket IT (Dipinjamkan vs Harus Dibeli)
* **Status "Dipinjamkan" (Unit Pengganti)**:
  * Tiket utama langsung diubah statusnya menjadi **Completed (Selesai)**.
  * **Alasan**: Kendala operasional pemohon telah tuntas dengan adanya unit pengganti. Peminjaman fisik perangkat otomatis dicatat dan dikelola di **Manajemen Aset (Aset Dipinjamkan)** agar SLA penanganan tiket tidak menggantung/memburuk.
* **Status "Harus Dibeli" (Pengadaan)**:
  * Tiket diubah statusnya menjadi **Pending (Menunggu Pengadaan)**.
  * Jam SLA penanganan IT otomatis **DIBEKUKAN / PAUSED** agar proses pembelian oleh Purchasing tidak merusak performa SLA tim IT.

---

## 6. Aturan Penguncian Petugas IT pada Modal WhatsApp (WhatsApp Agent Locking)
* **Penguncian Otomatis (Locked State)**:
  * Pada modal "Teruskan Tiket ke WhatsApp", target Petugas IT **dikunci secara permanen** pada agen yang menangani tiket tersebut (`assigned_to`) atau petugas default.
  * Opsi tombol "Ganti Agen" ditiadakan/dikunci dari antarmuka pengguna agar tiket selalu terkirim secara konsisten ke petugas IT yang tepat dan bertanggung jawab, menghindari kesalahan pengiriman pesan ke agen lain.

---

## 7. Optimasi Tampilan Mobile Manajemen Aset (Filter & Tombol Tambah Aset)
* **Penyederhanaan Filter di Handphone**:
  * Opsi filter aset (Kategori, Departemen, Status Pengguna, Status Aset, Kondisi Fisik) pada tampilan HP/mobile disembunyikan secara bawaan dan dapat dibuka-tutup dengan tombol toggle **"Filter"** (dilengkapi indikator jumlah filter aktif).
* **Visibilitas Tombol Tambah Aset di Mobile**:
  * Tombol **"Tambah Aset"** / **"Tambah"** selalu ditampilkan secara jelas di tampilan mobile (baik sejajar dengan kolom pencarian maupun pada toolbar aksi) agar admin dapat menambah aset baru dari HP dengan mudah tanpa kehilangan akses fitur.

---

## 8. Komitmen Konsistensi
* Jaga kebersihan kode (clean code) dan gunakan **TypeScript** yang aman.
* Lakukan verifikasi build (`npm run build`) dan linting (`npm run lint`) setiap setelah melakukan perubahan guna memastikan aplikasi selalu siap dirilis tanpa error.
