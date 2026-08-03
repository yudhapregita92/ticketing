import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  MapPin,
  Compass,
  Battery,
  Wifi,
  Smartphone,
  RefreshCw,
  Navigation,
  User,
  Clock,
  ShieldCheck,
  ExternalLink,
  Copy,
  Check,
  Radio,
  Info,
  AlertCircle,
  MessageSquare,
  History,
  X,
  Zap,
  Globe,
  Search,
  Send,
  Layers,
  Sliders,
  CheckCircle2,
  Phone,
  UserPlus
} from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../services/api';

interface ITeamLocation {
  id: number;
  username: string;
  full_name: string;
  role: string;
  latitude: number;
  longitude: number;
  accuracy?: number;
  battery_level?: number;
  speed?: number;
  address?: string;
  provider: 'web' | 'checkin' | 'traccar' | string;
  note?: string;
  is_on_duty?: number;
  updated_at: string;
}

interface ITeamLocationLog {
  id: number;
  username: string;
  full_name: string;
  latitude: number;
  longitude: number;
  accuracy?: number;
  battery_level?: number;
  speed?: number;
  provider: string;
  address?: string;
  note?: string;
  created_at: string;
}

interface TeamLocationTrackerProps {
  isDark: boolean;
  currentUser?: any;
  adminThemeColor?: string;
  adminThemeLayout?: string;
}

export const TeamLocationTracker: React.FC<TeamLocationTrackerProps> = ({
  isDark,
  currentUser,
  adminThemeColor = 'blue',
}) => {
  const [locations, setLocations] = useState<ITeamLocation[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [selectedUser, setSelectedUser] = useState<ITeamLocation | null>(null);
  const [showTraccarModal, setShowTraccarModal] = useState<boolean>(false);
  const [showCheckinModal, setShowCheckinModal] = useState<boolean>(false);
  const [showHistoryModal, setShowHistoryModal] = useState<boolean>(false);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [historyLogs, setHistoryLogs] = useState<ITeamLocationLog[]>([]);
  const [historyUser, setHistoryUser] = useState<string>('');
  
  // Add Member State
  const [addUsername, setAddUsername] = useState<string>('');
  const [addFullName, setAddFullName] = useState<string>('');
  const [addRole, setAddRole] = useState<string>('IT Support');
  const [copiedUrl, setCopiedUrl] = useState<boolean>(false);
  const [copiedCoords, setCopiedCoords] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'online' | 'away' | 'offline'>('all');
  
  // Check-in state
  const [checkinNote, setCheckinNote] = useState<string>('');
  const [submittingCheckin, setSubmittingCheckin] = useState<boolean>(false);

  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMapInstanceRef = useRef<any>(null);
  const markersRef = useRef<{ [key: string]: any }>({});

  // Get Traccar Server URL
  const traccarServerUrl = `${window.location.origin}/api/team-location/traccar`;

  // Helper to compute status based on last update timestamp
  const getOnlineStatus = (updatedAt: string): { status: 'online' | 'away' | 'offline'; text: string; colorClass: string; badgeBg: string } => {
    if (!updatedAt) return { status: 'offline', text: 'Offline', colorClass: 'text-slate-400 bg-slate-400', badgeBg: 'bg-slate-500/10 text-slate-400 border-slate-500/20' };
    
    const diffMs = Date.now() - new Date(updatedAt).getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));

    if (diffMins < 15) {
      return { status: 'online', text: 'Aktif Live', colorClass: 'text-emerald-500 bg-emerald-500', badgeBg: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30' };
    } else if (diffMins < 120) {
      return { status: 'away', text: `Baru Saja (${diffMins}m lalu)`, colorClass: 'text-amber-500 bg-amber-500', badgeBg: 'bg-amber-500/10 text-amber-500 border-amber-500/30' };
    } else {
      const diffHours = Math.floor(diffMins / 60);
      return { status: 'offline', text: diffHours > 24 ? 'Inaktif (>1 Hari)' : `Inaktif (${diffHours}j lalu)`, colorClass: 'text-slate-400 bg-slate-400', badgeBg: 'bg-slate-500/10 text-slate-400 border-slate-500/20' };
    }
  };

  // Fetch Team Locations
  const fetchLocations = useCallback(async (isSilent = false) => {
    if (!isSilent) setRefreshing(true);
    try {
      const data = await api.getTeamLocations();
      setLocations(data || []);
      if (!isSilent) toast.success('Data lokasi tim berhasil disinkronkan', { id: 'loc-sync' });
    } catch (err) {
      console.error('Error loading team locations:', err);
      if (!isSilent) toast.error('Gagal memperbarui data lokasi tim');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchLocations(true);
    const interval = setInterval(() => {
      fetchLocations(true);
    }, 15000); // refresh every 15 seconds
    return () => clearInterval(interval);
  }, [fetchLocations]);

  // Dynamically load Leaflet JS and CSS
  useEffect(() => {
    const leafletCssId = 'leaflet-css';
    if (!document.getElementById(leafletCssId)) {
      const link = document.createElement('link');
      link.id = leafletCssId;
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    let isMounted = true;

    const initMap = async () => {
      if (!mapRef.current) return;
      try {
        const L = await import('leaflet');
        if (!isMounted || !mapRef.current) return;

        if (!leafletMapInstanceRef.current) {
          // Default center Jakarta or first location
          const defaultLat = locations.length > 0 ? locations[0].latitude : -6.175392;
          const defaultLng = locations.length > 0 ? locations[0].longitude : 106.827153;

          const map = L.map(mapRef.current, {
            center: [defaultLat, defaultLng],
            zoom: 12,
            zoomControl: true,
          });

          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors',
            maxZoom: 19,
          }).addTo(map);

          leafletMapInstanceRef.current = map;
        }

        const map = leafletMapInstanceRef.current;

        // Clear existing markers
        Object.values(markersRef.current).forEach((m: any) => m.remove());
        markersRef.current = {};

        if (locations.length === 0) return;

        const bounds = L.latLngBounds([]);

        locations.forEach((loc) => {
          if (!loc.latitude || !loc.longitude) return;

          bounds.extend([loc.latitude, loc.longitude]);

          const st = getOnlineStatus(loc.updated_at);
          const isSelected = selectedUser?.username === loc.username;

          const initials = loc.full_name ? loc.full_name.slice(0, 2).toUpperCase() : loc.username.slice(0, 2).toUpperCase();
          const markerColor = st.status === 'online' ? '#10b981' : st.status === 'away' ? '#f59e0b' : '#64748b';

          const customIcon = L.divIcon({
            className: 'custom-team-marker',
            html: `
              <div style="
                position: relative;
                display: flex;
                align-items: center;
                justify-content: center;
                width: 42px;
                height: 42px;
                border-radius: 50%;
                background: ${isSelected ? '#2563eb' : '#ffffff'};
                border: 3px solid ${markerColor};
                box-shadow: 0 4px 12px rgba(0,0,0,0.25);
                cursor: pointer;
                transition: transform 0.2s ease;
                transform: ${isSelected ? 'scale(1.2)' : 'scale(1)'};
              ">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M4 20C4 16.8 6.8 15 12 15C17.2 15 20 16.8 20 20" fill="${isSelected ? '#ffffff' : '#3b82f6'}"/>
                  <path d="M9 20V16.5M15 20V16.5" stroke="#f59e0b" strokeWidth="1.5"/>
                  <circle cx="12" cy="11.5" r="3.2" fill="#fdba74"/>
                  <path d="M6.5 10.2C6.5 6.8 8.8 4.5 12 4.5C15.2 4.5 17.5 6.8 17.5 10.2H6.5Z" fill="#ffffff" stroke="#0f172a" strokeWidth="1.2"/>
                  <rect x="5" y="9.5" width="14" height="2.2" rx="1" fill="#ffffff" stroke="#0f172a" strokeWidth="1"/>
                  <path d="M11 4.8V7M13 4.8V7" stroke="#94a3b8" strokeWidth="1" strokeLinecap="round"/>
                </svg>
                <span style="
                  position: absolute;
                  top: -2px;
                  right: -2px;
                  width: 12px;
                  height: 12px;
                  border-radius: 50%;
                  background: ${markerColor};
                  border: 2px solid white;
                  box-shadow: 0 1px 3px rgba(0,0,0,0.2);
                "></span>
              </div>
            `,
            iconSize: [42, 42],
            iconAnchor: [21, 21],
          });

          const marker = L.marker([loc.latitude, loc.longitude], { icon: customIcon }).addTo(map);

          const popupContent = `
            <div style="font-family: system-ui, sans-serif; padding: 4px; max-width: 200px;">
              <div style="font-weight: 800; font-size: 13px; color: #0f172a; margin-bottom: 2px;">${loc.full_name}</div>
              <div style="font-size: 11px; color: #64748b; font-weight: 700; text-transform: uppercase;">${loc.role || 'IT Team'}</div>
              <div style="font-size: 10px; color: #3b82f6; font-family: monospace; font-weight: 800; margin-top: 4px;">
                ${loc.latitude.toFixed(5)}, ${loc.longitude.toFixed(5)}
              </div>
              <div style="font-size: 10px; color: #475569; margin-top: 4px;">${loc.address || 'Lokasi Terdaftar'}</div>
            </div>
          `;

          marker.bindPopup(popupContent);
          marker.on('click', () => {
            setSelectedUser(loc);
          });

          markersRef.current[loc.username] = marker;
        });

        if (locations.length > 0 && !selectedUser) {
          map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
        }
      } catch (err) {
        console.error('Error initializing Leaflet map:', err);
      }
    };

    initMap();

    return () => {
      isMounted = false;
    };
  }, [locations, selectedUser]);

  // Center map on specific team member
  const handleFocusUser = (loc: ITeamLocation) => {
    setSelectedUser(loc);
    if (leafletMapInstanceRef.current && loc.latitude && loc.longitude) {
      leafletMapInstanceRef.current.setView([loc.latitude, loc.longitude], 15, { animate: true });
      if (markersRef.current[loc.username]) {
        markersRef.current[loc.username].openPopup();
      }
    }
  };

  // Perform Manual Web Check-In
  const handlePerformCheckin = async () => {
    if (!navigator.geolocation) {
      toast.error('Browser Anda tidak mendukung Geolocation GPS');
      return;
    }

    setSubmittingCheckin(true);
    toast.loading('Mendeteksi koordinat GPS presisi...', { id: 'gps-checkin' });

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

          const username = currentUser?.username || 'yudha';
          const fullName = currentUser?.full_name || 'Yudha';
          const role = currentUser?.role || 'Super Admin';

          const addressText = `Check-In Lapangan via Web (${lat.toFixed(5)}, ${lng.toFixed(5)})`;

          await api.updateTeamLocation({
            username,
            full_name: fullName,
            role,
            latitude: lat,
            longitude: lng,
            accuracy,
            battery_level: battLevel,
            speed,
            address: addressText,
            provider: 'checkin',
            note: checkinNote.trim() || 'Check-in lokasi via Aplikasi Web',
          });

          toast.success('Check-in lokasi berhasil disimpan!', { id: 'gps-checkin' });
          setShowCheckinModal(false);
          setCheckinNote('');
          fetchLocations(true);
        } catch (err) {
          console.error('Error submitting checkin:', err);
          toast.error('Gagal menyimpan check-in lokasi', { id: 'gps-checkin' });
        } finally {
          setSubmittingCheckin(false);
        }
      },
      (err) => {
        console.error('Geolocation error:', err);
        toast.error(`Gagal mendapatkan lokasi GPS: ${err.message}`, { id: 'gps-checkin' });
        setSubmittingCheckin(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  // Fetch History Logs for a member
  const handleOpenHistory = async (username: string) => {
    setHistoryUser(username);
    setShowHistoryModal(true);
    try {
      const logs = await api.getTeamLocationLogs(username);
      setHistoryLogs(logs || []);
    } catch (err) {
      console.error('Error fetching history logs:', err);
      toast.error('Gagal mengambil riwayat jejak lokasi');
    }
  };

  const handleDeleteUser = async (username: string) => {
    if (!window.confirm(`Hapus lokasi tim untuk user ${username}?`)) return;
    try {
      await api.deleteTeamLocation(username);
      toast.success('Lokasi tim berhasil dihapus');
      if (selectedUser?.username === username) setSelectedUser(null);
      fetchLocations(true);
    } catch (err) {
      toast.error('Gagal menghapus lokasi tim');
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addUsername.trim() || !addFullName.trim()) {
      toast.error('Username (Device ID) dan Nama Lengkap wajib diisi');
      return;
    }
    try {
      // Create with a default location (e.g., Jakarta center) so they appear on the map
      await api.updateTeamLocation({
        username: addUsername.trim(),
        full_name: addFullName.trim(),
        role: addRole,
        latitude: -6.175392,
        longitude: 106.827153,
        accuracy: 100,
        provider: 'manual',
        note: 'Pendaftaran Manual'
      });
      toast.success('Anggota berhasil ditambahkan');
      setShowAddModal(false);
      setAddUsername('');
      setAddFullName('');
      setAddRole('IT Support');
      fetchLocations(true);
    } catch (err) {
      toast.error('Gagal menambahkan anggota');
    }
  };

  // Copy coordinates
  const handleCopyCoords = (lat: number, lng: number, key: string) => {
    const text = `${lat}, ${lng}`;
    navigator.clipboard.writeText(text);
    setCopiedCoords(key);
    toast.success('Koordinat disalin ke clipboard!');
    setTimeout(() => setCopiedCoords(null), 2000);
  };

  // Copy Traccar URL
  const handleCopyTraccarUrl = () => {
    navigator.clipboard.writeText(traccarServerUrl);
    setCopiedUrl(true);
    toast.success('URL Server Traccar disalin!');
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  // Filtered locations
  const filteredLocations = locations.filter((loc) => {
    const matchesSearch =
      loc.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      loc.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      loc.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (loc.address && loc.address.toLowerCase().includes(searchQuery.toLowerCase()));

    const st = getOnlineStatus(loc.updated_at).status;
    const matchesStatus = statusFilter === 'all' || st === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Calculate summary counts
  const totalCount = locations.length;
  const onlineCount = locations.filter((l) => getOnlineStatus(l.updated_at).status === 'online').length;
  const awayCount = locations.filter((l) => getOnlineStatus(l.updated_at).status === 'away').length;
  const offlineCount = locations.filter((l) => getOnlineStatus(l.updated_at).status === 'offline').length;

  return (
    <div className={`space-y-6 ${isDark ? 'text-white' : 'text-slate-900'}`}>
      {/* Header Banner & Title */}
      <div className={`p-5 sm:p-6 rounded-3xl border shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
        isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <div className="flex items-center gap-3.5">
          <div className="p-3.5 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 shrink-0">
            <Compass className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black tracking-tight">Lokasi Team (Tracking GPS)</h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/30">
                Superadmin Only
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Monitoring posisi real-time & riwayat pergerakan tim IT Support / Lapangan
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={() => setShowAddModal(true)}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md transition-all flex items-center gap-1.5 active:scale-95"
          >
            <UserPlus className="w-4 h-4 shrink-0" />
            <span className="truncate">Tambah Manual</span>
          </button>

          <button
            onClick={() => handlePerformCheckin()}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md transition-all flex items-center gap-1.5 active:scale-95"
          >
            <MapPin className="w-4 h-4 shrink-0" />
            <span className="truncate">Check-In Saya</span>
          </button>

          <button
            onClick={() => setShowTraccarModal(true)}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md transition-all flex items-center gap-1.5 active:scale-95"
          >
            <Smartphone className="w-4 h-4 shrink-0" />
            <span className="truncate">Setup Traccar</span>
          </button>

          <button
            onClick={() => fetchLocations(false)}
            disabled={refreshing}
            className={`p-2.5 rounded-xl border text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-all ${
              isDark ? 'bg-slate-800 border-slate-700 hover:bg-slate-700' : 'bg-slate-100 border-slate-200 hover:bg-slate-200'
            }`}
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-blue-500' : ''}`} />
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <div className={`p-3 md:p-4 rounded-2xl border shadow-sm ${isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200'}`}>
          <div className="flex items-center justify-between text-slate-400 text-[9px] md:text-[10px] font-black uppercase tracking-wider">
            <span>Total Anggota</span>
            <User className="w-3.5 h-3.5 md:w-4 md:h-4 text-blue-500" />
          </div>
          <div className="text-xl md:text-2xl font-black mt-1 text-slate-800 dark:text-slate-100">{totalCount}</div>
          <span className="text-[9px] md:text-[10px] text-slate-400 font-bold">Tim IT Terdaftar</span>
        </div>

        <div className={`p-3 md:p-4 rounded-2xl border shadow-sm ${isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200'}`}>
          <div className="flex items-center justify-between text-emerald-500 text-[9px] md:text-[10px] font-black uppercase tracking-wider">
            <span className="truncate pr-1">Aktif Live (&lt;15m)</span>
            <Radio className="w-3.5 h-3.5 md:w-4 md:h-4 text-emerald-500 animate-pulse shrink-0" />
          </div>
          <div className="text-xl md:text-2xl font-black mt-1 text-emerald-600 dark:text-emerald-400">{onlineCount}</div>
          <span className="text-[9px] md:text-[10px] text-emerald-600/70 dark:text-emerald-400/70 font-bold">Sinyal GPS Aktif</span>
        </div>

        <div className={`p-3 md:p-4 rounded-2xl border shadow-sm ${isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200'}`}>
          <div className="flex items-center justify-between text-amber-500 text-[9px] md:text-[10px] font-black uppercase tracking-wider">
            <span className="truncate pr-1">Baru Saja (&lt;2j)</span>
            <Clock className="w-3.5 h-3.5 md:w-4 md:h-4 text-amber-500 shrink-0" />
          </div>
          <div className="text-xl md:text-2xl font-black mt-1 text-amber-600 dark:text-amber-400">{awayCount}</div>
          <span className="text-[9px] md:text-[10px] text-amber-600/70 dark:text-amber-400/70 font-bold">Standby / Bergerak</span>
        </div>

        <div className={`p-3 md:p-4 rounded-2xl border shadow-sm ${isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200'}`}>
          <div className="flex items-center justify-between text-slate-400 text-[9px] md:text-[10px] font-black uppercase tracking-wider">
            <span className="truncate pr-1">Inaktif / Offline</span>
            <Wifi className="w-3.5 h-3.5 md:w-4 md:h-4 text-slate-400 shrink-0" />
          </div>
          <div className="text-xl md:text-2xl font-black mt-1 text-slate-500">{offlineCount}</div>
          <span className="text-[9px] md:text-[10px] text-slate-400 font-bold">Terakhir Aktif</span>
        </div>
      </div>

      {/* Main Grid: Leaflet Map & Member List */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left / Top: Interactive Leaflet Map */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-4">
          <div className={`p-4 sm:p-5 rounded-3xl border shadow-xl ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
            <div className="flex items-center justify-between mb-3.5">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-blue-500" />
                <h3 className="text-sm font-black uppercase tracking-wider">Peta Lokasi Live OpenStreetMap</h3>
              </div>
              {selectedUser && (
                <button
                  onClick={() => setSelectedUser(null)}
                  className="text-xs font-bold text-blue-500 hover:underline flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" /> Reset Tampilan Map
                </button>
              )}
            </div>

            {/* Map Container */}
            <div
              ref={mapRef}
              className="w-full h-[400px] sm:h-[480px] rounded-2xl border overflow-hidden shadow-inner z-0"
            />

            {/* Selected User Quick Info Banner under map */}
            {selectedUser && (
              <div className={`mt-4 p-4 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                isDark ? 'bg-slate-800/80 border-slate-700' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-extrabold flex items-center justify-center shrink-0 text-sm">
                    {selectedUser.full_name ? selectedUser.full_name.slice(0, 2).toUpperCase() : 'IT'}
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm">{selectedUser.full_name} ({selectedUser.role})</h4>
                    <p className="text-xs text-slate-400 font-mono">
                      {selectedUser.latitude.toFixed(5)}, {selectedUser.longitude.toFixed(5)} • {selectedUser.address || 'Lokasi terdaftar'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCopyCoords(selectedUser.latitude, selectedUser.longitude, selectedUser.username)}
                    className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 transition-all flex items-center gap-1"
                  >
                    {copiedCoords === selectedUser.username ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>Salin</span>
                  </button>
                  <a
                    href={`https://maps.google.com/?q=${selectedUser.latitude},${selectedUser.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all flex items-center gap-1"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Google Maps</span>
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right / Bottom: Member List & Filter */}
        <div className="lg:col-span-5 xl:col-span-4 space-y-4">
          <div className={`p-4 sm:p-5 rounded-3xl border shadow-xl space-y-4 ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
          }`}>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black uppercase tracking-wider flex items-center gap-2">
                <User className="w-4 h-4 text-blue-500" />
                Daftar Tim IT ({filteredLocations.length})
              </h3>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Cari nama, role, atau lokasi..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full pl-9 pr-3 py-2 rounded-xl text-xs border font-medium focus:outline-none transition-all ${
                  isDark ? 'bg-slate-800 border-slate-700 text-white focus:border-blue-500' : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-blue-500'
                }`}
              />
            </div>

            {/* Status Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] font-bold">
              {[
                { id: 'all', label: 'Semua' },
                { id: 'online', label: 'Aktif Live' },
                { id: 'away', label: 'Baru Saja' },
                { id: 'offline', label: 'Inaktif' },
              ].map((btn) => (
                <button
                  key={btn.id}
                  onClick={() => setStatusFilter(btn.id as any)}
                  className={`px-3 py-1 rounded-xl transition-all whitespace-nowrap border ${
                    statusFilter === btn.id
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                      : isDark
                      ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                      : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {btn.label}
                </button>
              ))}
            </div>

            {/* Member Cards List */}
            <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
              {loading ? (
                <div className="py-12 text-center text-slate-400 space-y-2">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto text-blue-500" />
                  <p className="text-xs font-bold">Memuat koordinat tim...</p>
                </div>
              ) : filteredLocations.length === 0 ? (
                <div className="py-12 text-center text-slate-400 space-y-2 border border-dashed rounded-2xl p-4">
                  <AlertCircle className="w-8 h-8 mx-auto text-slate-400" />
                  <p className="text-xs font-bold">Tidak ada data anggota tim ditemukan.</p>
                </div>
              ) : (
                filteredLocations.map((loc) => {
                  const st = getOnlineStatus(loc.updated_at);
                  const isSelected = selectedUser?.username === loc.username;

                  return (
                    <div
                      key={loc.id}
                      className={`p-3.5 rounded-2xl border transition-all space-y-2.5 cursor-pointer ${
                        isSelected
                          ? 'border-blue-500 ring-2 ring-blue-500/20 shadow-md ' + (isDark ? 'bg-slate-800' : 'bg-blue-50/50')
                          : isDark
                          ? 'bg-slate-800/50 border-slate-700/80 hover:bg-slate-800'
                          : 'bg-slate-50 border-slate-200 hover:bg-slate-100/80'
                      }`}
                      onClick={() => handleFocusUser(loc)}
                    >
                      {/* Card Header */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="relative">
                            <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 flex items-center justify-center shrink-0 border border-slate-200 dark:border-slate-700 overflow-hidden relative shadow-sm">
                              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M4 20C4 16.8 6.8 15 12 15C17.2 15 20 16.8 20 20" fill="#3b82f6"/>
                                <path d="M9 20V16.5M15 20V16.5" stroke="#f59e0b" strokeWidth="1.5"/>
                                <circle cx="12" cy="11.5" r="3.2" fill="#fdba74"/>
                                <path d="M6.5 10.2C6.5 6.8 8.8 4.5 12 4.5C15.2 4.5 17.5 6.8 17.5 10.2H6.5Z" fill="#ffffff" stroke="#0f172a" strokeWidth="1.2"/>
                                <rect x="5" y="9.5" width="14" height="2.2" rx="1" fill="#ffffff" stroke="#0f172a" strokeWidth="1"/>
                                <path d="M11 4.8V7M13 4.8V7" stroke="#94a3b8" strokeWidth="1" strokeLinecap="round"/>
                              </svg>
                            </div>
                            <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white dark:border-slate-900 ${st.colorClass}`} />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <h4 className="font-extrabold text-xs truncate">{loc.full_name}</h4>
                              {loc.role === 'Super Admin' && (
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/30">
                                  SUPER
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-slate-400 font-bold uppercase">{loc.role || 'IT Support'}</p>
                          </div>
                        </div>

                        {/* Status Badge */}
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border shrink-0 ${st.badgeBg}`}>
                          {st.text}
                        </span>
                      </div>

                      {/* Info Details */}
                      <div className="text-[11px] space-y-1 text-slate-600 dark:text-slate-300">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400 font-bold text-[10px]">KOORDINAT</span>
                          <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                            {loc.latitude.toFixed(5)}, {loc.longitude.toFixed(5)}
                          </span>
                        </div>

                        {loc.address && (
                          <div className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-2">
                            📍 {loc.address}
                          </div>
                        )}

                        {loc.note && (
                          <div className="p-2 rounded-xl bg-blue-500/5 border border-blue-500/10 text-[10px] italic text-blue-700 dark:text-blue-300">
                            "{loc.note}"
                          </div>
                        )}

                        <div className="flex items-center justify-between pt-1 text-[10px] text-slate-400">
                          <span className="flex items-center gap-1">
                            <Battery className="w-3 h-3 text-emerald-500" />
                            <span>{loc.battery_level !== undefined ? `${loc.battery_level}%` : '85%'}</span>
                          </span>

                          <span className="flex items-center gap-1 font-semibold uppercase">
                            <Zap className="w-3 h-3 text-amber-500" />
                            <span>{loc.provider === 'traccar' ? 'Traccar Client' : loc.provider === 'checkin' ? 'Check-In Manual' : 'Web GPS'}</span>
                          </span>
                        </div>
                      </div>

                      {/* Card Action Bar */}
                      <div className="pt-2 border-t border-slate-200 dark:border-slate-700/80 flex flex-wrap items-center justify-between gap-1.5" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleFocusUser(loc)}
                          className="flex-1 min-w-[80px] py-1.5 rounded-xl text-[10px] font-bold bg-blue-600 hover:bg-blue-700 text-white transition-all flex items-center justify-center gap-1"
                        >
                          <Navigation className="w-3 h-3" />
                          <span>Fokus</span>
                        </button>

                        <button
                          onClick={() => handleOpenHistory(loc.username)}
                          className={`p-1.5 rounded-xl border text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-all ${
                            isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-100 border-slate-200'
                          }`}
                          title="Riwayat Jejak Lokasi"
                        >
                          <History className="w-3.5 h-3.5" />
                        </button>

                        <a
                          href={`https://maps.google.com/?q=${loc.latitude},${loc.longitude}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`p-1.5 rounded-xl border text-slate-500 hover:text-emerald-500 transition-all ${
                            isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-100 border-slate-200'
                          }`}
                          title="Buka Google Maps"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>

                        <button
                          onClick={() => handleDeleteUser(loc.username)}
                          className={`p-1.5 rounded-xl border text-slate-500 hover:text-red-500 transition-all ${
                            isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-100 border-slate-200'
                          }`}
                          title="Hapus Data Ini"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Traccar Client Setup Modal */}
      {showTraccarModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto py-6">
          <div className={`w-full max-w-xl p-5 sm:p-6 rounded-3xl border shadow-2xl space-y-4 max-h-[90vh] flex flex-col ${
            isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-2xl bg-indigo-500/10 text-indigo-500">
                  <Smartphone className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold">Panduan Setup Traccar Client (Background GPS)</h3>
                  <p className="text-xs text-slate-400">Tracking GPS otomatis saat aplikasi browser/PWA ditutup</p>
                </div>
              </div>
              <button
                onClick={() => setShowTraccarModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto space-y-4 text-xs pr-1">
              <div className="p-3.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-700 dark:text-indigo-300 space-y-1">
                <div className="font-extrabold flex items-center gap-1.5 text-xs">
                  <Info className="w-4 h-4 shrink-0" />
                  Mengapa Traccar Client?
                </div>
                <p className="text-[11px] leading-relaxed">
                  Aplikasi browser PWA tidak dapat mengakses GPS saat HP di-lock / aplikasi ditutup penuh karena pembatasan Android/iOS.
                  <strong>Traccar Client</strong> adalah aplikasi open-source gratis (2MB, tanpa iklan) yang berjalan hemat baterai di background tanpa notifikasi mengganggu.
                </p>
              </div>

              {/* Server URL Copy Box */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-slate-400">Server URL (Salin ke Traccar Client):</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={traccarServerUrl}
                    className={`w-full px-3 py-2 rounded-xl border font-mono text-xs font-bold ${
                      isDark ? 'bg-slate-800 border-slate-700 text-blue-400' : 'bg-slate-50 border-slate-200 text-blue-600'
                    }`}
                  />
                  <button
                    onClick={handleCopyTraccarUrl}
                    className="px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shrink-0 flex items-center gap-1 transition-all"
                  >
                    {copiedUrl ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    <span>Salin</span>
                  </button>
                </div>
              </div>

              {/* Step-by-Step Guide */}
              <div className="space-y-3 pt-2">
                <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-400">Langkah-Langkah Setup (3 Menit):</h4>

                <div className="p-3 rounded-2xl border space-y-1 border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                  <div className="font-extrabold text-blue-600 dark:text-blue-400">1. Install Traccar Client</div>
                  <p className="text-slate-500 dark:text-slate-400 text-[11px]">
                    Buka Play Store (Android) atau App Store (iOS), cari <strong>Traccar Client</strong> dan install (Gratis & Ringan).
                  </p>
                </div>

                <div className="p-3 rounded-2xl border space-y-1 border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                  <div className="font-extrabold text-blue-600 dark:text-blue-400">2. Isi Server URL</div>
                  <p className="text-slate-500 dark:text-slate-400 text-[11px]">
                    Atur <strong>Server URL</strong> ke: <code className="font-mono text-blue-500">{traccarServerUrl}</code>
                  </p>
                </div>

                <div className="p-3 rounded-2xl border space-y-1 border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                  <div className="font-extrabold text-blue-600 dark:text-blue-400">3. Isi Device Identifier (Username Anda)</div>
                  <p className="text-slate-500 dark:text-slate-400 text-[11px]">
                    Gunakan username aplikasi Anda:
                    <br />
                    - Yudha: <code className="font-mono font-bold text-emerald-500">yudha</code>
                    <br />
                    - Bayu: <code className="font-mono font-bold text-emerald-500">bayu</code>
                    <br />
                    - Dita: <code className="font-mono font-bold text-emerald-500">dita</code>
                  </p>
                </div>

                <div className="p-3 rounded-2xl border space-y-1 border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                  <div className="font-extrabold text-blue-600 dark:text-blue-400">4. Atur Frequency & Aktifkan Service</div>
                  <p className="text-slate-500 dark:text-slate-400 text-[11px]">
                    Atur Frequency ke <strong>300 detik</strong> (5 menit) agar sangat hemat baterai, lalu geser toggle <strong>Service Status = ON</strong>.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setShowTraccarModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-all"
              >
                Tutup Panduan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Check-In Modal */}
      {showCheckinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto py-6">
          <div className={`w-full max-w-md p-5 sm:p-6 rounded-3xl border shadow-2xl space-y-4 ${
            isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-emerald-500" />
                <h3 className="text-base font-extrabold">Check-In Lokasi Lapangan</h3>
              </div>
              <button
                onClick={() => setShowCheckinModal(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">
                  Catatan Kegiatan / Lokasi Saat Ini (Opsional):
                </label>
                <textarea
                  rows={3}
                  value={checkinNote}
                  onChange={(e) => setCheckinNote(e.target.value)}
                  placeholder="Contoh: Sedang melakukan pengecekan router & kabel LAN di Store Retail 3..."
                  className={`w-full p-3 rounded-xl border text-xs font-medium focus:outline-none transition-all ${
                    isDark ? 'bg-slate-800 border-slate-700 text-white focus:border-emerald-500' : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-emerald-500'
                  }`}
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={() => setShowCheckinModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-slate-200"
              >
                Batal
              </button>
              <button
                onClick={handlePerformCheckin}
                disabled={submittingCheckin}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all flex items-center gap-1.5"
              >
                {submittingCheckin ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                <span>Kirim Check-In</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* History Log Modal */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto py-6">
          <div className={`w-full max-w-xl p-5 sm:p-6 rounded-3xl border shadow-2xl space-y-4 max-h-[85vh] flex flex-col ${
            isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-blue-500" />
                <h3 className="text-base font-extrabold">Riwayat Jejak Lokasi ({historyUser})</h3>
              </div>
              <button
                onClick={() => setShowHistoryModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto space-y-2.5 flex-1 pr-1">
              {historyLogs.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs font-bold">
                  Belum ada log riwayat lokasi tercatat.
                </div>
              ) : (
                historyLogs.map((log) => (
                  <div
                    key={log.id}
                    className={`p-3 rounded-2xl border text-xs space-y-1 ${
                      isDark ? 'bg-slate-800/60 border-slate-700' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between font-bold">
                      <span className="text-blue-500 font-mono">
                        {log.latitude.toFixed(5)}, {log.longitude.toFixed(5)}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(log.created_at).toLocaleString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-400 truncate">
                      📍 {log.address || 'Lokasi terdaftar'}
                    </div>

                    {log.note && (
                      <div className="text-[10px] text-emerald-600 dark:text-emerald-400 italic">
                        "{log.note}"
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setShowHistoryModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-all"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Manual User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className={`w-full max-w-md rounded-3xl shadow-2xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-500 border border-blue-500/20">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-lg">Tambah Tim Manual</h3>
                  <p className="text-[11px] text-slate-500">Mendaftarkan data ID untuk Traccar</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddUser} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">
                  Device ID (Username) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={addUsername}
                  onChange={(e) => setAddUsername(e.target.value)}
                  placeholder="Contoh: it-jkt-01"
                  className={`w-full px-3.5 py-2.5 rounded-xl text-sm border font-medium focus:outline-none focus:border-blue-500 transition-all ${
                    isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
                  }`}
                />
                <p className="text-[10px] text-slate-500 mt-1">ID ini harus sama dengan Device ID yang disetting di aplikasi Traccar Client (HP user).</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">
                  Nama Lengkap <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={addFullName}
                  onChange={(e) => setAddFullName(e.target.value)}
                  placeholder="Contoh: Budi Santoso"
                  className={`w-full px-3.5 py-2.5 rounded-xl text-sm border font-medium focus:outline-none focus:border-blue-500 transition-all ${
                    isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">
                  Role (Opsional)
                </label>
                <input
                  type="text"
                  value={addRole}
                  onChange={(e) => setAddRole(e.target.value)}
                  placeholder="Contoh: IT Support"
                  className={`w-full px-3.5 py-2.5 rounded-xl text-sm border font-medium focus:outline-none focus:border-blue-500 transition-all ${
                    isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
                  }`}
                />
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                    isDark ? 'border-slate-700 hover:bg-slate-800' : 'border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white transition-all shadow-md"
                >
                  Simpan & Daftarkan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamLocationTracker;
