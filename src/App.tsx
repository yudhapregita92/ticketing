import React, { useState, useEffect, useMemo, useRef } from 'react';
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
  Send,
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
  SlidersHorizontal,
  History,
  ShieldAlert,
  UserPlus
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
  updated_at: string;
  responded_at?: string | null;
  resolved_at?: string | null;
  photo?: string | null;
  ip_address?: string | null;
  user_agent?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  internal_notes?: string | null;
}

const STATUSES = ['New', 'In Progress', 'Completed', 'Cancelled'];
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
  const [ticketLogs, setTicketLogs] = useState<any[]>([]); // Riwayat tiket
  const [itPersonnel, setItPersonnel] = useState<{id: number, name: string}[]>([]);
  const [users, setUsers] = useState<{id: number, username: string, full_name: string, role: string}[]>([]);
  const [departments, setDepartments] = useState<{id: number, name: string}[]>([]);
  const [categories, setCategories] = useState<{id: number, name: string}[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<ITicket | null>(null); // Tiket yang sedang dilihat detailnya
  const [modalStatus, setModalStatus] = useState<string>(''); // Status sementara di modal detail

  const handleSelectTicket = async (ticket: ITicket) => {
    setSelectedTicket(ticket);
    setTicketLogs([]);
    try {
      const [photoRes, logsRes] = await Promise.all([
        fetch(`/api/tickets/${ticket.id}/photo`),
        fetch(`/api/tickets/${ticket.id}/logs`)
      ]);
      
      const photoData = await photoRes.json();
      if (photoData.photo) {
        setSelectedTicket(prev => prev && prev.id === ticket.id ? { ...prev, photo: photoData.photo } : prev);
      }

      const logsData = await logsRes.json();
      if (Array.isArray(logsData)) {
        setTicketLogs(logsData);
      }
    } catch (err) {
      console.error('Failed to fetch ticket details:', err);
    }
  };
  const [loading, setLoading] = useState(true); // Loading state untuk fetch data awal
  const [adminUser, setAdminUser] = useState<any>(null); // Data login admin
  const [showForm, setShowForm] = useState(false); // Toggle modal buat tiket baru
  const [showLogin, setShowLogin] = useState(false); // Toggle modal login admin
  const [showSettings, setShowSettings] = useState(false); // Toggle modal pengaturan aplikasi
  const [showResetConfirm, setShowResetConfirm] = useState(false); // Toggle konfirmasi reset data
  const [showTakeoverConfirm, setShowTakeoverConfirm] = useState<{id: number, type: 'takeover' | 'reassign', targetUser?: string} | null>(null);
  const [pendingUpdate, setPendingUpdate] = useState<{id: number, status: string, assigned_to: string | null, admin_reply: string | null, internal_notes: string | null} | null>(null); // Data update yang menunggu konfirmasi
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
    admin_theme_mode: 'light', // 'light' or 'dark'
    admin_primary_color: '#8b5cf6', // violet-500
    custom_logo: '',
    custom_favicon: '',
    notification_emails: [] as string[],
    telegram_bot_token: '',
    telegram_chat_ids: [] as string[]
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
  const lastTicketIdRef = useRef<number | null>(null);

  /**
   * Menghitung tiket yang difilter
   */
  const filteredTickets = useMemo(() => {
    return tickets.filter(ticket => {
      // View Mode Filter (Today vs All)
      if (viewMode === 'today') {
        const ticketDate = new Date(ticket.created_at).toLocaleDateString('en-CA'); // YYYY-MM-DD
        const today = new Date().toLocaleDateString('en-CA');
        if (ticketDate !== today) return false;
      }

      const matchDept = filterDept ? ticket.department === filterDept : true;
      const matchStatus = filterStatus ? ticket.status === filterStatus : true;
      const matchDate = filterDate ? new Date(ticket.created_at).toLocaleDateString('en-CA') === filterDate : true;
      return matchDept && matchStatus && matchDate;
    });
  }, [tickets, viewMode, filterDept, filterStatus, filterDate]);

  const getSLAColor = (createdAt: string, status: string) => {
    if (status !== 'New') return '';
    const created = new Date(createdAt).getTime();
    const now = new Date().getTime();
    const diffHours = (now - created) / (1000 * 60 * 60);

    if (diffHours > 5) return 'bg-rose-500/10 border-rose-500/20 text-rose-600 animate-pulse';
    if (diffHours > 2) return 'bg-amber-500/10 border-amber-500/20 text-amber-600';
    return '';
  };

  const getSLALabel = (createdAt: string, status: string) => {
    if (status !== 'New') return null;
    const created = new Date(createdAt).getTime();
    const now = new Date().getTime();
    const diffHours = (now - created) / (1000 * 60 * 60);

    if (diffHours > 5) return 'CRITICAL (>5h)';
    if (diffHours > 2) return 'DELAYED (>2h)';
    return null;
  };

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

  const handleCustomLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Resize to max 200px height for logo
        const maxH = 200;
        let width = img.width;
        let height = img.height;
        if (height > maxH) {
          width *= maxH / height;
          height = maxH;
        }
        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);

        const base64 = canvas.toDataURL('image/png');
        setAppSettings(prev => ({ ...prev, custom_logo: base64 }));
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleCustomFaviconUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Resize to 32x32 for favicon
        canvas.width = 32;
        canvas.height = 32;
        ctx.drawImage(img, 0, 0, 32, 32);

        const base64 = canvas.toDataURL('image/x-icon');
        setAppSettings(prev => ({ ...prev, custom_favicon: base64 }));
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

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
  const fetchTickets = async (showLoading = false) => {
    if (showLoading) setLoading(true);
    try {
      const url = adminUser 
        ? `/api/tickets?username=${adminUser.username}&role=${adminUser.role}`
        : '/api/tickets';
      const res = await fetch(url);
      const data = await res.json();
      if (Array.isArray(data)) {
        // Notification logic for Admin
        if (adminUser && lastTicketIdRef.current !== null && data.length > 0) {
          const newTickets = data.filter(t => t.id > lastTicketIdRef.current!);
          if (newTickets.length > 0) {
            newTickets.forEach(ticket => {
              if (Notification.permission === "granted") {
                try {
                  new Notification(`Tiket Baru: ${ticket.ticket_no}`, {
                    body: `${ticket.name} - ${ticket.category}\n${ticket.description}`,
                    icon: "https://cdn-icons-png.flaticon.com/512/2906/2906274.png",
                    badge: "https://cdn-icons-png.flaticon.com/512/2906/2906274.png"
                  });
                } catch (e) {
                  console.error('Notification error:', e);
                }
              }
            });
          }
        }

        // Update last seen ID
        if (data.length > 0) {
          const maxId = Math.max(...data.map(t => t.id));
          if (lastTicketIdRef.current === null || maxId > lastTicketIdRef.current) {
            lastTicketIdRef.current = maxId;
          }
        } else if (lastTicketIdRef.current === null) {
          lastTicketIdRef.current = 0;
        }

        setTickets(data);
      } else {
        console.error('API returned non-array data:', data);
        setTickets([]);
      }
    } catch (err) {
      console.error('Failed to fetch tickets:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchManagementData = async () => {
    try {
      console.log('Fetching management data...');
      const [itRes, deptRes, catRes, usersRes] = await Promise.all([
        fetch('/api/it-personnel'),
        fetch('/api/departments'),
        fetch('/api/categories'),
        fetch('/api/users')
      ]);
      
      if (!itRes.ok || !deptRes.ok || !catRes.ok || !usersRes.ok) {
        throw new Error('Gagal mengambil data manajemen');
      }

      const its = await itRes.json();
      const depts = await deptRes.json();
      const cats = await catRes.json();
      const usersData = await usersRes.json();
      
      console.log('Management data fetched:', { its, depts, cats, usersData });
      
      setItPersonnel(its);
      setDepartments(depts);
      setCategories(cats);
      setUsers(usersData);
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
          admin_theme_mode: data.admin_theme_mode || 'dark',
          admin_primary_color: data.admin_primary_color || '#6366f1',
          notification_emails: data.notification_emails ? JSON.parse(data.notification_emails) : [],
          telegram_bot_token: data.telegram_bot_token || '',
          telegram_chat_ids: data.telegram_chat_ids ? JSON.parse(data.telegram_chat_ids) : []
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
    const savedAdmin = localStorage.getItem('adminUser');
    if (savedAdmin) setAdminUser(JSON.parse(savedAdmin));
  }, []);

  useEffect(() => {
    fetchTickets();
    fetchSettings();
    fetchManagementData();
    const interval = setInterval(fetchTickets, 10000);
    return () => clearInterval(interval);
  }, [adminUser]);

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
        
        // Request Notification Permission
        if ("Notification" in window && Notification.permission === "default") {
          Notification.requestPermission();
        }
        
        // Re-fetch tickets with user context
        const url = `/api/tickets?username=${data.user.username}&role=${data.user.role}`;
        const ticketRes = await fetch(url);
        const ticketData = await ticketRes.json();
        setTickets(ticketData);
      } else {
        alert('Login failed: ' + data.error);
      }
    } catch (err) {
      alert('Login error');
    }
  };

  const executeIntervention = async (ticketId: number, type: 'takeover' | 'reassign', targetUser?: string) => {
    if (!adminUser || adminUser.role !== 'Super Admin') return;
    
    try {
      const body: any = {};
      if (type === 'takeover') body.takeover_by = adminUser.username;
      if (type === 'reassign') body.reassign_to = targetUser;
      body.performed_by = adminUser.username;

      const res = await fetch(`/api/tickets/${ticketId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      
      if (res.ok) {
        fetchTickets();
        if (selectedTicket && selectedTicket.id === ticketId) {
          setSelectedTicket(null);
        }
        setShowTakeoverConfirm(null);
      }
    } catch (err) {
      alert('Intervention failed');
    }
  };

  const handleIntervention = (ticketId: number, type: 'takeover' | 'reassign', targetUser?: string) => {
    setShowTakeoverConfirm({ id: ticketId, type, targetUser });
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
          notification_emails: JSON.stringify(appSettings.notification_emails),
          telegram_chat_ids: JSON.stringify(appSettings.telegram_chat_ids)
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
  const handleUpdateClick = (id: number, status: string, assigned_to: string | null, admin_reply: string | null, internal_notes: string | null) => {
    if (!assigned_to) {
      alert('Silakan pilih IT yang menangani terlebih dahulu.');
      return;
    }
    setPendingUpdate({ id, status, assigned_to, admin_reply, internal_notes });
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
          admin_reply: pendingUpdate.admin_reply,
          internal_notes: pendingUpdate.internal_notes,
          performed_by: adminUser.username
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

  const updateTicket = async (id: number, status: string, assigned_to: string | null, admin_reply: string | null, internal_notes: string | null) => {
    // This is now handled by handleUpdateClick and confirmUpdate
    handleUpdateClick(id, status, assigned_to, admin_reply, internal_notes);
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
      case 'New': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'In Progress': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Completed': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'Cancelled': return 'bg-rose-100 text-rose-700 border-rose-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  /**
   * Mendapatkan icon berdasarkan status tiket
   */
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'New': return <Clock className="w-4 h-4" />;
      case 'In Progress': return <RefreshCcw className="w-4 h-4 animate-spin-slow" />;
      case 'Completed': return <CheckCircle2 className="w-4 h-4" />;
      case 'Cancelled': return <AlertCircle className="w-4 h-4" />;
      default: return null;
    }
  };

  // Update favicon when appSettings.custom_favicon changes
  useEffect(() => {
    if (appSettings.custom_favicon) {
      let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.getElementsByTagName('head')[0].appendChild(link);
      }
      link.href = appSettings.custom_favicon;
    }
  }, [appSettings.custom_favicon]);

  const CurrentLogo = LOGO_OPTIONS.find(l => l.id === appSettings.logo_type)?.icon || ShieldCheck;
  
  // Dynamic theme based on user role
  const isDark = adminUser ? appSettings.admin_theme_mode === 'dark' : appSettings.theme_mode === 'dark';
  const primaryColor = adminUser ? appSettings.admin_primary_color : appSettings.primary_color;

  // Theme-aware color variables
  const themeClasses = {
    bg: adminUser 
      ? (isDark ? 'bg-zinc-950 text-zinc-100' : 'bg-zinc-50 text-zinc-900')
      : (isDark ? 'bg-slate-950 text-slate-100' : 'bg-[#F8FAFC] text-slate-900'),
    header: adminUser
      ? (isDark ? 'bg-zinc-900/80 border-zinc-800' : 'bg-zinc-100/80 border-zinc-200')
      : (isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white/80 border-slate-200'),
    card: adminUser
      ? (isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200')
      : (isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'),
    text: adminUser
      ? (isDark ? 'text-zinc-100' : 'text-zinc-900')
      : (isDark ? 'text-slate-100' : 'text-slate-900'),
    textMuted: adminUser
      ? (isDark ? 'text-zinc-400' : 'text-zinc-500')
      : (isDark ? 'text-slate-400' : 'text-slate-500'),
    border: adminUser
      ? (isDark ? 'border-zinc-800' : 'border-zinc-200')
      : (isDark ? 'border-slate-800' : 'border-slate-200'),
    bgSecondary: adminUser
      ? (isDark ? 'bg-zinc-800' : 'bg-zinc-100')
      : (isDark ? 'bg-slate-800' : 'bg-slate-100'),
    input: adminUser
      ? (isDark ? 'bg-zinc-800 border-zinc-700 text-zinc-200 hover:bg-zinc-750' : 'bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50')
      : (isDark ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-750' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'),
    selection: adminUser ? 'selection:bg-violet-500/30' : 'selection:bg-emerald-500/30'
  };

  return (
    <div className={`min-h-screen font-sans transition-colors duration-300 ${themeClasses.bg} ${themeClasses.selection}`} style={{ '--primary': primaryColor } as any}>
      {/* --- HEADER SECTION --- */}
      <header className={`sticky top-0 z-40 w-full border-b backdrop-blur-md transition-colors ${themeClasses.header}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div 
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shadow-lg transition-all shrink-0"
              style={{ backgroundColor: primaryColor, boxShadow: `0 10px 15px -3px ${primaryColor}40` }}
            >
              {appSettings.custom_logo ? (
                <img src={appSettings.custom_logo} alt="Logo" className="w-6 h-6 sm:w-7 sm:h-7 object-contain" referrerPolicy="no-referrer" />
              ) : (
                <CurrentLogo className="text-white w-5 h-5 sm:w-6 sm:h-6" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h1 className={`text-sm sm:text-lg font-bold tracking-tight leading-tight truncate whitespace-nowrap ${isDark ? 'text-white' : 'text-slate-900'}`}>{appSettings.app_name}</h1>
              <p className="hidden sm:block text-[10px] sm:text-xs font-medium text-slate-500 mt-0.5">Enterprise Support System</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-4 shrink-0">
            {adminUser && (
              <div className="hidden lg:flex flex-col items-end mr-2">
                <p className={`text-[10px] font-black leading-none ${isDark ? 'text-white' : 'text-slate-900'}`}>{adminUser.full_name}</p>
                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{adminUser.role}</p>
              </div>
            )}
            {adminUser ? (
              <div className="flex items-center gap-1 sm:gap-3">
                {adminUser.role === 'Super Admin' && (
                  <>
                    <button 
                      onClick={() => setShowSettings(true)}
                      className={`p-1.5 sm:p-2 rounded-lg transition-all ${isDark ? 'text-slate-400 hover:bg-slate-800' : 'text-slate-500 hover:bg-slate-100'}`}
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
                  </>
                )}
                <button 
                  onClick={handleLogout}
                  className={`flex items-center gap-2 px-2 sm:px-3 py-1.5 rounded-lg text-[10px] sm:text-xs font-semibold transition-all relative ${isDark ? 'text-slate-400 hover:bg-slate-800' : 'text-slate-500 hover:bg-slate-100'}`}
                >
                  <LogOut className="w-3.5 h-3.5 sm:w-4 h-4" />
                  <span className="hidden md:inline">Logout</span>
                  {tickets.filter(t => t.status === 'New').length > 0 && (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white animate-pulse" />
                  )}
                </button>
              </div>
            ) : (
              <button 
                onClick={() => setShowLogin(true)}
                className={`flex items-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-lg text-[10px] sm:text-xs font-semibold transition-all ${isDark ? 'text-slate-400 hover:bg-slate-800' : 'text-slate-500 hover:bg-slate-100'}`}
              >
                <LogIn className="w-3.5 h-3.5 sm:w-4 h-4" />
                <span className="hidden xs:inline">Login</span>
              </button>
            )}
            <button 
              onClick={() => setShowForm(true)}
              style={{ backgroundColor: primaryColor, boxShadow: `0 10px 15px -3px ${primaryColor}40` }}
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
                className={`${themeClasses.card} rounded-3xl border p-4 sm:p-6 shadow-sm overflow-hidden relative`}
              >
                <div className="absolute top-0 right-0 p-6 opacity-5">
                  <Bell className={`w-24 h-24 ${isDark ? 'text-white' : 'text-slate-900'}`} />
                </div>
                <div className="flex items-center justify-between mb-4 sm:mb-6">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center border ${isDark ? 'bg-rose-900/30 text-rose-400 border-rose-800' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
                      <Bell className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className={`text-sm font-bold uppercase tracking-wider ${isDark ? 'text-white' : 'text-slate-900'}`}>Smart Notifications</h2>
                      <p className="text-[10px] text-slate-400 font-medium">Real-time system alerts</p>
                    </div>
                  </div>
                  {/* Notification Permission Toggle */}
                  {typeof window !== 'undefined' && "Notification" in window && Notification.permission !== "granted" && (
                    <button 
                      onClick={() => Notification.requestPermission().then(() => fetchTickets())}
                      className="p-2 rounded-lg bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 transition-all group"
                      title="Aktifkan Notifikasi Browser"
                    >
                      <Bell className="w-4 h-4 animate-bounce group-hover:animate-none" />
                    </button>
                  )}
                </div>
                
                <div className="space-y-3">
                  {tickets.filter(t => t.status === 'New').length > 0 ? (
                    <div className="p-4 bg-rose-50/50 rounded-2xl border border-rose-100 group hover:bg-rose-50 transition-all">
                      <div className="flex items-center justify-between mb-2">
                        <span className="flex items-center gap-1.5 text-[10px] font-bold text-rose-600 uppercase tracking-widest">
                          <AlertCircle className="w-3 h-3" /> Action Required
                        </span>
                        <span className="px-2 py-0.5 bg-rose-600 text-white text-[10px] font-bold rounded-full animate-pulse shadow-sm shadow-rose-200">
                          {tickets.filter(t => t.status === 'New').length}
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
                    const today = new Date().toLocaleDateString('en-CA');
                    const newToday = tickets.filter(t => new Date(t.created_at).toLocaleDateString('en-CA') === today).length;
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
            <section className={`${themeClasses.card} rounded-3xl border p-4 sm:p-6 shadow-sm`}>
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <h2 className={`text-sm font-bold tracking-wider ${themeClasses.text}`}>Status Antrian</h2>
                <BarChart3 className="w-4 h-4 text-slate-300" />
              </div>
              <div className="flex flex-wrap gap-2 sm:gap-4 justify-start">
                <div className={`w-16 h-16 sm:w-24 sm:h-24 rounded-2xl border transition-all ${themeClasses.bgSecondary} ${themeClasses.border} hover:opacity-80 flex flex-col items-center justify-center text-center shadow-sm`}>
                  <p className={`text-sm sm:text-xl font-black leading-none mb-0.5 sm:mb-1 ${themeClasses.text}`}>{filteredTickets.length}</p>
                  <p className={`text-[7px] sm:text-[9px] font-bold ${themeClasses.textMuted} tracking-wide`}>Total</p>
                </div>
                <div className={`w-16 h-16 sm:w-24 sm:h-24 rounded-2xl border transition-all ${isDark ? 'bg-amber-900/20 border-amber-900/30 hover:border-amber-900/50' : 'bg-amber-50 border-amber-100 hover:border-amber-200'} flex flex-col items-center justify-center text-center shadow-sm`}>
                  <p className={`text-sm sm:text-xl font-black leading-none mb-0.5 sm:mb-1 ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
                    {filteredTickets.filter(t => t.status === 'New').length}
                  </p>
                  <p className={`text-[7px] sm:text-[9px] font-bold tracking-wide ${isDark ? 'text-amber-500/70' : 'text-amber-500'}`}>Wait</p>
                </div>
                <div className={`w-16 h-16 sm:w-24 sm:h-24 rounded-2xl border transition-all ${isDark ? 'bg-blue-900/20 border-blue-900/30 hover:border-blue-900/50' : 'bg-blue-50 border-blue-100 hover:border-blue-200'} flex flex-col items-center justify-center text-center shadow-sm`}>
                  <p className={`text-sm sm:text-xl font-black leading-none mb-0.5 sm:mb-1 ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                    {filteredTickets.filter(t => t.status === 'In Progress').length}
                  </p>
                  <p className={`text-[7px] sm:text-[9px] font-bold tracking-wide ${isDark ? 'text-blue-500/70' : 'text-blue-500'}`}>Active</p>
                </div>
                <div className={`w-16 h-16 sm:w-24 sm:h-24 rounded-2xl border transition-all ${isDark ? 'bg-emerald-900/20 border-emerald-900/30 hover:border-emerald-900/50' : 'bg-emerald-50 border-emerald-100 hover:border-emerald-200'} flex flex-col items-center justify-center text-center shadow-sm`}>
                  <p className={`text-sm sm:text-xl font-black leading-none mb-0.5 sm:mb-1 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                    {filteredTickets.filter(t => t.status === 'Completed').length}
                  </p>
                  <p className={`text-[7px] sm:text-[9px] font-bold tracking-wide ${isDark ? 'text-emerald-500/70' : 'text-emerald-500'}`}>Done</p>
                </div>
              </div>
            </section>

            {/* Issue Distribution (Pie Chart) */}
            {adminUser && categoryStats.length > 0 && (
              <motion.section 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`${themeClasses.card} rounded-3xl border p-4 sm:p-6 shadow-sm`}
              >
                <h2 className={`text-sm font-bold uppercase tracking-wider mb-4 sm:mb-6 ${themeClasses.text}`}>Distribusi Masalah</h2>
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
                        contentStyle={{ 
                          borderRadius: '16px', 
                          border: 'none', 
                          boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', 
                          fontSize: '12px', 
                          fontWeight: 'bold',
                          backgroundColor: isDark ? '#1e293b' : '#ffffff',
                          color: isDark ? '#ffffff' : '#000000'
                        }}
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
              style={{ backgroundColor: primaryColor, boxShadow: `0 20px 25px -5px ${primaryColor}30` }}
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
                  isDark ? 'bg-slate-900 text-white hover:bg-slate-800' : 'bg-white text-slate-900 hover:bg-slate-50'
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
                  className={`relative pb-2 text-[12px] sm:text-sm font-bold transition-all ${
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
                  className={`relative pb-2 text-[12px] sm:text-sm font-bold transition-all ${
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
                  onClick={() => fetchTickets(true)}
                  className="p-2 text-slate-400 hover:text-emerald-600 transition-colors"
                  title="Segarkan Antrian"
                >
                  <RefreshCcw className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Filters - Hidden on mobile, replaced by modal */}
            <div className={`hidden sm:flex flex-col sm:flex-row gap-2 sm:gap-3 mb-6 p-2 sm:p-4 rounded-2xl border shadow-sm transition-colors ${themeClasses.card}`}>
              <div className="flex-1 relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <select 
                  value={filterDept}
                  onChange={(e) => setFilterDept(e.target.value)}
                  className={`w-full border rounded-xl py-2 pl-8 pr-4 text-[10px] sm:text-xs font-bold outline-none appearance-none cursor-pointer transition-all ${themeClasses.input}`}
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
                  className={`w-full border rounded-xl py-2 pl-8 pr-4 text-[10px] sm:text-xs font-bold outline-none appearance-none cursor-pointer transition-all ${themeClasses.input}`}
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
                  className={`w-full border rounded-xl py-2 pl-8 pr-4 text-[10px] sm:text-xs font-bold outline-none cursor-pointer transition-all ${themeClasses.input}`}
                />
              </div>
            </div>

            {loading ? (
              <div className={`flex flex-col items-center justify-center py-20 rounded-2xl border border-dashed ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                <RefreshCcw className="w-8 h-8 text-emerald-600 animate-spin mb-4" />
                <p className="text-slate-500 font-medium">Loading queue...</p>
              </div>
            ) : tickets.length === 0 ? (
              <div className={`flex flex-col items-center justify-center py-20 rounded-2xl border border-dashed ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
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
                  {filteredTickets.length === 0 ? (
                    <motion.div 
                      key="no-match"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className={`flex flex-col items-center justify-center py-20 rounded-2xl border border-dashed ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}
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
                        Reset filters
                      </button>
                    </motion.div>
                  ) : (
                    <motion.div 
                      key={viewMode}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      className="flex flex-col gap-3"
                    >
                      {filteredTickets.map((ticket) => (
                          <motion.div
                            key={ticket.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className={`${themeClasses.card} rounded-2xl p-3 shadow-sm hover:shadow-md transition-all group cursor-pointer relative overflow-hidden flex flex-col sm:flex-row sm:items-center sm:justify-between ${
                              getSLAColor(ticket.created_at, ticket.status) || (isDark ? 'hover:border-emerald-900' : 'hover:border-emerald-100')
                            }`}
                            onClick={() => handleSelectTicket(ticket)}
                          >
                            <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                            
                            <div className="flex items-start gap-3 min-w-0 sm:w-1/2">
                              <div className="flex-shrink-0">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${
                                  ticket.status === 'Completed' ? 'bg-emerald-50 border-emerald-100 text-emerald-600' :
                                  ticket.status === 'New' ? 'bg-amber-50 border-amber-100 text-amber-600' :
                                  'bg-blue-50 border-blue-100 text-blue-600'
                                }`}>
                                  {getStatusIcon(ticket.status)}
                                </div>
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center justify-between gap-2 mb-0.5">
                                  <div className="flex items-center gap-2">
                                    <span className="text-[9px] font-black text-slate-400 tracking-tighter">#{ticket.ticket_no || ticket.id.toString().padStart(4, '0')}</span>
                                    {adminUser?.role === 'Super Admin' && ticket.assigned_to && (
                                      <span className="text-[8px] font-black bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded uppercase">[{ticket.assigned_to}]</span>
                                    )}
                                    {getSLALabel(ticket.created_at, ticket.status) && (
                                      <span className="text-[8px] font-black px-1.5 py-0.5 rounded uppercase bg-rose-500 text-white">{getSLALabel(ticket.created_at, ticket.status)}</span>
                                    )}
                                  </div>
                                </div>
                                <h3 className="text-xs font-black text-slate-900 truncate group-hover:text-emerald-600 transition-colors mb-1.5">
                                  {ticket.category} Request
                                </h3>
                                
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-2 gap-y-1 text-[10px] text-slate-500 font-medium">
                                  <span className="flex items-center gap-1 truncate">
                                    <User className="w-2.5 h-2.5 text-slate-400 shrink-0" /> {ticket.name}
                                  </span>
                                  <div className="flex items-center gap-2">
                                    <span className="flex items-center gap-1 truncate">
                                      <Building2 className="w-2.5 h-2.5 text-slate-400 shrink-0" /> {ticket.department}
                                    </span>
                                    <span className={`sm:hidden px-1.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border ${getStatusColor(ticket.status)}`}>
                                      {ticket.status}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div className="mt-2 sm:mt-0 pt-2 sm:pt-0 border-t sm:border-t-0 sm:border-l border-slate-50 sm:pl-4 flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 sm:w-1/3">
                              <div className="flex flex-col items-start sm:items-end gap-1">
                                <span className={`hidden sm:inline-block px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${getStatusColor(ticket.status)}`}>
                                  {ticket.status}
                                </span>
                                <span className="flex items-center gap-1 text-[9px] text-slate-400">
                                  <Calendar className="w-2.5 h-2.5 shrink-0" /> {formatDate(ticket.created_at)}
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                {adminUser?.role === 'Super Admin' && (
                                  <div className="flex items-center gap-1">
                                    <button 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleIntervention(ticket.id, 'takeover');
                                      }}
                                      className="px-2 py-1 bg-emerald-500 text-white text-[8px] font-black uppercase rounded hover:bg-emerald-600"
                                    >
                                      Ambil Alih
                                    </button>
                                    <button 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        const target = prompt('Pindahkan ke siapa? (bayu/dita/yudha)');
                                        if (target) handleIntervention(ticket.id, 'reassign', target);
                                      }}
                                      className="px-2 py-1 bg-blue-500 text-white text-[8px] font-black uppercase rounded hover:bg-blue-600"
                                    >
                                      Pindahkan
                                    </button>
                                  </div>
                                )}
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleSelectTicket(ticket);
                                  }}
                                  className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-md transition-all border border-transparent hover:border-emerald-100"
                                  title="View Details"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                                {adminUser && (
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteTicket(ticket.id);
                                    }}
                                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-all border border-transparent hover:border-rose-100"
                                    title="Delete Ticket"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* Help CTA - Visible on mobile at the bottom */}
            <section 
              className="lg:hidden rounded-3xl p-5 sm:p-6 text-white shadow-xl relative overflow-hidden group transition-all mt-6 sm:mt-8"
              style={{ backgroundColor: primaryColor, boxShadow: `0 20px 25px -5px ${primaryColor}30` }}
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
                  isDark ? 'bg-slate-900 text-white hover:bg-slate-800' : 'bg-white text-slate-900 hover:bg-slate-50'
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
              className={`relative rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] sm:max-h-[92vh] transition-colors ${themeClasses.card} ${themeClasses.text}`}
            >
              <div className={`p-3 sm:p-5 border-b shrink-0 ${themeClasses.border}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="w-7 h-7 sm:w-9 sm:h-9 bg-emerald-100 rounded-lg sm:rounded-xl flex items-center justify-center text-emerald-600">
                      <Ticket className="w-3.5 h-3.5 sm:w-4.5 h-4.5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <span className={`text-[8px] sm:text-[9px] font-bold ${themeClasses.textMuted}`}>#{selectedTicket.ticket_no || selectedTicket.id.toString().padStart(4, '0')}</span>
                        <span className={`px-1.5 py-0.5 rounded-full text-[7px] sm:text-[8px] font-bold uppercase tracking-wider border ${getStatusColor(selectedTicket.status)}`}>
                          {selectedTicket.status}
                        </span>
                      </div>
                      <h2 className={`text-xs sm:text-base font-black tracking-tight ${themeClasses.text}`}>{selectedTicket.category} Request</h2>
                    </div>
                  </div>
                  <button 
                    onClick={() => setSelectedTicket(null)}
                    className={`p-1.5 rounded-full transition-all ${isDark ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'}`}
                  >
                    <X className="w-4 h-4 sm:w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="p-3 sm:p-5 overflow-y-auto custom-scrollbar">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-5">
                  {/* Left Column: Info & Description */}
                  <div className="lg:col-span-7 space-y-3 sm:space-y-5">
                    <div className="grid grid-cols-2 gap-2 sm:gap-2.5">
                      <div className={`p-1.5 sm:p-2.5 rounded-xl border flex items-center gap-2 ${themeClasses.bgSecondary} ${themeClasses.border}`}>
                        <User className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-400 shrink-0" />
                        <div className="min-w-0">
                          <p className={`text-[6px] sm:text-[7px] font-bold ${themeClasses.textMuted} uppercase tracking-widest truncate`}>Pengguna</p>
                          <p className={`text-[9px] sm:text-[11px] font-bold ${themeClasses.text} truncate`}>{selectedTicket.name}</p>
                        </div>
                      </div>
                      <div className={`p-1.5 sm:p-2.5 rounded-xl border flex items-center gap-2 ${themeClasses.bgSecondary} ${themeClasses.border}`}>
                        <Building2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-400 shrink-0" />
                        <div className="min-w-0">
                          <p className={`text-[6px] sm:text-[7px] font-bold ${themeClasses.textMuted} uppercase tracking-widest truncate`}>Bagian</p>
                          <p className={`text-[9px] sm:text-[11px] font-bold ${themeClasses.text} truncate`}>{selectedTicket.department}</p>
                        </div>
                      </div>
                      <div className={`p-1.5 sm:p-2.5 rounded-xl border flex items-center gap-2 ${themeClasses.bgSecondary} ${themeClasses.border}`}>
                        <Phone className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-400 shrink-0" />
                        <div className="min-w-0">
                          <p className={`text-[6px] sm:text-[7px] font-bold ${themeClasses.textMuted} uppercase tracking-widest truncate`}>Telepon</p>
                          <p className={`text-[9px] sm:text-[11px] font-bold ${themeClasses.text} truncate`}>{selectedTicket.phone}</p>
                        </div>
                      </div>
                      <div className={`p-1.5 sm:p-2.5 rounded-xl border flex items-center gap-2 ${themeClasses.bgSecondary} ${themeClasses.border}`}>
                        <Layers className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-400 shrink-0" />
                        <div className="min-w-0">
                          <p className={`text-[6px] sm:text-[7px] font-bold ${themeClasses.textMuted} uppercase tracking-widest truncate`}>Kategori</p>
                          <p className={`text-[9px] sm:text-[11px] font-bold ${themeClasses.text} truncate`}>{selectedTicket.category}</p>
                        </div>
                      </div>
                    </div>

                    <div className={`p-2.5 sm:p-3.5 rounded-2xl border ${themeClasses.bgSecondary} ${themeClasses.border}`}>
                      <div className="flex items-center gap-2 text-slate-400 mb-1 sm:mb-1.5">
                        <MessageSquare className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                        <span className="text-[8px] sm:text-[9px] font-bold uppercase tracking-wider">Masalah / Detail</span>
                      </div>
                      <p className={`text-[11px] sm:text-xs whitespace-pre-wrap leading-relaxed ${themeClasses.text}`}>
                        {selectedTicket.description}
                      </p>
                    </div>

                    {adminUser && (
                      <div className={`p-2.5 sm:p-3.5 rounded-2xl border ${themeClasses.bgSecondary} ${themeClasses.border}`}>
                        <div className="flex items-center gap-2 text-slate-400 mb-1.5 sm:mb-2">
                          <ShieldCheck className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                          <span className="text-[8px] sm:text-[9px] font-bold uppercase tracking-wider">Audit Log</span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                          <div>
                            <p className={`text-[6px] sm:text-[7px] font-bold ${themeClasses.textMuted} uppercase tracking-widest`}>IP</p>
                            <p className={`text-[8px] sm:text-[9px] font-mono font-bold ${themeClasses.text}`}>
                              {selectedTicket.ip_address || 'Unknown'}
                            </p>
                          </div>
                          <div>
                            <p className={`text-[6px] sm:text-[7px] font-bold ${themeClasses.textMuted} uppercase tracking-widest`}>Device</p>
                            <p className={`text-[8px] sm:text-[9px] font-mono font-bold ${themeClasses.text} truncate`}>
                              {getDeviceInfo(selectedTicket.user_agent || '')}
                            </p>
                          </div>
                          <div className="col-span-2 sm:col-span-1">
                            <p className="text-[6px] sm:text-[7px] font-bold text-slate-400 uppercase tracking-widest">GPS</p>
                            {selectedTicket.latitude ? (
                              <a 
                                href={`https://www.google.com/maps?q=${selectedTicket.latitude},${selectedTicket.longitude}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-[8px] sm:text-[9px] font-bold text-blue-500 hover:underline"
                              >
                                <MapPin className="w-2 h-2 sm:w-2.5 sm:h-2.5" />
                                {selectedTicket.latitude.toFixed(2)}, {selectedTicket.longitude?.toFixed(2)}
                              </a>
                            ) : (
                              <p className="text-[8px] sm:text-[9px] font-bold text-rose-500">No Data</p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {(selectedTicket.assigned_to || selectedTicket.admin_reply) && (
                      <div className="overflow-hidden rounded-2xl border border-emerald-200 bg-emerald-50/30">
                        <div className="bg-emerald-100/50 px-3 py-1 border-b border-emerald-200 flex items-center justify-between">
                          <div className="flex items-center gap-2 text-emerald-700">
                            <ShieldCheck className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                            <span className="text-[7px] sm:text-[8px] font-black uppercase tracking-widest">Tim Respon IT</span>
                          </div>
                        </div>
                        <div className="p-2.5 sm:p-3.5">
                          {selectedTicket.admin_reply ? (
                            <div className="space-y-1">
                              <p className="text-[11px] sm:text-xs text-emerald-900 leading-relaxed font-semibold italic">
                                "{selectedTicket.admin_reply}"
                              </p>
                              <p className="text-[7px] sm:text-[8px] text-emerald-600 font-black uppercase tracking-widest pt-1 border-t border-emerald-100">Balasan Resmi</p>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 text-emerald-600/70">
                              <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full border-2 border-emerald-200 border-t-emerald-600 animate-spin" />
                              <p className="text-[9px] sm:text-[11px] font-bold italic">Sedang ditangani oleh {selectedTicket.assigned_to || 'Tim IT'}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-3 gap-1 p-2 bg-white rounded-xl border border-slate-100">
                      <div className="flex flex-col">
                        <span className="text-[6px] sm:text-[7px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Diajukan</span>
                        <span className="text-[8px] sm:text-[9px] font-medium text-slate-600 truncate">{formatDate(selectedTicket.created_at)}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[6px] sm:text-[7px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Respon</span>
                        <span className="text-[8px] sm:text-[9px] font-medium text-slate-600 truncate">{selectedTicket.responded_at ? formatDate(selectedTicket.responded_at) : '-'}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[6px] sm:text-[7px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Selesai</span>
                        <span className="text-[8px] sm:text-[9px] font-medium text-slate-600 truncate">{selectedTicket.resolved_at ? formatDate(selectedTicket.resolved_at) : '-'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Photo & Admin Actions */}
                  <div className="lg:col-span-5 space-y-3 sm:space-y-5">
                    {selectedTicket.photo && (
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 text-slate-400">
                          <ImageIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                          <span className="text-[8px] sm:text-[9px] font-bold uppercase tracking-wider">Lampiran Foto</span>
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

                    {/* Ticket History / Logs */}
                    <div className="space-y-1.5 sm:space-y-2">
                      <div className="flex items-center gap-2 text-slate-400">
                        <History className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                        <span className="text-[8px] sm:text-[9px] font-bold uppercase tracking-wider">Riwayat Tiket</span>
                      </div>
                      <div className={`rounded-2xl border p-2.5 sm:p-3.5 space-y-2.5 sm:space-y-3.5 max-h-[180px] sm:max-h-[250px] overflow-y-auto custom-scrollbar ${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-100'}`}>
                        {ticketLogs.length === 0 ? (
                          <p className="text-[8px] sm:text-[9px] text-slate-400 italic text-center py-3">Belum ada riwayat aktivitas.</p>
                        ) : (
                          <div className="space-y-2.5 sm:space-y-3.5 relative before:absolute before:left-[6px] before:top-1.5 before:bottom-1.5 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-700">
                            {ticketLogs.map((log, idx) => (
                              <div key={idx} className="relative pl-4.5 sm:pl-5.5">
                                <div className={`absolute left-0 top-1 w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full border-2 border-white dark:border-slate-800 shadow-sm flex items-center justify-center ${
                                  log.action.includes('Status') ? 'bg-emerald-500' :
                                  log.action.includes('Tugaskan') ? 'bg-blue-500' :
                                  log.action.includes('Ambil Alih') ? 'bg-amber-500' :
                                  'bg-slate-400'
                                }`}>
                                  <div className="w-0.5 h-0.5 bg-white rounded-full" />
                                </div>
                                <div className="space-y-0.5">
                                  <div className="flex items-center justify-between gap-2">
                                    <p className={`text-[8px] sm:text-[9px] font-black ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>{log.action}</p>
                                    <span className="text-[6px] sm:text-[7px] font-bold text-slate-400 whitespace-nowrap">{formatDate(log.created_at)}</span>
                                  </div>
                                  <p className="text-[7px] sm:text-[8px] font-medium text-slate-500 leading-relaxed">
                                    Oleh: <span className="font-bold text-slate-600 dark:text-slate-400">{log.performed_by}</span>
                                  </p>
                                  {log.note && (
                                    <div className={`mt-0.5 p-1 sm:p-1.5 rounded-lg text-[7px] sm:text-[8px] font-medium italic leading-relaxed ${isDark ? 'bg-slate-900/50 text-slate-400' : 'bg-white text-slate-500'}`}>
                                      "{log.note}"
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {adminUser && (
                      <div className="bg-slate-900 rounded-2xl p-3.5 sm:p-4.5 shadow-xl space-y-2.5 sm:space-y-3.5">
                        <div className="flex items-center gap-2 text-white mb-0.5">
                          <Settings2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-400" />
                          <h3 className="text-[8px] sm:text-[9px] font-black uppercase tracking-widest">Tindakan Admin</h3>
                        </div>

                        <div className="grid grid-cols-1 gap-2.5 sm:gap-3.5">
                          {adminUser.role === 'Super Admin' && selectedTicket.assigned_to && selectedTicket.assigned_to !== adminUser.username && (
                            <button
                              onClick={() => handleIntervention(selectedTicket.id, 'takeover')}
                              className="w-full bg-amber-500 text-white font-black py-1.5 sm:py-2 rounded-xl hover:bg-amber-600 transition-all uppercase tracking-widest text-[7px] sm:text-[8px] shadow-lg shadow-amber-900/20 active:scale-[0.98]"
                            >
                              Ambil Alih Tiket
                            </button>
                          )}
                          <div className="space-y-0.5">
                            <label className="text-[7px] sm:text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Tugaskan IT</label>
                            {adminUser.role === 'Super Admin' ? (
                              <select 
                                id={`modal-assignee-${selectedTicket.id}`}
                                className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl py-1.5 sm:py-2 px-2.5 text-[9px] sm:text-[11px] outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-bold"
                                defaultValue={selectedTicket.assigned_to || ''}
                              >
                                <option value="">Pilih IT...</option>
                                {users.map(u => (
                                  <option key={u.id} value={u.username}>{u.full_name || u.username}</option>
                                ))}
                              </select>
                            ) : (
                              <div className="relative">
                                <input 
                                  id={`modal-assignee-${selectedTicket.id}`}
                                  type="text"
                                  readOnly
                                  className="w-full bg-slate-800 border border-slate-700 text-slate-300 rounded-xl py-1.5 sm:py-2 px-2.5 text-[9px] sm:text-[11px] outline-none font-bold"
                                  value={selectedTicket.assigned_to || adminUser.username}
                                />
                                <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
                                  <Lock className="w-2.5 h-2.5 text-slate-500" />
                                </div>
                              </div>
                            )}
                          </div>
                          <div className="space-y-0.5">
                            <label className="text-[7px] sm:text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Status</label>
                            <div className="flex gap-1 bg-slate-800 p-0.5 rounded-xl border border-slate-700 overflow-x-auto no-scrollbar">
                              {STATUSES.map(status => (
                                <button
                                  key={status}
                                  onClick={() => setModalStatus(status)}
                                  className={`flex-1 min-w-[50px] py-1 rounded-lg text-[6px] sm:text-[7px] font-black uppercase tracking-tighter transition-all ${
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

                        <div className="space-y-1">
                          <label className="text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Balasan Resolusi (Publik)</label>
                          <textarea 
                            id={`modal-reply-${selectedTicket.id}`}
                            className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl py-2.5 sm:py-3 px-3 sm:px-4 text-[10px] sm:text-xs outline-none focus:ring-2 focus:ring-emerald-500 resize-none transition-all font-medium placeholder:text-slate-600"
                            placeholder="Tulis solusi di sini..."
                            rows={2}
                            defaultValue={selectedTicket.admin_reply || ''}
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Catatan Internal (Private)</label>
                          <textarea 
                            id={`modal-internal-${selectedTicket.id}`}
                            className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl py-2.5 sm:py-3 px-3 sm:px-4 text-[10px] sm:text-xs outline-none focus:ring-2 focus:ring-blue-500 resize-none transition-all font-medium placeholder:text-slate-600"
                            placeholder="Catatan rahasia tim IT..."
                            rows={2}
                            defaultValue={selectedTicket.internal_notes || ''}
                          />
                        </div>

                        <button
                          onClick={() => {
                            const assignee = adminUser.role === 'Super Admin' 
                              ? (document.getElementById(`modal-assignee-${selectedTicket.id}`) as HTMLSelectElement).value 
                              : (selectedTicket.assigned_to || adminUser.username);
                            const reply = (document.getElementById(`modal-reply-${selectedTicket.id}`) as HTMLTextAreaElement).value;
                            const internal = (document.getElementById(`modal-internal-${selectedTicket.id}`) as HTMLTextAreaElement).value;
                            const status = modalStatus || selectedTicket.status;
                            handleUpdateClick(selectedTicket.id, status, assignee, reply, internal);
                            setSelectedTicket(null);
                            setModalStatus('');
                          }}
                          style={{ backgroundColor: primaryColor }}
                          className="w-full text-white font-black py-2.5 sm:py-3 rounded-xl hover:opacity-90 transition-all shadow-xl active:scale-[0.98] uppercase tracking-widest text-[9px] sm:text-[10px]"
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
              className={`relative w-full max-w-2xl rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[95vh] ${isDark ? 'bg-slate-900 border border-slate-800' : 'bg-white'}`}
            >
              <div className={`p-3 sm:p-4 border-b shrink-0 ${themeClasses.border}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className={`text-lg sm:text-2xl font-black tracking-tight ${themeClasses.text}`}>Tiket Baru</h2>
                    <p className={`text-[9px] sm:text-[10px] ${themeClasses.textMuted} mt-0.5 font-medium uppercase tracking-widest`}>Beri tahu kami masalah Anda</p>
                  </div>
                  <button 
                    onClick={() => setShowForm(false)}
                    className={`p-1.5 sm:p-2 rounded-xl transition-all border ${themeClasses.input}`}
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
                        <label className={`text-[9px] font-black uppercase tracking-widest ml-1 ${themeClasses.textMuted}`}>Nama Lengkap</label>
                        <div className="relative">
                          <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                          <input 
                            required
                            type="text"
                            placeholder="Nama Anda"
                            className={`w-full border rounded-xl py-2.5 pl-10 pr-4 text-xs font-bold focus:ring-2 focus:ring-emerald-500 outline-none transition-all ${themeClasses.input}`}
                            value={formData.name}
                            onChange={e => setFormData({...formData, name: e.target.value})}
                          />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className={`text-[9px] font-black uppercase tracking-widest ml-1 ${themeClasses.textMuted}`}>Nomor HP</label>
                        <div className="relative">
                          <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                          <input 
                            required
                            type="tel"
                            placeholder="0812..."
                            className={`w-full border rounded-xl py-2.5 pl-10 pr-4 text-xs font-bold focus:ring-2 focus:ring-emerald-500 outline-none transition-all ${themeClasses.input}`}
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
                      style={{ backgroundColor: !(submitting || photoLoading || gpsStatus !== 'success') ? primaryColor : undefined }}
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
              className={`relative w-full max-w-lg rounded-t-[2rem] sm:rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] ${themeClasses.card}`}
            >
              <div className={`p-6 border-b shrink-0 flex items-center justify-between ${themeClasses.border}`}>
                <div>
                  <h2 className={`text-xl font-black tracking-tight ${themeClasses.text}`}>Filter Antrian</h2>
                  <p className={`text-[10px] ${themeClasses.textMuted} mt-0.5 font-medium uppercase tracking-widest`}>Sesuaikan tampilan antrian</p>
                </div>
                <button 
                  onClick={() => setShowMobileFilter(false)}
                  className={`p-2 rounded-xl transition-all border ${themeClasses.input}`}
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
                        : isDark 
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
                          : isDark 
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
                        : isDark 
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
                          : isDark 
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
                        isDark 
                        ? 'bg-slate-800 border-slate-700 text-slate-200' 
                        : 'bg-slate-50 border-slate-100 text-slate-700'
                      }`}
                    />
                  </div>
                </div>
              </div>

              <div className={`p-6 border-t shrink-0 flex gap-3 ${
                isDark ? 'border-slate-800' : 'border-slate-100'
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
                    isDark ? 'bg-slate-800 text-slate-400 hover:bg-slate-750' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
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
                    isDark ? 'bg-emerald-500 shadow-emerald-900/40 hover:bg-emerald-400' : 'bg-emerald-600 shadow-emerald-900/20 hover:opacity-90'
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
              className={`relative w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden ${isDark ? 'bg-zinc-900 border border-zinc-800' : 'bg-white'}`}
            >
              <div className="p-10">
                <div className="flex flex-col items-center text-center mb-10">
                  <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center mb-4 shadow-xl ${isDark ? 'bg-zinc-800 text-white shadow-zinc-950' : 'bg-slate-900 text-white shadow-slate-200'}`}>
                    <Lock className="w-8 h-8" />
                  </div>
                  <h2 className={`text-2xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>Admin Portal</h2>
                  <p className={`text-sm mt-1 font-medium ${isDark ? 'text-zinc-400' : 'text-slate-400'}`}>Authorized personnel only</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-6">
                  {/* Quick Login for Prototype */}
                  <div className={`rounded-2xl p-4 border ${isDark ? 'bg-zinc-800/50 border-zinc-700' : 'bg-slate-50 border-slate-100'}`}>
                    <p className={`text-[10px] font-black uppercase tracking-widest mb-3 text-center ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>Quick Access (Prototype)</p>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { u: 'yudha', l: 'Yudha' },
                        { u: 'bayu', l: 'Bayu' },
                        { u: 'dita', l: 'Dita' }
                      ].map(acc => (
                        <button
                          key={acc.u}
                          type="button"
                          onClick={() => {
                            setLoginData({ username: acc.u, password: '' });
                          }}
                          className={`py-2 px-1 rounded-xl text-[10px] font-bold transition-all border ${
                            loginData.username === acc.u 
                            ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg shadow-emerald-200' 
                            : isDark ? 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-600' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-900 hover:text-slate-900'
                          }`}
                        >
                          {acc.l}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className={`text-[10px] font-black uppercase tracking-widest ml-1 ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>Username</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input 
                        required
                        type="text"
                        placeholder="Admin username"
                        className={`w-full border rounded-2xl py-4 pl-11 pr-4 text-sm font-bold focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all ${isDark ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-slate-50 border-slate-100 text-slate-700'}`}
                        value={loginData.username}
                        onChange={e => setLoginData({...loginData, username: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className={`text-[10px] font-black uppercase tracking-widest ml-1 ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>Password</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input 
                        required
                        type="password"
                        placeholder="••••••••"
                        className={`w-full border rounded-2xl py-4 pl-11 pr-4 text-sm font-bold focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all ${isDark ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-slate-50 border-slate-100 text-slate-700'}`}
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
              className={`relative w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] transition-colors ${themeClasses.card} ${themeClasses.text}`}
            >
              <div className={`p-6 border-b shrink-0 ${themeClasses.border}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className={`text-2xl font-bold ${themeClasses.text}`}>App Settings & Management</h2>
                    <p className={`text-sm ${themeClasses.textMuted} mt-1`}>Customize your helpdesk and manage data</p>
                  </div>
                  <button 
                    onClick={() => setShowSettings(false)}
                    className={`p-2 hover:bg-slate-100/10 rounded-full transition-colors ${themeClasses.text}`}
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
                        <label className={`text-xs font-bold ${themeClasses.textMuted} uppercase tracking-wider ml-1`}>Application Name</label>
                        <input 
                          required
                          type="text"
                          className={`w-full border rounded-xl py-3 px-4 text-sm outline-none transition-all ${themeClasses.input}`}
                          value={appSettings.app_name}
                          onChange={e => setAppSettings({...appSettings, app_name: e.target.value})}
                        />
                      </div>

                      {/* Custom Branding */}
                      <div className="col-span-full space-y-4 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                          <ImageIcon className="w-3 h-3" /> Custom Branding
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Custom Logo</label>
                            <div className="flex items-center gap-3">
                              {appSettings.custom_logo && (
                                <div className="h-10 w-10 rounded-lg border border-slate-200 bg-white p-1 flex items-center justify-center overflow-hidden">
                                  <img src={appSettings.custom_logo} alt="Preview" className="max-h-full max-w-full object-contain" referrerPolicy="no-referrer" />
                                </div>
                              )}
                              <label className="flex-1 cursor-pointer bg-white border border-slate-200 rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 transition-colors text-center">
                                Upload Logo
                                <input type="file" className="hidden" accept="image/*" onChange={handleCustomLogoUpload} />
                              </label>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Custom Favicon</label>
                            <div className="flex items-center gap-3">
                              {appSettings.custom_favicon && (
                                <div className="h-8 w-8 rounded border border-slate-200 bg-white p-1 flex items-center justify-center overflow-hidden">
                                  <img src={appSettings.custom_favicon} alt="Favicon" className="max-h-full max-w-full object-contain" referrerPolicy="no-referrer" />
                                </div>
                              )}
                              <label className="flex-1 cursor-pointer bg-white border border-slate-200 rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 transition-colors text-center">
                                Upload Favicon
                                <input type="file" className="hidden" accept="image/*" onChange={handleCustomFaviconUpload} />
                              </label>
                            </div>
                          </div>
                        </div>
                        {(appSettings.custom_logo || appSettings.custom_favicon) && (
                          <button 
                            type="button"
                            onClick={() => setAppSettings(prev => ({ ...prev, custom_logo: '', custom_favicon: '' }))}
                            className="text-[9px] text-rose-500 font-bold hover:underline uppercase tracking-widest"
                          >
                            Reset Custom Branding
                          </button>
                        )}
                      </div>
                      <div className="space-y-4">
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-emerald-500">Frontend Theme</h3>
                        <div className="space-y-1.5">
                          <label className={`text-xs font-bold ${themeClasses.textMuted} uppercase tracking-wider ml-1`}>Theme Mode</label>
                          <div className={`flex gap-2 p-1 rounded-xl border ${themeClasses.bgSecondary} ${themeClasses.border}`}>
                            <button
                              type="button"
                              onClick={() => setAppSettings({...appSettings, theme_mode: 'light'})}
                              className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                                appSettings.theme_mode === 'light' ? 'bg-white text-slate-900 shadow-sm' : `${themeClasses.textMuted} hover:${themeClasses.text}`
                              }`}
                            >
                              Light
                            </button>
                            <button
                              type="button"
                              onClick={() => setAppSettings({...appSettings, theme_mode: 'dark'})}
                              className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                                appSettings.theme_mode === 'dark' ? (isDark ? 'bg-slate-700 text-white shadow-sm' : 'bg-slate-800 text-white shadow-sm') : `${themeClasses.textMuted} hover:${themeClasses.text}`
                              }`}
                            >
                              Dark
                            </button>
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
                      </div>

                      <div className="space-y-4 pt-4 border-t border-slate-800">
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-indigo-500">Admin Theme</h3>
                        <div className="space-y-1.5">
                          <label className={`text-xs font-bold ${themeClasses.textMuted} uppercase tracking-wider ml-1`}>Admin Theme Mode</label>
                          <div className={`flex gap-2 p-1 rounded-xl border ${themeClasses.bgSecondary} ${themeClasses.border}`}>
                            <button
                              type="button"
                              onClick={() => setAppSettings({...appSettings, admin_theme_mode: 'light'})}
                              className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                                appSettings.admin_theme_mode === 'light' ? 'bg-white text-slate-900 shadow-sm' : `${themeClasses.textMuted} hover:${themeClasses.text}`
                              }`}
                            >
                              Light
                            </button>
                            <button
                              type="button"
                              onClick={() => setAppSettings({...appSettings, admin_theme_mode: 'dark'})}
                              className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                                appSettings.admin_theme_mode === 'dark' ? (isDark ? 'bg-slate-700 text-white shadow-sm' : 'bg-slate-800 text-white shadow-sm') : `${themeClasses.textMuted} hover:${themeClasses.text}`
                              }`}
                            >
                              Dark
                            </button>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <label className={`text-xs font-bold ${themeClasses.textMuted} uppercase tracking-wider ml-1`}>Admin Primary Color</label>
                          <div className="flex flex-wrap gap-3">
                            {['#6366f1', '#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#000000'].map(color => (
                              <button
                                key={color}
                                type="button"
                                onClick={() => setAppSettings({...appSettings, admin_primary_color: color})}
                                className={`w-10 h-10 rounded-full border-4 transition-all ${
                                  appSettings.admin_primary_color === color ? (isDark ? 'border-white scale-110 shadow-lg' : 'border-slate-900 scale-110 shadow-lg') : 'border-transparent opacity-60 hover:opacity-100'
                                }`}
                                style={{ backgroundColor: color }}
                              />
                            ))}
                          </div>
                        </div>
                      </div>

                    <div className="space-y-3">
                      <label className={`text-xs font-bold ${themeClasses.textMuted} uppercase tracking-wider ml-1`}>Pilih Logo</label>
                      <div className="grid grid-cols-5 gap-3">
                        {LOGO_OPTIONS.map(option => (
                          <button
                            key={option.id}
                            type="button"
                            onClick={() => setAppSettings({...appSettings, logo_type: option.id})}
                            className={`aspect-square rounded-xl flex items-center justify-center border-2 transition-all ${
                              appSettings.logo_type === option.id 
                              ? 'bg-emerald-500 border-emerald-500 text-white shadow-sm' 
                              : `${themeClasses.bgSecondary} ${themeClasses.border} ${themeClasses.textMuted} hover:${themeClasses.text}`
                            }`}
                          >
                            <option.icon className="w-6 h-6" />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <button 
                    type="submit"
                      style={{ backgroundColor: primaryColor }}
                      className="w-full hover:opacity-90 text-white font-bold py-4 rounded-2xl shadow-lg transition-all active:scale-[0.98]"
                    >
                      Simpan Pengaturan Visual
                    </button>
                  </form>
                </section>

                {/* Email Notifications */}
                <section className={`space-y-6 pt-8 border-t ${themeClasses.border}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xs font-black uppercase tracking-widest text-amber-500">Email Notifications</h3>
                      <p className={`text-[10px] ${themeClasses.textMuted} mt-1`}>Maksimal 3 email untuk notifikasi tiket baru</p>
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
                        className={`flex-1 border rounded-xl py-2 px-4 text-xs outline-none transition-all ${themeClasses.input}`}
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
                      <p className={`text-[10px] italic ${themeClasses.textMuted}`}>Belum ada email notifikasi yang didaftarkan.</p>
                    ) : (
                      appSettings.notification_emails.map((email, idx) => (
                        <div key={idx} className={`flex items-center justify-between ${themeClasses.bgSecondary} border ${themeClasses.border} p-3 rounded-xl group`}>
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 ${isDark ? 'bg-slate-700' : 'bg-slate-200'} rounded-lg flex items-center justify-center text-slate-400`}>
                              <Globe className="w-4 h-4" />
                            </div>
                            <span className={`text-xs font-bold ${themeClasses.text}`}>{email}</span>
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

                {/* Telegram Notifications */}
                <section className={`space-y-6 pt-8 border-t ${themeClasses.border}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xs font-black uppercase tracking-widest text-blue-400">Telegram Notifications</h3>
                      <p className={`text-[10px] ${themeClasses.textMuted} mt-1`}>Gunakan Bot Telegram untuk menerima notifikasi</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className={`text-[10px] font-bold ${themeClasses.textMuted} uppercase tracking-wider ml-1`}>Bot Token</label>
                      <input 
                        type="password"
                        placeholder="Masukkan Bot Token (dari @BotFather)..."
                        className={`w-full border rounded-xl py-2.5 px-4 text-xs outline-none transition-all ${themeClasses.input}`}
                        value={appSettings.telegram_bot_token}
                        onChange={e => setAppSettings({...appSettings, telegram_bot_token: e.target.value})}
                      />
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <label className={`text-[10px] font-bold ${themeClasses.textMuted} uppercase tracking-wider ml-1`}>Chat IDs</label>
                        <button 
                          type="button"
                          onClick={() => {
                            const chatId = prompt('Masukkan Chat ID Telegram (bisa didapat dari @userinfobot):');
                            if (chatId && chatId.trim()) {
                              setAppSettings({
                                ...appSettings,
                                telegram_chat_ids: [...appSettings.telegram_chat_ids, chatId.trim()]
                              });
                            }
                          }}
                          className="text-[10px] font-black text-emerald-500 uppercase tracking-widest hover:underline"
                        >
                          + Tambah Chat ID
                        </button>
                      </div>
                      
                      <div className="space-y-2">
                        {appSettings.telegram_chat_ids.length === 0 ? (
                          <p className={`text-[10px] italic ${themeClasses.textMuted}`}>Belum ada Chat ID yang didaftarkan.</p>
                        ) : (
                          appSettings.telegram_chat_ids.map((id, idx) => (
                            <div key={idx} className={`flex items-center justify-between ${themeClasses.bgSecondary} border ${themeClasses.border} p-2.5 rounded-xl group`}>
                              <div className="flex items-center gap-2">
                                <div className={`w-6 h-6 ${isDark ? 'bg-slate-700' : 'bg-slate-200'} rounded-lg flex items-center justify-center text-slate-400`}>
                                  <Send className="w-3 h-3" />
                                </div>
                                <span className={`text-xs font-mono ${themeClasses.text}`}>{id}</span>
                              </div>
                              <button 
                                type="button"
                                onClick={() => {
                                  const newIds = [...appSettings.telegram_chat_ids];
                                  newIds.splice(idx, 1);
                                  setAppSettings({ ...appSettings, telegram_chat_ids: newIds });
                                }}
                                className="text-rose-500 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </section>

                {/* Data Management */}
                <section className={`space-y-6 pt-8 border-t ${themeClasses.border}`}>
                  <h3 className="text-xs font-black uppercase tracking-widest text-blue-500">Data Management</h3>
                  
                  {/* IT Personnel */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className={`text-xs font-bold ${themeClasses.textMuted} uppercase tracking-wider`}>Tim IT</label>
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
                          className={`flex-1 border rounded-lg px-3 py-2 text-xs font-bold outline-none focus:ring-1 focus:ring-emerald-500 ${themeClasses.input}`}
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
                        <div key={it.id} className={`flex items-center gap-2 ${themeClasses.bgSecondary} px-3 py-1.5 rounded-lg border ${themeClasses.border} group`}>
                          <span className={`text-xs font-bold ${themeClasses.text}`}>{it.name}</span>
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
                          className={`flex-1 border rounded-lg px-3 py-2 text-xs font-bold outline-none focus:ring-1 focus:ring-emerald-500 ${themeClasses.input}`}
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
                        <div key={dept.id} className={`flex items-center gap-2 ${themeClasses.bgSecondary} px-3 py-1.5 rounded-lg border ${themeClasses.border} group`}>
                          <span className={`text-xs font-bold ${themeClasses.text}`}>{dept.name}</span>
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
                          className={`flex-1 border rounded-lg px-3 py-2 text-xs font-bold outline-none focus:ring-1 focus:ring-emerald-500 ${themeClasses.input}`}
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
                        <div key={cat.id} className={`flex items-center gap-2 ${themeClasses.bgSecondary} px-3 py-1.5 rounded-lg border ${themeClasses.border} group`}>
                          <span className={`text-xs font-bold ${themeClasses.text}`}>{cat.name}</span>
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
              className={`relative w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden ${themeClasses.card} border ${themeClasses.border}`}
            >
              <div className="p-8 text-center">
                <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Trash2 className="text-rose-600 w-8 h-8" />
                </div>
                <h2 className={`text-xl font-bold mb-2 ${themeClasses.text}`}>Reset All Data?</h2>
                <p className={`text-sm mb-8 leading-relaxed ${themeClasses.textMuted}`}>
                  This action will permanently delete all tickets in the queue. This cannot be undone.
                </p>
                <div className="flex gap-3">
                  <button 
                    onClick={() => setShowResetConfirm(false)}
                    className={`flex-1 px-4 py-3 font-bold rounded-xl transition-all ${themeClasses.bgSecondary} hover:opacity-80 ${themeClasses.text}`}
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
              className={`relative w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden ${themeClasses.card} border ${themeClasses.border}`}
            >
              <div className="p-8 text-center">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 className="text-emerald-600 w-8 h-8" />
                </div>
                <h2 className={`text-xl font-bold mb-2 ${themeClasses.text}`}>Konfirmasi Perubahan</h2>
                <p className={`text-sm mb-6 leading-relaxed ${themeClasses.textMuted}`}>
                  Apakah Anda yakin ingin memperbarui status menjadi <span className={`font-bold ${themeClasses.text}`}>{pendingUpdate.status}</span> dan menyimpan data penanganan ini?
                </p>
                <div className="flex gap-3">
                  <button 
                    onClick={() => setPendingUpdate(null)}
                    className={`flex-1 px-4 py-3 font-bold rounded-xl transition-all ${themeClasses.bgSecondary} hover:opacity-80 ${themeClasses.text}`}
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
      {/* Takeover/Reassign Confirmation Modal */}
      <AnimatePresence>
        {showTakeoverConfirm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowTakeoverConfirm(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className={`relative w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden ${isDark ? 'bg-zinc-900 border border-zinc-800' : 'bg-white'}`}
            >
              <div className="p-8">
                <div className="flex flex-col items-center text-center mb-8">
                  <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center mb-4 shadow-xl ${
                    showTakeoverConfirm.type === 'takeover' ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'
                  }`}>
                    {showTakeoverConfirm.type === 'takeover' ? <ShieldAlert className="w-8 h-8" /> : <UserPlus className="w-8 h-8" />}
                  </div>
                  <h2 className={`text-2xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {showTakeoverConfirm.type === 'takeover' ? 'Konfirmasi Ambil Alih' : 'Konfirmasi Penugasan'}
                  </h2>
                  <p className={`text-sm mt-2 font-medium ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                    {showTakeoverConfirm.type === 'takeover' 
                      ? 'Apakah Anda yakin ingin mengambil alih tiket ini? Tindakan ini akan tercatat dalam riwayat tiket.'
                      : `Apakah Anda yakin ingin menugaskan tiket ini kepada ${showTakeoverConfirm.targetUser}?`}
                  </p>
                </div>

                <div className="flex gap-3">
                  <button 
                    onClick={() => setShowTakeoverConfirm(null)}
                    className={`flex-1 py-4 font-black text-xs uppercase tracking-widest rounded-2xl transition-all ${
                      isDark ? 'bg-zinc-800 text-zinc-400 hover:bg-zinc-750' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                    }`}
                  >
                    Batal
                  </button>
                  <button 
                    onClick={() => executeIntervention(showTakeoverConfirm.id, showTakeoverConfirm.type, showTakeoverConfirm.targetUser)}
                    className={`flex-1 py-4 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-lg transition-all active:scale-[0.98] ${
                      showTakeoverConfirm.type === 'takeover' ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-900/20' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-900/20'
                    }`}
                  >
                    Ya, Lanjutkan
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
