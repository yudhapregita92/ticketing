import { useEffect } from 'react';
import { api } from '../services/api';

export function useAutoLocationSync(currentUser: any) {
  useEffect(() => {
    if (!currentUser || !currentUser.username) return;

    // Allowed users: Yudha, Bayu, Dita or any IT staff/Super Admin
    const allowedRoles = ['Super Admin', 'Staff IT Support', 'Staff App Support', 'IT Support', 'IT Staff'];
    const userRole = currentUser.role || '';
    const isAllowed = allowedRoles.some(r => userRole.toLowerCase().includes(r.toLowerCase())) || ['yudha', 'bayu', 'dita'].includes(currentUser.username.toLowerCase());

    if (!isAllowed) return;

    const syncLocation = async () => {
      if (!navigator.geolocation) return;

      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          try {
            const lat = pos.coords.latitude;
            const lng = pos.coords.longitude;
            const accuracy = pos.coords.accuracy;
            const speed = pos.coords.speed || 0;

            let battLevel = 85;
            if ('getBattery' in navigator) {
              try {
                const batt: any = await (navigator as any).getBattery();
                battLevel = Math.round(batt.level * 100);
              } catch (e) {
                // ignore battery error
              }
            }

            await api.updateTeamLocation({
              username: currentUser.username,
              full_name: currentUser.full_name || currentUser.username,
              role: currentUser.role || 'IT Support',
              latitude: lat,
              longitude: lng,
              accuracy,
              battery_level: battLevel,
              speed,
              provider: 'web',
              note: 'Auto Sync dari Browser PWA'
            });
          } catch (err) {
            // silent sync error
          }
        },
        (err) => {
          // silent error (permission denied or timeout)
        },
        { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 }
      );
    };

    // Initial sync
    syncLocation();

    // Periodic sync every 3 minutes
    const interval = setInterval(syncLocation, 3 * 60 * 1000);

    return () => clearInterval(interval);
  }, [currentUser]);
}
