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

## 4. Komitmen Konsistensi
* Jaga kebersihan kode (clean code) dan gunakan **TypeScript** yang aman.
* Lakukan verifikasi build (`npm run build`) dan linting (`npm run lint`) setiap setelah melakukan perubahan guna memastikan aplikasi selalu siap dirilis tanpa error.
