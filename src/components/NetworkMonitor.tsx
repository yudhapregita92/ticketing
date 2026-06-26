import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Activity, Plus, Search, Trash2, Edit, RefreshCw, Monitor, Video, Radio, AlertCircle, Wifi, Server, Upload, Download, ArrowUp, ArrowDown, Cloud, Settings2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as xlsx from 'xlsx';

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
  const [typeFilter, setTypeFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingDevice, setEditingDevice] = useState<Device | null>(null);
  const [isNewType, setIsNewType] = useState(false);
  
  const [statusFilter, setStatusFilter] = useState<'all' | 'Online' | 'Offline'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  const [formData, setFormData] = useState({
    name: '',
    ip_address: '',
    type: 'Komputer',
    location: ''
  });

  const [viewType, setViewType] = useState<'list' | 'topology'>('list');

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

  const fileInputRef = useRef<HTMLInputElement>(null);

  const bulkMutation = useMutation({
    mutationFn: async (devices: any[]) => {
      const res = await fetch('/api/network/devices/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ devices })
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to bulk add devices');
      }
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['network-devices'] });
      toast.success(`${data.count} Perangkat berhasil diimport`);
      if (fileInputRef.current) fileInputRef.current.value = '';
    },
    onError: (error: any) => {
      toast.error(error.message);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = xlsx.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = xlsx.utils.sheet_to_json(ws);
        
        // Map excel columns to expected device object
        // Assume Excel might have headers like "IP Address" or "ip_address", "Name", "Type", "Location"
        const mappedDevices = data.map((row: any) => {
          const ip = row['IP Address'] || row['ip_address'] || row['ip'] || '';
          const name = row['Name'] || row['Nama'] || row['name'] || `Device ${ip}`;
          const type = row['Type'] || row['Tipe'] || row['type'] || 'Komputer';
          const location = row['Location'] || row['Lokasi'] || row['location'] || '';
          
          return { name, ip_address: ip, type, location };
        }).filter(d => d.ip_address); // Only keep rows with IP addresses
        
        if (mappedDevices.length > 0) {
          bulkMutation.mutate(mappedDevices);
        } else {
          toast.error('Tidak ada data IP Address yang valid ditemukan di file excel.');
        }
      } catch (error) {
        console.error("Error parsing excel:", error);
        toast.error('Gagal membaca file Excel. Pastikan format file sesuai.');
      }
    };
    reader.readAsBinaryString(file);
  };

  const downloadTemplate = () => {
    const templateData = [
      { 'IP Address': '192.168.1.10', 'Nama': 'PC Staff 1', 'Tipe': 'Komputer', 'Lokasi': 'Ruang Admin' },
      { 'IP Address': '192.168.1.11', 'Nama': 'CCTV Pintu Masuk', 'Tipe': 'CCTV', 'Lokasi': 'Lobby' },
      { 'IP Address': '192.168.1.12', 'Nama': 'Server Utama', 'Tipe': 'Server', 'Lokasi': 'Ruang Server' },
      { 'IP Address': '192.168.1.13', 'Nama': 'AP Lt 1', 'Tipe': 'Radio', 'Lokasi': 'Lantai 1' }
    ];
    
    const ws = xlsx.utils.json_to_sheet(templateData);
    
    // Set column widths
    ws['!cols'] = [
      { wch: 15 }, // IP Address
      { wch: 25 }, // Nama
      { wch: 15 }, // Tipe
      { wch: 20 }  // Lokasi
    ];

    const wb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb, ws, 'Template');
    xlsx.writeFile(wb, 'Template_Import_Network.xlsx');
  };

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
    setIsNewType(false);
  };

  const uniqueTypes = React.useMemo(() => {
    return Array.from(new Set(['Komputer', 'CCTV', 'Radio', 'Server', ...devices.map(d => d.type).filter(Boolean)]));
  }, [devices]);
  const uniqueLocations = React.useMemo(() => {
    return Array.from(new Set(devices.map(d => d.location).filter(Boolean)));
  }, [devices]);

  const [isEditingTopology, setIsEditingTopology] = useState(false);
  const [topologyOrder, setTopologyOrder] = useState<string[]>(() => {
    const saved = localStorage.getItem('networkTopologyOrder');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    setTopologyOrder(prev => {
      const newTypes = uniqueTypes.filter(t => !prev.includes(t));
      // Do not filter out existing types from prev even if they are not in uniqueTypes yet,
      // because uniqueTypes might be incomplete while devices are still loading.
      if (newTypes.length > 0) {
        const updated = [...prev, ...newTypes];
        localStorage.setItem('networkTopologyOrder', JSON.stringify(updated));
        return updated;
      }
      return prev;
    });
  }, [uniqueTypes]);

  const moveType = (index: number, direction: 'up' | 'down') => {
    const newOrder = [...topologyOrder];
    if (direction === 'up' && index > 0) {
      [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
    } else if (direction === 'down' && index < newOrder.length - 1) {
      [newOrder[index + 1], newOrder[index]] = [newOrder[index], newOrder[index + 1]];
    }
    setTopologyOrder(newOrder);
    localStorage.setItem('networkTopologyOrder', JSON.stringify(newOrder));
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
    (d.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    d.ip_address.includes(searchQuery) ||
    d.location?.toLowerCase().includes(searchQuery.toLowerCase())) &&
    (typeFilter ? d.type === typeFilter : true) &&
    (locationFilter ? d.location === locationFilter : true) &&
    (statusFilter === 'all' ? true : d.status === statusFilter)
  );

  const totalPages = Math.ceil(filteredDevices.length / itemsPerPage);
  const paginatedDevices = filteredDevices.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, typeFilter, locationFilter, statusFilter]);

  const totalCount = devices.length;
  const onlineCount = devices.filter(d => d.status === 'Online').length;
  const offlineCount = devices.filter(d => d.status === 'Offline').length;

  return (
    <div className={`p-4 sm:p-6 lg:p-8 rounded-3xl ${themeClasses.card} shadow-sm border ${isDark ? 'border-zinc-800' : 'border-slate-100'} mb-6 min-h-[500px]`}>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Monitoring Jaringan</h2>
          <p className={`text-xs mt-1 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>Status realtime perangkat</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => scanMutation.mutate()}
            disabled={scanMutation.isPending}
            className={`flex items-center justify-center p-2.5 sm:px-4 sm:py-2 rounded-xl text-sm font-bold transition-all ${
              isDark ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <RefreshCw className={`w-4 h-4 ${scanMutation.isPending ? 'animate-spin' : ''}`} />
            <span className="hidden sm:block ml-2">Scan</span>
          </button>
          {(adminUser?.role === 'Super Admin' || adminUser?.role === 'Staff IT Support') && (
            <>
              <button
                onClick={downloadTemplate}
                className={`flex items-center justify-center p-2.5 sm:px-4 sm:py-2 rounded-xl text-sm font-bold transition-all ${
                  isDark ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
                title="Download Format Template Excel"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:block ml-2">Template</span>
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={bulkMutation.isPending}
                className={`flex items-center justify-center p-2.5 sm:px-4 sm:py-2 rounded-xl text-sm font-bold transition-all ${
                  isDark ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
                title="Upload Excel"
              >
                <Upload className={`w-4 h-4 ${bulkMutation.isPending ? 'animate-bounce' : ''}`} />
                <span className="hidden sm:block ml-2">Import</span>
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept=".xlsx,.xls,.csv"
                className="hidden"
              />
              <button
                onClick={() => setShowAddForm(true)}
                className="flex items-center justify-center p-2.5 sm:px-4 sm:py-2 rounded-xl text-white text-sm font-bold transition-all hover:opacity-90 shadow-md"
                style={{ backgroundColor: primaryColor }}
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:block ml-2">Tambah</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <motion.div 
          onClick={() => setStatusFilter('all')}
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className={`p-3 sm:p-4 rounded-2xl border cursor-pointer transition-all ${
            statusFilter === 'all' 
              ? (isDark ? 'bg-zinc-800 border-zinc-600 ring-1 ring-zinc-500' : 'bg-slate-100 border-slate-300 ring-1 ring-slate-300') 
              : (isDark ? 'bg-zinc-900/50 border-zinc-800 hover:bg-zinc-800' : 'bg-slate-50 border-slate-100 hover:bg-slate-100')
          }`}
        >
          <div className={`text-[10px] sm:text-xs font-bold mb-1 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>TOTAL</div>
          <div className="text-xl sm:text-3xl font-black">{totalCount}</div>
        </motion.div>
        <motion.div 
          onClick={() => setStatusFilter('Online')}
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className={`p-3 sm:p-4 rounded-2xl border cursor-pointer transition-all ${
            statusFilter === 'Online'
              ? (isDark ? 'bg-emerald-900/40 border-emerald-500/50 ring-1 ring-emerald-500/50' : 'bg-emerald-100 border-emerald-300 ring-1 ring-emerald-300')
              : (isDark ? 'bg-emerald-900/20 border-emerald-900/30 hover:bg-emerald-900/30' : 'bg-emerald-50 border-emerald-100 hover:bg-emerald-100')
          }`}
        >
          <div className="text-[10px] sm:text-xs font-bold mb-1 text-emerald-600 dark:text-emerald-400">ONLINE</div>
          <div className="text-xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
            {onlineCount}
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse hidden sm:block"></span>
          </div>
        </motion.div>
        <motion.div 
          onClick={() => setStatusFilter('Offline')}
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className={`p-3 sm:p-4 rounded-2xl border cursor-pointer transition-all ${
            statusFilter === 'Offline'
              ? (isDark ? 'bg-rose-900/40 border-rose-500/50 ring-1 ring-rose-500/50' : 'bg-rose-100 border-rose-300 ring-1 ring-rose-300')
              : (isDark ? 'bg-rose-900/20 border-rose-900/30 hover:bg-rose-900/30' : 'bg-rose-50 border-rose-100 hover:bg-rose-100')
          }`}
        >
          <div className="text-[10px] sm:text-xs font-bold mb-1 text-rose-600 dark:text-rose-400">OFFLINE</div>
          <div className="text-xl sm:text-3xl font-black text-rose-600 dark:text-rose-400">
            {offlineCount}
          </div>
        </motion.div>
      </div>

      {/* Toggle View & Filters */}
      <div className="flex flex-col gap-3 mb-6">
        <div className="flex bg-slate-100 dark:bg-zinc-900/50 p-1 rounded-xl self-start w-full sm:w-auto">
          <button 
            onClick={() => setViewType('list')}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-bold transition-all ${viewType === 'list' ? 'bg-white dark:bg-zinc-800 shadow-sm text-slate-800 dark:text-white' : 'text-slate-500 dark:text-zinc-400'}`}
          >
            Daftar Perangkat
          </button>
          <button 
            onClick={() => setViewType('topology')}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-bold transition-all ${viewType === 'topology' ? 'bg-white dark:bg-zinc-800 shadow-sm text-slate-800 dark:text-white' : 'text-slate-500 dark:text-zinc-400'}`}
          >
            Topologi
          </button>
        </div>

        {viewType === 'list' && (
          <div className="flex flex-col sm:flex-row gap-3 mt-2">
            <div className="relative flex-1">
              <Search className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-zinc-500' : 'text-slate-400'}`} />
              <input
                type="text"
                placeholder="Cari perangkat, IP, lokasi..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full pl-10 pr-4 py-2.5 rounded-2xl border text-sm focus:outline-none focus:ring-2 transition-all ${
                  isDark 
                    ? 'bg-zinc-900/50 border-zinc-800 focus:border-zinc-700 text-white placeholder-zinc-500 focus:ring-zinc-800' 
                    : 'bg-slate-50 border-slate-200 focus:border-slate-300 text-slate-900 placeholder-slate-400 focus:ring-slate-200'
                }`}
              />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className={`flex-none py-2 px-3 rounded-xl border text-xs font-bold focus:outline-none transition-all cursor-pointer ${
                  isDark 
                    ? 'bg-zinc-900/50 border-zinc-800 text-zinc-300 focus:border-zinc-700 focus:ring-zinc-800' 
                    : 'bg-white border-slate-200 text-slate-700 focus:border-slate-300 focus:ring-slate-200 shadow-sm'
                }`}
              >
                <option value="">Semua Tipe</option>
                {uniqueTypes.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <select
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                className={`flex-none py-2 px-3 rounded-xl border text-xs font-bold focus:outline-none transition-all cursor-pointer ${
                  isDark 
                    ? 'bg-zinc-900/50 border-zinc-800 text-zinc-300 focus:border-zinc-700 focus:ring-zinc-800' 
                    : 'bg-white border-slate-200 text-slate-700 focus:border-slate-300 focus:ring-slate-200 shadow-sm'
                }`}
              >
                <option value="">Semua Lokasi</option>
                {uniqueLocations.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
          </div>
        )}
      </div>

        {viewType === 'topology' && !isLoading && (
          <div className={`p-4 sm:p-6 rounded-2xl border ${isDark ? 'bg-zinc-900/30 border-zinc-800' : 'bg-slate-50 border-slate-200'} overflow-x-auto min-h-[400px]`}>
            <div className="flex justify-between items-center mb-6">
              <h3 className={`text-sm font-bold ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                {isEditingTopology ? 'Atur Urutan Hierarki Topologi' : 'Peta Topologi Jaringan'}
              </h3>
              <button 
                onClick={() => setIsEditingTopology(!isEditingTopology)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  isEditingTopology 
                    ? 'bg-indigo-500 text-white shadow-md' 
                    : isDark ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700' : 'bg-white border shadow-sm text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Settings2 className="w-3.5 h-3.5" />
                {isEditingTopology ? 'Selesai Edit' : 'Edit Urutan'}
              </button>
            </div>

            {isEditingTopology ? (
              <div className="max-w-md mx-auto space-y-2">
                {topologyOrder.map((type, index) => (
                  <motion.div 
                    layout
                    key={type} 
                    className={`flex items-center justify-between p-3 rounded-xl border ${isDark ? 'bg-zinc-800/50 border-zinc-700' : 'bg-white border-slate-200 shadow-sm'}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${isDark ? 'bg-zinc-700 text-zinc-300' : 'bg-slate-100 text-slate-500'}`}>
                        {index + 1}
                      </div>
                      <span className={`text-sm font-bold ${isDark ? 'text-zinc-200' : 'text-slate-700'}`}>{type}</span>
                    </div>
                    <div className="flex gap-1">
                      <button 
                        onClick={() => moveType(index, 'up')} 
                        disabled={index === 0}
                        className={`p-1.5 rounded-lg transition-colors ${index === 0 ? 'opacity-30 cursor-not-allowed' : isDark ? 'hover:bg-zinc-700 text-zinc-300' : 'hover:bg-slate-100 text-slate-600'}`}
                      >
                        <ArrowUp className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => moveType(index, 'down')} 
                        disabled={index === topologyOrder.length - 1}
                        className={`p-1.5 rounded-lg transition-colors ${index === topologyOrder.length - 1 ? 'opacity-30 cursor-not-allowed' : isDark ? 'hover:bg-zinc-700 text-zinc-300' : 'hover:bg-slate-100 text-slate-600'}`}
                      >
                        <ArrowDown className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="relative flex flex-col items-center py-4">
                {/* INTERNET Node */}
                <motion.div 
                  initial={{ scale: 0 }} animate={{ scale: 1 }}
                  className={`w-16 h-16 sm:w-20 sm:h-20 rounded-3xl flex flex-col items-center justify-center border-2 z-10 ${
                    isDark ? 'bg-zinc-800 border-indigo-500/50 shadow-[0_0_15px_rgba(99,102,241,0.2)]' : 'bg-white border-indigo-500/50 shadow-md'
                  }`}
                >
                  <Cloud className={`w-6 h-6 sm:w-8 sm:h-8 ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`} />
                  <span className={`text-[8px] sm:text-[10px] font-bold mt-1 ${isDark ? 'text-zinc-300' : 'text-slate-600'}`}>INTERNET</span>
                </motion.div>

                {/* Vertical Tiers */}
                <div className="flex flex-col items-center w-full">
                  {topologyOrder.map((type, tIndex) => {
                    const typeDevices = devices.filter(d => d.type === type);
                    if (typeDevices.length === 0) return null;
                    
                    return (
                      <div key={type} className="flex flex-col items-center relative w-full pt-8 pb-4">
                        {/* Vertical line from previous tier */}
                        <motion.div 
                          initial={{ height: 0 }} animate={{ height: '2rem' }} transition={{ delay: tIndex * 0.1 }}
                          className={`absolute top-0 left-1/2 w-0.5 -translate-x-1/2 ${isDark ? 'bg-zinc-700' : 'bg-slate-300'}`} 
                        />
                        
                        <motion.div 
                          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + tIndex * 0.1 }}
                          className={`px-4 py-1.5 rounded-full border text-xs font-bold mb-6 z-10 shadow-sm ${
                            isDark ? 'bg-zinc-800 border-zinc-600 text-zinc-200' : 'bg-white border-slate-300 text-slate-700'
                          }`}
                        >
                          {type}
                        </motion.div>

                        <div className="flex flex-nowrap justify-center gap-4 sm:gap-8 relative px-4 w-max mx-auto pb-2">
                          {/* Horizontal line if multiple devices */}
                          {typeDevices.length > 1 && (
                            <motion.div 
                              initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: 0.3 + tIndex * 0.1 }}
                              className={`absolute top-0 left-[80px] right-[80px] sm:left-[96px] sm:right-[96px] h-0.5 origin-center ${isDark ? 'bg-zinc-700' : 'bg-slate-300'}`}
                            />
                          )}

                          {typeDevices.map((device, dIndex) => (
                            <div key={device.id} className="relative pt-4 flex flex-col items-center w-[140px] sm:w-[160px]">
                              {/* vertical line down to device */}
                              {typeDevices.length > 1 && (
                                <motion.div 
                                  initial={{ height: 0 }} animate={{ height: '1rem' }} transition={{ delay: 0.4 + tIndex * 0.1 }}
                                  className={`absolute top-0 left-1/2 w-0.5 -translate-x-1/2 ${isDark ? 'bg-zinc-700' : 'bg-slate-300'}`} 
                                />
                              )}
                              
                              <motion.div
                                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 + (tIndex * 0.1) + (dIndex * 0.05) }}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border w-full relative z-10 transition-colors ${
                                  isDark ? 'bg-zinc-900 border-zinc-800 hover:border-zinc-700' : 'bg-white border-slate-200 shadow-sm hover:border-slate-300'
                                }`}
                              >
                                <div className={`w-2.5 h-2.5 rounded-full shadow-sm shrink-0 ${
                                  device.status === 'Online' 
                                    ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' 
                                    : 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]'
                                }`} />
                                <div className="flex flex-col overflow-hidden">
                                  <span className={`text-xs font-bold truncate ${isDark ? 'text-zinc-200' : 'text-slate-700'}`}>{device.name}</span>
                                  <span className={`text-[9px] font-mono truncate mt-0.5 ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>{device.ip_address}</span>
                                </div>
                              </motion.div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

      {(showAddForm || editingDevice) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.form 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`w-full max-w-lg p-6 rounded-3xl border shadow-xl ${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200'}`}
            onSubmit={handleSubmit}
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold tracking-tight">
                {editingDevice ? 'Edit Perangkat' : 'Tambah Perangkat Baru'}
              </h3>
              <button 
                type="button" 
                onClick={resetForm}
                className={`p-2 rounded-full ${isDark ? 'hover:bg-zinc-800 text-zinc-400' : 'hover:bg-slate-100 text-slate-500'}`}
              >
                <AlertCircle className="w-5 h-5 opacity-0 hidden" /> {/* Just for spacing or close icon if we had one. Let's use a simple X */}
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
              </button>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className={`block text-xs font-bold mb-1.5 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>Nama Perangkat</label>
                <input
                  required
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 transition-all ${
                    isDark ? 'bg-zinc-800 border-zinc-700 text-white focus:ring-zinc-600' : 'bg-slate-50 border-slate-300 text-slate-900 focus:ring-slate-200'
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
                  className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 transition-all ${
                    isDark ? 'bg-zinc-800 border-zinc-700 text-white focus:ring-zinc-600' : 'bg-slate-50 border-slate-300 text-slate-900 focus:ring-slate-200'
                  }`}
                  placeholder="192.168.1.10"
                />
              </div>
              <div>
                <label className={`block text-xs font-bold mb-1.5 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>Tipe</label>
                {isNewType ? (
                  <div className="flex gap-2">
                    <input
                      required
                      type="text"
                      value={formData.type}
                      onChange={(e) => setFormData({...formData, type: e.target.value})}
                      className={`flex-1 px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 transition-all ${
                        isDark ? 'bg-zinc-800 border-zinc-700 text-white focus:ring-zinc-600' : 'bg-slate-50 border-slate-300 text-slate-900 focus:ring-slate-200'
                      }`}
                      placeholder="Ketik tipe baru..."
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setIsNewType(false);
                        setFormData({...formData, type: 'Komputer'});
                      }}
                      className={`px-4 py-2.5 rounded-xl border text-xs font-bold transition-colors ${
                        isDark ? 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700' : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      Batal
                    </button>
                  </div>
                ) : (
                  <select
                    value={uniqueTypes.includes(formData.type) ? formData.type : 'Lainnya'}
                    onChange={(e) => {
                      if (e.target.value === 'new') {
                        setIsNewType(true);
                        setFormData({...formData, type: ''});
                      } else {
                        setFormData({...formData, type: e.target.value});
                      }
                    }}
                    className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 transition-all ${
                      isDark ? 'bg-zinc-800 border-zinc-700 text-white focus:ring-zinc-600' : 'bg-slate-50 border-slate-300 text-slate-900 focus:ring-slate-200'
                    }`}
                  >
                    {uniqueTypes.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                    <option value="new">+ Tambah Baru...</option>
                  </select>
                )}
              </div>
              <div>
                <label className={`block text-xs font-bold mb-1.5 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>Lokasi</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({...formData, location: e.target.value})}
                  className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 transition-all ${
                    isDark ? 'bg-zinc-800 border-zinc-700 text-white focus:ring-zinc-600' : 'bg-slate-50 border-slate-300 text-slate-900 focus:ring-slate-200'
                  }`}
                  placeholder="Ex: Lantai 1"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-dashed border-slate-200 dark:border-zinc-800">
              <button
                type="button"
                onClick={resetForm}
                className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                  isDark ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={addMutation.isPending || updateMutation.isPending}
                className="px-5 py-2.5 rounded-xl text-white text-sm font-bold shadow-md hover:opacity-90 transition-all disabled:opacity-50"
                style={{ backgroundColor: primaryColor }}
              >
                {editingDevice ? 'Simpan Perubahan' : 'Tambah Perangkat'}
              </button>
            </div>
          </motion.form>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-12">
          <RefreshCw className={`w-8 h-8 animate-spin ${isDark ? 'text-zinc-600' : 'text-slate-400'}`} />
        </div>
      ) : viewType === 'list' ? (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {paginatedDevices.map((device) => (
              <motion.div
                layout
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                key={device.id}
                className={`p-3 sm:p-4 rounded-2xl border flex flex-col gap-3 relative overflow-hidden transition-shadow hover:shadow-md ${
                  isDark ? 'bg-zinc-900/40 border-zinc-800' : 'bg-white border-slate-100 shadow-sm'
                }`}
              >
                <div className="flex items-center justify-between gap-3 relative z-10">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`shrink-0 w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center border ${
                      device.status === 'Online' 
                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                        : device.status === 'Offline'
                        ? 'bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400'
                        : 'bg-slate-500/10 border-slate-500/20 text-slate-600 dark:text-slate-400'
                    }`}>
                      {getDeviceIcon(device.type)}
                    </div>
                    <div className="flex flex-col truncate">
                      <h3 className="font-bold text-sm tracking-tight truncate pr-2">{device.name}</h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`text-[11px] font-mono ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                          {device.ip_address}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1.5 shrink-0">
                    {(adminUser?.role === 'Super Admin' || adminUser?.role === 'Staff IT Support') && (
                      <>
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
                          className={`p-1.5 rounded-lg transition-colors ${isDark ? 'hover:bg-zinc-800 text-zinc-400 hover:text-white' : 'hover:bg-slate-100 text-slate-400 hover:text-slate-800'}`}
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => {
                            if (window.confirm('Yakin ingin menghapus perangkat ini?')) {
                              deleteMutation.mutate(device.id);
                            }
                          }}
                          className={`p-1.5 rounded-lg transition-colors ${isDark ? 'hover:bg-rose-900/30 text-zinc-400 hover:text-rose-400' : 'hover:bg-rose-50 text-slate-400 hover:text-rose-500'}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        <div className={`w-px h-4 mx-0.5 ${isDark ? 'bg-zinc-800' : 'bg-slate-200'}`} />
                      </>
                    )}
                    <div className="flex items-center justify-center w-6 h-6">
                      <div className={`w-2 h-2 rounded-full ${
                        device.status === 'Online' 
                          ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]' 
                          : device.status === 'Offline'
                          ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]'
                          : 'bg-slate-400'
                      }`} />
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-between items-center text-[10px] sm:text-xs">
                  <span className={`px-2 py-1 rounded-md border font-medium ${
                    isDark ? 'bg-zinc-800/50 border-zinc-700/50 text-zinc-400' : 'bg-slate-50 border-slate-100 text-slate-500'
                  }`}>
                    {device.location || 'Lokasi tidak diatur'}
                  </span>
                  <span className={`text-[10px] font-medium ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>
                    {device.type}
                  </span>
                </div>
              </motion.div>
            ))}
            {paginatedDevices.length === 0 && (
              <div className={`col-span-full py-12 text-center rounded-2xl border border-dashed ${isDark ? 'border-zinc-800' : 'border-slate-200'}`}>
                <AlertCircle className={`w-8 h-8 mx-auto mb-2 ${isDark ? 'text-zinc-600' : 'text-slate-400'}`} />
                <p className={`text-sm font-medium ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>Tidak ada perangkat ditemukan.</p>
              </div>
            )}
          </div>
          
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-4">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  isDark 
                    ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700 disabled:opacity-50 disabled:hover:bg-zinc-800' 
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 disabled:opacity-50 disabled:hover:bg-slate-100'
                }`}
              >
                Sebelumnya
              </button>
              <span className={`text-xs font-bold ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                Halaman {currentPage} dari {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  isDark 
                    ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700 disabled:opacity-50 disabled:hover:bg-zinc-800' 
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 disabled:opacity-50 disabled:hover:bg-slate-100'
                }`}
              >
                Berikutnya
              </button>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
};

export default NetworkMonitor;
