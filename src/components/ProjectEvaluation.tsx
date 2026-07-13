import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FolderPlus, 
  Trash2, 
  ArrowLeft, 
  CloudUpload, 
  Users, 
  Briefcase, 
  Activity, 
  Calendar, 
  TrendingUp, 
  FileSpreadsheet, 
  Search, 
  RefreshCcw, 
  Database,
  CheckCircle,
  AlertTriangle,
  Info,
  Layers,
  Sparkles,
  ChevronRight,
  User,
  Filter,
  FilterX,
  Clock,
  Plus,
  Pencil,
  Mail,
  HardDrive,
  MessageSquare,
  BarChart2
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line
} from 'recharts';
import { api } from '../services/api';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';

interface ProjectEvaluationProps {
  isDark: boolean;
  themeClasses: any;
  primaryColor: string;
}

interface IEvalProject {
  id: number;
  name: string;
  description: string;
  target_users: number;
  created_at: string;
  record_count?: number;
  user_count?: number;
  department_count?: number;
  total_usage?: number;
}

const COLORS_PALETTE = ['#10b981', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4', '#f43f5e'];

export const ProjectEvaluation: React.FC<ProjectEvaluationProps> = ({
  isDark,
  themeClasses,
  primaryColor
}) => {
  const [projects, setProjects] = useState<IEvalProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [dashboardData, setDashboardData] = useState<any | null>(null);
  const [loadingDashboard, setLoadingDashboard] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'timeline' | 'data'>('dashboard');

  // Timeline States
  const [timeline, setTimeline] = useState<any[]>([]);
  const [loadingTimeline, setLoadingTimeline] = useState(false);
  const [showTimelineForm, setShowTimelineForm] = useState(false);
  const [timelineIdToEdit, setTimelineIdToEdit] = useState<number | null>(null);
  const [timelineTitle, setTimelineTitle] = useState('');
  const [timelineDesc, setTimelineDesc] = useState('');
  const [timelineDate, setTimelineDate] = useState('');
  const [timelineStatus, setTimelineStatus] = useState('pending');

  // Overall Timelines States
  const [overallTimelines, setOverallTimelines] = useState<any[]>([]);
  const [loadingOverall, setLoadingOverall] = useState(false);
  const [overallSearch, setOverallSearch] = useState('');
  const [overallStatusFilter, setOverallStatusFilter] = useState<'all' | 'pending' | 'on_progress' | 'completed'>('all');
  const [overallGroupBy, setOverallGroupBy] = useState<'gantt' | 'date' | 'project'>('gantt');

  // Form states for creating project
  const [showAddModal, setShowAddModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');
  const [newProjectTarget, setNewProjectTarget] = useState('100');
  const [submittingProject, setSubmittingProject] = useState(false);

  // Raw data import / management states
  const [pasteData, setPasteData] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [showClearPasswordModal, setShowClearPasswordModal] = useState(false);
  const [clearPasswordInput, setClearPasswordInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [selectedMember, setSelectedMember] = useState<string>('all');

  const [columnFilters, setColumnFilters] = useState<{ [key: string]: string }>({
    periode_bulan: 'all',
    user_principal_name: 'all',
    display_name: 'all',
    department: 'all',
    activet: 'all',
    license_m365: 'all',
    email_exchange: 'all',
    one_drive: 'all',
    storage_used: 'all',
    teams: 'all',
    reason_teams: 'all',
    outlook_for_mobile: 'all',
    reason_hp: 'all',
    outlook_for_web: 'all',
    reason_web: 'all',
  });

  const getUniqueOptionsForColumn = (columnKey: string) => {
    if (!dashboardData || !dashboardData.m365Records) return [];
    const vals = dashboardData.m365Records
      .map((r: any) => r[columnKey])
      .filter((v: any) => v !== undefined && v !== null && String(v).trim() !== '');
    return Array.from(new Set(vals)).sort((a: any, b: any) => {
      const numA = Number(a);
      const numB = Number(b);
      if (!isNaN(numA) && !isNaN(numB)) {
        return numA - numB;
      }
      return String(a).localeCompare(String(b));
    }) as string[];
  };

  const hasActiveColumnFilters = useMemo(() => {
    return Object.values(columnFilters).some(v => v !== 'all');
  }, [columnFilters]);

  const handleResetColumnFilters = () => {
    setColumnFilters({
      periode_bulan: 'all',
      user_principal_name: 'all',
      display_name: 'all',
      department: 'all',
      activet: 'all',
      license_m365: 'all',
      email_exchange: 'all',
      one_drive: 'all',
      storage_used: 'all',
      teams: 'all',
      reason_teams: 'all',
      outlook_for_mobile: 'all',
      reason_hp: 'all',
      outlook_for_web: 'all',
      reason_web: 'all',
    });
    setCurrentPage(1);
  };

  const isM365 = useMemo(() => {
    return dashboardData?.project?.name?.toLowerCase().includes('m365') || false;
  }, [dashboardData]);

  const isWhatsapp = useMemo(() => {
    return dashboardData?.project?.name?.toLowerCase().includes('whatsapp') || dashboardData?.project?.name?.toLowerCase().includes('omni') || false;
  }, [dashboardData]);

  const uniqueMonths = useMemo(() => {
    if (!dashboardData || !dashboardData.m365Records) return [];
    const months = dashboardData.m365Records
      .map((r: any) => r.periode_bulan)
      .filter((m: any) => m && m.trim() !== '');
    return Array.from(new Set(months)) as string[];
  }, [dashboardData]);

  const uniqueDepartments = useMemo(() => {
    if (!dashboardData || !dashboardData.m365Records) return [];
    const depts = dashboardData.m365Records
      .map((r: any) => r.department)
      .filter((d: any) => d && d.trim() !== '');
    return Array.from(new Set(depts)).sort() as string[];
  }, [dashboardData]);

  const uniqueMembers = useMemo(() => {
    if (!dashboardData || !dashboardData.m365Records) return [];
    let records = dashboardData.m365Records;
    if (selectedMonth !== 'all') {
      records = records.filter((r: any) => r.periode_bulan === selectedMonth);
    }
    if (selectedDepartment !== 'all') {
      records = records.filter((r: any) => r.department === selectedDepartment);
    }
    const members = records
      .map((r: any) => r.display_name)
      .filter((m: any) => m && m.trim() !== '');
    return Array.from(new Set(members)).sort() as string[];
  }, [dashboardData, selectedMonth, selectedDepartment]);

  const filteredM365Records = useMemo(() => {
    if (!dashboardData || !dashboardData.m365Records) return [];
    if (!isM365) return dashboardData.m365Records || [];
    
    let records = dashboardData.m365Records;
    if (selectedMonth !== 'all') {
      records = records.filter((r: any) => r.periode_bulan === selectedMonth);
    }
    if (selectedDepartment !== 'all') {
      records = records.filter((r: any) => r.department === selectedDepartment);
    }
    if (selectedMember !== 'all') {
      records = records.filter((r: any) => r.display_name === selectedMember);
    }
    return records;
  }, [dashboardData, isM365, selectedMonth, selectedDepartment, selectedMember]);

  const m365DashboardData = useMemo(() => {
    if (!dashboardData || !isM365) return null;

    const records = filteredM365Records;
    const total_records = records.length;

    // Group records by user principal name and pick the latest record to avoid double-counting across periods on KPI cards
    const userMap: { [key: string]: any } = {};
    records.forEach((r: any) => {
      const upn = (r.user_principal_name || r.email || r.display_name || '').toLowerCase().trim();
      if (!upn) return;
      userMap[upn] = r;
    });
    const uniqueUserRecords = Object.values(userMap);
    const total_unique_records = uniqueUserRecords.length;

    const active_users = uniqueUserRecords.filter((r: any) => {
      const act = String(r.activet || '').toLowerCase();
      return act === 'active' || act === 'activet';
    }).length;
    
    const uniqueDepts = Array.from(new Set(uniqueUserRecords.map((r: any) => r.department || 'Divisi Umum')));
    const active_departments = uniqueDepts.length;

    const target_users = (selectedDepartment !== 'all' || selectedMember !== 'all') 
      ? total_unique_records 
      : (dashboardData.project.target_users || 0);

    // Trend always uses all raw records because it displays month-by-month evolution chronologically
    const trendMap: { [key: string]: { date: string; count: number; active_users: number } } = {};
    records.forEach((r: any) => {
      const p = r.periode_bulan || 'Umum';
      const act = String(r.activet || '').toLowerCase();
      const isActive = act === 'active' || act === 'activet';
      if (!trendMap[p]) {
        trendMap[p] = { date: p, count: 0, active_users: 0 };
      }
      trendMap[p].count += 1;
      if (isActive) {
        trendMap[p].active_users += 1;
      }
    });
    const trend = Object.values(trendMap).sort((a, b) => a.date.localeCompare(b.date));

    // Department distribution uses uniqueUserRecords to prevent double-counting in department totals
    const deptMap: { [key: string]: { department: string; count: number; users: number } } = {};
    uniqueUserRecords.forEach((r: any) => {
      const d = r.department || 'Divisi Umum';
      const act = String(r.activet || '').toLowerCase();
      const isActive = act === 'active' || act === 'activet';
      if (!deptMap[d]) {
        deptMap[d] = { department: d, count: 0, users: 0 };
      }
      deptMap[d].count += 1;
      if (isActive) {
        deptMap[d].users += 1;
      }
    });
    const departmentDistribution = Object.values(deptMap).sort((a, b) => b.count - a.count);

    let email = 0, onedrive = 0, teams = 0, mobile = 0, web = 0, total_storage = 0;
    uniqueUserRecords.forEach((r: any) => {
      const isAct = (val: any) => String(val) === '1' || String(val) === 'Active' || String(val) === '1.0';
      if (isAct(r.email_exchange)) email++;
      if (isAct(r.one_drive)) onedrive++;
      if (isAct(r.teams)) teams++;
      if (isAct(r.outlook_for_mobile)) mobile++;
      if (isAct(r.outlook_for_web)) web++;
      total_storage += Number(r.storage_used || 0);
    });

    const total_active_features = email + onedrive + teams;
    const total_max_capacity = total_unique_records * 3;
    const adoption_rate = total_max_capacity > 0 
      ? parseFloat(((total_active_features / total_max_capacity) * 100).toFixed(2)) 
      : 0;

    const activityDistribution = [
      { type: 'Email Exchange', count: email },
      { type: 'One Drive', count: onedrive },
      { type: 'Teams', count: teams },
      { type: 'Outlook Mobile', count: mobile },
      { type: 'Outlook Web', count: web }
    ].sort((a, b) => b.count - a.count);

    const topUsers = uniqueUserRecords.map((u: any) => {
      const isAct = (val: any) => String(val) === '1' || String(val) === 'Active' || String(val) === '1.0';
      const activeCount = (isAct(u.email_exchange) ? 1 : 0) +
                          (isAct(u.one_drive) ? 1 : 0) +
                          (isAct(u.teams) ? 1 : 0) +
                          (isAct(u.outlook_for_mobile) ? 1 : 0) +
                          (isAct(u.outlook_for_web) ? 1 : 0);
      return {
        user_name: u.display_name || u.user_principal_name || 'Tanpa Nama',
        department: u.department || 'Divisi Umum',
        count: activeCount
      };
    }).sort((a, b) => b.count - a.count).slice(0, 15);

    return {
      project: dashboardData.project,
      stats: {
        total_records,
        active_users,
        active_departments,
        total_usage: total_unique_records,
        target_users,
        adoption_rate,
        total_email: email,
        total_onedrive: onedrive,
        total_teams: teams,
        total_storage: total_storage
      },
      trend,
      departmentDistribution,
      activityDistribution,
      topUsers,
      m365Records: records
    };
  }, [dashboardData, isM365, filteredM365Records]);

  const activeDashboardData = useMemo(() => {
    return isM365 ? m365DashboardData : dashboardData;
  }, [isM365, m365DashboardData, dashboardData]);

  const averages3Months = useMemo(() => {
    if (!dashboardData || !dashboardData.m365Records) return { adoptionRateAvg: 0, storageUsedAvg: 0 };
    
    // Get unique months in the raw records
    const months = Array.from(new Set(dashboardData.m365Records.map((r: any) => r.periode_bulan))).filter(Boolean);
    if (months.length === 0) return { adoptionRateAvg: 0, storageUsedAvg: 0 };
    
    let totalAdoption = 0;
    let totalStorage = 0;
    
    months.forEach((m: any) => {
      const mRecords = dashboardData.m365Records.filter((r: any) => r.periode_bulan === m);
      
      // Calculate unique users in this month to avoid double-counting
      const userMap: { [key: string]: any } = {};
      mRecords.forEach((r: any) => {
        const upn = (r.user_principal_name || r.email || r.display_name || '').toLowerCase().trim();
        if (!upn) return;
        userMap[upn] = r;
      });
      const uniqueUserRecords = Object.values(userMap);
      const total_unique = uniqueUserRecords.length || 1;
      
      let email = 0, onedrive = 0, teams = 0, mStorage = 0;
      const isAct = (val: any) => String(val) === '1' || String(val) === 'Active' || String(val) === '1.0';
      
      uniqueUserRecords.forEach((r: any) => {
        if (isAct(r.email_exchange)) email++;
        if (isAct(r.one_drive)) onedrive++;
        if (isAct(r.teams)) teams++;
        mStorage += Number(r.storage_used || 0);
      });
      
      const active_features = email + onedrive + teams;
      const max_capacity = total_unique * 3;
      const adoption_rate = max_capacity > 0 ? (active_features / max_capacity) * 100 : 0;
      
      totalAdoption += adoption_rate;
      totalStorage += mStorage;
    });
    
    return {
      adoptionRateAvg: parseFloat((totalAdoption / months.length).toFixed(2)),
      storageUsedAvg: Math.round(totalStorage / months.length)
    };
  }, [dashboardData]);

  const monthlyTrendData = useMemo(() => {
    if (!dashboardData || !dashboardData.m365Records) return [];
    
    const months = Array.from(new Set(dashboardData.m365Records.map((r: any) => r.periode_bulan)))
      .filter(Boolean)
      .sort((a: any, b: any) => {
        const monthsOrder = [
          'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
          'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'
        ];
        const getMonthScore = (str: string) => {
          // Check for date range format like DD-MM-YYYY-DD/MM/YYYY or DD-MM-YYYY (e.g. "01-06-2026-30/06/2026")
          const dateRegex = /(\d{2})[-/](\d{2})[-/](\d{4})/;
          const match = str.match(dateRegex);
          if (match) {
            const month = parseInt(match[2]);
            const year = parseInt(match[3]);
            return year * 12 + month;
          }
          
          const part = str.split(' ')[0];
          const yearPart = str.split(' ')[1] || '';
          const index = monthsOrder.findIndex(m => m.toLowerCase().startsWith(part.toLowerCase()));
          return (parseInt(yearPart) || 2026) * 12 + (index !== -1 ? index : 0);
        };
        return getMonthScore(a) - getMonthScore(b);
      });
    
    return months.map(m => {
      const mRecords = dashboardData.m365Records.filter((r: any) => r.periode_bulan === m);
      
      // For each month, group by user principal name to get unique list
      const userMap: { [key: string]: any } = {};
      mRecords.forEach((r: any) => {
        const upn = (r.user_principal_name || r.email || r.display_name || '').toLowerCase().trim();
        if (!upn) return;
        userMap[upn] = r;
      });
      const uniqueUserRecords = Object.values(userMap);
      const total_unique = uniqueUserRecords.length || 1;
      
      const activeUsers = uniqueUserRecords.filter((r: any) => {
        const act = String(r.activet || '').toLowerCase();
        return act === 'active' || act === 'activet';
      }).length;
      
      const isAct = (val: any) => String(val) === '1' || String(val) === 'Active' || String(val) === '1.0';
      
      const teams = uniqueUserRecords.filter((r: any) => isAct(r.teams)).length;
      const mobile = uniqueUserRecords.filter((r: any) => isAct(r.outlook_for_mobile)).length;
      const web = uniqueUserRecords.filter((r: any) => isAct(r.outlook_for_web)).length;
      const email = uniqueUserRecords.filter((r: any) => isAct(r.email_exchange)).length;
      const onedrive = uniqueUserRecords.filter((r: any) => isAct(r.one_drive)).length;
      
      return {
        month: m,
        userActive: parseFloat(((activeUsers / total_unique) * 100).toFixed(1)),
        teamsActive: parseFloat(((teams / total_unique) * 100).toFixed(1)),
        outlookMobile: parseFloat(((mobile / total_unique) * 100).toFixed(1)),
        outlookWeb: parseFloat(((web / total_unique) * 100).toFixed(1)),
        emailExchange: parseFloat(((email / total_unique) * 100).toFixed(1)),
        onedrive: parseFloat(((onedrive / total_unique) * 100).toFixed(1))
      };
    });
  }, [dashboardData]);

  const fetchOverallTimelines = async () => {
    try {
      setLoadingOverall(true);
      const data = await api.getOverallProjectTimelines();
      setOverallTimelines(data);
    } catch (err) {
      console.error('Gagal mengambil overall timelines:', err);
    } finally {
      setLoadingOverall(false);
    }
  };

  const GANTT_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const getGanttColor = (index: number) => {
    const colors = [
      { bg: 'bg-[#e06d4b]', hover: 'hover:bg-[#e76f51]', border: 'border-[#e06d4b]/20', text: 'text-[#e06d4b]' },
      { bg: 'bg-[#9b5de5]', hover: 'hover:bg-[#a855f7]', border: 'border-[#9b5de5]/20', text: 'text-[#9b5de5]' },
      { bg: 'bg-[#457b9d]', hover: 'hover:bg-[#5792b8]', border: 'border-[#457b9d]/20', text: 'text-[#457b9d]' },
      { bg: 'bg-[#2a9d8f]', hover: 'hover:bg-[#35b0a2]', border: 'border-[#2a9d8f]/20', text: 'text-[#2a9d8f]' },
      { bg: 'bg-[#e76f51]', hover: 'hover:bg-[#f4a261]', border: 'border-[#e76f51]/20', text: 'text-[#e76f51]' }
    ];
    return colors[index % colors.length];
  };

  const getMonthIndex = (dateStr: string) => {
    if (!dateStr) return 5;
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return 5;
      return d.getMonth(); // 0-11
    } catch {
      return 5;
    }
  };

  // Load all evaluation projects
  const fetchProjects = async () => {
    try {
      setLoading(true);
      const data = await api.getEvalProjects();
      setProjects(data);
      fetchOverallTimelines();
    } catch (err: any) {
      console.error(err);
      toast.error('Gagal mengambil daftar project evaluasi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  // Fetch dashboard details when selected project changes or tab switches
  const fetchDashboard = async (projectId: number) => {
    try {
      setLoadingDashboard(true);
      const data = await api.getEvalProjectDashboard(projectId);
      setDashboardData(data);
    } catch (err) {
      console.error(err);
      toast.error('Gagal memuat dashboard project');
    } finally {
      setLoadingDashboard(false);
    }
  };

  const fetchTimeline = async (projectId: number) => {
    try {
      setLoadingTimeline(true);
      const data = await api.getEvalProjectTimeline(projectId);
      setTimeline(data);
    } catch (err) {
      console.error(err);
      toast.error('Gagal memuat timeline project');
    } finally {
      setLoadingTimeline(false);
    }
  };

  useEffect(() => {
    if (selectedProjectId !== null) {
      fetchDashboard(selectedProjectId);
      fetchTimeline(selectedProjectId);
      setSelectedMonth('all');
      setSelectedDepartment('all');
      setSelectedMember('all');
      setColumnFilters({
        periode_bulan: 'all',
        user_principal_name: 'all',
        display_name: 'all',
        department: 'all',
        activet: 'all',
        email_exchange: 'all',
        one_drive: 'all',
        storage_used: 'all',
        teams: 'all',
        reason_teams: 'all',
        outlook_for_mobile: 'all',
        reason_hp: 'all',
        outlook_for_web: 'all',
        reason_web: 'all',
      });
    }
  }, [selectedProjectId]);

  const filteredOverallTimelines = useMemo(() => {
    return overallTimelines.filter(item => {
      const matchSearch = (item.title || '').toLowerCase().includes(overallSearch.toLowerCase()) ||
        (item.description || '').toLowerCase().includes(overallSearch.toLowerCase()) ||
        (item.project_name || '').toLowerCase().includes(overallSearch.toLowerCase());
      const matchStatus = overallStatusFilter === 'all' || item.status === overallStatusFilter;
      return matchSearch && matchStatus;
    });
  }, [overallTimelines, overallSearch, overallStatusFilter]);

  const handleSaveTimelineItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProjectId) return;
    if (!timelineTitle.trim() || !timelineDate) {
      toast.error('Judul dan Tanggal Target wajib diisi!');
      return;
    }

    try {
      if (timelineIdToEdit !== null) {
        await api.updateEvalProjectTimeline(selectedProjectId, timelineIdToEdit, {
          title: timelineTitle,
          description: timelineDesc,
          target_date: timelineDate,
          status: timelineStatus
        });
        toast.success('Milestone berhasil diperbarui');
      } else {
        await api.createEvalProjectTimeline(selectedProjectId, {
          title: timelineTitle,
          description: timelineDesc,
          target_date: timelineDate,
          status: timelineStatus
        });
        toast.success('Milestone baru berhasil ditambahkan');
      }
      
      // Reset form
      setTimelineTitle('');
      setTimelineDesc('');
      setTimelineDate('');
      setTimelineStatus('pending');
      setTimelineIdToEdit(null);
      setShowTimelineForm(false);
      fetchTimeline(selectedProjectId);
    } catch (err) {
      console.error(err);
      toast.error('Gagal menyimpan milestone');
    }
  };

  const handleEditTimelineClick = (item: any) => {
    setTimelineIdToEdit(item.id);
    setTimelineTitle(item.title);
    setTimelineDesc(item.description || '');
    setTimelineDate(item.target_date);
    setTimelineStatus(item.status);
    setShowTimelineForm(true);
  };

  const handleDeleteTimelineClick = async (itemId: number) => {
    if (!selectedProjectId) return;
    if (window.confirm('Apakah Anda yakin ingin menghapus milestone ini?')) {
      try {
        await api.deleteEvalProjectTimeline(selectedProjectId, itemId);
        toast.success('Milestone berhasil dihapus');
        fetchTimeline(selectedProjectId);
      } catch (err) {
        console.error(err);
        toast.error('Gagal menghapus milestone');
      }
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) {
      toast.error('Nama project harus diisi!');
      return;
    }

    try {
      setSubmittingProject(true);
      await api.createEvalProject({
        name: newProjectName,
        description: newProjectDesc,
        target_users: parseInt(newProjectTarget) || 0
      });
      toast.success('Project baru berhasil ditambahkan');
      setNewProjectName('');
      setNewProjectDesc('');
      setNewProjectTarget('100');
      setShowAddModal(false);
      fetchProjects();
    } catch (err) {
      console.error(err);
      toast.error('Gagal menambahkan project baru');
    } finally {
      setSubmittingProject(false);
    }
  };

  const handleDeleteProject = async (id: number, name: string) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus project "${name}" beserta seluruh data analisisnya?`)) {
      try {
        await api.deleteEvalProject(id);
        toast.success(`Project "${name}" berhasil dihapus`);
        if (selectedProjectId === id) {
          setSelectedProjectId(null);
          setDashboardData(null);
        }
        fetchProjects();
      } catch (err) {
        console.error(err);
        toast.error('Gagal menghapus project');
      }
    }
  };

  const handleClearData = () => {
    if (!selectedProjectId) return;
    setClearPasswordInput('');
    setShowClearPasswordModal(true);
  };

  const handleConfirmClearDataWithPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProjectId) return;

    if (clearPasswordInput !== 'root') {
      toast.error('Password salah! Gagal mengosongkan data.');
      return;
    }

    try {
      setLoadingDashboard(true);
      setShowClearPasswordModal(false);
      await api.clearEvalProjectData(selectedProjectId);
      toast.success('Seluruh data project berhasil dikosongkan');
      fetchDashboard(selectedProjectId);
      fetchProjects();
    } catch (err) {
      console.error(err);
      toast.error('Gagal mengosongkan data');
    } finally {
      setLoadingDashboard(false);
    }
  };

  // Parses raw text (CSV/Tab delimited) into structured records
  const handleImportRawText = async () => {
    if (!selectedProjectId || !pasteData.trim()) {
      toast.error('Silakan masukkan data mentah terlebih dahulu');
      return;
    }

    try {
      setIsImporting(true);
      let records: any[] = [];
      
      if (pasteData.trim().startsWith('[')) {
        const jsonData = JSON.parse(pasteData);
        records = jsonData.map((row: any) => ({
          user_name: row['Nama Pengguna'] || row['User'] || row['user_name'] || '',
          department: row['Departemen'] || row['Department'] || row['department'] || '',
          activity_date: row['Tanggal'] || row['Date'] || row['activity_date'] || '',
          activity_type: row['Aktivitas'] || row['Activity'] || row['activity_type'] || 'Akses Aplikasi',
          usage_count: row['Jumlah'] || row['Count'] || row['usage_count'] || 1
        }));
      } else {
        const lines = pasteData.split('\n').map(l => l.trim()).filter(Boolean);
        if (lines.length === 0) {
          toast.error('Data tidak valid');
          setIsImporting(false);
          return;
        }

        // Detect header if exists
        let startIndex = 0;
        const headers = lines[0].toLowerCase();
        const hasHeader = headers.includes('user') || headers.includes('nama') || headers.includes('dept') || headers.includes('tanggal') || headers.includes('date');
        
        if (hasHeader) {
          startIndex = 1;
        }

        const columnSeparator = lines[0].includes(';') ? ';' : lines[0].includes('\t') ? '\t' : ',';

        for (let i = startIndex; i < lines.length; i++) {
          const parts = lines[i].split(columnSeparator).map(p => p.trim().replace(/^["']|["']$/g, ''));
          if (parts.length >= 3) {
            // Columns structure assumption: user_name, department, activity_date, activity_type (optional), usage_count (optional)
            const user_name = parts[0];
            const department = parts[1];
            const activity_date = parts[2];
            const activity_type = parts[3] || 'Akses Aplikasi';
            const usage_count = parts[4] ? parseInt(parts[4]) || 1 : 1;

            if (user_name && department && activity_date) {
              records.push({
                user_name,
                department,
                activity_date,
                activity_type,
                usage_count
              });
            }
          }
        }
      }

      if (records.length === 0) {
        toast.error('Format data salah. Pastikan minimal ada kolom: Pengguna, Departemen, Tanggal (YYYY-MM-DD)');
        setIsImporting(false);
        return;
      }

      await api.importEvalProjectData(selectedProjectId, records);
      toast.success(`${records.length} data berhasil diimport!`);
      setPasteData('');
      fetchDashboard(selectedProjectId);
      fetchProjects();
    } catch (err) {
      console.error(err);
      toast.error('Gagal mengimport data. Periksa kembali format input.');
    } finally {
      setIsImporting(false);
    }
  };

  // Loads realistic seed data depending on the project template
  const loadExampleData = async (template: 'm365' | 'whatsapp') => {
    if (!selectedProjectId) return;
    
    try {
      setIsImporting(true);
      let records: any[] = [];
      const today = new Date();
      
      // Seed 14 days of realistic records
      const depts = ['IT Support', 'Keuangan', 'Logistik & Gudang', 'Pemasaran & Sales', 'SDM / HRD', 'Operasional', 'Customer Service'];
      const m365Users = [
        { name: 'Yudha Pregita', dept: 'IT Support' },
        { name: 'Budi Santoso', dept: 'Keuangan' },
        { name: 'Siti Rahma', dept: 'SDM / HRD' },
        { name: 'Rian Hidayat', dept: 'Operasional' },
        { name: 'Amalia Putri', dept: 'Pemasaran & Sales' },
        { name: 'Eko Sulistyo', dept: 'Logistik & Gudang' },
        { name: 'Dewi Lestari', dept: 'Customer Service' },
        { name: 'Ahmad Fauzi', dept: 'IT Support' },
        { name: 'Citra Kirana', dept: 'Keuangan' },
        { name: 'Gilang Ramadhan', dept: 'Operasional' }
      ];

      const whatsappUsers = [
        { name: 'Dewi Lestari', dept: 'Customer Service' },
        { name: 'Amalia Putri', dept: 'Pemasaran & Sales' },
        { name: 'Rian Hidayat', dept: 'Operasional' },
        { name: 'Andi Wijaya', dept: 'Customer Service' },
        { name: 'Novianti', dept: 'Customer Service' },
        { name: 'Gilang Ramadhan', dept: 'Operasional' }
      ];

      const m365Actions = ['Open Outlook', 'Edit Word Document', 'Share OneDrive Link', 'Teams Chat message', 'Teams Meeting Join', 'Edit Excel Sheet'];
      const whatsappActions = ['Send Broadcast Message', 'Receive Customer Chat', 'Assign Agent', 'Resolve Ticket', 'Send Template Message'];

      if (template === 'm365') {
        const m365UsersList = [
          { name: 'Adam Muarif', upn: 'adam.muarif@kopkardwikarya.co.id', dept: 'Finance' },
          { name: 'Yudha Pregita', upn: 'yudha.pregita@kopkardwikarya.co.id', dept: 'IT Support' },
          { name: 'Budi Santoso', upn: 'budi.santoso@kopkardwikarya.co.id', dept: 'Keuangan' },
          { name: 'Siti Rahma', upn: 'siti.rahma@kopkardwikarya.co.id', dept: 'SDM / HRD' },
          { name: 'Rian Hidayat', upn: 'rian.hidayat@kopkardwikarya.co.id', dept: 'Operasional' },
          { name: 'Amalia Putri', upn: 'amalia.putri@kopkardwikarya.co.id', dept: 'Pemasaran & Sales' },
          { name: 'Eko Sulistyo', upn: 'eko.sulistyo@kopkardwikarya.co.id', dept: 'Logistik & Gudang' },
          { name: 'Dewi Lestari', upn: 'dewi.lestari@kopkardwikarya.co.id', dept: 'Customer Service' },
          { name: 'Ahmad Fauzi', upn: 'ahmad.fauzi@kopkardwikarya.co.id', dept: 'IT Support' },
          { name: 'Citra Kirana', upn: 'citra.kirana@kopkardwikarya.co.id', dept: 'Keuangan' },
          { name: 'Gilang Ramadhan', upn: 'gilang.ramadhan@kopkardwikarya.co.id', dept: 'Operasional' }
        ];

        const licenses = ['Microsoft 365 Business Premium', 'Microsoft 365 Business Standard', 'Office 365 E3'];

        for (const user of m365UsersList) {
          records.push({
            periode_bulan: '01-07-2026-07/11/2026',
            user_principal_name: user.upn,
            display_name: user.name,
            department: user.dept,
            activet: 'Active',
            license_m365: licenses[Math.floor(Math.random() * licenses.length)],
            email_exchange: Math.random() > 0.15 ? '1' : '0',
            one_drive: Math.random() > 0.25 ? '1' : '0',
            storage_used: String(Math.floor(Math.random() * 8000000) + 100000),
            teams: Math.random() > 0.3 ? '1' : '0',
            reason_teams: '',
            outlook_for_mobile: Math.random() > 0.45 ? '1' : '0',
            reason_hp: '',
            outlook_for_web: Math.random() > 0.2 ? '1' : '0',
            reason_web: ''
          });
        }
      } else {
        // whatsapp omni
        const whatsappAgents = [
          { name: 'Ocha', dept: 'HRGA', details: 'Pendaftaran anggota' },
          { name: 'Dewi Lestari', dept: 'Customer Service', details: 'Keluhan tagihan' },
          { name: 'Amalia Putri', dept: 'Pemasaran & Sales', details: 'Informasi produk baru' },
          { name: 'Rian Hidayat', dept: 'Operasional', details: 'Pengiriman barang' },
          { name: 'Andi Wijaya', dept: 'Customer Service', details: 'Reset password akun' },
          { name: 'Novianti', dept: 'Customer Service', details: 'Bantuan pendaftaran' },
          { name: 'Gilang Ramadhan', dept: 'Operasional', details: 'Verifikasi dokumen' }
        ];

        for (const agent of whatsappAgents) {
          const cases = Math.floor(Math.random() * 25) + 5;
          const alreadyRated = Math.floor(Math.random() * (cases - 2)) + 2;
          const notRated = cases - alreadyRated;
          
          let remaining = alreadyRated;
          const verySatisfied = Math.floor(Math.random() * (remaining + 1));
          remaining -= verySatisfied;
          const satisfied = Math.floor(Math.random() * (remaining + 1));
          remaining -= satisfied;
          const neutral = Math.floor(Math.random() * (remaining + 1));
          remaining -= neutral;
          const dissatisfied = Math.floor(Math.random() * (remaining + 1));
          remaining -= dissatisfied;
          const veryDissatisfied = remaining;

          records.push({
            'Bagian - Nama': agent.name,
            'Bagian - Nama_1': agent.dept,
            'Case (Jumlah Responden)': cases,
            'Sudah Rating': alreadyRated,
            'Belum Rating': notRated,
            'Sangat Tidak Puas': veryDissatisfied,
            'Tidak Puas': dissatisfied,
            'Netral': neutral,
            'Puas': satisfied,
            'Sangat Puas': verySatisfied,
            'Rincian Case': agent.details
          });
        }
      }

      await api.importEvalProjectData(selectedProjectId, records);
      toast.success(`Berhasil mengimport ${records.length} data simulasi/contoh untuk ${template === 'm365' ? 'Microsoft 365' : 'Whatsapp Omnichannel'}`);
      fetchDashboard(selectedProjectId);
      fetchProjects();
    } catch (err) {
      console.error(err);
      toast.error('Gagal memuat data contoh');
    } finally {
      setIsImporting(false);
    }
  };

  // File picker handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws) as any[];

        if (!data || data.length === 0) {
          toast.error("File Excel kosong atau tidak valid");
          setIsImporting(false);
          return;
        }
        
        // Assuming we need to convert this to the same format as pasteData or handle it directly
        // Based on the usage, it seems this is just for importing data.
        // Let's set the data directly to trigger the same logic as the import process
        setPasteData(JSON.stringify(data));
        toast.success(`File ${file.name} terbaca. Klik 'Import Sekarang' untuk memproses.`);
        setIsImporting(false);
      } catch (err) {
        toast.error("Gagal membaca file Excel");
        setIsImporting(false);
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws) as any[];

        if (!data || data.length === 0) {
          toast.error("File Excel kosong atau tidak valid");
          setIsImporting(false);
          return;
        }

        const normalizedData = data.map((row: any) => {
          const findVal = (possibleKeys: string[]) => {
            for (const pk of possibleKeys) {
              const foundKey = Object.keys(row).find(k => k.trim().toLowerCase() === pk.toLowerCase());
              if (foundKey !== undefined) return row[foundKey];
            }
            return '';
          };

          if (isWhatsapp) {
            return {
              agent_name: findVal(['Nama Agen', 'Bagian - Nama']),
              department: findVal(['Nama Divisi', 'Bagian - Nama__1', 'Bagian - Nama ']),
              case_count: findVal(['Case (Jumlah Responden)', 'Case (Jumlah Responden)']),
              already_rated: findVal(['Sudah Rating']),
              not_rated: findVal(['Belum Rating']),
              very_dissatisfied: findVal(['Sangat Tidak Puas']),
              dissatisfied: findVal(['Tidak Puas']),
              neutral: findVal(['Netral']),
              satisfied: findVal(['Puas']),
              very_satisfied: findVal(['Sangat Puas']),
              case_details: findVal(['Rincian Case'])
            };
          }

          return {
            periode_bulan: findVal(['periode_bulan', 'periode bulan', 'periode', 'bulan']),
            user_principal_name: findVal(['user principal name', 'user_principal_name', 'upn', 'username']),
            display_name: findVal(['display name', 'display_name', 'nama', 'name']),
            department: findVal(['department', 'departemen', 'divisi']),
            activet: findVal(['activet', 'active', 'aktif']),
            license_m365: findVal(['license m365', 'license_m365', 'license', 'lisensi']),
            email_exchange: findVal(['email exchange', 'email_exchange', 'exchange', 'email']),
            one_drive: findVal(['one drive', 'one_drive', 'onedrive']),
            storage_used: findVal(['storage used (byte)', 'storage_used_byte', 'storage used', 'storage']),
            teams: findVal(['teams']),
            reason_teams: findVal(['reason teams', 'reason_teams']),
            outlook_for_mobile: findVal(['outlook for mobile', 'outlook_for_mobile', 'outlook mobile']),
            reason_hp: findVal(['reason hp', 'reason_hp', 'reason mobile']),
            outlook_for_web: findVal(['outlook for web', 'outlook_for_web', 'outlook web']),
            reason_web: findVal(['reason web', 'reason_web'])
          };
        });

        await api.importEvalProjectData(selectedProjectId!, normalizedData);
        toast.success(`Berhasil mengimport ${normalizedData.length} data ${isWhatsapp ? 'WhatsApp Omnichannel' : 'Microsoft 365'}!`);
        fetchDashboard(selectedProjectId!);
        fetchProjects();
      } catch (err) {
        console.error("Gagal membaca file excel:", err);
        toast.error("Gagal membaca file excel. Pastikan format kolom benar.");
      } finally {
        setIsImporting(false);
        e.target.value = '';
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleDownloadTemplate = () => {
    if (isWhatsapp) {
      const templateData = [
        {
          "Nama Agen": "Ocha",
          "Nama Divisi": "HRGA",
          "Case (Jumlah Responden)": 5,
          "Sudah Rating": 1,
          "Belum Rating": 4,
          "Sangat Tidak Puas": 0,
          "Tidak Puas": 1,
          "Netral": 0,
          "Puas": 0,
          "Sangat Puas": 0,
          "Rincian Case": "Pendaftaran anggota"
        }
      ];

      const ws = XLSX.utils.json_to_sheet(templateData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Template WhatsApp Omni');
      XLSX.writeFile(wb, 'Template_Import_WhatsApp_Omni.xlsx');
      toast.success('Template WhatsApp Omni berhasil diunduh');
      return;
    }

    const templateData = [
      {
        "Periode bulan": "01-07-2026-07/11/2026",
        "User Principal Name": "adam.muarif@kopkardwikarya.co.id",
        "Display Name": "adam muarif",
        "Department": "Finance",
        "Activet": "Active",
        "License M365": "Microsoft 365 Business Premium",
        "Email Exchange": "1",
        "One drive": "1",
        "Storage Used (Byte)": "1897291",
        "Teams": "1",
        "Reason Teams": "",
        "Outlook For Mobile": "1",
        "Reason HP": "",
        "Outlook For Web": "1",
        "Reason web": ""
      }
    ];

    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template M365');
    XLSX.writeFile(wb, 'Template_Import_M365.xlsx');
    toast.success('Template M365 berhasil diunduh');
  };

  const handleExportDataExcel = () => {
    if (isWhatsapp) {
      if (!activeDashboardData || !activeDashboardData.whatsappRecords || activeDashboardData.whatsappRecords.length === 0) {
        toast.error("Tidak ada data untuk diexport");
        return;
      }

      const exportData = activeDashboardData.whatsappRecords.map((r: any) => ({
        "Bagian - Nama": r.agent_name,
        "Bagian - Nama ": r.department,
        "Case (Jumlah Responden)": r.case_count,
        "Sudah Rating": r.already_rated,
        "Belum Rating": r.not_rated,
        "Sangat Tidak Puas": r.very_dissatisfied,
        "Tidak Puas": r.dissatisfied,
        "Netral": r.neutral,
        "Puas": r.satisfied,
        "Sangat Puas": r.very_satisfied,
        "Rincian Case": r.case_details
      }));

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Data WhatsApp Omni');
      XLSX.writeFile(wb, 'Data_Evaluasi_WhatsApp_Omni.xlsx');
      toast.success('Data WhatsApp Omni berhasil diexport');
      return;
    }

    if (!activeDashboardData || !activeDashboardData.m365Records || activeDashboardData.m365Records.length === 0) {
      toast.error("Tidak ada data untuk diexport");
      return;
    }

    const exportData = activeDashboardData.m365Records.map((r: any) => ({
      "Periode bulan": r.periode_bulan,
      "User Principal Name": r.user_principal_name,
      "Display Name": r.display_name,
      "Department": r.department,
      "Activet": r.activet,
      "License M365": r.license_m365 || '',
      "Email Exchange": r.email_exchange,
      "One drive": r.one_drive,
      "Storage Used (Byte)": r.storage_used,
      "Teams": r.teams,
      "Reason Teams": r.reason_teams,
      "Outlook For Mobile": r.outlook_for_mobile,
      "Reason HP": r.reason_hp,
      "Outlook For Web": r.outlook_for_web,
      "Reason web": r.reason_web
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Data M365');
    XLSX.writeFile(wb, 'Data_Evaluasi_M365.xlsx');
    toast.success('Data M365 berhasil diexport');
  };

  // Dashboard calculations for local search/filter of raw records
  const rawRecords = useMemo(() => {
    if (!activeDashboardData) return [];
    if (activeDashboardData.project?.name?.toLowerCase().includes('m365')) {
      return activeDashboardData.m365Records || [];
    }
    if (activeDashboardData.project?.name?.toLowerCase().includes('whatsapp') || activeDashboardData.project?.name?.toLowerCase().includes('omni')) {
      return activeDashboardData.whatsappRecords || [];
    }
    return activeDashboardData.topUsers || [];
  }, [activeDashboardData]);

  const filteredRawRecords = useMemo(() => {
    let records = [...rawRecords];
    
    // Apply search query first
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      if (isM365) {
        records = records.filter((r: any) => 
          (r.display_name || '').toLowerCase().includes(q) ||
          (r.user_principal_name || '').toLowerCase().includes(q) ||
          (r.department || '').toLowerCase().includes(q)
        );
      } else if (isWhatsapp) {
        records = records.filter((r: any) => 
          (r.agent_name || '').toLowerCase().includes(q) ||
          (r.department || '').toLowerCase().includes(q) ||
          (r.case_details || '').toLowerCase().includes(q)
        );
      } else {
        records = records.filter((r: any) => 
          (r.user_name || '').toLowerCase().includes(q) ||
          (r.department || '').toLowerCase().includes(q)
        );
      }
    }

    // Apply column filters if M365
    if (isM365) {
      Object.entries(columnFilters).forEach(([key, val]) => {
        if (val !== 'all') {
          records = records.filter((r: any) => {
            const cellVal = r[key];
            if (cellVal === undefined || cellVal === null) return false;
            return String(cellVal) === val;
          });
        }
      });
    }

    return records;
  }, [rawRecords, searchQuery, columnFilters, isM365]);

  const renderHeaderWithFilter = (label: string, columnKey: string, align: 'left' | 'center' | 'right' = 'left') => {
    const opts = getUniqueOptionsForColumn(columnKey);
    return (
      <th className={`pb-2.5 font-bold uppercase tracking-wider text-[10px] px-3 ${
        align === 'center' ? 'text-center' : align === 'right' ? 'text-right' : 'text-left'
      }`}>
        <div className={`flex flex-col gap-1.5 ${
          align === 'center' ? 'items-center' : align === 'right' ? 'items-end' : 'items-start'
        }`}>
          <span className="font-bold whitespace-nowrap">{label}</span>
          <select
            value={columnFilters[columnKey] || 'all'}
            onChange={(e) => {
              setColumnFilters(prev => ({ ...prev, [columnKey]: e.target.value }));
              setCurrentPage(1);
            }}
            className={`text-[9px] font-bold px-1.5 py-0.5 rounded-lg border outline-none cursor-pointer max-w-[140px] w-full transition-all ${
              isDark 
                ? 'bg-slate-900 border-slate-800 text-slate-300 focus:border-purple-500' 
                : 'bg-white border-slate-200 text-slate-600 focus:border-purple-500'
            }`}
          >
            <option value="all">Semua</option>
            {opts.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
      </th>
    );
  };

  const formatBytes = (bytes: number) => {
    if (!bytes || bytes <= 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const cardClass = `${isDark ? 'bg-[#1e2330] border-slate-800' : 'bg-white border-slate-200'} border rounded-[1.5rem] p-5 shadow-sm transition-all duration-200`;
  const textMuted = isDark ? 'text-slate-400' : 'text-slate-500';
  const textMain = isDark ? 'text-white' : 'text-slate-900';

  return (
    <div className="space-y-4 animate-in fade-in duration-500">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-500 border border-purple-500/20">
              <Sparkles className="w-4 h-4" />
            </div>
            <h1 className={`text-2xl font-black tracking-tight ${textMain}`}>Evaluasi Project</h1>
          </div>
          <p className={`text-xs ${textMuted}`}>Analisa pemakaian & tingkat adopsi sistem aplikasi dilingkup perusahaan</p>
        </div>
        
        {selectedProjectId === null && (
          <button
            onClick={() => setShowAddModal(true)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-700 active:scale-95 text-white transition-all shadow-md shadow-purple-500/10`}
          >
            <FolderPlus className="w-4 h-4" />
            <span>Tambah Project Baru</span>
          </button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {selectedProjectId === null ? (
          /* PROJECT LIST SCREEN */
          <motion.div 
            key="list"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-4"
          >
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 space-y-3">
                <RefreshCcw className="w-8 h-8 text-purple-500 animate-spin" />
                <p className="text-xs text-slate-400 font-medium">Memuat daftar project...</p>
              </div>
            ) : projects.length === 0 ? (
              <div className={`flex flex-col items-center justify-center text-center py-16 border border-dashed rounded-[2rem] ${isDark ? 'border-slate-800 bg-[#161a23]' : 'border-slate-200 bg-slate-50/50'}`}>
                <div className="w-16 h-16 rounded-3xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4 text-slate-400">
                  <Layers className="w-8 h-8" />
                </div>
                <h3 className={`text-sm font-bold ${textMain} mb-1`}>Belum ada Project Evaluasi</h3>
                <p className={`text-xs ${textMuted} max-w-sm mb-5`}>
                  Buat project baru untuk menganalisa penggunaan program aplikasi seperti Microsoft 365, Whatsapp, ERP, dll.
                </p>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white transition-all"
                >
                  <FolderPlus className="w-4 h-4" />
                  <span>Mulai Tambah Project</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {projects.map((project) => {
                  const adoptionRate = project.target_users > 0 
                    ? Math.round(((project.user_count || 0) / project.target_users) * 100) 
                    : 0;

                  return (
                    <div 
                      key={project.id}
                      className={`${cardClass} hover:border-purple-500/50 group flex flex-col justify-between`}
                    >
                      <div>
                        {/* Project Header */}
                        <div className="flex items-start justify-between gap-4 mb-3">
                          <div className="space-y-1">
                            <h3 className={`text-base font-bold ${textMain} group-hover:text-purple-500 transition-colors`}>
                              {project.name}
                            </h3>
                            <p className="text-[10px] text-slate-400 flex items-center gap-1 font-mono">
                              <Calendar className="w-3 h-3" />
                              <span>Dibuat: {new Date(project.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                            </p>
                          </div>
                          
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteProject(project.id, project.name);
                            }}
                            className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-500/10 transition-colors"
                            title="Hapus Project"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Description */}
                        <p className={`text-xs ${textMuted} line-clamp-2 mb-4 h-8`}>
                          {project.description || 'Tidak ada deskripsi tambahan.'}
                        </p>

                        {/* Metrics Bar */}
                        <div className="grid grid-cols-3 gap-2 py-3 px-3 rounded-2xl bg-slate-500/5 mb-4 border border-slate-500/5">
                          <div className="text-center">
                            <span className={`block text-lg font-black ${textMain}`}>{project.total_usage || 0}</span>
                            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Aktivitas</span>
                          </div>
                          <div className="text-center border-x border-slate-500/10">
                            <span className={`block text-lg font-black ${textMain}`}>{project.user_count || 0}</span>
                            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">User</span>
                          </div>
                          <div className="text-center">
                            <span className={`block text-lg font-black ${textMain}`}>{project.department_count || 0}</span>
                            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Divisi</span>
                          </div>
                        </div>

                        {/* Adoption Progress */}
                        <div className="space-y-1.5 mb-5">
                          <div className="flex justify-between text-[11px] font-bold">
                            <span className={textMuted}>Tingkat Adopsi Pengguna</span>
                            <span className="text-purple-500">{adoptionRate}% ({project.user_count || 0}/{project.target_users})</span>
                          </div>
                          <div className="w-full h-2 bg-slate-500/10 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 transition-all duration-500"
                              style={{ width: `${Math.min(adoptionRate, 100)}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Action Button */}
                      <button
                        onClick={() => setSelectedProjectId(project.id)}
                        className="w-full py-2.5 rounded-xl border border-purple-500/30 text-purple-500 hover:bg-purple-500/10 text-xs font-black flex items-center justify-center gap-1.5 active:scale-98 transition-all"
                      >
                        <TrendingUp className="w-4 h-4" />
                        <span>Buka Dashboard Analisa</span>
                        <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Overall Project Timeline Section */}
            {projects.length > 0 && (
              <div className={`${cardClass} space-y-6 mt-6`}>
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-500/10">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-purple-500" />
                      <h2 className={`text-base font-black ${textMain}`}>Timeline & Milestone Kumulatif (Seluruh Project)</h2>
                    </div>
                    <p className={`text-xs ${textMuted}`}>Pantau dan sinkronisasikan target pengerjaan seluruh project aktif Anda secara terpadu</p>
                  </div>

                  {/* Filter Controls */}
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Search Input */}
                    <div className="relative">
                      <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Cari milestone atau project..."
                        value={overallSearch}
                        onChange={(e) => setOverallSearch(e.target.value)}
                        className={`text-xs pl-9 pr-3 py-2 rounded-xl border outline-none w-56 transition-all ${
                          isDark ? 'bg-slate-900 border-slate-800 text-white focus:border-purple-500' : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-purple-500'
                        }`}
                      />
                    </div>

                    {/* Status Filter */}
                    <select
                      value={overallStatusFilter}
                      onChange={(e: any) => setOverallStatusFilter(e.target.value)}
                      className={`text-xs px-3 py-2 rounded-xl border outline-none transition-all ${
                        isDark ? 'bg-slate-900 border-slate-800 text-white focus:border-purple-500' : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-purple-500'
                      }`}
                    >
                      <option value="all">Semua Status</option>
                      <option value="pending">Tertunda</option>
                      <option value="on_progress">Dalam Proses</option>
                      <option value="completed">Selesai</option>
                    </select>

                    {/* Group By Selector */}
                    <div className="flex rounded-xl bg-slate-500/10 p-0.5 border border-slate-500/5">
                      <button
                        onClick={() => setOverallGroupBy('gantt')}
                        className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
                          overallGroupBy === 'gantt'
                            ? (isDark ? 'bg-slate-800 text-white shadow-sm' : 'bg-white text-slate-900 shadow-sm')
                            : 'text-slate-400 hover:text-slate-500'
                        }`}
                      >
                        Visual Gantt (12 Bulan)
                      </button>
                      <button
                        onClick={() => setOverallGroupBy('date')}
                        className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
                          overallGroupBy === 'date'
                            ? (isDark ? 'bg-slate-800 text-white shadow-sm' : 'bg-white text-slate-900 shadow-sm')
                            : 'text-slate-400 hover:text-slate-500'
                        }`}
                      >
                        Urutan Waktu
                      </button>
                      <button
                        onClick={() => setOverallGroupBy('project')}
                        className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
                          overallGroupBy === 'project'
                            ? (isDark ? 'bg-slate-800 text-white shadow-sm' : 'bg-white text-slate-900 shadow-sm')
                            : 'text-slate-400 hover:text-slate-500'
                        }`}
                      >
                        Grup per Project
                      </button>
                    </div>
                  </div>
                </div>

                {loadingOverall ? (
                  <div className="flex flex-col items-center justify-center py-12 space-y-2">
                    <RefreshCcw className="w-6 h-6 text-purple-500 animate-spin" />
                    <p className="text-xs text-slate-400 font-medium">Memuat data timeline...</p>
                  </div>
                ) : filteredOverallTimelines.length === 0 ? (
                  <div className="text-center py-12">
                    <Calendar className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                    <h4 className={`text-sm font-bold ${textMain} mb-1`}>Tidak Ada Milestone</h4>
                    <p className={`text-xs ${textMuted} max-w-sm mx-auto`}>
                      Belum ada milestone yang terdaftar atau cocok dengan kriteria filter Anda. Silakan tambahkan milestone di dalam masing-masing detail project.
                    </p>
                  </div>
                ) : overallGroupBy === 'gantt' ? (
                  /* BEAUTIFUL 12-MONTH HORIZONTAL GANTT CHART (SCREENSHOT INSPIRED) */
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className={`text-base font-black ${textMain}`}>Project timeline: 12 months</h3>
                      <span className="text-[10px] font-mono text-slate-400 bg-slate-500/5 px-2.5 py-1 rounded-lg border border-slate-500/5">
                        Tahun Target: 2026
                      </span>
                    </div>

                    {/* Scrollable Timeline Container */}
                    <div className="overflow-x-auto pb-4 scrollbar-thin">
                      <div className="min-w-[960px] relative space-y-6 select-none pr-4">
                        
                        {/* Background Grid Lines */}
                        <div className="absolute inset-0 top-12 bottom-16 grid grid-cols-12 pointer-events-none">
                          {[...Array(12)].map((_, colIdx) => (
                            <div 
                              key={colIdx} 
                              className={`h-full border-r ${
                                colIdx === 6 // July
                                  ? 'border-purple-500/20 bg-purple-500/[0.015]' 
                                  : 'border-slate-500/5'
                              } last:border-r-0`} 
                            />
                          ))}
                        </div>

                        {/* Top Milestone Diamonds & Vertical Connector lines */}
                        <div className="grid grid-cols-12 gap-2 relative h-10">
                          {GANTT_MONTHS.map((m, colIdx) => {
                            const monthMilestones = filteredOverallTimelines.filter(t => {
                              try {
                                const d = new Date(t.target_date);
                                return !isNaN(d.getTime()) && d.getMonth() === colIdx;
                              } catch {
                                return false;
                              }
                            });

                            if (monthMilestones.length === 0) return <div key={colIdx} />;

                            // Cycle or select gantt color for the first milestone in this month
                            const milestoneItem = monthMilestones[0];
                            const milestoneIdx = filteredOverallTimelines.indexOf(milestoneItem);
                            const ganttColor = getGanttColor(milestoneIdx !== -1 ? milestoneIdx : colIdx);

                            return (
                              <div key={colIdx} className="relative flex flex-col items-center justify-end h-full">
                                {/* Vertical Dashed Line running down the chart */}
                                <div className="absolute top-10 bottom-[-500px] w-0.5 border-l-2 border-dashed border-slate-300 dark:border-slate-800 left-1/2 -translate-x-1/2 pointer-events-none z-0 group-hover:border-purple-500" />
                                
                                <div className="text-[9px] font-black tracking-tight text-slate-400 truncate w-full text-center mb-1 max-w-[76px] relative z-10">
                                  {monthMilestones.length > 1 
                                    ? `${monthMilestones.length} Milestones` 
                                    : milestoneItem.title
                                  }
                                </div>
                                <div 
                                  className={`w-3 h-3 rotate-45 transform shadow-md ${ganttColor.bg} border-2 border-white dark:border-slate-900 transition-all z-10 relative cursor-help group`}
                                  title={milestoneItem.title}
                                >
                                  {/* Micro Tooltip */}
                                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-slate-900 text-white text-[10px] rounded-lg shadow-lg hidden group-hover:block z-30 pointer-events-none rotate-[-45deg] origin-bottom">
                                    <div className="font-extrabold text-purple-400">{milestoneItem.project_name}</div>
                                    <div className="font-bold truncate">{milestoneItem.title}</div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Months Row Header */}
                        <div className="grid grid-cols-12 gap-2 bg-slate-100 dark:bg-slate-800/80 p-2.5 rounded-[1.25rem] text-center font-black text-xs text-slate-600 dark:text-slate-300 relative z-10">
                          {GANTT_MONTHS.map((m, idx) => {
                            const isCurrent = idx === 6; // July 2026
                            return (
                              <div 
                                key={m} 
                                className={`py-2 rounded-xl transition-all ${
                                  isCurrent 
                                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/15' 
                                    : 'hover:bg-slate-200 dark:hover:bg-slate-700/50'
                                }`}
                              >
                                {m}
                              </div>
                            );
                          })}
                        </div>

                        {/* Staggered Gantt Bars Area */}
                        <div className="space-y-4 pt-2 relative">
                          {(() => {
                            // Sort by date to form cascade
                            const sorted = [...filteredOverallTimelines].sort((a, b) => {
                              return new Date(a.target_date).getTime() - new Date(b.target_date).getTime();
                            });

                            return sorted.map((item, idx) => {
                              const endCol = getMonthIndex(item.target_date);
                              
                              // Cascade startCol calculation
                              let startCol = 0;
                              if (idx > 0) {
                                startCol = getMonthIndex(sorted[idx - 1].target_date);
                              } else {
                                startCol = Math.max(0, endCol - 1);
                              }

                              // Ensure width is at least 1 column and starts appropriately
                              if (startCol >= endCol) {
                                startCol = Math.max(0, endCol - 1);
                              }

                              const ganttColor = getGanttColor(idx);
                              const colStart = startCol + 1;
                              const colSpan = endCol - startCol + 1;

                              const formatDateStrShort = (dateStr: string) => {
                                if (!dateStr) return '';
                                try {
                                  const d = new Date(dateStr);
                                  if (isNaN(d.getTime())) return dateStr;
                                  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
                                } catch {
                                  return dateStr;
                                }
                              };

                              const formatDateStrLong = (dateStr: string) => {
                                if (!dateStr) return '';
                                try {
                                  const d = new Date(dateStr);
                                  if (isNaN(d.getTime())) return dateStr;
                                  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
                                } catch (e) {
                                  return dateStr;
                                }
                              };

                              const finishText = formatDateStrShort(item.target_date);

                              return (
                                <div key={item.id} className="grid grid-cols-12 gap-2 h-16 items-center relative group">
                                  {/* Bar element spanning columns */}
                                  <div 
                                    style={{ gridColumn: `${colStart} / span ${colSpan}` }}
                                    className="flex flex-col relative z-10"
                                  >
                                    {/* Start / Finish Date label above bar */}
                                    <div className="text-[9px] text-slate-400 font-extrabold mb-1 px-1 flex justify-between">
                                      <span>Target: {finishText}</span>
                                      <span className="uppercase text-[8px] opacity-75">{item.project_name}</span>
                                    </div>

                                    {/* Interactive styled bar */}
                                    <div 
                                      onClick={() => {
                                        setSelectedProjectId(item.project_id);
                                        setActiveTab('timeline');
                                      }}
                                      className={`group/bar cursor-pointer ${ganttColor.bg} ${ganttColor.hover} text-white p-3 rounded-2xl shadow-md transition-all active:scale-98 flex items-center justify-between border border-white/10 relative`}
                                    >
                                      <div className="min-w-0 flex-1 flex items-center gap-2">
                                        <div className={`w-1.5 h-1.5 rounded-full ${
                                          item.status === 'completed' 
                                            ? 'bg-emerald-300' 
                                            : item.status === 'on_progress' 
                                            ? 'bg-blue-300 animate-pulse' 
                                            : 'bg-white/60'
                                        }`} />
                                        <span className="text-xs font-black truncate">{item.title}</span>
                                      </div>
                                      <ChevronRight className="w-3.5 h-3.5 opacity-60 group-hover/bar:translate-x-0.5 transition-transform" />

                                      {/* Rich Hover Tooltip Details */}
                                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2.5 w-64 p-3 bg-slate-950/95 dark:bg-black/95 text-white text-xs rounded-2xl shadow-xl border border-slate-800 hidden group-hover/bar:block z-50 backdrop-blur-sm">
                                        <div className="font-extrabold text-purple-400 text-[10px] uppercase tracking-widest mb-1">{item.project_name}</div>
                                        <div className="font-black text-sm mb-1">{item.title}</div>
                                        {item.description && <div className="text-slate-300 text-[11px] mb-2 leading-relaxed font-medium">{item.description}</div>}
                                        <div className="flex justify-between items-center text-[10px] text-slate-400 border-t border-slate-800/80 pt-2">
                                          <span>Target: {formatDateStrLong(item.target_date)}</span>
                                          <span className={`px-2 py-0.5 rounded-md font-bold uppercase text-[9px] ${
                                            item.status === 'completed' 
                                              ? 'bg-emerald-500/20 text-emerald-400' 
                                              : item.status === 'on_progress' 
                                              ? 'bg-blue-500/20 text-blue-400' 
                                              : 'bg-amber-500/20 text-amber-400'
                                          }`}>{item.status === 'completed' ? 'Selesai' : item.status === 'on_progress' ? 'Proses' : 'Tertunda'}</span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              );
                            });
                          })()}
                        </div>

                        {/* Bottom NOW Tracker bar */}
                        <div className="relative py-4 mt-8">
                          {/* Grey Tracker Channel */}
                          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-8 bg-slate-100 dark:bg-slate-800/40 rounded-xl border border-slate-500/5" />
                          
                          {/* Active tracking width up to July (month index 6) */}
                          <div 
                            className="absolute left-0 top-1/2 -translate-y-1/2 h-8 bg-purple-500/10 dark:bg-purple-500/20 rounded-l-xl border-y border-l border-purple-500/20"
                            style={{ width: `${((6 + 1) / 12) * 100}%` }}
                          />
                          
                          {/* Absolute position checkmark for July */}
                          <div 
                            className="absolute top-1/2 -translate-y-1/2 flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-[10px] font-black shadow-md shadow-purple-500/20 cursor-default"
                            style={{ left: `${(6 / 12) * 100}%`, transform: 'translate(-50%, -50%)' }}
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                            <span>SEKARANG (JULI 2026)</span>
                          </div>
                        </div>

                      </div>
                    </div>
                  </div>
                ) : overallGroupBy === 'date' ? (
                  /* VERTICAL CHRONOLOGICAL TIMELINE */
                  <div className="relative pl-6 space-y-6">
                    {/* Center continuous line */}
                    <div className="absolute left-2.5 top-2 bottom-2 w-0.5 bg-slate-200 dark:bg-slate-800" />

                    {filteredOverallTimelines.map((item) => {
                      const isCompleted = item.status === 'completed';
                      const isOnProgress = item.status === 'on_progress';
                      const formatDateStr = (dateStr: string) => {
                        if (!dateStr) return '';
                        try {
                          const d = new Date(dateStr);
                          if (isNaN(d.getTime())) return dateStr;
                          return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
                        } catch (e) {
                          return dateStr;
                        }
                      };

                      return (
                        <div key={item.id} className="relative group flex flex-col md:flex-row md:items-start gap-4">
                          {/* Dot indicator */}
                          <div className={`absolute -left-6 top-1.5 w-5 h-5 rounded-full flex items-center justify-center transition-all z-10 border ${
                            isCompleted 
                              ? 'bg-emerald-500 border-emerald-500 text-white' 
                              : isOnProgress 
                              ? 'bg-blue-500 border-blue-500 text-white animate-pulse' 
                              : 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-500'
                          }`}>
                            <div className="w-1.5 h-1.5 rounded-full bg-white" />
                          </div>

                          {/* Content Card with Project Pill */}
                          <div className={`flex-1 p-4 rounded-2xl border transition-all ${
                            isDark 
                              ? 'bg-[#151922] hover:bg-[#1a1e2a] border-slate-800/80 group-hover:border-slate-700' 
                              : 'bg-slate-50 hover:bg-slate-100/80 border-slate-200/80 group-hover:border-slate-300'
                          }`}>
                            <div className="flex flex-wrap items-start justify-between gap-2">
                              <div className="space-y-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  {/* Project Name Badge */}
                                  <span className="px-2 py-0.5 bg-purple-500/10 text-purple-500 text-[10px] font-black rounded-lg border border-purple-500/20">
                                    {item.project_name}
                                  </span>
                                  <h4 className={`text-sm font-bold ${textMain}`}>{item.title}</h4>
                                  
                                  {/* Status Badge */}
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                    isCompleted 
                                      ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' 
                                      : isOnProgress 
                                      ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20' 
                                      : 'bg-slate-500/10 text-slate-500 border border-slate-500/20'
                                  }`}>
                                    {isCompleted ? 'Selesai' : isOnProgress ? 'Dalam Proses' : 'Tertunda'}
                                  </span>
                                </div>

                                {item.description && (
                                  <p className={`text-xs ${textMuted} whitespace-pre-line pt-1`}>
                                    {item.description}
                                  </p>
                                )}

                                <div className="flex items-center gap-1.5 text-[10px] text-slate-400 pt-1.5">
                                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                  <span>Target: {formatDateStr(item.target_date)}</span>
                                </div>
                              </div>

                              {/* Hover Navigation Action */}
                              <button
                                onClick={() => {
                                  setSelectedProjectId(item.project_id);
                                  setActiveTab('timeline');
                                }}
                                className="px-2.5 py-1.5 rounded-lg text-[10px] font-bold bg-slate-500/10 hover:bg-purple-600 hover:text-white transition-all text-slate-400"
                              >
                                Kelola Milestone
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  /* GROUP BY PROJECT MILESTONE TRACKS */
                  <div className="space-y-4">
                    {projects.map((proj) => {
                      const projTimelines = filteredOverallTimelines.filter(t => t.project_id === proj.id);
                      if (projTimelines.length === 0) return null;

                      const completedCount = projTimelines.filter(t => t.status === 'completed').length;
                      const percentComp = Math.round((completedCount / projTimelines.length) * 100);

                      return (
                        <div key={proj.id} className={`p-4 rounded-2xl border ${isDark ? 'bg-[#151922] border-slate-800' : 'bg-slate-50 border-slate-200'} space-y-3`}>
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="space-y-0.5">
                              <h4 className={`text-sm font-black ${textMain}`}>{proj.name}</h4>
                              <p className="text-[10px] text-slate-400">Kemajuan Milestones: {completedCount} dari {projTimelines.length} selesai ({percentComp}%)</p>
                            </div>
                            <button
                              onClick={() => {
                                setSelectedProjectId(proj.id);
                                setActiveTab('timeline');
                              }}
                              className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-purple-500/10 hover:bg-purple-600 text-purple-500 hover:text-white border border-purple-500/10 transition-all"
                            >
                              Buka Timeline Project
                            </button>
                          </div>

                          {/* Progress Line */}
                          <div className="w-full h-1.5 bg-slate-500/10 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-purple-500 transition-all duration-500"
                              style={{ width: `${percentComp}%` }}
                            />
                          </div>

                          {/* Horizontal steps flow */}
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
                            {projTimelines.map(t => {
                              const isCompleted = t.status === 'completed';
                              const isOnProgress = t.status === 'on_progress';

                              return (
                                <div key={t.id} className={`p-2.5 rounded-xl border text-xs flex items-start gap-2.5 ${
                                  isCompleted 
                                    ? 'bg-emerald-500/5 border-emerald-500/20' 
                                    : isOnProgress 
                                    ? 'bg-blue-500/5 border-blue-500/20' 
                                    : (isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-100')
                                }`}>
                                  <div className={`mt-0.5 w-2 h-2 rounded-full flex-shrink-0 ${
                                    isCompleted ? 'bg-emerald-500' : isOnProgress ? 'bg-blue-500 animate-pulse' : 'bg-slate-400'
                                  }`} />
                                  <div className="space-y-0.5 min-w-0 flex-1">
                                    <h5 className={`font-bold truncate ${textMain}`}>{t.title}</h5>
                                    {t.description && <p className={`text-[11px] ${textMuted} truncate`}>{t.description}</p>}
                                    <p className="text-[10px] text-slate-400 font-mono">
                                      Target: {t.target_date}
                                    </p>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </motion.div>
        ) : (
          /* DEEP-DIVE PROJECT DASHBOARD */
          <motion.div 
            key="dashboard"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-4"
          >
            {/* Back Header */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-slate-500/10">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    setSelectedProjectId(null);
                    setDashboardData(null);
                    fetchProjects();
                  }}
                  className={`p-2.5 rounded-xl border ${isDark ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'} transition-all`}
                  title="Kembali ke Daftar Project"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <div>
                  <h2 className={`text-lg font-black ${textMain}`}>{dashboardData?.project?.name}</h2>
                  <p className={`text-xs ${textMuted} line-clamp-1`}>{dashboardData?.project?.description || 'Project evaluasi pemakaian sistem'}</p>
                </div>
              </div>

              {/* View/Import Tabs */}
              <div className="flex gap-1.5 p-1 rounded-xl bg-slate-500/5 border border-slate-500/10">
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    activeTab === 'dashboard' 
                      ? 'bg-purple-500 text-white shadow-sm' 
                      : `${textMuted} hover:text-purple-500`
                  }`}
                >
                  📊 Dashboard Analisa
                </button>
                <button
                  onClick={() => setActiveTab('timeline')}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    activeTab === 'timeline' 
                      ? 'bg-purple-500 text-white shadow-sm' 
                      : `${textMuted} hover:text-purple-500`
                  }`}
                >
                  📅 Timeline Project
                </button>
                <button
                  onClick={() => setActiveTab('data')}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    activeTab === 'data' 
                      ? 'bg-purple-500 text-white shadow-sm' 
                      : `${textMuted} hover:text-purple-500`
                  }`}
                >
                  📁 Kelola Data Raw
                </button>
              </div>
            </div>

            {loadingDashboard ? (
              <div className="flex flex-col items-center justify-center py-24 space-y-3">
                <RefreshCcw className="w-8 h-8 text-purple-500 animate-spin" />
                <p className="text-xs text-slate-400 font-medium">Memuat metrik dashboard...</p>
              </div>
            ) : (
              <div className="space-y-4">
                
                {/* 1. STATE CARDS */}
                <AnimatePresence mode="wait">
                  <motion.div
                    key={`state-cards-${selectedMonth}-${selectedDepartment}-${selectedMember}`}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2, ease: "easeInOut" }}
                  >
                    {isM365 && selectedMonth === 'all' ? (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {/* Left side: Line Chart Trend (Gambar 2) */}
                    <div className={`${cardClass} lg:col-span-2 flex flex-col justify-between min-h-[300px] p-5`}>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                        <div>
                          <h3 className={`text-xs font-black uppercase tracking-wider ${textMuted}`}>Tren Adopsi & Keaktifan Pengguna</h3>
                          <span className="text-[10px] text-slate-400">Statistik penggunaan M365 (3 Periode Terkini)</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                          <div className="flex items-center gap-1 text-[10px] font-bold">
                            <div className="w-2.5 h-2.5 rounded-full bg-[#3b82f6]" />
                            <span className={textMuted}>User active</span>
                          </div>
                          <div className="flex items-center gap-1 text-[10px] font-bold">
                            <div className="w-2.5 h-2.5 rounded-full bg-[#10b981]" />
                            <span className={textMuted}>Teams aktif</span>
                          </div>
                          <div className="flex items-center gap-1 text-[10px] font-bold">
                            <div className="w-2.5 h-2.5 rounded-full bg-[#f59e0b]" />
                            <span className={textMuted}>Outlook mobile</span>
                          </div>
                          <div className="flex items-center gap-1 text-[10px] font-bold">
                            <div className="w-2.5 h-2.5 rounded-full bg-[#8b5cf6]" />
                            <span className={textMuted}>Outlook web</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex-1 min-h-[220px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart
                            data={monthlyTrendData}
                            margin={{ top: 10, right: 30, left: 10, bottom: 5 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#334155/30' : '#e2e8f0'} />
                            <XAxis 
                              dataKey="month" 
                              tick={{ fontSize: 9, fill: isDark ? '#94a3b8' : '#64748b', fontWeight: 'bold' }}
                              axisLine={false}
                              tickLine={false}
                            />
                            <YAxis 
                              domain={[0, 100]}
                              tickFormatter={(val) => `${val}%`}
                              tick={{ fontSize: 9, fill: isDark ? '#94a3b8' : '#64748b' }}
                              axisLine={false}
                              tickLine={false}
                            />
                            <Tooltip 
                              formatter={(value: any) => [`${value}%`]}
                              contentStyle={{ 
                                backgroundColor: isDark ? '#1e293b' : '#ffffff', 
                                borderColor: isDark ? '#475569' : '#e2e8f0',
                                borderRadius: '0.75rem',
                                fontSize: '11px',
                                color: isDark ? '#fff' : '#000'
                              }}
                            />
                            <Line 
                              type="monotone" 
                              dataKey="userActive" 
                              name="User active" 
                              stroke="#3b82f6" 
                              strokeWidth={3} 
                              activeDot={{ r: 8 }} 
                              dot={{ r: 5, stroke: '#3b82f6', strokeWidth: 2, fill: '#fff' }} 
                            />
                            <Line 
                              type="monotone" 
                              dataKey="teamsActive" 
                              name="Teams aktif" 
                              stroke="#10b981" 
                              strokeWidth={2.5} 
                              strokeDasharray="5 5" 
                              activeDot={{ r: 7 }} 
                              dot={{ r: 5, stroke: '#10b981', strokeWidth: 2, fill: '#fff' }} 
                            />
                            <Line 
                              type="monotone" 
                              dataKey="outlookMobile" 
                              name="Outlook mobile" 
                              stroke="#f59e0b" 
                              strokeWidth={2.5} 
                              strokeDasharray="3 3" 
                              activeDot={{ r: 7 }} 
                              dot={{ r: 5, stroke: '#f59e0b', strokeWidth: 2, fill: '#fff' }} 
                            />
                            <Line 
                              type="monotone" 
                              dataKey="outlookWeb" 
                              name="Outlook web" 
                              stroke="#8b5cf6" 
                              strokeWidth={2.5} 
                              strokeDasharray="10 4 2 4" 
                              activeDot={{ r: 7 }} 
                              dot={{ r: 5, stroke: '#8b5cf6', strokeWidth: 2, fill: '#fff' }} 
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Right side: 2 KPI Cards containing the 3-month averages */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3 sm:gap-4 h-full">
                      {/* Card 1: Rasio Adopsi Sistem (Rerata 3 Bulan) */}
                      <div className={`${cardClass} flex flex-col justify-between p-5`}>
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <span className={`text-[10px] font-bold uppercase tracking-wider ${textMuted}`}>Rasio Adopsi Sistem (Rerata)</span>
                            <div className="w-7 h-7 rounded-lg bg-yellow-500/10 text-yellow-500 flex items-center justify-center">
                              <TrendingUp className="w-3.5 h-3.5" />
                            </div>
                          </div>
                          <div className={`text-3xl sm:text-4xl font-black ${textMain}`}>
                            {averages3Months.adoptionRateAvg}%
                          </div>
                        </div>
                        <div className="mt-4">
                          <div className="w-full h-1.5 bg-slate-500/10 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-yellow-500 rounded-full" 
                              style={{ width: `${Math.min(averages3Months.adoptionRateAvg || 0, 100)}%` }}
                            />
                          </div>
                          <p className={`text-[10px] ${textMuted} mt-1.5`}>
                            Rata-rata tingkat adopsi selama 3 bulan
                          </p>
                        </div>
                      </div>

                      {/* Card 2: Rerata Storage / Bulan */}
                      <div className={`${cardClass} flex flex-col justify-between p-5`}>
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <span className={`text-[10px] font-bold uppercase tracking-wider ${textMuted}`}>Rerata Storage / Bulan</span>
                            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                              <Database className="w-3.5 h-3.5" />
                            </div>
                          </div>
                          <div className={`text-xl sm:text-2xl font-black ${textMain} truncate`} title={formatBytes(averages3Months.storageUsedAvg)}>
                            {formatBytes(averages3Months.storageUsedAvg)}
                          </div>
                        </div>
                        <p className={`text-[10px] ${textMuted} mt-4`}>
                          {Number(averages3Months.storageUsedAvg).toLocaleString()} Bytes per bulan (rata-rata)
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* 1. STATE CARDS */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                      <div className={cardClass}>
                        <div className="flex items-center justify-between mb-3">
                          <span className={`text-[10px] font-bold uppercase tracking-wider ${textMuted}`}>(Total License)</span>
                          <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                            <Activity className="w-3.5 h-3.5" />
                          </div>
                        </div>
                        <div className={`text-2xl sm:text-3xl font-black ${textMain}`}>
                          {activeDashboardData?.stats?.total_usage || 0}
                        </div>
                        <p className="text-[10px] text-emerald-500 font-bold mt-1">
                          {activeDashboardData?.stats?.total_records || 0} baris data raw
                        </p>
                      </div>

                      <div className={cardClass}>
                        <div className="flex items-center justify-between mb-3">
                          <span className={`text-[10px] font-bold uppercase tracking-wider ${textMuted}`}>Pengguna Aktif</span>
                          <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center">
                            <Users className="w-3.5 h-3.5" />
                          </div>
                        </div>
                        <div className={`text-2xl sm:text-3xl font-black ${textMain}`}>
                          {activeDashboardData?.stats?.active_users || 0}
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1">
                          Target user: {activeDashboardData?.stats?.target_users || 0}
                        </p>
                      </div>

                      <div className={cardClass}>
                        <div className="flex items-center justify-between mb-3">
                          <span className={`text-[10px] font-bold uppercase tracking-wider ${textMuted}`}>Departemen Aktif</span>
                          <div className="w-7 h-7 rounded-lg bg-purple-500/10 text-purple-500 flex items-center justify-center">
                            <Briefcase className="w-3.5 h-3.5" />
                          </div>
                        </div>
                        <div className={`text-2xl sm:text-3xl font-black ${textMain}`}>
                          {activeDashboardData?.stats?.active_departments || 0}
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1">
                          Divisi berpartisipasi
                        </p>
                      </div>

                      <div className={cardClass}>
                        <div className="flex items-center justify-between mb-3">
                          <span className={`text-[10px] font-bold uppercase tracking-wider ${textMuted}`}>Rasio Adopsi Sistem</span>
                          <div className="w-7 h-7 rounded-lg bg-yellow-500/10 text-yellow-500 flex items-center justify-center">
                            <TrendingUp className="w-3.5 h-3.5" />
                          </div>
                        </div>
                        <div className={`text-2xl sm:text-3xl font-black ${textMain}`}>
                          {activeDashboardData?.stats?.adoption_rate || 0}%
                        </div>
                        <div className="w-full h-1 bg-slate-500/10 rounded-full mt-2 overflow-hidden">
                          <div 
                            className="h-full bg-yellow-500 rounded-full" 
                            style={{ width: `${Math.min(activeDashboardData?.stats?.adoption_rate || 0, 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* 1.1 M365 SPECIFIC INFO CARDS */}
                    {isM365 && (
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-1">
                        {/* Email Exchange */}
                        <div className={cardClass}>
                          <div className="flex items-center justify-between mb-3">
                            <span className={`text-[10px] font-bold uppercase tracking-wider ${textMuted}`}>Total Email Exchange</span>
                            <div className="w-7 h-7 rounded-lg bg-cyan-500/10 text-cyan-500 flex items-center justify-center">
                              <Mail className="w-3.5 h-3.5" />
                            </div>
                          </div>
                          <div className="flex items-baseline gap-2">
                            <span className={`text-2xl sm:text-3xl font-black ${textMain}`}>
                              {activeDashboardData?.stats?.total_email || 0}
                            </span>
                            <span className="text-[11px] font-bold text-cyan-500 bg-cyan-500/10 px-1.5 py-0.5 rounded">
                              {(( (activeDashboardData?.stats?.total_email || 0) / 68 ) * 100).toFixed(1)}%
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400 mt-1">
                            Pengguna aktif email (dari 68 target)
                          </p>
                        </div>

                        {/* OneDrive */}
                        <div className={cardClass}>
                          <div className="flex items-center justify-between mb-3">
                            <span className={`text-[10px] font-bold uppercase tracking-wider ${textMuted}`}>Total OneDrive</span>
                            <div className="w-7 h-7 rounded-lg bg-sky-500/10 text-sky-500 flex items-center justify-center">
                              <HardDrive className="w-3.5 h-3.5" />
                            </div>
                          </div>
                          <div className="flex items-baseline gap-2">
                            <span className={`text-2xl sm:text-3xl font-black ${textMain}`}>
                              {activeDashboardData?.stats?.total_onedrive || 0}
                            </span>
                            <span className="text-[11px] font-bold text-sky-500 bg-sky-500/10 px-1.5 py-0.5 rounded">
                              {(( (activeDashboardData?.stats?.total_onedrive || 0) / 68 ) * 100).toFixed(1)}%
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400 mt-1">
                            Pengguna aktif drive (dari 68 target)
                          </p>
                        </div>

                        {/* Teams */}
                        <div className={cardClass}>
                          <div className="flex items-center justify-between mb-3">
                            <span className={`text-[10px] font-bold uppercase tracking-wider ${textMuted}`}>Total Teams</span>
                            <div className="w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
                              <MessageSquare className="w-3.5 h-3.5" />
                            </div>
                          </div>
                          <div className="flex items-baseline gap-2">
                            <span className={`text-2xl sm:text-3xl font-black ${textMain}`}>
                              {activeDashboardData?.stats?.total_teams || 0}
                            </span>
                            <span className="text-[11px] font-bold text-indigo-500 bg-indigo-500/10 px-1.5 py-0.5 rounded">
                              {(( (activeDashboardData?.stats?.total_teams || 0) / 68 ) * 100).toFixed(1)}%
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400 mt-1">
                            Pengguna aktif berkomunikasi (dari 68 target)
                          </p>
                        </div>

                        {/* Total Storage Used */}
                        <div className={cardClass}>
                          <div className="flex items-center justify-between mb-3">
                            <span className={`text-[10px] font-bold uppercase tracking-wider ${textMuted}`}>Total Storage User</span>
                            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                              <Database className="w-3.5 h-3.5" />
                            </div>
                          </div>
                          <div className={`text-lg sm:text-xl font-black ${textMain} truncate`} title={formatBytes(activeDashboardData?.stats?.total_storage || 0)}>
                            {formatBytes(activeDashboardData?.stats?.total_storage || 0)}
                          </div>
                          <p className="text-[10px] text-emerald-500 font-bold mt-2">
                            {Number(activeDashboardData?.stats?.total_storage || 0).toLocaleString()} Bytes
                          </p>
                        </div>
                      </div>
                    )}
                  </>
                )}
                  </motion.div>
                </AnimatePresence>

                {activeTab === 'timeline' ? (
                  /* --- TIMELINE TAB CONTENT --- */
                  <div className="space-y-4 animate-fadeIn">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <h3 className={`text-base font-black ${textMain}`}>Timeline Milestone Project</h3>
                        <p className={`text-xs ${textMuted}`}>Pantau dan kelola tahapan implementasi project secara berurutan</p>
                      </div>
                      <button
                        onClick={() => {
                          if (showTimelineForm) {
                            setShowTimelineForm(false);
                            setTimelineIdToEdit(null);
                            setTimelineTitle('');
                            setTimelineDesc('');
                            setTimelineDate('');
                            setTimelineStatus('pending');
                          } else {
                            setShowTimelineForm(true);
                          }
                        }}
                        className="px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all shadow-sm"
                      >
                        <Plus className="w-4 h-4" />
                        <span>{showTimelineForm ? 'Tutup Form' : 'Tambah Milestone'}</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                      {/* Left: Timeline List */}
                      <div className={`${showTimelineForm ? 'xl:col-span-2' : 'xl:col-span-3'} space-y-4`}>
                        <div className={`${cardClass} relative`}>
                          {timeline.length === 0 ? (
                            <div className="text-center py-12">
                              <Calendar className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                              <h4 className={`text-sm font-bold ${textMain} mb-1`}>Belum Ada Milestone</h4>
                              <p className={`text-xs ${textMuted} max-w-sm mx-auto mb-4`}>
                                Buat milestone awal (seperti Kickoff, Uji Coba, Go-Live) untuk melacak kemajuan implementasi project ini.
                              </p>
                              <button
                                onClick={() => setShowTimelineForm(true)}
                                className="px-3 py-1.5 bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400 text-xs font-bold rounded-lg hover:bg-purple-200 dark:hover:bg-purple-900 transition-all"
                              >
                                Buat Milestone Pertama
                              </button>
                            </div>
                          ) : (
                            <div className="relative pl-8 pr-2 py-2 space-y-6">
                              {/* Connector line */}
                              <div className="absolute left-4 top-3 bottom-3 w-0.5 bg-slate-200 dark:bg-slate-800" />

                              {timeline.map((item) => {
                                const isCompleted = item.status === 'completed';
                                const isOnProgress = item.status === 'on_progress';
                                const formatDateStr = (dateStr: string) => {
                                  if (!dateStr) return '';
                                  try {
                                    const d = new Date(dateStr);
                                    if (isNaN(d.getTime())) return dateStr;
                                    return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
                                  } catch (e) {
                                    return dateStr;
                                  }
                                };

                                return (
                                  <div key={item.id} className="relative group">
                                    {/* Indicator Dot */}
                                    <div className={`absolute -left-8 top-1.5 w-8 h-8 rounded-full flex items-center justify-center transition-all z-10 border-2 ${
                                      isCompleted 
                                        ? 'bg-emerald-500 border-emerald-500 text-white' 
                                        : isOnProgress 
                                        ? 'bg-blue-500 border-blue-500 text-white animate-pulse' 
                                        : 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-500'
                                    }`}>
                                      {isCompleted ? (
                                        <CheckCircle className="w-4 h-4" />
                                      ) : isOnProgress ? (
                                        <RefreshCcw className="w-4 h-4 animate-spin" />
                                      ) : (
                                        <Clock className="w-4 h-4" />
                                      )}
                                    </div>

                                    {/* Content Card */}
                                    <div className={`p-4 rounded-2xl border transition-all ${
                                      isDark 
                                        ? 'bg-[#151922] hover:bg-[#191d29] border-slate-800/80 group-hover:border-slate-700' 
                                        : 'bg-slate-50 hover:bg-slate-100 border-slate-200 group-hover:border-slate-300'
                                    }`}>
                                      <div className="flex flex-wrap items-start justify-between gap-2">
                                        <div className="space-y-1 min-w-0 flex-1">
                                          <div className="flex flex-wrap items-center gap-2">
                                            <h4 className={`text-sm font-black truncate ${textMain}`}>{item.title}</h4>
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                              isCompleted 
                                                ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' 
                                                : isOnProgress 
                                                ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20' 
                                                : 'bg-slate-500/10 text-slate-500 border border-slate-500/20'
                                            }`}>
                                              {isCompleted ? 'Selesai' : isOnProgress ? 'Dalam Proses' : 'Tertunda'}
                                            </span>
                                          </div>
                                          {item.description && (
                                            <p className={`text-xs ${textMuted} whitespace-pre-line leading-relaxed`}>
                                              {item.description}
                                            </p>
                                          )}
                                          <div className="flex items-center gap-1.5 text-[10px] text-slate-400 pt-1">
                                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                            <span>Target: {formatDateStr(item.target_date)}</span>
                                          </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                                          {!isCompleted && (
                                            <button
                                              onClick={async () => {
                                                try {
                                                  await api.updateEvalProjectTimeline(selectedProjectId!, item.id, {
                                                    ...item,
                                                    status: isOnProgress ? 'completed' : 'on_progress'
                                                  });
                                                  toast.success(isOnProgress ? 'Milestone selesai!' : 'Milestone mulai dikerjakan');
                                                  fetchTimeline(selectedProjectId!);
                                                } catch (err) {
                                                  console.error(err);
                                                  toast.error('Gagal memperbarui status');
                                                }
                                              }}
                                              className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-500 hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-all"
                                              title={isOnProgress ? "Tandai Selesai" : "Mulai Kerjakan"}
                                            >
                                              <CheckCircle className="w-3.5 h-3.5" />
                                            </button>
                                          )}
                                          <button
                                            onClick={() => handleEditTimelineClick(item)}
                                            className="p-1.5 rounded-lg text-slate-500 hover:text-blue-500 hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-all"
                                            title="Edit Milestone"
                                          >
                                            <Pencil className="w-3.5 h-3.5" />
                                          </button>
                                          <button
                                            onClick={() => handleDeleteTimelineClick(item.id)}
                                            className="p-1.5 rounded-lg text-slate-500 hover:text-red-500 hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-all"
                                            title="Hapus Milestone"
                                          >
                                            <Trash2 className="w-3.5 h-3.5" />
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right: Add/Edit Form */}
                      {showTimelineForm && (
                        <div className={`${cardClass} h-fit space-y-4 border border-purple-500/15 bg-gradient-to-b ${isDark ? 'from-[#191e2b] to-[#121621]' : 'from-purple-50/10 to-transparent'}`}>
                          <div>
                            <h3 className={`text-xs font-black uppercase tracking-wider ${textMain}`}>
                              {timelineIdToEdit !== null ? '📝 Edit Milestone' : '🚀 Milestone Baru'}
                            </h3>
                            <p className="text-[10px] text-slate-400 mt-0.5">
                              {timelineIdToEdit !== null ? 'Perbarui informasi milestone terpilih' : 'Tambahkan tahapan evaluasi baru'}
                            </p>
                          </div>

                          <form onSubmit={handleSaveTimelineItem} className="space-y-3.5">
                            <div className="space-y-1">
                              <label className={`text-[10px] font-bold uppercase tracking-wider ${textMuted}`}>Judul Milestone</label>
                              <input
                                type="text"
                                placeholder="Contoh: Kickoff, Pelatihan, Go-Live"
                                value={timelineTitle}
                                onChange={(e) => setTimelineTitle(e.target.value)}
                                className={`w-full text-xs p-2.5 rounded-xl border outline-none transition-all ${
                                  isDark ? 'bg-slate-900 border-slate-800 text-white focus:border-purple-500' : 'bg-white border-slate-200 text-slate-800 focus:border-purple-500'
                                }`}
                                required
                              />
                            </div>

                            <div className="space-y-1">
                              <label className={`text-[10px] font-bold uppercase tracking-wider ${textMuted}`}>Deskripsi Kegiatan</label>
                              <textarea
                                placeholder="Detail kegiatan atau kriteria selesai..."
                                rows={3}
                                value={timelineDesc}
                                onChange={(e) => setTimelineDesc(e.target.value)}
                                className={`w-full text-xs p-2.5 rounded-xl border outline-none transition-all ${
                                  isDark ? 'bg-slate-900 border-slate-800 text-white focus:border-purple-500' : 'bg-white border-slate-200 text-slate-800 focus:border-purple-500'
                                }`}
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-1">
                                <label className={`text-[10px] font-bold uppercase tracking-wider ${textMuted}`}>Tanggal Target</label>
                                <input
                                  type="date"
                                  value={timelineDate}
                                  onChange={(e) => setTimelineDate(e.target.value)}
                                  className={`w-full text-xs p-2.5 rounded-xl border outline-none transition-all ${
                                    isDark ? 'bg-slate-900 border-slate-800 text-white focus:border-purple-500' : 'bg-white border-slate-200 text-slate-800 focus:border-purple-500'
                                  }`}
                                  required
                                />
                              </div>

                              <div className="space-y-1">
                                <label className={`text-[10px] font-bold uppercase tracking-wider ${textMuted}`}>Status Saat Ini</label>
                                <select
                                  value={timelineStatus}
                                  onChange={(e) => setTimelineStatus(e.target.value)}
                                  className={`w-full text-xs p-2.5 rounded-xl border outline-none transition-all ${
                                    isDark ? 'bg-slate-900 border-slate-800 text-white focus:border-purple-500' : 'bg-white border-slate-200 text-slate-800 focus:border-purple-500'
                                  }`}
                                >
                                  <option value="pending">Tertunda (Pending)</option>
                                  <option value="on_progress">Dalam Proses (On Progress)</option>
                                  <option value="completed">Selesai (Completed)</option>
                                </select>
                              </div>
                            </div>

                            <div className="flex gap-2 pt-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setShowTimelineForm(false);
                                  setTimelineIdToEdit(null);
                                  setTimelineTitle('');
                                  setTimelineDesc('');
                                  setTimelineDate('');
                                  setTimelineStatus('pending');
                                }}
                                className={`flex-1 py-2 text-xs font-bold rounded-xl border transition-all ${
                                  isDark ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-white' : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                                }`}
                              >
                                Batal
                              </button>
                              <button
                                type="submit"
                                className="flex-1 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-purple-500/10"
                              >
                                {timelineIdToEdit !== null ? 'Perbarui' : 'Simpan'}
                              </button>
                            </div>
                          </form>
                        </div>
                      )}
                    </div>
                  </div>
                ) : dashboardData?.stats?.total_records === 0 && activeTab === 'dashboard' ? (
                  /* EMPTY DATA STATE ON DASHBOARD */
                  <div className={`flex flex-col items-center justify-center text-center py-16 border border-dashed rounded-[2rem] ${isDark ? 'border-slate-800 bg-[#161a23]' : 'border-slate-200 bg-slate-50/50'}`}>
                    <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mb-4 border border-amber-500/20">
                      <AlertTriangle className="w-6 h-6" />
                    </div>
                    <h3 className={`text-sm font-bold ${textMain} mb-1`}>Belum Ada Data Terimport</h3>
                    <p className={`text-xs ${textMuted} max-w-md mb-6`}>
                      Grafik analisa akan otomatis muncul setelah Anda memasukkan file log atau data mentah penggunaan aplikasi di tab "Kelola Data Raw".
                    </p>
                    <div className="flex flex-wrap gap-2.5 justify-center">
                      <button
                        onClick={() => {
                          setActiveTab('data');
                        }}
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl transition-all"
                      >
                        Buka Import Data
                      </button>
                      <button
                        onClick={() => loadExampleData(dashboardData?.project?.name?.toLowerCase()?.includes('whatsapp') ? 'whatsapp' : 'm365')}
                        className={`px-4 py-2 border text-xs font-bold rounded-xl flex items-center gap-1 transition-all ${
                          isDark ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-white' : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                        }`}
                      >
                        <Sparkles className="w-3.5 h-3.5 text-yellow-500" />
                        <span>Gunakan Data Simulasi</span>
                      </button>
                    </div>
                  </div>
                ) : activeTab === 'dashboard' ? (
                  /* --- DASHBOARD TAB CONTENT --- */
                  <div className="space-y-4">
                    
                    {isM365 && (uniqueMonths.length > 0 || uniqueDepartments.length > 0) && (
                      <div className={`p-4 rounded-[1.5rem] border flex flex-col md:flex-row md:items-center justify-between gap-4 animate-in slide-in-from-top-2 duration-300 ${
                        isDark ? 'bg-[#151922] border-slate-800' : 'bg-slate-50 border-slate-200'
                      }`}>
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-500 border border-purple-500/20">
                            <Filter className="w-4 h-4" />
                          </div>
                          <div>
                            <h4 className={`text-xs font-black uppercase tracking-wider ${textMain}`}>Saring Data Analisa (Microsoft 365)</h4>
                            <p className="text-[10px] text-slate-400">Saring metrik, data card, dan grafik secara dinamis</p>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                          {/* Month Filter */}
                          {uniqueMonths.length > 0 && (
                            <div className="flex items-center gap-2">
                              <span className={`text-[11px] font-bold ${textMuted}`}>Bulan:</span>
                              <select
                                value={selectedMonth}
                                onChange={(e) => {
                                  setSelectedMonth(e.target.value);
                                  setCurrentPage(1);
                                }}
                                className={`text-xs px-3 py-1.5 rounded-xl border outline-none font-bold transition-all min-w-[150px] cursor-pointer ${
                                  isDark 
                                    ? 'bg-slate-900 border-slate-800 text-white focus:border-purple-500' 
                                    : 'bg-white border-slate-200 text-slate-800 focus:border-purple-500'
                                }`}
                              >
                                <option value="all">Semua Periode ({dashboardData?.m365Records?.length || 0} Anggota)</option>
                                {uniqueMonths.map((month: string) => {
                                  const count = dashboardData.m365Records.filter((r: any) => r.periode_bulan === month).length;
                                  return (
                                    <option key={month} value={month}>
                                      {month} ({count} Anggota)
                                    </option>
                                  );
                                })}
                              </select>
                            </div>
                          )}

                          {/* Department Filter */}
                          {uniqueDepartments.length > 0 && (
                            <div className="flex items-center gap-2">
                              <span className={`text-[11px] font-bold ${textMuted}`}>Bagian/Divisi:</span>
                              <select
                                value={selectedDepartment}
                                onChange={(e) => {
                                  setSelectedDepartment(e.target.value);
                                  setSelectedMember('all'); // reset member filter if dept changes
                                  setCurrentPage(1);
                                }}
                                className={`text-xs px-3 py-1.5 rounded-xl border outline-none font-bold transition-all min-w-[150px] cursor-pointer max-w-[200px] ${
                                  isDark 
                                    ? 'bg-slate-900 border-slate-800 text-white focus:border-purple-500' 
                                    : 'bg-white border-slate-200 text-slate-800 focus:border-purple-500'
                                }`}
                              >
                                <option value="all">Semua Bagian ({dashboardData?.m365Records?.length || 0} Anggota)</option>
                                {uniqueDepartments.map((dept: string) => {
                                  const count = dashboardData.m365Records.filter((r: any) => r.department === dept).length;
                                  return (
                                    <option key={dept} value={dept}>
                                      {dept} ({count} Anggota)
                                    </option>
                                  );
                                })}
                              </select>
                            </div>
                          )}

                          {/* Member Filter */}
                          {uniqueMembers.length > 0 && (
                            <div className="flex items-center gap-2">
                              <span className={`text-[11px] font-bold ${textMuted}`}>Anggota:</span>
                              <select
                                value={selectedMember}
                                onChange={(e) => {
                                  setSelectedMember(e.target.value);
                                  setCurrentPage(1);
                                }}
                                className={`text-xs px-3 py-1.5 rounded-xl border outline-none font-bold transition-all min-w-[150px] cursor-pointer max-w-[200px] ${
                                  isDark 
                                    ? 'bg-slate-900 border-slate-800 text-white focus:border-purple-500' 
                                    : 'bg-white border-slate-200 text-slate-800 focus:border-purple-500'
                                }`}
                              >
                                <option value="all">Semua Anggota ({uniqueMembers.length} Pilihan)</option>
                                {uniqueMembers.map((member: string) => (
                                  <option key={member} value={member}>
                                    {member}
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}

                          {/* Reset button if any filtered */}
                          {(selectedMonth !== 'all' || selectedDepartment !== 'all' || selectedMember !== 'all') && (
                            <button
                              onClick={() => {
                                setSelectedMonth('all');
                                setSelectedDepartment('all');
                                setSelectedMember('all');
                                setCurrentPage(1);
                              }}
                              className="px-3.5 py-1.5 text-xs font-bold bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white border border-red-500/20 rounded-xl transition-all flex items-center gap-1"
                              title="Reset saringan"
                            >
                              <FilterX className="w-3.5 h-3.5" />
                              <span>Reset</span>
                            </button>
                          )}
                        </div>
                      </div>
                    )}

                    <AnimatePresence mode="wait">
                      <motion.div
                        key={`dashboard-charts-${selectedMonth}-${selectedDepartment}-${selectedMember}`}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -15 }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                        className="space-y-4"
                      >
                        {/* CHART ROW 1: Area Trend & Department Bar Chart */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                      
                      {/* Trend over time Area Chart OR M365 Feature Adoption Horizontal Bar Chart */}
                      <div className={`${cardClass} lg:col-span-2 flex flex-col justify-between h-[360px]`}>
                        {isM365 ? (
                          <>
                            <div className="flex items-center justify-between mb-4">
                              <div>
                                <h3 className={`text-xs font-black uppercase tracking-wider ${textMuted}`}>Adopsi & Penggunaan Fitur M365</h3>
                                <span className="text-[10px] text-slate-400">Total anggota aktif yang menggunakan tiap fitur M365</span>
                              </div>
                              <div className="flex items-center gap-1 bg-purple-500/10 text-purple-500 px-2 py-1 rounded-lg border border-purple-500/20 text-[10px] font-bold">
                                <BarChart2 className="w-3.5 h-3.5" />
                                <span>Grafik Batang Horizontal</span>
                              </div>
                            </div>
                            <div className="flex-1 min-h-0 w-full">
                              <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                  layout="vertical"
                                  data={activeDashboardData?.activityDistribution || []}
                                  margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
                                >
                                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={isDark ? '#334155/30' : '#e2e8f0'} />
                                  <XAxis
                                    type="number"
                                    tick={{ fontSize: 9, fill: isDark ? '#94a3b8' : '#64748b' }}
                                    axisLine={false}
                                    tickLine={false}
                                  />
                                  <YAxis
                                    type="category"
                                    dataKey="type"
                                    tick={{ fontSize: 9, fill: isDark ? '#94a3b8' : '#64748b', fontWeight: 'bold' }}
                                    axisLine={false}
                                    tickLine={false}
                                    width={120}
                                  />
                                  <Tooltip
                                    contentStyle={{
                                      backgroundColor: isDark ? '#1e293b' : '#ffffff',
                                      borderColor: isDark ? '#475569' : '#e2e8f0',
                                      borderRadius: '0.75rem',
                                      fontSize: '11px',
                                      color: isDark ? '#fff' : '#000'
                                    }}
                                  />
                                  <Bar 
                                    dataKey="count" 
                                    name="Jumlah Anggota Aktif" 
                                    fill="#8b5cf6" 
                                    radius={[0, 4, 4, 0]}
                                    barSize={20}
                                  >
                                    {(activeDashboardData?.activityDistribution || []).map((entry: any, index: number) => (
                                      <Cell 
                                        key={`cell-${index}`} 
                                        fill={COLORS_PALETTE[index % COLORS_PALETTE.length]} 
                                      />
                                    ))}
                                  </Bar>
                                </BarChart>
                              </ResponsiveContainer>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="flex items-center justify-between mb-4">
                              <div>
                                <h3 className={`text-xs font-black uppercase tracking-wider ${textMuted}`}>Tren Aktivitas Harian</h3>
                                <span className="text-[10px] text-slate-400">Log pemakaian dari tanggal ke tanggal</span>
                              </div>
                            </div>
                            <div className="flex-1 min-h-0 w-full">
                              <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={activeDashboardData?.trend || []}>
                                  <defs>
                                    <linearGradient id="colorUsage" x1="0" y1="0" x2="0" y2="1">
                                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                                    </linearGradient>
                                  </defs>
                                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#334155/30' : '#e2e8f0'} />
                                  <XAxis 
                                    dataKey="date" 
                                    tick={{ fontSize: 9, fill: isDark ? '#94a3b8' : '#64748b' }}
                                    axisLine={false}
                                    tickLine={false}
                                    tickFormatter={(val) => {
                                      if (!val) return '';
                                      const parts = val.split('-');
                                      return parts.length === 3 ? `${parts[2]}/${parts[1]}` : val;
                                    }}
                                  />
                                  <YAxis 
                                    tick={{ fontSize: 10, fill: isDark ? '#94a3b8' : '#64748b' }}
                                    axisLine={false}
                                    tickLine={false}
                                  />
                                  <Tooltip 
                                    contentStyle={{ 
                                      backgroundColor: isDark ? '#1e293b' : '#ffffff', 
                                      borderColor: isDark ? '#475569' : '#e2e8f0',
                                      borderRadius: '0.75rem',
                                      fontSize: '11px',
                                      color: isDark ? '#fff' : '#000'
                                    }}
                                    labelFormatter={(label) => `Tanggal: ${label}`}
                                  />
                                  <Area type="monotone" dataKey="count" name="Total Aktivitas" stroke="#8b5cf6" strokeWidth={2.5} fillOpacity={1} fill="url(#colorUsage)" />
                                </AreaChart>
                              </ResponsiveContainer>
                            </div>
                          </>
                        )}
                      </div>

                      {/* Top Activity Types Pie Chart */}
                      <div className={`${cardClass} flex flex-col justify-between h-[360px]`}>
                        <div>
                          <h3 className={`text-xs font-black uppercase tracking-wider ${textMuted}`}>Jenis Aktivitas Populer</h3>
                          <span className="text-[10px] text-slate-400">Tipe event atau interaksi terbanyak</span>
                        </div>
                        <div className="flex-1 min-h-0 w-full relative flex items-center justify-center">
                          <ResponsiveContainer width="100%" height="80%">
                            <PieChart>
                              <Pie
                                data={activeDashboardData?.activityDistribution || []}
                                cx="50%"
                                cy="50%"
                                innerRadius={50}
                                outerRadius={75}
                                paddingAngle={2}
                                dataKey="count"
                                nameKey="type"
                              >
                                {(activeDashboardData?.activityDistribution || []).map((entry: any, index: number) => (
                                  <Cell key={`cell-${index}`} fill={COLORS_PALETTE[index % COLORS_PALETTE.length]} />
                                ))}
                              </Pie>
                              <Tooltip 
                                contentStyle={{ 
                                  backgroundColor: isDark ? '#1e293b' : '#ffffff', 
                                  borderColor: isDark ? '#475569' : '#e2e8f0',
                                  borderRadius: '0.75rem',
                                  fontSize: '11px'
                                }}
                              />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                        <div className="max-h-[100px] overflow-y-auto space-y-1 px-1">
                          {(activeDashboardData?.activityDistribution || []).slice(0, 4).map((entry: any, index: number) => (
                            <div key={entry.type} className="flex items-center justify-between text-[11px]">
                              <div className="flex items-center gap-1.5 truncate">
                                <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: COLORS_PALETTE[index % COLORS_PALETTE.length] }} />
                                <span className={`truncate font-bold ${textMain}`}>{entry.type}</span>
                              </div>
                              <span className={textMuted}>{entry.count} ({Math.round(entry.count / (activeDashboardData?.stats?.total_usage || 1) * 100)}%)</span>
                            </div>
                          ))}
                        </div>
                      </div>

                    </div>

                    {/* CHART ROW 2: Department Stats & Leaderboards */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      
                      {/* Department Bar Chart */}
                      <div className={`${cardClass} h-[380px] flex flex-col justify-between`}>
                        <div>
                          <h3 className={`text-xs font-black uppercase tracking-wider ${textMuted}`}>Penggunaan per Departemen / Divisi</h3>
                          <span className="text-[10px] text-slate-400">Akumulasi total hit pemakaian oleh tiap tim</span>
                        </div>
                        <div className="flex-1 min-h-0 w-full mt-2">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={activeDashboardData?.departmentDistribution || []}>
                              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={isDark ? '#334155/30' : '#e2e8f0'} />
                              <XAxis 
                                dataKey="department" 
                                tick={{ fontSize: 9, fill: isDark ? '#94a3b8' : '#64748b' }}
                                axisLine={false}
                                tickLine={false}
                              />
                              <YAxis 
                                tick={{ fontSize: 10, fill: isDark ? '#94a3b8' : '#64748b' }}
                                axisLine={false}
                                tickLine={false}
                              />
                              <Tooltip 
                                contentStyle={{ 
                                  backgroundColor: isDark ? '#1e293b' : '#ffffff', 
                                  borderColor: isDark ? '#475569' : '#e2e8f0',
                                  borderRadius: '0.75rem',
                                  fontSize: '11px'
                                }}
                              />
                              <Bar dataKey="count" name="Jumlah Hit" fill="#10b981" radius={[4, 4, 0, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>

                      {/* Top 10 Active Users Board */}
                      <div className={`${cardClass} h-[380px] flex flex-col justify-between`}>
                        <div>
                          <h3 className={`text-xs font-black uppercase tracking-wider ${textMuted}`}>Top 10 Pengguna Paling Aktif</h3>
                          <span className="text-[10px] text-slate-400">User dengan total log aktivitas terbanyak</span>
                        </div>
                        <div className="flex-1 overflow-y-auto mt-4 pr-1 space-y-2">
                          {(activeDashboardData?.topUsers || []).slice(0, 10).map((user: any, index: number) => (
                            <div 
                              key={`${user.user_name}-${index}`}
                              className={`flex items-center justify-between p-2.5 rounded-xl border ${
                                isDark ? 'bg-[#151922] border-slate-800' : 'bg-slate-50 border-slate-100'
                              }`}
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <div className={`w-8 h-8 rounded-lg shrink-0 flex items-center justify-center font-black text-xs ${
                                  index === 0 ? 'bg-yellow-500/10 text-yellow-500' :
                                  index === 1 ? 'bg-slate-400/10 text-slate-400' :
                                  index === 2 ? 'bg-amber-700/10 text-amber-700' :
                                  'bg-purple-500/10 text-purple-500'
                                }`}>
                                  #{index + 1}
                                </div>
                                <div className="min-w-0">
                                  <h4 className={`text-xs font-bold truncate ${textMain}`}>{user.user_name}</h4>
                                  <span className="text-[10px] text-slate-400">{user.department}</span>
                                </div>
                              </div>
                              <div className="text-right shrink-0">
                                <span className="text-xs font-mono font-black text-purple-500 bg-purple-500/5 px-2 py-1 rounded-lg border border-purple-500/10">
                                  {user.count} {isM365 ? 'Fitur' : 'Hit'}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                    </div>
                      </motion.div>
                    </AnimatePresence>

                  </div>
                ) : (
                  /* --- CLOUD DATA MANAGEMENT TAB CONTENT --- */
                  <div className="space-y-4">
                    
                    {/* Log upload form & paste */}
                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                      
                      <div className={`${cardClass} xl:col-span-2 space-y-4`}>
                        {dashboardData?.project?.name?.toLowerCase().includes('m365') ? (
                          <>
                            <div className="flex items-center justify-between">
                              <div>
                                <h3 className={`text-sm font-black ${textMain}`}>Import Excel Evaluasi Microsoft 365</h3>
                                <p className={`text-xs ${textMuted}`}>Unggah file Excel format .xlsx atau .xls untuk memperbarui data keanggotaan dan adopsi M365.</p>
                              </div>
                            </div>

                            {/* File selector drag/drop for M365 */}
                            <div className={`relative border-2 border-dashed rounded-2xl p-8 text-center ${
                              isDark ? 'border-slate-800 bg-slate-900/30 hover:border-purple-500/40' : 'border-slate-200 bg-slate-50 hover:border-purple-500/40'
                            } transition-colors`}>
                              <input 
                                type="file" 
                                accept=".xlsx,.xls"
                                onChange={handleImportExcel}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                              />
                              <CloudUpload className="w-10 h-10 text-purple-500 mx-auto mb-3" />
                              <h4 className={`text-sm font-bold ${textMain} mb-1`}>Pilih File Excel / Drag & Drop</h4>
                              <p className="text-xs text-slate-400 max-w-md mx-auto">Format didukung: File hasil download template M365 dengan 14 kolom lengkap</p>
                            </div>
                          </>
                        ) : isWhatsapp ? (
                          <div className={`p-8 text-center ${cardClass}`}>
                            <p className={`text-sm ${textMuted}`}>Fitur import data tidak tersedia untuk project ini.</p>
                          </div>
                        ) : (
                          <>
                            <div>
                              <h3 className={`text-sm font-black ${textMain}`}>Import Data Excel</h3>
                              <p className={`text-xs ${textMuted}`}>Pilih file Excel untuk diimport.</p>
                            </div>

                            {/* File selector drag/drop */}
                            <div className={`relative border-2 border-dashed rounded-2xl p-6 text-center ${
                              isDark ? 'border-slate-800 bg-slate-900/30 hover:border-purple-500/40' : 'border-slate-200 bg-slate-50 hover:border-purple-500/40'
                            } transition-colors`}>
                              <input 
                                type="file" 
                                accept=".xlsx,.xls"
                                onChange={handleFileUpload}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                              />
                              <CloudUpload className="w-8 h-8 text-purple-500 mx-auto mb-2" />
                              <h4 className={`text-xs font-bold ${textMain} mb-0.5`}>Pilih File Excel</h4>
                              <p className="text-[10px] text-slate-400">Format kolom: Nama Pengguna, Departemen, Tanggal (YYYY-MM-DD), Tipe Aktivitas, Jumlah</p>
                            </div>

                            {/* Paste area */}
                            <div className="space-y-1.5">
                              <label className={`text-[10px] font-bold uppercase tracking-wider ${textMuted}`}>Atau Paste Data Teks di Sini</label>
                              <textarea
                                value={pasteData}
                                onChange={(e) => setPasteData(e.target.value)}
                                placeholder="Contoh format:&#10;Yudha Pregita, IT Support, 2026-07-05, Kirim Pesan, 10&#10;Budi Santoso, Keuangan, 2026-07-04, Unduh Laporan, 2"
                                className={`w-full h-36 p-3 rounded-2xl font-mono text-xs border focus:ring-2 focus:outline-none transition-all ${
                                  isDark ? 'bg-slate-900 border-slate-800 text-white focus:ring-purple-500/50' : 'bg-slate-50 border-slate-200 text-slate-900 focus:ring-purple-500/20'
                                }`}
                              />
                            </div>

                            {/* Action buttons */}
                            <div className="flex gap-2 justify-end">
                              <button
                                onClick={handleImportRawText}
                                disabled={isImporting || !pasteData.trim()}
                                className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white disabled:opacity-50 text-xs font-bold rounded-xl flex items-center gap-1.5 active:scale-95 transition-all shadow-md shadow-purple-500/10"
                              >
                                {isImporting ? <RefreshCcw className="w-3.5 h-3.5 animate-spin" /> : <Database className="w-3.5 h-3.5" />}
                                <span>Import Sekarang</span>
                              </button>
                            </div>
                          </>
                        )}
                      </div>

                      {/* Templates & Guidelines Column */}
                      <div className={`${cardClass} space-y-4`}>
                        <div>
                          <h3 className={`text-sm font-black ${textMain}`}>Unduh Template & Export</h3>
                          <p className={`text-xs ${textMuted}`}>Gunakan tombol di bawah untuk mengelola data format Excel secara efisien.</p>
                        </div>

                        <div className="space-y-2">
                          {dashboardData?.project?.name?.toLowerCase().includes('m365') ? (
                            <>
                              <button
                                onClick={handleDownloadTemplate}
                                className={`w-full p-3 border rounded-xl flex items-center gap-3 transition-all text-left ${
                                  isDark ? 'bg-[#151922] border-slate-800 hover:bg-slate-800 text-slate-200' : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700'
                                }`}
                              >
                                <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center font-bold">
                                  <FileSpreadsheet className="w-4 h-4" />
                                </div>
                                <div>
                                  <h4 className="text-xs font-black">Download Template Excel</h4>
                                  <p className="text-[10px] text-slate-400">Unduh format template</p>
                                </div>
                              </button>

                              <button
                                onClick={handleExportDataExcel}
                                disabled={!dashboardData?.m365Records || dashboardData.m365Records.length === 0}
                                className={`w-full p-3 border rounded-xl flex items-center gap-3 transition-all text-left disabled:opacity-50 ${
                                  isDark ? 'bg-[#151922] border-slate-800 hover:bg-slate-800 text-slate-200' : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700'
                                }`}
                              >
                                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold">
                                  <FileSpreadsheet className="w-4 h-4" />
                                </div>
                                <div>
                                  <h4 className="text-xs font-black">Export ke Excel (XLSX)</h4>
                                  <p className="text-[10px] text-slate-400">Unduh seluruh data terimport</p>
                                </div>
                              </button>

                              <button
                                onClick={() => loadExampleData('m365')}
                                disabled={isImporting}
                                className={`w-full p-3 border rounded-xl flex items-center gap-3 transition-all text-left ${
                                  isDark ? 'bg-[#151922] border-slate-800 hover:bg-slate-800 text-slate-200' : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700'
                                }`}
                              >
                                <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-500 flex items-center justify-center font-bold">⚡</div>
                                <div>
                                  <h4 className="text-xs font-black">Generate Data M365</h4>
                                  <p className="text-[10px] text-slate-400">Simulasi instan data Microsoft 365</p>
                                </div>
                              </button>
                            </>
                          ) : !isWhatsapp && (
                            <>
                              <button
                                onClick={() => loadExampleData('m365')}
                                disabled={isImporting}
                                className={`w-full p-3 border rounded-xl flex items-center gap-3 transition-all text-left ${
                                  isDark ? 'bg-[#151922] border-slate-800 hover:bg-slate-800 text-slate-200' : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700'
                                }`}
                              >
                                <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center font-bold">M</div>
                                <div>
                                  <h4 className="text-xs font-black">Data Contoh Microsoft 365</h4>
                                  <p className="text-[10px] text-slate-400">Log Outlook, Teams, Word, Excel, dll.</p>
                                </div>
                              </button>

                              <button
                                onClick={() => loadExampleData('whatsapp')}
                                disabled={isImporting}
                                className={`w-full p-3 border rounded-xl flex items-center gap-3 transition-all text-left ${
                                  isDark ? 'bg-[#151922] border-slate-800 hover:bg-slate-800 text-slate-200' : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700'
                                }`}
                              >
                                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold">W</div>
                                <div>
                                  <h4 className="text-xs font-black">Data Contoh Whatsapp Omni</h4>
                                  <p className="text-[10px] text-slate-400">Broadcast, chat pelanggan, resolusi tiket agent</p>
                                </div>
                              </button>
                            </>
                          )}
                        </div>

                        {!dashboardData?.project?.name?.toLowerCase().includes('m365') && (
                          <div className={`p-4 rounded-2xl text-[11px] leading-relaxed border ${
                            isDark ? 'bg-slate-900/40 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'
                          }`}>
                            <div className="flex items-center gap-1.5 font-bold mb-1.5 text-purple-500">
                              <Info className="w-3.5 h-3.5" />
                              <span>Format Kolom CSV/Salinan:</span>
                            </div>
                            <p className="font-bold">Baris Kolom tanpa header:</p>
                            <code className="block font-mono bg-black/10 dark:bg-black/40 p-1.5 rounded my-1 text-[10px]">
                              [User], [Departemen], [Tanggal YYYY-MM-DD], [Tipe Aktivitas], [Jumlah]
                            </code>
                            <p className="text-[10px] text-slate-400 italic">Contoh: Budi, Keuangan, 2026-07-01, Kirim Email, 5</p>
                          </div>
                        )}

                        <button
                          onClick={handleClearData}
                          disabled={dashboardData?.project?.name?.toLowerCase().includes('m365') ? (!dashboardData?.m365Records || dashboardData.m365Records.length === 0) : (dashboardData?.stats?.total_records === 0)}
                          className="w-full py-2.5 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/20 text-xs font-bold rounded-xl transition-all"
                        >
                          Kosongkan Seluruh Data Project
                        </button>
                      </div>

                    </div>

                    {/* Detailed Data List Table */}
                    {((dashboardData?.project?.name?.toLowerCase().includes('m365') && dashboardData?.m365Records && dashboardData.m365Records.length > 0) || 
                      (!dashboardData?.project?.name?.toLowerCase().includes('m365') && dashboardData?.stats?.total_records > 0)) && (
                      <AnimatePresence mode="wait">
                        <motion.div
                          key={`detailed-table-${selectedMonth}-${selectedDepartment}-${selectedMember}-${currentPage}-${searchQuery}`}
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -12 }}
                          transition={{ duration: 0.25, ease: 'easeInOut' }}
                          className={cardClass}
                        >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                          <div>
                            <h3 className={`text-sm font-black ${textMain}`}>
                              {dashboardData?.project?.name?.toLowerCase().includes('m365') ? 'Daftar Detail Unggahan Microsoft 365' : 'Ringkasan Penggunaan per User'}
                            </h3>
                            <p className="text-[10px] text-slate-400">
                              {dashboardData?.project?.name?.toLowerCase().includes('m365') 
                                ? 'Seluruh baris data keanggotaan dan pemakaian fitur M365 terdaftar'
                                : 'Total interaksi tiap anggota di database project ini'}
                            </p>
                          </div>
                          
                          <div className="flex flex-wrap items-center gap-2">
                            {hasActiveColumnFilters && (
                              <button
                                onClick={handleResetColumnFilters}
                                className="px-3.5 py-1.5 bg-red-500/10 hover:bg-red-500 hover:text-white border border-red-500/20 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5"
                                title="Reset semua filter kolom"
                              >
                                <FilterX className="w-3.5 h-3.5" />
                                <span>Reset Filter ({Object.values(columnFilters).filter(v => v !== 'all').length})</span>
                              </button>
                            )}

                            {/* Search bar */}
                            <div className="relative">
                              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                              <input
                                type="text"
                                placeholder="Cari UPN, nama, divisi..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className={`pl-9 pr-4 py-1.5 rounded-xl text-xs border focus:outline-none focus:ring-2 ${
                                  isDark ? 'bg-slate-950 border-slate-800 focus:ring-purple-500/50 text-white' : 'bg-slate-50 border-slate-200 focus:ring-purple-500/20'
                                }`}
                              />
                            </div>
                          </div>
                        </div>

                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs min-w-[1200px]">
                            {dashboardData?.project?.name?.toLowerCase().includes('m365') ? (
                              <>
                                <thead>
                                  <tr className={`border-b ${isDark ? 'border-slate-800 text-slate-400' : 'border-slate-100 text-slate-500'} font-bold`}>
                                    {renderHeaderWithFilter('Periode bulan', 'periode_bulan')}
                                    {renderHeaderWithFilter('User Principal Name', 'user_principal_name')}
                                    {renderHeaderWithFilter('Display Name', 'display_name')}
                                    {renderHeaderWithFilter('Department', 'department')}
                                    {renderHeaderWithFilter('Activet', 'activet', 'center')}
                                    {renderHeaderWithFilter('License M365', 'license_m365')}
                                    {renderHeaderWithFilter('Email Exchange', 'email_exchange', 'center')}
                                    {renderHeaderWithFilter('One drive', 'one_drive', 'center')}
                                    {renderHeaderWithFilter('Storage Used', 'storage_used', 'right')}
                                    {renderHeaderWithFilter('Teams', 'teams', 'center')}
                                    {renderHeaderWithFilter('Reason Teams', 'reason_teams')}
                                    {renderHeaderWithFilter('Outlook Mobile', 'outlook_for_mobile', 'center')}
                                    {renderHeaderWithFilter('Reason HP', 'reason_hp')}
                                    {renderHeaderWithFilter('Outlook Web', 'outlook_for_web', 'center')}
                                    {renderHeaderWithFilter('Reason web', 'reason_web')}
                                  </tr>
                                </thead>
                                <tbody>
                                  {filteredRawRecords
                                    .slice((currentPage - 1) * (dashboardData?.project?.name?.toLowerCase().includes('m365') ? 20 : 10), currentPage * (dashboardData?.project?.name?.toLowerCase().includes('m365') ? 20 : 10))
                                    .map((row: any, idx: number) => (
                                      <tr key={idx} className={`border-b ${isDark ? 'border-slate-800/50 hover:bg-slate-800/20' : 'border-slate-100 hover:bg-slate-50/50'} transition-colors`}>
                                        <td className={`py-3 px-3 font-medium ${textMain}`}>{row.periode_bulan}</td>
                                        <td className="py-3 px-3 text-slate-400 font-mono">{row.user_principal_name}</td>
                                        <td className={`py-3 px-3 font-bold ${textMain}`}>{row.display_name}</td>
                                        <td className="py-3 px-3 text-slate-400">{row.department}</td>
                                        <td className="py-3 px-3 text-center">
                                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                            String(row.activet).toLowerCase() === 'active' 
                                              ? 'bg-emerald-500/15 text-emerald-500' 
                                              : 'bg-red-500/15 text-red-500'
                                          }`}>
                                            {row.activet || 'Active'}
                                          </span>
                                        </td>
                                        <td className="py-3 px-3">
                                          <span className={`px-2 py-0.5 rounded text-[10px] font-black border ${
                                            isDark 
                                              ? 'bg-purple-950/20 text-purple-400 border-purple-500/20' 
                                              : 'bg-purple-50 text-purple-700 border-purple-200'
                                          }`}>
                                            {row.license_m365 || 'N/A'}
                                          </span>
                                        </td>
                                        <td className="py-3 px-3 text-center">
                                          {String(row.email_exchange) === '1' ? (
                                            <span className="text-emerald-500 font-bold bg-emerald-500/5 px-2 py-0.5 rounded border border-emerald-500/10">1</span>
                                          ) : (
                                            <span className="text-slate-400">0</span>
                                          )}
                                        </td>
                                        <td className="py-3 px-3 text-center">
                                          {String(row.one_drive) === '1' ? (
                                            <span className="text-emerald-500 font-bold bg-emerald-500/5 px-2 py-0.5 rounded border border-emerald-500/10">1</span>
                                          ) : (
                                            <span className="text-slate-400">0</span>
                                          )}
                                        </td>
                                        <td className="py-3 px-3 text-right font-mono font-bold text-purple-500">
                                          {Number(row.storage_used || 0).toLocaleString()}
                                        </td>
                                        <td className="py-3 px-3 text-center">
                                          {String(row.teams) === '1' ? (
                                            <span className="text-emerald-500 font-bold bg-emerald-500/5 px-2 py-0.5 rounded border border-emerald-500/10">1</span>
                                          ) : (
                                            <span className="text-slate-400">0</span>
                                          )}
                                        </td>
                                        <td className="py-3 px-3 text-slate-400 italic max-w-[150px] truncate" title={row.reason_teams}>
                                          {row.reason_teams || '-'}
                                        </td>
                                        <td className="py-3 px-3 text-center">
                                          {String(row.outlook_for_mobile) === '1' ? (
                                            <span className="text-emerald-500 font-bold bg-emerald-500/5 px-2 py-0.5 rounded border border-emerald-500/10">1</span>
                                          ) : (
                                            <span className="text-slate-400">0</span>
                                          )}
                                        </td>
                                        <td className="py-3 px-3 text-slate-400 italic max-w-[150px] truncate" title={row.reason_hp}>
                                          {row.reason_hp || '-'}
                                        </td>
                                        <td className="py-3 px-3 text-center">
                                          {String(row.outlook_for_web) === '1' ? (
                                            <span className="text-emerald-500 font-bold bg-emerald-500/5 px-2 py-0.5 rounded border border-emerald-500/10">1</span>
                                          ) : (
                                            <span className="text-slate-400">0</span>
                                          )}
                                        </td>
                                        <td className="py-3 px-3 text-slate-400 italic max-w-[150px] truncate" title={row.reason_web}>
                                          {row.reason_web || '-'}
                                        </td>
                                      </tr>
                                    ))
                                  }
                                </tbody>
                              </>
                            ) : isWhatsapp ? (
                              <>
                                <thead>
                                  <tr className={`border-b ${isDark ? 'border-slate-800 text-slate-400' : 'border-slate-100 text-slate-500'} font-bold`}>
                                    <th className="pb-2.5 px-3 font-bold uppercase tracking-wider text-[10px]">Bagian - Nama</th>
                                    <th className="pb-2.5 px-3 font-bold uppercase tracking-wider text-[10px]">Bagian - Nama (Divisi)</th>
                                    <th className="pb-2.5 px-3 font-bold uppercase tracking-wider text-[10px] text-right">Case (Jumlah Responden)</th>
                                    <th className="pb-2.5 px-3 font-bold uppercase tracking-wider text-[10px] text-right">Sudah Rating</th>
                                    <th className="pb-2.5 px-3 font-bold uppercase tracking-wider text-[10px] text-right">Belum Rating</th>
                                    <th className="pb-2.5 px-3 font-bold uppercase tracking-wider text-[10px] text-right text-red-500">Sangat Tidak Puas</th>
                                    <th className="pb-2.5 px-3 font-bold uppercase tracking-wider text-[10px] text-right text-orange-400">Tidak Puas</th>
                                    <th className="pb-2.5 px-3 font-bold uppercase tracking-wider text-[10px] text-right text-amber-500">Netral</th>
                                    <th className="pb-2.5 px-3 font-bold uppercase tracking-wider text-[10px] text-right text-emerald-400">Puas</th>
                                    <th className="pb-2.5 px-3 font-bold uppercase tracking-wider text-[10px] text-right text-emerald-500">Sangat Puas</th>
                                    <th className="pb-2.5 px-3 font-bold uppercase tracking-wider text-[10px]">Rincian Case</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {filteredRawRecords
                                    .slice((currentPage - 1) * 10, currentPage * 10)
                                    .map((row: any, idx: number) => (
                                      <tr key={idx} className={`border-b ${isDark ? 'border-slate-800/50 hover:bg-slate-800/20' : 'border-slate-100 hover:bg-slate-50/50'} transition-colors`}>
                                        <td className={`py-3 px-3 font-bold ${textMain}`}>{row.agent_name}</td>
                                        <td className="py-3 px-3 text-slate-400">{row.department}</td>
                                        <td className="py-3 px-3 font-mono font-bold text-right text-purple-500">{row.case_count}</td>
                                        <td className="py-3 px-3 font-mono text-right text-emerald-500">{row.already_rated}</td>
                                        <td className="py-3 px-3 font-mono text-right text-slate-400">{row.not_rated}</td>
                                        <td className="py-3 px-3 font-mono text-right text-red-400">{row.very_dissatisfied}</td>
                                        <td className="py-3 px-3 font-mono text-right text-orange-400">{row.dissatisfied}</td>
                                        <td className="py-3 px-3 font-mono text-right text-amber-400">{row.neutral}</td>
                                        <td className="py-3 px-3 font-mono text-right text-emerald-400">{row.satisfied}</td>
                                        <td className="py-3 px-3 font-mono text-right text-emerald-600 font-bold">{row.very_satisfied}</td>
                                        <td className="py-3 px-3 text-slate-400 italic max-w-[200px] truncate" title={row.case_details}>{row.case_details || '-'}</td>
                                      </tr>
                                    ))
                                  }
                                </tbody>
                              </>
                            ) : (
                              <>
                                <thead>
                                  <tr className={`border-b ${isDark ? 'border-slate-800 text-slate-400' : 'border-slate-100 text-slate-500'} font-bold`}>
                                    <th className="pb-2.5 font-bold uppercase tracking-wider text-[10px]">Nama Pengguna</th>
                                    <th className="pb-2.5 font-bold uppercase tracking-wider text-[10px]">Departemen / Divisi</th>
                                    <th className="pb-2.5 font-bold uppercase tracking-wider text-[10px] text-right">Total Aktivitas (Hits)</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {rawRecords
                                    .filter((r: any) => r.user_name.toLowerCase().includes(searchQuery.toLowerCase()))
                                    .slice((currentPage - 1) * (dashboardData?.project?.name?.toLowerCase().includes('m365') ? 20 : 10), currentPage * (dashboardData?.project?.name?.toLowerCase().includes('m365') ? 20 : 10))
                                    .map((row: any, idx: number) => (
                                      <tr key={idx} className={`border-b ${isDark ? 'border-slate-800/50 hover:bg-slate-800/20' : 'border-slate-100 hover:bg-slate-50/50'} transition-colors`}>
                                        <td className={`py-3 font-bold ${textMain}`}>{row.user_name}</td>
                                        <td className="py-3 text-slate-400">{row.department}</td>
                                        <td className="py-3 font-mono font-black text-right text-purple-500">{row.count}</td>
                                      </tr>
                                    ))
                                  }
                                </tbody>
                              </>
                            )}
                          </table>
                        </div>

                        {/* Pagination */}
                        <div className="flex items-center justify-between pt-4 mt-2">
                          <span className="text-[10px] text-slate-400 font-bold">
                            Menampilkan {Math.min(dashboardData?.project?.name?.toLowerCase().includes('m365') ? 20 : 10, filteredRawRecords.length)} dari {filteredRawRecords.length} record
                          </span>
                          <div className="flex gap-1">
                            <button
                              disabled={currentPage === 1}
                              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                              className="px-2.5 py-1 text-[10px] font-bold rounded-lg border border-slate-500/15 disabled:opacity-50 text-slate-400"
                            >
                              Sebelumnya
                            </button>
                            <button
                              disabled={currentPage * (dashboardData?.project?.name?.toLowerCase().includes('m365') ? 20 : 10) >= filteredRawRecords.length}
                              onClick={() => setCurrentPage(prev => prev + 1)}
                              className="px-2.5 py-1 text-[10px] font-bold rounded-lg border border-slate-500/15 disabled:opacity-50 text-slate-400"
                            >
                              Berikutnya
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    </AnimatePresence>
                  )}

                  </div>
                )}

              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL: TAMBAH PROJECT BARU */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`w-full max-w-md rounded-[2rem] border p-6 overflow-hidden ${
              isDark ? 'bg-[#1a1e29] border-slate-800 text-white' : 'bg-white border-slate-100 text-slate-950'
            }`}
          >
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-500/10">
              <h3 className="text-base font-black">Tambah Project Evaluasi Baru</h3>
              <button 
                onClick={() => setShowAddModal(false)}
                className={`text-slate-400 hover:${textMain}`}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateProject} className="space-y-4">
              <div className="space-y-1.5">
                <label className={`text-[10px] font-black uppercase tracking-wider ${textMuted}`}>Nama Project / Aplikasi</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Project m365, Whatsapp Omni"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  className={`w-full px-4 py-2.5 rounded-xl text-xs font-bold border focus:ring-2 focus:outline-none transition-all ${
                    isDark ? 'bg-slate-900 border-slate-800 text-white focus:ring-purple-500/50' : 'bg-slate-50 border-slate-200 text-slate-900 focus:ring-purple-500/20'
                  }`}
                />
              </div>

              <div className="space-y-1.5">
                <label className={`text-[10px] font-black uppercase tracking-wider ${textMuted}`}>Deskripsi</label>
                <textarea
                  placeholder="Deskripsikan program atau detail target yang ingin dievaluasi..."
                  value={newProjectDesc}
                  onChange={(e) => setNewProjectDesc(e.target.value)}
                  className={`w-full h-24 px-4 py-2.5 rounded-xl text-xs font-bold border focus:ring-2 focus:outline-none transition-all ${
                    isDark ? 'bg-slate-900 border-slate-800 text-white focus:ring-purple-500/50' : 'bg-slate-50 border-slate-200 text-slate-900 focus:ring-purple-500/20'
                  }`}
                />
              </div>

              <div className="space-y-1.5">
                <label className={`text-[10px] font-black uppercase tracking-wider ${textMuted}`}>Target Jumlah Pengguna Perusahaan</label>
                <input
                  type="number"
                  required
                  placeholder="Contoh: 150"
                  value={newProjectTarget}
                  onChange={(e) => setNewProjectTarget(e.target.value)}
                  className={`w-full px-4 py-2.5 rounded-xl text-xs font-bold border focus:ring-2 focus:outline-none transition-all ${
                    isDark ? 'bg-slate-900 border-slate-800 text-white focus:ring-purple-500/50' : 'bg-slate-50 border-slate-200 text-slate-900 focus:ring-purple-500/20'
                  }`}
                />
              </div>

              <div className="flex gap-2.5 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-bold border transition-all ${
                    isDark ? 'bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-200' : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submittingProject}
                  className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold active:scale-95 transition-all"
                >
                  {submittingProject ? 'Menyimpan...' : 'Simpan Project'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* MODAL: KONFIRMASI HAPUS SEMUA DATA DENGAN PASSWORD */}
      {showClearPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`w-full max-w-md rounded-[2rem] border p-6 overflow-hidden ${
              isDark ? 'bg-[#1a1e29] border-slate-800 text-white' : 'bg-white border-slate-100 text-slate-950'
            }`}
          >
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-500/10">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-red-500/10 text-red-500 flex items-center justify-center animate-pulse">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-black">Konfirmasi Penghapusan Data</h3>
              </div>
              <button 
                onClick={() => setShowClearPasswordModal(false)}
                className={`text-slate-400 hover:${textMain}`}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmClearDataWithPassword} className="space-y-4">
              <p className={`text-xs ${textMuted} leading-relaxed`}>
                Tindakan ini akan mengosongkan dan menghapus seluruh data mentah serta riwayat aktivitas yang ada di project ini secara permanen. Masukkan kata sandi otorisasi untuk melanjutkan.
              </p>

              <div className="space-y-1.5">
                <label className={`text-[10px] font-black uppercase tracking-wider ${textMuted}`}>Password Otorisasi</label>
                <input
                  type="password"
                  required
                  placeholder="Masukkan password admin"
                  value={clearPasswordInput}
                  onChange={(e) => setClearPasswordInput(e.target.value)}
                  className={`w-full px-4 py-2.5 rounded-xl text-xs font-bold border focus:ring-2 focus:outline-none transition-all ${
                    isDark ? 'bg-slate-900 border-slate-800 text-white focus:ring-purple-500/50' : 'bg-slate-50 border-slate-200 text-slate-900 focus:ring-purple-500/20'
                  }`}
                  autoFocus
                />
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowClearPasswordModal(false)}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-bold border transition-all ${
                    isDark ? 'bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-200' : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold active:scale-95 transition-all shadow-md shadow-red-500/10"
                >
                  Ya, Hapus Semua Data
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

    </div>
  );
};
