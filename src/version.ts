export const APP_VERSION = "1.2.0";
export const BUILD_DATE = "2026-03-15";

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
