import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import { motion, AnimatePresence } from 'framer-motion';
import { Toaster, toast } from 'react-hot-toast';
import { APP_VERSION, getEnvironment } from './version';
import { 
  Zap, 
  Send, 
  RefreshCcw, 
  CheckCircle2, 
  ShieldCheck,
  Clock,
  AlertCircle
} from 'lucide-react';

// Import modular components
import { Counter, Shimmer, HighlightText, SkeletonTicket } from './components/Common';
import { Header } from './components/Header';
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
import { AdminDashboard } from './components/AdminDashboard';
import { AssetManagement } from './components/AssetManagement';
import { TicketList } from './components/TicketList';

// Types, Constants, and Utils
import { ITicket, IUser, IDepartment, ICategory, IMasterUser, ISettings } from './types';
import { STATUSES, LOGO_OPTIONS, PRIORITIES } from './constants';
import { parseSafeDate, formatDate } from './utils/dateUtils';
import { getDeviceInfo } from './utils/deviceUtils';
import { getSLAColor, getSLALabel, processPhotoWithWatermark } from './utils/ticketUtils';
import { api } from './services/api';

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
      const details = await api.getTicketDetails(ticket.id);
      
      setSelectedTicket(prev => {
        if (prev && prev.id === ticket.id) {
          return { 
            ...prev, 
            photo: details.photo,
            face_photo: details.face_photo
          };
        }
        return prev;
      });

      if (Array.isArray(details.logs)) {
        setTicketLogs(details.logs);
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
  const [settingsTab, setSettingsTab] = useState<'general' | 'branding' | 'notifications' | 'data' | 'system'>('general');
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
  const [viewMode, setViewMode] = useState<'today' | 'all' | 'my_tickets' | 'dashboard'>(() => {
    return localStorage.getItem('adminUser') ? 'dashboard' : 'today';
  });
  const [showMobileFilter, setShowMobileFilter] = useState(false);
  const [tempFilters, setTempFilters] = useState({ dept: '', status: '', date: '', search: '' });
  const [appSettings, setAppSettings] = useState(() => {
    const saved = localStorage.getItem('appSettings');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse appSettings from localStorage', e);
      }
    }
    return { 
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
    };
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

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024 && viewMode === 'dashboard') {
        setViewMode('today');
      }
    };
    
    // Check on mount and resize
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [viewMode]);

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
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPhotoLoading(true);
    try {
      const base64 = await processPhotoWithWatermark(file, formData.latitude || 0, formData.longitude || 0);
      setFormData(prev => ({ ...prev, photo: base64 }));
    } catch (err) {
      console.error("Error processing photo:", err);
      toast.error("Gagal memproses foto. Pastikan izin lokasi diaktifkan.");
    } finally {
      setPhotoLoading(false);
    }
  };

  // API Health Check
  useEffect(() => {
    const checkHealth = async () => {
      try {
        const data = await api.checkHealth();
        console.log('API Health Check OK:', data);
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
      const data = await api.getTickets(adminUser?.username, adminUser?.role);
      
      if (Array.isArray(data)) {
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
      }
    } catch (err) {
      console.error('Failed to fetch tickets:', err);
      toast.error("Gagal mengambil tiket");
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const fetchManagementData = async () => {
    try {
      const results = await Promise.allSettled([
        api.getITPersonnel(),
        api.getDepartments(),
        api.getCategories(),
        api.getUsers(),
        api.getMasterUsers(),
        api.getAdminUsers()
      ]);

      if (results[0].status === 'fulfilled') setItPersonnel(results[0].value);
      if (results[1].status === 'fulfilled') setDepartments(results[1].value);
      if (results[2].status === 'fulfilled') setCategories(results[2].value);
      if (results[3].status === 'fulfilled') setUsers(results[3].value);
      if (results[4].status === 'fulfilled') setMasterUsers(results[4].value);
      if (results[5].status === 'fulfilled') setAdminUsers(results[5].value);
    } catch (err) {
      console.error('Failed to fetch management data:', err);
    }
  };

  /**
   * Mengambil pengaturan aplikasi (Nama & Logo)
   */
  const fetchSettings = async () => {
    try {
      const data = await api.getSettings();
      if (data && data.app_name) {
        setAppSettings(prev => {
          const newSettings = {
            ...prev,
            ...data,
            theme_mode: data.theme_mode || prev.theme_mode,
            primary_color: data.primary_color || prev.primary_color,
            admin_theme_mode: data.admin_theme_mode || prev.admin_theme_mode,
            admin_primary_color: data.admin_primary_color || prev.admin_primary_color,
            notification_emails: data.notification_emails ? (typeof data.notification_emails === 'string' ? JSON.parse(data.notification_emails) : data.notification_emails) : prev.notification_emails,
            telegram_bot_token: data.telegram_bot_token || prev.telegram_bot_token,
            telegram_chat_ids: data.telegram_chat_ids ? (typeof data.telegram_chat_ids === 'string' ? JSON.parse(data.telegram_chat_ids) : data.telegram_chat_ids) : prev.telegram_chat_ids
          };
          localStorage.setItem('appSettings', JSON.stringify(newSettings));
          return newSettings;
        });
      }
    } catch (err) {
      console.error('Failed to fetch settings:', err);
    }
  };

  const handleUploadExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const data = await api.uploadMasterUsers(file);
      if (data) {
        toast.success(`Berhasil mengunggah ${data.count} user.`);
        fetchManagementData();
      }
    } catch (err: any) {
      console.error('Upload error:', err);
      toast.error(`Gagal mengunggah file: ${err.message || 'Terjadi kesalahan'}`);
    } finally {
      // reset input
      e.target.value = '';
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
    const initApp = async () => {
      setLoading(true);
      // Start fetching everything, but only wait for critical data
      const criticalPromises = [
        fetchTickets(),
        fetchSettings()
      ];
      
      // Management data can be fetched in background if it's not immediately needed
      // but we still start it now
      const managementPromise = fetchManagementData();
      
      await Promise.all(criticalPromises);
      
      // If user is admin, we might want to wait for management data too
      if (adminUser) {
        await managementPromise;
      }
      
      // Minimal delay for smooth transition
      setTimeout(() => setLoading(false), 300);
    };
    
    initApp();
    const interval = setInterval(() => fetchTickets(false), 10000);
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
      const data = await api.login(loginData);
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
        fetchTickets();
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

      const data = await api.updateTicket(ticketId, body);
      
      if (data) {
        fetchTickets();
        if (selectedTicket && selectedTicket.id === ticketId) {
          setSelectedTicket(null);
        }
        setShowTakeoverConfirm(null);
        toast.success(type === 'takeover' ? 'Tiket berhasil diambil alih' : 'Tiket berhasil dialihkan');
      }
    } catch (err) {
      console.error('Intervention failed:', err);
      toast.error('Gagal melakukan intervensi');
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
      const data = await api.resetTickets();
      if (data) {
        setTickets([]);
        fetchTickets();
        setShowResetConfirm(false);
        toast.success('Semua data berhasil direset.');
      }
    } catch (err) {
      console.error('Reset error:', err);
      toast.error('Gagal meriset data');
    }
  };

  const handleDeleteTicket = async (id: number) => {
    if (!confirm('Hapus tiket ini secara permanen?')) return;
    try {
      const data = await api.deleteTicket(id);
      if (data) {
        toast.success('Tiket berhasil dihapus');
        fetchTickets();
      }
    } catch (err) {
      console.error('Delete ticket error:', err);
      toast.error('Gagal menghapus tiket');
    }
  };

  const handleManagementAction = async (type: 'it' | 'dept' | 'cat' | 'master-user' | 'admin-user', action: 'add' | 'delete' | 'refresh', data?: any) => {
    try {
      if (type === 'master-user') {
        const masterUsersData = await api.getMasterUsers();
        setMasterUsers(masterUsersData);
        return;
      }
      
      if (type === 'admin-user') {
        const [adminData, usersData] = await Promise.all([
          api.getAdminUsers(),
          api.getUsers()
        ]);
        setAdminUsers(adminData);
        setUsers(usersData);
        return;
      }

      const label = type === 'it' ? 'IT' : type === 'dept' ? 'Departemen' : 'Kategori';
      
      if (action === 'add') {
        if (!newItemName.trim()) return;
        
        let result;
        if (type === 'it') result = await api.addITPersonnel({ name: newItemName.trim() });
        else if (type === 'dept') result = await api.addDepartment({ name: newItemName.trim() });
        else if (type === 'cat') result = await api.addCategory({ name: newItemName.trim(), assigned_to: newItemAssignedTo });
        
        if (result) {
          setNewItemName('');
          setNewItemAssignedTo('');
          setAddingType(null);
          toast.success(`${label} berhasil ditambahkan`);
        }
      } else {
        if (!confirm(`Hapus ${label} "${data.name}"?`)) return;
        
        let result;
        if (type === 'it') result = await api.deleteITPersonnel(data.id);
        else if (type === 'dept') result = await api.deleteDepartment(data.id);
        else if (type === 'cat') result = await api.deleteCategory(data.id);
        
        if (result) {
          toast.success(`${label} berhasil dihapus`);
        }
      }
      
      await fetchManagementData();
    } catch (err: any) {
      console.error(`Management action error (${type}/${action}):`, err);
      toast.error(`Error: ${err.message}`);
    }
  };

  /**
   * Memperbarui pengaturan aplikasi
   */
  const handleUpdateSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Update global settings
      const data = await api.updateSettings({
        ...appSettings,
        notification_emails: JSON.stringify(appSettings.notification_emails),
        telegram_chat_ids: JSON.stringify(appSettings.telegram_chat_ids)
      });

      if (data) {
        // If admin is logged in, also update their personal settings
        if (adminUser) {
          await api.updateUserSettings(adminUser.username, {
            theme_mode: appSettings.admin_theme_mode,
            primary_color: appSettings.admin_primary_color
          });
          
          // Update local adminUser state to reflect changes
          const updatedAdmin = {
            ...adminUser,
            theme_mode: appSettings.admin_theme_mode,
            primary_color: appSettings.admin_primary_color
          };
          setAdminUser(updatedAdmin);
          localStorage.setItem('adminUser', JSON.stringify(updatedAdmin));
        }
        
        toast.success('Pengaturan berhasil diperbarui!');
        setShowSettings(false);
        fetchSettings();
      }
    } catch (err) {
      console.error('Failed to update settings:', err);
      toast.error('Gagal memperbarui pengaturan.');
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
      const data = await api.createTicket(formData);
      if (data) {
        clearDraft();
        setShowForm(false);
        toast.success('Tiket berhasil dikirim!');
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
        fetchTickets();
      }
    } catch (err) {
      console.error('Failed to submit ticket:', err);
      toast.error('Gagal mengirim tiket.');
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
    if (!pendingUpdate || !adminUser) return;
    try {
      const data = await api.updateTicket(pendingUpdate.id, {
        status: pendingUpdate.status,
        assigned_to: pendingUpdate.assigned_to,
        admin_reply: pendingUpdate.admin_reply,
        internal_notes: pendingUpdate.internal_notes,
        priority: (pendingUpdate as any).priority,
        performed_by: adminUser.username
      });
      
      if (data) {
        toast.success('Tiket berhasil diperbarui!');
        setPendingUpdate(null);
        fetchTickets();
      }
    } catch (err) {
      console.error('Failed to update ticket:', err);
      toast.error('Gagal memperbarui tiket.');
    }
  };

  const handleBulkAction = async (status: string) => {
    if (selectedTickets.length === 0 || !adminUser) return;
    if (!confirm(`Update ${selectedTickets.length} tiket menjadi ${status}?`)) return;
    
    setLoading(true);
    try {
      await Promise.all(selectedTickets.map(id => 
        api.updateTicket(id, {
          status,
          performed_by: adminUser.username
        })
      ));
      toast.success(`${selectedTickets.length} tiket berhasil diperbarui!`);
      setSelectedTickets([]);
      fetchTickets();
    } catch (err) {
      console.error('Bulk update error:', err);
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

      <main className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 py-2 sm:py-4 pb-20 lg:pb-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 lg:gap-6">
          {/* --- SIDEBAR: STATS & INFO --- */}
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
            viewMode={viewMode}
            setViewMode={setViewMode}
          />

          {/* --- MAIN CONTENT --- */}
          {viewMode === 'dashboard' ? (
            <div className="lg:col-span-2 space-y-2 sm:space-y-3">
              <AdminDashboard 
                tickets={tickets}
                adminUser={adminUser}
                isDark={isDark}
                themeClasses={themeClasses}
                setViewMode={setViewMode}
              />
            </div>
          ) : viewMode === 'assets' ? (
            <div className="lg:col-span-2 space-y-2 sm:space-y-3">
              <AssetManagement 
                isDark={isDark}
                themeClasses={themeClasses}
                primaryColor={primaryColor}
              />
            </div>
          ) : (
            <TicketList 
              adminUser={adminUser}
              isDark={isDark}
              themeClasses={themeClasses}
              viewMode={viewMode}
              setViewMode={setViewMode}
              filterDept={filterDept}
              setFilterDept={setFilterDept}
              filterStatus={filterStatus}
              setFilterStatus={setFilterStatus}
              filterDate={filterDate}
              setFilterDate={setFilterDate}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              loading={loading}
              tickets={tickets}
              filteredTickets={filteredTickets}
              paginatedTickets={paginatedTickets}
              currentPage={currentPage}
              setCurrentPage={setCurrentPage}
              totalPages={totalPages}
              itemsPerPage={itemsPerPage}
              handleSelectTicket={handleSelectTicket}
              handleDeleteTicket={handleDeleteTicket}
              handleIntervention={handleIntervention}
              getStatusIcon={getStatusIcon}
              getStatusColor={getStatusColor}
              formatDate={formatDate}
              fetchTickets={fetchTickets}
              setShowMobileFilter={setShowMobileFilter}
              setTempFilters={setTempFilters}
              selectedTickets={selectedTickets}
              setSelectedTickets={setSelectedTickets}
              primaryColor={primaryColor}
              CurrentLogo={CurrentLogo}
              setShowForm={setShowForm}
              handleBulkAction={handleBulkAction}
            />
          )}

                {/* Help CTA - Visible on mobile at the bottom */}
            <section 
              className="lg:hidden rounded-3xl p-4 sm:p-5 text-white shadow-xl relative overflow-hidden group transition-all mt-4 sm:mt-6"
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
            
            {/* App Version Info - Mobile Only */}
            <div className="lg:hidden flex flex-col items-center justify-center py-4 opacity-30">
              <p className={`text-[9px] font-bold tracking-widest ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                IT HELPDESK K3DK v{APP_VERSION} ({getEnvironment()})
              </p>
              <p className={`text-[7px] font-medium ${isDark ? 'text-slate-600' : 'text-slate-500'}`}>
                © 2026 Professional Ticketing System
              </p>
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
