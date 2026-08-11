import { IActivityLog } from '../types';

const STORAGE_KEY = 'kdk_activity_logs';

export const getInitialActivityLogs = (): IActivityLog[] => {
  const initialLogs: IActivityLog[] = [
    {
      id: 'log-1',
      timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
      user_name: 'Super Admin IT',
      user_role: 'Super Admin',
      action_type: 'CREATE',
      module: 'Manajemen Aset',
      description: 'Menambahkan Aset Capex baru: Laptop Asus Zenbook (AST-PCKDK-088)',
      ip_address: '192.168.1.10'
    },
    {
      id: 'log-2',
      timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
      user_name: 'Budi Santoso',
      user_role: 'Staff IT Support',
      action_type: 'UPDATE',
      module: 'Tiket IT',
      description: 'Mengubah status tiket #TKT-2026-0810 menjadi Completed (Selesai)',
      ip_address: '192.168.1.15'
    },
    {
      id: 'log-3',
      timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
      user_name: 'Super Admin IT',
      user_role: 'Super Admin',
      action_type: 'DELETE',
      module: 'Master User',
      description: 'Menghapus akun user tidak aktif: Hendra (Index 8092)',
      ip_address: '192.168.1.10'
    },
    {
      id: 'log-4',
      timestamp: new Date(Date.now() - 1000 * 60 * 240).toISOString(),
      user_name: 'Eko Sulistyo',
      user_role: 'Staff IT Support',
      action_type: 'LOGIN',
      module: 'Sistem',
      description: 'Login berhasil ke Dashboard Admin IT',
      ip_address: '192.168.1.22'
    },
    {
      id: 'log-5',
      timestamp: new Date(Date.now() - 1000 * 60 * 360).toISOString(),
      user_name: 'Super Admin IT',
      user_role: 'Super Admin',
      action_type: 'EXPORT',
      module: 'Report SLA',
      description: 'Mengeksport Laporan SLA IT Bulanan ke Excel',
      ip_address: '192.168.1.10'
    }
  ];
  return initialLogs;
};

export const getActivityLogs = (): IActivityLog[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const initial = getInitialActivityLogs();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to load activity logs:', err);
    return getInitialActivityLogs();
  }
};

export const addActivityLog = (logData: Omit<IActivityLog, 'id' | 'timestamp'>) => {
  try {
    const logs = getActivityLogs();
    const newLog: IActivityLog = {
      ...logData,
      id: 'log-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
      timestamp: new Date().toISOString()
    };
    const updated = [newLog, ...logs].slice(0, 500);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event('kdk_activity_log_updated'));
    return newLog;
  } catch (err) {
    console.error('Failed to save activity log:', err);
    return null;
  }
};

export const clearActivityLogs = () => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
    window.dispatchEvent(new Event('kdk_activity_log_updated'));
  } catch (err) {
    console.error('Failed to clear activity logs:', err);
  }
};
