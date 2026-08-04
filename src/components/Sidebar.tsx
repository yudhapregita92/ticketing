import React from 'react';
import { motion } from 'framer-motion';
import { 
  Bell, 
  AlertCircle, 
  CheckCircle2, 
  TrendingUp, 
  BarChart3, 
  ChevronUp, 
  ChevronDown, 
  Zap,
  Send,
  Package,
  Activity,
  FileText,
  BookOpen,
  Settings2,
  ShieldCheck,
  UserPlus,
  Printer,
  LogOut,
  Database,
  Users,
  MonitorSmartphone,
  Timer,
  Building2,
  Layers,
  ClipboardList,
  Ticket,
  Compass,
  MapPin
} from 'lucide-react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip as RechartsTooltip 
} from 'recharts';
import { IAdminUser, ITicket, COLORS, ViewMode } from '../types';
import { Counter } from './Common';
import { APP_VERSION, getEnvironment } from '../version';

interface SidebarProps {
  adminUser: IAdminUser | null;
  isDark: boolean;
  themeClasses: any;
  tickets: ITicket[];
  filteredTickets: ITicket[];
  categoryStats: { name: string, value: number }[];
  showDistribution: boolean;
  setShowDistribution: (show: boolean) => void;
  primaryColor: string;
  setShowForm: (show: boolean) => void;
  fetchTickets: (showLoading?: boolean) => void;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  assetSubTab?: 'all' | 'Capex' | 'Opex' | 'borrowed';
  setAssetSubTab?: (tab: 'all' | 'Capex' | 'Opex' | 'borrowed') => void;
  setShowLogin?: (show: boolean) => void;
  handleLogout?: () => void;
  userCanVoucher?: boolean;
  adminThemeLayout?: string;
}

// Helper to safely parse date strings for Safari compatibility
const parseSafeDate = (dateString: string): Date => {
  if (!dateString) return new Date();
  const normalizedDate = dateString.includes('T') || dateString.includes('Z') 
    ? dateString 
    : dateString.replace(' ', 'T');
  return new Date(normalizedDate);
};

export const Sidebar: React.FC<SidebarProps> = ({
  adminUser,
  isDark,
  themeClasses,
  tickets,
  filteredTickets,
  categoryStats,
  showDistribution,
  setShowDistribution,
  primaryColor,
  setShowForm,
  fetchTickets,
  viewMode,
  setViewMode,
  assetSubTab,
  setAssetSubTab,
  setShowLogin,
  handleLogout,
  userCanVoucher,
  adminThemeLayout
}) => {
  const [ticketMenuOpen, setTicketMenuOpen] = React.useState(viewMode === 'today' || viewMode === 'all' || viewMode === 'my_tickets');
  const [masterDataOpen, setMasterDataOpen] = React.useState(viewMode === 'master_user' || viewMode === 'master_perangkat' || viewMode === 'master_team');
  const [reportOpen, setReportOpen] = React.useState(viewMode === 'report_sla' || viewMode === 'report_perangkat');
  const [assetMenuOpen, setAssetMenuOpen] = React.useState(viewMode === 'assets');

  const getMenuItemClass = (isActive: boolean) => {
    const base = `w-full flex items-center ${
      adminThemeLayout === 'compact' ? 'justify-center p-2.5' : 'justify-between px-3 py-2'
    } rounded-[var(--admin-btn-radius,14px)] transition-all text-xs font-semibold active:scale-95 `;
    
    if (isActive) {
      if (adminUser) {
        return (
          base +
          (isDark
            ? 'bg-[#1d2b3e] text-[#60a5fa] border border-[#3b82f6]/70 shadow-xs font-bold'
            : 'bg-[#ebf3ff] text-[#1d4ed8] border border-[#3b82f6]/60 shadow-xs font-bold')
        );
      } else {
        return (
          base +
          (isDark
            ? 'bg-emerald-950/70 text-emerald-400 border border-emerald-600/70 shadow-xs font-bold'
            : 'bg-emerald-50 text-emerald-700 border border-emerald-500/60 shadow-xs font-bold')
        );
      }
    }
    return (
      base +
      (isDark
        ? 'text-slate-300 hover:bg-slate-800/60 hover:text-slate-100 border border-transparent'
        : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-800 border border-transparent')
    );
  };

  React.useEffect(() => {
    if (viewMode === 'today' || viewMode === 'all' || viewMode === 'my_tickets') {
      setTicketMenuOpen(true);
    } else if (viewMode === 'master_user' || viewMode === 'master_perangkat' || viewMode === 'master_team') {
      setMasterDataOpen(true);
    } else if (viewMode === 'report_sla' || viewMode === 'report_perangkat') {
      setReportOpen(true);
    } else if (viewMode === 'assets') {
      setAssetMenuOpen(true);
    }
  }, [viewMode]);

  return (
    <div className="lg:col-span-1 space-y-3 lg:space-y-4">
      {/* Sidebar Menu - Desktop Only */}
      <section className={`hidden lg:block ${themeClasses.card} ${adminUser ? 'rounded-none border-t-0 -mt-2 lg:-mt-4' : 'rounded-[1.5rem]'} border ${adminThemeLayout === 'compact' ? 'p-1.5' : 'p-3'} shadow-sm`}>
        {adminThemeLayout !== 'compact' && (
          <div className="flex items-center gap-2 mb-2 px-2">
            <div className={`w-6 h-6 rounded-lg flex items-center justify-center border ${
              adminUser 
                ? (isDark ? 'bg-sky-900/30 text-sky-400 border-sky-800' : 'bg-sky-50 text-sky-600 border-sky-200')
                : (isDark ? 'bg-emerald-900/30 text-emerald-400 border-emerald-800' : 'bg-emerald-50 text-emerald-600 border-emerald-200')
            }`}>
              <Send className="w-3 h-3" />
            </div>
            <h2 className={`text-xs font-bold capitalize tracking-tight ${isDark ? 'text-white' : 'text-slate-700'}`}>Menu Navigasi</h2>
          </div>
        )}
        
        <div className="space-y-1">
          {adminUser && (
            <button
              onClick={() => setViewMode('dashboard')}
              title="Dashboard"
              className={getMenuItemClass(viewMode === 'dashboard')}
            >
              <div className="flex items-center gap-2.5">
                <BarChart3 className="w-4 h-4" />
                {adminThemeLayout !== 'compact' && <span>Dashboard</span>}
              </div>
            </button>
          )}
          
          {/* Menu Group: Tiket */}
          {adminUser ? (
            <div className="space-y-1">
              <button
                onClick={() => {
                  setTicketMenuOpen(!ticketMenuOpen);
                }}
                title="Tiket"
                className={getMenuItemClass(viewMode === 'today' || viewMode === 'all' || viewMode === 'my_tickets' || ticketMenuOpen)}
              >
                <div className="flex items-center gap-2.5">
                  <Ticket className="w-4 h-4" />
                  {adminThemeLayout !== 'compact' && <span>Tiket</span>}
                </div>
                {adminThemeLayout !== 'compact' && (
                  ticketMenuOpen ? <ChevronUp className="w-3.5 h-3.5 opacity-80" /> : <ChevronDown className="w-3.5 h-3.5 opacity-80" />
                )}
              </button>

              {ticketMenuOpen && (
                <div className={`space-y-1 ${adminThemeLayout !== 'compact' ? 'pl-9' : ''}`}>
                  <button
                    onClick={() => setViewMode('today')}
                    title="Antrian Hari Ini"
                    className={getMenuItemClass(viewMode === 'today')}
                  >
                    <div className="flex items-center gap-2.5 relative">
                      <Zap className="w-3.5 h-3.5" />
                      {adminThemeLayout !== 'compact' && <span>Antrian Hari Ini</span>}
                      {adminThemeLayout === 'compact' && tickets.filter(t => new Date(t.created_at).toLocaleDateString('en-CA') === new Date().toLocaleDateString('en-CA')).length > 0 && (
                        <span className="absolute -top-1.5 -right-1.5 px-1 py-0.5 bg-rose-500 text-white text-[7px] font-bold rounded-full scale-90">
                          {tickets.filter(t => new Date(t.created_at).toLocaleDateString('en-CA') === new Date().toLocaleDateString('en-CA')).length}
                        </span>
                      )}
                    </div>
                    {adminThemeLayout !== 'compact' && tickets.filter(t => new Date(t.created_at).toLocaleDateString('en-CA') === new Date().toLocaleDateString('en-CA')).length > 0 && (
                      <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-700 text-[9px] font-black rounded-full">
                        {tickets.filter(t => new Date(t.created_at).toLocaleDateString('en-CA') === new Date().toLocaleDateString('en-CA')).length}
                      </span>
                    )}
                  </button>
                  
                  <button
                    onClick={() => setViewMode('all')}
                    title="Semua Antrian"
                    className={getMenuItemClass(viewMode === 'all')}
                  >
                    <div className="flex items-center gap-2.5">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {adminThemeLayout !== 'compact' && <span>Semua Antrian</span>}
                    </div>
                  </button>
                  
                  <button
                    onClick={() => setViewMode('my_tickets')}
                    title="Tiket Saya"
                    className={getMenuItemClass(viewMode === 'my_tickets')}
                  >
                    <div className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {adminThemeLayout !== 'compact' && <span>Tiket Saya</span>}
                    </div>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-1">
              <button
                onClick={() => setViewMode('today')}
                title="Antrian Hari Ini"
                className={getMenuItemClass(viewMode === 'today')}
              >
                <div className="flex items-center gap-2.5 relative">
                  <Zap className="w-4 h-4" />
                  {adminThemeLayout !== 'compact' && <span>Antrian Hari Ini</span>}
                  {adminThemeLayout === 'compact' && tickets.filter(t => new Date(t.created_at).toLocaleDateString('en-CA') === new Date().toLocaleDateString('en-CA')).length > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 px-1 py-0.5 bg-rose-500 text-white text-[7px] font-bold rounded-full scale-90">
                      {tickets.filter(t => new Date(t.created_at).toLocaleDateString('en-CA') === new Date().toLocaleDateString('en-CA')).length}
                    </span>
                  )}
                </div>
                {adminThemeLayout !== 'compact' && tickets.filter(t => new Date(t.created_at).toLocaleDateString('en-CA') === new Date().toLocaleDateString('en-CA')).length > 0 && (
                  <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-700 text-[9px] font-black rounded-full">
                    {tickets.filter(t => new Date(t.created_at).toLocaleDateString('en-CA') === new Date().toLocaleDateString('en-CA')).length}
                  </span>
                )}
              </button>
              
              <button
                onClick={() => setViewMode('all')}
                title="Semua Antrian"
                className={getMenuItemClass(viewMode === 'all')}
              >
                <div className="flex items-center gap-2.5">
                  <AlertCircle className="w-4 h-4" />
                  {adminThemeLayout !== 'compact' && <span>Semua Antrian</span>}
                </div>
              </button>
              
              <button
                onClick={() => setViewMode('my_tickets')}
                title="Riwayat Tiket Saya"
                className={getMenuItemClass(viewMode === 'my_tickets')}
              >
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4" />
                  {adminThemeLayout !== 'compact' && <span>Riwayat Tiket Saya</span>}
                </div>
              </button>
            </div>
          )}
          
          {(adminUser || userCanVoucher) && (
            <button
              onClick={() => setViewMode('voucher')}
              title={adminUser ? 'Cetak Voucher' : 'Buat Voucher'}
              className={getMenuItemClass(viewMode === 'voucher')}
            >
              <div className="flex items-center gap-2.5">
                <Printer className="w-4 h-4" />
                {adminThemeLayout !== 'compact' && <span>{adminUser ? 'Cetak Voucher' : 'Buat Voucher'}</span>}
              </div>
            </button>
          )}
          
          {adminUser && (
            <>
              <div className="space-y-1">
                <button
                  onClick={() => {
                    if (viewMode !== 'assets') setViewMode('assets');
                    setAssetMenuOpen(!assetMenuOpen);
                  }}
                  title="Manajemen Aset"
                  className={getMenuItemClass(viewMode === 'assets' || assetMenuOpen)}
                >
                  <div className="flex items-center gap-2.5">
                    <Package className="w-4 h-4" />
                    {adminThemeLayout !== 'compact' && <span>Manajemen Aset</span>}
                  </div>
                  {adminThemeLayout !== 'compact' && (
                    assetMenuOpen || viewMode === 'assets' ? <ChevronUp className="w-3.5 h-3.5 opacity-80" /> : <ChevronDown className="w-3.5 h-3.5 opacity-80" />
                  )}
                </button>

                {assetMenuOpen && (
                  <div className={`space-y-1 ${adminThemeLayout !== 'compact' ? 'pl-9' : ''}`}>
                    <button
                      onClick={() => {
                        setViewMode('assets');
                        if (setAssetSubTab) setAssetSubTab('all');
                      }}
                      title="Semua Aset"
                      className={getMenuItemClass(viewMode === 'assets' && (assetSubTab === 'all' || !assetSubTab))}
                    >
                      <div className="flex items-center gap-2.5">
                        <Package className="w-3 h-3" />
                        {adminThemeLayout !== 'compact' && <span>Semua Aset</span>}
                      </div>
                    </button>

                    <button
                      onClick={() => {
                        setViewMode('assets');
                        if (setAssetSubTab) setAssetSubTab('Capex');
                      }}
                      title="Capex (Capital Expenditure)"
                      className={getMenuItemClass(viewMode === 'assets' && assetSubTab === 'Capex')}
                    >
                      <div className="flex items-center gap-2.5">
                        <Building2 className="w-3 h-3" />
                        {adminThemeLayout !== 'compact' && <span>Aset Capex</span>}
                      </div>
                    </button>

                    <button
                      onClick={() => {
                        setViewMode('assets');
                        if (setAssetSubTab) setAssetSubTab('Opex');
                      }}
                      title="Opex (Operational Expenditure)"
                      className={getMenuItemClass(viewMode === 'assets' && assetSubTab === 'Opex')}
                    >
                      <div className="flex items-center gap-2.5">
                        <Layers className="w-3 h-3" />
                        {adminThemeLayout !== 'compact' && <span>Aset Opex</span>}
                      </div>
                    </button>

                    <button
                      onClick={() => {
                        setViewMode('assets');
                        if (setAssetSubTab) setAssetSubTab('borrowed');
                      }}
                      title="Perangkat Dipinjam (IT Loan)"
                      className={getMenuItemClass(viewMode === 'assets' && assetSubTab === 'borrowed')}
                    >
                      <div className="flex items-center gap-2.5">
                        <ClipboardList className="w-3 h-3" />
                        {adminThemeLayout !== 'compact' && <span>Perangkat Dipinjam</span>}
                      </div>
                    </button>
                  </div>
                )}
              </div>
              
              <button
                onClick={() => setViewMode('membership')}
                title="Membership"
                className={getMenuItemClass(viewMode === 'membership')}
              >
                <div className="flex items-center gap-2.5">
                  <UserPlus className="w-4 h-4" />
                  {adminThemeLayout !== 'compact' && <span>Membership</span>}
                </div>
              </button>

              <button
                onClick={() => setViewMode('evaluasi_project')}
                title="Evaluasi Project"
                className={getMenuItemClass(viewMode === 'evaluasi_project')}
              >
                <div className="flex items-center gap-2.5">
                  <TrendingUp className="w-4 h-4" />
                  {adminThemeLayout !== 'compact' && <span>Evaluasi Project</span>}
                </div>
              </button>

              <div className="space-y-1">
                <button
                  onClick={() => setReportOpen(!reportOpen)}
                  title="Report"
                  className={getMenuItemClass(viewMode === 'report_sla' || viewMode === 'report_perangkat' || reportOpen)}
                >
                  <div className="flex items-center gap-2.5">
                    <Timer className="w-4 h-4" />
                    {adminThemeLayout !== 'compact' && <span>Report</span>}
                  </div>
                  {adminThemeLayout !== 'compact' && (
                    reportOpen ? <ChevronUp className="w-3.5 h-3.5 opacity-80" /> : <ChevronDown className="w-3.5 h-3.5 opacity-80" />
                  )}
                </button>

                {reportOpen && (
                  <div className={`space-y-1 ${adminThemeLayout !== 'compact' ? 'pl-9' : ''}`}>
                    <button
                      onClick={() => setViewMode('report_sla')}
                      title="Report SLA"
                      className={getMenuItemClass(viewMode === 'report_sla')}
                    >
                      <div className="flex items-center gap-2.5">
                        <Timer className="w-3 h-3" />
                        {adminThemeLayout !== 'compact' && <span>Report SLA</span>}
                      </div>
                    </button>
                    <button
                      onClick={() => setViewMode('report_perangkat')}
                      title="Report Perangkat"
                      className={getMenuItemClass(viewMode === 'report_perangkat')}
                    >
                      <div className="flex items-center gap-2.5">
                        <Activity className="w-3 h-3" />
                        {adminThemeLayout !== 'compact' && <span>Perangkat</span>}
                      </div>
                    </button>
                  </div>
                )}
              </div>
              
              {(adminUser.role === 'Super Admin' || adminUser.role === 'Staff IT Support') && (
                <>
                  <div className="space-y-1">
                    <button
                      onClick={() => setMasterDataOpen(!masterDataOpen)}
                      title="Master Data"
                      className={getMenuItemClass(viewMode === 'master_user' || viewMode === 'master_perangkat' || viewMode === 'master_team' || masterDataOpen)}
                    >
                      <div className="flex items-center gap-2.5">
                        <Database className="w-4 h-4" />
                        {adminThemeLayout !== 'compact' && <span>Master Data</span>}
                      </div>
                      {adminThemeLayout !== 'compact' && (
                        masterDataOpen ? <ChevronUp className="w-3.5 h-3.5 opacity-80" /> : <ChevronDown className="w-3.5 h-3.5 opacity-80" />
                      )}
                    </button>

                    {masterDataOpen && (
                      <div className={`space-y-1 ${adminThemeLayout !== 'compact' ? 'pl-9' : ''}`}>
                        <button
                          onClick={() => setViewMode('master_user')}
                          title="Master Data (User)"
                          className={getMenuItemClass(viewMode === 'master_user')}
                        >
                          <div className="flex items-center gap-2.5">
                            <Users className="w-3 h-3" />
                            {adminThemeLayout !== 'compact' && <span>Master Data (User)</span>}
                          </div>
                        </button>
                        <button
                          onClick={() => setViewMode('master_perangkat')}
                          title="Perangkat"
                          className={getMenuItemClass(viewMode === 'master_perangkat')}
                        >
                          <div className="flex items-center gap-2.5">
                            <MonitorSmartphone className="w-3 h-3" />
                            {adminThemeLayout !== 'compact' && <span>Perangkat</span>}
                          </div>
                        </button>
                        <button
                          onClick={() => setViewMode('master_team')}
                          title="Tim IT Support & Topologi"
                          className={getMenuItemClass(viewMode === 'master_team')}
                        >
                          <div className="flex items-center gap-2.5">
                            <ShieldCheck className="w-3 h-3" />
                            {adminThemeLayout !== 'compact' && <span>Tim IT & Topologi</span>}
                          </div>
                        </button>
                      </div>
                    )}
                  </div>

                  <button
                  onClick={() => setViewMode('network')}
                  title="Monitoring Jaringan"
                  className={getMenuItemClass(viewMode === 'network')}
                >
                  <div className="flex items-center gap-2.5">
                    <Activity className="w-4 h-4" />
                    {adminThemeLayout !== 'compact' && <span>Monitoring Jaringan</span>}
                  </div>
                </button>
                </>
              )}

              {adminUser && adminUser.role === 'Super Admin' && (
                <>
                  <button
                    onClick={() => setViewMode('team_location')}
                    title="Lokasi Team (Tracking GPS)"
                    className={getMenuItemClass(viewMode === 'team_location')}
                  >
                    <div className="flex items-center gap-2.5">
                      <Compass className="w-4 h-4 text-blue-500" />
                      {adminThemeLayout !== 'compact' && <span>Lokasi Team (GPS)</span>}
                    </div>
                  </button>

                  <button
                    onClick={() => setViewMode('ba')}
                    title="Surat Rekomendasi / BA"
                    className={getMenuItemClass(viewMode === 'ba')}
                  >
                    <div className="flex items-center gap-2.5">
                      <FileText className="w-4 h-4" />
                      {adminThemeLayout !== 'compact' && <span>Surat Rekomendasi / BA</span>}
                    </div>
                  </button>
                </>
              )}
            </>
          )}

          <button
            onClick={() => setViewMode('panduan')}
            title="Panduan"
            className={getMenuItemClass(viewMode === 'panduan')}
          >
            <div className="flex items-center gap-2.5">
              <BookOpen className="w-4 h-4" />
              {adminThemeLayout !== 'compact' && <span>Panduan</span>}
            </div>
          </button>

          {adminUser && (
            <>
              <button
                onClick={() => setViewMode('settings')}
                title="Pengaturan Sistem"
                className={getMenuItemClass(viewMode === 'settings')}
              >
                <div className="flex items-center gap-2.5">
                  <Settings2 className="w-4 h-4" />
                  {adminThemeLayout !== 'compact' && <span>Pengaturan Sistem</span>}
                </div>
              </button>

              <button
                onClick={() => setViewMode('testing')}
                title="Menu Testing"
                className={getMenuItemClass(viewMode === 'testing')}
              >
                <div className="flex items-center gap-2.5">
                  <Activity className="w-4 h-4" />
                  {adminThemeLayout !== 'compact' && <span>Menu Testing</span>}
                </div>
              </button>
            </>
          )}

          {!adminUser && handleLogout && (
            <div className="pt-2 mt-2 border-t border-slate-100 dark:border-slate-800/60">
              <button
                onClick={handleLogout}
                title="Keluar"
                className={`w-full flex items-center ${adminThemeLayout === 'compact' ? 'justify-center p-2.5' : 'justify-between px-3 py-2'} rounded-none transition-all text-xs font-black capitalize tracking-wider border border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400`}
              >
                <LogOut className="w-4 h-4" />
                {adminThemeLayout !== 'compact' && <span>Keluar</span>}
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Admin Notifications */}
      {adminUser && adminThemeLayout !== 'compact' && (
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ y: -4, boxShadow: isDark ? "0 20px 40px -10px rgba(0,0,0,0.5)" : "0 20px 40px -10px rgba(0,0,0,0.05)" }}
          className={`${themeClasses.card} rounded-none border p-3 sm:p-4 shadow-sm overflow-hidden relative`}
        >
          <div className="absolute top-0 right-0 p-4 opacity-5">
            <Bell className={`w-20 h-20 ${isDark ? 'text-white' : 'text-slate-900'}`} />
          </div>
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-none flex items-center justify-center border ${isDark ? 'bg-rose-900/30 text-rose-400 border-rose-800' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <h2 className={`text-xs font-bold capitalize tracking-tight ${isDark ? 'text-white' : 'text-slate-900'} whitespace-nowrap`}>Smart Notifications</h2>
                <p className="text-[9px] text-slate-400 font-medium">Real-time system alerts</p>
              </div>
            </div>
            {typeof window !== 'undefined' && "Notification" in window && Notification.permission !== "granted" && (
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => Notification.requestPermission().then(() => fetchTickets())}
                className="p-2 rounded-none bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 transition-all group"
                title="Aktifkan Notifikasi Browser"
              >
                <Bell className="w-4 h-4 animate-bounce group-hover:animate-none" />
              </motion.button>
            )}
          </div>
          
          <div className="space-y-3">
            {tickets.filter(t => t.status === 'New').length > 0 ? (
              <div className="p-3 bg-rose-50/50 rounded-none border border-rose-100 group hover:bg-rose-50 transition-all">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="flex items-center gap-1.5 text-[9px] font-bold text-rose-600 capitalize tracking-wider whitespace-nowrap">
                    <motion.div
                      animate={{ rotate: [-10, 10, -10, 10, 0] }}
                      transition={{ repeat: Infinity, duration: 0.5, repeatDelay: 2 }}
                    >
                      <AlertCircle className="w-3 h-3" />
                    </motion.div>
                    Action Required
                  </span>
                  <span className="px-1.5 py-0.5 bg-rose-600 text-white text-[9px] font-bold rounded-none animate-pulse shadow-sm shadow-rose-200">
                    {tickets.filter(t => t.status === 'New').length}
                  </span>
                </div>
                <p className="text-[10px] text-rose-700 font-semibold leading-tight">Ada tiket yang menunggu respon Anda segera.</p>
              </div>
            ) : (
              <div className="p-4 bg-emerald-50/50 rounded-none border border-emerald-100">
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
                  <div className="p-3 bg-blue-50/50 rounded-none border border-blue-100 group hover:bg-blue-50 transition-all">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="flex items-center gap-1.5 text-[9px] font-bold text-blue-600 capitalize tracking-wider whitespace-nowrap">
                        <TrendingUp className="w-3 h-3" /> Traffic Update
                      </span>
                      <span className="px-1.5 py-0.5 bg-blue-600 text-white text-[9px] font-bold rounded-none shadow-sm shadow-blue-200">
                        {newToday}
                      </span>
                    </div>
                    <p className="text-[10px] text-blue-700 font-semibold leading-tight">Tiket baru masuk hari ini.</p>
                  </div>
                );
              }
              return null;
            })()}
          </div>
        </motion.section>
      )}

      {/* Queue Statistics */}
      {adminThemeLayout !== 'compact' && (
        <section className={`${themeClasses.card} rounded-none border p-3 shadow-sm`}>
          <div className="flex items-center justify-between mb-2">
            <h2 className={`text-sm font-bold ${themeClasses.text}`}>Status Antrian</h2>
            <BarChart3 className="w-4 h-4 text-slate-300" />
          </div>
          <div className="grid grid-cols-4 gap-1.5">
            <motion.div 
              whileHover={{ y: -2, scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`${themeClasses.card} ${themeClasses.border} border rounded-none p-1.5 flex flex-col items-center justify-center text-center`}
            >
              <Counter value={filteredTickets.length} className={`text-sm font-black leading-none mb-0.5 ${themeClasses.text}`} />
              <span className="text-[8px] font-bold text-slate-400 capitalize tracking-tight whitespace-nowrap">Total</span>
            </motion.div>
            <motion.div 
              whileHover={{ y: -2, scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`${isDark ? 'bg-indigo-500/10 border-indigo-500/20' : 'bg-indigo-50 border-indigo-100'} border rounded-none p-1.5 flex flex-col items-center justify-center text-center`}
            >
              <Counter value={tickets.filter(t => t.status === 'New').length} className="text-sm font-black text-indigo-500 leading-none mb-0.5" />
              <span className="text-[8px] font-bold text-indigo-500 capitalize tracking-tight whitespace-nowrap">Baru</span>
            </motion.div>
            <motion.div 
              whileHover={{ y: -2, scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`${isDark ? 'bg-blue-500/10 border-blue-500/20' : 'bg-blue-50 border-blue-100'} border rounded-none p-1.5 flex flex-col items-center justify-center text-center`}
            >
              <Counter value={tickets.filter(t => t.status === 'In Progress').length} className="text-sm font-black text-blue-500 leading-none mb-0.5" />
              <span className="text-[8px] font-bold text-blue-500 capitalize tracking-tight whitespace-nowrap">Progres</span>
            </motion.div>
            <motion.div 
              whileHover={{ y: -2, scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`${isDark ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-emerald-50 border-emerald-100'} border rounded-none p-1.5 flex flex-col items-center justify-center text-center`}
            >
              <Counter value={tickets.filter(t => t.status === 'Completed').length} className="text-sm font-black text-emerald-500 leading-none mb-0.5" />
              <span className="text-[8px] font-bold text-emerald-500 capitalize tracking-tight whitespace-nowrap">Selesai</span>
            </motion.div>
          </div>
        </section>
      )}

      {/* Issue Distribution (Pie Chart) */}
      {adminUser && adminThemeLayout !== 'compact' && categoryStats.length > 0 && (
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`${themeClasses.card} rounded-none border p-3 sm:p-4 shadow-sm`}
        >
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <h2 className={`text-sm font-bold capitalize tracking-wider ${themeClasses.text}`}>Distribusi Masalah</h2>
            <button 
              onClick={() => setShowDistribution(!showDistribution)}
              className={`p-1.5 rounded-none transition-all ${isDark ? 'hover:bg-zinc-800' : 'hover:bg-zinc-100'}`}
            >
              {showDistribution ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>

          {showDistribution && (
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
                      <Cell key={`cell-sb-pie-${entry.name || 'cat'}-${index}`} fill={COLORS[index % COLORS.length]} />
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
          )}
          <div className="grid grid-cols-2 gap-y-2 mt-4">
            {categoryStats.map((stat, idx) => (
              <div key={`${stat.name}-${idx}`} className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                <span className={`text-[10px] font-bold capitalize truncate ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{stat.name}</span>
              </div>
            ))}
          </div>
        </motion.section>
      )}

      {/* Help CTA */}
      {(!adminUser || adminUser.role === 'Super Admin') && (
      <section 
        className={`hidden lg:block ${adminUser ? 'rounded-none' : 'rounded-3xl'} p-6 text-white shadow-xl relative overflow-hidden group transition-all`}
        style={{ backgroundColor: primaryColor, boxShadow: `0 20px 25px -5px ${primaryColor}30` }}
      >
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
          <Zap className="w-20 h-20" />
        </div>
        <h3 className="font-black text-lg mb-2">Butuh Bantuan?</h3>
        <p className="text-white/80 text-xs leading-relaxed mb-4 font-medium">
          Kirim tiket untuk masalah teknis. Tim IT kami akan memproses permintaan Anda sesegera mungkin.
        </p>
        <button 
          onClick={() => setShowForm(true)}
          className={`w-full font-bold py-3 px-2 ${adminUser ? 'rounded-none' : 'rounded-2xl'} text-xs transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2 ${
            isDark ? 'bg-slate-900 text-white hover:bg-slate-800' : 'bg-white text-slate-900 hover:bg-slate-50'
          }`}
        >
          <motion.div
            className="shrink-0"
            animate={{ 
              scale: [1, 1.2, 1],
              opacity: [1, 0.8, 1]
            }}
            transition={{ repeat: Infinity, duration: 2 }}
          >
            <Send className="w-4 h-4 text-emerald-500" />
          </motion.div>
          <span className="whitespace-nowrap">Buat Tiket Sekarang</span>
        </button>
      </section>
      )}

      {/* App Version Info - Desktop Only */}
      <div className="hidden lg:flex flex-col items-center justify-center py-2 opacity-30">
        <p className={`text-[9px] font-bold tracking-widest ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
          IT HELPDESK K3DK v{APP_VERSION} ({getEnvironment()})
        </p>
        <p className={`text-[7px] font-medium ${isDark ? 'text-slate-600' : 'text-slate-500'}`}>
          © 2026 Professional Ticketing System
        </p>
      </div>
    </div>
  );
};
