import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { motion, AnimatePresence } from 'framer-motion';
import { Toaster, toast } from 'react-hot-toast';

const safeGetItem = (key: string) => {
  try { return localStorage.getItem(key); } catch (e) { return null; }
};

const safeSetItem = (key: string, value: string) => {
  try { localStorage.setItem(key, value); } catch (e) {}
};

const safeRemoveItem = (key: string) => {
  try { localStorage.removeItem(key); } catch (e) {}
};

import { APP_VERSION, getEnvironment } from './version';
import { 
  Zap, 
  Send, 
  RefreshCcw, 
  CheckCircle2, 
  ShieldCheck,
  Clock,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Menu,
  BarChart3, 
  Printer, 
  Package, 
  UserPlus, 
  TrendingUp, 
  Activity, 
  FileText, 
  BookOpen, 
  Settings2,
  Database,
  Users,
  MonitorSmartphone
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
import { UserLoginScreen } from './components/UserLoginScreen';
import { BottomNav } from './components/BottomNav';
import { TakeoverModal } from './components/modals/TakeoverModal';
import { SuccessModal } from './components/modals/SuccessModal';
import { MobileFilterModal } from './components/modals/MobileFilterModal';
import { ImageManagerModal } from './components/modals/ImageManagerModal';
import { SplashScreen } from './components/SplashScreen';
import { hapticFeedback } from './utils/haptics';
import { AdminDashboard } from './components/AdminDashboard';
import { Panduan } from './components/Panduan';
import { AssetManagement } from './components/AssetManagement';
import { ProjectEvaluation } from './components/ProjectEvaluation';
import NetworkMonitor from './components/NetworkMonitor';
import BeritaAcara from './components/BeritaAcara';
import { MembershipManagement } from './components/MembershipManagement';
import { MembershipJournalForm } from './components/MembershipJournalForm';
import { MobileAppNav } from './components/MobileAppNav';
import { TicketList } from './components/TicketList';
import { TestingView } from './components/TestingView';
import { VoucherManagement } from './components/VoucherManagement';
import { MasterUserManagement } from './components/MasterUserManagement';
import { MasterPerangkatPlaceholder } from './components/MasterPerangkatPlaceholder';

// Types, Constants, and Utils
import { ITicket, IUser, IDepartment, ICategory, IMasterUser, ISettings, ViewMode } from './types';
import { STATUSES, LOGO_OPTIONS, PRIORITIES } from './constants';
import { parseSafeDate, formatDate } from './utils/dateUtils';
import { getDeviceInfo } from './utils/deviceUtils';
import { getSLAColor, getSLALabel, processPhotoWithWatermark } from './utils/ticketUtils';
import { api } from './services/api';

import { 
  useTickets, 
  useTicketDetails, 
  useSettings, 
  useManagementData, 
  useCreateTicket, 
  useUpdateTicket, 
  useDeleteTicket,
  useSyncOffline,
  usePublicData
} from './hooks/useQueries';
import { useQueryClient } from '@tanstack/react-query';
import { WifiOff, CloudUpload } from 'lucide-react';

export default function App() {
  const queryClient = useQueryClient();

  // --- State Management ---
  const [adminUser, setAdminUser] = useState<any>(null); // Data login admin
  const [adminThemeLayout, setAdminThemeLayout] = useState<string>(() => {
    return safeGetItem('adminThemeLayout') || 'modern';
  });
  const [currentUser, setCurrentUser] = useState<any>(() => {
    const saved = safeGetItem('currentUser');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return null;
  }); // Data login user biasa
  const [appSettings, setAppSettings] = useState<any>(() => {
    const saved = safeGetItem('appSettings');
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
      custom_pwa_icon: '',
      custom_favicon: '',
      notification_emails: [] as string[],
      telegram_bot_token: '',
      telegram_chat_ids: [] as string[],
      smtp_host: '',
      smtp_port: '465',
      smtp_user: '',
      smtp_pass: '',
      smtp_from: '',
      photo_cleanup_duration: '24',
      login_guide_enabled: true,
      login_guide_content: 'Langkah-langkah Login:\n1. Pilih nama Anda pada pilihan "Nama Anda".\n2. Ketik Index KDK/GGF Anda dengan benar.\n3. Tekan tombol "Masuk" untuk masuk ke dashboard.\n\nJika nama Anda belum terdaftar, silakan hubungi tim Admin IT.',
      sla_critical_hours: 5,
      sla_delayed_hours: 2
    };
  }); // Pengaturan nama & logo app

  // --- React Query Hooks ---
  const { data: ticketsData, isLoading: ticketsLoading } = useTickets(adminUser?.username, adminUser?.role);
  const tickets = ticketsData || [];
  
  const { data: settingsData } = useSettings();
  const { data: managementData } = useManagementData(!!adminUser);
  const { data: publicData } = usePublicData();
  const { pendingCount, isSyncing, sync } = useSyncOffline();

  useEffect(() => {
    if (settingsData) {
      const parsedData = { ...settingsData };
      if (typeof parsedData.notification_emails === 'string') {
        try { parsedData.notification_emails = JSON.parse(parsedData.notification_emails); } catch(e){}
      }
      if (typeof parsedData.telegram_chat_ids === 'string') {
        try { parsedData.telegram_chat_ids = JSON.parse(parsedData.telegram_chat_ids); } catch(e){}
      }
      setAppSettings(prev => ({ ...prev, ...parsedData }));
      safeSetItem('appSettings', JSON.stringify({ ...appSettings, ...parsedData }));
    }
  }, [settingsData]);

  const { 
    it: itPersonnel, 
    depts: departments, 
    cats: categories, 
    users, 
    masters: masterUsers, 
    admins: adminUsers 
  } = useMemo(() => {
    if (adminUser && managementData) return {
      it: managementData.it || [],
      depts: managementData.depts || [],
      cats: managementData.cats || [],
      users: managementData.users || [],
      masters: managementData.masters || [],
      admins: managementData.admins || []
    };
    if (publicData) return { 
      it: [], 
      depts: publicData.depts || [], 
      cats: publicData.cats || [], 
      users: [], 
      masters: publicData.masters || [], 
      admins: [] 
    };
    return { it: [], depts: [], cats: [], users: [], masters: [], admins: [] };
  }, [adminUser, managementData, publicData]);

  const loggedInMasterUser = useMemo(() => {
    if (!currentUser) return null;
    return masterUsers.find((u: any) => u.full_name === currentUser.full_name || u.employee_index === currentUser.employee_index);
  }, [currentUser, masterUsers]);

  const userCanVoucher = useMemo(() => {
    return loggedInMasterUser?.can_request_voucher === 1;
  }, [loggedInMasterUser]);

  const createTicketMutation = useCreateTicket();
  const updateTicketMutation = useUpdateTicket();
  const deleteTicketMutation = useDeleteTicket();

  const [ticketLogs, setTicketLogs] = useState<any[]>([]); // Riwayat tiket
  const [selectedTicket, setSelectedTicket] = useState<ITicket | null>(null); // Tiket yang sedang dilihat detailnya
  const { data: ticketDetails } = useTicketDetails(selectedTicket?.id || null);
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
    device_type: '',
    pc_code: '',
    latitude: null as number | null,
    longitude: null as number | null
  });
  const [selectedTickets, setSelectedTickets] = useState<number[]>([]);

  useEffect(() => {
    if (ticketDetails && selectedTicket) {
      setSelectedTicket(prev => {
        if (prev && prev.id === selectedTicket.id) {
          return { 
            ...prev, 
            photo: ticketDetails.photo,
            face_photo: ticketDetails.face_photo
          };
        }
        return prev;
      });
      if (Array.isArray(ticketDetails.logs)) {
        setTicketLogs(ticketDetails.logs);
      }
    }
  }, [ticketDetails]);

  const handleSelectTicket = async (ticket: ITicket) => {
    setSelectedTicket(ticket);
    setTicketLogs([]);
  };

  const fetchTickets = useCallback(async (showLoading = false) => {
    if (showLoading) setLoading(true);
    await queryClient.invalidateQueries({ queryKey: ['tickets'] });
    if (showLoading) setLoading(false);
  }, [queryClient]);
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

  const [loading, setLoading] = useState(false); // Loading state untuk fetch data awal
  const [showForm, setShowForm] = useState(false); // Toggle modal buat tiket baru
  const [showSuccess, setShowSuccess] = useState(false); // Toggle modal sukses
  const [showLogin, setShowLogin] = useState(false); // Toggle modal login admin
  const [loginData, setLoginData] = useState({ username: '', password: '' });
  const [showSettings, setShowSettings] = useState(false); // Toggle modal pengaturan aplikasi
  const [showImageManager, setShowImageManager] = useState(false); // Toggle modal manajemen gambar
  const [settingsTab, setSettingsTab] = useState<'general' | 'branding' | 'login' | 'notifications' | 'data' | 'system' | 'panduan' | 'sla'>('general');
  const [showResetConfirm, setShowResetConfirm] = useState(false); // Toggle konfirmasi reset data
  const [showTakeoverConfirm, setShowTakeoverConfirm] = useState<{id: number, type: 'takeover' | 'reassign', targetUser?: string} | null>(null);
  const [showDistribution, setShowDistribution] = useState(false); // Toggle distribusi masalah
  const [pendingUpdate, setPendingUpdate] = useState<{id: number, status: string, assigned_to: string | null, admin_reply: string | null, internal_notes: string | null} | null>(null); // Data update yang menunggu konfirmasi
  const [addingType, setAddingType] = useState<'it' | 'dept' | 'cat' | 'master-user' | 'admin-user' | null>(null);
  const [newItemName, setNewItemName] = useState('');
  const [newItemAssignedTo, setNewItemAssignedTo] = useState('');
  const [newEmailInput, setNewEmailInput] = useState('');
  const [showEmailInput, setShowEmailInput] = useState(false);
  const [gpsStatus, setGpsStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const location = useLocation();
  const navigate = useNavigate();

  const getViewModeFromPath = (path: string, hasAdmin: boolean): ViewMode => {
    const p = path.replace(/^\//, '');
    let view = p === '' ? (hasAdmin ? 'dashboard' : 'today') : p;

    // Admin only routes fallback
    if (!hasAdmin && ['dashboard', 'assets', 'network', 'membership', 'evaluasi_project', 'voucher', 'master_user', 'master_perangkat'].includes(view)) {
      if (view === 'voucher' && userCanVoucher) {
        // Allowed
      } else {
        view = 'today';
      }
    }

    if (['today', 'all', 'my_tickets', 'dashboard', 'assets', 'network', 'ba', 'panduan', 'settings', 'testing', 'membership', 'evaluasi_project', 'jurnal', 'voucher', 'master_user', 'master_perangkat'].includes(view)) {
      return view as ViewMode;
    }
    return hasAdmin ? 'dashboard' : 'today';
  };

  const viewMode = getViewModeFromPath(location.pathname, !!adminUser);

  const setViewMode = (mode: ViewMode) => {
    if (mode === (adminUser ? 'dashboard' : 'today')) {
      navigate('/');
    } else {
      navigate(`/${mode}`);
    }
  };

  useEffect(() => {
    const expectedPath = viewMode === (adminUser ? 'dashboard' : 'today') ? '/' : `/${viewMode}`;
    if (location.pathname !== expectedPath) {
      navigate(expectedPath, { replace: true });
    }
  }, [viewMode, adminUser, location.pathname, navigate]);

  const [userIdentifier, setUserIdentifier] = useState<string>(() => {
    return safeGetItem('userIdentifier') || '';
  });
  const [showMobileFilter, setShowMobileFilter] = useState(false);
  const [tempFilters, setTempFilters] = useState({ dept: '', status: '', date: '', search: '' });

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
    const savedDraft = safeGetItem('ticket_draft');
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
      safeSetItem('ticket_draft', JSON.stringify(formData));
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

  React.useEffect(() => {
    if (currentUser) {
      setFormData(prev => ({
        ...prev,
        name: currentUser.full_name || '',
        department: currentUser.department || '',
        phone: currentUser.phone || ''
      }));
    }
  }, [currentUser]);

  const clearDraft = () => {
    safeRemoveItem('ticket_draft');
    setFormData({
      name: currentUser ? currentUser.full_name : '',
      department: currentUser ? currentUser.department : '',
      category: '',
      phone: currentUser ? currentUser.phone : '',
      priority: 'Medium',
      description: '',
      photo: '',
      face_photo: '',
      device_type: '',
      pc_code: '',
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
      } else if (viewMode === 'my_tickets') {
        if (adminUser) {
          // Admin view: tickets assigned to me
          if (ticket.assigned_to !== adminUser.username && ticket.assigned_to !== adminUser.full_name) return false;
        } else {
          // User view: tickets I submitted
          if (currentUser) {
            const userName = currentUser.full_name.toLowerCase();
            const userPhone = currentUser.phone ? currentUser.phone.toLowerCase() : '';
            if (
              ticket.name.toLowerCase() !== userName &&
              (userPhone === '' || ticket.phone.toLowerCase() !== userPhone)
            ) {
              return false;
            }
          } else {
            if (!userIdentifier) return false;
            const search = userIdentifier.toLowerCase();
            if (
              ticket.phone.toLowerCase() !== search && 
              ticket.name.toLowerCase() !== search &&
              !ticket.ticket_no.toLowerCase().includes(search)
            ) return false;
          }
        }
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
   * Notification logic for Admin
   */
  useEffect(() => {
    if (adminUser && lastTicketIdRef.current !== null && tickets.length > 0) {
      const newTickets = tickets.filter(t => t.id > lastTicketIdRef.current!);
      if (newTickets.length > 0) {
        newTickets.forEach(ticket => {
          hapticFeedback.notification();
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
    if (tickets.length > 0) {
      const maxId = Math.max(...tickets.map(t => t.id));
      if (lastTicketIdRef.current === null || maxId > lastTicketIdRef.current) {
        lastTicketIdRef.current = maxId;
      }
    } else if (lastTicketIdRef.current === null) {
      lastTicketIdRef.current = 0;
    }
  }, [tickets, adminUser]);

  const handleUploadExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const data = await api.uploadMasterUsers(file);
      if (data) {
        toast.success(`Berhasil mengunggah ${data.count} user.`);
        queryClient.invalidateQueries({ queryKey: ['managementData'] });
        queryClient.invalidateQueries({ queryKey: ['publicData'] });
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
   * Inisialisasi data
   */
  useEffect(() => {
    const savedAdmin = safeGetItem('adminUser');
    if (savedAdmin) setAdminUser(JSON.parse(savedAdmin));
  }, []);

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
    const socket = io({ transports: ['websocket'] });
    
    socket.on('ticket_created', (newTicket) => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
    });

    socket.on('ticket_updated', (updatedData) => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      
      // Update selected ticket if it's the one that was updated
      setSelectedTicket(prev => {
        if (prev && prev.id === Number(updatedData.id)) {
          return { ...prev, ...updatedData };
        }
        return prev;
      });
    });

    socket.on('master_data_updated', () => {
      queryClient.invalidateQueries({ queryKey: ['managementData'] });
      queryClient.invalidateQueries({ queryKey: ['publicData'] });
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const handleUserLogin = (user: any) => {
    setCurrentUser(user);
    safeSetItem('currentUser', JSON.stringify(user));
  };

  /**
   * Menangani proses login admin
   */
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = await api.login(loginData);
      if (data.success) {
        setAdminUser(data.user);
        safeSetItem('adminUser', JSON.stringify(data.user));
        setShowLogin(false);
        setLoginData({ username: '', password: '' });
        setViewMode('all');
        
        // Request Notification Permission
        if (typeof window !== 'undefined' && "Notification" in window && Notification.permission === "default") {
          Notification.requestPermission();
        }
        
        // Re-fetch tickets with user context
        queryClient.invalidateQueries({ queryKey: ['tickets'] });
        queryClient.invalidateQueries({ queryKey: ['managementData'] });
      } else {
        alert('Login failed: ' + data.error);
      }
    } catch (err) {
      alert('Login error');
    }
  };

  const executeIntervention = async (ticketId: number, type: 'takeover' | 'reassign', targetUser?: string) => {
    if (!adminUser || adminUser.role !== 'Super Admin') return;
    
    const body: any = {};
    if (type === 'takeover') body.takeover_by = adminUser.username;
    if (type === 'reassign') body.reassign_to = targetUser;
    body.performed_by = adminUser.username;

    updateTicketMutation.mutate({ id: ticketId, data: body }, {
      onSuccess: () => {
        if (selectedTicket && selectedTicket.id === ticketId) {
          setSelectedTicket(null);
        }
        setShowTakeoverConfirm(null);
      }
    });
  };

  const handleIntervention = (ticketId: number, type: 'takeover' | 'reassign', targetUser?: string) => {
    setShowTakeoverConfirm({ id: ticketId, type, targetUser });
  };

  /**
   * Menangani logout admin
   */
  const handleLogout = () => {
    setAdminUser(null);
    safeRemoveItem('adminUser');
    setCurrentUser(null);
    safeRemoveItem('currentUser');
    setViewMode('today');
  };

  /**
   * Menghapus semua data tiket (Hanya Admin)
   */
  const handleReset = async () => {
    try {
      const data = await api.resetTickets();
      if (data) {
        queryClient.invalidateQueries({ queryKey: ['tickets'] });
        setShowResetConfirm(false);
        toast.success('Semua data berhasil direset.');
        hapticFeedback.heavy();
      }
    } catch (err) {
      console.error('Reset error:', err);
      toast.error('Gagal meriset data');
    }
  };

  const handleDeleteTicket = async (id: number) => {
    if (!confirm('Hapus tiket ini secara permanen?')) return;
    deleteTicketMutation.mutate(id);
  };

  const handleManagementAction = async (type: 'it' | 'dept' | 'cat' | 'master-user' | 'admin-user', action: 'add' | 'delete' | 'refresh', data?: any) => {
    try {
      if (type === 'master-user' || type === 'admin-user') {
        queryClient.invalidateQueries({ queryKey: ['managementData'] });
        queryClient.invalidateQueries({ queryKey: ['publicData'] });
        return;
      }

      if (action === 'refresh') {
        queryClient.invalidateQueries({ queryKey: ['managementData'] });
        queryClient.invalidateQueries({ queryKey: ['publicData'] });
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
          hapticFeedback.light();
        }
      } else {
        if (!confirm(`Hapus ${label} "${data.name}"?`)) return;
        
        let result;
        if (type === 'it') result = await api.deleteITPersonnel(data.id);
        else if (type === 'dept') result = await api.deleteDepartment(data.id);
        else if (type === 'cat') result = await api.deleteCategory(data.id);
        
        if (result) {
          toast.success(`${label} berhasil dihapus`);
          hapticFeedback.medium();
        }
      }
      
      queryClient.invalidateQueries({ queryKey: ['managementData'] });
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
          safeSetItem('adminUser', JSON.stringify(updatedAdmin));
        }
        
        toast.success('Pengaturan berhasil diperbarui!');
        setShowSettings(false);
        queryClient.invalidateQueries({ queryKey: ['settings'] });
        hapticFeedback.light();
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
    createTicketMutation.mutate(formData, {
      onSuccess: (data) => {
        if (data) {
          // Save user identifier for portal
          if (formData.phone) {
            setUserIdentifier(formData.phone);
            safeSetItem('userIdentifier', formData.phone);
          }
          clearDraft();
          setShowForm(false);
          setShowSuccess(true);
          // Don't auto-hide if we want them to click a button, 
          // but for now let's keep it and just add buttons to the modal.
          setTimeout(() => setShowSuccess(false), 5000);
        }
      },
      onSettled: () => {
        setSubmitting(false);
      }
    });
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
    updateTicketMutation.mutate({
      id: pendingUpdate.id,
      data: {
        status: pendingUpdate.status,
        assigned_to: pendingUpdate.assigned_to,
        admin_reply: pendingUpdate.admin_reply,
        internal_notes: pendingUpdate.internal_notes,
        priority: (pendingUpdate as any).priority,
        performed_by: adminUser.username
      }
    }, {
      onSuccess: () => {
        setPendingUpdate(null);
      }
    });
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
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      hapticFeedback.medium();
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
      case 'New': return 'bg-indigo-500 text-white border-indigo-600';
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
  const primaryColor = useMemo(() => {
    if (adminUser) {
      if (adminThemeLayout === 'cosmic') return '#0d9488'; // Neon Teal
      if (adminThemeLayout === 'compact') return '#f43f5e'; // Rose
      if (adminThemeLayout === 'executive') return '#d97706'; // Amber/Gold
      return adminUser.primary_color || '#8b5cf6'; // Violet
    }
    return appSettings.primary_color;
  }, [adminUser, adminThemeLayout, appSettings.primary_color, adminUser?.primary_color]);

  // Sync dark mode class with HTML element
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

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
    appleLink.href = appSettings.custom_pwa_icon ? `/api/branding/pwa-icon?v=${ts}` : (appSettings.custom_logo ? `/api/branding/logo?v=${ts}` : (appSettings.custom_favicon ? `/api/branding/favicon?v=${ts}` : "https://cdn-icons-png.flaticon.com/512/2906/2906274.png"));

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
  }, [appSettings.custom_favicon, appSettings.custom_logo, appSettings.custom_pwa_icon, appSettings.app_name, primaryColor, isDark]);

  // Theme-aware color variables
  const themeClasses = useMemo(() => {
    if (!adminUser) {
      return {
        bg: isDark ? 'bg-slate-950 text-slate-100' : 'bg-[#F8FAFC] text-slate-900',
        header: isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white/80 border-slate-200',
        card: isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200',
        text: isDark ? 'text-slate-100' : 'text-slate-900',
        textMuted: isDark ? 'text-slate-400' : 'text-slate-500',
        border: isDark ? 'border-slate-800' : 'border-slate-200',
        bgSecondary: isDark ? 'bg-slate-800' : 'bg-slate-100',
        input: isDark ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-750' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50',
        selection: 'selection:bg-emerald-500/30'
      };
    }

    if (adminThemeLayout === 'cosmic') {
      return {
        bg: isDark 
          ? 'bg-[#030712] text-teal-50 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-teal-950/20 via-slate-950 to-slate-950' 
          : 'bg-[#f0fdfa] text-slate-900 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-teal-500/5 via-slate-50 to-slate-50',
        header: isDark 
          ? 'bg-slate-950/40 backdrop-blur-xl border-teal-500/20 shadow-[0_0_20px_rgba(13,148,136,0.05)]' 
          : 'bg-white/40 backdrop-blur-xl border-teal-500/20 shadow-[0_0_20px_rgba(13,148,136,0.03)]',
        card: isDark 
          ? 'bg-slate-900/40 backdrop-blur-md border border-teal-500/10 shadow-[0_4px_30px_rgba(0,0,0,0.3)]' 
          : 'bg-white/60 backdrop-blur-md border border-teal-500/20 shadow-[0_4px_30px_rgba(13,148,136,0.02)]',
        text: isDark ? 'text-teal-50' : 'text-slate-900',
        textMuted: isDark ? 'text-teal-400/70' : 'text-slate-500',
        border: 'border-teal-500/10 dark:border-teal-500/20',
        bgSecondary: isDark ? 'bg-teal-950/30' : 'bg-teal-50/50',
        input: isDark 
          ? 'bg-slate-900/30 border-teal-500/20 text-teal-100 hover:border-teal-500/40 focus:border-teal-500 focus:ring-teal-500/30' 
          : 'bg-white/50 border-teal-500/20 text-slate-800 hover:border-teal-500/40 focus:border-teal-500 focus:ring-teal-500/20',
        selection: 'selection:bg-teal-500/30'
      };
    } else if (adminThemeLayout === 'compact') {
      return {
        bg: isDark ? 'bg-slate-900 text-slate-100' : 'bg-[#F1F5F9] text-slate-900',
        header: isDark ? 'bg-slate-950 border-rose-500/20' : 'bg-white border-rose-500/20',
        card: isDark ? 'bg-slate-950/80 border border-slate-800' : 'bg-white border border-slate-200',
        text: isDark ? 'text-slate-100' : 'text-slate-900',
        textMuted: isDark ? 'text-slate-400' : 'text-slate-500',
        border: 'border-slate-800 dark:border-slate-800/80',
        bgSecondary: isDark ? 'bg-slate-900' : 'bg-slate-100',
        input: isDark 
          ? 'bg-slate-900/60 border-slate-800 text-slate-200 hover:border-slate-700' 
          : 'bg-slate-50 border-slate-200 text-slate-800 hover:border-slate-300',
        selection: 'selection:bg-rose-500/20'
      };
    } else if (adminThemeLayout === 'executive') {
      return {
        bg: isDark ? 'bg-[#09090b] text-[#fafafa]' : 'bg-[#FAFaf6] text-[#1c1917]',
        header: isDark ? 'bg-[#121214] border-amber-900/30' : 'bg-[#F5F5ED] border-amber-900/20',
        card: isDark ? 'bg-[#121214] border border-amber-900/20' : 'bg-[#FCFCF9] border border-amber-900/10 shadow-[0_4px_20px_rgba(217,119,6,0.02)]',
        text: isDark ? 'text-amber-50' : 'text-amber-950',
        textMuted: isDark ? 'text-amber-200/50' : 'text-amber-800/70',
        border: 'border-amber-900/10 dark:border-amber-900/20',
        bgSecondary: isDark ? 'bg-[#1c1c1f]' : 'bg-[#F2F2E8]',
        input: isDark 
          ? 'bg-[#18181b] border-amber-950 text-amber-100 focus:border-amber-600 focus:ring-amber-900/50' 
          : 'bg-[#FCFCF9] border-amber-900/20 text-amber-950 focus:border-amber-600 focus:ring-amber-500/20',
        selection: 'selection:bg-amber-500/20'
      };
    } else if (adminThemeLayout === 'cyberpunk') {
      return {
        bg: isDark 
          ? 'bg-[#0a0014] text-fuchsia-100 bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-fuchsia-950/20 via-slate-950 to-slate-950' 
          : 'bg-[#fff5ff] text-slate-900 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-fuchsia-500/5 via-slate-50 to-slate-50',
        header: isDark 
          ? 'bg-[#0f0022]/60 backdrop-blur-xl border-fuchsia-500/30 shadow-[0_0_20px_rgba(217,70,239,0.15)]' 
          : 'bg-white/60 backdrop-blur-xl border-fuchsia-500/20 shadow-[0_0_20px_rgba(217,70,239,0.04)]',
        card: isDark 
          ? 'bg-[#120026]/40 backdrop-blur-md border border-fuchsia-500/30 shadow-[0_4px_30px_rgba(217,70,239,0.1)]' 
          : 'bg-white/80 backdrop-blur-md border border-fuchsia-500/20 shadow-[0_4px_30px_rgba(217,70,239,0.02)]',
        text: isDark ? 'text-fuchsia-100' : 'text-slate-900',
        textMuted: isDark ? 'text-fuchsia-400' : 'text-fuchsia-600/70',
        border: 'border-fuchsia-500/20 dark:border-fuchsia-500/30',
        bgSecondary: isDark ? 'bg-fuchsia-950/20' : 'bg-fuchsia-50',
        input: isDark 
          ? 'bg-[#16002c]/50 border-fuchsia-500/30 text-fuchsia-100 focus:border-fuchsia-400 focus:ring-fuchsia-500/30' 
          : 'bg-white border-fuchsia-500/20 text-slate-800 focus:border-fuchsia-500 focus:ring-fuchsia-500/20',
        selection: 'selection:bg-fuchsia-500/30'
      };
    } else if (adminThemeLayout === 'forest') {
      return {
        bg: isDark ? 'bg-[#022c22] text-emerald-50' : 'bg-[#f4fcf7] text-slate-900',
        header: isDark ? 'bg-emerald-950/80 border-emerald-800/40' : 'bg-[#e6f4ea] border-emerald-200',
        card: isDark ? 'bg-emerald-950 border border-emerald-800/40 shadow-sm' : 'bg-white border border-emerald-100 shadow-sm',
        text: isDark ? 'text-emerald-50' : 'text-emerald-950',
        textMuted: isDark ? 'text-emerald-300/70' : 'text-emerald-800/70',
        border: 'border-emerald-800/30 dark:border-emerald-800/40',
        bgSecondary: isDark ? 'bg-emerald-900/40' : 'bg-emerald-50',
        input: isDark 
          ? 'bg-emerald-900/30 border-emerald-800 text-emerald-100 focus:border-emerald-500' 
          : 'bg-white border-emerald-200 text-emerald-950 focus:border-emerald-600',
        selection: 'selection:bg-emerald-500/20'
      };
    } else if (adminThemeLayout === 'retro') {
      return {
        bg: isDark ? 'bg-[#0f171c] text-amber-500 font-mono' : 'bg-[#faf6ee] text-amber-900 font-mono',
        header: isDark ? 'bg-slate-950 border-amber-500/40' : 'bg-amber-100/40 border-amber-900/40',
        card: isDark ? 'bg-slate-950 border-2 border-amber-500/50 shadow-[4px_4px_0px_rgba(245,158,11,0.2)]' : 'bg-[#fffdfa] border-2 border-amber-900/50 shadow-[4px_4px_0px_rgba(120,53,4,0.1)]',
        text: isDark ? 'text-amber-500 font-mono' : 'text-amber-900 font-mono',
        textMuted: isDark ? 'text-amber-600/70' : 'text-amber-700/70',
        border: 'border-amber-500/40 dark:border-amber-500/40',
        bgSecondary: isDark ? 'bg-slate-900' : 'bg-amber-50',
        input: isDark 
          ? 'bg-slate-950 border-2 border-amber-500/40 text-amber-400 focus:border-amber-500 font-mono' 
          : 'bg-white border-2 border-amber-900/40 text-amber-900 focus:border-amber-900 font-mono',
        selection: 'selection:bg-amber-500/40'
      };
    } else if (adminThemeLayout === 'ocean') {
      return {
        bg: isDark ? 'bg-[#050e1e] text-sky-50' : 'bg-[#f0f7ff] text-slate-900',
        header: isDark ? 'bg-[#0a1931]/80 border-sky-900/30' : 'bg-[#e1f0ff]/90 border-sky-200',
        card: isDark ? 'bg-[#0b1e36] border border-sky-900/40 shadow-sm shadow-black/20' : 'bg-white border border-sky-100 shadow-sm',
        text: isDark ? 'text-sky-100' : 'text-sky-950',
        textMuted: isDark ? 'text-sky-400' : 'text-sky-600',
        border: 'border-sky-900/30 dark:border-sky-800/40',
        bgSecondary: isDark ? 'bg-sky-950/40' : 'bg-sky-50',
        input: isDark 
          ? 'bg-[#07162c] border-sky-800 text-sky-100 focus:border-sky-400 focus:ring-sky-500/20' 
          : 'bg-white border-sky-200 text-sky-950 focus:border-sky-500 focus:ring-sky-500/10',
        selection: 'selection:bg-sky-500/20'
      };
    } else if (adminThemeLayout === 'sakura') {
      return {
        bg: isDark ? 'bg-[#1c0b11] text-rose-50' : 'bg-[#fff5f7] text-slate-900',
        header: isDark ? 'bg-[#260f17]/80 border-rose-950' : 'bg-[#ffe4e9]/90 border-rose-200',
        card: isDark ? 'bg-[#251018] border border-rose-900/30 shadow-sm shadow-rose-950/20' : 'bg-white border border-rose-100 shadow-sm',
        text: isDark ? 'text-rose-100' : 'text-rose-950',
        textMuted: isDark ? 'text-rose-400' : 'text-rose-600',
        border: 'border-rose-900/20 dark:border-rose-900/30',
        bgSecondary: isDark ? 'bg-rose-950/40' : 'bg-rose-50/50',
        input: isDark 
          ? 'bg-[#210c14] border-rose-900/50 text-rose-100 focus:border-rose-400 focus:ring-rose-500/20' 
          : 'bg-white border-rose-200 text-rose-950 focus:border-rose-500 focus:ring-rose-500/10',
        selection: 'selection:bg-rose-500/20'
      };
    } else if (adminThemeLayout === 'royal') {
      return {
        bg: isDark ? 'bg-[#0a0414] text-amber-100' : 'bg-[#f9f6fc] text-purple-950',
        header: isDark ? 'bg-[#120924]/80 border-amber-500/30' : 'bg-[#f1ebfa] border-amber-600/30',
        card: isDark ? 'bg-[#120924]/90 border-2 border-amber-500/30 shadow-[0_4px_25px_rgba(245,158,11,0.04)]' : 'bg-white border-2 border-amber-600/20 shadow-[2px_2px_10px_rgba(217,119,6,0.01)]',
        text: isDark ? 'text-amber-100' : 'text-purple-950',
        textMuted: isDark ? 'text-purple-300' : 'text-purple-800/70',
        border: 'border-purple-950 dark:border-purple-900/40',
        bgSecondary: isDark ? 'bg-purple-950/50' : 'bg-purple-50',
        input: isDark 
          ? 'bg-[#150a2b] border-amber-500/30 text-amber-200 focus:border-amber-400 focus:ring-amber-500/20' 
          : 'bg-white border-amber-600/20 text-purple-950 focus:border-amber-600 focus:ring-amber-600/10',
        selection: 'selection:bg-amber-500/20'
      };
    }

    // Default 'modern' (Violet / Zinc)
    return {
      bg: isDark ? 'bg-zinc-950 text-zinc-100' : 'bg-zinc-50 text-zinc-900',
      header: isDark ? 'bg-zinc-900/80 border-zinc-800' : 'bg-zinc-100/80 border-zinc-200',
      card: isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200',
      text: isDark ? 'text-zinc-100' : 'text-zinc-900',
      textMuted: isDark ? 'text-zinc-400' : 'text-zinc-500',
      border: 'border-zinc-800 dark:border-zinc-800',
      bgSecondary: isDark ? 'bg-zinc-800' : 'bg-zinc-100',
      input: isDark ? 'bg-zinc-800 border-zinc-700 text-zinc-200 hover:bg-zinc-750' : 'bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50',
      selection: 'selection:bg-violet-500/30'
    };
  }, [adminUser, isDark, adminThemeLayout]);

  const isPublicJurnalRoute = location.pathname === '/jurnal';

  if (isPublicJurnalRoute) {
    return (
      <div className={`min-h-screen font-sans transition-colors duration-300 ${themeClasses.bg} ${themeClasses.selection}`} style={{ '--primary': primaryColor } as any}>
        <MembershipJournalForm 
          isDark={isDark} 
          themeClasses={themeClasses} 
          primaryColor={primaryColor} 
        />
      </div>
    );
  }

  if (!loading && !adminUser && !currentUser && !isPublicJurnalRoute) {
    return (
      <div className={`min-h-screen font-sans transition-colors duration-300 ${themeClasses.bg} ${themeClasses.selection}`} style={{ '--primary': primaryColor } as any}>
        <Toaster position="top-center" reverseOrder={false} />
        <UserLoginScreen
          isDark={isDark}
          themeClasses={themeClasses}
          primaryColor={primaryColor}
          masterUsers={masterUsers}
          onLogin={handleUserLogin}
          onAdminLoginClick={() => setShowLogin(true)}
          appSettings={appSettings}
          loginData={loginData}
          setLoginData={setLoginData}
          handleAdminLogin={handleLogin}
        />
        <AnimatePresence>
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
        </AnimatePresence>
      </div>
    );
  }

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
            
            {/* --- OFFLINE SYNC BANNER --- */}
            <AnimatePresence>
              {pendingCount > 0 && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="bg-amber-500 text-white overflow-hidden"
                >
                  <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between text-xs sm:text-sm font-bold">
                    <div className="flex items-center gap-2">
                      <WifiOff className="w-4 h-4" />
                      <span>{pendingCount} tiket menunggu sinkronisasi offline.</span>
                    </div>
                    <button 
                      onClick={() => sync()}
                      disabled={isSyncing || !navigator.onLine}
                      className={`flex items-center gap-1 px-3 py-1 rounded-full bg-white/20 hover:bg-white/30 transition-all active:scale-95 disabled:opacity-50 disabled:scale-100`}
                    >
                      {isSyncing ? (
                        <RefreshCcw className="w-3 h-3 animate-spin" />
                      ) : (
                        <CloudUpload className="w-3 h-3" />
                      )}
                      {isSyncing ? 'Sinkronisasi...' : 'Sinkronkan Sekarang'}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* --- HEADER SECTION --- */}
            <Header 
              appSettings={appSettings}
              primaryColor={primaryColor}
              isDark={isDark}
              adminUser={adminUser}
              currentUser={currentUser}
              setShowSettings={(show) => {
                if (window.innerWidth >= 1024) {
                  setViewMode('settings');
                } else {
                  setShowSettings(show);
                }
              }}
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

      <main className="w-full max-w-[1600px] mx-auto px-2 sm:px-4 lg:px-6 py-2 sm:py-4 pb-20 lg:pb-4 transition-all duration-300">
        <div className="flex flex-col lg:flex-row gap-3 lg:gap-6 relative">
          
          {/* Desktop Sidebar Toggle Button */}
          {!(adminThemeLayout === 'executive' && adminUser) && (
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className={`hidden lg:flex absolute top-0 z-20 w-8 h-8 bg-white dark:bg-slate-800 border ${isDark ? 'border-slate-700 text-slate-300 hover:bg-slate-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'} rounded-full items-center justify-center shadow hover:scale-105 transition-all ${isSidebarOpen ? '-left-3' : '-left-1'}`}
              title={isSidebarOpen ? "Sembunyikan Menu" : "Tampilkan Menu"}
            >
              {isSidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          )}

          {/* --- SIDEBAR: STATS & INFO --- */}
          {!(adminThemeLayout === 'executive' && adminUser) && (
            <div className={`hidden lg:block shrink-0 transition-all duration-300 ease-in-out overflow-hidden ${isSidebarOpen ? 'w-56 xl:w-64 opacity-100' : 'w-0 opacity-0 lg:ml-6'}`}>
              <div className="w-56 xl:w-64">
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
                  setShowLogin={setShowLogin}
                  handleLogout={handleLogout}
                  userCanVoucher={userCanVoucher}
                  adminThemeLayout={adminThemeLayout}
                />
              </div>
            </div>
          )}

          {/* --- MAIN CONTENT --- */}
          <div className="flex-1 min-w-0 space-y-2 sm:space-y-3 transition-all duration-300">
            <MobileAppNav 
              viewMode={viewMode}
              setViewMode={setViewMode}
              isDark={isDark}
              adminUser={adminUser}
              userCanVoucher={userCanVoucher}
            />
            {adminThemeLayout === 'executive' && adminUser && (
              <div className={`hidden lg:flex items-center gap-1.5 p-2 ${themeClasses.card} rounded-2xl border ${themeClasses.border} overflow-x-auto shadow-sm no-scrollbar`}>
                <button
                  onClick={() => setViewMode('dashboard')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                    viewMode === 'dashboard'
                      ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                      : isDark ? 'text-slate-400 hover:bg-slate-800 hover:text-slate-200' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <BarChart3 className="w-4 h-4" />
                  <span>Dashboard</span>
                </button>

                <button
                  onClick={() => setViewMode('today')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap relative ${
                    viewMode === 'today'
                      ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                      : isDark ? 'text-slate-400 hover:bg-slate-800 hover:text-slate-200' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <Zap className="w-4 h-4" />
                  <span>Antrian Hari Ini</span>
                  {tickets.filter(t => new Date(t.created_at).toLocaleDateString('en-CA') === new Date().toLocaleDateString('en-CA')).length > 0 && (
                    <span className="px-1.5 py-0.5 bg-rose-500 text-white text-[9px] font-black rounded-full">
                      {tickets.filter(t => new Date(t.created_at).toLocaleDateString('en-CA') === new Date().toLocaleDateString('en-CA')).length}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => setViewMode('all')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                    viewMode === 'all'
                      ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                      : isDark ? 'text-slate-400 hover:bg-slate-800 hover:text-slate-200' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <AlertCircle className="w-4 h-4" />
                  <span>Semua Antrian</span>
                </button>

                <button
                  onClick={() => setViewMode('my_tickets')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                    viewMode === 'my_tickets'
                      ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                      : isDark ? 'text-slate-400 hover:bg-slate-800 hover:text-slate-200' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Tiket Saya</span>
                </button>

                {(adminUser || userCanVoucher) && (
                  <button
                    onClick={() => setViewMode('voucher')}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                      viewMode === 'voucher'
                        ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                        : isDark ? 'text-slate-400 hover:bg-slate-800 hover:text-slate-200' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <Printer className="w-4 h-4" />
                    <span>Cetak Voucher</span>
                  </button>
                )}

                <button
                  onClick={() => setViewMode('assets')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                    viewMode === 'assets'
                      ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                      : isDark ? 'text-slate-400 hover:bg-slate-800 hover:text-slate-200' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <Package className="w-4 h-4" />
                  <span>Aset</span>
                </button>

                <button
                  onClick={() => setViewMode('membership')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                    viewMode === 'membership'
                      ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                      : isDark ? 'text-slate-400 hover:bg-slate-800 hover:text-slate-200' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Membership</span>
                </button>

                <button
                  onClick={() => setViewMode('evaluasi_project')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                    viewMode === 'evaluasi_project'
                      ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                      : isDark ? 'text-slate-400 hover:bg-slate-800 hover:text-slate-200' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <TrendingUp className="w-4 h-4" />
                  <span>Evaluasi</span>
                </button>

                {(adminUser.role === 'Super Admin' || adminUser.role === 'Staff IT Support') && (
                  <>
                    <button
                      onClick={() => setViewMode('master_user')}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                        viewMode === 'master_user'
                          ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                          : isDark ? 'text-slate-400 hover:bg-slate-800 hover:text-slate-200' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                      }`}
                    >
                      <Users className="w-4 h-4" />
                      <span>Master Data (User)</span>
                    </button>
                    <button
                      onClick={() => setViewMode('master_perangkat')}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                        viewMode === 'master_perangkat'
                          ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                          : isDark ? 'text-slate-400 hover:bg-slate-800 hover:text-slate-200' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                      }`}
                    >
                      <MonitorSmartphone className="w-4 h-4" />
                      <span>Master Perangkat</span>
                    </button>
                    <button
                      onClick={() => setViewMode('network')}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                        viewMode === 'network'
                          ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                          : isDark ? 'text-slate-400 hover:bg-slate-800 hover:text-slate-200' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                      }`}
                    >
                      <Activity className="w-4 h-4" />
                      <span>Jaringan</span>
                    </button>
                  </>
                )}

                {adminUser.role === 'Super Admin' && (
                  <button
                    onClick={() => setViewMode('ba')}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                      viewMode === 'ba'
                        ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                        : isDark ? 'text-slate-400 hover:bg-slate-800 hover:text-slate-200' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <FileText className="w-4 h-4" />
                    <span>Surat / BA</span>
                  </button>
                )}

                <button
                  onClick={() => setViewMode('panduan')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                    viewMode === 'panduan'
                      ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                      : isDark ? 'text-slate-400 hover:bg-slate-800 hover:text-slate-200' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <BookOpen className="w-4 h-4" />
                  <span>Panduan</span>
                </button>

                <button
                  onClick={() => setViewMode('settings')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                    viewMode === 'settings'
                      ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                      : isDark ? 'text-slate-400 hover:bg-slate-800 hover:text-slate-200' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <Settings2 className="w-4 h-4" />
                  <span>Pengaturan</span>
                </button>

                <button
                  onClick={() => setViewMode('testing')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                    viewMode === 'testing'
                      ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                      : isDark ? 'text-slate-400 hover:bg-slate-800 hover:text-slate-200' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <Activity className="w-4 h-4 text-emerald-500" />
                  <span>Testing</span>
                </button>
              </div>
            )}
            {viewMode === 'dashboard' ? (
              <AdminDashboard 
                tickets={tickets}
                adminUser={adminUser}
                isDark={isDark}
                themeClasses={themeClasses}
                setViewMode={setViewMode}
              />
            ) : viewMode === 'assets' ? (
              <AssetManagement 
                isDark={isDark}
                themeClasses={themeClasses}
                primaryColor={primaryColor}
              />
            ) : viewMode === 'network' ? (
              <NetworkMonitor 
                isDark={isDark}
                themeClasses={themeClasses}
                primaryColor={primaryColor}
                adminUser={adminUser}
              />
            ) : viewMode === 'master_user' ? (
              <MasterUserManagement 
                isDark={isDark}
                themeClasses={themeClasses}
                masterUsers={masterUsers}
                departments={departments}
                handleManagementAction={handleManagementAction}
                adminUser={adminUser}
              />
            ) : viewMode === 'master_perangkat' ? (
              <MasterPerangkatPlaceholder isDark={isDark} />
            ) : viewMode === 'ba' ? (
              <BeritaAcara 
                isDark={isDark}
                themeClasses={themeClasses}
                primaryColor={primaryColor}
                adminUser={adminUser}
              />
            ) : viewMode === 'membership' ? (
              <MembershipManagement
                isDark={isDark}
                themeClasses={themeClasses}
                primaryColor={primaryColor}
              />
            ) : viewMode === 'voucher' ? (
              <VoucherManagement
                isDark={isDark}
                themeClasses={themeClasses}
                primaryColor={primaryColor}
                adminUser={adminUser}
                currentUser={currentUser}
                loggedInMasterUser={loggedInMasterUser}
              />
            ) : viewMode === 'evaluasi_project' ? (
              <ProjectEvaluation 
                isDark={isDark}
                themeClasses={themeClasses}
                primaryColor={primaryColor}
              />
            ) : viewMode === 'settings' ? (
              <SettingsModal 
                inline={true}
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
                adminThemeLayout={adminThemeLayout}
                setAdminThemeLayout={setAdminThemeLayout}
              />
            ) : viewMode === 'testing' ? (
              <TestingView 
                isDark={isDark}
                themeClasses={themeClasses}
              />
            ) : viewMode === 'panduan' ? (
              <Panduan isDark={isDark} primaryColor={primaryColor} appSettings={appSettings} />
            ) : (
              <TicketList 
                adminUser={adminUser}
                isDark={isDark}
                themeClasses={themeClasses}
                viewMode={viewMode as any}
                setViewMode={setViewMode as any}
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
          </div>

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
            currentUser={currentUser}
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
            onClose={() => setShowSuccess(false)}
            onViewHistory={() => {
              setShowSuccess(false);
              setViewMode('my_tickets');
            }}
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
            adminThemeLayout={adminThemeLayout}
            setAdminThemeLayout={setAdminThemeLayout}
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

      <div className="print:hidden">
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
      </div>

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
