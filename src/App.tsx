import React, { useState, useEffect, useMemo, useRef } from 'react';
import { io } from 'socket.io-client';
import { motion, AnimatePresence } from 'framer-motion';
import { Toaster, toast } from 'react-hot-toast';
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
  ChevronUp,
  ChevronDown,
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
  UserPlus,
  Moon,
  Sun,
  Inbox,
  Activity
} from 'lucide-react';

// Import modular components
import { Counter, Shimmer } from './components/Common';
import { Header } from './components/Header';
import { Logo } from './components/Logo';
import { Sidebar } from './components/Sidebar';
import { TicketDetailModal } from './components/modals/TicketDetailModal';
import { NewTicketModal } from './components/modals/NewTicketModal';
import { LoginModal } from './components/modals/LoginModal';
import { SettingsModal } from './components/modals/SettingsModal';
import { ConfirmModal } from './components/modals/ConfirmModal';
import { BottomNav } from './components/BottomNav';
import { TakeoverModal } from './components/modals/TakeoverModal';
import { SuccessModal } from './components/modals/SuccessModal';
import { MobileFilterModal } from './components/modals/MobileFilterModal';
import { ImageManagerModal } from './components/modals/ImageManagerModal';
import { SplashScreen } from './components/SplashScreen';

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
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
}

const STATUSES = ['New', 'In Progress', 'Completed', 'Cancelled'];
const LOGO_OPTIONS = [
  { id: 'ShieldCheck', icon: ShieldCheck },
  { id: 'Cpu', icon: Cpu },
  { id: 'Globe', icon: Globe },
  { id: 'Zap', icon: Zap },
  { id: 'Ticket', icon: Ticket },
  { id: 'Send', icon: Logo }
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

const HighlightText = ({ text, highlight, isDark }: { text: string, highlight: string, isDark: boolean }) => {
  if (!highlight.trim()) return <>{text}</>;
  const parts = text.split(new RegExp(`(${highlight})`, 'gi'));
  return (
    <>
      {parts.map((part, i) => 
        part.toLowerCase() === highlight.toLowerCase() ? (
          <mark key={i} className={`${isDark ? 'bg-emerald-500/30 text-emerald-300' : 'bg-emerald-100 text-emerald-900'} px-0.5 rounded`}>
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </>
  );
};

const SkeletonTicket: React.FC<{ isDark: boolean }> = ({ isDark }) => (
  <div className={`animate-pulse rounded-xl p-2 border ${isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-100'} flex items-center gap-3`}>
    <div className={`w-8 h-8 rounded-lg ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`} />
    <div className="flex-1 space-y-2">
      <div className="flex justify-between">
        <div className={`h-2 w-16 rounded ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`} />
        <div className={`h-2 w-20 rounded ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`} />
      </div>
      <div className={`h-3 w-32 rounded ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`} />
      <div className="flex gap-2">
        <div className={`h-2 w-24 rounded ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`} />
        <div className={`h-2 w-24 rounded ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`} />
      </div>
    </div>
  </div>
);

/**
 * IT Helpdesk K3DK - Main Application Component
 * 
 * Flow Aplikasi:
 * 1. User: Membuat tiket melalui modal "New Ticket".
 * 2. User: Mengunggah foto (opsional) yang secara otomatis diberi watermark lokasi & waktu.
 * 3. Database: Tiket disimpan di Supabase (via API Express).
 * 4. Admin: Login melalui Portal Admin untuk mengelola antrian.
 * 5. Admin: Melihat statistik distribusi masalah (Pie Chart) dan notifikasi real-time.
 * 6. Admin: Memperbarui status tiket, menugaskan IT, dan memberikan balasan resolusi.
 */

import { RollingNumber } from './components/RollingNumber';

/**
 * Helper to safely parse date strings for Safari compatibility
 */
const parseSafeDate = (dateString: string): Date => {
  if (!dateString) return new Date();
  const normalizedDate = dateString.includes('T') || dateString.includes('Z') 
    ? dateString 
    : dateString.replace(' ', 'T');
  return new Date(normalizedDate);
};

export default function App() {
  // --- State Management ---
  const [tickets, setTickets] = useState<ITicket[]>([]); // Daftar semua tiket
  const [ticketLogs, setTicketLogs] = useState<any[]>([]); // Riwayat tiket
  const [itPersonnel, setItPersonnel] = useState<{id: number, name: string}[]>([]);
  const [users, setUsers] = useState<{id: number, username: string, full_name: string, role: string}[]>([]);
  const [adminUsers, setAdminUsers] = useState<{id: number, username: string, full_name: string, role: string}[]>([]);
  const [departments, setDepartments] = useState<{id: number, name: string}[]>([]);
  const [categories, setCategories] = useState<{id: number, name: string}[]>([]);
  const [masterUsers, setMasterUsers] = useState<{id: number, full_name: string, department: string, phone: string}[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<ITicket | null>(null); // Tiket yang sedang dilihat detailnya
  const [modalStatus, setModalStatus] = useState<string>(''); // Status sementara di modal detail
  const [modalPriority, setModalPriority] = useState<string>(''); // Priority sementara di modal detail
  const [formData, setFormData] = useState({
    name: '',
    department: '',
    category: '',
    phone: '',
    priority: 'Medium' as 'Low' | 'Medium' | 'High' | 'Urgent',
    description: '',
    photo: '',
    face_photo: '',
    latitude: null as number | null,
    longitude: null as number | null
  });
  const [selectedTickets, setSelectedTickets] = useState<number[]>([]);

  const handleSelectTicket = async (ticket: ITicket) => {
    setSelectedTicket(ticket);
    setTicketLogs([]);
    try {
      const [photoRes, facePhotoRes, logsRes] = await Promise.all([
        fetch(`/api/tickets/${ticket.id}/photo`),
        fetch(`/api/tickets/${ticket.id}/face_photo`),
        fetch(`/api/tickets/${ticket.id}/logs`)
      ]);
      
      const photoData = await photoRes.json();
      const facePhotoData = await facePhotoRes.json();
      
      setSelectedTicket(prev => {
        if (prev && prev.id === ticket.id) {
          return { 
            ...prev, 
            photo: photoData.photo || null,
            face_photo: facePhotoData.face_photo || null
          };
        }
        return prev;
      });

      const logsData = await logsRes.json();
      if (Array.isArray(logsData)) {
        setTicketLogs(logsData);
      }
    } catch (err) {
      console.error('Failed to fetch ticket details:', err);
    }
  };
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>(
    (typeof window !== 'undefined' && "Notification" in window) ? Notification.permission : 'default'
  );

  const requestNotificationPermission = async () => {
    if (typeof window === 'undefined' || !("Notification" in window)) return;
    try {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
    } catch (e) {
      console.error('Failed to request notification permission:', e);
    }
  };

  const [loading, setLoading] = useState(true); // Loading state untuk fetch data awal
  const [adminUser, setAdminUser] = useState<any>(null); // Data login admin
  const [showForm, setShowForm] = useState(false); // Toggle modal buat tiket baru
  const [showSuccess, setShowSuccess] = useState(false); // Toggle modal sukses
  const [showLogin, setShowLogin] = useState(false); // Toggle modal login admin
  const [loginData, setLoginData] = useState({ username: '', password: '' });
  const [showSettings, setShowSettings] = useState(false); // Toggle modal pengaturan aplikasi
  const [showImageManager, setShowImageManager] = useState(false); // Toggle modal manajemen gambar
  const [settingsTab, setSettingsTab] = useState<'general' | 'branding' | 'notifications' | 'data'>('general');
  const [showResetConfirm, setShowResetConfirm] = useState(false); // Toggle konfirmasi reset data
  const [showTakeoverConfirm, setShowTakeoverConfirm] = useState<{id: number, type: 'takeover' | 'reassign', targetUser?: string} | null>(null);
  const [showDistribution, setShowDistribution] = useState(false); // Toggle distribusi masalah
  const [pendingUpdate, setPendingUpdate] = useState<{id: number, status: string, assigned_to: string | null, admin_reply: string | null, internal_notes: string | null} | null>(null); // Data update yang menunggu konfirmasi
  const [addingType, setAddingType] = useState<'it' | 'dept' | 'cat' | 'master-user' | null>(null);
  const [newItemName, setNewItemName] = useState('');
  const [newItemAssignedTo, setNewItemAssignedTo] = useState('');
  const [newEmailInput, setNewEmailInput] = useState('');
  const [showEmailInput, setShowEmailInput] = useState(false);
  const [gpsStatus, setGpsStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'today' | 'all' | 'my_tickets'>(() => {
    return localStorage.getItem('adminUser') ? 'all' : 'today';
  });
  const [showMobileFilter, setShowMobileFilter] = useState(false);
  const [tempFilters, setTempFilters] = useState({ dept: '', status: '', date: '', search: '' });
  const [appSettings, setAppSettings] = useState({ 
    app_name: 'IT Helpdesk K3DK', 
    logo_type: 'Send',
    theme_mode: 'light', // 'light' or 'dark'
    primary_color: '#10b981', // emerald-600
    admin_theme_mode: 'light', // 'light' or 'dark'
    admin_primary_color: '#8b5cf6', // violet-500
    custom_logo: '',
    custom_favicon: '',
    notification_emails: [] as string[],
    telegram_bot_token: '',
    telegram_chat_ids: [] as string[],
    smtp_host: '',
    smtp_port: '465',
    smtp_user: '',
    smtp_pass: '',
    smtp_from: '',
    photo_cleanup_duration: '24'
  }); // Pengaturan nama & logo app

  const toggleTheme = () => {
    const newMode = appSettings.theme_mode === 'light' ? 'dark' : 'light';
    setAppSettings(prev => ({ ...prev, theme_mode: newMode }));
    // If admin is logged in, sync admin theme too for convenience
    if (adminUser) {
      setAppSettings(prev => ({ ...prev, admin_theme_mode: newMode }));
    }
  };

  // --- Draft Ticket Logic ---
  useEffect(() => {
    const savedDraft = localStorage.getItem('ticket_draft');
    if (savedDraft) {
      try {
        setFormData(prev => ({ ...prev, ...JSON.parse(savedDraft) }));
      } catch (e) {
        console.error("Failed to load draft", e);
      }
    }
  }, []);

  useEffect(() => {
    if (formData.name || formData.description) {
      localStorage.setItem('ticket_draft', JSON.stringify(formData));
    }
  }, [formData]);

  const clearDraft = () => {
    localStorage.removeItem('ticket_draft');
    setFormData({
      name: '',
      department: '',
      category: '',
      phone: '',
      priority: 'Medium',
      description: '',
      photo: '',
      face_photo: '',
      latitude: null,
      longitude: null
    });
  };
  const [submitting, setSubmitting] = useState(false); // Loading state saat kirim tiket
  const [filterDept, setFilterDept] = useState<string>(''); // Filter departemen
  const [filterStatus, setFilterStatus] = useState<string>(''); // Filter status
  const [filterDate, setFilterDate] = useState<string>(''); // Filter tanggal
  const [searchQuery, setSearchQuery] = useState<string>(''); // Pencarian tiket
  const [currentPage, setCurrentPage] = useState<number>(1); // Halaman saat ini
  const [photoLoading, setPhotoLoading] = useState(false); // Loading state saat proses watermark foto
  const itemsPerPage = 10; // Jumlah tiket per halaman
  const lastTicketIdRef = useRef<number | null>(null);

  /**
   * Menghitung tiket yang difilter
   */
  const filteredTickets = useMemo(() => {
    return tickets.filter(ticket => {
      // View Mode Filter (Today vs All vs My Tickets)
      if (viewMode === 'today') {
        const ticketDate = parseSafeDate(ticket.created_at).toLocaleDateString('en-CA'); // YYYY-MM-DD
        const today = new Date().toLocaleDateString('en-CA');
        if (ticketDate !== today) return false;
      } else if (viewMode === 'my_tickets' && adminUser) {
        if (ticket.assigned_to !== adminUser.username && ticket.assigned_to !== adminUser.full_name) return false;
      }

      const matchDept = filterDept ? ticket.department === filterDept : true;
      const matchStatus = filterStatus ? ticket.status === filterStatus : true;
      const matchDate = filterDate ? parseSafeDate(ticket.created_at).toLocaleDateString('en-CA') === filterDate : true;
      const matchSearch = searchQuery ? (
        ticket.ticket_no.toLowerCase().includes(searchQuery.toLowerCase()) || 
        ticket.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ticket.description.toLowerCase().includes(searchQuery.toLowerCase())
      ) : true;
      return matchDept && matchStatus && matchDate && matchSearch;
    });
  }, [tickets, viewMode, filterDept, filterStatus, filterDate, searchQuery]);

  /**
   * Tiket yang ditampilkan setelah paginasi
   */
  const paginatedTickets = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredTickets.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredTickets, currentPage]);

  const totalPages = Math.ceil(filteredTickets.length / itemsPerPage);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [viewMode, filterDept, filterStatus, filterDate, searchQuery]);

  const getSLAColor = (createdAt: string, status: string) => {
    if (status !== 'New') return '';
    const created = parseSafeDate(createdAt).getTime();
    const now = new Date().getTime();
    const diffHours = (now - created) / (1000 * 60 * 60);

    if (diffHours > 5) return 'bg-rose-500/10 border-rose-500/20 text-rose-600 animate-pulse';
    if (diffHours > 2) return 'bg-amber-500/10 border-amber-500/20 text-amber-600';
    return '';
  };

  const getSLALabel = (createdAt: string, status: string) => {
    if (status !== 'New') return null;
    const created = parseSafeDate(createdAt).getTime();
    const now = new Date().getTime();
    const diffHours = (now - created) / (1000 * 60 * 60);

    if (diffHours > 5) return 'Critical (>5h)';
    if (diffHours > 2) return 'Delayed (>2h)';
    return null;
  };

  /**
   * Menghitung statistik kategori untuk Pie Chart
   */
  const categoryStats = useMemo(() => {
    if (!Array.isArray(categories)) return [];
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

            // Set dimensions (max 400px width/height for smaller size)
            const maxDim = 400;
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
            const padding = 8;
            const fontSize = Math.max(9, Math.floor(width / 40));
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

            // Compress to stay under 30KB to save space
            let quality = 0.6;
            let base64 = canvas.toDataURL('image/jpeg', quality);
            
            // Iteratively reduce quality if still too large
            while (base64.length > 40000 && quality > 0.1) { // 40000 chars in base64 is approx 30KB
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

  // API Health Check
  useEffect(() => {
    const checkHealth = async () => {
      try {
        const res = await fetch('/api/health');
        if (res.ok) {
          const data = await res.json();
          console.log('API Health Check OK:', data);
        } else {
          console.error('API Health Check Failed with status:', res.status);
        }
      } catch (err) {
        console.error('API Health Check Error:', err);
      }
    };
    checkHealth();
  }, []);

  /**
   * Mengambil data tiket dari server
   */
  const fetchTickets = async (showLoading = false) => {
    if (showLoading) setLoading(true);
    try {
      const url = adminUser 
        ? `/api/tickets?username=${encodeURIComponent(adminUser.username)}&role=${encodeURIComponent(adminUser.role)}`
        : '/api/tickets';
      
      console.log(`Fetching tickets from: ${url}`);
      const res = await fetch(url);
      
      if (!res.ok) {
        const text = await res.text();
        console.error(`Fetch tickets failed with status ${res.status}: ${text.substring(0, 100)}`);
        toast.error(`Gagal mengambil tiket: Server error ${res.status}`);
        setTickets([]);
        return;
      }
      
      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await res.text();
        console.error(`API returned non-JSON response from ${url}: ${text.substring(0, 100)}`);
        toast.error("Gagal mengambil tiket: Format data tidak valid (Bukan JSON)");
        setTickets([]);
        return;
      }

      const data = await res.json();
      if (Array.isArray(data)) {
        console.log(`Successfully fetched ${data.length} tickets.`);
        // Notification logic for Admin
        if (adminUser && lastTicketIdRef.current !== null && data.length > 0) {
          const newTickets = data.filter(t => t.id > lastTicketIdRef.current!);
          if (newTickets.length > 0) {
            newTickets.forEach(ticket => {
              if (typeof window !== 'undefined' && "Notification" in window && Notification.permission === "granted") {
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
      if (showLoading) setLoading(false);
    }
  };

  const fetchManagementData = async () => {
    try {
      console.log('Fetching management data...');
      const [itRes, deptRes, catRes, usersRes, masterUsersRes, adminUsersRes] = await Promise.all([
        fetch('/api/it-personnel'),
        fetch('/api/departments'),
        fetch('/api/categories'),
        fetch('/api/users'),
        fetch('/api/master-users'),
        fetch('/api/admin-users')
      ]);
      
      if (!itRes.ok || !deptRes.ok || !catRes.ok || !usersRes.ok || !masterUsersRes.ok || !adminUsersRes.ok) {
        throw new Error('Gagal mengambil data manajemen');
      }

      const its = await itRes.json();
      const depts = await deptRes.json();
      const cats = await catRes.json();
      const usersData = await usersRes.json();
      const masterUsersData = await masterUsersRes.json();
      const adminUsersData = await adminUsersRes.json();
      
      console.log('Management data fetched:', { its, depts, cats, usersData, masterUsersData, adminUsersData });
      
      setItPersonnel(its);
      setDepartments(depts);
      setCategories(cats);
      setUsers(usersData);
      setMasterUsers(masterUsersData);
      setAdminUsers(adminUsersData);
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

  const handleUploadExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/master-users/upload', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (res.ok) {
        alert(`Berhasil mengunggah ${data.count} user.`);
        fetchManagementData();
      } else {
        alert(`Gagal: ${data.error}`);
      }
    } catch (err) {
      console.error(err);
      alert('Terjadi kesalahan saat mengunggah file.');
    }
    
    // reset input
    e.target.value = '';
  };

  /**
   * Inisialisasi data dan polling setiap 10 detik
   */
  useEffect(() => {
    const savedAdmin = localStorage.getItem('adminUser');
    if (savedAdmin) setAdminUser(JSON.parse(savedAdmin));
  }, []);

  useEffect(() => {
    const initApp = async () => {
      setLoading(true);
      await Promise.all([
        fetchTickets(),
        fetchSettings(),
        fetchManagementData()
      ]);
      // Add a slight delay for the animation to be seen
      setTimeout(() => setLoading(false), 1000);
    };
    
    initApp();
    const interval = setInterval(fetchTickets, 10000);
    return () => clearInterval(interval);
  }, [adminUser]);

  useEffect(() => {
    if (showForm) {
      getGPSLocation();
    }
  }, [showForm]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const action = params.get('action');
    if (action === 'create') {
      setShowForm(true);
    } else if (action === 'status') {
      // If there's a way to filter for "my tickets", we could do it here
      // For now, just ensuring the user is on the main list
      setShowForm(false);
      setShowSettings(false);
    }
  }, []);

  useEffect(() => {
    const socket = io();
    
    socket.on('ticket_created', (newTicket) => {
      setTickets(prev => [newTicket, ...prev]);
    });

    socket.on('ticket_updated', (updatedData) => {
      setTickets(prev => prev.map(t => t.id === Number(updatedData.id) ? { ...t, ...updatedData } : t));
      
      // Update selected ticket if it's the one that was updated
      setSelectedTicket(prev => {
        if (prev && prev.id === Number(updatedData.id)) {
          return { ...prev, ...updatedData };
        }
        return prev;
      });
    });

    return () => {
      socket.disconnect();
    };
  }, []);

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
        setViewMode('all');
        
        // Request Notification Permission
        if (typeof window !== 'undefined' && "Notification" in window && Notification.permission === "default") {
          Notification.requestPermission();
        }
        
        // Re-fetch tickets with user context
        const url = `/api/tickets?username=${encodeURIComponent(data.user.username)}&role=${encodeURIComponent(data.user.role)}`;
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
    setViewMode('today');
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

  const handleManagementAction = async (type: 'it' | 'dept' | 'cat' | 'master-user' | 'admin-user', action: 'add' | 'delete' | 'refresh', data?: any) => {
    if (type === 'master-user') {
      // For master-user, we just refresh the data since the actual add/delete 
      // is handled inside SettingsModal for simplicity with multiple fields
      const res = await fetch('/api/master-users');
      const masterUsersData = await res.json();
      setMasterUsers(masterUsersData);
      return;
    }
    
    if (type === 'admin-user') {
      const [adminRes, usersRes] = await Promise.all([
        fetch('/api/admin-users'),
        fetch('/api/users')
      ]);
      setAdminUsers(await adminRes.json());
      setUsers(await usersRes.json());
      return;
    }

    const endpoint = type === 'it' ? 'it-personnel' : type === 'dept' ? 'departments' : 'categories';
    const label = type === 'it' ? 'IT' : type === 'dept' ? 'Departemen' : 'Kategori';
    
    try {
      if (action === 'add') {
        if (!newItemName.trim()) return;
        
        const res = await fetch(`/api/${endpoint}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            name: newItemName.trim(),
            assigned_to: type === 'cat' ? newItemAssignedTo : undefined
          })
        });
        
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || `Gagal menambah ${label}`);
        }
        
        setNewItemName('');
        setNewItemAssignedTo('');
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
      // Update global settings
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...appSettings,
          notification_emails: JSON.stringify(appSettings.notification_emails),
          telegram_chat_ids: JSON.stringify(appSettings.telegram_chat_ids)
        })
      });

      // If admin is logged in, also update their personal settings
      if (adminUser) {
        await fetch(`/api/users/${adminUser.username}/settings`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            theme_mode: appSettings.admin_theme_mode,
            primary_color: appSettings.admin_primary_color
          })
        });
        // Update local adminUser state to reflect changes
        setAdminUser({
          ...adminUser,
          theme_mode: appSettings.admin_theme_mode,
          primary_color: appSettings.admin_primary_color
        });
      }

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
        clearDraft();
        setShowForm(false);
        toast.success('Tiket berhasil dikirim!');
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
        fetchTickets();
      } else {
        const errorData = await res.json();
        toast.error('Gagal mengirim tiket: ' + (errorData.error || 'Terjadi kesalahan'));
      }
    } catch (err) {
      console.error('Failed to submit ticket:', err);
      toast.error('Terjadi kesalahan koneksi.');
    } finally {
      setSubmitting(false);
    }
  };

  /**
   * Membuka konfirmasi update tiket (Hanya Admin)
   */
  const handleUpdateClick = (id: number, status: string, assigned_to: string | null, admin_reply: string | null, internal_notes: string | null, priority?: string) => {
    if (!assigned_to) {
      toast.error('Silakan pilih IT yang menangani terlebih dahulu.');
      return;
    }
    setPendingUpdate({ id, status, assigned_to, admin_reply, internal_notes, priority } as any);
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
          priority: (pendingUpdate as any).priority,
          performed_by: adminUser.username
        })
      });
      if (res.ok) {
        toast.success('Tiket berhasil diperbarui!');
        setPendingUpdate(null);
        fetchTickets();
      } else {
        toast.error('Gagal memperbarui tiket.');
      }
    } catch (err) {
      console.error('Failed to update ticket:', err);
      toast.error('Terjadi kesalahan koneksi.');
    }
  };

  const handleBulkAction = async (status: string) => {
    if (selectedTickets.length === 0) return;
    if (!confirm(`Update ${selectedTickets.length} tiket menjadi ${status}?`)) return;
    
    setLoading(true);
    try {
      await Promise.all(selectedTickets.map(id => 
        fetch(`/api/tickets/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            status, 
            performed_by: adminUser.username 
          })
        })
      ));
      toast.success(`${selectedTickets.length} tiket berhasil diperbarui!`);
      setSelectedTickets([]);
      fetchTickets();
    } catch (err) {
      toast.error('Gagal memperbarui beberapa tiket.');
    } finally {
      setLoading(false);
    }
  };

  const updateTicket = async (id: number, status: string, assigned_to: string | null, admin_reply: string | null, internal_notes: string | null, priority?: string) => {
    // This is now handled by handleUpdateClick and confirmUpdate
    handleUpdateClick(id, status, assigned_to, admin_reply, internal_notes, priority);
  };

  /**
   * Memformat tanggal ke format Indonesia (DD MMM YYYY, HH:mm)
   */
  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    return parseSafeDate(dateString).toLocaleString('id-ID', {
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
      case 'New': return 'bg-amber-500 text-white border-amber-600';
      case 'In Progress': return 'bg-blue-500 text-white border-blue-600';
      case 'Completed': return 'bg-emerald-600 text-white border-emerald-700';
      case 'Cancelled': return 'bg-rose-500 text-white border-rose-600';
      default: return 'bg-slate-500 text-white border-slate-600';
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

  const CurrentLogo = LOGO_OPTIONS.find(l => l.id === appSettings.logo_type)?.icon || ShieldCheck;
  
  // Dynamic theme based on user role
  const isDark = adminUser ? adminUser.theme_mode === 'dark' : appSettings.theme_mode === 'dark';
  const primaryColor = adminUser ? adminUser.primary_color : appSettings.primary_color;

  // Sync appSettings with adminUser settings when adminUser changes
  useEffect(() => {
    if (adminUser) {
      setAppSettings(prev => ({
        ...prev,
        admin_theme_mode: adminUser.theme_mode || 'light',
        admin_primary_color: adminUser.primary_color || '#8b5cf6'
      }));
    }
  }, [adminUser]);

  // Update favicon, apple-touch-icon, theme-color, and manifest when appSettings change
  useEffect(() => {
    // Favicon
    let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.getElementsByTagName('head')[0].appendChild(link);
    }
    const ts = new Date().getTime();
    link.href = appSettings.custom_favicon ? `/api/branding/favicon?v=${ts}` : "https://cdn-icons-png.flaticon.com/512/2906/2906274.png";

    // Apple Touch Icon
    let appleLink = document.querySelector("link[rel='apple-touch-icon']") as HTMLLinkElement;
    if (!appleLink) {
      appleLink = document.createElement('link');
      appleLink.rel = 'apple-touch-icon';
      document.getElementsByTagName('head')[0].appendChild(appleLink);
    }
    appleLink.href = appSettings.custom_logo ? `/api/branding/logo?v=${ts}` : (appSettings.custom_favicon ? `/api/branding/favicon?v=${ts}` : "https://cdn-icons-png.flaticon.com/512/2906/2906274.png");

    // Theme Color
    let themeMeta = document.querySelector("meta[name='theme-color']") as HTMLMetaElement;
    if (!themeMeta) {
      themeMeta = document.createElement('meta');
      themeMeta.name = 'theme-color';
      document.getElementsByTagName('head')[0].appendChild(themeMeta);
    }
    themeMeta.content = primaryColor;

    // Manifest
    let manifestLink = document.querySelector("link[rel='manifest']") as HTMLLinkElement;
    if (!manifestLink) {
      manifestLink = document.createElement('link');
      manifestLink.rel = 'manifest';
      document.getElementsByTagName('head')[0].appendChild(manifestLink);
    }
    manifestLink.href = `/manifest.json?v=${ts}`;
  }, [appSettings.custom_favicon, appSettings.custom_logo, appSettings.app_name, primaryColor, isDark]);

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
      <AnimatePresence mode="wait">
        {loading ? (
          <SplashScreen key="splash" appName={appSettings.app_name} primaryColor={primaryColor} />
        ) : (
          <motion.div 
            key="content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col min-h-screen"
          >
            <Toaster position="top-center" reverseOrder={false} />
            {/* --- HEADER SECTION --- */}
            <Header 
              appSettings={appSettings}
              primaryColor={primaryColor}
              isDark={isDark}
              adminUser={adminUser}
              setShowSettings={setShowSettings}
              setShowImageManager={setShowImageManager}
              setShowResetConfirm={setShowResetConfirm}
              handleLogout={handleLogout}
              setShowLogin={setShowLogin}
              setShowForm={setShowForm}
              tickets={tickets}
              notificationPermission={notificationPermission}
              requestNotificationPermission={requestNotificationPermission}
              toggleTheme={toggleTheme}
            />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8 pb-24 md:pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-8">
          {/* --- SIDEBAR: STATS & INFO --- */}
          <div className="hidden md:block">
            <Sidebar 
              isDark={isDark}
              themeClasses={themeClasses}
              tickets={tickets}
              adminUser={adminUser}
              setShowDistribution={setShowDistribution}
              primaryColor={primaryColor}
              filteredTickets={filteredTickets}
              categoryStats={categoryStats}
              showDistribution={showDistribution}
              setShowForm={setShowForm}
              fetchTickets={fetchTickets}
            />
          </div>

          {/* --- MAIN CONTENT: TICKET LIST --- */}
          <div className="lg:col-span-2 space-y-3 sm:space-y-4">
            {/* Mobile Status Overview */}
            <div className="md:hidden mb-4">
              <div className="flex items-center justify-between mb-2">
                <h2 className={`text-sm font-bold ${themeClasses.text}`}>Status Antrian</h2>
                <BarChart3 className="w-4 h-4 text-slate-300" />
              </div>
              <div className="grid grid-cols-4 gap-1.5">
                <motion.div 
                  whileHover={{ y: -2, scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`${themeClasses.card} ${themeClasses.border} border rounded-xl p-2 flex flex-col items-center justify-center text-center`}
                >
                  <Counter value={filteredTickets.length} className={`text-base font-black leading-none mb-0.5 ${themeClasses.text}`} />
                  <span className="text-[7px] font-bold text-slate-400 capitalize tracking-wider">Total</span>
                </motion.div>
                <motion.div 
                  whileHover={{ y: -2, scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`${isDark ? 'bg-amber-500/10 border-amber-500/20' : 'bg-amber-50 border-amber-100'} border rounded-xl p-2 flex flex-col items-center justify-center text-center`}
                >
                  <Counter value={filteredTickets.filter(t => t.status === 'New').length} className="text-base font-black text-amber-500 leading-none mb-0.5" />
                  <span className="text-[7px] font-bold text-amber-500 capitalize tracking-wider">Baru</span>
                </motion.div>
                <motion.div 
                  whileHover={{ y: -2, scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`${isDark ? 'bg-blue-500/10 border-blue-500/20' : 'bg-blue-50 border-blue-100'} border rounded-xl p-2 flex flex-col items-center justify-center text-center`}
                >
                  <Counter value={filteredTickets.filter(t => t.status === 'In Progress').length} className="text-base font-black text-blue-500 leading-none mb-0.5" />
                  <span className="text-[7px] font-bold text-blue-500 capitalize tracking-wider">Progres</span>
                </motion.div>
                <motion.div 
                  whileHover={{ y: -2, scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`${isDark ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-emerald-50 border-emerald-100'} border rounded-xl p-2 flex flex-col items-center justify-center text-center`}
                >
                  <Counter value={filteredTickets.filter(t => t.status === 'Completed').length} className="text-base font-black text-emerald-500 leading-none mb-0.5" />
                  <span className="text-[7px] font-bold text-emerald-500 capitalize tracking-wider">Selesai</span>
                </motion.div>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 mb-2 sm:mb-4 border-b border-slate-100 pb-1 overflow-hidden">
              <div className="flex items-center gap-2 sm:gap-4 overflow-x-auto scrollbar-hide pb-1">
                <button 
                  onClick={() => setViewMode('today')}
                  className={`relative pb-1 text-[10px] sm:text-xs whitespace-nowrap font-bold transition-all ${
                    viewMode === 'today' ? 'text-emerald-600' : isDark ? 'text-slate-400 hover:text-slate-300' : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  Antrian Hari Ini
                  {viewMode === 'today' && (
                    <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-600 rounded-full" />
                  )}
                </button>
                <button 
                  onClick={() => setViewMode('all')}
                  className={`relative pb-1 text-[10px] sm:text-xs whitespace-nowrap font-bold transition-all ${
                    viewMode === 'all' ? 'text-emerald-600' : isDark ? 'text-slate-400 hover:text-slate-300' : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  Semua Antrian
                  {viewMode === 'all' && (
                    <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-600 rounded-full" />
                  )}
                </button>
                {adminUser && (
                  <button 
                    onClick={() => setViewMode('my_tickets')}
                    className={`relative pb-1 text-[10px] sm:text-xs whitespace-nowrap font-bold transition-all ${
                      viewMode === 'my_tickets' ? 'text-emerald-600' : isDark ? 'text-slate-400 hover:text-slate-300' : 'text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    Tiket Saya
                    {viewMode === 'my_tickets' && (
                      <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-600 rounded-full" />
                    )}
                  </button>
                )}
              </div>
              
              {/* Filter Controls */}
              <div className="flex items-center gap-1 sm:gap-2">
                <button 
                  onClick={() => {
                    setTempFilters({ dept: filterDept, status: filterStatus, date: filterDate, search: searchQuery });
                    setShowMobileFilter(true);
                  }}
                  className={`sm:hidden flex items-center gap-1 px-2 py-1 border rounded-lg text-[9px] font-black capitalize tracking-tighter shadow-sm active:scale-95 transition-all ${
                    (filterDept || filterStatus || filterDate || searchQuery)
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-600'
                    : isDark ? 'bg-zinc-900 border-zinc-800 text-slate-400' : 'bg-white border-slate-200 text-slate-500'
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
                  className="hidden sm:block text-[10px] font-bold text-slate-400 hover:text-emerald-600 capitalize tracking-wider"
                >
                  Atur Ulang Filter
                </button>
                <button 
                  onClick={() => fetchTickets(true)}
                  className="p-2 text-slate-400 hover:text-emerald-600 transition-colors"
                  title="Segarkan Antrian"
                  aria-label="Refresh tickets"
                >
                  <RefreshCcw className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Dashboard Analytics - Admin Only */}
            {adminUser && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                <div className={`${themeClasses.card} p-2.5 rounded-2xl border shadow-sm flex items-center gap-2.5`}>
                  <div className="w-9 h-9 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600 shrink-0">
                    <Clock className="w-4.5 h-4.5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[9px] font-black text-slate-400 capitalize tracking-wider whitespace-nowrap">Baru</p>
                    <RollingNumber 
                      value={tickets.filter(t => t.status === 'New').length} 
                      className={`text-base font-black ${themeClasses.text}`} 
                    />
                  </div>
                </div>
                <div className={`${themeClasses.card} p-2.5 rounded-2xl border shadow-sm flex items-center gap-2.5`}>
                  <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 shrink-0">
                    <Activity className="w-4.5 h-4.5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[9px] font-black text-slate-400 capitalize tracking-wider whitespace-nowrap">Progres</p>
                    <RollingNumber 
                      value={tickets.filter(t => t.status === 'In Progress').length} 
                      className={`text-base font-black ${themeClasses.text}`} 
                    />
                  </div>
                </div>
                <div className={`${themeClasses.card} p-2.5 rounded-2xl border shadow-sm flex items-center gap-2.5`}>
                  <div className="w-9 h-9 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 shrink-0">
                    <CheckCircle2 className="w-4.5 h-4.5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[9px] font-black text-slate-400 capitalize tracking-wider whitespace-nowrap">Selesai</p>
                    <RollingNumber 
                      value={tickets.filter(t => t.status === 'Completed').length} 
                      className={`text-base font-black ${themeClasses.text}`} 
                    />
                  </div>
                </div>
                <div className={`${themeClasses.card} p-2.5 rounded-2xl border shadow-sm flex items-center gap-2.5`}>
                  <div className="w-9 h-9 bg-rose-50 rounded-xl flex items-center justify-center text-rose-600 shrink-0">
                    <AlertCircle className="w-4.5 h-4.5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[9px] font-black text-slate-400 capitalize tracking-wider whitespace-nowrap">Urgent</p>
                    <RollingNumber 
                      value={tickets.filter(t => t.priority === 'Urgent' && t.status !== 'Completed').length} 
                      className={`text-base font-black ${themeClasses.text}`} 
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Results Summary & Filter Toggle */}
            <div className="flex items-center justify-between mb-4 px-1">
              <div className={`text-[10px] sm:text-xs font-bold ${themeClasses.textMuted} flex items-center gap-1`}>
                Menampilkan 
                <RollingNumber value={Math.min((currentPage - 1) * itemsPerPage + 1, filteredTickets.length)} className={themeClasses.text} /> 
                - 
                <RollingNumber value={Math.min(currentPage * itemsPerPage, filteredTickets.length)} className={themeClasses.text} /> 
                dari 
                <RollingNumber value={filteredTickets.length} className={themeClasses.text} /> 
                tiket
              </div>
              <div className="flex items-center gap-3">
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery('')}
                    className="text-[10px] font-bold text-rose-500 hover:underline"
                  >
                    Hapus Pencarian
                  </button>
                )}
                <button
                  onClick={() => setShowMobileFilter(true)}
                  className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all border ${themeClasses.card} ${themeClasses.border} hover:border-emerald-500 hover:text-emerald-500 ${themeClasses.text}`}
                >
                  <Filter className="w-3.5 h-3.5" />
                  Filter Antrian
                </button>
              </div>
            </div>

            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className={`p-4 rounded-2xl border ${themeClasses.card} ${themeClasses.border}`}>
                    <div className="flex items-center gap-3">
                      <Shimmer className="w-10 h-10" />
                      <div className="flex-1 space-y-2">
                        <Shimmer className="w-1/3 h-4" />
                        <Shimmer className="w-1/2 h-3" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : tickets.length === 0 ? (
              <div className={`flex flex-col items-center justify-center py-20 rounded-2xl border border-dashed ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                <CurrentLogo className="w-12 h-12 text-slate-200 mb-4" />
                <p className={`font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>No tickets in queue</p>
                <button 
                  onClick={() => setShowForm(true)}
                  className="mt-4 text-emerald-600 font-bold text-sm hover:underline"
                >
                  Be the first to submit
                </button>
              </div>
            ) : (
              <motion.div 
                className="space-y-4"
                drag="x"
                dragDirectionLock
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.1}
                style={{ touchAction: 'pan-y' }}
                onDragEnd={(_, info) => {
                  const swipeThreshold = 50;
                  if (info.offset.x > swipeThreshold) {
                    // Swipe Right -> Previous Tab
                    if (viewMode === 'all') setViewMode('today');
                    else if (viewMode === 'my_tickets') setViewMode('all');
                  } else if (info.offset.x < -swipeThreshold) {
                    // Swipe Left -> Next Tab
                    if (viewMode === 'today') setViewMode('all');
                    else if (viewMode === 'all' && adminUser) setViewMode('my_tickets');
                  }
                }}
              >
                <AnimatePresence mode="popLayout">
                  {loading ? (
                    <div className="flex flex-col gap-2">
                      {[1, 2, 3, 4, 5].map(i => <SkeletonTicket key={i} isDark={isDark} />)}
                    </div>
                  ) : filteredTickets.length === 0 ? (
                    <motion.div 
                      key="no-match"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className={`flex flex-col items-center justify-center py-20 rounded-2xl border border-dashed ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}
                    >
                      <motion.div
                        animate={{ y: [0, -10, 0] }}
                        transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                      >
                        <Filter className="w-12 h-12 text-slate-200 mb-4" />
                      </motion.div>
                      <p className={`font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>No tickets match your filter</p>
                      <button 
                        onClick={() => {
                          setFilterDept('');
                          setFilterStatus('');
                          setFilterDate('');
                          setSearchQuery('');
                        }}
                        className="mt-4 text-emerald-600 font-bold text-sm hover:underline"
                      >
                        Reset filters
                      </button>
                    </motion.div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {adminUser && filteredTickets.length > 0 && (
                        <div className="flex items-center gap-2 px-2 mb-1">
                          <input 
                            type="checkbox"
                            checked={selectedTickets.length === paginatedTickets.length && paginatedTickets.length > 0}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedTickets(paginatedTickets.map(t => t.id));
                              } else {
                                setSelectedTickets([]);
                              }
                            }}
                            className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                          />
                          <span className={`text-[10px] font-bold ${themeClasses.textMuted} capitalize tracking-wider`}>Pilih Semua di Halaman Ini</span>
                        </div>
                      )}
                      {paginatedTickets.map((ticket, index) => (
                            <motion.div
                              key={ticket.id}
                              layout
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, scale: 0.95 }}
                              whileHover={{ 
                                y: -2, 
                                scale: 1.01,
                                boxShadow: isDark ? "0 10px 30px -10px rgba(0,0,0,0.5)" : "0 10px 30px -10px rgba(16,185,129,0.1)"
                              }}
                              whileTap={{ scale: 0.99 }}
                              transition={{ 
                                delay: index * 0.04,
                                type: "spring",
                                stiffness: 260,
                                damping: 20
                              }}
                              className={`${themeClasses.card} rounded-xl p-2 shadow-sm hover:shadow-md transition-all group cursor-pointer relative overflow-hidden flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 ${
                                selectedTickets.includes(ticket.id) ? 'ring-2 ring-emerald-500 border-emerald-500' : ''
                              } ${
                                getSLAColor(ticket.created_at, ticket.status) || (isDark ? 'hover:border-emerald-900' : 'hover:border-emerald-100')
                              }`}
                              onClick={() => handleSelectTicket(ticket)}
                            >
                            <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                            
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              {adminUser && (
                                <div className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                                  <input 
                                    type="checkbox"
                                    checked={selectedTickets.includes(ticket.id)}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setSelectedTickets(prev => [...prev, ticket.id]);
                                      } else {
                                        setSelectedTickets(prev => prev.filter(id => id !== ticket.id));
                                      }
                                    }}
                                    className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                                  />
                                </div>
                              )}
                              <div className="flex-shrink-0">
                                <motion.div 
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                  animate={ticket.status === 'New' ? {
                                    scale: [1, 1.05, 1],
                                    boxShadow: ["0 0 0px rgba(245, 158, 11, 0)", "0 0 8px rgba(245, 158, 11, 0.3)", "0 0 0px rgba(245, 158, 11, 0)"]
                                  } : {}}
                                  transition={{ repeat: Infinity, duration: 2 }}
                                  className={`w-8 h-8 rounded-lg flex items-center justify-center border ${
                                    ticket.status === 'Completed' ? 'bg-emerald-50 border-emerald-100 text-emerald-600' :
                                    ticket.status === 'New' ? 'bg-amber-50 border-amber-100 text-amber-600' :
                                    'bg-blue-50 border-blue-100 text-blue-600'
                                  }`}
                                >
                                  {getStatusIcon(ticket.status)}
                                </motion.div>
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-2 mb-1">
                                  <div className="flex flex-wrap items-center gap-1.5">
                                    <span className="text-[9px] font-black text-slate-400 tracking-tighter">
                                      #<HighlightText text={ticket.ticket_no || ticket.id.toString().padStart(4, '0')} highlight={searchQuery} isDark={isDark} />
                                    </span>
                                    {adminUser?.role === 'Super Admin' && ticket.assigned_to && (
                                      <span className={`text-[8px] font-black px-1 py-0.5 rounded capitalize leading-none ${isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-600'}`}>@{ticket.assigned_to}</span>
                                    )}
                                    {getSLALabel(ticket.created_at, ticket.status) && (
                                      <span className="text-[8px] font-black px-1.5 py-0.5 rounded capitalize bg-rose-500 text-white leading-none whitespace-nowrap">{getSLALabel(ticket.created_at, ticket.status)}</span>
                                    )}
                                  </div>
                                  <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 sm:gap-1">
                                    <span className="flex items-center gap-1 text-[8px] sm:text-[9px] text-slate-400 font-medium whitespace-nowrap">
                                      <Calendar className="w-2.5 h-2.5 shrink-0" /> {formatDate(ticket.created_at)}
                                    </span>
                                    <span className={`px-1.5 py-0.5 rounded-full text-[7px] sm:text-[8px] font-black capitalize tracking-widest border text-center min-w-[55px] sm:min-w-[65px] inline-block ${getStatusColor(ticket.status)}`}>
                                      {ticket.status === 'In Progress' ? 'Progres' : 
                                       ticket.status === 'Completed' ? 'Selesai' : 
                                       ticket.status === 'Cancelled' ? 'Batal' : 
                                       ticket.status === 'New' ? 'Baru' : ticket.status}
                                    </span>
                                  </div>
                                </div>
                                <h3 className={`text-[11px] font-black truncate group-hover:text-emerald-600 transition-colors mb-1 ${themeClasses.text}`}>
                                  <HighlightText text={`${ticket.category} Request`} highlight={searchQuery} isDark={isDark} />
                                </h3>
                                
                                <div className="flex items-center justify-between gap-2">
                                  <div className={`flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                    <span className="flex items-center gap-1 truncate">
                                      <User className="w-2.5 h-2.5 text-slate-400 shrink-0" /> <HighlightText text={ticket.name} highlight={searchQuery} isDark={isDark} />
                                    </span>
                                    <span className="flex items-center gap-1 truncate">
                                      <Building2 className="w-2.5 h-2.5 text-slate-400 shrink-0" /> {ticket.department}
                                    </span>
                                  </div>
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleSelectTicket(ticket);
                                    }}
                                    className={`p-1 rounded-md transition-all ${isDark ? 'text-slate-400 hover:text-emerald-400' : 'text-slate-400 hover:text-emerald-600'}`}
                                    title="View Details"
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center justify-end gap-1.5 sm:pl-3 sm:border-l border-slate-50">
                              {adminUser?.role === 'Super Admin' && (
                                <div className="flex items-center gap-1">
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleIntervention(ticket.id, 'takeover');
                                    }}
                                    className="px-2 py-1 bg-emerald-500 text-white text-[8px] font-black capitalize rounded hover:bg-emerald-600 transition-colors"
                                  >
                                    Ambil
                                  </button>
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleIntervention(ticket.id, 'reassign');
                                    }}
                                    className="px-2 py-1 bg-blue-500 text-white text-[8px] font-black capitalize rounded hover:bg-blue-600 transition-colors"
                                  >
                                    Pindah
                                  </button>
                                </div>
                              )}
                              <div className="flex items-center gap-1">
                                {adminUser && (
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteTicket(ticket.id);
                                    }}
                                    className={`p-1.5 rounded-md transition-all ${isDark ? 'text-slate-400 hover:text-rose-400 hover:bg-rose-900/30' : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'}`}
                                    title="Delete Ticket"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                  )}
                </AnimatePresence>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-8">
                    <button 
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className={`p-2 rounded-xl border transition-all ${
                        currentPage === 1 
                        ? 'opacity-30 cursor-not-allowed' 
                        : isDark ? 'hover:bg-emerald-900/30 hover:border-emerald-800 text-slate-300' : 'hover:bg-emerald-50 hover:border-emerald-200 text-slate-600'
                      } ${themeClasses.card}`}
                    >
                      <ChevronRight className="w-4 h-4 rotate-180" />
                    </button>
                    
                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => {
                        // Only show first, last, and pages around current
                        if (
                          page === 1 || 
                          page === totalPages || 
                          (page >= currentPage - 1 && page <= currentPage + 1)
                        ) {
                          return (
                            <button
                              key={page}
                              onClick={() => setCurrentPage(page)}
                              className={`w-8 h-8 rounded-xl text-[10px] font-bold transition-all ${
                                currentPage === page
                                ? 'bg-emerald-600 text-white shadow-lg'
                                : `border hover:bg-emerald-50 ${themeClasses.card} ${themeClasses.textMuted}`
                              }`}
                            >
                              {page}
                            </button>
                          );
                        } else if (
                          (page === 2 && currentPage > 3) || 
                          (page === totalPages - 1 && currentPage < totalPages - 2)
                        ) {
                          return <span key={page} className="text-slate-400 px-1">...</span>;
                        }
                        return null;
                      })}
                    </div>

                    <button 
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className={`p-2 rounded-xl border transition-all ${
                        currentPage === totalPages 
                        ? 'opacity-30 cursor-not-allowed' 
                        : isDark ? 'hover:bg-emerald-900/30 hover:border-emerald-800 text-slate-300' : 'hover:bg-emerald-50 hover:border-emerald-200 text-slate-600'
                      } ${themeClasses.card}`}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* Bulk Action Bar */}
                <AnimatePresence>
                  {selectedTickets.length > 0 && (
                    <motion.div 
                      initial={{ y: 100, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: 100, opacity: 0 }}
                      className="fixed bottom-20 left-1/2 -translate-x-1/2 z-40 w-[90%] max-w-lg bg-slate-900 text-white rounded-2xl p-4 shadow-2xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-900/40">
                          <CheckCircle2 className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="text-xs font-black capitalize tracking-widest">{selectedTickets.length} Tiket Terpilih</p>
                          <p className="text-[10px] text-slate-400 font-medium">Lakukan aksi massal untuk tiket ini</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <button 
                          onClick={() => handleBulkAction('In Progress')}
                          className="flex-1 sm:flex-none px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded-xl text-[9px] font-black capitalize tracking-widest transition-all active:scale-95"
                        >
                          Progres
                        </button>
                        <button 
                          onClick={() => handleBulkAction('Completed')}
                          className="flex-1 sm:flex-none px-3 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-xl text-[9px] font-black capitalize tracking-widest transition-all active:scale-95"
                        >
                          Selesai
                        </button>
                        <button 
                          onClick={() => setSelectedTickets([])}
                          className="p-2 bg-slate-800 hover:bg-slate-700 rounded-xl transition-all"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
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
              <motion.button 
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowForm(true)}
                className={`w-full font-bold py-3 rounded-2xl text-xs transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2 ${
                  isDark ? 'bg-slate-900 text-white hover:bg-slate-800' : 'bg-white text-slate-900 hover:bg-slate-50'
                }`}
              >
                <motion.div
                  animate={{ 
                    scale: [1, 1.2, 1],
                    opacity: [1, 0.8, 1]
                  }}
                  transition={{ repeat: Infinity, duration: 2 }}
                >
                  <Send className="w-4 h-4 text-emerald-500" />
                </motion.div>
                Buat Tiket Sekarang
              </motion.button>
            </section>
          </div>
        </div>
      </main>

      <AnimatePresence>
        {/* --- MODAL: TICKET DETAIL --- */}
        {selectedTicket && (
          <TicketDetailModal
            selectedTicket={selectedTicket}
            setSelectedTicket={setSelectedTicket}
            isDark={isDark}
            themeClasses={themeClasses}
            adminUser={adminUser}
            users={users}
            ticketLogs={ticketLogs}
            modalStatus={modalStatus}
            setModalStatus={setModalStatus}
            modalPriority={modalPriority}
            setModalPriority={setModalPriority}
            handleIntervention={handleIntervention}
            handleUpdateClick={handleUpdateClick}
            formatDate={formatDate}
            getDeviceInfo={getDeviceInfo}
            getStatusColor={getStatusColor}
            STATUSES={STATUSES}
            primaryColor={primaryColor}
          />
        )}

        {/* --- MODAL: NEW TICKET FORM --- */}
        {showForm && (
          <NewTicketModal
            showForm={showForm}
            setShowForm={setShowForm}
            isDark={isDark}
            themeClasses={themeClasses}
            newTicket={formData}
            setNewTicket={setFormData}
            DEPARTMENTS={Array.isArray(departments) ? departments.map(d => d.name) : []}
            CATEGORIES={Array.isArray(categories) ? categories.map(c => c.name) : []}
            handlePhotoChange={handlePhotoUpload}
            handleSubmit={handleSubmit}
            isSubmitting={submitting}
            primaryColor={primaryColor}
            masterUsers={masterUsers}
          />
        )}

        {/* --- MODAL: MOBILE Filter --- */}
        {showMobileFilter && (
          <MobileFilterModal 
            show={showMobileFilter}
            onClose={() => setShowMobileFilter(false)}
            isDark={isDark}
            themeClasses={themeClasses}
            tempFilters={tempFilters}
            setTempFilters={setTempFilters}
            departments={departments}
            STATUSES={STATUSES}
            onReset={() => {
              setFilterDept('');
              setFilterStatus('');
              setFilterDate('');
              setSearchQuery('');
              setTempFilters({ dept: '', status: '', date: '', search: '' });
              setShowMobileFilter(false);
            }}
            onApply={() => {
              setFilterDept(tempFilters.dept);
              setFilterStatus(tempFilters.status);
              setFilterDate(tempFilters.date);
              setSearchQuery(tempFilters.search);
              setShowMobileFilter(false);
            }}
          />
        )}

        {/* Success Modal */}
        {showSuccess && (
          <SuccessModal 
            show={showSuccess}
            themeClasses={themeClasses}
          />
        )}

        {showLogin && (
          <LoginModal 
            showLogin={showLogin}
            setShowLogin={setShowLogin}
            isDark={isDark}
            themeClasses={themeClasses}
            loginData={loginData}
            setLoginData={setLoginData}
            handleLogin={handleLogin}
            primaryColor={primaryColor}
          />
        )}

        {showSettings && (
          <SettingsModal 
            showSettings={showSettings}
            setShowSettings={setShowSettings}
            isDark={isDark}
            themeClasses={themeClasses}
            settingsTab={settingsTab}
            setSettingsTab={setSettingsTab}
            appSettings={appSettings}
            setAppSettings={setAppSettings}
            LOGO_OPTIONS={LOGO_OPTIONS}
            newEmailInput={newEmailInput}
            setNewEmailInput={setNewEmailInput}
            showEmailInput={showEmailInput}
            setShowEmailInput={setShowEmailInput}
            handleUpdateSettings={handleUpdateSettings}
            primaryColor={primaryColor}
            adminUser={adminUser}
            itPersonnel={itPersonnel}
            departments={departments}
            categories={categories}
            addingType={addingType}
            setAddingType={setAddingType}
            newItemName={newItemName}
            setNewItemName={setNewItemName}
            newItemAssignedTo={newItemAssignedTo}
            setNewItemAssignedTo={setNewItemAssignedTo}
            handleManagementAction={handleManagementAction}
            masterUsers={masterUsers}
            adminUsers={adminUsers}
            handleUploadExcel={handleUploadExcel}
          />
        )}

        {showResetConfirm && (
          <ConfirmModal 
            show={showResetConfirm}
            onClose={() => setShowResetConfirm(false)}
            onConfirm={handleReset}
            title="Reset All Data?"
            message="This action will permanently delete all tickets in the queue. This cannot be undone."
            confirmText="Yes, Reset"
            isDark={isDark}
            themeClasses={themeClasses}
            type="danger"
          />
        )}

        {pendingUpdate && (
          <ConfirmModal 
            show={!!pendingUpdate}
            onClose={() => setPendingUpdate(null)}
            onConfirm={confirmUpdate}
            title="Konfirmasi Perubahan"
            message={pendingUpdate ? `Apakah Anda yakin ingin memperbarui status menjadi ${pendingUpdate.status} dan menyimpan data penanganan ini?` : ''}
            confirmText="Ya, Simpan"
            isDark={isDark}
            themeClasses={themeClasses}
            type="success"
          />
        )}

        {showTakeoverConfirm && (
          <TakeoverModal 
            showTakeoverConfirm={showTakeoverConfirm}
            setShowTakeoverConfirm={setShowTakeoverConfirm}
            isDark={isDark}
            users={users}
            executeIntervention={executeIntervention}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showImageManager && (
          <ImageManagerModal 
            show={showImageManager}
            setShow={setShowImageManager}
            isDark={isDark}
            themeClasses={themeClasses}
            primaryColor={primaryColor}
          />
        )}
      </AnimatePresence>

      <BottomNav 
        adminUser={adminUser}
        viewMode={viewMode}
        setViewMode={setViewMode}
        setShowForm={setShowForm}
        setShowLogin={setShowLogin}
        setShowSettings={setShowSettings}
        setShowImageManager={setShowImageManager}
        handleLogout={handleLogout}
        primaryColor={primaryColor}
        isDark={isDark}
        toggleTheme={toggleTheme}
        onSearchClick={() => setShowMobileFilter(true)}
      />

      <style>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 3s linear infinite;
        }
      `}</style>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
