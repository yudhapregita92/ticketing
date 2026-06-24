import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Activity, Plus, Search, Trash2, Edit, RefreshCw, Monitor, Video, Radio, AlertCircle, Wifi, Server } from 'lucide-react';
import toast from 'react-hot-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface NetworkMonitorProps {
  isDark: boolean;
  themeClasses: any;
  primaryColor: string;
  adminUser: any;
}

interface Device {
  id: number;
  name: string;
  ip_address: string;
  type: string;
  location: string;
  status: string;
  last_checked: string;
}

const NetworkMonitor: React.FC<NetworkMonitorProps> = ({ isDark, themeClasses, primaryColor, adminUser }) => {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingDevice, setEditingDevice] = useState<Device | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    ip_address: '',
    type: 'Komputer',
    location: ''
  });

  const { data: devices = [], isLoading, refetch } = useQuery({
    queryKey: ['network-devices'],
    queryFn: async () => {
      const res = await fetch('/api/network/devices');
      if (!res.ok) throw new Error('Failed to fetch devices');
      return res.json() as Promise<Device[]>;
    }
  });

  const scanMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/network/scan', { method: 'POST' });
      if (!res.ok) throw new Error('Failed to scan devices');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['network-devices'] });
      toast.success('Pemindaian jaringan selesai');
    },
    onError: () => {
      toast.error('Gagal melakukan pemindaian');
    }
  });

  const addMutation = useMutation({
    mutationFn: async (newDevice: any) => {
      const res = await fetch('/api/network/devices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newDevice)
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to add device');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['network-devices'] });
      toast.success('Perangkat berhasil ditambahkan');
      setShowAddForm(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.message);
    }
  });

  const updateMutation = useMutation({
    mutationFn: async (device: any) => {
      const res = await fetch(`/api/network/devices/${device.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(device)
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to update device');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['network-devices'] });
      toast.success('Perangkat berhasil diperbarui');
      setEditingDevice(null);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.message);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/network/devices/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete device');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['network-devices'] });
      toast.success('Perangkat berhasil dihapus');
    },
    onError: () => {
      toast.error('Gagal menghapus perangkat');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingDevice) {
      updateMutation.mutate({ ...formData, id: editingDevice.id });
    } else {
      addMutation.mutate(formData);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      ip_address: '',
      type: 'Komputer',
      location: ''
    });
    setEditingDevice(null);
    setShowAddForm(false);
  };

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case 'Komputer': return <Monitor className="w-5 h-5" />;
      case 'CCTV': return <Video className="w-5 h-5" />;
      case 'Radio': return <Radio className="w-5 h-5" />;
      case 'Server': return <Server className="w-5 h-5" />;
      default: return <Wifi className="w-5 h-5" />;
    }
  };

  const filteredDevices = devices.filter(d => 
    d.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    d.ip_address.includes(searchQuery) ||
    d.location?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const onlineCount = devices.filter(d => d.status === 'Online').length;
  const offlineCount = devices.filter(d => d.status === 'Offline').length;

  return (
    <div className={`p-4 sm:p-6 lg:p-8 rounded-3xl ${themeClasses.card} shadow-sm border ${isDark ? 'border-zinc-800' : 'border-slate-100'} mb-6 min-h-[500px]`}>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold tracking-tight">Monitoring Jaringan</h2>
            <p className={`text-sm ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
              Status: <span className="text-emerald-500 font-bold">{onlineCount} Online</span> • <span className="text-rose-500 font-bold">{offlineCount} Offline</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => scanMutation.mutate()}
            disabled={scanMutation.isPending}
            className={`flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
              isDark ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <RefreshCw className={`w-4 h-4 ${scanMutation.isPending ? 'animate-spin' : ''}`} />
            Scan
          </button>
          {(adminUser?.role === 'Super Admin' || adminUser?.role === 'Staff IT Support') && (
            <button
              onClick={() => setShowAddForm(true)}
              className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-bold transition-all hover:opacity-90 flex-1 sm:flex-none shadow-md shadow-indigo-500/20"
              style={{ backgroundColor: primaryColor }}
            >
              <Plus className="w-4 h-4" />
              Tambah
            </button>
          )}
        </div>
      </div>

      <div className="mb-6 relative">
        <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${isDark ? 'text-zinc-500' : 'text-slate-400'}`} />
        <input
          type="text"
          placeholder="Cari nama, IP, atau lokasi..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className={`w-full pl-10 pr-4 py-2.5 rounded-xl border focus:outline-none focus:ring-2 transition-all ${
            isDark 
              ? 'bg-zinc-900 border-zinc-800 focus:border-zinc-700 text-white placeholder-zinc-500 focus:ring-zinc-800' 
              : 'bg-slate-50 border-slate-200 focus:border-slate-300 text-slate-900 placeholder-slate-400 focus:ring-slate-200'
          }`}
        />
      </div>

      {(showAddForm || editingDevice) && (
        <motion.form 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-2xl border mb-6 ${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-slate-50 border-slate-200'}`}
          onSubmit={handleSubmit}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div>
              <label className={`block text-xs font-bold mb-1.5 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>Nama Perangkat</label>
              <input
                required
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className={`w-full px-3 py-2 rounded-lg border text-sm focus:outline-none ${
                  isDark ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                }`}
                placeholder="Ex: PC Admin 1"
              />
            </div>
            <div>
              <label className={`block text-xs font-bold mb-1.5 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>IP Address</label>
              <input
                required
                type="text"
                value={formData.ip_address}
                onChange={(e) => setFormData({...formData, ip_address: e.target.value})}
                className={`w-full px-3 py-2 rounded-lg border text-sm focus:outline-none ${
                  isDark ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                }`}
                placeholder="192.168.1.10"
              />
            </div>
            <div>
              <label className={`block text-xs font-bold mb-1.5 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>Tipe</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({...formData, type: e.target.value})}
                className={`w-full px-3 py-2 rounded-lg border text-sm focus:outline-none ${
                  isDark ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                }`}
              >
                <option value="Komputer">Komputer</option>
                <option value="CCTV">CCTV</option>
                <option value="Radio">Radio</option>
                <option value="Server">Server</option>
                <option value="Lainnya">Lainnya</option>
              </select>
            </div>
            <div>
              <label className={`block text-xs font-bold mb-1.5 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>Lokasi</label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({...formData, location: e.target.value})}
                className={`w-full px-3 py-2 rounded-lg border text-sm focus:outline-none ${
                  isDark ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                }`}
                placeholder="Ex: Lantai 1"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={resetForm}
              className={`px-4 py-2 rounded-xl text-sm font-bold ${
                isDark ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300' : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
              }`}
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={addMutation.isPending || updateMutation.isPending}
              className="px-4 py-2 rounded-xl text-white text-sm font-bold shadow-md hover:opacity-90"
              style={{ backgroundColor: primaryColor }}
            >
              {editingDevice ? 'Simpan Perubahan' : 'Simpan'}
            </button>
          </div>
        </motion.form>
      )}

      {isLoading ? (
        <div className="flex justify-center py-12">
          <RefreshCw className={`w-8 h-8 animate-spin ${isDark ? 'text-zinc-600' : 'text-slate-400'}`} />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDevices.map((device) => (
            <motion.div
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              key={device.id}
              className={`p-4 rounded-2xl border flex flex-col gap-3 relative overflow-hidden ${
                isDark ? 'bg-zinc-900/50 border-zinc-800' : 'bg-white border-slate-200 shadow-sm'
              }`}
            >
              <div className={`absolute top-0 left-0 w-1.5 h-full ${
                device.status === 'Online' ? 'bg-emerald-500' :
                device.status === 'Offline' ? 'bg-rose-500' : 'bg-slate-400'
              }`} />
              
              <div className="flex justify-between items-start pl-2">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
                    device.status === 'Online' 
                      ? 'bg-emerald-50 border-emerald-100 text-emerald-600 dark:bg-emerald-950/30 dark:border-emerald-900/50 dark:text-emerald-400'
                      : device.status === 'Offline'
                      ? 'bg-rose-50 border-rose-100 text-rose-600 dark:bg-rose-950/30 dark:border-rose-900/50 dark:text-rose-400'
                      : 'bg-slate-50 border-slate-200 text-slate-500 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-400'
                  }`}>
                    {getDeviceIcon(device.type)}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm tracking-tight">{device.name}</h3>
                    <p className={`text-xs font-mono mt-0.5 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                      {device.ip_address}
                    </p>
                  </div>
                </div>
                
                {(adminUser?.role === 'Super Admin' || adminUser?.role === 'Staff IT Support') && (
                  <div className="flex items-center gap-1">
                    <button 
                      onClick={() => {
                        setEditingDevice(device);
                        setFormData({
                          name: device.name,
                          ip_address: device.ip_address,
                          type: device.type,
                          location: device.location || ''
                        });
                        setShowAddForm(false);
                      }}
                      className={`p-1.5 rounded-lg ${isDark ? 'hover:bg-zinc-800 text-zinc-400 hover:text-white' : 'hover:bg-slate-100 text-slate-400 hover:text-slate-800'}`}
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      onClick={() => {
                        if (window.confirm('Yakin ingin menghapus perangkat ini?')) {
                          deleteMutation.mutate(device.id);
                        }
                      }}
                      className={`p-1.5 rounded-lg ${isDark ? 'hover:bg-rose-900/30 text-zinc-400 hover:text-rose-400' : 'hover:bg-rose-50 text-slate-400 hover:text-rose-500'}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
              
              <div className="pl-2 pt-2 border-t border-dashed mt-1 flex justify-between items-center text-[10px] sm:text-xs">
                <span className={`font-medium ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>
                  {device.location || 'Lokasi tidak diatur'}
                </span>
                <span className={`font-bold px-2 py-0.5 rounded-full ${
                  device.status === 'Online' 
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400'
                    : device.status === 'Offline'
                    ? 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400'
                    : 'bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-zinc-400'
                }`}>
                  {device.status}
                </span>
              </div>
            </motion.div>
          ))}
          {filteredDevices.length === 0 && (
            <div className={`col-span-full py-12 text-center rounded-2xl border border-dashed ${isDark ? 'border-zinc-800' : 'border-slate-200'}`}>
              <AlertCircle className={`w-8 h-8 mx-auto mb-2 ${isDark ? 'text-zinc-600' : 'text-slate-400'}`} />
              <p className={`text-sm font-medium ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>Tidak ada perangkat ditemukan.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NetworkMonitor;
