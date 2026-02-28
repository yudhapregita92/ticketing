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
  BarChart3
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
}

const IT_PERSONNEL = ['Yudha', 'Bayu'];
const CATEGORIES = ['Synergi', 'SCM', 'MKT', 'Hardware', 'Jaringan'];
const DEPARTMENTS = [
  'HRGA', 
  'CE Business', 
  'Fleet Business', 
  'Accounting', 
  'Treasury & Financing', 
  'Store Retail', 
  'Supply Chain', 
  'Other Retail', 
  'OSS',
  'PT DKU'
];
const STATUSES = ['Pending', 'In Progress', 'Resolved', 'Cancelled'];
const LOGO_OPTIONS = [
  { id: 'ShieldCheck', icon: ShieldCheck },
  { id: 'Cpu', icon: Cpu },
  { id: 'Globe', icon: Globe },
  { id: 'Zap', icon: Zap },
  { id: 'Ticket', icon: Ticket }
];

export default function App() {
  const [tickets, setTickets] = useState<ITicket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<ITicket | null>(null);
  const [modalStatus, setModalStatus] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [adminUser, setAdminUser] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [pendingUpdate, setPendingUpdate] = useState<{id: number, status: string, assigned_to: string | null, admin_reply: string | null} | null>(null);
  const [appSettings, setAppSettings] = useState({ app_name: 'IT Helpdesk Pro', logo_type: 'ShieldCheck' });
  const [loginData, setLoginData] = useState({ username: '', password: '' });
  const [formData, setFormData] = useState({
    name: '',
    department: '',
    category: '',
    phone: '',
    description: '',
    photo: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [filterDept, setFilterDept] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterDate, setFilterDate] = useState<string>('');
  const [photoLoading, setPhotoLoading] = useState(false);

  const categoryStats = useMemo(() => {
    const stats = CATEGORIES.map(cat => ({
      name: cat,
      value: tickets.filter(t => t.category === cat).length
    })).filter(s => s.value > 0);
    return stats;
  }, [tickets]);

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

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

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings');
      const data = await res.json();
      if (data.app_name) setAppSettings(data);
    } catch (err) {
      console.error('Failed to fetch settings:', err);
    }
  };

  useEffect(() => {
    fetchTickets();
    fetchSettings();
    const interval = setInterval(fetchTickets, 10000);
    const savedAdmin = localStorage.getItem('adminUser');
    if (savedAdmin) setAdminUser(JSON.parse(savedAdmin));
    return () => clearInterval(interval);
  }, []);

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

  const handleLogout = () => {
    setAdminUser(null);
    localStorage.removeItem('adminUser');
  };

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

  const handleUpdateSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(appSettings)
      });
      if (res.ok) {
        setShowSettings(false);
        alert('Settings updated successfully!');
      }
    } catch (err) {
      alert('Update failed');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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

  const handleUpdateClick = (id: number, status: string, assigned_to: string | null, admin_reply: string | null) => {
    if (!assigned_to) {
      alert('Silakan pilih IT yang menangani terlebih dahulu.');
      return;
    }
    setPendingUpdate({ id, status, assigned_to, admin_reply });
  };

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

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    // SQLite's CURRENT_TIMESTAMP returns "YYYY-MM-DD HH:MM:SS" in UTC.
    // If there's no 'T' or 'Z', it's likely this format.
    // We append 'Z' to ensure it's parsed as UTC.
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'In Progress': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Resolved': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'Cancelled': return 'bg-rose-100 text-rose-700 border-rose-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

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
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans selection:bg-emerald-100 selection:text-emerald-900">
      {/* Header */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-200">
              <CurrentLogo className="text-white w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-slate-900 leading-none">{appSettings.app_name}</h1>
              <p className="text-xs font-medium text-slate-500 mt-1">Enterprise Support System</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {adminUser ? (
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setShowSettings(true)}
                  className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-all"
                  title="Settings"
                >
                  <Settings2 className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => setShowResetConfirm(true)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-50 text-rose-600 border border-rose-100 hover:bg-rose-100 transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                  Reset Data
                </button>
                <button 
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-500 hover:bg-slate-100 transition-all relative"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                  {tickets.filter(t => t.status === 'Pending').length > 0 && (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white animate-pulse" />
                  )}
                </button>
              </div>
            ) : (
              <button 
                onClick={() => setShowLogin(true)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-500 hover:bg-slate-100 transition-all"
              >
                <LogIn className="w-4 h-4" />
                Admin Login
              </button>
            )}
            <button 
              onClick={() => setShowForm(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-sm font-semibold shadow-lg shadow-emerald-200 transition-all duration-200 flex items-center gap-2 active:scale-95"
            >
              <Plus className="w-4 h-4" />
              New Ticket
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Stats / Info Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {adminUser && (
              <motion.section 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm overflow-hidden relative"
              >
                <div className="absolute top-0 right-0 p-6 opacity-5">
                  <Bell className="w-24 h-24 text-slate-900" />
                </div>
                <div className="flex items-center gap-3 mb-6">
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

            <section className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Queue Stats</h2>
                <BarChart3 className="w-4 h-4 text-slate-300" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-slate-200 transition-all">
                  <p className="text-2xl font-black text-slate-900 leading-none mb-1">{tickets.length}</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total</p>
                </div>
                <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 hover:border-amber-200 transition-all">
                  <p className="text-2xl font-black text-amber-600 leading-none mb-1">
                    {tickets.filter(t => t.status === 'Pending').length}
                  </p>
                  <p className="text-[10px] font-bold text-amber-500 uppercase tracking-widest">Waiting</p>
                </div>
                <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 hover:border-blue-200 transition-all">
                  <p className="text-2xl font-black text-blue-600 leading-none mb-1">
                    {tickets.filter(t => t.status === 'In Progress').length}
                  </p>
                  <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">Active</p>
                </div>
                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 hover:border-emerald-200 transition-all">
                  <p className="text-2xl font-black text-emerald-600 leading-none mb-1">
                    {tickets.filter(t => t.status === 'Resolved').length}
                  </p>
                  <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Done</p>
                </div>
              </div>
            </section>

            {adminUser && categoryStats.length > 0 && (
              <motion.section 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm"
              >
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-6">Issue Distribution</h2>
                <div className="h-48 w-full">
                  <ResponsiveContainer width="100%" height="100%">
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

            <section className="bg-emerald-600 rounded-3xl p-8 text-white shadow-xl shadow-emerald-100 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                <Zap className="w-20 h-20" />
              </div>
              <h3 className="font-black text-xl mb-3">Need Help?</h3>
              <p className="text-emerald-100 text-sm leading-relaxed mb-6 font-medium">
                Submit a ticket for technical issues. Our IT team will process your request as soon as possible.
              </p>
              <button 
                onClick={() => setShowForm(true)}
                className="w-full bg-white text-emerald-600 font-bold py-3.5 rounded-2xl text-sm hover:bg-emerald-50 transition-all shadow-lg shadow-emerald-900/20 active:scale-95"
              >
                Create Ticket Now
              </button>
            </section>
          </div>

          {/* Ticket List */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xl font-bold text-slate-900">Support Queue</h2>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => {
                    setFilterDept('');
                    setFilterStatus('');
                    setFilterDate('');
                  }}
                  className="text-[10px] font-bold text-slate-400 hover:text-emerald-600 uppercase tracking-wider"
                >
                  Reset Filter
                </button>
                <button 
                  onClick={fetchTickets}
                  className="p-2 text-slate-400 hover:text-emerald-600 transition-colors"
                  title="Refresh Queue"
                >
                  <RefreshCcw className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex-1 relative">
                <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <select 
                  value={filterDept}
                  onChange={(e) => setFilterDept(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl py-2.5 pl-10 pr-4 text-xs font-bold text-slate-600 focus:ring-2 focus:ring-emerald-500 outline-none appearance-none cursor-pointer hover:bg-slate-100 transition-all"
                >
                  <option value="">Semua Bagian</option>
                  {DEPARTMENTS.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>
              <div className="flex-1 relative">
                <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <select 
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl py-2.5 pl-10 pr-4 text-xs font-bold text-slate-600 focus:ring-2 focus:ring-emerald-500 outline-none appearance-none cursor-pointer hover:bg-slate-100 transition-all"
                >
                  <option value="">Semua Status</option>
                  {STATUSES.map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>
              <div className="flex-1 relative">
                <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="date"
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl py-2.5 pl-10 pr-4 text-xs font-bold text-slate-600 focus:ring-2 focus:ring-emerald-500 outline-none cursor-pointer hover:bg-slate-100 transition-all"
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

                    return filtered.map((ticket) => (
                      <motion.div
                        key={ticket.id}
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-xl hover:border-emerald-100 transition-all group cursor-pointer relative overflow-hidden"
                        onClick={() => setSelectedTicket(ticket)}
                      >
                        <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                        
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="flex items-start gap-4 min-w-0">
                            <div className="flex-shrink-0 mt-1">
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
                                ticket.status === 'Resolved' ? 'bg-emerald-50 border-emerald-100 text-emerald-600' :
                                ticket.status === 'Pending' ? 'bg-amber-50 border-amber-100 text-amber-600' :
                                'bg-blue-50 border-blue-100 text-blue-600'
                              }`}>
                                {getStatusIcon(ticket.status)}
                              </div>
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center flex-wrap gap-2 mb-1">
                                <span className="text-[10px] font-black text-slate-400 tracking-tighter">#{ticket.ticket_no || ticket.id.toString().padStart(4, '0')}</span>
                                <h3 className="text-sm font-black text-slate-900 truncate group-hover:text-emerald-600 transition-colors">
                                  {ticket.category} Request
                                </h3>
                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${getStatusColor(ticket.status)}`}>
                                  {ticket.status}
                                </span>
                              </div>
                              <div className="flex items-center flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-500 font-medium">
                                <span className="flex items-center gap-1.5">
                                  <User className="w-3 h-3 text-slate-400" /> {ticket.name}
                                </span>
                                <span className="flex items-center gap-1.5">
                                  <Building2 className="w-3 h-3 text-slate-400" /> {ticket.department}
                                </span>
                                <span className="flex items-center gap-1.5">
                                  <Calendar className="w-3 h-3 text-slate-400" /> {formatDate(ticket.created_at)}
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-end gap-2 sm:border-l sm:border-slate-100 sm:pl-4">
                            {adminUser && ticket.status === 'Pending' && (
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedTicket(ticket);
                                  // Auto focus on IT assignment in modal
                                }}
                                className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-emerald-700 transition-all shadow-sm shadow-emerald-100"
                              >
                                <Zap className="w-3 h-3" /> Quick Action
                              </button>
                            )}
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedTicket(ticket);
                              }}
                              className="p-2.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all border border-transparent hover:border-emerald-100"
                              title="View Details"
                            >
                              <Eye className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ));
                  })()}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Detail Modal */}
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
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden"
            >
              <div className="p-6 sm:p-8">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600">
                      <Ticket className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-400">#{selectedTicket.ticket_no || selectedTicket.id.toString().padStart(4, '0')}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getStatusColor(selectedTicket.status)}`}>
                          {selectedTicket.status}
                        </span>
                      </div>
                      <h2 className="text-xl font-bold text-slate-900">{selectedTicket.category} Request</h2>
                    </div>
                  </div>
                  <button 
                    onClick={() => setSelectedTicket(null)}
                    className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-4">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-400 shadow-sm border border-slate-200">
                      <User className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">User</p>
                      <p className="text-sm font-bold text-slate-900">{selectedTicket.name}</p>
                    </div>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-4">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-400 shadow-sm border border-slate-200">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Department</p>
                      <p className="text-sm font-bold text-slate-900">{selectedTicket.department}</p>
                    </div>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-4">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-400 shadow-sm border border-slate-200">
                      <Phone className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Phone</p>
                      <p className="text-sm font-bold text-slate-900">{selectedTicket.phone}</p>
                    </div>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-4">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-400 shadow-sm border border-slate-200">
                      <Layers className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Category</p>
                      <p className="text-sm font-bold text-slate-900">{selectedTicket.category}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="flex items-center gap-2 text-slate-400 mb-2">
                      <MessageSquare className="w-4 h-4" />
                      <span className="text-xs font-bold uppercase tracking-wider">Masalah / Detail</span>
                    </div>
                    <p className="text-sm text-slate-600 whitespace-pre-wrap leading-relaxed">
                      {selectedTicket.description}
                    </p>
                  </div>

                  {selectedTicket.photo && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-slate-400">
                        <ImageIcon className="w-4 h-4" />
                        <span className="text-xs font-bold uppercase tracking-wider">Lampiran Foto (Watermarked)</span>
                      </div>
                      <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 aspect-video flex items-center justify-center">
                        <img 
                          src={selectedTicket.photo} 
                          alt="Ticket attachment" 
                          className="max-w-full max-h-full object-contain"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute top-3 right-3">
                          <div className="bg-white/90 backdrop-blur-sm p-1.5 rounded-lg shadow-sm border border-slate-200">
                            <MapPin className="w-4 h-4 text-emerald-600" />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-white rounded-2xl border border-slate-100">
                    <div className="flex flex-col">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Submitted</span>
                      <div className="flex items-center gap-1.5 text-slate-600">
                        <Clock className="w-3 h-3" />
                        <span className="text-[11px] font-medium">{formatDate(selectedTicket.created_at)}</span>
                      </div>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">First Response</span>
                      <div className="flex items-center gap-1.5 text-slate-600">
                        <MessageCircle className="w-3 h-3" />
                        <span className="text-[11px] font-medium">
                          {selectedTicket.responded_at ? formatDate(selectedTicket.responded_at) : '-'}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Resolved</span>
                      <div className="flex items-center gap-1.5 text-slate-600">
                        <CheckCircle2 className="w-3 h-3" />
                        <span className="text-[11px] font-medium">
                          {selectedTicket.resolved_at ? formatDate(selectedTicket.resolved_at) : '-'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {(selectedTicket.assigned_to || selectedTicket.admin_reply) && (
                    <div className="overflow-hidden rounded-3xl border border-emerald-200 bg-emerald-50/30">
                      <div className="bg-emerald-100/50 px-6 py-3 border-b border-emerald-200 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-emerald-700">
                          <ShieldCheck className="w-5 h-5" />
                          <span className="text-[10px] font-black uppercase tracking-widest">IT Response Team</span>
                        </div>
                        {selectedTicket.assigned_to && (
                          <div className="flex items-center gap-2 bg-white px-3 py-1 rounded-xl border border-emerald-200 shadow-sm">
                            <div className="w-4 h-4 bg-emerald-600 rounded-full flex items-center justify-center text-[8px] text-white font-bold">
                              {selectedTicket.assigned_to.charAt(0)}
                            </div>
                            <span className="text-[10px] font-bold text-emerald-700">
                              {selectedTicket.assigned_to}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="p-6">
                        {selectedTicket.admin_reply ? (
                          <div className="space-y-3">
                            <p className="text-sm text-emerald-900 leading-relaxed font-semibold italic">
                              "{selectedTicket.admin_reply}"
                            </p>
                            <div className="flex items-center gap-2 pt-2 border-t border-emerald-100">
                              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                              <p className="text-[10px] text-emerald-600 font-black uppercase tracking-widest">Official Resolution</p>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-3 text-emerald-600/70 py-2">
                            <div className="w-8 h-8 rounded-full border-2 border-emerald-200 border-t-emerald-600 animate-spin" />
                            <p className="text-xs font-bold italic tracking-tight">Tiket sedang ditangani oleh {selectedTicket.assigned_to || 'Tim IT'}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {adminUser && (
                    <div className="pt-8 border-t border-slate-100">
                      <div className="bg-slate-900 rounded-3xl p-8 shadow-xl shadow-slate-200 space-y-6">
                        <div className="flex items-center gap-3 text-white mb-2">
                          <Settings2 className="w-5 h-5 text-emerald-400" />
                          <h3 className="text-sm font-black uppercase tracking-widest">Administrative Actions</h3>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Assign IT Personnel</label>
                            <select 
                              id={`modal-assignee-${selectedTicket.id}`}
                              className="w-full bg-slate-800 border border-slate-700 text-white rounded-2xl py-3 px-4 text-sm outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-bold"
                              defaultValue={selectedTicket.assigned_to || ''}
                            >
                              <option value="">Pilih IT...</option>
                              {IT_PERSONNEL.map(it => (
                                <option key={it} value={it}>{it}</option>
                              ))}
                            </select>
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Update Status</label>
                            <div className="flex gap-1 bg-slate-800 p-1 rounded-2xl border border-slate-700">
                              {STATUSES.map(status => (
                                <button
                                  key={status}
                                  id={`modal-status-${status}`}
                                  onClick={() => {
                                    setModalStatus(status);
                                  }}
                                  className={`flex-1 py-2 rounded-xl text-[9px] font-black uppercase tracking-tighter transition-all ${
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

                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Official Resolution Reply</label>
                          <textarea 
                            id={`modal-reply-${selectedTicket.id}`}
                            className="w-full bg-slate-800 border border-slate-700 text-white rounded-2xl py-4 px-5 text-sm outline-none focus:ring-2 focus:ring-emerald-500 resize-none transition-all font-medium placeholder:text-slate-600"
                            placeholder="Tulis solusi atau balasan resmi di sini..."
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
                          className="w-full bg-emerald-600 text-white font-black py-4 rounded-2xl hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-900/20 active:scale-[0.98] uppercase tracking-widest text-xs"
                        >
                          Update Ticket Records
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal Form */}
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
              className="relative w-full max-w-lg bg-white rounded-[2rem] shadow-2xl overflow-hidden"
            >
              <div className="p-10">
                <div className="flex items-center justify-between mb-10">
                  <div>
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight">New Ticket</h2>
                    <p className="text-sm text-slate-400 mt-1 font-medium">Beri tahu kami masalah Anda</p>
                  </div>
                  <button 
                    onClick={() => setShowForm(false)}
                    className="p-3 bg-slate-50 hover:bg-slate-100 rounded-2xl transition-all border border-slate-100"
                  >
                    <X className="w-6 h-6 text-slate-400" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nama Lengkap</label>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input 
                          required
                          type="text"
                          placeholder="Nama Anda"
                          className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-3.5 pl-11 pr-4 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                          value={formData.name}
                          onChange={e => setFormData({...formData, name: e.target.value})}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nomor HP</label>
                      <div className="relative">
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input 
                          required
                          type="tel"
                          placeholder="0812..."
                          className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-3.5 pl-11 pr-4 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                          value={formData.phone}
                          onChange={e => setFormData({...formData, phone: e.target.value})}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Department</label>
                      <div className="relative">
                        <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <select 
                          required
                          className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-3.5 pl-11 pr-4 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all appearance-none cursor-pointer"
                          value={formData.department}
                          onChange={e => setFormData({...formData, department: e.target.value})}
                        >
                          <option value="" disabled>Pilih Bagian...</option>
                          {DEPARTMENTS.map(dept => (
                            <option key={dept} value={dept}>{dept}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Category</label>
                      <div className="relative">
                        <Layers className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <select 
                          required
                          className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-3.5 pl-11 pr-4 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all appearance-none cursor-pointer"
                          value={formData.category}
                          onChange={e => setFormData({...formData, category: e.target.value})}
                        >
                          <option value="" disabled>Pilih Kategori...</option>
                          {CATEGORIES.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Detail Masalah</label>
                    <div className="relative">
                      <MessageSquare className="absolute left-4 top-4 w-4 h-4 text-slate-400" />
                      <textarea 
                        required
                        placeholder="Jelaskan masalah Anda secara detail..."
                        rows={4}
                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-11 pr-4 text-sm font-medium text-slate-700 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all resize-none"
                        value={formData.description}
                        onChange={e => setFormData({...formData, description: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
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
                        className={`w-full flex flex-col items-center justify-center gap-4 py-8 px-4 border-2 border-dashed rounded-[2rem] cursor-pointer transition-all ${
                          formData.photo 
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-600' 
                          : 'bg-slate-50 border-slate-100 text-slate-400 hover:bg-slate-100 hover:border-slate-200'
                        }`}
                      >
                        {photoLoading ? (
                          <>
                            <RefreshCcw className="w-8 h-8 animate-spin text-emerald-600" />
                            <span className="text-xs font-bold uppercase tracking-widest">Processing...</span>
                          </>
                        ) : formData.photo ? (
                          <>
                            <div className="relative w-24 h-24 rounded-2xl overflow-hidden border-2 border-white shadow-xl">
                              <img src={formData.photo} alt="Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                              <div className="absolute inset-0 bg-emerald-600/40 flex items-center justify-center">
                                <CheckCircle2 className="w-8 h-8 text-white" />
                              </div>
                            </div>
                            <div className="text-center">
                              <p className="text-xs font-black uppercase tracking-widest">Foto Terlampir</p>
                              <button 
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setFormData(prev => ({ ...prev, photo: '' }));
                                }}
                                className="text-[10px] font-bold text-emerald-600 underline mt-1"
                              >
                                Ganti Foto
                              </button>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="w-12 h-12 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center">
                              <Camera className="w-6 h-6 text-slate-400" />
                            </div>
                            <div className="text-center">
                              <p className="text-xs font-black uppercase tracking-widest">Klik untuk Unggah</p>
                              <p className="text-[10px] mt-1 font-medium opacity-60">Auto Watermark Lokasi & Waktu</p>
                            </div>
                          </>
                        )}
                      </label>
                    </div>
                  </div>

                  <button 
                    disabled={submitting || photoLoading}
                    type="submit"
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-5 rounded-[1.5rem] shadow-xl shadow-emerald-900/10 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed mt-4 uppercase tracking-widest text-xs"
                  >
                    {submitting ? 'Sending...' : 'Submit Support Ticket'}
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Login Modal */}
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

      {/* Settings Modal */}
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
              className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-8">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">App Settings</h2>
                    <p className="text-sm text-slate-500 mt-1">Customize your helpdesk</p>
                  </div>
                  <button 
                    onClick={() => setShowSettings(false)}
                    className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                  >
                    <ChevronRight className="w-6 h-6 rotate-90" />
                  </button>
                </div>

                <form onSubmit={handleUpdateSettings} className="space-y-6">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Application Name</label>
                    <input 
                      required
                      type="text"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                      value={appSettings.app_name}
                      onChange={e => setAppSettings({...appSettings, app_name: e.target.value})}
                    />
                  </div>

                  <div className="space-y-3">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Select Logo</label>
                    <div className="grid grid-cols-5 gap-3">
                      {LOGO_OPTIONS.map(option => (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() => setAppSettings({...appSettings, logo_type: option.id})}
                          className={`aspect-square rounded-xl flex items-center justify-center border-2 transition-all ${
                            appSettings.logo_type === option.id 
                            ? 'bg-emerald-50 border-emerald-600 text-emerald-600' 
                            : 'bg-slate-50 border-slate-100 text-slate-400 hover:bg-slate-100'
                          }`}
                        >
                          <option.icon className="w-6 h-6" />
                        </button>
                      ))}
                    </div>
                  </div>

                  <button 
                    type="submit"
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 rounded-2xl shadow-lg shadow-emerald-100 transition-all active:scale-[0.98] mt-4"
                  >
                    Save Changes
                  </button>
                </form>
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
