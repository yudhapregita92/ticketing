import React, { useState, useEffect } from 'react';
import { MapPin, AlertTriangle, RefreshCw } from 'lucide-react';
import { api } from '../services/api';

interface AdminLocationEnforcerProps {
  adminUser: any;
  children: React.ReactNode;
}

export function AdminLocationEnforcer({ adminUser, children }: AdminLocationEnforcerProps) {
  const [locationStatus, setLocationStatus] = useState<'pending' | 'granted' | 'denied'>('pending');
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    // If not an admin user, or if Super Admin, skip enforcement
    if (!adminUser || adminUser.role === 'Super Admin') return;

    const checkLocation = () => {
      setLocationStatus('pending');
      
      if (!navigator.geolocation) {
        setLocationStatus('denied');
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLocationStatus('granted');
          // Update location once on grant
          try {
            api.updateTeamLocation({
              username: adminUser.username,
              full_name: adminUser.full_name || adminUser.username,
              role: adminUser.role || 'IT Support',
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
              accuracy: pos.coords.accuracy,
              provider: 'web',
              note: 'Auto Check-in (Enforcer)'
            });
          } catch (e) {
            // ignore
          }
        },
        (err) => {
          console.error("Location error:", err);
          setLocationStatus('denied');
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
      );
    };

    checkLocation();
  }, [adminUser, retryCount]);

  if (!adminUser || adminUser.role === 'Super Admin') {
    return <>{children}</>;
  }

  if (locationStatus === 'pending') {
    return (
      <div className="fixed inset-0 z-[9999] bg-slate-900 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-6"></div>
        <h2 className="text-2xl font-black text-white mb-2">Memeriksa Akses GPS...</h2>
        <p className="text-slate-400">Silakan izinkan akses lokasi (GPS) pada browser Anda untuk melanjutkan ke Halaman Admin.</p>
      </div>
    );
  }

  if (locationStatus === 'denied') {
    return (
      <div className="fixed inset-0 z-[9999] bg-slate-900 flex flex-col items-center justify-center p-6 text-center">
        <div className="p-4 bg-red-500/10 rounded-full mb-6">
          <AlertTriangle className="w-12 h-12 text-red-500" />
        </div>
        <h2 className="text-2xl font-black text-white mb-3">Akses GPS Diperlukan</h2>
        <p className="text-slate-400 max-w-md mx-auto mb-8">
          Untuk alasan keamanan dan operasional, akses halaman Admin mewajibkan fitur GPS diaktifkan. 
          Silakan izinkan akses lokasi pada browser Anda, lalu coba lagi.
        </p>
        
        <button
          onClick={() => setRetryCount(c => c + 1)}
          className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center gap-2 shadow-lg transition-all active:scale-95"
        >
          <RefreshCw className="w-5 h-5" />
          <span>Coba Ulang Akses GPS</span>
        </button>
      </div>
    );
  }

  return <>{children}</>;
}
