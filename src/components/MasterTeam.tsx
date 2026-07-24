import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserCheck, 
  ShieldCheck, 
  Cpu, 
  Laptop, 
  Network, 
  Phone, 
  Mail, 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  FileText, 
  Printer, 
  Clock, 
  Target, 
  CheckCircle2, 
  ChevronDown, 
  ChevronUp, 
  Building, 
  Briefcase, 
  Award, 
  Sparkles, 
  RefreshCw,
  Info,
  ExternalLink,
  MessageSquare,
  Shield,
  SlidersHorizontal,
  X,
  Check,
  Zap,
  ArrowDown
} from 'lucide-react';

export interface ITeamMember {
  id: string;
  name: string;
  nip: string;
  role: 'Sub Dept Head' | 'Section Head' | 'Digitalization Specialist' | 'Pelaksana IT';
  subRoleTitle: string; // e.g. "Sub Dept Head IT & Digitalization", "Section Head IT Support", "Digitalization Specialist", "Pelaksana IT"
  email: string;
  phone: string;
  avatar?: string;
  shift: string;
  status: 'Aktif' | 'On Duty' | 'Cuti' | 'Off';
  specialization: string[];
  jobdesks: string[];
  notes?: string;
}

const DEFAULT_TEAM: ITeamMember[] = [
  {
    id: 'team-subdept',
    name: 'Ir. Ahmad Hidayat, S.T., M.Kom',
    nip: 'IT-001 / 19850412',
    role: 'Sub Dept Head',
    subRoleTitle: 'Sub Dept Head IT & Digitalization',
    email: 'ahmad.hidayat@company.com',
    phone: '081234567890',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    shift: 'Non-Shift (08.00 - 17.00)',
    status: 'Aktif',
    specialization: ['IT Strategy & Governance', 'Digital Transformation', 'Resource Management', 'Enterprise Architecture'],
    jobdesks: [
      'Memimpin dan merumuskan strategi teknologi informasi, keamanan cyber, serta roadmap digitalisasi perusahaan.',
      'Mengawasi ketaatan performa kerja dan pemenuhan operasional dari Section Head IT Support & Digitalization Specialist.',
      'Pengambilan keputusan strategis terkait investasi infrastruktur IT, lisensi software, dan sistem enterprise.',
      'Evaluasi kinerja berkala seluruh tim IT dan pelaporan rutin ke jajaran Manajemen Direksi.',
      'Memastikan perlindungan integritas data, mitigasi risiko bencana IT (Disaster Recovery Plan), dan kepatuhan audit.'
    ],
    notes: 'Pimpinan tertinggi Sub Departemen IT & Digitalisasi Perusahaan.'
  },
  {
    id: 'team-sectionhead',
    name: 'Budi Santoso, S.T.',
    nip: 'IT-002 / 19880210',
    role: 'Section Head',
    subRoleTitle: 'Section Head IT Support',
    email: 'budi.santoso@company.com',
    phone: '081298765432',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    shift: 'Non-Shift (08.00 - 17.00)',
    status: 'Aktif',
    specialization: ['Helpdesk Operations', 'Network & Hardware Oversight', 'Escalation Lead', 'Vendor Management'],
    jobdesks: [
      'Mengoordinasikan dan membagi beban tugas harian kepada 2 Pelaksana IT Support.',
      'Memastikan kelancaran sistem Helpdesk, tiket kendala pengguna, serta pemeliharaan jaringan & perangkat.',
      'Menjadi jalur eskalasi pertama untuk kendala teknis tingkat lanjut dari para Pelaksana IT.',
      'Perencanaan jadwal shift, pemeliharaan rutin (Preventive Maintenance), dan pengawasan stok sparepart IT.',
      'Pelaporan analisis pencapaian kinerja mingguan dan bulanan kepada Sub Dept Head.'
    ],
    notes: 'Mengetuai langsung operasional Helpdesk dan 2 Pelaksana IT Support.'
  },
  {
    id: 'team-digitalization',
    name: 'Rizky Pratama, M.T.',
    nip: 'IT-003 / 19910505',
    role: 'Digitalization Specialist',
    subRoleTitle: 'Digitalization & Automation Specialist',
    email: 'rizky.pratama@company.com',
    phone: '081311223344',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    shift: 'Non-Shift (08.00 - 17.00)',
    status: 'Aktif',
    specialization: ['Business Process Automation', 'API & Integration', 'Dashboard Analytics', 'AI & Low-Code Workflow'],
    jobdesks: [
      'Merancang, mengembangkan, dan memodernisasi alur kerja digital (Digital Workflow) dan e-Office perusahaan.',
      'Mengintegrasikan sistem antar-departemen via API, otomatisasi data, dan dashboard analitik interaktif.',
      'Mengidentifikasi proses bisnis manual yang dapat diotomatisasi guna meningkatkan efisiensi operasional.',
      'Mendampingi implementasi inovasi AI, modul ERP baru, dan sistem manajemen dokumen digital.',
      'Melaporkan progres proyek digitalisasi dan inovasi teknologi secara berkesinambungan kepada Sub Dept Head.'
    ],
    notes: 'Spesialis inovasi, otomatisasi proses bisnis, dan solusi digitalisasi.'
  },
  {
    id: 'team-pelaksana1',
    name: 'Hendra Wijaya, A.Md.T',
    nip: 'IT-004 / 19930815',
    role: 'Pelaksana IT',
    subRoleTitle: 'Pelaksana IT - Hardware & Network Support',
    email: 'hendra.wijaya@company.com',
    phone: '081288990011',
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80',
    shift: 'Shift 1 (07.00 - 15.00)',
    status: 'On Duty',
    specialization: ['Hardware Troubleshooting', 'LAN/WLAN & Crimping', 'Printer & Peripheral', 'Preventive Maintenance'],
    jobdesks: [
      'Penanganan tiket insiden fisik PC Desktop, Laptop, Printer, Scanner, & perangkat peripheral.',
      'Maintenance jaringan kabel LAN/WLAN, crimping RJ45, penataan switch & ketersediaan IP Address.',
      'Pemeriksaan rutin kesehatan fisik perangkat (Preventive Maintenance berkala).',
      'Instalasi OS (Windows/Linux), Driver hardware, dan inventarisasi label fisik piranti.',
      'Pendataan fisik aset komputer dan stok cadangan sparepart bawah pengawasan Section Head.'
    ],
    notes: 'Pelaksana teknis perbaikan hardware dan kestabilan koneksi fisik (Bawahan Section Head).'
  },
  {
    id: 'team-pelaksana2',
    name: 'Citra Dewi, S.Kom',
    nip: 'IT-005 / 19951120',
    role: 'Pelaksana IT',
    subRoleTitle: 'Pelaksana IT - Software & Application Support',
    email: 'citra.dewi@company.com',
    phone: '081377889900',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    shift: 'Shift 2 (12.00 - 20.00)',
    status: 'Aktif',
    specialization: ['ERP & Internal Apps', 'Account & Access Control', 'User Training & FAQ', 'System Bug Logging'],
    jobdesks: [
      'Penanganan tiket masalah aplikasi internal, sistem e-Office, modul ERP, dan kendala login.',
      'Reset password akun pengguna, verifikasi hak akses menu, serta pembuatan akun karyawan baru.',
      'Pendampingan teknis & edukasi penggunaan sistem bagi pengguna / karyawan baru.',
      'Pembuatan modul petunjuk penggunaan (User Manual & Panduan Troubleshooting).',
      'Koordinasi aktif dengan Section Head dan Tim Developer jika ditemukan bug aplikasi atau error database.'
    ],
    notes: 'Pelaksana pendampingan aplikasi internal, otorisasi akun, dan sistem data (Bawahan Section Head).'
  }
];

interface MasterTeamProps {
  isDark?: boolean;
  primaryColor?: string;
}

export const MasterTeam: React.FC<MasterTeamProps> = ({ 
  isDark = false, 
  primaryColor = '#10b981' 
}) => {
  const [teamMembers, setTeamMembers] = useState<ITeamMember[]>(() => {
    try {
      const saved = localStorage.getItem('it_team_members_v2');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return DEFAULT_TEAM;
  });

  // Header Info Editable State
  const [headerTitle, setHeaderTitle] = useState(() => {
    return localStorage.getItem('it_team_header_title') || 'Tim & Topologi IT Support';
  });
  const [headerDesc, setHeaderDesc] = useState(() => {
    return localStorage.getItem('it_team_header_desc') || 'Struktur hirarki Sub Dept Head, Section Head, Digitalization Specialist, dan 2 Pelaksana IT beserta rincian jobdesk operasional.';
  });
  const [isEditingHeader, setIsEditingHeader] = useState(false);

  const [activeTab, setActiveTab] = useState<'topology' | 'jobdesk' | 'manage'>('topology');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMember, setSelectedMember] = useState<ITeamMember | null>(null);
  
  // Modal State for Edit/Add
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Partial<ITeamMember> | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem('it_team_members_v2', JSON.stringify(teamMembers));
    } catch (e) {
      console.error(e);
    }
  }, [teamMembers]);

  useEffect(() => {
    try {
      localStorage.setItem('it_team_header_title', headerTitle);
      localStorage.setItem('it_team_header_desc', headerDesc);
    } catch (e) {
      console.error(e);
    }
  }, [headerTitle, headerDesc]);

  // Categorize Members for Hierarchy
  const subDeptHead = teamMembers.find(m => m.role === 'Sub Dept Head');
  const sectionHead = teamMembers.find(m => m.role === 'Section Head');
  const digitalizationSpec = teamMembers.find(m => m.role === 'Digitalization Specialist');
  const pelaksanaList = teamMembers.filter(m => m.role === 'Pelaksana IT');

  const filteredMembers = teamMembers.filter(m => 
    m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.subRoleTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.nip.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.specialization.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleSaveMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember?.name || !editingMember?.subRoleTitle) {
      alert('Nama dan Gelar Jabatan wajib diisi!');
      return;
    }

    if (editingMember.id) {
      setTeamMembers(prev => prev.map(m => m.id === editingMember.id ? (editingMember as ITeamMember) : m));
    } else {
      const newMember: ITeamMember = {
        id: `team-${Date.now()}`,
        name: editingMember.name || '',
        nip: editingMember.nip || 'IT-' + Math.floor(100 + Math.random() * 900),
        role: editingMember.role || 'Pelaksana IT',
        subRoleTitle: editingMember.subRoleTitle || 'Pelaksana IT Support',
        email: editingMember.email || 'it@company.com',
        phone: editingMember.phone || '08123456789',
        avatar: editingMember.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
        shift: editingMember.shift || 'Non-Shift (08.00 - 17.00)',
        status: editingMember.status || 'Aktif',
        specialization: editingMember.specialization || ['IT Support'],
        jobdesks: editingMember.jobdesks || ['Penanganan tiket bantuan IT.'],
        notes: editingMember.notes || ''
      };
      setTeamMembers(prev => [...prev, newMember]);
    }

    setIsModalOpen(false);
    setEditingMember(null);
  };

  const handleDeleteMember = (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus anggota tim ini?')) {
      setTeamMembers(prev => prev.filter(m => m.id !== id));
    }
  };

  const handleResetDefault = () => {
    if (confirm('Kembalikan susunan tim IT Support & Digitalisasi ke pengaturan awal (Default)?')) {
      setTeamMembers(DEFAULT_TEAM);
      setHeaderTitle('Tim & Topologi IT Support');
      setHeaderDesc('Struktur hirarki Sub Dept Head, Section Head, Digitalization Specialist, dan 2 Pelaksana IT beserta rincian jobdesk operasional.');
    }
  };

  const handlePrintTopology = () => {
    window.print();
  };

  const themeClasses = {
    bgCard: isDark ? 'bg-slate-900/90 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-800',
    bgSecondary: isDark ? 'bg-slate-800/60' : 'bg-slate-50',
    border: isDark ? 'border-slate-800' : 'border-slate-200',
    textMuted: isDark ? 'text-slate-400' : 'text-slate-500',
    heading: isDark ? 'text-white' : 'text-slate-900',
    inputBg: isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900',
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* --- HEADER TITLE BANNER (EDITABLE) --- */}
      <div className={`p-6 rounded-3xl border shadow-xl relative overflow-hidden ${themeClasses.bgCard}`}>
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 rounded-full opacity-10 bg-gradient-to-br from-emerald-500 to-cyan-500 blur-2xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="flex items-start gap-3.5 flex-1">
            <div className="p-3.5 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/20 shrink-0 mt-1">
              <Users className="w-7 h-7" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                  Data Master
                </span>
                <span className="text-xs font-semibold text-slate-400">• Struktur Organisasi</span>
              </div>

              {isEditingHeader ? (
                <div className="space-y-2 mt-1">
                  <input 
                    type="text" 
                    value={headerTitle}
                    onChange={e => setHeaderTitle(e.target.value)}
                    className={`w-full px-3 py-1.5 rounded-xl font-black text-lg border outline-none ${themeClasses.inputBg}`}
                  />
                  <textarea 
                    rows={2}
                    value={headerDesc}
                    onChange={e => setHeaderDesc(e.target.value)}
                    className={`w-full px-3 py-1.5 rounded-xl text-xs border outline-none ${themeClasses.inputBg}`}
                  />
                  <button
                    onClick={() => setIsEditingHeader(false)}
                    className="px-3 py-1 rounded-lg text-xs font-bold bg-emerald-500 text-white flex items-center gap-1 shadow-sm"
                  >
                    <Check className="w-3.5 h-3.5" /> Simpan Judul
                  </button>
                </div>
              ) : (
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className={`text-xl sm:text-2xl font-black tracking-tight ${themeClasses.heading}`}>
                      {headerTitle}
                    </h1>
                    <button 
                      onClick={() => setIsEditingHeader(true)}
                      className="p-1 rounded-lg text-slate-400 hover:text-emerald-500 hover:bg-emerald-500/10 transition-all"
                      title="Edit Judul & Deskripsi"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                  </div>
                  <p className={`text-xs sm:text-sm font-medium ${themeClasses.textMuted}`}>
                    {headerDesc}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto flex-wrap shrink-0">
            <button
              onClick={handlePrintTopology}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-2 hover:opacity-80 active:scale-95 ${themeClasses.border} ${themeClasses.bgSecondary}`}
            >
              <Printer className="w-4 h-4 text-emerald-500" />
              <span>Cetak Topologi</span>
            </button>
            <button
              onClick={handleResetDefault}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-2 hover:opacity-80 active:scale-95 ${themeClasses.border} ${themeClasses.bgSecondary}`}
            >
              <RefreshCw className="w-4 h-4 text-cyan-500" />
              <span>Reset Default</span>
            </button>
            <button
              onClick={() => {
                setEditingMember({
                  role: 'Pelaksana IT',
                  subRoleTitle: 'Pelaksana IT Support',
                  status: 'Aktif',
                  shift: 'Shift 1 (08.00 - 17.00)',
                  specialization: ['Helpdesk'],
                  jobdesks: ['Penanganan tiket bantuan pengguna']
                });
                setIsModalOpen(true);
              }}
              style={{ backgroundColor: primaryColor }}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white shadow-lg transition-all hover:brightness-110 active:scale-95 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Anggota</span>
            </button>
          </div>
        </div>

        {/* NAVIGATION TABS */}
        <div className="flex items-center gap-2 mt-6 pt-4 border-t border-slate-200/20 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('topology')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'topology'
                ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                : `${themeClasses.bgSecondary} ${themeClasses.textMuted} hover:text-emerald-500`
            }`}
          >
            <Award className="w-4 h-4" />
            <span>Topologi Organisasi</span>
          </button>

          <button
            onClick={() => setActiveTab('jobdesk')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'jobdesk'
                ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                : `${themeClasses.bgSecondary} ${themeClasses.textMuted} hover:text-emerald-500`
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Rincian Jobdesk</span>
          </button>

          <button
            onClick={() => setActiveTab('manage')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'manage'
                ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                : `${themeClasses.bgSecondary} ${themeClasses.textMuted} hover:text-emerald-500`
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>Kelola Anggota ({teamMembers.length})</span>
          </button>
        </div>
      </div>

      {/* --- TAB CONTENT 1: TOPOLOGY VISUAL HIERARCHY --- */}
      {activeTab === 'topology' && (
        <div className="space-y-8">
          <div className={`p-6 sm:p-8 rounded-3xl border shadow-lg relative ${themeClasses.bgCard}`}>
            <div className="text-center max-w-xl mx-auto mb-8">
              <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                Bagan Topologi Hirarki Bertingkat
              </span>
              <h2 className={`text-lg sm:text-xl font-black mt-2 ${themeClasses.heading}`}>
                Sub Departemen IT & Digitalisasi
              </h2>
              <p className={`text-xs font-medium mt-1 ${themeClasses.textMuted}`}>
                Hirarki komando: Sub Dept Head memimpin Section Head (2 Pelaksana IT) & Digitalization Specialist.
              </p>
            </div>

            {/* LEVEL 1: SUB DEPT HEAD */}
            {subDeptHead ? (
              <div className="flex flex-col items-center relative z-10 mb-8">
                <div className="w-full max-w-lg transform transition-all hover:scale-[1.01]">
                  <div className={`p-5 rounded-3xl border-2 border-indigo-500/60 shadow-2xl relative bg-gradient-to-br ${
                    isDark ? 'from-slate-800 to-indigo-950/40' : 'from-indigo-50/70 to-white'
                  }`}>
                    <div className="absolute -top-3.5 left-1/2 transform -translate-x-1/2 px-3.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-indigo-600 text-white shadow-lg flex items-center gap-1">
                      <CrownIcon className="w-3.5 h-3.5" />
                      <span>Level 1: Sub Dept Head (Pimpinan Utama)</span>
                    </div>

                    <div className="flex items-start gap-4 mt-2">
                      <img 
                        src={subDeptHead.avatar} 
                        alt={subDeptHead.name} 
                        className="w-16 h-16 rounded-2xl object-cover border-2 border-indigo-500 shadow-md"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <h3 className={`text-sm sm:text-base font-black truncate ${themeClasses.heading}`}>
                            {subDeptHead.name}
                          </h3>
                          <span className="px-2 py-0.5 rounded-md text-[9px] font-bold bg-indigo-500/20 text-indigo-500 border border-indigo-500/30 whitespace-nowrap">
                            {subDeptHead.status}
                          </span>
                        </div>
                        <p className="text-xs font-bold text-indigo-500">{subDeptHead.subRoleTitle}</p>
                        <p className={`text-[10px] font-mono mt-0.5 ${themeClasses.textMuted}`}>{subDeptHead.nip}</p>

                        <div className="flex items-center gap-3 mt-2 text-[10px] text-slate-400 border-t border-slate-200/10 pt-2">
                          <span className="flex items-center gap-1"><Mail className="w-3 h-3 text-indigo-400" /> {subDeptHead.email}</span>
                          <span className="flex items-center gap-1"><Phone className="w-3 h-3 text-emerald-500" /> {subDeptHead.phone}</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-slate-200/20 flex items-center justify-between gap-2">
                      <span className="text-[10px] font-semibold text-slate-400">{subDeptHead.shift}</span>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => {
                            setEditingMember(subDeptHead);
                            setIsModalOpen(true);
                          }}
                          className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-indigo-500/10 hover:bg-indigo-500 text-indigo-600 hover:text-white transition-all flex items-center gap-1"
                        >
                          <Edit className="w-3 h-3" /> Edit Data
                        </button>
                        <button
                          onClick={() => setSelectedMember(subDeptHead)}
                          className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-indigo-600 text-white hover:brightness-110 transition-all flex items-center gap-1"
                        >
                          <FileText className="w-3 h-3" /> Jobdesk
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* CONNECTING LINE DOWN TO LEVEL 2 */}
                <div className="w-1 h-12 bg-gradient-to-b from-indigo-500 via-teal-500 to-emerald-500 relative my-1">
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 px-2.5 py-0.5 rounded-md text-[9px] font-black bg-indigo-600 text-white shadow-md whitespace-nowrap flex items-center gap-1">
                    <ArrowDown className="w-3 h-3" /> Supervisi Langsung
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-2xl border text-center text-xs text-rose-500 mb-6">
                Data Sub Dept Head belum diset. Silakan tambah anggota dengan role Sub Dept Head.
              </div>
            )}

            {/* LEVEL 2 & LEVEL 3: STRUCTURED BRANCHING */}
            <div className="mb-10">
              <div className="text-center mb-6">
                <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-teal-500/10 text-teal-600 border border-teal-500/20">
                  Level 2 & Level 3: Unit Operasional Support (Section Head & Pelaksana) & Unit Inovasi (Digitalization Specialist)
                </span>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-6xl mx-auto items-start">
                
                {/* BRANCH A: SECTION HEAD & HIS DIRECT SUBORDINATES (2 PELAKSANA IT) - TAKES 7 COLS */}
                <div className="lg:col-span-7 space-y-4 p-5 rounded-3xl border border-emerald-500/30 bg-emerald-500/5 relative">
                  <div className="absolute -top-3 left-4 px-3 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-600 text-white shadow-md flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" />
                    <span>Unit Operasional Helpdesk & Support</span>
                  </div>

                  {/* LEVEL 2A: SECTION HEAD */}
                  {sectionHead ? (
                    <div className={`p-5 rounded-2xl border-2 border-emerald-500 shadow-xl relative mt-2 ${themeClasses.bgSecondary}`}>
                      <div className="flex items-start gap-3.5">
                        <img 
                          src={sectionHead.avatar} 
                          alt={sectionHead.name} 
                          className="w-14 h-14 rounded-xl object-cover border-2 border-emerald-500 shadow-md"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <h4 className={`text-xs sm:text-sm font-black truncate ${themeClasses.heading}`}>
                              {sectionHead.name}
                            </h4>
                            <span className="px-2 py-0.5 rounded-md text-[9px] font-bold bg-emerald-500/20 text-emerald-500">
                              {sectionHead.status}
                            </span>
                          </div>
                          <p className="text-xs font-bold text-emerald-500">{sectionHead.subRoleTitle}</p>
                          <p className={`text-[10px] font-mono ${themeClasses.textMuted}`}>{sectionHead.nip}</p>
                        </div>
                      </div>

                      <div className="mt-3 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[10px]">
                        <span className="font-bold text-emerald-600 block mb-0.5">Tugas Utama:</span>
                        <p className={themeClasses.heading}>Mengoordinasikan & Memimpin 2 Pelaksana IT Support di bawah ini</p>
                      </div>

                      <div className="mt-3 pt-2.5 border-t border-slate-200/10 flex items-center justify-between">
                        <span className="text-[10px] font-semibold text-slate-400">{sectionHead.shift}</span>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => {
                              setEditingMember(sectionHead);
                              setIsModalOpen(true);
                            }}
                            className="px-2 py-1 rounded-lg text-[10px] font-bold bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500 hover:text-white transition-all"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => setSelectedMember(sectionHead)}
                            className="px-2 py-1 rounded-lg text-[10px] font-bold bg-emerald-500 text-white hover:brightness-110 transition-all"
                          >
                            Jobdesk
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 rounded-2xl border text-center text-xs text-amber-500">
                      Data Section Head belum diisi.
                    </div>
                  )}

                  {/* DIRECT SUBORDINATE CONNECTOR LINE */}
                  <div className="flex flex-col items-center my-1">
                    <div className="w-1 h-6 bg-emerald-500" />
                    <span className="px-3 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-teal-600 text-white shadow-sm flex items-center gap-1">
                      <ArrowDown className="w-3 h-3" /> Bawahan Langsung Section Head (Level 3)
                    </span>
                    <div className="w-1 h-4 bg-teal-500" />
                  </div>

                  {/* LEVEL 3: 2 PELAKSANA IT CARDS (NESTED DIRECTLY UNDER SECTION HEAD) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {pelaksanaList.map((pelaksana, idx) => (
                      <div 
                        key={pelaksana.id}
                        className={`p-4 rounded-2xl border-2 border-teal-500/40 transition-all hover:shadow-xl relative ${themeClasses.bgSecondary}`}
                      >
                        <div className="flex items-center justify-between gap-1 mb-2">
                          <span className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase bg-teal-500/10 text-teal-600 border border-teal-500/20">
                            Pelaksana #{idx + 1}
                          </span>
                          <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold ${
                            pelaksana.status === 'On Duty' ? 'bg-emerald-500/20 text-emerald-500' : 'bg-slate-500/20 text-slate-400'
                          }`}>
                            {pelaksana.status}
                          </span>
                        </div>

                        <div className="flex items-start gap-3">
                          <img 
                            src={pelaksana.avatar} 
                            alt={pelaksana.name} 
                            className="w-12 h-12 rounded-xl object-cover border-2 border-teal-500/40 shadow-sm"
                          />
                          <div className="flex-1 min-w-0">
                            <h4 className={`text-xs font-black truncate ${themeClasses.heading}`}>
                              {pelaksana.name}
                            </h4>
                            <p className="text-[10px] font-bold text-teal-500 truncate">{pelaksana.subRoleTitle}</p>
                            <p className={`text-[9px] font-mono ${themeClasses.textMuted}`}>{pelaksana.nip}</p>
                          </div>
                        </div>

                        <div className="mt-2.5 space-y-1 text-[10px]">
                          <div className="flex items-center justify-between">
                            <span className={themeClasses.textMuted}>Email:</span>
                            <span className={`font-semibold truncate max-w-[120px] ${themeClasses.heading}`}>{pelaksana.email}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className={themeClasses.textMuted}>Shift:</span>
                            <span className={`font-semibold ${themeClasses.heading}`}>{pelaksana.shift}</span>
                          </div>
                        </div>

                        <div className="mt-2.5 pt-2 border-t border-slate-200/10">
                          <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">Spesialisasi:</p>
                          <div className="flex flex-wrap gap-1">
                            {pelaksana.specialization.slice(0, 3).map((spec, sIdx) => (
                              <span 
                                key={sIdx}
                                className="px-1.5 py-0.5 rounded-md text-[8px] font-bold bg-slate-200/60 dark:bg-slate-700/60 text-slate-700 dark:text-slate-300"
                              >
                                {spec}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="mt-3 pt-2 border-t border-slate-200/10 flex items-center justify-between">
                          <button
                            onClick={() => {
                              setEditingMember(pelaksana);
                              setIsModalOpen(true);
                            }}
                            className="text-[9px] font-bold text-slate-400 hover:text-emerald-500 flex items-center gap-1"
                          >
                            <Edit className="w-3 h-3" /> Edit
                          </button>

                          <button
                            onClick={() => setSelectedMember(pelaksana)}
                            className="py-1 px-2.5 rounded-lg text-[9px] font-bold bg-teal-500/10 hover:bg-teal-500 text-teal-600 hover:text-white transition-all flex items-center gap-1"
                          >
                            <FileText className="w-3 h-3" />
                            <span>Jobdesk</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* BRANCH B: DIGITALIZATION SPECIALIST (TAKES 5 COLS) */}
                <div className="lg:col-span-5 space-y-4 p-5 rounded-3xl border border-cyan-500/30 bg-cyan-500/5 relative">
                  <div className="absolute -top-3 left-4 px-3 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-cyan-600 text-white shadow-md flex items-center gap-1">
                    <Zap className="w-3 h-3" />
                    <span>Unit Inovasi & Digitalisasi (Staf Ahli)</span>
                  </div>

                  {digitalizationSpec ? (
                    <div className={`p-5 rounded-2xl border-2 border-cyan-500 shadow-xl relative mt-2 ${themeClasses.bgSecondary}`}>
                      <div className="flex items-start gap-3.5">
                        <img 
                          src={digitalizationSpec.avatar} 
                          alt={digitalizationSpec.name} 
                          className="w-14 h-14 rounded-xl object-cover border-2 border-cyan-500 shadow-md"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <h4 className={`text-xs sm:text-sm font-black truncate ${themeClasses.heading}`}>
                              {digitalizationSpec.name}
                            </h4>
                            <span className="px-2 py-0.5 rounded-md text-[9px] font-bold bg-cyan-500/20 text-cyan-500">
                              {digitalizationSpec.status}
                            </span>
                          </div>
                          <p className="text-xs font-bold text-cyan-500">{digitalizationSpec.subRoleTitle}</p>
                          <p className={`text-[10px] font-mono ${themeClasses.textMuted}`}>{digitalizationSpec.nip}</p>
                        </div>
                      </div>

                      <div className="mt-3 p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-[10px]">
                        <span className="font-bold text-cyan-600 block mb-0.5">Fokus Tugas:</span>
                        <p className={themeClasses.heading}>Otomatisasi Alur Kerja, Digital Workflow & Analitik Data</p>
                      </div>

                      <div className="mt-3 pt-2.5 border-t border-slate-200/10 flex items-center justify-between">
                        <span className="text-[10px] font-semibold text-slate-400">{digitalizationSpec.shift}</span>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => {
                              setEditingMember(digitalizationSpec);
                              setIsModalOpen(true);
                            }}
                            className="px-2 py-1 rounded-lg text-[10px] font-bold bg-cyan-500/10 text-cyan-600 hover:bg-cyan-500 hover:text-white transition-all"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => setSelectedMember(digitalizationSpec)}
                            className="px-2 py-1 rounded-lg text-[10px] font-bold bg-cyan-500 text-white hover:brightness-110 transition-all"
                          >
                            Jobdesk
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 rounded-2xl border text-center text-xs text-amber-500">
                      Data Digitalization Specialist belum diisi.
                    </div>
                  )}

                  <div className={`p-4 rounded-2xl border text-xs ${themeClasses.bgSecondary} ${themeClasses.border}`}>
                    <span className="font-bold text-cyan-600 flex items-center gap-1 mb-1">
                      <Sparkles className="w-3.5 h-3.5 text-cyan-500" /> Posisi Staf Spesialis Direct
                    </span>
                    <p className={`text-[10px] leading-relaxed ${themeClasses.textMuted}`}>
                      Digitalization Specialist berkedudukan langsung di bawah Sub Dept Head khusus untuk menangani otomatisasi proses bisnis, integrasi sistem, dan transformasi digital tanpa membawahi tim Helpdesk.
                    </p>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- TAB CONTENT 2: RINCIAN JOBDESK & KPI --- */}
      {activeTab === 'jobdesk' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {teamMembers.map((member) => (
              <div 
                key={member.id}
                className={`p-6 rounded-3xl border shadow-lg flex flex-col justify-between ${themeClasses.bgCard}`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className={`px-2.5 py-0.5 rounded-md text-[9px] font-black uppercase ${
                      member.role === 'Sub Dept Head'
                        ? 'bg-indigo-500/20 text-indigo-500 border border-indigo-500/30'
                        : member.role === 'Section Head' 
                        ? 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/30' 
                        : member.role === 'Digitalization Specialist'
                        ? 'bg-cyan-500/20 text-cyan-500 border border-cyan-500/30'
                        : 'bg-teal-500/20 text-teal-500 border border-teal-500/30'
                    }`}>
                      {member.role}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">{member.nip}</span>
                  </div>

                  <h3 className={`text-base font-black ${themeClasses.heading}`}>
                    {member.name}
                  </h3>
                  <p className="text-xs font-bold text-emerald-500 mb-4">{member.subRoleTitle}</p>

                  <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Uraian Tugas & Jobdesk Wajib:
                  </p>

                  <ul className="space-y-2 text-xs">
                    {member.jobdesks.map((task, tIdx) => (
                      <li key={tIdx} className="flex items-start gap-2">
                        <span className="w-4 h-4 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5">
                          {tIdx + 1}
                        </span>
                        <span className={`font-medium ${themeClasses.heading}`}>{task}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-200/10 flex items-center justify-between text-[10px] text-slate-400">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-cyan-500" /> {member.shift}
                  </span>
                  <button
                    onClick={() => {
                      setEditingMember(member);
                      setIsModalOpen(true);
                    }}
                    className="text-emerald-500 font-bold hover:underline flex items-center gap-1"
                  >
                    <Edit className="w-3 h-3" /> Edit Jobdesk
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* --- TAB CONTENT 3: KELOLA ANGGOTA TIM --- */}
      {activeTab === 'manage' && (
        <div className={`p-6 rounded-3xl border shadow-lg ${themeClasses.bgCard}`}>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 transform -translate-y-1/2 text-slate-400" />
              <input 
                type="text"
                placeholder="Cari nama, NIP, atau spesialisasi..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full pl-10 pr-4 py-2 rounded-2xl text-xs font-semibold outline-none focus:ring-2 focus:ring-emerald-500 ${themeClasses.inputBg}`}
              />
            </div>

            <div className="text-xs text-slate-400 font-bold">
              Total {filteredMembers.length} Anggota Terdaftar
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className={`border-b text-[10px] font-black uppercase tracking-wider ${themeClasses.border} ${themeClasses.textMuted}`}>
                  <th className="py-3 px-4">Anggota</th>
                  <th className="py-3 px-4">Jabatan & NIP</th>
                  <th className="py-3 px-4">Kontak & Shift</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/10">
                {filteredMembers.map((member) => (
                  <tr key={member.id} className="hover:bg-slate-500/5 transition-all">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <img 
                          src={member.avatar} 
                          alt={member.name} 
                          className="w-10 h-10 rounded-xl object-cover border border-slate-200/20"
                        />
                        <div>
                          <p className={`font-bold ${themeClasses.heading}`}>{member.name}</p>
                          <span className="text-[10px] text-emerald-500 font-semibold">{member.subRoleTitle}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <p className={`font-mono ${themeClasses.heading}`}>{member.nip}</p>
                      <span className="text-[10px] text-slate-400 font-semibold">{member.role}</span>
                    </td>
                    <td className="py-3 px-4">
                      <p className={themeClasses.heading}>{member.email}</p>
                      <p className="text-[10px] text-slate-400">{member.phone} • {member.shift}</p>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        member.status === 'Aktif' || member.status === 'On Duty'
                          ? 'bg-emerald-500/20 text-emerald-500'
                          : 'bg-rose-500/20 text-rose-500'
                      }`}>
                        {member.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => {
                            setEditingMember(member);
                            setIsModalOpen(true);
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-500 hover:bg-emerald-500/10 transition-all"
                          title="Edit Data"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteMember(member.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-all"
                          title="Hapus"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- MODAL DETAIL JOBDESK MEMBER --- */}
      {selectedMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className={`w-full max-w-2xl p-6 sm:p-8 rounded-3xl border shadow-2xl relative overflow-hidden ${themeClasses.bgCard}`}>
            <button 
              onClick={() => setSelectedMember(null)}
              className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-start gap-4 mb-6">
              <img 
                src={selectedMember.avatar} 
                alt={selectedMember.name} 
                className="w-16 h-16 rounded-2xl object-cover border-2 border-emerald-500 shadow-md"
              />
              <div className="flex-1">
                <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                  {selectedMember.role}
                </span>
                <h3 className={`text-lg font-black mt-1 ${themeClasses.heading}`}>
                  {selectedMember.name}
                </h3>
                <p className="text-xs font-bold text-emerald-500">{selectedMember.subRoleTitle}</p>
                <p className="text-[10px] font-mono text-slate-400">{selectedMember.nip}</p>
              </div>

              <button
                onClick={() => {
                  setEditingMember(selectedMember);
                  setSelectedMember(null);
                  setIsModalOpen(true);
                }}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500 hover:text-white transition-all flex items-center gap-1"
              >
                <Edit className="w-3.5 h-3.5" /> Edit Member
              </button>
            </div>

            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
              <div>
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1">
                  <FileText className="w-4 h-4 text-emerald-500" /> Rincian Tugas & Tuntutan Jobdesk:
                </h4>
                <ul className="space-y-2 text-xs">
                  {selectedMember.jobdesks.map((jd, idx) => (
                    <li key={idx} className="flex items-start gap-2 p-2 rounded-xl bg-slate-500/5">
                      <span className="w-5 h-5 rounded-lg bg-emerald-500 text-white flex items-center justify-center text-[10px] font-black shrink-0">
                        {idx + 1}
                      </span>
                      <span className={`font-medium ${themeClasses.heading}`}>{jd}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {selectedMember.notes && (
                <div className="p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/20">
                  <p className="text-[10px] font-bold text-cyan-600 flex items-center gap-1">
                    <Info className="w-3.5 h-3.5" /> Catatan Tambahan:
                  </p>
                  <p className="text-xs text-slate-300 mt-1">{selectedMember.notes}</p>
                </div>
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-slate-200/10 flex justify-end">
              <button
                onClick={() => setSelectedMember(null)}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-500 text-white hover:brightness-110 shadow-lg"
              >
                Tutup Rincian
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL EDIT / ADD MEMBER (ALL TEXT EDITABLE) --- */}
      {isModalOpen && editingMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className={`w-full max-w-xl p-6 rounded-3xl border shadow-2xl relative max-h-[90vh] overflow-y-auto ${themeClasses.bgCard}`}>
            <button 
              onClick={() => {
                setIsModalOpen(false);
                setEditingMember(null);
              }}
              className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className={`text-base font-black mb-4 ${themeClasses.heading}`}>
              {editingMember.id ? 'Edit Data Anggota Tim' : 'Tambah Anggota Tim Baru'}
            </h3>

            <form onSubmit={handleSaveMember} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">Nama Lengkap *</label>
                  <input 
                    type="text" 
                    required
                    value={editingMember.name || ''}
                    onChange={e => setEditingMember({...editingMember, name: e.target.value})}
                    placeholder="Contoh: Budi Prasetyo, S.T."
                    className={`w-full px-3 py-2 rounded-xl outline-none border ${themeClasses.inputBg}`}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">NIP / Identitas *</label>
                  <input 
                    type="text" 
                    required
                    value={editingMember.nip || ''}
                    onChange={e => setEditingMember({...editingMember, nip: e.target.value})}
                    placeholder="Contoh: IT-004"
                    className={`w-full px-3 py-2 rounded-xl outline-none border ${themeClasses.inputBg}`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">Level Hirarki / Role *</label>
                  <select
                    value={editingMember.role || 'Pelaksana IT'}
                    onChange={e => setEditingMember({...editingMember, role: e.target.value as any})}
                    className={`w-full px-3 py-2 rounded-xl outline-none border ${themeClasses.inputBg}`}
                  >
                    <option value="Sub Dept Head">Sub Dept Head (Level 1)</option>
                    <option value="Section Head">Section Head (Level 2)</option>
                    <option value="Digitalization Specialist">Digitalization Specialist (Level 2)</option>
                    <option value="Pelaksana IT">Pelaksana IT (Level 3)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">Gelar / Sub-Role *</label>
                  <input 
                    type="text" 
                    required
                    value={editingMember.subRoleTitle || ''}
                    onChange={e => setEditingMember({...editingMember, subRoleTitle: e.target.value})}
                    placeholder="Contoh: Pelaksana IT - Network"
                    className={`w-full px-3 py-2 rounded-xl outline-none border ${themeClasses.inputBg}`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">Email *</label>
                  <input 
                    type="email" 
                    required
                    value={editingMember.email || ''}
                    onChange={e => setEditingMember({...editingMember, email: e.target.value})}
                    className={`w-full px-3 py-2 rounded-xl outline-none border ${themeClasses.inputBg}`}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">No. WhatsApp *</label>
                  <input 
                    type="text" 
                    required
                    value={editingMember.phone || ''}
                    onChange={e => setEditingMember({...editingMember, phone: e.target.value})}
                    className={`w-full px-3 py-2 rounded-xl outline-none border ${themeClasses.inputBg}`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1">Foto Profil / Avatar URL</label>
                <input 
                  type="text" 
                  value={editingMember.avatar || ''}
                  onChange={e => setEditingMember({...editingMember, avatar: e.target.value})}
                  placeholder="https://..."
                  className={`w-full px-3 py-2 rounded-xl outline-none border ${themeClasses.inputBg}`}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">Shift Kerja</label>
                  <input 
                    type="text" 
                    value={editingMember.shift || ''}
                    onChange={e => setEditingMember({...editingMember, shift: e.target.value})}
                    placeholder="Contoh: Shift 1 (07.00 - 15.00)"
                    className={`w-full px-3 py-2 rounded-xl outline-none border ${themeClasses.inputBg}`}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">Status Kehadiran</label>
                  <select
                    value={editingMember.status || 'Aktif'}
                    onChange={e => setEditingMember({...editingMember, status: e.target.value as any})}
                    className={`w-full px-3 py-2 rounded-xl outline-none border ${themeClasses.inputBg}`}
                  >
                    <option value="Aktif">Aktif</option>
                    <option value="On Duty">On Duty</option>
                    <option value="Cuti">Cuti</option>
                    <option value="Off">Off</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1">Spesialisasi (Pisahkan dengan koma)</label>
                <input 
                  type="text" 
                  value={editingMember.specialization ? editingMember.specialization.join(', ') : ''}
                  onChange={e => setEditingMember({
                    ...editingMember, 
                    specialization: e.target.value.split(',').map(s => s.trim()).filter(s => s.length > 0)
                  })}
                  placeholder="Hardware, Network, Database..."
                  className={`w-full px-3 py-2 rounded-xl outline-none border ${themeClasses.inputBg}`}
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1">Uraian Jobdesk (Pisahkan dengan baris baru / Enter)</label>
                <textarea 
                  rows={4}
                  value={editingMember.jobdesks ? editingMember.jobdesks.join('\n') : ''}
                  onChange={e => setEditingMember({
                    ...editingMember, 
                    jobdesks: e.target.value.split('\n').filter(line => line.trim().length > 0)
                  })}
                  placeholder="Tuliskan tugas 1 per baris..."
                  className={`w-full px-3 py-2 rounded-xl outline-none border ${themeClasses.inputBg}`}
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1">Catatan Catatan Kinerja / Peran</label>
                <input 
                  type="text" 
                  value={editingMember.notes || ''}
                  onChange={e => setEditingMember({...editingMember, notes: e.target.value})}
                  placeholder="Catatan pimpinan..."
                  className={`w-full px-3 py-2 rounded-xl outline-none border ${themeClasses.inputBg}`}
                />
              </div>

              <div className="pt-3 border-t border-slate-200/10 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingMember(null);
                  }}
                  className="px-4 py-2 rounded-xl font-bold text-slate-400 hover:bg-slate-800"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  style={{ backgroundColor: primaryColor }}
                  className="px-5 py-2 rounded-xl font-bold text-white shadow-lg hover:brightness-110"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

function CrownIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M11.562 3.266a.5.5 0 0 1 .876 0L15.3 8.87a.5.5 0 0 0 .393.286l6.21.821a.5.5 0 0 1 .28.868l-4.54 4.31a.5.5 0 0 0-.147.45l1.13 6.13a.5.5 0 0 1-.734.536L12 19.29a.5.5 0 0 0-.47 0l-5.692 2.982a.5.5 0 0 1-.734-.536l1.13-6.13a.5.5 0 0 0-.147-.45L1.547 10.845a.5.5 0 0 1 .28-.868l6.21-.821a.5.5 0 0 0 .393-.286z" />
    </svg>
  );
}
