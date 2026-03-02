import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip as RechartsTooltip 
} from 'recharts';
import { 
  ShieldCheck, 
  Plus, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  User, 
  Phone, 
  Building2, 
  Layers,
  Settings2,
  ChevronRight,
  RefreshCcw,
  Trash2,
  LogIn,
  LogOut,
  Lock,
  Cpu,
  Globe,
  Zap,
  Ticket,
  MessageSquare,
  Calendar,
  MessageCircle,
  Eye,
  X,
  Filter,
  Camera,
  Image as ImageIcon,
  MapPin,
  Bell,
  TrendingUp,
  BarChart3,
  SlidersHorizontal
} from 'lucide-react';

interface ITicket {
  id: number;
  ticket_no: string;
  name: string;
  department: string;
  phone: string;
  category: string;
  description: string;
  assigned_to: string | null;
  admin_reply: string | null;
  status: string;
  created_at: string;
  responded_at?: string | null;
  resolved_at?: string | null;
  photo?: string | null;
  ip_address?: string | null;
  user_agent?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

const STATUSES = ['Pending', 'In Progress', 'Resolved', 'Cancelled'];
const LOGO_OPTIONS = [
  { id: 'ShieldCheck', icon: ShieldCheck },
  { id: 'Cpu', icon: Cpu },
  { id: 'Globe', icon: Globe },
  { id: 'Zap', icon: Zap },
  { id: 'Ticket', icon: Ticket }
];

const getDeviceInfo = (ua: string) => {
  if (!ua) return 'Unknown Device';
  
  let os = 'Unknown OS';
  if (ua.includes('Windows')) os = 'Windows';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('iPhone')) os = 'iPhone';
  else if (ua.includes('iPad')) os = 'iPad';
  else if (ua.includes('Macintosh')) os = 'Mac OS';
  else if (ua.includes('Linux')) os = 'Linux';

  let browser = 'Unknown Browser';
  if (ua.includes('Chrome')) browser = 'Chrome';
  else if (ua.includes('Firefox')) browser = 'Firefox';
  else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari';
  else if (ua.includes('Edge')) browser = 'Edge';
  else if (ua.includes('Opera')) browser = 'Opera';

  return `${os} (${browser})`;
};

/**
 * IT Helpdesk Pro - Main Application Component
 * 
 * Flow Aplikasi:
 * 1. User: Membuat tiket melalui modal "New Ticket".
 * 2. User: Mengunggah foto (opsional) yang secara otomatis diberi watermark lokasi & waktu.
 * 3. Database: Tiket disimpan di Supabase (via API Express).
 * 4. Admin: Login melalui Portal Admin untuk mengelola antrian.
 * 5. Admin: Melihat statistik distribusi masalah (Pie Chart) dan notifikasi real-time.
 * 6. Admin: Memperbarui status tiket, menugaskan IT, dan memberikan balasan resolusi.
 */

export default function App() {
  // --- State Management ---
  const [tickets, setTickets] = useState<ITicket[]>([]); // Daftar semua tiket
  const [itPersonnel, setItPersonnel] = useState<{id: number, name: string}[]>([]);
  const [departments, setDepartments] = useState<{id: number, name: string}[]>([]);
  const [categories, setCategories] = useState<{id: number, name: string}[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<ITicket | null>(null); // Tiket yang sedang dilihat detailnya
  const [modalStatus, setModalStatus] = useState<string>(''); // Status sementara di modal detail
  const [loading, setLoading] = useState(true); // Loading state untuk fetch data awal
  const [adminUser, setAdminUser] = useState<any>(null); // Data login admin
  const [showForm, setShowForm] = useState(false); // Toggle modal buat tiket baru
  const [showLogin, setShowLogin] = useState(false); // Toggle modal login admin
  const [showSettings, setShowSettings] = useState(false); // Toggle modal pengaturan aplikasi
  const [showResetConfirm, setShowResetConfirm] = useState(false); // Toggle konfirmasi reset data
  const [pendingUpdate, setPendingUpdate] = useState<{id: number, status: string, assigned_to: string | null, admin_reply: string | null} | null>(null); // Data update yang menunggu konfirmasi
  const [addingType, setAddingType] = useState<'it' | 'dept' | 'cat' | null>(null);
  const [newItemName, setNewItemName] = useState('');
  const [newEmailInput, setNewEmailInput] = useState('');
  const [showEmailInput, setShowEmailInput] = useState(false);
  const [gpsStatus, setGpsStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'today' | 'all'>('today');
  const [showMobileFilter, setShowMobileFilter] = useState(false);
  const [tempFilters, setTempFilters] = useState({ dept: '', status: '', date: '' });
  const [appSettings, setAppSettings] = useState({ 
    app_name: 'IT Helpdesk Pro', 
    logo_type: 'ShieldCheck',
    theme_mode: 'light', // 'light' or 'dark'
    primary_color: '#10b981', // emerald-600
    notification_emails: [] as string[]
  }); // Pengaturan nama & logo app
  const [loginData, setLoginData] = useState({ username: '', password: '' }); // Form data login
  const [formData, setFormData] = useState({ // Form data tiket baru
    name: '',
    department: '',
    category: '',
    phone: '',
    description: '',
    photo: '',
    latitude: null as number | null,
    longitude: null as number | null
  });
  const [submitting, setSubmitting] = useState(false); // Loading state saat kirim tiket
  const [filterDept, setFilterDept] = useState<string>(''); // Filter departemen
  const [filterStatus, setFilterStatus] = useState<string>(''); // Filter status
  const [filterDate, setFilterDate] = useState<string>(''); // Filter tanggal
  const [photoLoading, setPhotoLoading] = useState(false); // Loading state saat proses watermark foto

  /**
   * Menghitung statistik kategori untuk Pie Chart
   */
  const categoryStats = useMemo(() => {
    const stats = categories.map(cat => ({
      name: cat.name,
      value: tickets.filter(t => t.category === cat.name).length
    })).filter(s => s.value > 0);
    return stats;
  }, [tickets, categories]);

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

  /**
   * Mengambil lokasi GPS pengguna
   */
  const getGPSLocation = () => {
    setGpsStatus('loading');
    setGpsError(null);
    
    if (!navigator.geolocation) {
      setGpsStatus('error');
      setGpsError('Browser tidak mendukung GPS');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setFormData(prev => ({ ...prev, latitude, longitude }));
        setGpsStatus('success');
      },
      (error) => {
        console.error("GPS Error:", error);
        setGpsStatus('error');
        let msg = 'Gagal mendapatkan lokasi';
        if (error.code === 1) msg = 'Izin lokasi ditolak. Mohon aktifkan GPS.';
        else if (error.code === 2) msg = 'Posisi tidak tersedia.';
        else if (error.code === 3) msg = 'Waktu permintaan habis.';
        setGpsError(msg);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  /**
   * Menangani unggahan foto dan menambahkan watermark (Lokasi & Waktu)
   * Menggunakan Canvas API untuk menggambar teks di atas gambar.
   */
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPhotoLoading(true);

    // Get location
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const reader = new FileReader();
        reader.onload = (event) => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            // Set dimensions (max 800px width/height for reasonable size)
            const maxDim = 800;
            let width = img.width;
            let height = img.height;
            if (width > height) {
              if (width > maxDim) {
                height *= maxDim / width;
                width = maxDim;
              }
            } else {
              if (height > maxDim) {
                width *= maxDim / height;
                height = maxDim;
              }
            }
            canvas.width = width;
            canvas.height = height;

            // Draw image
            ctx.drawImage(img, 0, 0, width, height);

            // Draw watermark background
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            const padding = 10;
            const fontSize = Math.max(12, Math.floor(width / 40));
            ctx.font = `${fontSize}px sans-serif`;
            const text1 = `Lat: ${latitude.toFixed(6)}, Lng: ${longitude.toFixed(6)}`;
            const text2 = `Time: ${new Date().toLocaleString()}`;
            const text3 = `Google Maps Location`;
            
            const metrics1 = ctx.measureText(text1);
            const metrics2 = ctx.measureText(text2);
            const metrics3 = ctx.measureText(text3);
            const bgWidth = Math.max(metrics1.width, metrics2.width, metrics3.width) + padding * 2;
            const bgHeight = fontSize * 3 + padding * 3;

            ctx.fillRect(5, height - bgHeight - 5, bgWidth, bgHeight);

            // Draw watermark text
            ctx.fillStyle = 'white';
            ctx.fillText(text3, padding, height - bgHeight + fontSize - 2);
            ctx.fillText(text1, padding, height - bgHeight + fontSize * 2 + padding / 2 - 2);
            ctx.fillText(text2, padding, height - bgHeight + fontSize * 3 + padding - 2);

            // Compress to stay under 100KB
            let quality = 0.7;
            let base64 = canvas.toDataURL('image/jpeg', quality);
            
            // Iteratively reduce quality if still too large
            while (base64.length > 133333 && quality > 0.1) { // 133333 chars in base64 is approx 100KB
              quality -= 0.1;
              base64 = canvas.toDataURL('image/jpeg', quality);
            }

            setFormData(prev => ({ ...prev, photo: base64 }));
            setPhotoLoading(false);
          };
          img.src = event.target?.result as string;
        };
        reader.readAsDataURL(file);
      },
      (error) => {
        console.error("Error getting location:", error);
        alert("Gagal mendapatkan lokasi. Pastikan izin lokasi diaktifkan untuk watermark.");
        setPhotoLoading(false);
      },
      { enableHighAccuracy: true }
    );
  };

  /**
   * Mengambil data tiket dari server
   */
  const fetchTickets = async () => {
    try {
      const res = await fetch('/api/tickets');
      const data = await res.json();
      setTickets(data);
    } catch (err) {
      console.error('Failed to fetch tickets:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchManagementData = async () => {
    try {
      console.log('Fetching management data...');
      const [itRes, deptRes, catRes] = await Promise.all([
        fetch('/api/it-personnel'),
        fetch('/api/departments'),
        fetch('/api/categories')
      ]);
      
      if (!itRes.ok || !deptRes.ok || !catRes.ok) {
        throw new Error('Gagal mengambil data manajemen');
      }

      const its = await itRes.json();
      const depts = await deptRes.json();
      const cats = await catRes.json();
      
      console.log('Management data fetched:', { its, depts, cats });
      
      setItPersonnel(its);
      setDepartments(depts);
      setCategories(cats);
    } catch (err) {
      console.error('Failed to fetch management data:', err);
    }
  };

  /**
   * Mengambil pengaturan aplikasi (Nama & Logo)
   */
  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings');
      const data = await res.json();
      if (data.app_name) {
        setAppSettings(prev => ({
          ...prev,
          ...data,
          theme_mode: data.theme_mode || 'light',
          primary_color: data.primary_color || '#10b981',
          notification_emails: data.notification_emails ? JSON.parse(data.notification_emails) : []
        }));
      }
    } catch (err) {
      console.error('Failed to fetch settings:', err);
    }
  };

  /**
   * Inisialisasi data dan polling setiap 10 detik
   */
  useEffect(() => {
    fetchTickets();
    fetchSettings();
    fetchManagementData();
    const interval = setInterval(fetchTickets, 10000);
    const savedAdmin = localStorage.getItem('adminUser');
    if (savedAdmin) setAdminUser(JSON.parse(savedAdmin));
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (showForm) {
      getGPSLocation();
    }
  }, [showForm]);

  /**
   * Menangani proses login admin
   */
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginData)
      });
      const data = await res.json();
      if (data.success) {
        setAdminUser(data.user);
        localStorage.setItem('adminUser', JSON.stringify(data.user));
        setShowLogin(false);
        setLoginData({ username: '', password: '' });
      } else {
        alert('Login failed: ' + data.error);
      }
    } catch (err) {
      alert('Login error');
    }
  };

  /**
   * Menangani logout admin
   */
  const handleLogout = () => {
    setAdminUser(null);
    localStorage.removeItem('adminUser');
  };

  /**
   * Menghapus semua data tiket (Hanya Admin)
   */
  const handleReset = async () => {
    try {
      const res = await fetch('/api/tickets/reset', { method: 'POST' });
      if (res.ok) {
        setTickets([]);
        fetchTickets();
        setShowResetConfirm(false);
        alert('All data has been reset successfully.');
      }
    } catch (err) {
      alert('Reset failed');
    }
  };

  const handleDeleteTicket = async (id: number) => {
    if (!confirm('Hapus tiket ini secara permanen?')) return;
    try {
      const res = await fetch(`/api/tickets/${id}`, { method: 'DELETE' });
      if (res.ok) fetchTickets();
    } catch (err) { alert('Gagal menghapus tiket'); }
  };

  const handleManagementAction = async (type: 'it' | 'dept' | 'cat', action: 'add' | 'delete', data?: any) => {
    const endpoint = type === 'it' ? 'it-personnel' : type === 'dept' ? 'departments' : 'categories';
    const label = type === 'it' ? 'IT' : type === 'dept' ? 'Departemen' : 'Kategori';
    
    try {
      if (action === 'add') {
        if (!newItemName.trim()) return;
        
        const res = await fetch(`/api/${endpoint}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: newItemName.trim() })
        });
        
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || `Gagal menambah ${label}`);
        }
        
        setNewItemName('');
        setAddingType(null);
      } else {
        if (!confirm(`Hapus ${label} "${data.name}"?`)) return;
        
        const res = await fetch(`/api/${endpoint}/${data.id}`, { method: 'DELETE' });
        
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || `Gagal menghapus ${label}`);
        }
      }
      
      await fetchManagementData();
    } catch (err: any) {
      console.error(`Management action error (${type}/${action}):`, err);
      alert(`Error: ${err.message}`);
    }
  };

  /**
   * Memperbarui pengaturan aplikasi
   */
  const handleUpdateSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...appSettings,
          notification_emails: JSON.stringify(appSettings.notification_emails)
        })
      });
      if (res.ok) {
        setShowSettings(false);
        alert('Settings updated successfully!');
      }
    } catch (err) {
      alert('Update failed');
    }
  };

  /**
   * Menangani pengiriman tiket baru oleh user
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.latitude || !formData.longitude) {
      alert('Lokasi GPS wajib diaktifkan untuk mengirim tiket.');
      getGPSLocation();
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setFormData({ name: '', department: '', category: '', phone: '', description: '', photo: '' });
        setShowForm(false);
        fetchTickets();
      } else {
        const errorData = await res.json();
        alert('Gagal mengirim tiket: ' + (errorData.error || 'Terjadi kesalahan pada server'));
      }
    } catch (err) {
      console.error('Failed to submit ticket:', err);
      alert('Terjadi kesalahan koneksi saat mengirim tiket.');
    } finally {
      setSubmitting(false);
    }
  };

  /**
   * Membuka konfirmasi update tiket (Hanya Admin)
   */
  const handleUpdateClick = (id: number, status: string, assigned_to: string | null, admin_reply: string | null) => {
    if (!assigned_to) {
      alert('Silakan pilih IT yang menangani terlebih dahulu.');
      return;
    }
    setPendingUpdate({ id, status, assigned_to, admin_reply });
  };

  /**
   * Mengeksekusi update tiket setelah konfirmasi
   */
  const confirmUpdate = async () => {
    if (!pendingUpdate) return;
    try {
      const res = await fetch(`/api/tickets/${pendingUpdate.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status: pendingUpdate.status, 
          assigned_to: pendingUpdate.assigned_to, 
          admin_reply: pendingUpdate.admin_reply 
        })
      });
      if (res.ok) {
        setPendingUpdate(null);
        fetchTickets();
      }
    } catch (err) {
      console.error('Failed to update ticket:', err);
    }
  };

  const updateTicket = async (id: number, status: string, assigned_to: string | null, admin_reply: string | null) => {
    // This is now handled by handleUpdateClick and confirmUpdate
    handleUpdateClick(id, status, assigned_to, admin_reply);
  };

  /**
   * Memformat tanggal ke format Indonesia (DD MMM YYYY, HH:mm)
   */
  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    const normalizedDate = dateString.includes('T') || dateString.includes('Z') 
      ? dateString 
      : dateString.replace(' ', 'T') + 'Z';
    
    return new Date(normalizedDate).toLocaleString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  /**
   * Mendapatkan warna background berdasarkan status tiket
   */
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'In Progress': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Resolved': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'Cancelled': return 'bg-rose-100 text-rose-700 border-rose-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  /**
   * Mendapatkan icon berdasarkan status tiket
   */
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Pending': return <Clock className="w-4 h-4" />;
      case 'In Progress': return <RefreshCcw className="w-4 h-4 animate-spin-slow" />;
      case 'Resolved': return <CheckCircle2 className="w-4 h-4" />;
      case 'Cancelled': return <AlertCircle className="w-4 h-4" />;
      default: return null;
    }
  };

  const CurrentLogo = LOGO_OPTIONS.find(l => l.id === appSettings.logo_type)?.icon || ShieldCheck;

  return (
    <div className={`min-h-screen font-sans selection:bg-emerald-100 selection:text-emerald-900 transition-colors duration-300 ${
      appSettings.theme_mode === 'dark' ? 'bg-slate-950 text-slate-100' : 'bg-[#F8FAFC] text-slate-900'
    }`} style={{ '--primary': appSettings.primary_color } as any}>
      {/* --- HEADER SECTION --- */}
      <header className={`sticky top-0 z-40 w-full border-b backdrop-blur-md transition-colors ${
        appSettings.theme_mode === 'dark' ? 'bg-slate-900/80 border-slate-800' : 'bg-white/80 border-slate-200'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div 
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shadow-lg transition-all shrink-0"
              style={{ backgroundColor: appSettings.primary_color, boxShadow: `0 10px 15px -3px ${appSettings.primary_color}40` }}
            >
              <CurrentLogo className="text-white w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className={`text-sm sm:text-lg font-bold tracking-tight leading-tight truncate whitespace-nowrap ${appSettings.theme_mode === 'dark' ? 'text-white' : 'text-slate-900'}`}>{appSettings.app_name}</h1>
              <p className="hidden sm:block text-[10px] sm:text-xs font-medium text-slate-500 mt-0.5">Enterprise Support System</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-4 shrink-0">
            {adminUser ? (
              <div className="flex items-center gap-1 sm:gap-3">
                <button 
                  onClick={() => setShowSettings(true)}
                  className="p-1.5 sm:p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-all"
                  title="Settings"
                >
                  <Settings2 className="w-4 h-4 sm:w-5 h-5" />
                </button>
                <button 
                  onClick={() => setShowResetConfirm(true)}
                  className="flex items-center gap-2 px-2 sm:px-3 py-1.5 rounded-lg text-[10px] sm:text-xs font-semibold bg-rose-50 text-rose-600 border border-rose-100 hover:bg-rose-100 transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5 sm:w-4 h-4" />
                  <span className="hidden md:inline">Reset</span>
                </button>
                <button 
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-2 sm:px-3 py-1.5 rounded-lg text-[10px] sm:text-xs font-semibold text-slate-500 hover:bg-slate-100 transition-all relative"
                >
                  <LogOut className="w-3.5 h-3.5 sm:w-4 h-4" />
                  <span className="hidden md:inline">Logout</span>
                  {tickets.filter(t => t.status === 'Pending').length > 0 && (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white animate-pulse" />
                  )}
                </button>
              </div>
            ) : (
              <button 
                onClick={() => setShowLogin(true)}
                className="flex items-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-lg text-[10px] sm:text-xs font-semibold text-slate-500 hover:bg-slate-100 transition-all"
              >
                <LogIn className="w-3.5 h-3.5 sm:w-4 h-4" />
                <span className="hidden xs:inline">Login</span>
              </button>
            )}
            <button 
              onClick={() => setShowForm(true)}
              style={{ backgroundColor: appSettings.primary_color, boxShadow: `0 10px 15px -3px ${appSettings.primary_color}40` }}
              className="hover:opacity-90 text-white px-3 sm:px-4 py-2 rounded-xl text-[10px] sm:text-sm font-semibold shadow-lg transition-all duration-200 flex items-center gap-1.5 sm:gap-2 active:scale-95"
            >
              <Plus className="w-3.5 h-3.5 sm:w-4 h-4" />
              <span className="hidden xs:inline">New Ticket</span>
              <span className="xs:hidden">New</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-8">
          {/* --- SIDEBAR: STATS & INFO --- */}
          <div className="lg:col-span-1 space-y-4 lg:space-y-6">
            {/* Admin Notifications */}
            {adminUser && (
              <motion.section 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-3xl border border-slate-200 p-4 sm:p-6 shadow-sm overflow-hidden relative"
              >
                <div className="absolute top-0 right-0 p-6 opacity-5">
                  <Bell className="w-24 h-24 text-slate-900" />
                </div>
                <div className="flex items-center gap-3 mb-4 sm:mb-6">
                  <div className="w-10 h-10 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-600 border border-rose-100">
                    <Bell className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Smart Notifications</h2>
                    <p className="text-[10px] text-slate-400 font-medium">Real-time system alerts</p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  {tickets.filter(t => t.status === 'Pending').length > 0 ? (
                    <div className="p-4 bg-rose-50/50 rounded-2xl border border-rose-100 group hover:bg-rose-50 transition-all">
                      <div className="flex items-center justify-between mb-2">
                        <span className="flex items-center gap-1.5 text-[10px] font-bold text-rose-600 uppercase tracking-widest">
                          <AlertCircle className="w-3 h-3" /> Action Required
                        </span>
                        <span className="px-2 py-0.5 bg-rose-600 text-white text-[10px] font-bold rounded-full animate-pulse shadow-sm shadow-rose-200">
                          {tickets.filter(t => t.status === 'Pending').length}
                        </span>
                      </div>
                      <p className="text-xs text-rose-700 font-semibold leading-relaxed">Ada tiket yang menunggu respon Anda segera.</p>
                    </div>
                  ) : (
                    <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100">
                      <p className="text-xs text-emerald-700 font-semibold flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4" /> Inbox Zero! Semua tiket telah direspon.
                      </p>
                    </div>
                  )}

                  {(() => {
                    const today = new Date().toISOString().split('T')[0];
                    const newToday = tickets.filter(t => t.created_at.startsWith(today)).length;
                    if (newToday > 0) {
                      return (
                        <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100 group hover:bg-blue-50 transition-all">
                          <div className="flex items-center justify-between mb-2">
                            <span className="flex items-center gap-1.5 text-[10px] font-bold text-blue-600 uppercase tracking-widest">
                              <TrendingUp className="w-3 h-3" /> Traffic Update
                            </span>
                            <span className="px-2 py-0.5 bg-blue-600 text-white text-[10px] font-bold rounded-full shadow-sm shadow-blue-200">
                              {newToday}
                            </span>
                          </div>
                          <p className="text-xs text-blue-700 font-semibold leading-relaxed">Tiket baru masuk hari ini.</p>
                        </div>
                      );
                    }
                    return null;
                  })()}
                </div>
              </motion.section>
            )}

            {/* Queue Statistics */}
            <section className="bg-white rounded-3xl border border-slate-200 p-4 sm:p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <h2 className="text-sm font-bold text-slate-900 tracking-wider">Status Antrian</h2>
                <BarChart3 className="w-4 h-4 text-slate-300" />
              </div>
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div className="p-3 sm:p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-slate-200 transition-all">
                  <p className="text-xl sm:text-2xl font-black text-slate-900 leading-none mb-1">{tickets.length}</p>
                  <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total</p>
                </div>
                <div className="p-3 sm:p-4 bg-amber-50 rounded-2xl border border-amber-100 hover:border-amber-200 transition-all">
                  <p className="text-xl sm:text-2xl font-black text-amber-600 leading-none mb-1">
                    {tickets.filter(t => t.status === 'Pending').length}
                  </p>
                  <p className="text-[9px] sm:text-[10px] font-bold text-amber-500 uppercase tracking-widest">Waiting</p>
                </div>
                <div className="p-3 sm:p-4 bg-blue-50 rounded-2xl border border-blue-100 hover:border-blue-200 transition-all">
                  <p className="text-xl sm:text-2xl font-black text-blue-600 leading-none mb-1">
                    {tickets.filter(t => t.status === 'In Progress').length}
                  </p>
                  <p className="text-[9px] sm:text-[10px] font-bold text-blue-500 uppercase tracking-widest">Active</p>
                </div>
                <div className="p-3 sm:p-4 bg-emerald-50 rounded-2xl border border-emerald-100 hover:border-emerald-200 transition-all">
                  <p className="text-xl sm:text-2xl font-black text-emerald-600 leading-none mb-1">
                    {tickets.filter(t => t.status === 'Resolved').length}
                  </p>
                  <p className="text-[9px] sm:text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Done</p>
                </div>
              </div>
            </section>

            {/* Issue Distribution (Pie Chart) */}
            {adminUser && categoryStats.length > 0 && (
              <motion.section 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-3xl border border-slate-200 p-4 sm:p-6 shadow-sm"
              >
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 sm:mb-6">Distribusi Masalah</h2>
                <div className="h-48 w-full min-w-0" style={{ minHeight: '192px' }}>
                  <ResponsiveContainer width="100%" height="100%" minHeight={192}>
                    <PieChart>
                      <Pie
                        data={categoryStats}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={70}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {categoryStats.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip 
                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '12px', fontWeight: 'bold' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-2 gap-y-2 mt-4">
                  {categoryStats.map((stat, idx) => (
                    <div key={stat.name} className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                      <span className="text-[10px] font-bold text-slate-500 uppercase truncate">{stat.name}</span>
                    </div>
                  ))}
                </div>
              </motion.section>
            )}

            {/* Help CTA - Hidden on mobile, moved to bottom */}
            <section 
              className="hidden lg:block rounded-3xl p-8 text-white shadow-xl relative overflow-hidden group transition-all"
              style={{ backgroundColor: appSettings.primary_color, boxShadow: `0 20px 25px -5px ${appSettings.primary_color}30` }}
            >
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                <Zap className="w-20 h-20" />
              </div>
              <h3 className="font-black text-xl mb-3">Butuh Bantuan?</h3>
              <p className="text-white/80 text-sm leading-relaxed mb-6 font-medium">
                Kirim tiket untuk masalah teknis. Tim IT kami akan memproses permintaan Anda sesegera mungkin.
              </p>
              <button 
                onClick={() => setShowForm(true)}
                className={`w-full font-bold py-3.5 rounded-2xl text-sm transition-all shadow-lg active:scale-95 ${
                  appSettings.theme_mode === 'dark' ? 'bg-slate-900 text-white hover:bg-slate-800' : 'bg-white text-slate-900 hover:bg-slate-50'
                }`}
              >
                Buat Tiket Sekarang
              </button>
            </section>
          </div>

          {/* --- MAIN CONTENT: TICKET LIST --- */}
          <div className="lg:col-span-2 space-y-3 sm:space-y-4">
            <div className="flex items-center justify-between gap-2 mb-2 sm:mb-4 border-b border-slate-100 pb-1">
              <div className="flex items-center gap-3 sm:gap-6">
                <button 
                  onClick={() => setViewMode('today')}
                  className={`relative pb-2 text-[11px] sm:text-sm font-black uppercase tracking-wider transition-all ${
                    viewMode === 'today' ? 'text-emerald-600' : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  Antrian Hari Ini
                  {viewMode === 'today' && (
                    <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-600 rounded-full" />
                  )}
                </button>
                <button 
                  onClick={() => setViewMode('all')}
                  className={`relative pb-2 text-[11px] sm:text-sm font-black uppercase tracking-wider transition-all ${
                    viewMode === 'all' ? 'text-emerald-600' : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  Semua Antrian
                  {viewMode === 'all' && (
                    <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-600 rounded-full" />
                  )}
                </button>
              </div>
              
              {/* Filter Controls */}
              <div className="flex items-center gap-1 sm:gap-2">
                <button 
                  onClick={() => {
                    setTempFilters({ dept: filterDept, status: filterStatus, date: filterDate });
                    setShowMobileFilter(true);
                  }}
                  className={`sm:hidden flex items-center gap-1 px-2 py-1 border rounded-lg text-[9px] font-black uppercase tracking-tighter shadow-sm active:scale-95 transition-all ${
                    (filterDept || filterStatus || filterDate)
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-600'
                    : 'bg-white border-slate-200 text-slate-500'
                  }`}
                >
                  <SlidersHorizontal className="w-3 h-3" />
                  Filter
                </button>

                <button 
                  onClick={() => {
                    setFilterDept('');
                    setFilterStatus('');
                    setFilterDate('');
                  }}
                  className="hidden sm:block text-[10px] font-bold text-slate-400 hover:text-emerald-600 uppercase tracking-wider"
                >
                  Atur Ulang Filter
                </button>
                <button 
                  onClick={fetchTickets}
                  className="p-2 text-slate-400 hover:text-emerald-600 transition-colors"
                  title="Segarkan Antrian"
                >
                  <RefreshCcw className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Filters - Hidden on mobile, replaced by modal */}
            <div className={`hidden sm:flex flex-col sm:flex-row gap-2 sm:gap-3 mb-6 p-2 sm:p-4 rounded-2xl border shadow-sm transition-colors ${
              appSettings.theme_mode === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-slate-100 border-slate-200'
            }`}>
              <div className="flex-1 relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <select 
                  value={filterDept}
                  onChange={(e) => setFilterDept(e.target.value)}
                  className={`w-full border rounded-xl py-2 pl-8 pr-4 text-[10px] sm:text-xs font-bold outline-none appearance-none cursor-pointer transition-all ${
                    appSettings.theme_mode === 'dark' 
                    ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-750' 
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <option value="">Semua Bagian</option>
                  {departments.map(dept => (
                    <option key={dept.id} value={dept.name}>{dept.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex-1 relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <select 
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className={`w-full border rounded-xl py-2 pl-8 pr-4 text-[10px] sm:text-xs font-bold outline-none appearance-none cursor-pointer transition-all ${
                    appSettings.theme_mode === 'dark' 
                    ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-750' 
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <option value="">Semua Status</option>
                  {STATUSES.map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>
              <div className="flex-1 relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input 
                  type="date"
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                  className={`w-full border rounded-xl py-2 pl-8 pr-4 text-[10px] sm:text-xs font-bold outline-none cursor-pointer transition-all ${
                    appSettings.theme_mode === 'dark' 
                    ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-750' 
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                />
              </div>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-200 border-dashed">
                <RefreshCcw className="w-8 h-8 text-emerald-600 animate-spin mb-4" />
                <p className="text-slate-500 font-medium">Loading queue...</p>
              </div>
            ) : tickets.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-200 border-dashed">
                <CurrentLogo className="w-12 h-12 text-slate-200 mb-4" />
                <p className="text-slate-500 font-medium">No tickets in queue</p>
                <button 
                  onClick={() => setShowForm(true)}
                  className="mt-4 text-emerald-600 font-bold text-sm hover:underline"
                >
                  Be the first to submit
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <AnimatePresence mode="popLayout">
                  {(() => {
                    const filtered = tickets.filter(ticket => {
                      // View Mode Filter (Today vs All)
                      if (viewMode === 'today') {
                        const ticketDate = new Date(ticket.created_at).toLocaleDateString('en-CA'); // YYYY-MM-DD
                        const today = new Date().toLocaleDateString('en-CA');
                        if (ticketDate !== today) return false;
                      }

                      const matchDept = filterDept ? ticket.department === filterDept : true;
                      const matchStatus = filterStatus ? ticket.status === filterStatus : true;
                      const matchDate = filterDate ? ticket.created_at.startsWith(filterDate) : true;
                      return matchDept && matchStatus && matchDate;
                    });

                    if (tickets.length === 0) {
                      return (
                        <motion.div 
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-200 border-dashed"
                        >
                          <CurrentLogo className="w-12 h-12 text-slate-200 mb-4" />
                          <p className="text-slate-500 font-medium">No tickets in queue</p>
                          <button 
                            onClick={() => setShowForm(true)}
                            className="mt-4 text-emerald-600 font-bold text-sm hover:underline"
                          >
                            Be the first to submit
                          </button>
                        </motion.div>
                      );
                    }

                    if (filtered.length === 0) {
                      return (
                        <motion.div 
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-200 border-dashed"
                        >
                          <Filter className="w-12 h-12 text-slate-200 mb-4" />
                          <p className="text-slate-500 font-medium">No tickets match your filter</p>
                          <button 
                            onClick={() => {
                              setFilterDept('');
                              setFilterStatus('');
                              setFilterDate('');
                            }}
                            className="mt-4 text-emerald-600 font-bold text-sm hover:underline"
                          >
                            Clear all filters
                          </button>
                        </motion.div>
                      );
                    }

                    return (
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                        {filtered.map((ticket) => (
                          <motion.div
                            key={ticket.id}
                            layout
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white rounded-2xl border border-slate-100 p-3 shadow-sm hover:shadow-md hover:border-emerald-100 transition-all group cursor-pointer relative overflow-hidden flex flex-col"
                            onClick={() => setSelectedTicket(ticket)}
                          >
                            <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                            
                            <div className="flex items-start gap-3 min-w-0">
                              <div className="flex-shrink-0">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${
                                  ticket.status === 'Resolved' ? 'bg-emerald-50 border-emerald-100 text-emerald-600' :
                                  ticket.status === 'Pending' ? 'bg-amber-50 border-amber-100 text-amber-600' :
                                  'bg-blue-50 border-blue-100 text-blue-600'
                                }`}>
                                  {getStatusIcon(ticket.status)}
                                </div>
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center justify-between gap-2 mb-0.5">
                                  <span className="text-[9px] font-black text-slate-400 tracking-tighter">#{ticket.ticket_no || ticket.id.toString().padStart(4, '0')}</span>
                                  <span className={`px-1.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border ${getStatusColor(ticket.status)}`}>
                                    {ticket.status}
                                  </span>
                                </div>
                                <h3 className="text-xs font-black text-slate-900 truncate group-hover:text-emerald-600 transition-colors mb-1.5">
                                  {ticket.category} Request
                                </h3>
                                
                                <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-[10px] text-slate-500 font-medium">
                                  <span className="flex items-center gap-1 truncate">
                                    <User className="w-2.5 h-2.5 text-slate-400 shrink-0" /> {ticket.name}
                                  </span>
                                  <span className="flex items-center gap-1 truncate">
                                    <Building2 className="w-2.5 h-2.5 text-slate-400 shrink-0" /> {ticket.department}
                                  </span>
                                  
                                  <div className="flex items-center justify-between col-span-2 mt-1 pt-1 border-t border-slate-50">
                                    <span className="flex items-center gap-1 text-[9px] text-slate-400">
                                      <Calendar className="w-2.5 h-2.5 shrink-0" /> {formatDate(ticket.created_at)}
                                    </span>
                                    <div className="flex items-center gap-0.5">
                                      <button 
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setSelectedTicket(ticket);
                                        }}
                                        className="p-1 text-slate-300 hover:text-emerald-600 hover:bg-emerald-50 rounded-md transition-all"
                                        title="View Details"
                                      >
                                        <Eye className="w-3.5 h-3.5" />
                                      </button>
                                      {adminUser && (
                                        <button 
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteTicket(ticket.id);
                                          }}
                                          className="p-1 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-all"
                                          title="Delete Ticket"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    );
                  })()}
                </AnimatePresence>
              </div>
            )}

            {/* Help CTA - Visible on mobile at the bottom */}
            <section 
              className="lg:hidden rounded-3xl p-5 sm:p-6 text-white shadow-xl relative overflow-hidden group transition-all mt-6 sm:mt-8"
              style={{ backgroundColor: appSettings.primary_color, boxShadow: `0 20px 25px -5px ${appSettings.primary_color}30` }}
            >
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                <Zap className="w-16 h-16" />
              </div>
              <h3 className="font-black text-lg mb-2">Butuh Bantuan?</h3>
              <p className="text-white/80 text-xs leading-relaxed mb-4 font-medium">
                Kirim tiket untuk masalah teknis. Tim IT kami akan memproses permintaan Anda sesegera mungkin.
              </p>
              <button 
                onClick={() => setShowForm(true)}
                className={`w-full font-bold py-3 rounded-2xl text-xs transition-all shadow-lg active:scale-95 ${
                  appSettings.theme_mode === 'dark' ? 'bg-slate-900 text-white hover:bg-slate-800' : 'bg-white text-slate-900 hover:bg-slate-50'
                }`}
              >
                Buat Tiket Sekarang
              </button>
            </section>
          </div>
        </div>
      </main>

      {/* --- MODAL: TICKET DETAIL --- */}
      <AnimatePresence>
        {selectedTicket && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedTicket(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className={`relative rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[95vh] transition-colors ${
                appSettings.theme_mode === 'dark' ? 'bg-slate-900 text-slate-100' : 'bg-white text-slate-900'
              }`}
            >
              <div className={`p-4 sm:p-6 border-b shrink-0 ${appSettings.theme_mode === 'dark' ? 'border-slate-800' : 'border-slate-100'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600">
                      <Ticket className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-slate-400">#{selectedTicket.ticket_no || selectedTicket.id.toString().padStart(4, '0')}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border ${getStatusColor(selectedTicket.status)}`}>
                          {selectedTicket.status}
                        </span>
                      </div>
                      <h2 className={`text-lg font-bold ${appSettings.theme_mode === 'dark' ? 'text-white' : 'text-slate-900'}`}>{selectedTicket.category} Request</h2>
                    </div>
                  </div>
                  <button 
                    onClick={() => setSelectedTicket(null)}
                    className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100/10 rounded-full transition-all"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="p-4 sm:p-6 overflow-y-auto custom-scrollbar">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Left Column: Info & Description */}
                  <div className="lg:col-span-7 space-y-6">
                    <div className="grid grid-cols-2 gap-3">
                      <div className={`p-3 rounded-xl border flex items-center gap-3 ${
                        appSettings.theme_mode === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-100'
                      }`}>
                        <User className="w-4 h-4 text-slate-400" />
                        <div>
                          <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Pengguna</p>
                          <p className={`text-xs font-bold ${appSettings.theme_mode === 'dark' ? 'text-slate-200' : 'text-slate-900'}`}>{selectedTicket.name}</p>
                        </div>
                      </div>
                      <div className={`p-3 rounded-xl border flex items-center gap-3 ${
                        appSettings.theme_mode === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-100'
                      }`}>
                        <Building2 className="w-4 h-4 text-slate-400" />
                        <div>
                          <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Departemen</p>
                          <p className={`text-xs font-bold ${appSettings.theme_mode === 'dark' ? 'text-slate-200' : 'text-slate-900'}`}>{selectedTicket.department}</p>
                        </div>
                      </div>
                      <div className={`p-3 rounded-xl border flex items-center gap-3 ${
                        appSettings.theme_mode === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-100'
                      }`}>
                        <Phone className="w-4 h-4 text-slate-400" />
                        <div>
                          <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Telepon</p>
                          <p className={`text-xs font-bold ${appSettings.theme_mode === 'dark' ? 'text-slate-200' : 'text-slate-900'}`}>{selectedTicket.phone}</p>
                        </div>
                      </div>
                      <div className={`p-3 rounded-xl border flex items-center gap-3 ${
                        appSettings.theme_mode === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-100'
                      }`}>
                        <Layers className="w-4 h-4 text-slate-400" />
                        <div>
                          <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Kategori</p>
                          <p className={`text-xs font-bold ${appSettings.theme_mode === 'dark' ? 'text-slate-200' : 'text-slate-900'}`}>{selectedTicket.category}</p>
                        </div>
                      </div>
                    </div>

                    <div className={`p-4 rounded-2xl border ${
                      appSettings.theme_mode === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-100'
                    }`}>
                      <div className="flex items-center gap-2 text-slate-400 mb-2">
                        <MessageSquare className="w-4 h-4" />
                        <span className="text-[10px] font-bold uppercase tracking-wider">Masalah / Detail</span>
                      </div>
                      <p className={`text-sm whitespace-pre-wrap leading-relaxed ${
                        appSettings.theme_mode === 'dark' ? 'text-slate-300' : 'text-slate-600'
                      }`}>
                        {selectedTicket.description}
                      </p>
                    </div>

                    {adminUser && (
                      <div className={`p-4 rounded-2xl border ${
                        appSettings.theme_mode === 'dark' ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-100'
                      }`}>
                        <div className="flex items-center gap-2 text-slate-400 mb-3">
                          <ShieldCheck className="w-4 h-4" />
                          <span className="text-[10px] font-bold uppercase tracking-wider">Audit Log (Admin Only)</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                          <div>
                            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">IP Address</p>
                            <p className={`text-[10px] font-mono font-bold ${appSettings.theme_mode === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
                              {selectedTicket.ip_address || 'Unknown'}
                            </p>
                          </div>
                          <div>
                            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Device Info</p>
                            <p className={`text-[10px] font-mono font-bold ${appSettings.theme_mode === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
                              {getDeviceInfo(selectedTicket.user_agent || '')}
                            </p>
                          </div>
                          <div>
                            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Location (GPS)</p>
                            {selectedTicket.latitude ? (
                              <a 
                                href={`https://www.google.com/maps?q=${selectedTicket.latitude},${selectedTicket.longitude}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-[10px] font-bold text-blue-500 hover:underline"
                              >
                                <MapPin className="w-3 h-3" />
                                {selectedTicket.latitude.toFixed(4)}, {selectedTicket.longitude?.toFixed(4)}
                              </a>
                            ) : (
                              <p className="text-[10px] font-bold text-rose-500">No GPS Data</p>
                            )}
                          </div>
                          <div>
                            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">User Agent</p>
                            <p className={`text-[10px] font-mono font-bold truncate ${appSettings.theme_mode === 'dark' ? 'text-slate-300' : 'text-slate-600'}`} title={selectedTicket.user_agent || 'Unknown'}>
                              {selectedTicket.user_agent || 'Unknown'}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {(selectedTicket.assigned_to || selectedTicket.admin_reply) && (
                      <div className="overflow-hidden rounded-2xl border border-emerald-200 bg-emerald-50/30">
                        <div className="bg-emerald-100/50 px-4 py-2 border-b border-emerald-200 flex items-center justify-between">
                          <div className="flex items-center gap-2 text-emerald-700">
                            <ShieldCheck className="w-4 h-4" />
                            <span className="text-[9px] font-black uppercase tracking-widest">Tim Respon IT</span>
                          </div>
                        </div>
                        <div className="p-4">
                          {selectedTicket.admin_reply ? (
                            <div className="space-y-2">
                              <p className="text-sm text-emerald-900 leading-relaxed font-semibold italic">
                                "{selectedTicket.admin_reply}"
                              </p>
                              <p className="text-[9px] text-emerald-600 font-black uppercase tracking-widest pt-2 border-t border-emerald-100">Balasan Resmi</p>
                            </div>
                          ) : (
                            <div className="flex items-center gap-3 text-emerald-600/70">
                              <div className="w-6 h-6 rounded-full border-2 border-emerald-200 border-t-emerald-600 animate-spin" />
                              <p className="text-xs font-bold italic">Sedang ditangani oleh {selectedTicket.assigned_to || 'Tim IT'}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-3 gap-2 p-3 bg-white rounded-xl border border-slate-100">
                      <div className="flex flex-col">
                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Diajukan</span>
                        <span className="text-[10px] font-medium text-slate-600">{formatDate(selectedTicket.created_at)}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Respon</span>
                        <span className="text-[10px] font-medium text-slate-600">{selectedTicket.responded_at ? formatDate(selectedTicket.responded_at) : '-'}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Selesai</span>
                        <span className="text-[10px] font-medium text-slate-600">{selectedTicket.resolved_at ? formatDate(selectedTicket.resolved_at) : '-'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Photo & Admin Actions */}
                  <div className="lg:col-span-5 space-y-6">
                    {selectedTicket.photo && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-slate-400">
                          <ImageIcon className="w-4 h-4" />
                          <span className="text-[10px] font-bold uppercase tracking-wider">Lampiran Foto</span>
                        </div>
                        <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 aspect-video flex items-center justify-center">
                          <img 
                            src={selectedTicket.photo} 
                            alt="Ticket attachment" 
                            className="max-w-full max-h-full object-contain"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                      </div>
                    )}

                    {adminUser && (
                      <div className="bg-slate-900 rounded-2xl p-5 shadow-xl space-y-4">
                        <div className="flex items-center gap-2 text-white mb-1">
                          <Settings2 className="w-4 h-4 text-emerald-400" />
                          <h3 className="text-[10px] font-black uppercase tracking-widest">Tindakan Admin</h3>
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Tugaskan IT</label>
                            <select 
                              id={`modal-assignee-${selectedTicket.id}`}
                              className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl py-2.5 px-3 text-xs outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-bold"
                              defaultValue={selectedTicket.assigned_to || ''}
                            >
                              <option value="">Pilih IT...</option>
                              {itPersonnel.map(it => (
                                <option key={it.id} value={it.name}>{it.name}</option>
                              ))}
                            </select>
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Status</label>
                            <div className="flex gap-1 bg-slate-800 p-1 rounded-xl border border-slate-700">
                              {STATUSES.map(status => (
                                <button
                                  key={status}
                                  onClick={() => setModalStatus(status)}
                                  className={`flex-1 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-tighter transition-all ${
                                    (modalStatus || selectedTicket.status) === status 
                                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/40' 
                                    : 'text-slate-400 hover:text-white hover:bg-slate-700'
                                  }`}
                                >
                                  {status}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Balasan Resolusi</label>
                          <textarea 
                            id={`modal-reply-${selectedTicket.id}`}
                            className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl py-3 px-4 text-xs outline-none focus:ring-2 focus:ring-emerald-500 resize-none transition-all font-medium placeholder:text-slate-600"
                            placeholder="Tulis solusi di sini..."
                            rows={3}
                            defaultValue={selectedTicket.admin_reply || ''}
                          />
                        </div>

                        <button
                          onClick={() => {
                            const assignee = (document.getElementById(`modal-assignee-${selectedTicket.id}`) as HTMLSelectElement).value;
                            const reply = (document.getElementById(`modal-reply-${selectedTicket.id}`) as HTMLTextAreaElement).value;
                            const status = modalStatus || selectedTicket.status;
                            handleUpdateClick(selectedTicket.id, status, assignee, reply);
                            setSelectedTicket(null);
                            setModalStatus('');
                          }}
                          style={{ backgroundColor: appSettings.primary_color }}
                          className="w-full text-white font-black py-3 rounded-xl hover:opacity-90 transition-all shadow-xl active:scale-[0.98] uppercase tracking-widest text-[10px]"
                        >
                          Simpan Perubahan
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- MODAL: NEW TICKET FORM --- */}
      <AnimatePresence>
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowForm(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-4xl bg-white rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[95vh]"
            >
              <div className="p-3 sm:p-4 border-b border-slate-100 shrink-0">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg sm:text-2xl font-black text-slate-900 tracking-tight">Tiket Baru</h2>
                    <p className="text-[9px] sm:text-[10px] text-slate-400 mt-0.5 font-medium uppercase tracking-widest">Beri tahu kami masalah Anda</p>
                  </div>
                  <button 
                    onClick={() => setShowForm(false)}
                    className="p-1.5 sm:p-2 bg-slate-50 hover:bg-slate-100 rounded-xl transition-all border border-slate-100"
                  >
                    <X className="w-4 h-4 sm:w-5 h-5 text-slate-400" />
                  </button>
                </div>
              </div>

              <div className="p-3 sm:p-6 overflow-y-auto custom-scrollbar">
                <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8">
                  {/* Left Column: Form Fields */}
                  <div className="space-y-3 sm:space-y-4">
                    <div className="grid grid-cols-2 gap-3 sm:gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Nama Lengkap</label>
                        <div className="relative">
                          <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                          <input 
                            required
                            type="text"
                            placeholder="Nama Anda"
                            className="w-full bg-slate-50 border border-slate-100 rounded-xl py-2.5 pl-10 pr-4 text-xs font-bold text-slate-700 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                            value={formData.name}
                            onChange={e => setFormData({...formData, name: e.target.value})}
                          />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Nomor HP</label>
                        <div className="relative">
                          <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                          <input 
                            required
                            type="tel"
                            placeholder="0812..."
                            className="w-full bg-slate-50 border border-slate-100 rounded-xl py-2.5 pl-10 pr-4 text-xs font-bold text-slate-700 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                            value={formData.phone}
                            onChange={e => setFormData({...formData, phone: e.target.value})}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Departemen</label>
                        <div className="relative">
                          <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                          <select 
                            required
                            className="w-full bg-slate-50 border border-slate-100 rounded-xl py-2.5 pl-10 pr-4 text-xs font-bold text-slate-700 focus:ring-2 focus:ring-emerald-500 outline-none transition-all appearance-none cursor-pointer"
                            value={formData.department}
                            onChange={e => setFormData({...formData, department: e.target.value})}
                          >
                            <option value="" disabled>Pilih Bagian...</option>
                            {departments.map(dept => (
                              <option key={dept.id} value={dept.name}>{dept.name}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Kategori</label>
                        <div className="relative">
                          <Layers className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                          <select 
                            required
                            className="w-full bg-slate-50 border border-slate-100 rounded-xl py-2.5 pl-10 pr-4 text-xs font-bold text-slate-700 focus:ring-2 focus:ring-emerald-500 outline-none transition-all appearance-none cursor-pointer"
                            value={formData.category}
                            onChange={e => setFormData({...formData, category: e.target.value})}
                          >
                            <option value="" disabled>Pilih Kategori...</option>
                            {categories.map(cat => (
                              <option key={cat.id} value={cat.name}>{cat.name}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Detail Masalah</label>
                      <div className="relative">
                        <MessageSquare className="absolute left-3.5 top-3.5 w-3.5 h-3.5 text-slate-400" />
                        <textarea 
                          required
                          placeholder="Jelaskan masalah Anda secara detail..."
                          rows={2}
                          className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 pl-10 pr-4 text-xs font-medium text-slate-700 focus:ring-2 focus:ring-emerald-500 outline-none transition-all resize-none"
                          value={formData.description}
                          onChange={e => setFormData({...formData, description: e.target.value})}
                        />
                      </div>
                    </div>

                    <div className={`p-3 rounded-xl border flex items-center justify-between ${
                      gpsStatus === 'success' ? 'bg-emerald-50 border-emerald-100' :
                      gpsStatus === 'error' ? 'bg-rose-50 border-rose-100' :
                      'bg-slate-50 border-slate-100'
                    }`}>
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          gpsStatus === 'success' ? 'bg-emerald-500 text-white' :
                          gpsStatus === 'error' ? 'bg-rose-500 text-white' :
                          'bg-slate-200 text-slate-400'
                        }`}>
                          <MapPin className={`w-4 h-4 ${gpsStatus === 'loading' ? 'animate-bounce' : ''}`} />
                        </div>
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Status GPS (Wajib)</p>
                          <p className={`text-xs font-bold ${
                            gpsStatus === 'success' ? 'text-emerald-700' :
                            gpsStatus === 'error' ? 'text-rose-700' :
                            'text-slate-600'
                          }`}>
                            {gpsStatus === 'loading' ? 'Mencari Lokasi...' :
                             gpsStatus === 'success' ? 'Lokasi Terkunci' :
                             gpsStatus === 'error' ? gpsError : 'Menunggu Izin...'}
                          </p>
                        </div>
                      </div>
                      {gpsStatus === 'error' && (
                        <button 
                          type="button"
                          onClick={getGPSLocation}
                          className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline"
                        >
                          Coba Lagi
                        </button>
                      )}
                    </div>

                    <button 
                      type="submit"
                      disabled={submitting || photoLoading || gpsStatus !== 'success'}
                      style={{ backgroundColor: !(submitting || photoLoading || gpsStatus !== 'success') ? appSettings.primary_color : undefined }}
                      className={`hidden lg:block w-full font-black py-4 rounded-xl transition-all shadow-xl active:scale-[0.98] uppercase tracking-widest text-[10px] ${
                        submitting || photoLoading || gpsStatus !== 'success'
                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                        : 'text-white hover:opacity-90 shadow-emerald-900/20'
                      }`}
                    >
                      {submitting ? 'Mengirim...' : 'Kirim Tiket'}
                    </button>
                  </div>

                  {/* Right Column: Photo Upload */}
                  <div className="space-y-3 sm:space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">
                        Lampiran Foto (Opsional)
                      </label>
                      <div className="relative">
                        <input 
                          type="file"
                          accept="image/*"
                          onChange={handlePhotoUpload}
                          className="hidden"
                          id="photo-upload"
                        />
                        <label 
                          htmlFor="photo-upload"
                          className={`w-full flex flex-col items-center justify-center gap-3 sm:gap-4 py-6 sm:py-10 px-4 border-2 border-dashed rounded-[1.5rem] sm:rounded-[2rem] cursor-pointer transition-all ${
                            formData.photo 
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-600' 
                            : 'bg-slate-50 border-slate-100 text-slate-400 hover:bg-slate-100 hover:border-slate-200'
                          }`}
                        >
                          {photoLoading ? (
                            <>
                              <RefreshCcw className="w-6 h-6 sm:w-8 sm:h-8 animate-spin text-emerald-600" />
                              <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest">Processing...</span>
                            </>
                          ) : formData.photo ? (
                            <>
                              <div className="relative w-24 h-24 sm:w-32 sm:h-32 rounded-2xl overflow-hidden border-2 border-white shadow-xl">
                                <img src={formData.photo} alt="Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                <div className="absolute inset-0 bg-emerald-600/40 flex items-center justify-center">
                                  <CheckCircle2 className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                                </div>
                              </div>
                              <div className="text-center">
                                <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest">Foto Terlampir</p>
                                <button 
                                  type="button"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setFormData(prev => ({ ...prev, photo: '' }));
                                  }}
                                  className="text-[8px] sm:text-[9px] font-bold text-rose-500 uppercase tracking-widest hover:underline mt-1"
                                >
                                  Hapus Foto
                                </button>
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white rounded-2xl flex items-center justify-center text-slate-400 shadow-sm border border-slate-100">
                                <Camera className="w-5 h-5 sm:w-6 sm:h-6" />
                              </div>
                              <div className="text-center">
                                <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest">Klik untuk Upload</p>
                                <p className="text-[8px] sm:text-[9px] font-medium text-slate-400 mt-1">Maksimal 5MB (JPG, PNG)</p>
                              </div>
                            </>
                          )}
                        </label>
                      </div>
                    </div>

                    <button 
                      type="submit"
                      disabled={submitting || photoLoading || gpsStatus !== 'success'}
                      className={`lg:hidden w-full font-black py-4 rounded-xl transition-all shadow-xl active:scale-[0.98] uppercase tracking-widest text-[10px] ${
                        submitting || photoLoading || gpsStatus !== 'success'
                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                        : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-900/20'
                      }`}
                    >
                      {submitting ? 'Mengirim...' : 'Kirim Tiket'}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- MODAL: MOBILE FILTER --- */}
      <AnimatePresence>
        {showMobileFilter && (
          <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowMobileFilter(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className={`relative w-full max-w-lg rounded-t-[2rem] sm:rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] ${
                appSettings.theme_mode === 'dark' ? 'bg-slate-900' : 'bg-white'
              }`}
            >
              <div className={`p-6 border-b shrink-0 flex items-center justify-between ${
                appSettings.theme_mode === 'dark' ? 'border-slate-800' : 'border-slate-100'
              }`}>
                <div>
                  <h2 className={`text-xl font-black tracking-tight ${appSettings.theme_mode === 'dark' ? 'text-white' : 'text-slate-900'}`}>Filter Antrian</h2>
                  <p className="text-[10px] text-slate-400 mt-0.5 font-medium uppercase tracking-widest">Sesuaikan tampilan antrian</p>
                </div>
                <button 
                  onClick={() => setShowMobileFilter(false)}
                  className={`p-2 rounded-xl transition-all border ${
                    appSettings.theme_mode === 'dark' ? 'bg-slate-800 border-slate-700 hover:bg-slate-750' : 'bg-slate-50 border-slate-100 hover:bg-slate-100'
                  }`}
                >
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto custom-scrollbar space-y-6">
                {/* Department Filter */}
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Bagian / Departemen</label>
                  <div className="flex flex-wrap gap-2">
                    <button 
                      onClick={() => setTempFilters({ ...tempFilters, dept: '' })}
                      className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all border ${
                        tempFilters.dept === '' 
                        ? 'bg-emerald-600 border-emerald-600 text-white' 
                        : appSettings.theme_mode === 'dark' 
                          ? 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-750' 
                          : 'bg-slate-50 border-slate-100 text-slate-500 hover:bg-slate-100'
                      }`}
                    >
                      Semua
                    </button>
                    {departments.map(dept => (
                      <button 
                        key={dept.id}
                        onClick={() => setTempFilters({ ...tempFilters, dept: dept.name })}
                        className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all border ${
                          tempFilters.dept === dept.name 
                          ? 'bg-emerald-600 border-emerald-600 text-white' 
                          : appSettings.theme_mode === 'dark' 
                            ? 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-750' 
                            : 'bg-slate-50 border-slate-100 text-slate-500 hover:bg-slate-100'
                        }`}
                      >
                        {dept.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Status Filter */}
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Status Tiket</label>
                  <div className="flex flex-wrap gap-2">
                    <button 
                      onClick={() => setTempFilters({ ...tempFilters, status: '' })}
                      className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all border ${
                        tempFilters.status === '' 
                        ? 'bg-emerald-600 border-emerald-600 text-white' 
                        : appSettings.theme_mode === 'dark' 
                          ? 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-750' 
                          : 'bg-slate-50 border-slate-100 text-slate-500 hover:bg-slate-100'
                      }`}
                    >
                      Semua
                    </button>
                    {STATUSES.map(status => (
                      <button 
                        key={status}
                        onClick={() => setTempFilters({ ...tempFilters, status: status })}
                        className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all border ${
                          tempFilters.status === status 
                          ? 'bg-emerald-600 border-emerald-600 text-white' 
                          : appSettings.theme_mode === 'dark' 
                            ? 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-750' 
                            : 'bg-slate-50 border-slate-100 text-slate-500 hover:bg-slate-100'
                        }`}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Date Filter */}
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tanggal Spesifik</label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                      type="date"
                      value={tempFilters.date}
                      onChange={(e) => setTempFilters({ ...tempFilters, date: e.target.value })}
                      className={`w-full border rounded-xl py-3 pl-12 pr-4 text-xs font-bold focus:ring-2 focus:ring-emerald-500 outline-none transition-all ${
                        appSettings.theme_mode === 'dark' 
                        ? 'bg-slate-800 border-slate-700 text-slate-200' 
                        : 'bg-slate-50 border-slate-100 text-slate-700'
                      }`}
                    />
                  </div>
                </div>
              </div>

              <div className={`p-6 border-t shrink-0 flex gap-3 ${
                appSettings.theme_mode === 'dark' ? 'border-slate-800' : 'border-slate-100'
              }`}>
                <button 
                  onClick={() => {
                    setFilterDept('');
                    setFilterStatus('');
                    setFilterDate('');
                    setTempFilters({ dept: '', status: '', date: '' });
                    setShowMobileFilter(false);
                  }}
                  className={`flex-1 py-4 font-black text-[10px] uppercase tracking-widest rounded-2xl transition-all ${
                    appSettings.theme_mode === 'dark' ? 'bg-slate-800 text-slate-400 hover:bg-slate-750' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Reset
                </button>
                <button 
                  onClick={() => {
                    setFilterDept(tempFilters.dept);
                    setFilterStatus(tempFilters.status);
                    setFilterDate(tempFilters.date);
                    setShowMobileFilter(false);
                  }}
                  className={`flex-[2] py-4 text-white font-black text-[10px] uppercase tracking-widest rounded-2xl shadow-lg transition-all active:scale-[0.98] ${
                    appSettings.theme_mode === 'dark' ? 'bg-emerald-500 shadow-emerald-900/40 hover:bg-emerald-400' : 'bg-emerald-600 shadow-emerald-900/20 hover:opacity-90'
                  }`}
                >
                  Apply Filters
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- MODAL: ADMIN LOGIN --- */}
      <AnimatePresence>
        {showLogin && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowLogin(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
              <div className="p-10">
                <div className="flex flex-col items-center text-center mb-10">
                  <div className="w-16 h-16 bg-slate-900 rounded-[1.5rem] flex items-center justify-center text-white mb-4 shadow-xl shadow-slate-200">
                    <Lock className="w-8 h-8" />
                  </div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">Admin Portal</h2>
                  <p className="text-sm text-slate-400 mt-1 font-medium">Authorized personnel only</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Username</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input 
                        required
                        type="text"
                        placeholder="Admin username"
                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-11 pr-4 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none transition-all"
                        value={loginData.username}
                        onChange={e => setLoginData({...loginData, username: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input 
                        required
                        type="password"
                        placeholder="••••••••"
                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-11 pr-4 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none transition-all"
                        value={loginData.password}
                        onChange={e => setLoginData({...loginData, password: e.target.value})}
                      />
                    </div>
                  </div>

                  <button 
                    type="submit"
                    className="w-full bg-slate-900 hover:bg-black text-white font-black py-5 rounded-2xl shadow-xl shadow-slate-200 transition-all active:scale-[0.98] uppercase tracking-widest text-xs mt-4"
                  >
                    Authenticate
                  </button>
                  <button 
                    type="button"
                    onClick={() => setShowLogin(false)}
                    className="w-full text-slate-400 text-xs font-bold hover:text-slate-600 transition-colors"
                  >
                    Cancel and Return
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- MODAL: APP SETTINGS --- */}
      <AnimatePresence>
        {showSettings && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSettings(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className={`relative w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] transition-colors ${
                appSettings.theme_mode === 'dark' ? 'bg-slate-900 text-slate-100' : 'bg-white text-slate-900'
              }`}
            >
              <div className={`p-6 border-b shrink-0 ${appSettings.theme_mode === 'dark' ? 'border-slate-800' : 'border-slate-100'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold">App Settings & Management</h2>
                    <p className="text-sm opacity-60 mt-1">Customize your helpdesk and manage data</p>
                  </div>
                  <button 
                    onClick={() => setShowSettings(false)}
                    className="p-2 hover:bg-slate-100/10 rounded-full transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              <div className="p-6 overflow-y-auto custom-scrollbar space-y-8">
                {/* Visual Settings */}
                <section className="space-y-6">
                  <h3 className="text-xs font-black uppercase tracking-widest text-emerald-500">Visual & Theme</h3>
                  <form onSubmit={handleUpdateSettings} className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold opacity-60 uppercase tracking-wider ml-1">Application Name</label>
                        <input 
                          required
                          type="text"
                          className={`w-full border rounded-xl py-3 px-4 text-sm outline-none transition-all ${
                            appSettings.theme_mode === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'
                          }`}
                          value={appSettings.app_name}
                          onChange={e => setAppSettings({...appSettings, app_name: e.target.value})}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold opacity-60 uppercase tracking-wider ml-1">Theme Mode</label>
                        <div className="flex gap-2 p-1 bg-slate-800 rounded-xl border border-slate-700">
                          <button
                            type="button"
                            onClick={() => setAppSettings({...appSettings, theme_mode: 'light'})}
                            className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                              appSettings.theme_mode === 'light' ? 'bg-white text-slate-900' : 'text-slate-400 hover:text-white'
                            }`}
                          >
                            Light
                          </button>
                          <button
                            type="button"
                            onClick={() => setAppSettings({...appSettings, theme_mode: 'dark'})}
                            className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                              appSettings.theme_mode === 'dark' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'
                            }`}
                          >
                            Dark
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <label className="text-xs font-bold opacity-60 uppercase tracking-wider ml-1">Primary Color</label>
                      <div className="flex flex-wrap gap-3">
                        {['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#000000'].map(color => (
                          <button
                            key={color}
                            type="button"
                            onClick={() => setAppSettings({...appSettings, primary_color: color})}
                            className={`w-10 h-10 rounded-full border-4 transition-all ${
                              appSettings.primary_color === color ? 'border-white scale-110 shadow-lg' : 'border-transparent opacity-60 hover:opacity-100'
                            }`}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <label className="text-xs font-bold opacity-60 uppercase tracking-wider ml-1">Pilih Logo</label>
                      <div className="grid grid-cols-5 gap-3">
                        {LOGO_OPTIONS.map(option => (
                          <button
                            key={option.id}
                            type="button"
                            onClick={() => setAppSettings({...appSettings, logo_type: option.id})}
                            className={`aspect-square rounded-xl flex items-center justify-center border-2 transition-all ${
                              appSettings.logo_type === option.id 
                              ? 'bg-emerald-500 border-emerald-500 text-white' 
                              : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'
                            }`}
                          >
                            <option.icon className="w-6 h-6" />
                          </button>
                        ))}
                      </div>
                    </div>

                    <button 
                      type="submit"
                      style={{ backgroundColor: appSettings.primary_color }}
                      className="w-full hover:opacity-90 text-white font-bold py-4 rounded-2xl shadow-lg transition-all active:scale-[0.98]"
                    >
                      Simpan Pengaturan Visual
                    </button>
                  </form>
                </section>

                {/* Email Notifications */}
                <section className="space-y-6 pt-8 border-t border-slate-800">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xs font-black uppercase tracking-widest text-amber-500">Email Notifications</h3>
                      <p className="text-[10px] opacity-60 mt-1">Maksimal 3 email untuk notifikasi tiket baru</p>
                    </div>
                    {!showEmailInput && appSettings.notification_emails.length < 3 && (
                      <button 
                        type="button"
                        onClick={() => setShowEmailInput(true)}
                        className="text-[10px] font-black text-emerald-500 uppercase tracking-widest hover:underline"
                      >
                        + Tambah Email
                      </button>
                    )}
                  </div>
                  
                  {showEmailInput && (
                    <div className="flex gap-2">
                      <input 
                        type="email"
                        placeholder="Masukkan email..."
                        className={`flex-1 border rounded-xl py-2 px-4 text-xs outline-none transition-all ${
                          appSettings.theme_mode === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'
                        }`}
                        value={newEmailInput}
                        onChange={e => setNewEmailInput(e.target.value)}
                        onKeyPress={e => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            const email = newEmailInput.trim();
                            if (email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                              setAppSettings({
                                ...appSettings,
                                notification_emails: [...appSettings.notification_emails, email]
                              });
                              setNewEmailInput('');
                              setShowEmailInput(false);
                            } else {
                              alert('Format email tidak valid');
                            }
                          }
                        }}
                      />
                      <button 
                        type="button"
                        onClick={() => {
                          const email = newEmailInput.trim();
                          if (email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                            setAppSettings({
                              ...appSettings,
                              notification_emails: [...appSettings.notification_emails, email]
                            });
                            setNewEmailInput('');
                            setShowEmailInput(false);
                          } else {
                            alert('Format email tidak valid');
                          }
                        }}
                        className="px-4 py-2 bg-emerald-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl"
                      >
                        Add
                      </button>
                      <button 
                        type="button"
                        onClick={() => {
                          setShowEmailInput(false);
                          setNewEmailInput('');
                        }}
                        className="px-4 py-2 bg-slate-700 text-white text-[10px] font-black uppercase tracking-widest rounded-xl"
                      >
                        Batal
                      </button>
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    {appSettings.notification_emails.length === 0 ? (
                      <p className="text-[10px] italic opacity-40">Belum ada email notifikasi yang didaftarkan.</p>
                    ) : (
                      appSettings.notification_emails.map((email, idx) => (
                        <div key={idx} className="flex items-center justify-between bg-slate-800/50 border border-slate-700 p-3 rounded-xl group">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-slate-700 rounded-lg flex items-center justify-center text-slate-400">
                              <Globe className="w-4 h-4" />
                            </div>
                            <span className="text-xs font-bold">{email}</span>
                          </div>
                          <button 
                            type="button"
                            onClick={() => {
                              const newEmails = [...appSettings.notification_emails];
                              newEmails.splice(idx, 1);
                              setAppSettings({ ...appSettings, notification_emails: newEmails });
                            }}
                            className="text-rose-500 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </section>

                {/* Data Management */}
                <section className="space-y-6 pt-8 border-t border-slate-800">
                  <h3 className="text-xs font-black uppercase tracking-widest text-blue-500">Data Management</h3>
                  
                  {/* IT Personnel */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold opacity-60 uppercase tracking-wider">Tim IT</label>
                      <button 
                        onClick={() => setAddingType(addingType === 'it' ? null : 'it')} 
                        className="text-[10px] font-black text-emerald-500 uppercase tracking-widest hover:underline"
                      >
                        {addingType === 'it' ? 'Batal' : '+ Tambah IT'}
                      </button>
                    </div>
                    
                    {addingType === 'it' && (
                      <div className="flex gap-2">
                        <input 
                          autoFocus
                          type="text"
                          value={newItemName}
                          onChange={e => setNewItemName(e.target.value)}
                          placeholder="Nama IT baru..."
                          className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs font-bold text-white outline-none focus:ring-1 focus:ring-emerald-500"
                          onKeyDown={e => e.key === 'Enter' && handleManagementAction('it', 'add')}
                        />
                        <button 
                          onClick={() => handleManagementAction('it', 'add')}
                          className="bg-emerald-600 text-white px-3 py-2 rounded-lg text-[10px] font-black uppercase"
                        >
                          Simpan
                        </button>
                      </div>
                    )}

                    <div className="flex flex-wrap gap-2">
                      {itPersonnel.map(it => (
                        <div key={it.id} className="flex items-center gap-2 bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700 group">
                          <span className="text-xs font-bold text-slate-200">{it.name}</span>
                          <button onClick={() => handleManagementAction('it', 'delete', it)} className="text-rose-500 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Departments */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold opacity-60 uppercase tracking-wider">Departemen</label>
                      <button 
                        onClick={() => setAddingType(addingType === 'dept' ? null : 'dept')} 
                        className="text-[10px] font-black text-emerald-500 uppercase tracking-widest hover:underline"
                      >
                        {addingType === 'dept' ? 'Batal' : '+ Tambah Departemen'}
                      </button>
                    </div>

                    {addingType === 'dept' && (
                      <div className="flex gap-2">
                        <input 
                          autoFocus
                          type="text"
                          value={newItemName}
                          onChange={e => setNewItemName(e.target.value)}
                          placeholder="Nama Departemen baru..."
                          className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs font-bold text-white outline-none focus:ring-1 focus:ring-emerald-500"
                          onKeyDown={e => e.key === 'Enter' && handleManagementAction('dept', 'add')}
                        />
                        <button 
                          onClick={() => handleManagementAction('dept', 'add')}
                          className="bg-emerald-600 text-white px-3 py-2 rounded-lg text-[10px] font-black uppercase"
                        >
                          Simpan
                        </button>
                      </div>
                    )}

                    <div className="flex flex-wrap gap-2">
                      {departments.map(dept => (
                        <div key={dept.id} className="flex items-center gap-2 bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700 group">
                          <span className="text-xs font-bold text-slate-200">{dept.name}</span>
                          <button onClick={() => handleManagementAction('dept', 'delete', dept)} className="text-rose-500 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Categories */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold opacity-60 uppercase tracking-wider">Kategori</label>
                      <button 
                        onClick={() => setAddingType(addingType === 'cat' ? null : 'cat')} 
                        className="text-[10px] font-black text-emerald-500 uppercase tracking-widest hover:underline"
                      >
                        {addingType === 'cat' ? 'Batal' : '+ Tambah Kategori'}
                      </button>
                    </div>

                    {addingType === 'cat' && (
                      <div className="flex gap-2">
                        <input 
                          autoFocus
                          type="text"
                          value={newItemName}
                          onChange={e => setNewItemName(e.target.value)}
                          placeholder="Nama Kategori baru..."
                          className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs font-bold text-white outline-none focus:ring-1 focus:ring-emerald-500"
                          onKeyDown={e => e.key === 'Enter' && handleManagementAction('cat', 'add')}
                        />
                        <button 
                          onClick={() => handleManagementAction('cat', 'add')}
                          className="bg-emerald-600 text-white px-3 py-2 rounded-lg text-[10px] font-black uppercase"
                        >
                          Simpan
                        </button>
                      </div>
                    )}

                    <div className="flex flex-wrap gap-2">
                      {categories.map(cat => (
                        <div key={cat.id} className="flex items-center gap-2 bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700 group">
                          <span className="text-xs font-bold text-slate-200">{cat.name}</span>
                          <button onClick={() => handleManagementAction('cat', 'delete', cat)} className="text-rose-500 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </section>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Reset Confirmation Modal */}
      <AnimatePresence>
        {showResetConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowResetConfirm(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-8 text-center">
                <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Trash2 className="text-rose-600 w-8 h-8" />
                </div>
                <h2 className="text-xl font-bold text-slate-900 mb-2">Reset All Data?</h2>
                <p className="text-sm text-slate-500 mb-8 leading-relaxed">
                  This action will permanently delete all tickets in the queue. This cannot be undone.
                </p>
                <div className="flex gap-3">
                  <button 
                    onClick={() => setShowResetConfirm(false)}
                    className="flex-1 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleReset}
                    className="flex-1 px-4 py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-lg shadow-rose-100 transition-all active:scale-[0.98]"
                  >
                    Yes, Reset
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Update Confirmation Modal */}
      <AnimatePresence>
        {pendingUpdate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setPendingUpdate(null)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-8 text-center">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 className="text-emerald-600 w-8 h-8" />
                </div>
                <h2 className="text-xl font-bold text-slate-900 mb-2">Konfirmasi Perubahan</h2>
                <p className="text-sm text-slate-500 mb-6 leading-relaxed">
                  Apakah Anda yakin ingin memperbarui status menjadi <span className="font-bold text-slate-900">{pendingUpdate.status}</span> dan menyimpan data penanganan ini?
                </p>
                <div className="flex gap-3">
                  <button 
                    onClick={() => setPendingUpdate(null)}
                    className="flex-1 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-all"
                  >
                    Batal
                  </button>
                  <button 
                    onClick={confirmUpdate}
                    className="flex-1 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-100 transition-all active:scale-[0.98]"
                  >
                    Ya, Simpan
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 3s linear infinite;
        }
      `}</style>
    </div>
  );
}
