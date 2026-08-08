import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Settings2, 
  Layout, 
  Palette, 
  Bell, 
  Database, 
  Plus, 
  Trash2, 
  Save,
  Mail,
  MessageCircle,
  Send,
  Upload,
  Download,
  Image as ImageIcon,
  Info,
  RefreshCw,
  History,
  BookOpen,
  Edit3,
  Phone,
  Search,
  Printer,
  Key,
  Sparkles,
  Clock,
  HardDrive,
  Folder,
  Zap,
  Bug,
  Package,
  FileText
} from 'lucide-react';

import * as xlsx from 'xlsx';

import { api } from '../../services/api';
import toast from 'react-hot-toast';
import { APP_VERSION, BUILD_DATE, UPDATE_HISTORY, getEnvironment } from '../../version';
import { IJenisMasalahRule } from '../../types';
import { parseJenisMasalahRules } from '../../utils/jenisMasalah';
import { UserHeroBanner } from '../UserHeroBanner';
import { BugLogTab } from './BugLogTab';

interface SettingsModalProps {
  showSettings?: boolean;
  setShowSettings?: (show: boolean) => void;
  inline?: boolean;
  isDark: boolean;
  themeClasses: any;
  settingsTab: 'general' | 'branding' | 'banner' | 'login' | 'notifications' | 'data' | 'system' | 'panduan' | 'sla' | 'auto_respond' | 'ticket_popup' | 'bug_log' | 'it_action';
  setSettingsTab: (tab: 'general' | 'branding' | 'banner' | 'login' | 'notifications' | 'data' | 'system' | 'panduan' | 'sla' | 'auto_respond' | 'ticket_popup' | 'bug_log' | 'it_action') => void;
  appSettings: any;
  setAppSettings: (settings: any) => void;
  LOGO_OPTIONS: any[];
  newEmailInput: string;
  setNewEmailInput: (email: string) => void;
  showEmailInput: boolean;
  setShowEmailInput: (show: boolean) => void;
  handleUpdateSettings: (e: React.FormEvent) => void;
  primaryColor: string;
  adminUser: any;
  itPersonnel: any[];
  departments: any[];
  categories: any[];
  addingType: 'it' | 'dept' | 'cat' | 'master-user' | 'admin-user' | null;
  setAddingType: (type: 'it' | 'dept' | 'cat' | 'master-user' | 'admin-user' | null) => void;
  newItemName: string;
  setNewItemName: (name: string) => void;
  newItemAssignedTo: string;
  setNewItemAssignedTo: (user: string) => void;
  newItemResponseTime?: number;
  setNewItemResponseTime?: (time: number) => void;
  newItemJenisMasalah?: string;
  setNewItemJenisMasalah?: (jenis: string) => void;
  handleManagementAction: (type: 'it' | 'dept' | 'cat' | 'master-user' | 'admin-user', action: 'add' | 'delete' | 'refresh' | 'update', item?: any) => void;
  masterUsers: any[];
  adminUsers: any[];
  handleUploadExcel: (e: React.ChangeEvent<HTMLInputElement>) => void;
  adminThemeLayout?: string;
  setAdminThemeLayout?: (layout: string) => void;
}

export const SettingsModal = React.memo(({
  showSettings,
  setShowSettings,
  inline = false,
  isDark,
  themeClasses,
  settingsTab,
  setSettingsTab,
  appSettings,
  setAppSettings,
  LOGO_OPTIONS,
  newEmailInput,
  setNewEmailInput,
  showEmailInput,
  setShowEmailInput,
  handleUpdateSettings,
  primaryColor,
  adminUser,
  itPersonnel,
  departments,
  categories,
  addingType,
  setAddingType,
  newItemName,
  setNewItemName,
  newItemAssignedTo,
  setNewItemAssignedTo,
  newItemResponseTime = 0,
  setNewItemResponseTime,
  newItemJenisMasalah = 'Hardware',
  setNewItemJenisMasalah,
  handleManagementAction,
  masterUsers,
  adminUsers,
  handleUploadExcel,
  adminThemeLayout = 'modern',
  setAdminThemeLayout
}: SettingsModalProps) => {
  if (!inline && !showSettings) return null;

  const [masterUserName, setMasterUserName] = React.useState('');
  const [masterUserDept, setMasterUserDept] = React.useState('');
  const [masterUserPhone, setMasterUserPhone] = React.useState('');
  const [masterUserIndex, setMasterUserIndex] = React.useState('');
  const [masterUserEmail, setMasterUserEmail] = React.useState('');
  const [masterUserJenisPiranti, setMasterUserJenisPiranti] = React.useState('(Tidak Ada)');
    const [masterUserJabatan, setMasterUserJabatan] = React.useState('');
  const [editingMasterUser, setEditingMasterUser] = React.useState<any | null>(null);
  const [masterUserSearch, setMasterUserSearch] = React.useState('');

  const filteredMasterUsers = React.useMemo(() => {
    if (!Array.isArray(masterUsers)) return [];
    const term = masterUserSearch.toLowerCase().trim();
    if (!term) return masterUsers;
    return masterUsers.filter(user => 
      (user.full_name || '').toLowerCase().includes(term) ||
      (user.department || '').toLowerCase().includes(term) ||
      (user.employee_index || '').toLowerCase().includes(term) ||
      (user.jenis_piranti || '').toLowerCase().includes(term) 
    );
  }, [masterUsers, masterUserSearch]);

  const [adminUserUsername, setAdminUserUsername] = React.useState('');
  const [adminUserPassword, setAdminUserPassword] = React.useState('');
  const [adminUserFullName, setAdminUserFullName] = React.useState('');
  const [adminUserRole, setAdminUserRole] = React.useState('Staff IT Support');
  const [adminUserPhone, setAdminUserPhone] = React.useState('');
  const [editingAdminUser, setEditingAdminUser] = React.useState<any | null>(null);
  const [editingAdminPhone, setEditingAdminPhone] = React.useState('');
  const [adminUserNewPassword, setAdminUserNewPassword] = React.useState('');
  const [myNewPassword, setMyNewPassword] = React.useState('');
  
  const [editingCategoryId, setEditingCategoryId] = React.useState<number | null>(null);
  const [editingCategoryName, setEditingCategoryName] = React.useState('');
  const [editingCategoryResponseTime, setEditingCategoryResponseTime] = React.useState<number>(0);
  const [editingCategoryAssignedTo, setEditingCategoryAssignedTo] = React.useState('');
  const [editingCategoryAssignedToList, setEditingCategoryAssignedToList] = React.useState<string[]>([]);
  const [editingCategoryJenisMasalah, setEditingCategoryJenisMasalah] = React.useState('Hardware');

  const [isCustomNewItemJenis, setIsCustomNewItemJenis] = React.useState(false);
  const [isCustomEditingJenis, setIsCustomEditingJenis] = React.useState(false);

  // --- Jenis Masalah Rules Management ---
  const [showAddJenisRuleModal, setShowAddJenisRuleModal] = React.useState(false);
  const [newJenisRuleName, setNewJenisRuleName] = React.useState('');
  const [newJenisRuleRequireCode, setNewJenisRuleRequireCode] = React.useState(true);

  const [editingJenisRuleIndex, setEditingJenisRuleIndex] = React.useState<number | null>(null);
  const [editingJenisRuleName, setEditingJenisRuleName] = React.useState('');
  const [editingJenisRuleRequireCode, setEditingJenisRuleRequireCode] = React.useState(true);

  const jenisMasalahRules = React.useMemo(() => {
    return parseJenisMasalahRules(appSettings?.jenis_masalah_rules, categories);
  }, [appSettings?.jenis_masalah_rules, categories]);

  const allJenisMasalahList = React.useMemo(() => {
    const setJM = new Set<string>();
    jenisMasalahRules.forEach(r => setJM.add(r.name));
    if (Array.isArray(categories)) {
      categories.forEach(cat => {
        if (cat.jenis_masalah && typeof cat.jenis_masalah === 'string' && cat.jenis_masalah.trim()) {
          setJM.add(cat.jenis_masalah.trim());
        }
      });
    }
    return Array.from(setJM);
  }, [jenisMasalahRules, categories]);

  const handleSaveJenisMasalahRules = async (updatedRules: IJenisMasalahRule[]) => {
    try {
      const jsonStr = JSON.stringify(updatedRules);
      const updated = {
        ...appSettings,
        jenis_masalah_rules: jsonStr
      };
      if (setAppSettings) setAppSettings(updated);
      await api.updateSettings({ jenis_masalah_rules: jsonStr });
      toast.success('Aturan Jenis Masalah berhasil disimpan!');
    } catch (err: any) {
      console.error('Failed to update jenis masalah rules', err);
      toast.error('Gagal menyimpan Aturan Jenis Masalah');
    }
  };

  const handleAddJenisRule = () => {
    if (!newJenisRuleName.trim()) {
      toast.error('Nama Jenis Masalah tidak boleh kosong');
      return;
    }
    const norm = newJenisRuleName.trim();
    if (jenisMasalahRules.some(r => r.name.toLowerCase() === norm.toLowerCase())) {
      toast.error('Jenis Masalah dengan nama ini sudah ada');
      return;
    }
    const nextRules = [...jenisMasalahRules, { name: norm, require_device_code: newJenisRuleRequireCode }];
    handleSaveJenisMasalahRules(nextRules);
    setNewJenisRuleName('');
    setNewJenisRuleRequireCode(true);
    setShowAddJenisRuleModal(false);
  };

  const handleToggleJenisRuleCode = (index: number) => {
    const nextRules = [...jenisMasalahRules];
    nextRules[index] = {
      ...nextRules[index],
      require_device_code: !nextRules[index].require_device_code
    };
    handleSaveJenisMasalahRules(nextRules);
  };

  const handleDeleteJenisRule = (index: number) => {
    const item = jenisMasalahRules[index];
    if (item.name.toLowerCase() === 'hardware' || item.name.toLowerCase() === 'aplikasi') {
      toast.error('Jenis masalah bawaan (Hardware / Aplikasi) tidak dapat dihapus');
      return;
    }
    if (!confirm(`Hapus jenis masalah "${item.name}"?`)) return;
    const nextRules = jenisMasalahRules.filter((_, i) => i !== index);
    handleSaveJenisMasalahRules(nextRules);
  };

  const handleSaveEditJenisRule = (index: number) => {
    if (!editingJenisRuleName.trim()) return;
    const nextRules = [...jenisMasalahRules];
    nextRules[index] = {
      name: editingJenisRuleName.trim(),
      require_device_code: editingJenisRuleRequireCode
    };
    handleSaveJenisMasalahRules(nextRules);
    setEditingJenisRuleIndex(null);
  };

  const [isMigrating, setIsMigrating] = React.useState(false);

  const handleMigrateMedia = async (targetMode: 'local' | 'db') => {
    const confirmText = targetMode === 'local' 
      ? "Apakah Anda yakin ingin memindahkan seluruh foto & TTD eksisting dari DB ke Folder Disk Server?"
      : "Apakah Anda yakin ingin mengkonversi seluruh foto & TTD dari Folder Disk ke DB Base64?";
    if (!window.confirm(confirmText)) return;

    setIsMigrating(true);
    try {
      const res = await api.migrateMedia(targetMode);
      if (res.success) {
        alert(res.message);
      } else {
        alert("Gagal migrasi: " + res.message);
      }
    } catch (err: any) {
      alert("Terjadi kesalahan saat migrasi: " + err.message);
    } finally {
      setIsMigrating(false);
    }
  };

  const handleUpdateMyPassword = async () => {
    if (!myNewPassword.trim()) {
      alert('Password baru wajib diisi');
      return;
    }
    if (!adminUser?.username) {
      alert('Informasi login tidak ditemukan');
      return;
    }
    try {
      await api.changePassword({
        username: adminUser.username,
        newPassword: myNewPassword.trim()
      });
      setMyNewPassword('');
      alert('Password Anda berhasil diperbarui');
    } catch (err: any) {
      alert(err.message || 'Gagal mengubah password Anda');
    }
  };

  const [itName, setItName] = React.useState('');
  const [itRole, setItRole] = React.useState('Staff IT Support');
  const [editingIt, setEditingIt] = React.useState<any | null>(null);

  const handleSaveItPersonnel = async () => {
    if (!itName.trim()) {
      alert('Nama wajib diisi');
      return;
    }
    try {
      if (editingIt) {
        await api.updateITPersonnel(editingIt.id, { name: itName.trim(), role: itRole });
      } else {
        await api.addITPersonnel({ name: itName.trim(), role: itRole });
      }
      setAddingType(null);
      setEditingIt(null);
      setItName('');
      setItRole('Staff IT Support');
      handleManagementAction('it', 'refresh');
    } catch (err: any) {
      alert(err.message || 'Gagal menyimpan data');
    }
  };

  const handleEditItPersonnel = (it: any) => {
    setEditingIt(it);
    setItName(it.name || '');
    setItRole(it.role || 'Staff IT Support');
    setAddingType('it');
  };

  const handleAddAdminUser = async () => {
    if (!adminUserUsername || !adminUserPassword || !adminUserFullName || !adminUserRole) {
      alert('Semua kolom wajib diisi');
      return;
    }
    try {
      await api.addAdminUser({ 
        username: adminUserUsername, 
        password: adminUserPassword, 
        full_name: adminUserFullName,
        role: adminUserRole,
        phone: adminUserPhone
      });
      setAddingType(null);
      setAdminUserUsername('');
      setAdminUserPassword('');
      setAdminUserFullName('');
      setAdminUserPhone('');
      setAdminUserRole('Staff IT Support');
      handleManagementAction('admin-user', 'add');
    } catch (err: any) {
      alert(err.message || 'Gagal menambah admin');
    }
  };

  const handleDeleteAdminUser = async (id: number) => {
    if (!confirm('Hapus admin ini?')) return;
    try {
      await api.deleteAdminUser(id);
      handleManagementAction('admin-user', 'delete', { id });
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus admin');
    }
  };

  const handleUpdateAdminPassword = async () => {
    if (!editingAdminUser) return;
    try {
      await api.updateAdminUser(editingAdminUser.id, {
        username: editingAdminUser.username,
        full_name: editingAdminUser.full_name,
        role: editingAdminUser.role,
        phone: editingAdminPhone,
        ...(adminUserNewPassword.trim() ? { password: adminUserNewPassword.trim() } : {})
      });
      setEditingAdminUser(null);
      setAdminUserNewPassword('');
      setEditingAdminPhone('');
      toast.success('Data Admin & No WhatsApp berhasil diperbarui');
      handleManagementAction('admin-user', 'refresh');
    } catch (err: any) {
      alert(err.message || 'Gagal mengubah data admin');
    }
  };

  const handleAddMasterUser = async () => {
    if (!masterUserName) {
      alert('Nama wajib diisi');
      return;
    }
    try {
      if (editingMasterUser) {
        // Edit Mode
        await api.updateMasterUser(editingMasterUser.id, {
          full_name: masterUserName,
          department: masterUserDept,
          phone: masterUserPhone,
          employee_index: masterUserIndex,
          email: masterUserEmail || null,
          jenis_piranti: masterUserJenisPiranti,
          
          jabatan: masterUserJabatan
        });
        setAddingType(null);
        setEditingMasterUser(null);
        setMasterUserName('');
        setMasterUserDept('');
        setMasterUserPhone('');
        setMasterUserIndex('');
        setMasterUserEmail('');
        setMasterUserJenisPiranti('(Tidak Ada)');
                setMasterUserJabatan('');
        handleManagementAction('master-user', 'delete', { id: editingMasterUser.id }); // Invalidate queries/refresh
      } else {
        // Add Mode
        await api.addMasterUser({ 
          full_name: masterUserName, 
          department: masterUserDept, 
          phone: masterUserPhone,
          employee_index: masterUserIndex,
          email: masterUserEmail || null,
          jenis_piranti: masterUserJenisPiranti,
          
          jabatan: masterUserJabatan
        });
        setAddingType(null);
        setMasterUserName('');
        setMasterUserDept('');
        setMasterUserPhone('');
        setMasterUserIndex('');
        setMasterUserEmail('');
        setMasterUserJenisPiranti('(Tidak Ada)');
                setMasterUserJabatan('');
        handleManagementAction('master-user', 'add');
      }
    } catch (err: any) {
      alert(err.message || (editingMasterUser ? 'Gagal mengedit user' : 'Gagal menambah user'));
    }
  };

  const handleOpenAddMasterUser = () => {
    setEditingMasterUser(null);
    setMasterUserName('');
    setMasterUserDept('');
    setMasterUserPhone('');
    setMasterUserIndex('');
    setMasterUserEmail('');
    setMasterUserJenisPiranti('(Tidak Ada)');
        setMasterUserJabatan('');
    setAddingType('master-user');
  };

  const normalizeJenisPiranti = (val: string | null | undefined): string => {
    if (!val) return '(Tidak Ada)';
    const normalized = val.trim().toLowerCase();
    if (normalized === 'komputer' || normalized === 'pc' || normalized === 'komputer pc' || normalized === 'desktop' || normalized === 'computer' || normalized === 'cpu') return 'Komputer';
    if (normalized === 'laptop' || normalized === 'notebook' || normalized === 'netbook' || normalized === 'macbook') return 'Laptop';
    if (normalized === 'tab' || normalized === 'tablet' || normalized === 'smartphone' || normalized === 'hp' || normalized === 'android' || normalized === 'ios' || normalized === 'handphone' || normalized === 'phone') return 'TAB';
    return '(Tidak Ada)';
  };

  const handleOpenEditMasterUser = (user: any) => {
    setEditingMasterUser(user);
    setMasterUserName(user.full_name || '');
    setMasterUserDept(user.department || '');
    setMasterUserPhone(user.phone || '');
    setMasterUserIndex(user.employee_index || '');
    setMasterUserEmail(user.email || '');
    setMasterUserJenisPiranti(normalizeJenisPiranti(user.jenis_piranti));
        setMasterUserJabatan(user.jabatan || '');
    setAddingType('master-user');
  };

  const handleDeleteMasterUser = async (id: number) => {
    if (!confirm('Hapus user ini?')) return;
    try {
      await api.deleteMasterUser(id);
      handleManagementAction('master-user', 'delete', { id });
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus user');
    }
  };

  const handleToggleVoucherPrivilege = async (user: any) => {
    const nextVal = user.can_request_voucher === 1 ? 0 : 1;
    try {
      await api.toggleVoucherPrivilege(user.id, nextVal === 1);
      alert(`Izin buat voucher untuk ${user.full_name} berhasil ${nextVal === 1 ? 'diberikan' : 'dicabut'}`);
      handleManagementAction('master-user', 'refresh');
    } catch (err: any) {
      alert(err.message || 'Gagal mengubah izin voucher');
    }
  };

  const handleToggleFunnyEgg = async (user: any) => {
    const nextVal = user.enable_funny_egg === 1 ? 0 : 1;
    try {
      await api.toggleFunnyEggPrivilege(user.id, nextVal === 1);
      alert(`Fitur "Kolom Lari-Lari" (Funny Egg) untuk ${user.full_name} berhasil ${nextVal === 1 ? 'diaktifkan' : 'dinonaktifkan'}`);
      handleManagementAction('master-user', 'refresh');
    } catch (err: any) {
      alert(err.message || 'Gagal mengubah fitur lari-lari');
    }
  };

  const handleDownloadTemplate = () => {
    const templateData = [
      {
        'Nama Lengkap': 'Budi Santoso',
        'Bagian / Departemen': 'HRGA',
        'No. Telepon': '081234567890',
        'Index Karyawan': '12345',
        'Jenis Piranti': 'Komputer',
        'Email': 'budi@example.com',
        'Jabatan': 'Staff GA'
      },
      {
        'Nama Lengkap': 'Siti Aminah',
        'Bagian / Departemen': 'CE Business',
        'No. Telepon': '081234567891',
        'Index Karyawan': '67890',
        'Jenis Piranti': 'Laptop',
        'Email': 'siti@example.com',
        'Jabatan': 'Supervisor CE'
      },
      {
        'Nama Lengkap': 'Andi Wijaya',
        'Bagian / Departemen': 'Fleet Business',
        'No. Telepon': '081234567892',
        'Index Karyawan': '11223',
        'Jenis Piranti': '(Tidak Ada)',
        'Email': '',
        'Jabatan': 'Driver'
      }
    ];

    const ws = xlsx.utils.json_to_sheet(templateData);
    const wb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb, ws, 'Template Master User');
    xlsx.writeFile(wb, 'Template_Import_User.xlsx');
  };

  const handlePrintLabel = (user: any) => {
    const printWindow = window.open('', '', 'width=600,height=400');
    if (!printWindow) {
      alert("Browser memblokir pop-up. Izinkan pop-up untuk mencetak label.");
      return;
    }
    
    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Print Label - ${user.full_name}</title>
          <style>
            @page { size: auto; margin: 0mm; }
            body { 
              margin: 0; 
              padding: 0;
              font-family: sans-serif;
              display: flex;
              align-items: center;
              justify-content: center;
              width: 100%;
              height: 100vh;
              background-color: white;
            }
            .label-container {
              width: 100%;
              height: 100%;
              display: flex;
              flex-direction: column;
              justify-content: center;
              align-items: center;
              text-align: center;
              box-sizing: border-box;
              padding: 10px;
            }
            .jabatan {
              font-size: 14px;
              margin-bottom: 8px;
            }
            .kode {
              font-size: 16px;
              border: 1px solid black;
              padding: 5px 10px;
              border-radius: 4px;
              display: inline-block;
              font-weight: bold;
            }
          </style>
        </head>
        <body>
          <div class="label-container">
            <div class="jabatan">${user.jabatan || '-'}</div>
            <div class="kode">Kode: ${user.kode_piranti || '-'}</div>
          </div>
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
                window.close();
              }, 500);
            }
          </script>
        </body>
      </html>
    `;
    
    printWindow.document.write(printContent);
    printWindow.document.close();
  };

  const handlePrintAllLabels = () => {
    if (!Array.isArray(masterUsers) || masterUsers.length === 0) {
      alert('Tidak ada data master user untuk dicetak');
      return;
    }

    const pcUsers = masterUsers.filter(user => user.kode_piranti && user.kode_piranti !== '-');
    
    if (pcUsers.length === 0) {
      alert('Tidak ada user dengan kode piranti');
      return;
    }

    const printWindow = window.open('', '', 'width=800,height=600');
    if (!printWindow) {
      alert("Browser memblokir pop-up. Izinkan pop-up untuk mencetak label.");
      return;
    }
    
    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Print All Labels</title>
          <style>
            @page { size: A4; margin: 10mm; }
            body { 
              margin: 0; 
              padding: 0;
              font-family: sans-serif;
              background-color: white;
            }
            .grid-container {
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 15px;
              width: 100%;
            }
            .label-box {
              border: 1px dashed #ccc;
              padding: 20px;
              text-align: center;
              display: flex;
              flex-direction: column;
              justify-content: center;
              align-items: center;
              page-break-inside: avoid;
              min-height: 100px;
            }
            .jabatan {
              font-size: 12px;
              margin-bottom: 8px;
            }
            .kode {
              font-size: 14px;
              border: 1px solid black;
              padding: 4px 8px;
              border-radius: 4px;
              display: inline-block;
              font-weight: bold;
            }
          </style>
        </head>
        <body>
          <div class="grid-container">
            ${pcUsers.map(user => `
              <div class="label-box">
                <div class="jabatan">${user.jabatan || '-'}</div>
                <div class="kode">Kode: ${user.kode_piranti}</div>
              </div>
            `).join('')}
          </div>
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
                window.close();
              }, 500);
            }
          </script>
        </body>
      </html>
    `;
    
    printWindow.document.write(printContent);
    printWindow.document.close();
  };

  const handleExportMasterUser = () => {
    if (!Array.isArray(masterUsers) || masterUsers.length === 0) {
      alert('Tidak ada data master user untuk diexport');
      return;
    }

    const exportData = masterUsers.map(user => ({
      'Nama Lengkap': user.full_name || '',
      'Bagian / Departemen': user.department || '',
      'No. Telepon': user.phone || '',
      'Index Karyawan': user.employee_index || '',
      'Jenis Piranti': user.jenis_piranti || '(Tidak Ada)',
      'Email': user.email || '',
      'Jabatan': user.jabatan || '-'
    }));

    const ws = xlsx.utils.json_to_sheet(exportData);
    const wb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb, ws, 'Master User');
    xlsx.writeFile(wb, 'Data_Master_User.xlsx');
  };

  const parsedPanduan = (() => {
    try {
      if (!appSettings.panduan_guides) return [];
      if (Array.isArray(appSettings.panduan_guides)) return appSettings.panduan_guides;
      if (typeof appSettings.panduan_guides === 'string') {
        if (appSettings.panduan_guides === '[object Object]') return [];
        return JSON.parse(appSettings.panduan_guides);
      }
      return [];
    } catch (e) {
      return [];
    }
  })();

  const updatePanduan = (newPanduan: any[]) => {
    setAppSettings({ ...appSettings, panduan_guides: JSON.stringify(newPanduan) });
  };

  const content = (
    <div 
      className={`relative rounded-3xl overflow-hidden flex flex-col transition-colors ${themeClasses.card} ${themeClasses.text} ${inline ? 'w-full h-full border' : 'shadow-2xl w-full max-w-4xl max-h-[90vh]'}`}
    >
      <div className={`p-4 sm:p-6 border-b shrink-0 ${themeClasses.border}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-950/40 rounded-xl flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Settings2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className={`text-lg font-black tracking-tight ${themeClasses.text}`}>Pengaturan Sistem</h2>
              <p className={`text-[10px] font-bold capitalize tracking-widest ${themeClasses.textMuted}`}>Konfigurasi aplikasi & branding</p>
            </div>
          </div>
          {!inline && (
            <button 
              onClick={() => setShowSettings?.(false)}
              className={`p-2 rounded-full transition-all ${isDark ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'}`}
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

        <div className="flex flex-col sm:flex-row flex-1 overflow-hidden">
          {/* Sidebar Tabs */}
          <div className={`w-full sm:w-64 border-b sm:border-b-0 sm:border-r p-3 sm:p-6 flex flex-row sm:flex-col overflow-x-auto sm:overflow-visible gap-2 sm:gap-0 sm:space-y-2 hide-scrollbar shrink-0 ${themeClasses.border} ${themeClasses.bgSecondary}`}>
            <button 
              onClick={() => setSettingsTab('general')}
              className={`whitespace-nowrap shrink-0 sm:w-full flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 rounded-xl sm:rounded-2xl text-[11px] font-black capitalize tracking-widest transition-all ${settingsTab === 'general' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/20' : `text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800`}`}
            >
              <Layout className="w-4 h-4" /> Umum
            </button>
            <button 
              onClick={() => setSettingsTab('branding')}
              className={`whitespace-nowrap shrink-0 sm:w-full flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 rounded-xl sm:rounded-2xl text-[11px] font-black capitalize tracking-widest transition-all ${settingsTab === 'branding' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/20' : `text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800`}`}
            >
              <Palette className="w-4 h-4" /> Branding
            </button>
            <button 
              type="button"
              onClick={() => setSettingsTab('banner')}
              className={`whitespace-nowrap shrink-0 sm:w-full flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 rounded-xl sm:rounded-2xl text-[11px] font-black capitalize tracking-widest transition-all ${settingsTab === 'banner' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/20' : `text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800`}`}
            >
              <ImageIcon className="w-4 h-4" /> Banner Hero
            </button>
            <button 
              onClick={() => setSettingsTab('login')}
              className={`whitespace-nowrap shrink-0 sm:w-full flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 rounded-xl sm:rounded-2xl text-[11px] font-black capitalize tracking-widest transition-all ${settingsTab === 'login' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/20' : `text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800`}`}
            >
              <Key className="w-4 h-4" /> Halaman Login
            </button>
            <button 
              onClick={() => setSettingsTab('notifications')}
              className={`whitespace-nowrap shrink-0 sm:w-full flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 rounded-xl sm:rounded-2xl text-[11px] font-black capitalize tracking-widest transition-all ${settingsTab === 'notifications' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/20' : `text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800`}`}
            >
              <Bell className="w-4 h-4" /> Notifikasi
            </button>
            <button 
              onClick={() => setSettingsTab('data')}
              className={`whitespace-nowrap shrink-0 sm:w-full flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 rounded-xl sm:rounded-2xl text-[11px] font-black capitalize tracking-widest transition-all ${settingsTab === 'data' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/20' : `text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800`}`}
            >
              <Database className="w-4 h-4" /> Data & API
            </button>
            <button 
              onClick={() => setSettingsTab('system')}
              className={`whitespace-nowrap shrink-0 sm:w-full flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 rounded-xl sm:rounded-2xl text-[11px] font-black capitalize tracking-widest transition-all ${settingsTab === 'system' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/20' : `text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800`}`}
            >
              <Settings2 className="w-4 h-4" /> Sistem
            </button>
            <button 
              type="button"
              onClick={() => setSettingsTab('sla')}
              className={`whitespace-nowrap shrink-0 sm:w-full flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 rounded-xl sm:rounded-2xl text-[11px] font-black capitalize tracking-widest transition-all ${settingsTab === 'sla' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/20' : `text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800`}`}
            >
              <Clock className="w-4 h-4" /> Waktu SLA
            </button>
            <button 
              type="button"
              onClick={() => setSettingsTab('auto_respond')}
              className={`whitespace-nowrap shrink-0 sm:w-full flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 rounded-xl sm:rounded-2xl text-[11px] font-black capitalize tracking-widest transition-all ${settingsTab === 'auto_respond' ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/20' : `text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800`}`}
            >
              <Zap className="w-4 h-4 text-purple-400" /> Auto Respond (Yudha)
            </button>
            <button 
              type="button"
              onClick={() => setSettingsTab('ticket_popup')}
              className={`whitespace-nowrap shrink-0 sm:w-full flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 rounded-xl sm:rounded-2xl text-[11px] font-black capitalize tracking-widest transition-all ${settingsTab === 'ticket_popup' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/20' : `text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800`}`}
            >
              <MessageCircle className="w-4 h-4" /> Pop-up Tiket
            </button>
            <button 
              type="button"
              onClick={() => setSettingsTab('it_action')}
              className={`whitespace-nowrap shrink-0 sm:w-full flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 rounded-xl sm:rounded-2xl text-[11px] font-black capitalize tracking-widest transition-all ${settingsTab === 'it_action' ? 'bg-amber-600 text-white shadow-lg shadow-amber-900/20' : `text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800`}`}
            >
              <Package className="w-4 h-4 text-amber-400" /> Form Tindakan IT
            </button>
            <button 
              type="button"
              onClick={() => setSettingsTab('bug_log')}
              className={`whitespace-nowrap shrink-0 sm:w-full flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 rounded-xl sm:rounded-2xl text-[11px] font-black capitalize tracking-widest transition-all ${settingsTab === 'bug_log' ? 'bg-rose-600 text-white shadow-lg shadow-rose-900/20' : `text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800`}`}
            >
              <Bug className="w-4 h-4 text-rose-400" /> Bug Log (Production)
            </button>
            <button 
              onClick={() => setSettingsTab('panduan')}
              className={`whitespace-nowrap shrink-0 sm:w-full flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 rounded-xl sm:rounded-2xl text-[11px] font-black capitalize tracking-widest transition-all ${settingsTab === 'panduan' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/20' : `text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800`}`}
            >
              <BookOpen className="w-4 h-4" /> Panduan
            </button>
          </div>
          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <form id="settings-form" onSubmit={handleUpdateSettings} className="p-4 sm:p-6 space-y-6">
              {settingsTab === 'general' && (
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 capitalize tracking-widest ml-1">Nama Aplikasi</label>
                    <input 
                      type="text"
                      className={`w-full px-4 py-2.5 rounded-xl border text-xs sm:text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-500 transition-all ${themeClasses.bgSecondary} ${themeClasses.border} ${themeClasses.text}`}
                      value={appSettings.app_name}
                      onChange={e => setAppSettings({...appSettings, app_name: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 capitalize tracking-widest ml-1">Logo Default</label>
                    <div className="grid grid-cols-5 gap-2">
                      {LOGO_OPTIONS.map((logo, idx) => (
                        <button
                          key={`logo-opt-${logo.id}-${idx}`}
                          type="button"
                          onClick={() => setAppSettings({...appSettings, logo_type: logo.id})}
                          className={`p-3 rounded-xl border flex items-center justify-center transition-all ${appSettings.logo_type === logo.id ? 'bg-emerald-600 text-white border-emerald-600' : `${themeClasses.bgSecondary} ${themeClasses.border} text-slate-400 hover:border-emerald-500`}`}
                        >
                          <logo.icon className="w-5 h-5" />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Personal Security - Ganti Password Saya */}
                  {adminUser && (
                    <div className="space-y-3 pt-6 border-t border-slate-100 dark:border-slate-800/60">
                      <label className="text-[10px] font-black text-slate-400 capitalize tracking-widest ml-1 flex items-center gap-1.5">
                        <Key className="w-3.5 h-3.5 text-emerald-500" /> Ganti Password Saya ({adminUser.username})
                      </label>
                      <div className={`p-4 rounded-2xl border ${themeClasses.border} ${themeClasses.bgSecondary} space-y-3`}>
                        <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
                          Ubah kata sandi untuk akun login Anda saat ini. Kata sandi harus aman dan mudah diingat.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-2">
                          <input 
                            type="password"
                            placeholder="Masukkan password baru"
                            className={`flex-1 px-4 py-2 rounded-xl border text-xs outline-none focus:ring-2 focus:ring-emerald-500 transition-all ${themeClasses.bgSecondary} ${themeClasses.border} ${themeClasses.text}`}
                            value={myNewPassword}
                            onChange={e => setMyNewPassword(e.target.value)}
                          />
                          <button 
                            type="button"
                            onClick={handleUpdateMyPassword}
                            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[10px] font-black uppercase tracking-wider whitespace-nowrap cursor-pointer transition-all active:scale-95"
                          >
                            Ubah Password
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {settingsTab === 'branding' && (
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 capitalize tracking-widest ml-1">Warna Utama (Public)</label>
                    <div className="flex items-center gap-3">
                      <input 
                        type="color"
                        className="w-10 h-10 rounded-lg cursor-pointer border-none"
                        value={appSettings.primary_color}
                        onChange={e => setAppSettings({...appSettings, primary_color: e.target.value})}
                      />
                      <input 
                        type="text"
                        className={`flex-1 px-4 py-2 rounded-xl border text-xs font-mono font-bold outline-none focus:ring-2 focus:ring-emerald-500 transition-all ${themeClasses.bgSecondary} ${themeClasses.border} ${themeClasses.text}`}
                        value={appSettings.primary_color}
                        onChange={e => setAppSettings({...appSettings, primary_color: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 capitalize tracking-widest ml-1">Tema Default (Public)</label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setAppSettings({...appSettings, theme_mode: 'light'})}
                        className={`flex-1 py-2 rounded-xl border text-[10px] font-black capitalize tracking-widest transition-all ${appSettings.theme_mode === 'light' ? 'bg-emerald-600 text-white border-emerald-600' : `${themeClasses.bgSecondary} ${themeClasses.border} text-slate-400`}`}
                      >
                        Light Mode
                      </button>
                      <button
                        type="button"
                        onClick={() => setAppSettings({...appSettings, theme_mode: 'dark'})}
                        className={`flex-1 py-2 rounded-xl border text-[10px] font-black capitalize tracking-widest transition-all ${appSettings.theme_mode === 'dark' ? 'bg-emerald-600 text-white border-emerald-600' : `${themeClasses.bgSecondary} ${themeClasses.border} text-slate-400`}`}
                      >
                        Dark Mode
                      </button>
                    </div>
                  </div>

                  {adminUser && (
                    <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-4">
                      <h3 className="text-[10px] font-black text-emerald-600 capitalize tracking-widest">Preferensi Admin ({adminUser.username})</h3>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 capitalize tracking-widest ml-1">Warna Utama Admin</label>
                        <div className="flex items-center gap-3">
                          <input 
                            type="color"
                            className="w-10 h-10 rounded-lg cursor-pointer border-none"
                            value={appSettings.admin_primary_color}
                            onChange={e => setAppSettings({...appSettings, admin_primary_color: e.target.value})}
                          />
                          <input 
                            type="text"
                            className={`flex-1 px-4 py-2 rounded-xl border text-xs font-mono font-bold outline-none focus:ring-2 focus:ring-emerald-500 transition-all ${themeClasses.bgSecondary} ${themeClasses.border} ${themeClasses.text}`}
                            value={appSettings.admin_primary_color}
                            onChange={e => setAppSettings({...appSettings, admin_primary_color: e.target.value})}
                          />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 capitalize tracking-widest ml-1">Tema Admin</label>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setAppSettings({...appSettings, admin_theme_mode: 'light'})}
                            className={`flex-1 py-2 rounded-xl border text-[10px] font-black capitalize tracking-widest transition-all ${appSettings.admin_theme_mode === 'light' ? 'bg-emerald-600 text-white border-emerald-600' : `${themeClasses.bgSecondary} ${themeClasses.border} text-slate-400`}`}
                          >
                            Light Mode
                          </button>
                          <button
                            type="button"
                            onClick={() => setAppSettings({...appSettings, admin_theme_mode: 'dark'})}
                            className={`flex-1 py-2 rounded-xl border text-[10px] font-black capitalize tracking-widest transition-all ${appSettings.admin_theme_mode === 'dark' ? 'bg-emerald-600 text-white border-emerald-600' : `${themeClasses.bgSecondary} ${themeClasses.border} text-slate-400`}`}
                          >
                            Dark Mode
                          </button>
                        </div>
                      </div>

                      {setAdminThemeLayout && (
                        <div className="space-y-1.5 pt-2">
                          <label className="text-[10px] font-black text-slate-400 capitalize tracking-widest ml-1">Tata Letak (Layout) Menu Admin</label>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setAdminThemeLayout('modern');
                                localStorage.setItem('adminThemeLayout', 'modern');
                              }}
                              className={`py-2 px-3 rounded-xl border text-[9px] font-black capitalize tracking-wider transition-all text-center ${adminThemeLayout === 'modern' ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm' : `${themeClasses.bgSecondary} ${themeClasses.border} text-slate-400`}`}
                            >
                              Modern (Sidebar)
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setAdminThemeLayout('cosmic');
                                localStorage.setItem('adminThemeLayout', 'cosmic');
                              }}
                              className={`py-2 px-3 rounded-xl border text-[9px] font-black capitalize tracking-wider transition-all text-center ${adminThemeLayout === 'cosmic' ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm' : `${themeClasses.bgSecondary} ${themeClasses.border} text-slate-400`}`}
                            >
                              Cosmic (Teal Neon)
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setAdminThemeLayout('compact');
                                localStorage.setItem('adminThemeLayout', 'compact');
                              }}
                              className={`py-2 px-3 rounded-xl border text-[9px] font-black capitalize tracking-wider transition-all text-center ${adminThemeLayout === 'compact' ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm' : `${themeClasses.bgSecondary} ${themeClasses.border} text-slate-400`}`}
                            >
                              Compact (Minimal)
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setAdminThemeLayout('executive');
                                localStorage.setItem('adminThemeLayout', 'executive');
                              }}
                              className={`py-2 px-3 rounded-xl border text-[9px] font-black capitalize tracking-wider transition-all text-center ${adminThemeLayout === 'executive' ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm' : `${themeClasses.bgSecondary} ${themeClasses.border} text-slate-400`}`}
                            >
                              Executive (Top)
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setAdminThemeLayout('cyberpunk');
                                localStorage.setItem('adminThemeLayout', 'cyberpunk');
                              }}
                              className={`py-2 px-3 rounded-xl border text-[9px] font-black capitalize tracking-wider transition-all text-center ${adminThemeLayout === 'cyberpunk' ? 'bg-pink-600 text-white border-pink-600 shadow-sm shadow-pink-500/10' : `${themeClasses.bgSecondary} ${themeClasses.border} text-slate-400`}`}
                            >
                              Cyberpunk (Sunset)
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setAdminThemeLayout('forest');
                                localStorage.setItem('adminThemeLayout', 'forest');
                              }}
                              className={`py-2 px-3 rounded-xl border text-[9px] font-black capitalize tracking-wider transition-all text-center ${adminThemeLayout === 'forest' ? 'bg-emerald-700 text-white border-emerald-700 shadow-sm' : `${themeClasses.bgSecondary} ${themeClasses.border} text-slate-400`}`}
                            >
                              Forest (Organic)
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setAdminThemeLayout('retro');
                                localStorage.setItem('adminThemeLayout', 'retro');
                              }}
                              className={`py-2 px-3 rounded-xl border text-[9px] font-black capitalize tracking-wider transition-all text-center ${adminThemeLayout === 'retro' ? 'bg-amber-600 text-white border-amber-600 shadow-sm shadow-amber-500/10' : `${themeClasses.bgSecondary} ${themeClasses.border} text-slate-400`}`}
                            >
                              Terminal (Amber)
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setAdminThemeLayout('ocean');
                                localStorage.setItem('adminThemeLayout', 'ocean');
                              }}
                              className={`py-2 px-3 rounded-xl border text-[9px] font-black capitalize tracking-wider transition-all text-center ${adminThemeLayout === 'ocean' ? 'bg-sky-600 text-white border-sky-600 shadow-sm shadow-sky-500/10' : `${themeClasses.bgSecondary} ${themeClasses.border} text-slate-400`}`}
                            >
                              Ocean Breeze
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setAdminThemeLayout('sakura');
                                localStorage.setItem('adminThemeLayout', 'sakura');
                              }}
                              className={`py-2 px-3 rounded-xl border text-[9px] font-black capitalize tracking-wider transition-all text-center ${adminThemeLayout === 'sakura' ? 'bg-rose-400 text-white border-rose-400 shadow-sm shadow-rose-300/10' : `${themeClasses.bgSecondary} ${themeClasses.border} text-slate-400`}`}
                            >
                              Sakura Dream
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setAdminThemeLayout('royal');
                                localStorage.setItem('adminThemeLayout', 'royal');
                              }}
                              className={`py-2 px-3 rounded-xl border text-[9px] font-black capitalize tracking-wider transition-all text-center ${adminThemeLayout === 'royal' ? 'bg-indigo-900 text-amber-400 border-amber-500 shadow-sm shadow-indigo-900/40' : `${themeClasses.bgSecondary} ${themeClasses.border} text-slate-400`}`}
                            >
                              Royal Velvet
                            </button>
                          </div>
                          <p className="text-[8px] font-bold text-slate-400 mt-1 ml-1 leading-normal">
                            * Pilih layout & tema visual Dashboard Admin Anda. Pilihan "Executive" memindahkan seluruh navigasi ke menu horizontal di bagian atas halaman.
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="space-y-1.5 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <label className="text-[10px] font-black text-slate-400 capitalize tracking-widest ml-1">Logo Aplikasi Utama</label>
                    <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50">
                      <div className="w-16 h-16 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center overflow-hidden shadow-sm">
                        {appSettings.custom_logo ? (
                          <img src={appSettings.custom_logo} alt="Logo" className="w-full h-full object-cover" />
                        ) : (
                          <ImageIcon className="w-8 h-8 text-slate-300" />
                        )}
                      </div>
                      <div className="flex-1 text-center sm:text-left">
                        <p className="text-[10px] font-bold text-slate-500 mb-2">Upload logo kustom aplikasi Anda.</p>
                        <div className="flex flex-wrap justify-center sm:justify-start gap-2">
                          <label className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-[10px] font-black capitalize tracking-widest cursor-pointer hover:bg-emerald-700 transition-all flex items-center gap-2">
                            <Upload className="w-3 h-3" /> Pilih Gambar
                            <input 
                              type="file" 
                              accept="image/*" 
                              className="hidden" 
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const reader = new FileReader();
                                  reader.onloadend = () => {
                                    setAppSettings({...appSettings, custom_logo: reader.result as string});
                                  };
                                  reader.readAsDataURL(file);
                                }
                              }} 
                            />
                          </label>
                          {appSettings.custom_logo && (
                            <button 
                              type="button"
                              onClick={() => setAppSettings({...appSettings, custom_logo: ''})}
                              className="px-4 py-2 bg-rose-500/10 text-rose-500 rounded-xl text-[10px] font-black capitalize tracking-widest hover:bg-rose-500 hover:text-white transition-all"
                            >
                              Reset Logo
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <label className="text-[10px] font-black text-slate-400 capitalize tracking-widest ml-1">Icon Shortcut (PWA - iPhone & Android)</label>
                    <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50">
                      <div className="w-16 h-16 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center overflow-hidden shadow-sm">
                        {appSettings.custom_pwa_icon || appSettings.custom_logo ? (
                          <img src={appSettings.custom_pwa_icon || appSettings.custom_logo} alt="Shortcut Icon" className="w-full h-full object-cover" />
                        ) : (
                          <ImageIcon className="w-8 h-8 text-slate-300" />
                        )}
                      </div>
                      <div className="flex-1 text-center sm:text-left">
                        <p className="text-[10px] font-bold text-slate-500 mb-2">Upload icon (512x512px) untuk shortcut di layar utama ponsel.</p>
                        <div className="flex flex-wrap justify-center sm:justify-start gap-2">
                          <label className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-[10px] font-black capitalize tracking-widest cursor-pointer hover:bg-emerald-700 transition-all flex items-center gap-2">
                            <Upload className="w-3 h-3" /> Pilih Gambar
                            <input 
                              type="file" 
                              accept="image/*" 
                              className="hidden" 
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const reader = new FileReader();
                                  reader.onloadend = () => {
                                    setAppSettings({...appSettings, custom_pwa_icon: reader.result as string});
                                  };
                                  reader.readAsDataURL(file);
                                }
                              }} 
                            />
                          </label>
                          {appSettings.custom_pwa_icon && (
                            <button 
                              type="button"
                              onClick={() => setAppSettings({...appSettings, custom_pwa_icon: ''})}
                              className="px-4 py-2 bg-rose-500/10 text-rose-500 rounded-xl text-[10px] font-black capitalize tracking-widest hover:bg-rose-500 hover:text-white transition-all"
                            >
                              Reset Icon
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <label className="text-[10px] font-black text-slate-400 capitalize tracking-widest ml-1">Favicon (Browser Icon)</label>
                    <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50">
                      <div className="w-12 h-12 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center overflow-hidden shadow-sm">
                        {appSettings.custom_favicon ? (
                          <img src={appSettings.custom_favicon} alt="Favicon" className="w-full h-full object-contain p-2" />
                        ) : (
                          <ImageIcon className="w-6 h-6 text-slate-300" />
                        )}
                      </div>
                      <div className="flex-1 text-center sm:text-left">
                        <p className="text-[10px] font-bold text-slate-500 mb-2">Upload icon (32x32px atau 64x64px) untuk tab browser.</p>
                        <div className="flex flex-wrap justify-center sm:justify-start gap-2">
                          <label className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-[10px] font-black capitalize tracking-widest cursor-pointer hover:bg-emerald-700 transition-all flex items-center gap-2">
                            <Upload className="w-3 h-3" /> Pilih Favicon
                            <input 
                              type="file" 
                              accept="image/*" 
                              className="hidden" 
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const reader = new FileReader();
                                  reader.onloadend = () => {
                                    setAppSettings({...appSettings, custom_favicon: reader.result as string});
                                  };
                                  reader.readAsDataURL(file);
                                }
                              }} 
                            />
                          </label>
                          {appSettings.custom_favicon && (
                            <button 
                              type="button"
                              onClick={() => setAppSettings({...appSettings, custom_favicon: ''})}
                              className="px-4 py-2 bg-rose-500/10 text-rose-500 rounded-xl text-[10px] font-black capitalize tracking-widest hover:bg-rose-500 hover:text-white transition-all"
                            >
                              Reset Favicon
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Kustomisasi Bottom Navigation & Floating Action Button (FAB) */}
                  <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-xs font-black text-emerald-600 dark:text-emerald-400 capitalize tracking-wider flex items-center gap-2">
                          <Layout className="w-4 h-4" /> Kustomisasi Menu Bawah, Teks & Tombol FAB
                        </h4>
                        <p className="text-[10px] text-slate-400 font-medium">
                          Atur warna tema/latar navbar, transparansi (opasitas), ukuran & ketebalan teks, serta warna & outline tombol Kirim Tiket (FAB).
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setAppSettings({
                            ...appSettings,
                            fab_size: 58,
                            fab_top_offset: -29,
                            fab_icon_size: 24,
                            nav_container_height: 56,
                            nav_container_radius: 22,
                            nav_text_size: 10,
                            nav_text_weight: 'font-medium',
                            nav_bg_color: '',
                            nav_bg_opacity: 100,
                            fab_bg_color: '',
                            fab_icon_color: '#ffffff',
                            fab_border_color: '#ffffff',
                            fab_border_width: 3.5
                          });
                          toast.success("Pengaturan FAB & Menu Bawah di-reset ke default");
                        }}
                        className="px-3 py-1.5 bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl text-[9px] font-black uppercase tracking-wider hover:bg-slate-300 dark:hover:bg-slate-700 transition-all shrink-0 cursor-pointer"
                      >
                        Reset Default
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40">
                      
                      {/* Section Header: Latar & Transparansi Navbar */}
                      <div className="sm:col-span-2 text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 border-b border-slate-200 dark:border-slate-800 pb-1">
                        1. Latar & Opasitas Navigasi
                      </div>

                      {/* Warna Latar Navbar */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-500 capitalize tracking-wider block">
                          Warna Latar Navigasi Bawah
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            className="w-8 h-8 rounded-lg cursor-pointer border border-slate-300 dark:border-slate-700 p-0.5 bg-white"
                            value={appSettings.nav_bg_color || '#10b981'}
                            onChange={(e) => setAppSettings({ ...appSettings, nav_bg_color: e.target.value })}
                          />
                          <input
                            type="text"
                            className="flex-1 px-3 py-1.5 text-xs font-mono rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200"
                            placeholder="#10b981"
                            value={appSettings.nav_bg_color || ''}
                            onChange={(e) => setAppSettings({ ...appSettings, nav_bg_color: e.target.value })}
                          />
                        </div>
                        <p className="text-[8px] text-slate-400 font-medium">Kosongkan untuk mengikuti warna tema utama aplikasi.</p>
                      </div>

                      {/* Opasitas / Transparansi Latar Navbar */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center text-[10px] font-black text-slate-500">
                          <label className="capitalize tracking-wider">Opasitas / Transparansi Navbar</label>
                          <span className="text-emerald-600 dark:text-emerald-400 font-mono font-bold">
                            {(appSettings.nav_bg_opacity !== undefined && appSettings.nav_bg_opacity !== null && appSettings.nav_bg_opacity !== '') ? appSettings.nav_bg_opacity : 100}%
                          </span>
                        </div>
                        <input
                          type="range"
                          min="10"
                          max="100"
                          step="5"
                          className="w-full accent-emerald-600 cursor-pointer h-2 bg-slate-200 dark:bg-slate-700 rounded-lg"
                          value={(appSettings.nav_bg_opacity !== undefined && appSettings.nav_bg_opacity !== null && appSettings.nav_bg_opacity !== '') ? appSettings.nav_bg_opacity : 100}
                          onChange={(e) => setAppSettings({ ...appSettings, nav_bg_opacity: Number(e.target.value) })}
                        />
                        <p className="text-[8px] text-slate-400 font-medium">100% = Pekat solid, 50% = Semi transparan/transparan.</p>
                      </div>

                      {/* Section Header: Tipografi Teks Navigasi */}
                      <div className="sm:col-span-2 text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 border-b border-slate-200 dark:border-slate-800 pb-1 pt-2">
                        2. Teks & Font Navigasi
                      </div>

                      {/* Warna Teks/Font Navigasi */}
                      <div className="space-y-1.5 sm:col-span-2">
                        <label className="text-[10px] font-black text-slate-500 capitalize tracking-wider block">
                          Warna Teks/Font Menu Navigasi
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            className="w-8 h-8 rounded-lg cursor-pointer border border-slate-300 dark:border-slate-700 p-0.5 bg-white"
                            value={appSettings.nav_text_color || '#ffffff'}
                            onChange={(e) => setAppSettings({ ...appSettings, nav_text_color: e.target.value })}
                          />
                          <input
                            type="text"
                            className="flex-1 px-3 py-1.5 text-xs font-mono rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200"
                            placeholder="#ffffff (atau #000000)"
                            value={appSettings.nav_text_color || ''}
                            onChange={(e) => setAppSettings({ ...appSettings, nav_text_color: e.target.value })}
                          />
                        </div>
                        <p className="text-[8px] text-slate-400 font-medium">Contoh: #ffffff untuk teks putih, #000000 untuk teks hitam. Kosongkan untuk default.</p>
                      </div>

                      {/* Ukuran Teks Navigasi */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center text-[10px] font-black text-slate-500">
                          <label className="capitalize tracking-wider">Ukuran Teks Menu</label>
                          <span className="text-emerald-600 dark:text-emerald-400 font-mono font-bold">
                            {appSettings.nav_text_size || 10} px
                          </span>
                        </div>
                        <input
                          type="range"
                          min="8"
                          max="14"
                          step="1"
                          className="w-full accent-emerald-600 cursor-pointer h-2 bg-slate-200 dark:bg-slate-700 rounded-lg"
                          value={appSettings.nav_text_size || 10}
                          onChange={(e) => setAppSettings({ ...appSettings, nav_text_size: Number(e.target.value) })}
                        />
                        <p className="text-[8px] text-slate-400 font-medium">Ukuran huruf judul menu (Default: 10px).</p>
                      </div>

                      {/* Ketebalan Font Teks Navigasi */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-500 capitalize tracking-wider block">
                          Ketebalan Font (Font Weight)
                        </label>
                        <select
                          className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200"
                          value={appSettings.nav_text_weight || 'font-medium'}
                          onChange={(e) => setAppSettings({ ...appSettings, nav_text_weight: e.target.value })}
                        >
                          <option value="font-normal">Tipis (Normal - 400)</option>
                          <option value="font-medium">Sedang (Medium - 500)</option>
                          <option value="font-semibold">Agak Tebal (SemiBold - 600)</option>
                          <option value="font-bold">Tebal (Bold - 700)</option>
                          <option value="font-extrabold">Sangat Tebal (ExtraBold - 800)</option>
                          <option value="font-black">Super Tebal (Black - 900)</option>
                        </select>
                        <p className="text-[8px] text-slate-400 font-medium">Tingkat ketebalan huruf label menu.</p>
                      </div>

                      {/* Section Header: Tombol Kirim Tiket (FAB) */}
                      <div className="sm:col-span-2 text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 border-b border-slate-200 dark:border-slate-800 pb-1 pt-2">
                        3. Tombol Melayang FAB (Kirim Tiket)
                      </div>

                      {/* Warna Background FAB */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-500 capitalize tracking-wider block">
                          Warna Background Tombol FAB
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            className="w-8 h-8 rounded-lg cursor-pointer border border-slate-300 dark:border-slate-700 p-0.5 bg-white"
                            value={appSettings.fab_bg_color || '#10b981'}
                            onChange={(e) => setAppSettings({ ...appSettings, fab_bg_color: e.target.value })}
                          />
                          <input
                            type="text"
                            className="flex-1 px-3 py-1.5 text-xs font-mono rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200"
                            placeholder="#10b981 (atau #ffffff)"
                            value={appSettings.fab_bg_color || ''}
                            onChange={(e) => setAppSettings({ ...appSettings, fab_bg_color: e.target.value })}
                          />
                        </div>
                        <p className="text-[8px] text-slate-400 font-medium">Contoh: #ffffff jika ingin tombol berlatar putih.</p>
                      </div>

                      {/* Warna Ikon Pesawat */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-500 capitalize tracking-wider block">
                          Warna Ikon Pesawat (Send)
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            className="w-8 h-8 rounded-lg cursor-pointer border border-slate-300 dark:border-slate-700 p-0.5 bg-white"
                            value={appSettings.fab_icon_color || '#ffffff'}
                            onChange={(e) => setAppSettings({ ...appSettings, fab_icon_color: e.target.value })}
                          />
                          <input
                            type="text"
                            className="flex-1 px-3 py-1.5 text-xs font-mono rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200"
                            placeholder="#ffffff (atau #10b981)"
                            value={appSettings.fab_icon_color || '#ffffff'}
                            onChange={(e) => setAppSettings({ ...appSettings, fab_icon_color: e.target.value })}
                          />
                        </div>
                        <p className="text-[8px] text-slate-400 font-medium">Contoh: #10b981 jika latar putih, pesawat hijau.</p>
                      </div>

                      {/* Warna Border / Outline FAB */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-500 capitalize tracking-wider block">
                          Warna Garis Pinggir (Border Outline) FAB
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            className="w-8 h-8 rounded-lg cursor-pointer border border-slate-300 dark:border-slate-700 p-0.5 bg-white"
                            value={appSettings.fab_border_color || '#ffffff'}
                            onChange={(e) => setAppSettings({ ...appSettings, fab_border_color: e.target.value })}
                          />
                          <input
                            type="text"
                            className="flex-1 px-3 py-1.5 text-xs font-mono rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200"
                            placeholder="#ffffff"
                            value={appSettings.fab_border_color || '#ffffff'}
                            onChange={(e) => setAppSettings({ ...appSettings, fab_border_color: e.target.value })}
                          />
                        </div>
                        <p className="text-[8px] text-slate-400 font-medium">Warna lis lingkar luar tombol melayang.</p>
                      </div>

                      {/* Ketebalan Border FAB */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center text-[10px] font-black text-slate-500">
                          <label className="capitalize tracking-wider">Ketebalan Border Outline</label>
                          <span className="text-emerald-600 dark:text-emerald-400 font-mono font-bold">
                            {(appSettings.fab_border_width !== undefined && appSettings.fab_border_width !== null && appSettings.fab_border_width !== '') ? appSettings.fab_border_width : 3.5} px
                          </span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="8"
                          step="0.5"
                          className="w-full accent-emerald-600 cursor-pointer h-2 bg-slate-200 dark:bg-slate-700 rounded-lg"
                          value={(appSettings.fab_border_width !== undefined && appSettings.fab_border_width !== null && appSettings.fab_border_width !== '') ? appSettings.fab_border_width : 3.5}
                          onChange={(e) => setAppSettings({ ...appSettings, fab_border_width: Number(e.target.value) })}
                        />
                        <p className="text-[8px] text-slate-400 font-medium">0px = Tanpa border outline, default 3.5px.</p>
                      </div>

                      {/* Posisi Vertikal FAB (Top Offset) */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center text-[10px] font-black text-slate-500">
                          <label className="capitalize tracking-wider">Posisi Naik/Turun FAB (Top Offset)</label>
                          <span className="text-emerald-600 dark:text-emerald-400 font-mono font-bold">
                            {(appSettings.fab_top_offset !== undefined && appSettings.fab_top_offset !== null && appSettings.fab_top_offset !== '') ? appSettings.fab_top_offset : -29} px
                          </span>
                        </div>
                        <input
                          type="range"
                          min="-60"
                          max="20"
                          step="1"
                          className="w-full accent-emerald-600 cursor-pointer h-2 bg-slate-200 dark:bg-slate-700 rounded-lg"
                          value={(appSettings.fab_top_offset !== undefined && appSettings.fab_top_offset !== null && appSettings.fab_top_offset !== '') ? appSettings.fab_top_offset : -29}
                          onChange={(e) => setAppSettings({ ...appSettings, fab_top_offset: Number(e.target.value) })}
                        />
                        <p className="text-[8px] text-slate-400 font-medium">Minus (-) = posisi melayang naik lebih tinggi ke atas.</p>
                      </div>

                      {/* Ukuran Tombol FAB */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center text-[10px] font-black text-slate-500">
                          <label className="capitalize tracking-wider">Ukuran Tombol FAB (Diameter)</label>
                          <span className="text-emerald-600 dark:text-emerald-400 font-mono font-bold">
                            {appSettings.fab_size || 58} px
                          </span>
                        </div>
                        <input
                          type="range"
                          min="36"
                          max="80"
                          step="1"
                          className="w-full accent-emerald-600 cursor-pointer h-2 bg-slate-200 dark:bg-slate-700 rounded-lg"
                          value={appSettings.fab_size || 58}
                          onChange={(e) => setAppSettings({ ...appSettings, fab_size: Number(e.target.value) })}
                        />
                        <p className="text-[8px] text-slate-400 font-medium">Diameter lingkaran tombol Kirim Tiket (Default: 58px).</p>
                      </div>

                      {/* Section Header: Dimensi Container Navbar */}
                      <div className="sm:col-span-2 text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 border-b border-slate-200 dark:border-slate-800 pb-1 pt-2">
                        4. Dimensi Container Navigasi
                      </div>

                      {/* Ukuran Ikon Pesawat (Send) */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center text-[10px] font-black text-slate-500">
                          <label className="capitalize tracking-wider">Ukuran Ikon Pesawat</label>
                          <span className="text-emerald-600 dark:text-emerald-400 font-mono font-bold">
                            {appSettings.fab_icon_size || 24} px
                          </span>
                        </div>
                        <input
                          type="range"
                          min="16"
                          max="40"
                          step="1"
                          className="w-full accent-emerald-600 cursor-pointer h-2 bg-slate-200 dark:bg-slate-700 rounded-lg"
                          value={appSettings.fab_icon_size || 24}
                          onChange={(e) => setAppSettings({ ...appSettings, fab_icon_size: Number(e.target.value) })}
                        />
                        <p className="text-[8px] text-slate-400 font-medium">Ukuran simbol ikon di dalam tombol (Default: 24px).</p>
                      </div>

                      {/* Tinggi Navbar Bottom */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center text-[10px] font-black text-slate-500">
                          <label className="capitalize tracking-wider">Tinggi Bar Navigasi Bawah</label>
                          <span className="text-emerald-600 dark:text-emerald-400 font-mono font-bold">
                            {appSettings.nav_container_height || 56} px
                          </span>
                        </div>
                        <input
                          type="range"
                          min="40"
                          max="80"
                          step="1"
                          className="w-full accent-emerald-600 cursor-pointer h-2 bg-slate-200 dark:bg-slate-700 rounded-lg"
                          value={appSettings.nav_container_height || 56}
                          onChange={(e) => setAppSettings({ ...appSettings, nav_container_height: Number(e.target.value) })}
                        />
                        <p className="text-[8px] text-slate-400 font-medium">Tinggi container melayang di bagian bawah (Default: 56px).</p>
                      </div>

                      {/* Radius Sudut Navbar */}
                      <div className="space-y-1.5 sm:col-span-2">
                        <div className="flex justify-between items-center text-[10px] font-black text-slate-500">
                          <label className="capitalize tracking-wider">Kelengkungan Sudut (Border Radius) Navbar</label>
                          <span className="text-emerald-600 dark:text-emerald-400 font-mono font-bold">
                            {appSettings.nav_container_radius || 22} px
                          </span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="36"
                          step="1"
                          className="w-full accent-emerald-600 cursor-pointer h-2 bg-slate-200 dark:bg-slate-700 rounded-lg"
                          value={appSettings.nav_container_radius || 22}
                          onChange={(e) => setAppSettings({ ...appSettings, nav_container_radius: Number(e.target.value) })}
                        />
                        <p className="text-[8px] text-slate-400 font-medium">Kebulatan sudut bar navigasi (Default: 22px).</p>
                      </div>
                    </div>

                    {/* Mini Live Preview inside Modal */}
                    <div className="p-3 bg-slate-100 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 text-center space-y-2">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Pratinjau Langsung (Live Preview)</span>
                      <div className="relative mx-auto max-w-xs h-28 bg-slate-200/50 dark:bg-slate-900/80 rounded-xl flex items-end justify-center pb-2 overflow-hidden border border-slate-300 dark:border-slate-800">
                        {/* Simulated background items */}
                        <div className="absolute top-2 left-2 right-2 flex justify-between opacity-30 text-[8px] text-slate-500">
                          <span>Konten Halaman</span>
                          <span>Tiket #123</span>
                        </div>

                        <div
                          className="relative text-white flex items-center justify-between px-3 w-64 shadow-md transition-all"
                          style={{
                            height: `${appSettings.nav_container_height || 56}px`,
                            borderRadius: `${appSettings.nav_container_radius || 22}px`,
                            backgroundColor: appSettings.nav_bg_color 
                              ? `rgba(${parseInt((appSettings.nav_bg_color.replace('#','')+'000000').substring(0,2),16)}, ${parseInt((appSettings.nav_bg_color.replace('#','')+'000000').substring(2,4),16)}, ${parseInt((appSettings.nav_bg_color.replace('#','')+'000000').substring(4,6),16)}, ${(appSettings.nav_bg_opacity !== undefined && appSettings.nav_bg_opacity !== null && appSettings.nav_bg_opacity !== '') ? appSettings.nav_bg_opacity / 100 : 1})`
                              : `rgba(16, 185, 129, ${(appSettings.nav_bg_opacity !== undefined && appSettings.nav_bg_opacity !== null && appSettings.nav_bg_opacity !== '') ? appSettings.nav_bg_opacity / 100 : 1})`
                          }}
                        >
                          <span className={`opacity-90 ${appSettings.nav_text_weight || 'font-medium'}`} style={{ fontSize: `${appSettings.nav_text_size || 10}px`, color: appSettings.nav_text_color || '#ffffff' }}>Beranda</span>
                          <span className={`opacity-90 ${appSettings.nav_text_weight || 'font-medium'}`} style={{ fontSize: `${appSettings.nav_text_size || 10}px`, color: appSettings.nav_text_color || '#ffffff' }}>Tiket Saya</span>
                          
                          {/* FAB Preview */}
                          <div
                            className="absolute left-1/2 -translate-x-1/2 flex items-center justify-center transition-all"
                            style={{ top: `${(appSettings.fab_top_offset !== undefined && appSettings.fab_top_offset !== null && appSettings.fab_top_offset !== '') ? appSettings.fab_top_offset : -29}px` }}
                          >
                            <div
                              className="rounded-full flex items-center justify-center shadow-lg transition-all"
                              style={{
                                width: `${appSettings.fab_size || 58}px`,
                                height: `${appSettings.fab_size || 58}px`,
                                backgroundColor: appSettings.fab_bg_color || '#10b981',
                                borderColor: appSettings.fab_border_color || '#ffffff',
                                borderWidth: `${(appSettings.fab_border_width !== undefined && appSettings.fab_border_width !== null && appSettings.fab_border_width !== '') ? appSettings.fab_border_width : 3.5}px`,
                                borderStyle: 'solid'
                              }}
                            >
                              <Send
                                className="ml-[-1px]"
                                style={{
                                  width: `${appSettings.fab_icon_size || 24}px`,
                                  height: `${appSettings.fab_icon_size || 24}px`,
                                  color: appSettings.fab_icon_color || '#ffffff'
                                }}
                              />
                            </div>
                          </div>

                          <span className={`opacity-90 ${appSettings.nav_text_weight || 'font-medium'}`} style={{ fontSize: `${appSettings.nav_text_size || 10}px`, color: appSettings.nav_text_color || '#ffffff' }}>Panduan</span>
                          <span className={`opacity-90 ${appSettings.nav_text_weight || 'font-medium'}`} style={{ fontSize: `${appSettings.nav_text_size || 10}px`, color: appSettings.nav_text_color || '#ffffff' }}>Keluar</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {settingsTab === 'banner' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                    <div>
                      <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
                        <ImageIcon className="w-4 h-4 text-emerald-500" />
                        Pengaturan Banner Hero & Ilustrasi
                      </h3>
                      <p className="text-[11px] font-medium text-slate-400 mt-0.5">
                        Atur tampilan banner greeting di beranda user, lebar/padding, jarak ke tab filter, dan upload gambar kustom.
                      </p>
                    </div>
                  </div>

                  {/* Toggle Enable Banner */}
                  <div className={`p-4 rounded-2xl border ${themeClasses.border} ${themeClasses.bgSecondary} flex items-center justify-between gap-4`}>
                    <div>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Tampilkan Banner Hero</p>
                      <p className="text-[10px] text-slate-400 font-medium">Aktifkan atau sembunyikan banner salam di beranda user</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer shrink-0">
                      <input 
                        type="checkbox" 
                        checked={appSettings.banner_enabled !== false} 
                        onChange={e => setAppSettings({...appSettings, banner_enabled: e.target.checked})}
                        className="sr-only peer" 
                      />
                      <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:after:border-slate-600 peer-checked:bg-emerald-600"></div>
                    </label>
                  </div>

                  {/* Spacing Controls */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Padding Y (Tinggi / Padding Atas-Bawah) */}
                    <div className={`p-4 rounded-2xl border ${themeClasses.border} ${themeClasses.bgSecondary} space-y-3`}>
                      <div className="flex justify-between items-center">
                        <label className="text-[10px] font-black text-slate-400 capitalize tracking-widest">Padding Atas & Bawah</label>
                        <span className="text-xs font-black text-emerald-500 px-2 py-0.5 rounded-md bg-emerald-500/10">
                          {appSettings.banner_padding_y ?? 14} px
                        </span>
                      </div>
                      <input 
                        type="range"
                        min="4"
                        max="40"
                        step="1"
                        value={appSettings.banner_padding_y ?? 14}
                        onChange={e => setAppSettings({...appSettings, banner_padding_y: parseInt(e.target.value)})}
                        className="w-full accent-emerald-600 cursor-pointer"
                      />
                      <p className="text-[9px] text-slate-400 font-medium">Mengecilkan atau memperbesar ruang vertikal di dalam banner.</p>
                    </div>

                    {/* Margin Bottom (Jarak ke Filter Tab) */}
                    <div className={`p-4 rounded-2xl border ${themeClasses.border} ${themeClasses.bgSecondary} space-y-3`}>
                      <div className="flex justify-between items-center">
                        <label className="text-[10px] font-black text-slate-400 capitalize tracking-widest">Jarak ke Tab Filter</label>
                        <span className="text-xs font-black text-emerald-500 px-2 py-0.5 rounded-md bg-emerald-500/10">
                          {appSettings.banner_margin_bottom ?? 2} px
                        </span>
                      </div>
                      <input 
                        type="range"
                        min="0"
                        max="30"
                        step="1"
                        value={appSettings.banner_margin_bottom ?? 2}
                        onChange={e => setAppSettings({...appSettings, banner_margin_bottom: parseInt(e.target.value)})}
                        className="w-full accent-emerald-600 cursor-pointer"
                      />
                      <p className="text-[9px] text-slate-400 font-medium">Atur kerapatan jarak antara banner dengan tab Hari Ini / Semua.</p>
                    </div>
                  </div>

                  {/* Unified Card Radius Setting (1 Pengaturan untuk Banner, Stat, & Card Tiket) */}
                  <div className={`p-4 rounded-2xl border ${themeClasses.border} ${themeClasses.bgSecondary} space-y-3`}>
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-black text-slate-400 capitalize tracking-widest flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                        Kelengkungan Sudut (Border Radius)
                      </label>
                      <span className="text-xs font-black text-emerald-500 px-2 py-0.5 rounded-md bg-emerald-500/10">
                        {appSettings.ui_card_radius ?? 24} px
                      </span>
                    </div>
                    <input 
                      type="range"
                      min="8"
                      max="36"
                      step="2"
                      value={appSettings.ui_card_radius ?? 24}
                      onChange={e => setAppSettings({...appSettings, ui_card_radius: parseInt(e.target.value)})}
                      className="w-full accent-emerald-600 cursor-pointer"
                    />
                    <p className="text-[9px] text-slate-400 font-medium">
                      1 Pengaturan terpusat untuk kelengkungan (curve) Banner Hero, Kartu Filter Stat, dan Kartu List Tiket agar konsisten 100%.
                    </p>
                  </div>

                  {/* Image Type Selection */}
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 capitalize tracking-widest ml-1">Tipe Ilustrasi / Gambar</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setAppSettings({...appSettings, banner_image_type: 'default_vector'})}
                        className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col gap-1.5 ${
                          (appSettings.banner_image_type || 'default_vector') === 'default_vector'
                            ? 'bg-emerald-600/10 border-emerald-500 text-emerald-600 dark:text-emerald-400 shadow-sm'
                            : `${themeClasses.bgSecondary} ${themeClasses.border} text-slate-400 hover:border-slate-400`
                        }`}
                      >
                        <span className="text-xs font-black">Vektor Default (Teknisi IT)</span>
                        <span className="text-[10px] opacity-80 font-medium">Ilustrasi karakter teknisi dengan kotak perkakas</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setAppSettings({...appSettings, banner_image_type: 'custom_image'})}
                        className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col gap-1.5 ${
                          appSettings.banner_image_type === 'custom_image'
                            ? 'bg-emerald-600/10 border-emerald-500 text-emerald-600 dark:text-emerald-400 shadow-sm'
                            : `${themeClasses.bgSecondary} ${themeClasses.border} text-slate-400 hover:border-slate-400`
                        }`}
                      >
                        <span className="text-xs font-black">Upload Gambar Kustom</span>
                        <span className="text-[10px] opacity-80 font-medium">Gunakan foto, karakter 3D, atau logo pilihan Anda</span>
                      </button>
                    </div>
                  </div>

                  {/* Custom Image Upload Section */}
                  {appSettings.banner_image_type === 'custom_image' && (
                    <div className={`p-4 rounded-2xl border ${themeClasses.border} ${themeClasses.bgSecondary} space-y-4`}>
                      <label className="text-[10px] font-black text-slate-400 capitalize tracking-widest flex items-center gap-1.5">
                        <Upload className="w-3.5 h-3.5 text-emerald-500" /> Upload Gambar Banner
                      </label>

                      <div className="flex flex-col sm:flex-row items-center gap-4 p-3 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
                        <div className="w-24 h-24 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
                          {appSettings.banner_custom_image ? (
                            <img src={appSettings.banner_custom_image} alt="Banner Custom" className="w-full h-full object-contain p-1" />
                          ) : (
                            <ImageIcon className="w-8 h-8 text-slate-300" />
                          )}
                        </div>

                        <div className="flex-1 text-center sm:text-left space-y-2">
                          <p className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                            Pilih gambar transparan (PNG/SVG/WebP) untuk hasil terbaik.
                          </p>
                          <div className="flex flex-wrap justify-center sm:justify-start gap-2">
                            <label className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[10px] font-black capitalize tracking-widest cursor-pointer transition-all flex items-center gap-1.5">
                              <Upload className="w-3 h-3" /> Pilih File Gambar
                              <input 
                                type="file" 
                                accept="image/*" 
                                className="hidden" 
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    const reader = new FileReader();
                                    reader.onloadend = () => {
                                      setAppSettings({...appSettings, banner_custom_image: reader.result as string});
                                    };
                                    reader.readAsDataURL(file);
                                  }
                                }} 
                              />
                            </label>
                            {appSettings.banner_custom_image && (
                              <button 
                                type="button"
                                onClick={() => setAppSettings({...appSettings, banner_custom_image: ''})}
                                className="px-4 py-2 bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white rounded-xl text-[10px] font-black capitalize tracking-widest transition-all"
                              >
                                Hapus Gambar
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Image/Vector Size Slider */}
                  <div className={`p-4 rounded-2xl border ${themeClasses.border} ${themeClasses.bgSecondary} space-y-3`}>
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-black text-slate-400 capitalize tracking-widest">Besar / Ukuran Gambar / Vektor</label>
                      <span className="text-xs font-black text-emerald-500 px-2 py-0.5 rounded-md bg-emerald-500/10">
                        {appSettings.banner_image_size ?? 110} px
                      </span>
                    </div>
                    <input 
                      type="range"
                      min="60"
                      max="240"
                      step="5"
                      value={appSettings.banner_image_size ?? 110}
                      onChange={e => setAppSettings({...appSettings, banner_image_size: parseInt(e.target.value)})}
                      className="w-full accent-emerald-600 cursor-pointer"
                    />
                    <p className="text-[9px] text-slate-400 font-medium">Atur skala besar kecilnya ilustrasi/gambar di sisi kanan banner.</p>
                  </div>

                  {/* Live Banner Preview Box */}
                  <div className="space-y-2 pt-2">
                    <label className="text-[10px] font-black text-slate-400 capitalize tracking-widest ml-1 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-amber-500" /> Live Preview Banner
                    </label>
                    <div className="p-3 bg-slate-100 dark:bg-slate-950/80 rounded-2xl border border-slate-200/80 dark:border-slate-800">
                      <UserHeroBanner 
                        currentUser={{ full_name: adminUser?.username || 'Admin IT' }}
                        tickets={[]}
                        isDark={isDark}
                        primaryColor={primaryColor}
                        appSettings={appSettings}
                      />
                    </div>
                  </div>
                </div>
              )}

              {settingsTab === 'login' && (
                <div className="space-y-4">
                  <h3 className="text-sm font-black text-emerald-600 capitalize tracking-widest flex items-center gap-2">
                    <Edit3 className="w-4 h-4" /> Atur Halaman Login
                  </h3>
                  <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
                    Kustomisasi tampilan halaman awal login (pilihan nama & index user) agar sesuai dengan kebutuhan operasional di lapangan.
                  </p>

                  {/* Upload Logo Halaman Login */}
                  <div className="space-y-1.5 pt-2">
                    <label className="text-[10px] font-black text-slate-400 capitalize tracking-widest ml-1">Logo Halaman Login</label>
                    <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50">
                      <div className="w-16 h-16 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center overflow-hidden shadow-sm">
                        {appSettings.login_logo ? (
                          <img src={appSettings.login_logo} alt="Login Logo" className="w-full h-full object-cover" />
                        ) : appSettings.custom_logo ? (
                          <img src={appSettings.custom_logo} alt="Application Logo" className="w-full h-full object-cover" />
                        ) : (
                          <ImageIcon className="w-8 h-8 text-slate-300" />
                        )}
                      </div>
                      <div className="flex-1 text-center sm:text-left">
                        <p className="text-[10px] font-bold text-slate-500 mb-2">Upload logo khusus untuk halaman login kustom. Jika kosong, logo ini akan menggunakan Logo Aplikasi Utama.</p>
                        <div className="flex flex-wrap justify-center sm:justify-start gap-2">
                          <label className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-[10px] font-black capitalize tracking-widest cursor-pointer hover:bg-emerald-700 transition-all flex items-center gap-2">
                            <Upload className="w-3 h-3" /> Pilih Gambar
                            <input 
                              type="file" 
                              accept="image/*" 
                              className="hidden" 
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const reader = new FileReader();
                                  reader.onloadend = () => {
                                    setAppSettings({...appSettings, login_logo: reader.result as string});
                                  };
                                  reader.readAsDataURL(file);
                                }
                              }} 
                            />
                          </label>
                          {appSettings.login_logo && (
                            <button 
                              type="button"
                              onClick={() => setAppSettings({...appSettings, login_logo: ''})}
                              className="px-4 py-2 bg-rose-500/10 text-rose-500 rounded-xl text-[10px] font-black capitalize tracking-widest hover:bg-rose-500 hover:text-white transition-all"
                            >
                              Reset Logo Login
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Judul Login */}
                  <div className="space-y-1.5 pt-2">
                    <label className="text-[10px] font-black text-slate-400 capitalize tracking-widest ml-1">Judul Login</label>
                    <input 
                      type="text"
                      placeholder="Masuk ke Aplikasi"
                      className={`w-full px-4 py-2.5 rounded-xl border text-xs sm:text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-500 transition-all ${themeClasses.bgSecondary} ${themeClasses.border} ${themeClasses.text}`}
                      value={appSettings.login_title || ''}
                      onChange={e => setAppSettings({...appSettings, login_title: e.target.value})}
                    />
                  </div>

                  {/* Subjudul Login */}
                  <div className="space-y-1.5 pt-2">
                    <label className="text-[10px] font-black text-slate-400 capitalize tracking-widest ml-1">Subjudul Login</label>
                    <input 
                      type="text"
                      placeholder="Silakan pilih nama dan masukkan index Anda"
                      className={`w-full px-4 py-2.5 rounded-xl border text-xs sm:text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-500 transition-all ${themeClasses.bgSecondary} ${themeClasses.border} ${themeClasses.text}`}
                      value={appSettings.login_subtitle || ''}
                      onChange={e => setAppSettings({...appSettings, login_subtitle: e.target.value})}
                    />
                  </div>

                  {/* Edit Nama Kolom (Nama Anda) */}
                  <div className="space-y-1.5 pt-2">
                    <label className="text-[10px] font-black text-slate-400 capitalize tracking-widest ml-1">Nama Kolom (User)</label>
                    <input 
                      type="text"
                      placeholder="Nama Anda"
                      className={`w-full px-4 py-2.5 rounded-xl border text-xs sm:text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-500 transition-all ${themeClasses.bgSecondary} ${themeClasses.border} ${themeClasses.text}`}
                      value={appSettings.login_name_label || ''}
                      onChange={e => setAppSettings({...appSettings, login_name_label: e.target.value})}
                    />
                  </div>

                  {/* Edit Nama Kolom Index */}
                  <div className="space-y-1.5 pt-2">
                    <label className="text-[10px] font-black text-slate-400 capitalize tracking-widest ml-1">Nama Kolom (Index)</label>
                    <input 
                      type="text"
                      placeholder="Index (KDK)"
                      className={`w-full px-4 py-2.5 rounded-xl border text-xs sm:text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-500 transition-all ${themeClasses.bgSecondary} ${themeClasses.border} ${themeClasses.text}`}
                      value={appSettings.login_index_label || ''}
                      onChange={e => setAppSettings({...appSettings, login_index_label: e.target.value})}
                    />
                  </div>

                  {/* Edit Placeholder Kolom Index */}
                  <div className="space-y-1.5 pt-2">
                    <label className="text-[10px] font-black text-slate-400 capitalize tracking-widest ml-1">Placeholder Kolom (Index)</label>
                    <input 
                      type="text"
                      placeholder="Masukkan index Anda..."
                      className={`w-full px-4 py-2.5 rounded-xl border text-xs sm:text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-500 transition-all ${themeClasses.bgSecondary} ${themeClasses.border} ${themeClasses.text}`}
                      value={appSettings.login_index_placeholder || ''}
                      onChange={e => setAppSettings({...appSettings, login_index_placeholder: e.target.value})}
                    />
                  </div>

                  {/* Edit Warna Tombol Masuk */}
                  <div className="space-y-1.5 pt-2">
                    <label className="text-[10px] font-black text-slate-400 capitalize tracking-widest ml-1">Warna Latar Tombol Masuk (Hex)</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={appSettings.login_button_color || '#4f46e5'}
                        onChange={e => setAppSettings({...appSettings, login_button_color: e.target.value})}
                        className="w-10 h-10 rounded cursor-pointer border-0 p-0"
                      />
                      <input 
                        type="text"
                        placeholder="#4f46e5"
                        className={`flex-1 px-4 py-2.5 rounded-xl border text-xs sm:text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-500 transition-all ${themeClasses.bgSecondary} ${themeClasses.border} ${themeClasses.text}`}
                        value={appSettings.login_button_color || ''}
                        onChange={e => setAppSettings({...appSettings, login_button_color: e.target.value})}
                      />
                    </div>
                  </div>

                  {/* Edit Warna Teks Tombol Masuk */}
                  <div className="space-y-1.5 pt-2">
                    <label className="text-[10px] font-black text-slate-400 capitalize tracking-widest ml-1">Warna Teks Tombol Masuk (Hex)</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={appSettings.login_button_text_color || '#ffffff'}
                        onChange={e => setAppSettings({...appSettings, login_button_text_color: e.target.value})}
                        className="w-10 h-10 rounded cursor-pointer border-0 p-0"
                      />
                      <input 
                        type="text"
                        placeholder="#ffffff"
                        className={`flex-1 px-4 py-2.5 rounded-xl border text-xs sm:text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-500 transition-all ${themeClasses.bgSecondary} ${themeClasses.border} ${themeClasses.text}`}
                        value={appSettings.login_button_text_color || ''}
                        onChange={e => setAppSettings({...appSettings, login_button_text_color: e.target.value})}
                      />
                    </div>
                  </div>

                  {/* Panduan Login Toggle */}
                  <div className="pt-2 flex items-center">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input 
                        type="checkbox"
                        className="w-4 h-4 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500"
                        checked={appSettings.login_guide_enabled === undefined ? true : !!appSettings.login_guide_enabled}
                        onChange={e => setAppSettings({...appSettings, login_guide_enabled: e.target.checked})}
                      />
                      <span className="text-[10px] font-black text-slate-400 capitalize tracking-widest">Tampilkan Panduan Login</span>
                    </label>
                  </div>

                  {/* Isi Konten Panduan Login */}
                  {(appSettings.login_guide_enabled === undefined || !!appSettings.login_guide_enabled) && (
                    <div className="space-y-1.5 pt-2">
                      <label className="text-[10px] font-black text-slate-400 capitalize tracking-widest ml-1">Isi Konten Panduan Login</label>
                      <textarea 
                        rows={4}
                        placeholder="Masukkan panduan cara login..."
                        className={`w-full px-4 py-2.5 rounded-xl border text-xs font-medium outline-none focus:ring-2 focus:ring-emerald-500 transition-all ${themeClasses.bgSecondary} ${themeClasses.border} ${themeClasses.text}`}
                        value={appSettings.login_guide_content || ''}
                        onChange={e => setAppSettings({...appSettings, login_guide_content: e.target.value})}
                      />
                      <span className="text-[9px] text-slate-400 font-medium leading-normal block">Panduan ini akan ditampilkan saat pengguna mengklik tombol "Panduan Login" di bawah tombol Masuk.</span>
                    </div>
                  )}
                </div>
              )}

              {settingsTab === 'notifications' && (
                <div className="space-y-6">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-black text-slate-400 capitalize tracking-widest ml-1">Email Notifikasi</label>
                      <button 
                        type="button"
                        onClick={() => setShowEmailInput(true)}
                        className="text-[10px] font-black text-emerald-600 capitalize tracking-widest hover:underline flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" /> Tambah Email
                      </button>
                    </div>
                    
                    {showEmailInput && (
                      <div className="flex gap-2">
                        <input 
                          type="email"
                          placeholder="email@example.com"
                          className={`flex-1 px-4 py-2 rounded-xl border text-xs font-medium outline-none focus:ring-2 focus:ring-emerald-500 transition-all ${themeClasses.bgSecondary} ${themeClasses.border} ${themeClasses.text}`}
                          value={newEmailInput}
                          onChange={e => setNewEmailInput(e.target.value)}
                        />
                        <button 
                          type="button"
                          onClick={() => {
                            const currentEmails = Array.isArray(appSettings.notification_emails) ? appSettings.notification_emails : (appSettings.notification_emails ? [appSettings.notification_emails] : []);
                            if (newEmailInput && !currentEmails.includes(newEmailInput)) {
                              setAppSettings({...appSettings, notification_emails: [...currentEmails, newEmailInput]});
                              setNewEmailInput('');
                              setShowEmailInput(false);
                            }
                          }}
                          className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold"
                        >
                          Add
                        </button>
                      </div>
                    )}

                    <div className="space-y-2">
                      {(!appSettings.notification_emails || (Array.isArray(appSettings.notification_emails) ? appSettings.notification_emails.length === 0 : !appSettings.notification_emails)) ? (
                        <p className="text-xs text-slate-400 italic text-center py-4">Belum ada email notifikasi.</p>
                      ) : (
                        (Array.isArray(appSettings.notification_emails) ? appSettings.notification_emails : [appSettings.notification_emails]).map((email: string, idx: number) => (
                          <div key={`notif-email-${email}-${idx}`} className={`flex items-center justify-between p-3 rounded-xl border ${themeClasses.bgSecondary} ${themeClasses.border}`}>
                            <div className="flex items-center gap-3">
                              <Mail className="w-4 h-4 text-slate-400" />
                              <span className="text-xs font-bold">{email}</span>
                            </div>
                            <button 
                              type="button"
                              onClick={() => {
                                const currentEmails = Array.isArray(appSettings.notification_emails) ? appSettings.notification_emails : [appSettings.notification_emails];
                                setAppSettings({...appSettings, notification_emails: currentEmails.filter((e: string) => e !== email)});
                              }}
                              className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <label className="text-[10px] font-black text-slate-400 capitalize tracking-widest ml-1">Integrasi Telegram</label>
                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <label className={`text-[9px] font-bold ml-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Bot Token</label>
                        <div className="relative">
                          <Send className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                          <input 
                            type="password"
                            placeholder="123456789:ABCDEF..."
                            className={`w-full pl-10 pr-4 py-2 rounded-xl border text-xs font-mono outline-none focus:ring-2 focus:ring-emerald-500 transition-all ${themeClasses.bgSecondary} ${themeClasses.border} ${themeClasses.text}`}
                            value={appSettings.telegram_bot_token}
                            onChange={e => setAppSettings({...appSettings, telegram_bot_token: e.target.value})}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {settingsTab === 'data' && (
                <div className="space-y-8">
                  <div className="p-4 rounded-2xl bg-amber-50 border border-amber-100">
                    <div className="flex gap-3">
                      <Database className="w-5 h-5 text-amber-600 shrink-0" />
                      <div>
                        <h4 className="text-xs font-black text-amber-900 capitalize tracking-widest">Data Management</h4>
                        <p className="text-[10px] text-amber-700 font-medium leading-relaxed mt-1">
                          Kelola personil IT, departemen, kategori, dan ekspor data.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <label className="text-[10px] font-black text-slate-400 capitalize tracking-widest ml-1">Otomatis Hapus Foto Tiket</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className={`text-[9px] font-bold ml-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Durasi Penyimpanan Foto Tiket</label>
                        <select 
                          className={`w-full px-4 py-2.5 rounded-xl border text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500 transition-all ${themeClasses.bgSecondary} ${themeClasses.border} ${themeClasses.text}`}
                          value={appSettings.photo_cleanup_duration || '24'}
                          onChange={e => setAppSettings({...appSettings, photo_cleanup_duration: e.target.value})}
                        >
                          <option value="24">24 Jam (1 Hari)</option>
                          <option value="48">48 Jam (2 Hari)</option>
                          <option value="60">60 Jam (2.5 Hari)</option>
                          <option value="168">1 Minggu (7 Hari)</option>
                        </select>
                        <p className="text-[9px] text-slate-400 italic ml-1">Foto tiket akan dihapus otomatis setelah durasi ini terlewati.</p>
                      </div>
                    </div>
                  </div>

                  {/* Opsi & Lokasi Penyimpanan Media (Foto & TTD) */}
                  <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <div>
                      <label className="text-[10px] font-black text-slate-400 capitalize tracking-widest ml-1">Penyimpanan Media & Foto (Database vs Disk Server)</label>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium ml-1 mt-0.5">Pilih lokasi penyimpanan foto member, tanda tangan digital, dan foto tiket.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Opsi Mode */}
                      <div className="space-y-1.5">
                        <label className={`text-[9px] font-bold ml-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Lokasi Storage Media</label>
                        <select 
                          className={`w-full px-4 py-2.5 rounded-xl border text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500 transition-all ${themeClasses.bgSecondary} ${themeClasses.border} ${themeClasses.text}`}
                          value={appSettings.file_storage_mode || 'db'}
                          onChange={e => setAppSettings({...appSettings, file_storage_mode: e.target.value})}
                        >
                          <option value="db">Database SQLite (Base64 Inline)</option>
                          <option value="local">Folder Disk Windows / Lokal Server</option>
                        </select>
                        <p className="text-[9px] text-slate-400 italic ml-1">
                          {appSettings.file_storage_mode === 'local' 
                            ? 'Media disimpan ke folder fisik di server Windows. Nama file otomatis disesuaikan dengan nama anggota/tiket.'
                            : 'Media disimpan langsung di dalam database dalam format Base64.'}
                        </p>
                      </div>

                      {/* Lokasi Folder Path */}
                      {appSettings.file_storage_mode === 'local' && (
                        <div className="space-y-1.5">
                          <label className={`text-[9px] font-bold ml-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Path Folder Server Windows</label>
                          <input 
                            type="text"
                            placeholder="uploads (atau contoh: C:\AppUploads)"
                            className={`w-full px-4 py-2.5 rounded-xl border text-xs font-mono font-bold outline-none focus:ring-2 focus:ring-emerald-500 transition-all ${themeClasses.bgSecondary} ${themeClasses.border} ${themeClasses.text}`}
                            value={appSettings.file_storage_path || 'uploads'}
                            onChange={e => setAppSettings({...appSettings, file_storage_path: e.target.value})}
                          />
                          <p className="text-[9px] text-slate-400 italic ml-1">Gunakan 'uploads' atau path absolut seperti C:/AppUploads</p>
                        </div>
                      )}
                    </div>

                    {/* Tombol Migrasi Data Eksisting */}
                    <div className={`p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${themeClasses.bgSecondary} ${themeClasses.border}`}>
                      <div>
                        <h5 className="text-xs font-bold text-slate-800 dark:text-slate-200">Migrasi Media Eksisting</h5>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Konversi foto & TTD yang sudah ada di database ke folder disk server atau sebaliknya secara otomatis.</p>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <button
                          type="button"
                          disabled={isMigrating}
                          onClick={() => handleMigrateMedia('local')}
                          className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg text-[10px] font-bold shadow-xs transition-all flex items-center gap-1.5"
                        >
                          {isMigrating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <HardDrive className="w-3.5 h-3.5" />}
                          Migrasi ke Disk
                        </button>
                        <button
                          type="button"
                          disabled={isMigrating}
                          onClick={() => handleMigrateMedia('db')}
                          className="px-3 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white rounded-lg text-[10px] font-bold shadow-xs transition-all flex items-center gap-1.5"
                        >
                          {isMigrating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Database className="w-3.5 h-3.5" />}
                          Migrasi ke DB
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* IT Personnel */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <label className={`text-[10px] font-black ${themeClasses.textMuted} capitalize tracking-widest ml-1`}>Tim IT</label>
                        <button 
                          type="button"
                          onClick={() => {
                            setAddingType(addingType === 'it' ? null : 'it');
                            setEditingIt(null);
                            setItName('');
                            setItRole('Staff IT Support');
                          }} 
                          className="text-[10px] font-black text-emerald-500 capitalize tracking-widest hover:underline"
                        >
                          {addingType === 'it' ? 'Batal' : '+ Tambah IT'}
                        </button>
                      </div>
                      
                      {addingType === 'it' && (
                        <div className={`p-4 rounded-xl border-2 border-emerald-500/30 space-y-3 ${themeClasses.bgSecondary}`}>
                          <div className="grid grid-cols-2 gap-2">
                            <input 
                              autoFocus
                              type="text"
                              value={itName}
                              onChange={e => setItName(e.target.value)}
                              placeholder="Nama IT..."
                              className={`w-full px-3 py-2 rounded-lg border text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500 ${themeClasses.bgSecondary} ${themeClasses.border} ${themeClasses.text}`}
                              onKeyDown={e => e.key === 'Enter' && handleSaveItPersonnel()}
                            />
                            <select 
                              className={`w-full px-3 py-2 rounded-lg border text-xs outline-none focus:ring-2 focus:ring-emerald-500 ${themeClasses.bgSecondary} ${themeClasses.border} ${themeClasses.text}`}
                              value={itRole}
                              onChange={e => setItRole(e.target.value)}
                            >
                              <option value="Staff IT Support">Staff IT Support</option>
                              <option value="Staff App Support">Staff App Support</option>
                              <option value="Super Admin">Super Admin</option>
                            </select>
                          </div>
                          <div className="flex gap-2">
                            <button 
                              type="button"
                              onClick={handleSaveItPersonnel}
                              className="flex-1 py-2 bg-emerald-600 text-white rounded-lg text-[10px] font-bold capitalize tracking-widest"
                            >
                              {editingIt ? 'Simpan Perubahan' : 'Simpan IT'}
                            </button>
                            <button 
                              type="button"
                              onClick={() => {
                                setAddingType(null);
                                setEditingIt(null);
                                setItName('');
                                setItRole('Staff IT Support');
                              }}
                              className={`flex-1 py-2 rounded-lg text-[10px] font-bold capitalize tracking-widest border ${themeClasses.border} ${themeClasses.textMuted}`}
                            >
                              Batal
                            </button>
                          </div>
                        </div>
                      )}

                      <div className="flex flex-wrap gap-2">
                        {Array.isArray(itPersonnel) && itPersonnel.map((it, idx) => (
                          <div key={`it-${it.id || it.name}-${idx}`} className={`flex items-center gap-2 ${themeClasses.bgSecondary} px-3 py-1.5 rounded-lg border ${themeClasses.border} group`}>
                            <div className="flex flex-col">
                              <span className={`text-xs font-bold ${themeClasses.text}`}>{it.name}</span>
                              {it.role && <span className={`text-[9px] ${themeClasses.textMuted}`}>{it.role}</span>}
                            </div>
                            <div className="flex items-center gap-1.5 opacity-80 hover:opacity-100 transition-opacity ml-2">
                              <button type="button" onClick={() => handleEditItPersonnel(it)} className="text-blue-500 hover:text-blue-400">
                                <Edit3 className="w-3 h-3" />
                              </button>
                              <button type="button" onClick={() => handleManagementAction('it', 'delete', it)} className="text-rose-500 hover:text-rose-400">
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Departments */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <label className={`text-[10px] font-black ${themeClasses.textMuted} capitalize tracking-widest ml-1`}>Departemen</label>
                        <button 
                          type="button"
                          onClick={() => setAddingType(addingType === 'dept' ? null : 'dept')} 
                          className="text-[10px] font-black text-emerald-500 capitalize tracking-widest hover:underline"
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
                            className={`flex-1 border rounded-xl px-3 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500 ${themeClasses.input}`}
                            onKeyDown={e => e.key === 'Enter' && handleManagementAction('dept', 'add')}
                          />
                          <button 
                            type="button"
                            onClick={() => handleManagementAction('dept', 'add')}
                            className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-[10px] font-black capitalize"
                          >
                            Simpan
                          </button>
                        </div>
                      )}

                      <div className="flex flex-wrap gap-2">
                        {Array.isArray(departments) && departments.map((dept, idx) => (
                          <div key={`dept-${dept.id || dept.name}-${idx}`} className={`flex items-center gap-2 ${themeClasses.bgSecondary} px-3 py-1.5 rounded-lg border ${themeClasses.border} group`}>
                            <span className={`text-xs font-bold ${themeClasses.text}`}>{dept.name}</span>
                            <button type="button" onClick={() => handleManagementAction('dept', 'delete', dept)} className="text-rose-500 hover:text-rose-400 opacity-80 hover:opacity-100 transition-opacity ml-2">
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Categories */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <label className={`text-[10px] font-black ${themeClasses.textMuted} capitalize tracking-widest ml-1`}>Kategori</label>
                        <button 
                          type="button"
                          onClick={() => setAddingType(addingType === 'cat' ? null : 'cat')} 
                          className="text-[10px] font-black text-emerald-500 capitalize tracking-widest hover:underline"
                        >
                          {addingType === 'cat' ? 'Batal' : '+ Tambah Kategori'}
                        </button>
                      </div>

                      {addingType === 'cat' && (
                        <div className="flex flex-col gap-2 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                          <div className="flex gap-2">
                            <input 
                              autoFocus
                              type="text"
                              value={newItemName}
                              onChange={e => setNewItemName(e.target.value)}
                              placeholder="Nama Kategori baru..."
                              className={`flex-1 border rounded-xl px-3 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500 ${themeClasses.input}`}
                            />
                          </div>
                          <div className="flex gap-2 items-center">
                            {isCustomNewItemJenis ? (
                              <div className="flex items-center gap-1 flex-1">
                                <input 
                                  type="text"
                                  autoFocus
                                  value={newItemJenisMasalah}
                                  onChange={e => setNewItemJenisMasalah && setNewItemJenisMasalah(e.target.value)}
                                  placeholder="Jenis Masalah Baru (cth: Jaringan)..."
                                  className={`w-full border rounded-xl px-3 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500 ${themeClasses.input}`}
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    setIsCustomNewItemJenis(false);
                                    setNewItemJenisMasalah && setNewItemJenisMasalah('Hardware');
                                  }}
                                  className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                                  title="Pilih dari daftar"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : (
                              <select
                                value={newItemJenisMasalah}
                                onChange={e => {
                                  if (e.target.value === '__NEW__') {
                                    setIsCustomNewItemJenis(true);
                                    setNewItemJenisMasalah && setNewItemJenisMasalah('');
                                  } else {
                                    setNewItemJenisMasalah && setNewItemJenisMasalah(e.target.value);
                                  }
                                }}
                                className={`w-36 border rounded-xl px-3 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500 ${themeClasses.input}`}
                              >
                                {allJenisMasalahList.map((jm, idx) => (
                                  <option key={`jm-opt-${jm}-${idx}`} value={jm}>{jm}</option>
                                ))}
                                <option value="__NEW__">+ Tambah Jenis Baru...</option>
                              </select>
                            )}
                            <input 
                              type="number"
                              min="0"
                              value={newItemResponseTime === 0 ? '' : newItemResponseTime}
                              onChange={e => setNewItemResponseTime && setNewItemResponseTime(e.target.value === '' ? 0 : parseInt(e.target.value, 10))}
                              placeholder="SLA Waktu Respon (Jam)..."
                              className={`flex-1 border rounded-xl px-3 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500 ${themeClasses.input}`}
                              title="Target waktu respon (SLA) dalam satuan Jam. Kosongkan atau masukkan 0 untuk Tanpa SLA."
                            />
                            <span className={`text-[10px] font-black uppercase tracking-widest ${themeClasses.textMuted}`}>JAM</span>
                          </div>
                          <div className="flex flex-col gap-1">
                            <label className={`text-[9px] font-black uppercase tracking-wider ${themeClasses.textMuted}`}>Pilih IT Penanggung Jawab (Multi-PIC / Prioritas Sequential)</label>
                            <div className="flex flex-wrap gap-1.5 p-2 border rounded-xl bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800">
                              {adminUsers.map((user, uIdx) => {
                                const selectedIndex = (editingCategoryAssignedToList || []).indexOf(user.username);
                                const isSelected = selectedIndex !== -1;
                                return (
                                  <button
                                    key={`usr-pic-${user.id || user.username}-${uIdx}`}
                                    type="button"
                                    onClick={() => {
                                      if (isSelected) {
                                        const next = editingCategoryAssignedToList.filter(u => u !== user.username);
                                        setEditingCategoryAssignedToList(next);
                                        setEditingCategoryAssignedTo(next[0] || '');
                                      } else {
                                        const next = [...editingCategoryAssignedToList, user.username];
                                        setEditingCategoryAssignedToList(next);
                                        setEditingCategoryAssignedTo(next[0] || '');
                                      }
                                    }}
                                    className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 border transition-all ${
                                      isSelected
                                        ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm'
                                        : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700'
                                    }`}
                                  >
                                    <span className={`w-1.5 h-1.5 rounded-full ${Number(user.is_on_duty) === 0 ? 'bg-rose-400' : 'bg-emerald-400'}`} title={Number(user.is_on_duty) === 0 ? 'Off Duty' : 'Siap Kerja'} />
                                    <span>{user.full_name || user.username}</span>
                                    {isSelected && (
                                      <span className="bg-emerald-800 text-emerald-100 text-[9px] px-1.5 rounded-full font-black">
                                        P{selectedIndex + 1}
                                      </span>
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                          <div className="flex justify-end pt-1">
                            <button 
                              type="button"
                              onClick={() => {
                                handleManagementAction('cat', 'add');
                                setEditingCategoryAssignedToList([]);
                              }}
                              className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2 rounded-xl text-xs font-black capitalize shadow-sm transition-all"
                            >
                              Simpan Kategori
                            </button>
                          </div>
                        </div>
                      )}

                      <div className="max-h-64 overflow-y-auto p-2 border border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-slate-900/40 space-y-2">
                        {Array.isArray(categories) && categories.length > 0 ? (
                          categories.map((cat, cIdx) => {
                          const getCatPics = (categoryItem: any): string[] => {
                            if (categoryItem.assigned_to_list) {
                              try {
                                const parsed = typeof categoryItem.assigned_to_list === 'string' ? JSON.parse(categoryItem.assigned_to_list) : categoryItem.assigned_to_list;
                                if (Array.isArray(parsed) && parsed.length > 0) return parsed;
                              } catch {
                                const list = String(categoryItem.assigned_to_list).split(',').map(s => s.trim()).filter(Boolean);
                                if (list.length > 0) return list;
                              }
                            }
                            return categoryItem.assigned_to ? [categoryItem.assigned_to] : [];
                          };

                          const pics = getCatPics(cat);

                          return editingCategoryId === cat.id ? (
                            <div key={`cat-edit-${cat.id || cat.name}-${cIdx}`} className={`flex flex-col gap-2 ${themeClasses.bgSecondary} p-3 rounded-xl border border-emerald-500 w-full max-w-sm`}>
                              <div className="flex flex-col gap-0.5">
                                <label className={`text-[8px] font-black uppercase tracking-wider ${themeClasses.textMuted}`}>Nama Kategori</label>
                                <input 
                                  type="text"
                                  value={editingCategoryName}
                                  onChange={e => setEditingCategoryName(e.target.value)}
                                  className={`w-full border rounded-lg px-2 py-1 text-xs font-bold outline-none focus:ring-1 focus:ring-emerald-500 ${themeClasses.input}`}
                                />
                              </div>
                              <div className="flex flex-col gap-0.5">
                                <label className={`text-[8px] font-black uppercase tracking-wider ${themeClasses.textMuted}`}>SLA Waktu Respon (Jam)</label>
                                <div className="flex items-center gap-1.5">
                                  <input 
                                    type="number"
                                    min="0"
                                    value={editingCategoryResponseTime === 0 ? '' : editingCategoryResponseTime}
                                    onChange={e => setEditingCategoryResponseTime(e.target.value === '' ? 0 : parseInt(e.target.value, 10))}
                                    className={`flex-1 border rounded-lg px-2 py-1 text-xs font-bold outline-none focus:ring-1 focus:ring-emerald-500 ${themeClasses.input}`}
                                  />
                                  <span className={`text-[8px] font-black uppercase tracking-wider ${themeClasses.textMuted}`}>JAM</span>
                                </div>
                              </div>
                              <div className="flex flex-col gap-0.5">
                                <label className={`text-[8px] font-black uppercase tracking-wider ${themeClasses.textMuted}`}>Jenis Masalah</label>
                                {isCustomEditingJenis ? (
                                  <div className="flex items-center gap-1">
                                    <input 
                                      type="text"
                                      autoFocus
                                      value={editingCategoryJenisMasalah}
                                      onChange={e => setEditingCategoryJenisMasalah(e.target.value)}
                                      placeholder="Jenis Masalah Baru..."
                                      className={`w-full border rounded-lg px-2 py-1 text-xs font-bold outline-none focus:ring-1 focus:ring-emerald-500 ${themeClasses.input}`}
                                    />
                                    <button
                                      type="button"
                                      onClick={() => setIsCustomEditingJenis(false)}
                                      className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                                      title="Pilih dari daftar"
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  </div>
                                ) : (
                                  <select
                                    value={editingCategoryJenisMasalah}
                                    onChange={e => {
                                      if (e.target.value === '__NEW__') {
                                        setIsCustomEditingJenis(true);
                                        setEditingCategoryJenisMasalah('');
                                      } else {
                                        setEditingCategoryJenisMasalah(e.target.value);
                                      }
                                    }}
                                    className={`w-full border rounded-lg px-2 py-1 text-xs font-bold outline-none focus:ring-1 focus:ring-emerald-500 ${themeClasses.input}`}
                                  >
                                    {allJenisMasalahList.map((jm, jmIdx) => (
                                      <option key={`jm-edit-${jm}-${jmIdx}`} value={jm}>{jm}</option>
                                    ))}
                                    <option value="__NEW__">+ Tambah Jenis Baru...</option>
                                  </select>
                                )}
                              </div>
                              <div className="flex flex-col gap-1">
                                <label className={`text-[8px] font-black uppercase tracking-wider ${themeClasses.textMuted}`}>PIC Multi-Admin (Urutan Prioritas)</label>
                                <div className="flex flex-wrap gap-1 p-1.5 border rounded-lg bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800">
                                  {adminUsers.map((user, uIdx) => {
                                    const selectedIndex = editingCategoryAssignedToList.indexOf(user.username);
                                    const isSelected = selectedIndex !== -1;
                                    return (
                                      <button
                                        key={`usr-cat-edit-${user.id || user.username}-${uIdx}`}
                                        type="button"
                                        onClick={() => {
                                          if (isSelected) {
                                            const next = editingCategoryAssignedToList.filter(u => u !== user.username);
                                            setEditingCategoryAssignedToList(next);
                                            setEditingCategoryAssignedTo(next[0] || '');
                                          } else {
                                            const next = [...editingCategoryAssignedToList, user.username];
                                            setEditingCategoryAssignedToList(next);
                                            setEditingCategoryAssignedTo(next[0] || '');
                                          }
                                        }}
                                        className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 border transition-all ${
                                          isSelected
                                            ? 'bg-emerald-600 text-white border-emerald-700'
                                            : 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700'
                                        }`}
                                      >
                                        <span className={`w-1.5 h-1.5 rounded-full ${Number(user.is_on_duty) === 0 ? 'bg-rose-400' : 'bg-emerald-400'}`} />
                                        <span>{user.full_name || user.username}</span>
                                        {isSelected && (
                                          <span className="bg-emerald-800 text-emerald-100 text-[8px] px-1 rounded-full font-black">
                                            P{selectedIndex + 1}
                                          </span>
                                        )}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                              <div className="flex gap-2 justify-end pt-1">
                                <button 
                                  type="button" 
                                  onClick={() => setEditingCategoryId(null)} 
                                  className={`px-2 py-1 rounded text-[9px] font-bold ${isDark ? 'bg-zinc-800 text-zinc-400' : 'bg-slate-100 text-slate-500'} hover:opacity-80`}
                                >
                                  Batal
                                </button>
                                <button 
                                  type="button" 
                                  onClick={() => {
                                    if (!editingCategoryName.trim()) return;
                                    handleManagementAction('cat', 'update', {
                                      id: cat.id,
                                      name: editingCategoryName.trim(),
                                      assigned_to: editingCategoryAssignedToList[0] || editingCategoryAssignedTo,
                                      assigned_to_list: editingCategoryAssignedToList,
                                      response_time: editingCategoryResponseTime,
                                      jenis_masalah: editingCategoryJenisMasalah
                                    });
                                    setEditingCategoryId(null);
                                  }} 
                                  className="bg-emerald-600 text-white px-2 py-1 rounded text-[9px] font-black uppercase tracking-wider hover:bg-emerald-500"
                                >
                                  Simpan
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div key={`cat-view-${cat.id || cat.name}-${cIdx}`} className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${themeClasses.bgSecondary} px-3 py-2.5 rounded-xl border ${themeClasses.border} group w-full shadow-sm`}>
                              <div className="flex flex-col sm:flex-row sm:items-center gap-2 flex-1 min-w-0">
                                <span className={`text-xs font-bold ${themeClasses.text} min-w-[120px]`}>{cat.name}</span>
                                <div className="flex flex-wrap items-center gap-2">
                                  {cat.jenis_masalah && (
                                    <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 capitalize">
                                      {cat.jenis_masalah}
                                    </span>
                                  )}
                                  <span className={`text-[9px] font-bold ${themeClasses.textMuted} tracking-tight bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-700`}>
                                    SLA: {cat.response_time && cat.response_time > 0 ? `${cat.response_time} Jam` : 'Tanpa SLA'}
                                  </span>
                                  <div className="flex flex-wrap items-center gap-1">
                                    <span className="text-[9px] font-black text-slate-400 ml-1">PIC:</span>
                                    {pics.length > 0 ? (
                                      pics.map((picUser, picIdx) => {
                                        const uInfo = adminUsers.find(u => u.username.toLowerCase() === picUser.toLowerCase() || u.full_name.toLowerCase() === picUser.toLowerCase());
                                        const isOff = uInfo && (uInfo.is_on_duty === 0 || uInfo.is_on_duty === '0' || uInfo.is_on_duty === false);
                                        return (
                                          <span 
                                            key={`pic-chip-${picUser}-${picIdx}`} 
                                            className={`text-[8px] font-black px-1.5 py-0.5 rounded flex items-center gap-1 border ${
                                              isOff 
                                                ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' 
                                                : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                                            }`}
                                            title={isOff ? `${picUser} sedang OFF DUTY` : `${picUser} SIAP KERJA`}
                                          >
                                            <span className={`w-1 h-1 rounded-full ${isOff ? 'bg-rose-500' : 'bg-emerald-500'}`} />
                                            <span>{picUser}</span>
                                            <span className="text-[7px] opacity-75">P{picIdx + 1}</span>
                                          </span>
                                        );
                                      })
                                    ) : (
                                      <span className="text-[9px] text-slate-400 italic">Belum ada PIC</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-1.5 self-end sm:self-auto opacity-80 hover:opacity-100 transition-opacity">
                                <button 
                                  type="button" 
                                  onClick={() => {
                                    setEditingCategoryId(cat.id);
                                    setEditingCategoryName(cat.name);
                                    setEditingCategoryResponseTime(cat.response_time || 0);
                                    setEditingCategoryAssignedTo(cat.assigned_to || '');
                                    setEditingCategoryAssignedToList(pics);
                                    setEditingCategoryJenisMasalah(cat.jenis_masalah || 'Hardware');
                                  }} 
                                  className="p-1.5 text-blue-500 hover:text-blue-400 transition-colors"
                                  title="Edit Kategori"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                <button type="button" onClick={() => handleManagementAction('cat', 'delete', cat)} className="p-1.5 text-rose-500 hover:text-rose-400 transition-colors" title="Hapus Kategori">
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="p-4 text-center text-xs font-bold text-slate-400 italic">
                          Belum ada Kategori yang dibuat.
                        </div>
                      )}
                      </div>
                    </div>
                  </div>

                  {/* --- MANAJEMEN JENIS MASALAH (ATURAN KODE PERANGKAT) --- */}
                  <div className="space-y-4 pt-6 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <h3 className="text-xs font-black capitalize tracking-widest text-slate-400 flex items-center gap-2">
                          <Zap className="w-3.5 h-3.5 text-emerald-500" />
                          Manajemen Jenis Masalah (Aturan Kode Perangkat)
                        </h3>
                        <p className="text-[10px] font-medium text-slate-500 dark:text-zinc-400 mt-0.5">
                          Atur jenis masalah tiket dan tentukan apakah jenis tersebut mewajibkan pengisian & scan Kode Perangkat.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setShowAddJenisRuleModal(!showAddJenisRuleModal);
                          setNewJenisRuleName('');
                          setNewJenisRuleRequireCode(true);
                        }}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all shadow-sm flex items-center gap-1 self-start sm:self-auto"
                      >
                        <Plus className="w-3 h-3" />
                        {showAddJenisRuleModal ? 'Batal' : 'Tambah Jenis Masalah'}
                      </button>
                    </div>

                    {/* Form Tambah Jenis Masalah */}
                    {showAddJenisRuleModal && (
                      <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 space-y-3">
                        <div className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
                          Tambah Jenis Masalah Baru
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className={`block text-[9px] font-black uppercase tracking-wider mb-1 ${themeClasses.textMuted}`}>
                              Nama Jenis Masalah
                            </label>
                            <input
                              type="text"
                              value={newJenisRuleName}
                              onChange={e => setNewJenisRuleName(e.target.value)}
                              placeholder="Contoh: Jaringan, Infrastruktur, Printer..."
                              className={`w-full border rounded-xl px-3 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500 ${themeClasses.input}`}
                            />
                          </div>
                          <div>
                            <label className={`block text-[9px] font-black uppercase tracking-wider mb-1 ${themeClasses.textMuted}`}>
                              Aturan Kode Perangkat
                            </label>
                            <select
                              value={newJenisRuleRequireCode ? 'true' : 'false'}
                              onChange={e => setNewJenisRuleRequireCode(e.target.value === 'true')}
                              className={`w-full border rounded-xl px-3 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500 ${themeClasses.input}`}
                            >
                              <option value="true">🖥️ Wajib Kode Perangkat (Munculkan Kolom & QR)</option>
                              <option value="false">📱 Tanpa Kode Perangkat (Sembunyikan Kolom)</option>
                            </select>
                          </div>
                        </div>
                        <div className="flex justify-end gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => setShowAddJenisRuleModal(false)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold ${isDark ? 'bg-zinc-800 text-zinc-300' : 'bg-slate-200 text-slate-700'}`}
                          >
                            Batal
                          </button>
                          <button
                            type="button"
                            onClick={handleAddJenisRule}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-1.5 rounded-xl text-xs font-black capitalize tracking-wider"
                          >
                            Simpan Jenis Masalah
                          </button>
                        </div>
                      </div>
                    )}

                    {/* List Card Jenis Masalah */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {jenisMasalahRules.map((rule, idx) => {
                        const isBuiltin = rule.name.toLowerCase() === 'hardware' || rule.name.toLowerCase() === 'aplikasi';
                        const isEditing = editingJenisRuleIndex === idx;

                        if (isEditing) {
                          return (
                            <div key={idx} className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 space-y-2">
                              <input
                                type="text"
                                disabled={isBuiltin}
                                value={editingJenisRuleName}
                                onChange={e => setEditingJenisRuleName(e.target.value)}
                                className={`w-full border rounded-lg px-2.5 py-1.5 text-xs font-bold ${themeClasses.input}`}
                              />
                              <select
                                value={editingJenisRuleRequireCode ? 'true' : 'false'}
                                onChange={e => setEditingJenisRuleRequireCode(e.target.value === 'true')}
                                className={`w-full border rounded-lg px-2.5 py-1.5 text-xs font-bold ${themeClasses.input}`}
                              >
                                <option value="true">🖥️ Wajib Kode Perangkat</option>
                                <option value="false">📱 Tanpa Kode Perangkat</option>
                              </select>
                              <div className="flex justify-end gap-2 pt-1">
                                <button
                                  type="button"
                                  onClick={() => setEditingJenisRuleIndex(null)}
                                  className="px-2 py-1 text-[10px] font-bold text-slate-500 hover:text-slate-700"
                                >
                                  Batal
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleSaveEditJenisRule(idx)}
                                  className="bg-emerald-600 text-white px-3 py-1 rounded text-[10px] font-black"
                                >
                                  Simpan
                                </button>
                              </div>
                            </div>
                          );
                        }

                        return (
                          <div 
                            key={`rule-${rule.name}-${idx}`}
                            className={`p-3.5 rounded-2xl border flex items-center justify-between gap-2 transition-all ${
                              rule.require_device_code
                                ? 'bg-gradient-to-r from-blue-500/5 to-indigo-500/5 border-blue-500/20'
                                : 'bg-gradient-to-r from-slate-500/5 to-zinc-500/5 border-slate-200 dark:border-slate-800'
                            }`}
                          >
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5 mb-1">
                                <span className={`text-xs font-black ${themeClasses.text}`}>
                                  {rule.name}
                                </span>
                                {isBuiltin && (
                                  <span className="text-[8px] font-black px-1.5 py-0.2 rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                                    Bawaan
                                  </span>
                                )}
                              </div>
                              <button
                                type="button"
                                onClick={() => handleToggleJenisRuleCode(idx)}
                                className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full border flex items-center gap-1 transition-all hover:scale-105 ${
                                  rule.require_device_code
                                    ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30'
                                    : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                                }`}
                                title="Klik untuk mengubah Aturan Kode Perangkat"
                              >
                                <span className={`w-1.5 h-1.5 rounded-full ${rule.require_device_code ? 'bg-blue-500 animate-pulse' : 'bg-emerald-500'}`} />
                                {rule.require_device_code ? '🖥️ Wajib Kode Perangkat' : '📱 Tanpa Kode Perangkat'}
                              </button>
                            </div>

                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingJenisRuleIndex(idx);
                                  setEditingJenisRuleName(rule.name);
                                  setEditingJenisRuleRequireCode(rule.require_device_code);
                                }}
                                className="p-1.5 text-slate-400 hover:text-blue-500 transition-colors"
                                title="Edit Jenis Masalah"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              {!isBuiltin && (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteJenisRule(idx)}
                                  className="p-1.5 text-slate-400 hover:text-rose-500 transition-colors"
                                  title="Hapus Jenis Masalah"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Admin Users */}
                  <div className="space-y-4 pt-6 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-black capitalize tracking-widest text-slate-400">Akun Admin IT</h3>
                      <button 
                        type="button"
                        onClick={() => setAddingType('admin-user')}
                        className="text-[10px] font-black text-emerald-600 hover:text-emerald-700 capitalize tracking-widest"
                      >
                        + Tambah Admin
                      </button>
                    </div>

                    {addingType === 'admin-user' && (
                      <div className={`p-4 rounded-xl border-2 border-emerald-500/30 space-y-3 ${themeClasses.bgSecondary}`}>
                        <div className="grid grid-cols-2 gap-2">
                          <input 
                            autoFocus
                            type="text"
                            placeholder="Username"
                            className={`w-full px-3 py-2 rounded-lg border text-xs outline-none focus:ring-2 focus:ring-emerald-500 ${themeClasses.bgSecondary} ${themeClasses.border} ${themeClasses.text}`}
                            value={adminUserUsername}
                            onChange={e => setAdminUserUsername(e.target.value)}
                          />
                          <input 
                            type="password"
                            placeholder="Password"
                            className={`w-full px-3 py-2 rounded-lg border text-xs outline-none focus:ring-2 focus:ring-emerald-500 ${themeClasses.bgSecondary} ${themeClasses.border} ${themeClasses.text}`}
                            value={adminUserPassword}
                            onChange={e => setAdminUserPassword(e.target.value)}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <input 
                            type="text"
                            placeholder="Nama Lengkap"
                            className={`w-full px-3 py-2 rounded-lg border text-xs outline-none focus:ring-2 focus:ring-emerald-500 ${themeClasses.bgSecondary} ${themeClasses.border} ${themeClasses.text}`}
                            value={adminUserFullName}
                            onChange={e => setAdminUserFullName(e.target.value)}
                          />
                          <input 
                            type="text"
                            placeholder="No. WhatsApp (cth: 08123456789)"
                            className={`w-full px-3 py-2 rounded-lg border text-xs outline-none focus:ring-2 focus:ring-emerald-500 ${themeClasses.bgSecondary} ${themeClasses.border} ${themeClasses.text}`}
                            value={adminUserPhone}
                            onChange={e => setAdminUserPhone(e.target.value)}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <select 
                            className={`w-full px-3 py-2 rounded-lg border text-xs outline-none focus:ring-2 focus:ring-emerald-500 ${themeClasses.bgSecondary} ${themeClasses.border} ${themeClasses.text}`}
                            value={adminUserRole}
                            onChange={e => setAdminUserRole(e.target.value)}
                          >
                            <option value="Staff IT Support">Staff IT Support</option>
                            <option value="Staff App Support">Staff App Support</option>
                            <option value="Super Admin">Super Admin</option>
                          </select>
                        </div>
                        <div className="flex gap-2">
                          <button 
                            type="button"
                            onClick={handleAddAdminUser}
                            className="flex-1 py-2 bg-emerald-600 text-white rounded-lg text-[10px] font-bold capitalize tracking-widest"
                          >
                            Simpan Admin
                          </button>
                          <button 
                            type="button"
                            onClick={() => setAddingType(null)}
                            className={`flex-1 py-2 rounded-lg text-[10px] font-bold capitalize tracking-widest border ${themeClasses.border} ${themeClasses.textMuted}`}
                          >
                            Batal
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="space-y-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                      {Array.isArray(adminUsers) && adminUsers.map((user, idx) => (
                        <div key={`adm-usr-${user.id || user.username}-${idx}`} className={`flex flex-col gap-2 p-2.5 rounded-xl border ${themeClasses.border} ${themeClasses.bgSecondary}`}>
                          <div className="flex items-center justify-between">
                            <div className="flex flex-col">
                              <span className="text-[11px] font-bold">{user.full_name} ({user.username})</span>
                              <div className="flex items-center gap-2">
                                <span className="text-[9px] text-slate-400 capitalize font-black">{user.role}</span>
                                {user.phone && (
                                  <span className="text-[9px] text-emerald-600 font-bold flex items-center gap-0.5">
                                    <Phone className="w-2.5 h-2.5" /> {user.phone}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5">
                              {(() => {
                                const isOff = Number(user.is_on_duty) === 0;
                                return (
                                  <button
                                    type="button"
                                    onClick={async () => {
                                      try {
                                        const nextDuty = isOff ? 1 : 0;
                                        await api.updateDutyStatus(user.username, nextDuty);
                                        user.is_on_duty = nextDuty;
                                        handleManagementAction('admin-user', 'refresh');
                                        window.dispatchEvent(new Event('duty_status_changed'));
                                        toast.success(`Status ${user.full_name}: ${nextDuty === 1 ? 'SIAP KERJA (ON)' : 'OFF DUTY (OFF)'}`);
                                      } catch (e) {
                                        toast.error('Gagal memperbarui status duty');
                                      }
                                    }}
                                    className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border flex items-center gap-1.5 transition-all cursor-pointer shadow-sm ${
                                      !isOff
                                        ? 'bg-emerald-600 text-white border-emerald-500 hover:bg-emerald-500'
                                        : 'bg-rose-600 text-white border-rose-500 hover:bg-rose-500'
                                    }`}
                                    title="Klik untuk mengubah status kerja Admin ini"
                                  >
                                    <span className={`w-1.5 h-1.5 rounded-full ${!isOff ? 'bg-white animate-pulse' : 'bg-white/90'}`} />
                                    <span>{!isOff ? 'SIAP KERJA' : 'OFF DUTY'}</span>
                                  </button>
                                );
                              })()}

                              <button 
                                type="button"
                                onClick={() => {
                                  if (editingAdminUser?.id === user.id) {
                                    setEditingAdminUser(null);
                                  } else {
                                    setEditingAdminUser(user);
                                    setEditingAdminPhone(user.phone || '');
                                    setAdminUserNewPassword('');
                                  }
                                }}
                                className="p-1 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/30 rounded-lg transition-colors flex items-center gap-1 text-[9px] font-black uppercase tracking-wider"
                                title="Edit Admin & Phone"
                              >
                                <Edit3 className="w-3 h-3" />
                                <span className="hidden sm:inline">Edit</span>
                              </button>
                              
                              {user.role !== 'Super Admin' && (
                                <button 
                                  type="button"
                                  onClick={() => handleDeleteAdminUser(user.id)}
                                  className="p-1 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors"
                                  title="Hapus Akun"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          </div>

                          {editingAdminUser?.id === user.id && (
                            <div className="flex flex-col gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/60 animate-in fade-in slide-in-from-top-1 duration-200">
                              <div className="grid grid-cols-2 gap-2">
                                <input 
                                  type="text"
                                  placeholder="No. WhatsApp / HP"
                                  className={`px-3 py-1.5 rounded-lg border text-[10px] outline-none focus:ring-1 focus:ring-emerald-500 ${themeClasses.bgSecondary} ${themeClasses.border} ${themeClasses.text}`}
                                  value={editingAdminPhone}
                                  onChange={e => setEditingAdminPhone(e.target.value)}
                                />
                                <input 
                                  type="password"
                                  placeholder="Password baru (opsional)"
                                  className={`px-3 py-1.5 rounded-lg border text-[10px] outline-none focus:ring-1 focus:ring-emerald-500 ${themeClasses.bgSecondary} ${themeClasses.border} ${themeClasses.text}`}
                                  value={adminUserNewPassword}
                                  onChange={e => setAdminUserNewPassword(e.target.value)}
                                />
                              </div>
                              <div className="flex gap-2 justify-end">
                                <button 
                                  type="button"
                                  onClick={handleUpdateAdminPassword}
                                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[9px] font-black uppercase tracking-wider whitespace-nowrap cursor-pointer"
                                >
                                  Simpan Perubahan
                                </button>
                                <button 
                                  type="button"
                                  onClick={() => setEditingAdminUser(null)}
                                  className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider border ${themeClasses.border} ${themeClasses.textMuted} cursor-pointer`}
                                >
                                  Batal
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* System Maintenance */}
                  <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <button 
                      type="button"
                      onClick={() => window.open('/api/tickets/export', '_blank')}
                      className={`flex flex-col items-center justify-center gap-2 p-6 rounded-2xl border transition-all hover:border-emerald-500 hover:bg-emerald-50 group ${themeClasses.bgSecondary} ${themeClasses.border}`}
                    >
                      <Save className="w-6 h-6 text-slate-400 group-hover:text-emerald-600" />
                      <span className="text-[10px] font-black capitalize tracking-widest text-slate-600 group-hover:text-emerald-700">Export CSV</span>
                    </button>
                    <button 
                      type="button"
                      className={`flex flex-col items-center justify-center gap-2 p-6 rounded-2xl border transition-all hover:border-blue-500 hover:bg-blue-50 group ${themeClasses.bgSecondary} ${themeClasses.border}`}
                    >
                      <MessageCircle className="w-6 h-6 text-slate-400 group-hover:text-blue-600" />
                      <span className="text-[10px] font-black capitalize tracking-widest text-slate-600 group-hover:text-blue-700">API Docs</span>
                    </button>
                  </div>
                </div>
              )}

              {settingsTab === 'system' && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
                  {/* Version Info */}
                  <div className="space-y-4">
                    <h3 className="text-xs font-black capitalize tracking-widest text-slate-400 flex items-center gap-2">
                      <Info className="w-3 h-3" /> Informasi Versi
                    </h3>
                    <div className={`p-6 rounded-3xl border ${themeClasses.border} ${themeClasses.bgSecondary} relative overflow-hidden`}>
                      <div className="relative z-10 flex items-center justify-between">
                        <div>
                          <div className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em] mb-1">Current Version</div>
                          <div className="text-4xl font-black tracking-tighter flex items-baseline gap-2">
                            v{APP_VERSION}
                            <span className={`text-xs font-black px-2 py-0.5 rounded-md uppercase tracking-widest ${
                              getEnvironment() === 'Staging' 
                                ? 'bg-amber-500/10 text-amber-500' 
                                : 'bg-emerald-500/10 text-emerald-500'
                            }`}>
                              {getEnvironment()}
                            </span>
                          </div>
                          <div className="mt-4 flex items-center gap-4">
                            <div className="flex flex-col">
                              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Build Date</span>
                              <span className="text-xs font-bold">{BUILD_DATE}</span>
                            </div>
                            <div className="w-px h-8 bg-slate-200 dark:bg-slate-800" />
                            <div className="flex flex-col">
                              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Environment</span>
                              <span className="text-xs font-bold">Production</span>
                            </div>
                          </div>
                        </div>
                        <div className="hidden sm:block">
                          <div className="w-24 h-24 rounded-full bg-emerald-500/10 flex items-center justify-center">
                            <Settings2 className="w-12 h-12 text-emerald-500 opacity-20" />
                          </div>
                        </div>
                      </div>
                      {/* Decorative background element */}
                      <div className="absolute -right-8 -bottom-8 w-48 h-48 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
                    </div>
                  </div>

                  {/* Update History */}
                  <div className="space-y-4">
                    <h3 className="text-xs font-black capitalize tracking-widest text-slate-400 flex items-center gap-2">
                      <History className="w-3 h-3" /> Riwayat Pembaruan
                    </h3>
                    <div className="space-y-3">
                      {UPDATE_HISTORY.map((update, idx) => (
                        <div key={idx} className={`p-4 rounded-2xl border ${themeClasses.border} ${themeClasses.bgSecondary} hover:border-emerald-500/30 transition-colors group`}>
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-[9px] font-black tracking-widest">
                                v{update.version}
                              </span>
                              <span className="text-[10px] font-bold text-slate-400">{update.date}</span>
                            </div>
                            {idx === 0 && (
                              <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Latest</span>
                            )}
                          </div>
                          <ul className="space-y-1">
                            {update.changes.map((change, cIdx) => (
                              <li key={cIdx} className="text-[11px] text-slate-600 dark:text-slate-400 flex items-start gap-2">
                                <span className="mt-1.5 w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700 shrink-0" />
                                {change}
                              </li>
                            ))}
                          </ul>
                          {idx > 0 && (
                            <button 
                              type="button"
                              onClick={() => alert(`Fitur Rollback ke v${update.version} sedang dalam pengembangan.`)}
                              className="mt-4 w-full py-2 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-emerald-600 hover:border-emerald-500/50 transition-all opacity-0 group-hover:opacity-100"
                            >
                              Rollback ke Versi Ini
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* GPS Tracking Settings */}
                  <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <h3 className="text-xs font-black capitalize tracking-widest text-slate-400">Jam Kerja GPS Tracker Tim IT</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 capitalize tracking-widest ml-1">Jam Mulai</label>
                        <input 
                          type="time"
                          className={`w-full px-4 py-2.5 rounded-xl border text-xs sm:text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-500 transition-all ${themeClasses.bgSecondary} ${themeClasses.border} ${themeClasses.text}`}
                          value={appSettings.gps_working_hours_start || '07:45'}
                          onChange={e => setAppSettings({...appSettings, gps_working_hours_start: e.target.value})}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 capitalize tracking-widest ml-1">Jam Selesai</label>
                        <input 
                          type="time"
                          className={`w-full px-4 py-2.5 rounded-xl border text-xs sm:text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-500 transition-all ${themeClasses.bgSecondary} ${themeClasses.border} ${themeClasses.text}`}
                          value={appSettings.gps_working_hours_end || '16:00'}
                          onChange={e => setAppSettings({...appSettings, gps_working_hours_end: e.target.value})}
                        />
                      </div>
                    </div>
                  </div>

                  {/* System Maintenance */}
                  <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <h3 className="text-xs font-black capitalize tracking-widest text-slate-400">Pemeliharaan Sistem</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <button 
                        type="button"
                        onClick={() => {
                          localStorage.clear();
                          window.location.reload();
                        }}
                        className={`flex flex-col items-center justify-center gap-2 p-6 rounded-2xl border transition-all hover:border-rose-500 hover:bg-rose-50 group ${themeClasses.bgSecondary} ${themeClasses.border}`}
                      >
                        <Trash2 className="w-6 h-6 text-slate-400 group-hover:text-rose-600" />
                        <span className="text-[10px] font-black capitalize tracking-widest text-slate-600 group-hover:text-rose-700">Bersihkan Cache</span>
                      </button>
                      <button 
                        type="button"
                        onClick={() => window.location.reload()}
                        className={`flex flex-col items-center justify-center gap-2 p-6 rounded-2xl border transition-all hover:border-blue-500 hover:bg-blue-50 group ${themeClasses.bgSecondary} ${themeClasses.border}`}
                      >
                        <RefreshCw className="w-6 h-6 text-slate-400 group-hover:text-blue-600" />
                        <span className="text-[10px] font-black capitalize tracking-widest text-slate-600 group-hover:text-blue-700">Muat Ulang Paksa</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {settingsTab === 'panduan' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xs font-black capitalize tracking-widest text-slate-400">Daftar Panduan</h3>
                      <p className="text-[10px] text-slate-500 mt-1">Panduan ini akan ditampilkan di menu Panduan aplikasi</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const current = [...parsedPanduan];
                        current.push({ id: `panduan_${Date.now()}`, title: `Panduan Baru`, content: '' });
                        updatePanduan(current);
                      }}
                      className="flex items-center gap-2 px-3 py-1.5 bg-emerald-600 text-white rounded-xl text-[10px] font-bold shadow-lg shadow-emerald-500/20 active:scale-95"
                    >
                      <Plus className="w-3 h-3" /> Tambah
                    </button>
                  </div>

                  <div className="space-y-4">
                    {parsedPanduan.map((guide: any, index: number) => (
                      <div key={`guide-${guide.id || 'guide'}-${index}`} className={`p-4 rounded-2xl border ${themeClasses.border} ${themeClasses.bgSecondary}`}>
                        <div className="space-y-4">
                          <div className="flex justify-between items-center">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sub Judul</label>
                            <button
                              type="button"
                              onClick={() => {
                                const current = [...parsedPanduan];
                                current.splice(index, 1);
                                updatePanduan(current);
                              }}
                              className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                          <input
                            type="text"
                            value={guide.title}
                            onChange={e => {
                              const current = [...parsedPanduan];
                              current[index].title = e.target.value;
                              updatePanduan(current);
                            }}
                            placeholder="Contoh: 1. Cara membuat tiket"
                            className={`w-full px-4 py-2 rounded-xl border text-xs sm:text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-500 transition-all ${themeClasses.bg} ${themeClasses.border} ${themeClasses.text}`}
                          />
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Isi Panduan</label>
                            <textarea
                              value={guide.content}
                              onChange={e => {
                                const current = [...parsedPanduan];
                                current[index].content = e.target.value;
                                updatePanduan(current);
                              }}
                              rows={4}
                              className={`w-full px-4 py-3 rounded-xl border text-xs font-medium outline-none focus:ring-2 focus:ring-emerald-500 transition-all ${themeClasses.bg} ${themeClasses.border} ${themeClasses.text}`}
                              placeholder="Ketik isi panduan disini..."
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                    {parsedPanduan.length === 0 && (
                      <p className="text-xs text-slate-400 italic text-center py-4">Belum ada panduan. Tekan tombol Tambah untuk membuat panduan.</p>
                    )}
                  </div>
                </div>
              )}

              {settingsTab === 'sla' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-xs font-black capitalize tracking-widest text-slate-400">Pengaturan Waktu SLA (Service Level Agreement)</h3>
                    <p className="text-[10px] text-slate-500 mt-1">Sesuaikan batas waktu respons untuk tiket baru agar tim IT tetap responsif.</p>
                  </div>

                  <div className={`p-4 sm:p-6 rounded-2xl border ${themeClasses.border} ${themeClasses.bgSecondary} space-y-6`}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      
                      {/* Delayed SLA Settings */}
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-amber-500" />
                          Batas Waktu Delayed (Jam)
                        </label>
                        <input 
                          type="number"
                          min="0.1"
                          step="0.1"
                          className={`w-full px-4 py-2.5 rounded-xl border text-xs sm:text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-500 transition-all ${themeClasses.bg} ${themeClasses.border} ${themeClasses.text}`}
                          value={appSettings.sla_delayed_hours !== undefined ? appSettings.sla_delayed_hours : 2}
                          onChange={e => {
                            const val = parseFloat(e.target.value);
                            setAppSettings({
                              ...appSettings,
                              sla_delayed_hours: isNaN(val) ? '' : val
                            });
                          }}
                        />
                        <p className="text-[10px] text-slate-500">
                          Tiket baru yang belum ditangani lebih dari durasi ini akan diberi tanda kuning/Delayed. (Bawaan: 2 jam).
                        </p>
                      </div>

                      {/* Critical SLA Settings */}
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                          Batas Waktu Critical (Jam)
                        </label>
                        <input 
                          type="number"
                          min="0.1"
                          step="0.1"
                          className={`w-full px-4 py-2.5 rounded-xl border text-xs sm:text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-500 transition-all ${themeClasses.bg} ${themeClasses.border} ${themeClasses.text}`}
                          value={appSettings.sla_critical_hours !== undefined ? appSettings.sla_critical_hours : 5}
                          onChange={e => {
                            const val = parseFloat(e.target.value);
                            setAppSettings({
                              ...appSettings,
                              sla_critical_hours: isNaN(val) ? '' : val
                            });
                          }}
                        />
                        <p className="text-[10px] text-slate-500">
                          Tiket baru yang belum ditangani lebih dari durasi ini akan diberi tanda merah berkedip/Critical. (Bawaan: 5 jam).
                        </p>
                      </div>

                    </div>

                    {/* Live Preview Section */}
                    <div className={`p-4 rounded-xl border ${isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-slate-50 border-slate-100'} space-y-3`}>
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pratinjau Badge SLA pada Tiket:</h4>
                      <div className="flex flex-wrap gap-4 items-center">
                        <div className="flex flex-col gap-1">
                          <span className="text-[9px] text-slate-500 font-bold">Status Normal (&lt; {appSettings.sla_delayed_hours || 2} jam):</span>
                          <span className="text-[10px] text-slate-400 italic">Tidak ada badge SLA (Sesuai Target)</span>
                        </div>
                        
                        <div className="flex flex-col gap-1">
                          <span className="text-[9px] text-slate-500 font-bold">Status Delayed (&gt; {appSettings.sla_delayed_hours || 2} jam):</span>
                          <div className="flex items-center gap-2">
                            <span className="text-[8px] sm:text-[9px] font-bold px-1.5 py-0.5 rounded capitalize bg-amber-500/10 border border-amber-500/20 text-amber-600 leading-none whitespace-nowrap">
                              Delayed (&gt;{appSettings.sla_delayed_hours || 2}h)
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-col gap-1">
                          <span className="text-[9px] text-slate-500 font-bold">Status Critical (&gt; {appSettings.sla_critical_hours || 5} jam):</span>
                          <div className="flex items-center gap-2">
                            <span className="text-[8px] sm:text-[9px] font-bold px-1.5 py-0.5 rounded capitalize bg-rose-500 text-white leading-none whitespace-nowrap">
                              Critical (&gt;{appSettings.sla_critical_hours || 5}h)
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                  </div>
                </div>
              )}

              {settingsTab === 'ticket_popup' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                  <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
                    <div>
                      <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
                        <MessageCircle className="w-4 h-4 text-emerald-500" /> Pengaturan Pop-up Tiket
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        Ubah teks yang muncul pada saat pengguna menekan tombol "Buat Tiket Baru"
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 capitalize tracking-widest ml-1">Judul Pop-up</label>
                      <input 
                        type="text"
                        value={appSettings.ticket_popup_title || ''}
                        onChange={(e) => setAppSettings({...appSettings, ticket_popup_title: e.target.value})}
                        placeholder="Contoh: Buat Tiket Baru"
                        className={`w-full px-4 py-2.5 rounded-xl border text-xs font-semibold ${themeClasses.bgSecondary} ${themeClasses.border} focus:outline-none focus:ring-2 focus:ring-emerald-500`}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 capitalize tracking-widest ml-1">Sub-judul Pop-up</label>
                      <input 
                        type="text"
                        value={appSettings.ticket_popup_subtitle || ''}
                        onChange={(e) => setAppSettings({...appSettings, ticket_popup_subtitle: e.target.value})}
                        placeholder="Contoh: Layanan Bantuan IT"
                        className={`w-full px-4 py-2.5 rounded-xl border text-xs font-semibold ${themeClasses.bgSecondary} ${themeClasses.border} focus:outline-none focus:ring-2 focus:ring-emerald-500`}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 capitalize tracking-widest ml-1">Teks Pertanyaan (Prompt)</label>
                      <input 
                        type="text"
                        value={appSettings.ticket_popup_prompt || ''}
                        onChange={(e) => setAppSettings({...appSettings, ticket_popup_prompt: e.target.value})}
                        placeholder="Contoh: Pilih tipe piranti yang Anda gunakan saat ini:"
                        className={`w-full px-4 py-2.5 rounded-xl border text-xs font-semibold ${themeClasses.bgSecondary} ${themeClasses.border} focus:outline-none focus:ring-2 focus:ring-emerald-500`}
                      />
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-4">
                    <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">Opsi 1: Smartphone / Laptop</h4>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 capitalize tracking-widest ml-1">Judul Opsi 1</label>
                      <input 
                        type="text"
                        value={appSettings.ticket_popup_opt1_title || ''}
                        onChange={(e) => setAppSettings({...appSettings, ticket_popup_opt1_title: e.target.value})}
                        placeholder="Contoh: Smartphone / Tab / Laptop"
                        className={`w-full px-4 py-2.5 rounded-xl border text-xs font-semibold ${themeClasses.bgSecondary} ${themeClasses.border} focus:outline-none focus:ring-2 focus:ring-emerald-500`}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 capitalize tracking-widest ml-1">Deskripsi Opsi 1</label>
                      <textarea 
                        value={appSettings.ticket_popup_opt1_desc || ''}
                        onChange={(e) => setAppSettings({...appSettings, ticket_popup_opt1_desc: e.target.value})}
                        placeholder="Contoh: Memiliki kamera bawaan. Wajib melakukan Scan Wajah (Selfie) untuk membuat tiket."
                        rows={2}
                        className={`w-full px-4 py-2.5 rounded-xl border text-xs font-semibold ${themeClasses.bgSecondary} ${themeClasses.border} focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none`}
                      />
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-4">
                    <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">Opsi 2: PC Desktop</h4>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 capitalize tracking-widest ml-1">Judul Opsi 2</label>
                      <input 
                        type="text"
                        value={appSettings.ticket_popup_opt2_title || ''}
                        onChange={(e) => setAppSettings({...appSettings, ticket_popup_opt2_title: e.target.value})}
                        placeholder="Contoh: Komputer PC (Desktop)"
                        className={`w-full px-4 py-2.5 rounded-xl border text-xs font-semibold ${themeClasses.bgSecondary} ${themeClasses.border} focus:outline-none focus:ring-2 focus:ring-emerald-500`}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 capitalize tracking-widest ml-1">Deskripsi Opsi 2</label>
                      <textarea 
                        value={appSettings.ticket_popup_opt2_desc || ''}
                        onChange={(e) => setAppSettings({...appSettings, ticket_popup_opt2_desc: e.target.value})}
                        placeholder="Contoh: Komputer meja tanpa kamera bawaan. Wajib menginput Kode Nomor PC di monitor Anda."
                        rows={2}
                        className={`w-full px-4 py-2.5 rounded-xl border text-xs font-semibold ${themeClasses.bgSecondary} ${themeClasses.border} focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none`}
                      />
                    </div>
                  </div>
                </div>
              )}

              {settingsTab === 'auto_respond' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                  <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
                    <div>
                      <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
                        <Zap className="w-4 h-4 text-purple-500" /> Auto-Respond Tiket (Khusus Admin Yudha)
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        Otomatis mengubah tiket berstatus "Baru" menjadi "Progres" dan menetapkannya ke Petugas IT
                      </p>
                    </div>
                  </div>

                  {/* Toggle Sakelar On/Off */}
                  <div className={`p-5 rounded-2xl border ${
                    (appSettings.yudha_auto_respond_enabled === true || appSettings.yudha_auto_respond_enabled === 'true')
                      ? 'bg-purple-500/10 border-purple-500/30'
                      : 'bg-slate-100 dark:bg-zinc-900 border-slate-200 dark:border-zinc-800'
                  } transition-all`}>
                    <div className="flex items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-black uppercase tracking-wider ${
                            (appSettings.yudha_auto_respond_enabled === true || appSettings.yudha_auto_respond_enabled === 'true')
                              ? 'text-purple-600 dark:text-purple-400'
                              : 'text-slate-500'
                          }`}>
                            Status Fitur Auto-Respond
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            (appSettings.yudha_auto_respond_enabled === true || appSettings.yudha_auto_respond_enabled === 'true')
                              ? 'bg-emerald-500 text-white'
                              : 'bg-slate-300 dark:bg-zinc-700 text-slate-600 dark:text-slate-300'
                          }`}>
                            {(appSettings.yudha_auto_respond_enabled === true || appSettings.yudha_auto_respond_enabled === 'true') ? 'AKTIF' : 'NON-AKTIF'}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          Matikan sakelar ini jika Anda sedang tidak ada sinyal / offline agar tiket tidak tersambar otomatis.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          const currentVal = appSettings.yudha_auto_respond_enabled === true || appSettings.yudha_auto_respond_enabled === 'true';
                          setAppSettings({
                            ...appSettings,
                            yudha_auto_respond_enabled: !currentVal
                          });
                        }}
                        className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          (appSettings.yudha_auto_respond_enabled === true || appSettings.yudha_auto_respond_enabled === 'true')
                            ? 'bg-purple-600'
                            : 'bg-slate-300 dark:bg-zinc-700'
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                            (appSettings.yudha_auto_respond_enabled === true || appSettings.yudha_auto_respond_enabled === 'true')
                              ? 'translate-x-5'
                              : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                  </div>

                  {/* Setting Jeda Waktu (5 min, 7 min, 10 min, Instant) */}
                  <div className="space-y-3">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-purple-500" /> Jeda Waktu Auto-Respond Tiket:
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {[
                        { label: 'Langsung (0 min)', val: 0 },
                        { label: '5 Menit', val: 5 },
                        { label: '7 Menit', val: 7 },
                        { label: '10 Menit', val: 10 }
                      ].map((opt, idx) => {
                        const currentDelay = Number(appSettings.yudha_auto_respond_delay ?? 5);
                        const isSelected = currentDelay === opt.val;
                        return (
                          <button
                            key={`yudha-delay-${opt.val}-${idx}`}
                            type="button"
                            onClick={() => {
                              setAppSettings({
                                ...appSettings,
                                yudha_auto_respond_delay: opt.val
                              });
                            }}
                            className={`px-3 py-3 rounded-xl border text-xs font-black transition-all flex flex-col items-center justify-center gap-1 ${
                              isSelected
                                ? 'bg-purple-600 text-white border-purple-600 shadow-md shadow-purple-900/20'
                                : `${themeClasses.bgSecondary} ${themeClasses.border} text-slate-600 dark:text-slate-300 hover:border-purple-400`
                            }`}
                          >
                            <span>{opt.label}</span>
                            {isSelected && <span className="text-[9px] opacity-80 uppercase tracking-widest">Terpilih</span>}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Setting Nama Assignee */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Nama Petugas IT Penerima Tiket:
                    </label>
                    <input
                      type="text"
                      value={appSettings.yudha_auto_respond_assignee || 'yudha'}
                      onChange={(e) => setAppSettings({ ...appSettings, yudha_auto_respond_assignee: e.target.value })}
                      placeholder="Contoh: yudha"
                      className={`w-full px-4 py-2.5 rounded-xl border text-xs font-semibold ${themeClasses.bgSecondary} ${themeClasses.border} focus:outline-none focus:ring-2 focus:ring-purple-500`}
                    />
                    <p className="text-[10px] text-slate-400">
                      Tiket yang terkena auto respond akan otomatis di-assign ke nama ini.
                    </p>
                  </div>

                  {/* Setting Kategori Tiket */}
                  <div className="space-y-3">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                      <span>Kategori Tiket Ditembak (Target Categories):</span>
                      <span className="text-[10px] font-normal text-slate-400">Pilih kategori mana yang di-auto-respond</span>
                    </label>

                    <div className="flex flex-wrap gap-2">
                      {(() => {
                        let selectedCats: string[] = [];
                        if (Array.isArray(appSettings.yudha_auto_respond_categories)) {
                          selectedCats = appSettings.yudha_auto_respond_categories;
                        } else if (typeof appSettings.yudha_auto_respond_categories === 'string' && appSettings.yudha_auto_respond_categories.trim()) {
                          try { selectedCats = JSON.parse(appSettings.yudha_auto_respond_categories); } catch { selectedCats = appSettings.yudha_auto_respond_categories.split(',').map(s=>s.trim()); }
                        }
                        
                        const isAll = selectedCats.length === 0 || selectedCats.includes('ALL');

                        const toggleCat = (catName: string) => {
                          let nextCats: string[] = [...selectedCats];
                          if (catName === 'ALL') {
                            nextCats = ['ALL'];
                          } else {
                            nextCats = nextCats.filter(c => c !== 'ALL');
                            if (nextCats.includes(catName)) {
                              nextCats = nextCats.filter(c => c !== catName);
                            } else {
                              nextCats.push(catName);
                            }
                            if (nextCats.length === 0) nextCats = ['ALL'];
                          }
                          setAppSettings({
                            ...appSettings,
                            yudha_auto_respond_categories: nextCats
                          });
                        };

                        return (
                          <>
                            <button
                              type="button"
                              onClick={() => toggleCat('ALL')}
                              className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all ${
                                isAll
                                  ? 'bg-purple-600 text-white border-purple-600'
                                  : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-zinc-700'
                              }`}
                            >
                              Semua Kategori (ALL)
                            </button>
                            {Array.isArray(categories) && categories.map((cat: any, idx: number) => {
                              const catName = typeof cat === 'string' ? cat : cat.name;
                              const isChecked = !isAll && selectedCats.includes(catName);
                              return (
                                <button
                                  key={`yudha-cat-${cat.id || catName}-${idx}`}
                                  type="button"
                                  onClick={() => toggleCat(catName)}
                                  className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all ${
                                    isChecked
                                      ? 'bg-purple-600 text-white border-purple-600'
                                      : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-zinc-700'
                                  }`}
                                >
                                  {catName}
                                </button>
                              );
                            })}
                          </>
                        );
                      })()}
                    </div>
                  </div>

                  {/* Banner Informasi */}
                  <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20 text-xs text-purple-700 dark:text-purple-300 space-y-1">
                    <p className="font-bold flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5" /> Cara Kerja Auto-Respond Yudha:
                    </p>
                    <ul className="list-disc list-inside text-[11px] space-y-1 text-slate-600 dark:text-slate-300">
                      <li>Setiap ada tiket baru masuk pada kategori pilihan, server memantau umur tiket.</li>
                      <li>Setelah mencapai jeda {appSettings.yudha_auto_respond_delay ?? 5} menit, status tiket otomatis berubah menjadi <strong className="text-purple-600 dark:text-purple-400 font-mono">Progres</strong> dan di-assign ke <strong className="font-mono">{appSettings.yudha_auto_respond_assignee || 'yudha'}</strong>.</li>
                      <li>Jika jeda di-set "Langsung (0 min)", respon dilakukan instan saat tiket dibuat.</li>
                      <li>Waktu respon (<code className="font-mono">responded_at</code>) terisi otomatis secara rinci.</li>
                    </ul>
                  </div>
                </div>
              )}

              {settingsTab === 'it_action' && (
                <div className="space-y-6">
                  <div className="flex items-center gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
                    <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                      <Package className="w-5 h-5 text-amber-500" />
                    </div>
                    <div>
                      <h3 className={`text-base font-black ${themeClasses.text}`}>Pengaturan Form & Surat Rekomendasi Tindakan IT</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Atur kop surat resmi, judul dokumen, label penandatangan, dan template catatan default untuk rekomendasi IT.</p>
                    </div>
                  </div>

                  {/* Section 1: Kop Surat Rekomendasi IT & 2 Logo Header */}
                  <div className={`p-4 sm:p-5 rounded-2xl border space-y-4 ${themeClasses.bgSecondary} ${themeClasses.border}`}>
                    <h4 className="text-xs font-black text-amber-600 dark:text-amber-400 uppercase tracking-wider flex items-center gap-2">
                      <FileText className="w-4 h-4" /> Header Kop Surat & Dual Logo
                    </h4>

                    {/* Logo Kiri & Logo Kanan Upload */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
                      {/* Logo 1 (Header Kiri) */}
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Logo 1 (Header Kiri)</label>
                        <div className="flex items-center gap-3">
                          <div className="w-14 h-14 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 flex items-center justify-center overflow-hidden shrink-0 shadow-xs">
                            {appSettings.it_logo_left || appSettings.custom_logo ? (
                              <img src={appSettings.it_logo_left || appSettings.custom_logo} alt="Logo Left" className="w-full h-full object-contain p-1" />
                            ) : (
                              <ImageIcon className="w-6 h-6 text-slate-300" />
                            )}
                          </div>
                          <div className="space-y-1.5 flex-1">
                            <div className="flex items-center gap-2">
                              <label className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-[10px] font-black uppercase tracking-wider cursor-pointer transition-all flex items-center gap-1">
                                <Upload className="w-3 h-3" /> Upload Logo 1
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      const reader = new FileReader();
                                      reader.onloadend = () => {
                                        setAppSettings({ ...appSettings, it_logo_left: reader.result as string });
                                      };
                                      reader.readAsDataURL(file);
                                    }
                                  }}
                                />
                              </label>
                              {appSettings.it_logo_left && (
                                <button
                                  type="button"
                                  onClick={() => setAppSettings({ ...appSettings, it_logo_left: '' })}
                                  className="px-2.5 py-1.5 bg-rose-500/10 text-rose-500 rounded-lg text-[10px] font-bold hover:bg-rose-500 hover:text-white transition-all"
                                >
                                  Hapus
                                </button>
                              )}
                            </div>
                            <input
                              type="text"
                              value={appSettings.it_logo_left ?? ''}
                              onChange={(e) => setAppSettings({ ...appSettings, it_logo_left: e.target.value })}
                              placeholder="atau tempel URL Gambar Logo 1..."
                              className={`w-full px-2.5 py-1 rounded-lg border text-[10px] font-mono outline-none ${themeClasses.bgCard} ${themeClasses.border} ${themeClasses.text}`}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Logo 2 (Header Kanan) */}
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Logo 2 (Header Kanan)</label>
                        <div className="flex items-center gap-3">
                          <div className="w-14 h-14 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 flex items-center justify-center overflow-hidden shrink-0 shadow-xs">
                            {appSettings.it_logo_right ? (
                              <img src={appSettings.it_logo_right} alt="Logo Right" className="w-full h-full object-contain p-1" />
                            ) : (
                              <ImageIcon className="w-6 h-6 text-slate-300" />
                            )}
                          </div>
                          <div className="space-y-1.5 flex-1">
                            <div className="flex items-center gap-2">
                              <label className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-[10px] font-black uppercase tracking-wider cursor-pointer transition-all flex items-center gap-1">
                                <Upload className="w-3 h-3" /> Upload Logo 2
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      const reader = new FileReader();
                                      reader.onloadend = () => {
                                        setAppSettings({ ...appSettings, it_logo_right: reader.result as string });
                                      };
                                      reader.readAsDataURL(file);
                                    }
                                  }}
                                />
                              </label>
                              {appSettings.it_logo_right && (
                                <button
                                  type="button"
                                  onClick={() => setAppSettings({ ...appSettings, it_logo_right: '' })}
                                  className="px-2.5 py-1.5 bg-rose-500/10 text-rose-500 rounded-lg text-[10px] font-bold hover:bg-rose-500 hover:text-white transition-all"
                                >
                                  Hapus
                                </button>
                              )}
                            </div>
                            <input
                              type="text"
                              value={appSettings.it_logo_right ?? ''}
                              onChange={(e) => setAppSettings({ ...appSettings, it_logo_right: e.target.value })}
                              placeholder="atau tempel URL Gambar Logo 2..."
                              className={`w-full px-2.5 py-1 rounded-lg border text-[10px] font-mono outline-none ${themeClasses.bgCard} ${themeClasses.border} ${themeClasses.text}`}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Nama Perusahaan / Instansi</label>
                        <input
                          type="text"
                          value={appSettings.it_company_name ?? appSettings.company_name ?? ''}
                          onChange={(e) => setAppSettings({ ...appSettings, it_company_name: e.target.value })}
                          placeholder="misal: PT. INDOFOOD FORTUNA LAND"
                          className={`w-full px-3.5 py-2 rounded-xl border text-xs font-medium outline-none focus:ring-2 focus:ring-amber-500 ${themeClasses.bgCard} ${themeClasses.border} ${themeClasses.text}`}
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Sub Judul Divisi / Departemen</label>
                        <input
                          type="text"
                          value={appSettings.it_dept_subtitle ?? ''}
                          onChange={(e) => setAppSettings({ ...appSettings, it_dept_subtitle: e.target.value })}
                          placeholder="misal: DEPARTEMEN INFORMATION & TECHNOLOGY (IT)"
                          className={`w-full px-3.5 py-2 rounded-xl border text-xs font-medium outline-none focus:ring-2 focus:ring-amber-500 ${themeClasses.bgCard} ${themeClasses.border} ${themeClasses.text}`}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Alamat / Kontak / Info Kop Surat</label>
                        <input
                          type="text"
                          value={appSettings.it_company_address ?? ''}
                          onChange={(e) => setAppSettings({ ...appSettings, it_company_address: e.target.value })}
                          placeholder="misal: Gedung Utama, Lt. 3 • Telp: (021) 555-0199 • Email: it.helpdesk@company.com"
                          className={`w-full px-3.5 py-2 rounded-xl border text-xs font-medium outline-none focus:ring-2 focus:ring-amber-500 ${themeClasses.bgCard} ${themeClasses.border} ${themeClasses.text}`}
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Judul Dokumen Surat Rekomendasi</label>
                        <input
                          type="text"
                          value={appSettings.it_document_title ?? ''}
                          onChange={(e) => setAppSettings({ ...appSettings, it_document_title: e.target.value })}
                          placeholder="misal: SURAT REKOMENDASI TINDAKAN IT"
                          className={`w-full px-3.5 py-2 rounded-xl border text-xs font-medium outline-none focus:ring-2 focus:ring-amber-500 ${themeClasses.bgCard} ${themeClasses.border} ${themeClasses.text}`}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Section 2: Form Tanda Tangan & Digital Signature IT */}
                  <div className={`p-4 sm:p-5 rounded-2xl border space-y-4 ${themeClasses.bgSecondary} ${themeClasses.border}`}>
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                        <Edit3 className="w-4 h-4" /> Form Tanda Tangan & Petugas IT
                      </h4>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        Format Resmi: 2 Penandatangan
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Nama Petugas IT (PIC IT Support)</label>
                        <input
                          type="text"
                          value={appSettings.it_pic_name ?? 'Yudha Pregita (PIC IT K3DK)'}
                          onChange={(e) => setAppSettings({ ...appSettings, it_pic_name: e.target.value })}
                          placeholder="Yudha Pregita (PIC IT K3DK)"
                          className={`w-full px-3.5 py-2 rounded-xl border text-xs font-bold text-emerald-600 dark:text-emerald-400 outline-none focus:ring-2 focus:ring-emerald-500 ${themeClasses.bgCard} ${themeClasses.border}`}
                        />
                        <p className="text-[10px] text-slate-400">Nama Petugas IT default yang tercantum di Surat Rekomendasi.</p>
                      </div>

                      {/* Tanda Tangan Digital IT */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Tanda Tangan Digital IT (PNG/Gambar)</label>
                        <div className="flex items-center gap-3">
                          <div className="w-16 h-12 rounded-xl border border-dashed border-emerald-300 dark:border-emerald-700 bg-white dark:bg-slate-900 flex items-center justify-center overflow-hidden shrink-0 shadow-xs">
                            {appSettings.it_digital_signature ? (
                              <img src={appSettings.it_digital_signature} alt="TTD IT" className="max-h-10 max-w-full object-contain p-0.5" />
                            ) : (
                              <span className="text-[9px] text-slate-300 font-bold italic">Tanpa TTD</span>
                            )}
                          </div>
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center gap-2">
                              <label className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-black uppercase tracking-wider cursor-pointer transition-all flex items-center gap-1">
                                <Upload className="w-3 h-3" /> Upload TTD
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      const reader = new FileReader();
                                      reader.onloadend = () => {
                                        setAppSettings({ ...appSettings, it_digital_signature: reader.result as string });
                                      };
                                      reader.readAsDataURL(file);
                                    }
                                  }}
                                />
                              </label>
                              {appSettings.it_digital_signature && (
                                <button
                                  type="button"
                                  onClick={() => setAppSettings({ ...appSettings, it_digital_signature: '' })}
                                  className="px-2 py-1 bg-rose-500/10 text-rose-500 rounded-lg text-[10px] font-bold hover:bg-rose-500 hover:text-white transition-all"
                                >
                                  Hapus
                                </button>
                              )}
                            </div>
                            <input
                              type="text"
                              value={appSettings.it_digital_signature ?? ''}
                              onChange={(e) => setAppSettings({ ...appSettings, it_digital_signature: e.target.value })}
                              placeholder="atau tempel URL Gambar TTD..."
                              className={`w-full px-2.5 py-0.5 rounded-lg border text-[10px] font-mono outline-none ${themeClasses.bgCard} ${themeClasses.border} ${themeClasses.text}`}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-200 dark:border-slate-800">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Label Penandatangan 1 (Pembuat / IT Support)</label>
                        <input
                          type="text"
                          value={appSettings.it_sig1_title ?? ''}
                          onChange={(e) => setAppSettings({ ...appSettings, it_sig1_title: e.target.value })}
                          placeholder="Dikeluarkan Oleh (IT Support)"
                          className={`w-full px-3.5 py-2 rounded-xl border text-xs font-medium outline-none focus:ring-2 focus:ring-emerald-500 ${themeClasses.bgCard} ${themeClasses.border} ${themeClasses.text}`}
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Label Penandatangan 2 (Penyetuju / Atasan)</label>
                        <input
                          type="text"
                          value={appSettings.it_sig2_title ?? ''}
                          onChange={(e) => setAppSettings({ ...appSettings, it_sig2_title: e.target.value })}
                          placeholder="Disetujui Oleh (Sub Dept Head)"
                          className={`w-full px-3.5 py-2 rounded-xl border text-xs font-medium outline-none focus:ring-2 focus:ring-emerald-500 ${themeClasses.bgCard} ${themeClasses.border} ${themeClasses.text}`}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Section 3: Template Catatan Default */}
                  <div className={`p-4 sm:p-5 rounded-2xl border space-y-4 ${themeClasses.bgSecondary} ${themeClasses.border}`}>
                    <h4 className="text-xs font-black text-blue-600 dark:text-blue-400 uppercase tracking-wider flex items-center gap-2">
                      <Zap className="w-4 h-4" /> Template Catatan Rekomendasi Default
                    </h4>

                    <div className="space-y-3">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-amber-500 inline-block"></span>
                          Catatan Default "Dipinjamkan"
                        </label>
                        <textarea
                          rows={2}
                          value={appSettings.it_default_loan_notes ?? ''}
                          onChange={(e) => setAppSettings({ ...appSettings, it_default_loan_notes: e.target.value })}
                          placeholder="Unit perangkat pengganti sementara telah disiapkan dan diserahkan. Harap menjaga kondisi fisik dan mengembalikan unit setelah perbaikan selesai."
                          className={`w-full px-3.5 py-2 rounded-xl border text-xs font-medium outline-none focus:ring-2 focus:ring-blue-500 ${themeClasses.bgCard} ${themeClasses.border} ${themeClasses.text}`}
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-rose-500 inline-block"></span>
                          Catatan Default "Harus Dibeli"
                        </label>
                        <textarea
                          rows={2}
                          value={appSettings.it_default_buy_notes ?? ''}
                          onChange={(e) => setAppSettings({ ...appSettings, it_default_buy_notes: e.target.value })}
                          placeholder="Berdasarkan hasil pemeriksaan teknis IT, komponen/perangkat mengalami kerusakan permanen dan tidak efisien untuk diperbaiki. Direkomendasikan pengadaan unit baru."
                          className={`w-full px-3.5 py-2 rounded-xl border text-xs font-medium outline-none focus:ring-2 focus:ring-blue-500 ${themeClasses.bgCard} ${themeClasses.border} ${themeClasses.text}`}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Section 4: Live Preview Miniature */}
                  <div className={`p-4 sm:p-5 rounded-2xl border space-y-3 bg-white text-slate-900 border-slate-300 shadow-sm`}>
                    <div className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 border-b pb-2 flex items-center justify-between">
                      <span>Pratinjau Hasil Cetak Kop & Tanda Tangan (Preview)</span>
                      <span className="text-emerald-600 font-bold">2 Penandatangan</span>
                    </div>

                    <div className="flex items-center justify-between gap-2 py-2 border-b-2 border-slate-900 border-double">
                      <div className="w-12 shrink-0 text-left">
                        {appSettings.it_logo_left || appSettings.custom_logo ? (
                          <img src={appSettings.it_logo_left || appSettings.custom_logo} alt="L1" className="max-h-10 max-w-12 object-contain" />
                        ) : null}
                      </div>
                      <div className="flex-1 text-center">
                        <h3 className="text-xs sm:text-sm font-black uppercase text-slate-900 tracking-wide">
                          {appSettings.it_company_name || appSettings.company_name || 'PT. INDOFOOD FORTUNA LAND'}
                        </h3>
                        <p className="text-[10px] font-extrabold text-blue-600 uppercase">
                          {appSettings.it_dept_subtitle || 'DEPARTEMEN INFORMATION & TECHNOLOGY (IT)'}
                        </p>
                        <p className="text-[8.5px] text-slate-500 font-medium">
                          {appSettings.it_company_address || 'Gedung Utama, Lt. 3 • Telp: (021) 555-0199 • Email: it.helpdesk@company.com'}
                        </p>
                      </div>
                      <div className="w-12 shrink-0 text-right">
                        {appSettings.it_logo_right ? (
                          <img src={appSettings.it_logo_right} alt="L2" className="max-h-10 max-w-12 object-contain" />
                        ) : null}
                      </div>
                    </div>

                    <div className="text-center py-1">
                      <h4 className="text-xs font-black underline uppercase tracking-wider text-slate-900">
                        {appSettings.it_document_title || 'SURAT REKOMENDASI TINDAKAN IT'}
                      </h4>
                      <p className="text-[9px] font-mono text-slate-400 font-bold">Nomor Tiket: #20260807001</p>
                    </div>

                    <div className="pt-4 grid grid-cols-2 gap-4 text-center">
                      <div className="border-t border-slate-300 pt-1">
                        <div className="text-[9.5px] font-bold text-slate-600 uppercase">
                          {appSettings.it_sig1_title || 'Dikeluarkan Oleh (IT Support)'}
                        </div>
                        <div className="h-10 flex items-center justify-center my-1">
                          {appSettings.it_digital_signature ? (
                            <img src={appSettings.it_digital_signature} alt="TTD" className="max-h-9 max-w-28 object-contain" />
                          ) : null}
                        </div>
                        <div className="text-[10px] font-black border-b border-slate-800 pb-0.5">
                          {appSettings.it_pic_name || 'Yudha Pregita (PIC IT K3DK)'}
                        </div>
                        <div className="text-[8.5px] text-slate-500">IT Support</div>
                      </div>

                      <div className="border-t border-slate-300 pt-1">
                        <div className="text-[9.5px] font-bold text-slate-600 uppercase">
                          {appSettings.it_sig2_title || 'Disetujui Oleh (Sub Dept Head)'}
                        </div>
                        <div className="h-10 flex items-center justify-center my-1"></div>
                        <div className="text-[10px] font-black border-b border-slate-800 pb-0.5">(........................................)</div>
                        <div className="text-[8.5px] text-slate-500">Sub Dept Head - Treasury</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {settingsTab === 'bug_log' && (
                <BugLogTab isDark={isDark} themeClasses={themeClasses} adminUser={adminUser} />
              )}

            </form>
          </div>
        </div>

        <div className={`p-4 sm:p-6 border-t shrink-0 flex justify-end ${themeClasses.border} ${themeClasses.bgCard}`}>
          <button 
            form="settings-form"
            type="submit"
            style={{ backgroundColor: primaryColor }}
            className="w-full sm:w-auto px-8 py-3 sm:py-3 rounded-2xl text-white font-black capitalize tracking-widest text-xs sm:text-sm shadow-xl shadow-emerald-900/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <Save className="w-4 h-4" /> Simpan Konfigurasi
          </button>
        </div>
    </div>
  );

  if (inline) {
    return content;
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div 
        key="settings-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={() => setShowSettings?.(false)}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
      />
      <motion.div 
        key="settings-content"
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="w-full max-w-4xl flex flex-col"
      >
        {content}
      </motion.div>
    </div>
  );
});
