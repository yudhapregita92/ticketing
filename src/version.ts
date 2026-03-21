export const APP_VERSION = "1.6.0";
export const BUILD_DATE = "2026-03-21";

// Deteksi apakah berjalan di Staging atau Production
export const getEnvironment = () => {
  if (typeof window === 'undefined') return 'Production';
  const hostname = window.location.hostname;
  if (hostname.includes('localhost') || hostname.includes('ais-dev')) {
    return 'Staging';
  }
  return 'Production';
};

export interface VersionUpdate {
  version: string;
  date: string;
  changes: string[];
}

export const UPDATE_HISTORY: VersionUpdate[] = [
  {
    version: "1.6.0",
    date: "2026-03-21",
    changes: [
      "Implementasi Master Data Caching (Offline Support)",
      "Akses data Departemen, Kategori, dan Master User saat offline",
      "Peningkatan performa dengan sistem caching cerdas",
      "Perbaikan bug akses data master untuk user non-admin"
    ]
  },
  {
    version: "1.5.0",
    date: "2026-03-21",
    changes: [
      "Implementasi Offline Queue (Antrian Tiket Offline)",
      "Sistem sinkronisasi otomatis saat koneksi internet kembali pulih",
      "Banner indikator status sinkronisasi offline di halaman utama",
      "Peningkatan ketahanan aplikasi terhadap gangguan jaringan"
    ]
  },
  {
    version: "1.4.0",
    date: "2026-03-20",
    changes: [
      "Refaktor Frontend menggunakan React Query (Caching & Auto-polling)",
      "Implementasi Haptic Feedback (Getaran) untuk interaksi mobile",
      "Peningkatan Skeleton Loading dengan efek Shimmer yang lebih modern",
      "Optimasi sinkronisasi data real-time via Socket.IO",
      "Perbaikan manajemen state global dan modularitas komponen"
    ]
  },
  {
    version: "1.3.0",
    date: "2026-03-20",
    changes: [
      "Refaktor arsitektur backend menjadi modular (Route Separation)",
      "Implementasi Global Error Handling & AppError class",
      "Peningkatan keamanan dengan Password Hashing (bcryptjs)",
      "Peningkatan Type Safety di seluruh backend (TypeScript Interfaces)",
      "Optimasi performa query database SQLite",
      "Sistem logging login admin untuk audit trail"
    ]
  },
  {
    version: "1.2.0",
    date: "2026-03-15",
    changes: [
      "Optimasi kecepatan loading awal (Lazy Loading)",
      "Sistem caching pengaturan di LocalStorage",
      "Perbaikan PWA untuk perangkat iOS",
      "Penambahan fitur PWA Shortcuts (Buat Tiket & Cek Status)",
      "Sistem tracking versi aplikasi"
    ]
  },
  {
    version: "1.1.0",
    date: "2026-03-14",
    changes: [
      "Implementasi Splash Screen / Animasi Booting",
      "Perbaikan sinkronisasi ikon PWA",
      "Optimasi database SQLite"
    ]
  },
  {
    version: "1.0.0",
    date: "2026-03-10",
    changes: [
      "Rilis awal sistem IT Helpdesk K3DK",
      "Fitur manajemen tiket dan dashboard admin"
    ]
  }
];
