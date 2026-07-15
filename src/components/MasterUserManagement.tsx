import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  Download, 
  Upload, 
  Plus, 
  Printer, 
  Search, 
  X, 
  Key, 
  Sparkles, 
  Edit3, 
  Trash2,
  Building2,
  Phone,
  Hash,
  Laptop,
  Mail,
  UserCheck
} from 'lucide-react';
import * as xlsx from 'xlsx';
import { api } from '../services/api';
import toast from 'react-hot-toast';

interface MasterUserManagementProps {
  isDark: boolean;
  themeClasses: any;
  masterUsers: any[];
  departments: any[];
  handleManagementAction: (type: 'it' | 'dept' | 'cat' | 'master-user' | 'admin-user', action: 'add' | 'delete' | 'refresh', item?: any) => void;
  adminUser: any;
}

export const MasterUserManagement: React.FC<MasterUserManagementProps> = ({
  isDark,
  themeClasses,
  masterUsers,
  departments,
  handleManagementAction,
  adminUser
}) => {
  const [masterUserName, setMasterUserName] = React.useState('');
  const [masterUserDept, setMasterUserDept] = React.useState('');
  const [masterUserPhone, setMasterUserPhone] = React.useState('');
  const [masterUserIndex, setMasterUserIndex] = React.useState('');
  const [masterUserEmail, setMasterUserEmail] = React.useState('');
  const [masterUserJenisPiranti, setMasterUserJenisPiranti] = React.useState('(Tidak Ada)');
  const [masterUserKodePiranti, setMasterUserKodePiranti] = React.useState('');
  const [masterUserJabatan, setMasterUserJabatan] = React.useState('');
  const [editingMasterUser, setEditingMasterUser] = React.useState<any | null>(null);
  const [masterUserSearch, setMasterUserSearch] = React.useState('');
  const [addingType, setAddingType] = React.useState<'master-user' | null>(null);

  const filteredMasterUsers = React.useMemo(() => {
    if (!Array.isArray(masterUsers)) return [];
    const term = masterUserSearch.toLowerCase().trim();
    if (!term) return masterUsers;
    return masterUsers.filter(user => 
      (user.full_name || '').toLowerCase().includes(term) ||
      (user.department || '').toLowerCase().includes(term) ||
      (user.employee_index || '').toLowerCase().includes(term) ||
      (user.jenis_piranti || '').toLowerCase().includes(term) ||
      (user.kode_piranti || '').toLowerCase().includes(term)
    );
  }, [masterUsers, masterUserSearch]);

  const handleDownloadTemplate = () => {
    const templateData = [
      {
        'Nama Lengkap': 'Budi Santoso',
        'Bagian / Departemen': 'HRGA',
        'No. Telepon': '081234567890',
        'Index Karyawan': '12345',
        'Jenis Piranti': 'Komputer',
        'Kode Piranti': 'KMP-001',
        'Email': 'budi@example.com',
        'Jabatan': 'Staff GA'
      },
      {
        'Nama Lengkap': 'Siti Aminah',
        'Bagian / Departemen': 'CE Business',
        'No. Telepon': '081234567891',
        'Index Karyawan': '67890',
        'Jenis Piranti': 'Laptop',
        'Kode Piranti': 'LPT-002',
        'Email': 'siti@example.com',
        'Jabatan': 'Supervisor CE'
      },
      {
        'Nama Lengkap': 'Andi Wijaya',
        'Bagian / Departemen': 'Fleet Business',
        'No. Telepon': '081234567892',
        'Index Karyawan': '11223',
        'Jenis Piranti': '(Tidak Ada)',
        'Kode Piranti': '-',
        'Email': '',
        'Jabatan': 'Driver'
      }
    ];

    const ws = xlsx.utils.json_to_sheet(templateData);
    const wb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb, ws, 'Template Master User');
    xlsx.writeFile(wb, 'Template_Import_User.xlsx');
    toast.success('Template berhasil diunduh');
  };

  const handleUploadExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const data = await api.uploadMasterUsers(file);
      if (data) {
        toast.success(`Berhasil mengunggah ${data.count} user.`);
        handleManagementAction('master-user', 'refresh');
      }
    } catch (err: any) {
      console.error('Upload error:', err);
      toast.error(`Gagal mengunggah file: ${err.message || 'Terjadi kesalahan'}`);
    } finally {
      e.target.value = '';
    }
  };

  const handlePrintLabel = (user: any) => {
    const printWindow = window.open('', '', 'width=600,height=400');
    if (!printWindow) {
      toast.error("Browser memblokir pop-up. Izinkan pop-up untuk mencetak label.");
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
      toast.error('Tidak ada data master user untuk dicetak');
      return;
    }

    const pcUsers = masterUsers.filter(user => user.kode_piranti && user.kode_piranti !== '-');
    
    if (pcUsers.length === 0) {
      toast.error('Tidak ada user dengan kode piranti');
      return;
    }

    const printWindow = window.open('', '', 'width=800,height=600');
    if (!printWindow) {
      toast.error("Browser memblokir pop-up. Izinkan pop-up untuk mencetak label.");
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
      toast.error('Tidak ada data master user untuk diexport');
      return;
    }

    const exportData = masterUsers.map(user => ({
      'Nama Lengkap': user.full_name || '',
      'Bagian / Departemen': user.department || '',
      'No. Telepon': user.phone || '',
      'Index Karyawan': user.employee_index || '',
      'Jenis Piranti': user.jenis_piranti || '(Tidak Ada)',
      'Kode Piranti': user.kode_piranti || '-',
      'Email': user.email || '',
      'Jabatan': user.jabatan || '',
      'Akses Voucher': user.can_request_voucher === 1 ? 'Ya' : 'Tidak',
      'Fitur Lari-Lari': user.enable_funny_egg === 1 ? 'Aktif' : 'Nonaktif'
    }));

    const ws = xlsx.utils.json_to_sheet(exportData);
    const wb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb, ws, 'Master User');
    xlsx.writeFile(wb, 'Export_Master_User.xlsx');
    toast.success('Data berhasil diexport ke Excel');
  };

  const handleAddMasterUser = async () => {
    if (!masterUserName) {
      toast.error('Nama wajib diisi');
      return;
    }
    try {
      if (editingMasterUser) {
        await api.updateMasterUser(editingMasterUser.id, {
          full_name: masterUserName,
          department: masterUserDept,
          phone: masterUserPhone,
          employee_index: masterUserIndex,
          email: masterUserEmail || null,
          jenis_piranti: masterUserJenisPiranti,
          kode_piranti: masterUserKodePiranti,
          jabatan: masterUserJabatan
        });
        setAddingType(null);
        setEditingMasterUser(null);
        clearForm();
        toast.success('User berhasil diperbarui');
        handleManagementAction('master-user', 'refresh');
      } else {
        await api.addMasterUser({ 
          full_name: masterUserName, 
          department: masterUserDept, 
          phone: masterUserPhone,
          employee_index: masterUserIndex,
          email: masterUserEmail || null,
          jenis_piranti: masterUserJenisPiranti,
          kode_piranti: masterUserKodePiranti,
          jabatan: masterUserJabatan
        });
        setAddingType(null);
        clearForm();
        toast.success('User berhasil ditambahkan');
        handleManagementAction('master-user', 'refresh');
      }
    } catch (err: any) {
      toast.error(err.message || 'Gagal menyimpan user');
    }
  };

  const clearForm = () => {
    setMasterUserName('');
    setMasterUserDept('');
    setMasterUserPhone('');
    setMasterUserIndex('');
    setMasterUserEmail('');
    setMasterUserJenisPiranti('(Tidak Ada)');
    setMasterUserKodePiranti('');
    setMasterUserJabatan('');
  };

  const handleOpenAddMasterUser = () => {
    setEditingMasterUser(null);
    clearForm();
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
    setMasterUserKodePiranti(user.kode_piranti && user.kode_piranti !== '-' ? user.kode_piranti : '');
    setMasterUserJabatan(user.jabatan || '');
    setAddingType('master-user');
  };

  const handleDeleteMasterUser = async (id: number) => {
    if (!confirm('Hapus user ini?')) return;
    try {
      await api.deleteMasterUser(id);
      toast.success('User berhasil dihapus');
      handleManagementAction('master-user', 'refresh');
    } catch (err: any) {
      toast.error(err.message || 'Gagal menghapus user');
    }
  };

  const handleToggleVoucherPrivilege = async (user: any) => {
    const nextVal = user.can_request_voucher === 1 ? 0 : 1;
    try {
      await api.toggleVoucherPrivilege(user.id, nextVal === 1);
      toast.success(`Izin buat voucher untuk ${user.full_name} berhasil ${nextVal === 1 ? 'diberikan' : 'dicabut'}`);
      handleManagementAction('master-user', 'refresh');
    } catch (err: any) {
      toast.error(err.message || 'Gagal mengubah izin voucher');
    }
  };

  const handleToggleFunnyEgg = async (user: any) => {
    const nextVal = user.enable_funny_egg === 1 ? 0 : 1;
    try {
      await api.toggleFunnyEggPrivilege(user.id, nextVal === 1);
      toast.success(`Fitur "Kolom Lari-Lari" (Funny Egg) untuk ${user.full_name} berhasil ${nextVal === 1 ? 'diaktifkan' : 'dinonaktifkan'}`);
      handleManagementAction('master-user', 'refresh');
    } catch (err: any) {
      toast.error(err.message || 'Gagal mengubah fitur lari-lari');
    }
  };

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h2 className={`text-2xl font-black capitalize tracking-tight ${themeClasses.text} flex items-center gap-3`}>
            <Users className="w-7 h-7 text-emerald-500" />
            Master Data (User)
          </h2>
          <p className={`text-xs ${themeClasses.textMuted} mt-1`}>
            Kelola data keanggotaan karyawan, status perangkat, cetak label, dan ekspor/impor data secara aman.
          </p>
        </div>
        
        {/* Buttons Action */}
        <div className="flex flex-wrap items-center gap-2">
          <button 
            type="button"
            onClick={handleDownloadTemplate}
            className="text-xs font-black text-violet-600 hover:text-violet-700 dark:text-violet-400 dark:hover:text-violet-300 capitalize tracking-widest flex items-center gap-1.5 bg-violet-50 dark:bg-violet-950/40 px-3 py-2 rounded-xl transition-all"
          >
            <Download className="w-3.5 h-3.5" /> Download Template
          </button>
          
          <label className="text-xs font-black text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 capitalize tracking-widest cursor-pointer flex items-center gap-1.5 bg-blue-50 dark:bg-blue-950/40 px-3 py-2 rounded-xl transition-all">
            <Upload className="w-3.5 h-3.5" /> Upload Excel
            <input type="file" accept=".xlsx, .xls" className="hidden" onChange={handleUploadExcel} />
          </label>
          
          <button 
            type="button"
            onClick={handleExportMasterUser}
            className="text-xs font-black text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300 capitalize tracking-widest flex items-center gap-1.5 bg-amber-50 dark:bg-amber-950/40 px-3 py-2 rounded-xl transition-all"
          >
            <Download className="w-3.5 h-3.5" /> Export Excel
          </button>
          
          <button 
            type="button"
            onClick={handleOpenAddMasterUser}
            className="text-xs font-black text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 capitalize tracking-widest flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-2 rounded-xl transition-all"
          >
            <Plus className="w-3.5 h-3.5" /> + Tambah User
          </button>
          
          <button 
            type="button"
            onClick={handlePrintAllLabels}
            className="text-xs font-black text-rose-600 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300 capitalize tracking-widest flex items-center gap-1.5 bg-rose-50 dark:bg-rose-950/40 px-3 py-2 rounded-xl transition-all"
          >
            <Printer className="w-3.5 h-3.5" /> Cetak All Label
          </button>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input
          type="text"
          placeholder="Cari Master User berdasarkan Nama, Bagian, atau Index..."
          className={`w-full pl-11 pr-10 py-3 rounded-2xl text-xs font-medium outline-none border transition-all focus:ring-2 focus:ring-emerald-500/20 ${themeClasses.bgSecondary} ${themeClasses.border} ${themeClasses.text}`}
          value={masterUserSearch}
          onChange={e => setMasterUserSearch(e.target.value)}
        />
        {masterUserSearch && (
          <button
            type="button"
            onClick={() => setMasterUserSearch('')}
            className={`absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold px-2 py-1 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 ${themeClasses.textMuted}`}
          >
            ×
          </button>
        )}
      </div>

      {/* Add / Edit Modal */}
      <AnimatePresence>
        {addingType === 'master-user' && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setAddingType(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className={`relative z-[101] w-full max-w-md p-6 rounded-3xl shadow-2xl border ${themeClasses.border} ${themeClasses.card} text-left`}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
                <h4 className={`text-xs font-black capitalize tracking-widest ${themeClasses.text}`}>
                  {editingMasterUser ? 'Edit Master User' : 'Tambah User Manual'}
                </h4>
                <button 
                  type="button" 
                  onClick={() => setAddingType(null)}
                  className={`p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 ${themeClasses.textMuted}`}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              {/* Modal Body */}
              <div className="space-y-4">
                <div>
                  <label className="block text-[9px] font-black uppercase tracking-wider text-slate-400 mb-1.5">Nama Lengkap</label>
                  <input 
                    autoFocus
                    type="text"
                    placeholder="Masukkan nama lengkap"
                    className={`w-full px-3 py-2.5 rounded-xl border text-xs font-medium outline-none focus:ring-2 focus:ring-emerald-500 ${themeClasses.bgSecondary} ${themeClasses.border} ${themeClasses.text}`}
                    value={masterUserName}
                    onChange={e => setMasterUserName(e.target.value)}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[9px] font-black uppercase tracking-wider text-slate-400 mb-1.5">Bagian / Departemen (Opsional)</label>
                    <select 
                      className={`w-full px-3 py-2.5 rounded-xl border text-xs font-medium outline-none focus:ring-2 focus:ring-emerald-500 ${themeClasses.bgSecondary} ${themeClasses.border} ${themeClasses.text}`}
                      value={masterUserDept}
                      onChange={e => setMasterUserDept(e.target.value)}
                    >
                      <option value="">Pilih Bagian...</option>
                      {Array.isArray(departments) && departments.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[9px] font-black uppercase tracking-wider text-slate-400 mb-1.5">No. Telepon (Opsional)</label>
                    <input 
                      type="text"
                      placeholder="No. HP"
                      className={`w-full px-3 py-2.5 rounded-xl border text-xs font-medium outline-none focus:ring-2 focus:ring-emerald-500 ${themeClasses.bgSecondary} ${themeClasses.border} ${themeClasses.text}`}
                      value={masterUserPhone}
                      onChange={e => setMasterUserPhone(e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[9px] font-black uppercase tracking-wider text-slate-400 mb-1.5">Index Karyawan (Opsional)</label>
                    <input 
                      type="text"
                      placeholder="Index Karyawan"
                      className={`w-full px-3 py-2.5 rounded-xl border text-xs font-medium outline-none focus:ring-2 focus:ring-emerald-500 ${themeClasses.bgSecondary} ${themeClasses.border} ${themeClasses.text}`}
                      value={masterUserIndex}
                      onChange={e => setMasterUserIndex(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-black uppercase tracking-wider text-slate-400 mb-1.5">Jenis Piranti (Opsional)</label>
                    <select 
                      className={`w-full px-3 py-2.5 rounded-xl border text-xs font-medium outline-none focus:ring-2 focus:ring-emerald-500 ${themeClasses.bgSecondary} ${themeClasses.border} ${themeClasses.text}`}
                      value={masterUserJenisPiranti}
                      onChange={e => setMasterUserJenisPiranti(e.target.value)}
                    >
                      <option value="(Tidak Ada)">(Tidak Ada)</option>
                      <option value="Komputer">Komputer</option>
                      <option value="Laptop">Laptop</option>
                      <option value="TAB">TAB</option>
                    </select>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[9px] font-black uppercase tracking-wider text-slate-400 mb-1.5">Kode Piranti (Opsional)</label>
                    <input 
                      type="text"
                      placeholder="Contoh: KMP-01 atau LPT-02"
                      className={`w-full px-3 py-2.5 rounded-xl border text-xs font-medium outline-none focus:ring-2 focus:ring-emerald-500 ${themeClasses.bgSecondary} ${themeClasses.border} ${themeClasses.text}`}
                      value={masterUserKodePiranti}
                      onChange={e => setMasterUserKodePiranti(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-black uppercase tracking-wider text-slate-400 mb-1.5">Email (Opsional)</label>
                    <input 
                      type="email"
                      placeholder="Alamat Email (opsional)"
                      className={`w-full px-3 py-2.5 rounded-xl border text-xs font-medium outline-none focus:ring-2 focus:ring-emerald-500 ${themeClasses.bgSecondary} ${themeClasses.border} ${themeClasses.text}`}
                      value={masterUserEmail}
                      onChange={e => setMasterUserEmail(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-[9px] font-black uppercase tracking-wider text-slate-400 mb-1.5">Jabatan (Opsional)</label>
                    <input 
                      type="text"
                      placeholder="Masukkan jabatan"
                      className={`w-full px-3 py-2.5 rounded-xl border text-xs font-medium outline-none focus:ring-2 focus:ring-emerald-500 ${themeClasses.bgSecondary} ${themeClasses.border} ${themeClasses.text}`}
                      value={masterUserJabatan}
                      onChange={e => setMasterUserJabatan(e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="flex gap-2 pt-2">
                  <button 
                    type="button"
                    onClick={() => setAddingType(null)}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-bold border ${themeClasses.border} ${themeClasses.textMuted}`}
                  >
                    Batal
                  </button>
                  <button 
                    type="button"
                    onClick={handleAddMasterUser}
                    className="flex-1 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-500/20 hover:bg-emerald-700 transition-all"
                  >
                    {editingMasterUser ? 'Simpan Perubahan' : 'Simpan User'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* List Card Master Users replaced with a clean list table */}
      <div className={`${themeClasses.card} rounded-2xl border shadow-sm overflow-hidden`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className={`border-b ${isDark ? 'border-slate-800 bg-slate-900/50' : 'border-slate-100 bg-slate-50/50'}`}>
                <th className="px-4 py-3 text-[10px] font-black uppercase tracking-wider text-slate-400">Nama Lengkap</th>
                <th className="px-4 py-3 text-[10px] font-black uppercase tracking-wider text-slate-400">Departemen</th>
                <th className="px-4 py-3 text-[10px] font-black uppercase tracking-wider text-slate-400">No. Telepon</th>
                <th className="px-4 py-3 text-[10px] font-black uppercase tracking-wider text-slate-400">Index</th>
                <th className="px-4 py-3 text-[10px] font-black uppercase tracking-wider text-slate-400">Piranti</th>
                <th className="px-4 py-3 text-[10px] font-black uppercase tracking-wider text-slate-400">Email</th>
                <th className="px-4 py-3 text-[10px] font-black uppercase tracking-wider text-slate-400 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/10">
              {filteredMasterUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400 text-xs font-medium">
                    {masterUserSearch ? 'Tidak ada user yang cocok dengan pencarian' : 'Belum ada data master user'}
                  </td>
                </tr>
              ) : (
                filteredMasterUsers.map(user => (
                  <tr key={user.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-bold text-slate-900 dark:text-white">{user.full_name}</span>
                          {user.can_request_voucher === 1 && (
                            <span className="px-1.5 py-0.5 bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-400 text-[8px] font-black rounded-md uppercase tracking-wider shrink-0">
                              Akses Voucher
                            </span>
                          )}
                          {user.enable_funny_egg === 1 && (
                            <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 text-[8px] font-black rounded-md uppercase tracking-wider shrink-0 flex items-center gap-0.5 animate-pulse">
                              <Sparkles className="w-2.5 h-2.5 text-amber-600 dark:text-amber-400" /> LARI-LARI
                            </span>
                          )}
                        </div>
                        {user.jabatan && user.jabatan !== '-' && (
                          <span className={`text-[10px] text-slate-400 dark:text-slate-500 font-semibold mt-0.5`}>
                            {user.jabatan}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs font-medium text-slate-600 dark:text-slate-300">
                      {user.department || '-'}
                    </td>
                    <td className="px-4 py-3 text-xs font-medium text-slate-600 dark:text-slate-300">
                      {user.phone || '-'}
                    </td>
                    <td className="px-4 py-3 text-xs font-medium text-slate-600 dark:text-slate-300">
                      {user.employee_index || '-'}
                    </td>
                    <td className="px-4 py-3">
                      {user.jenis_piranti && user.jenis_piranti !== '(Tidak Ada)' ? (
                        <div className="flex flex-col">
                          <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">{user.jenis_piranti}</span>
                          <span className="text-[10px] text-slate-400 dark:text-slate-500">Kode: {user.kode_piranti || '-'}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs font-medium text-slate-600 dark:text-slate-300 truncate max-w-[150px]" title={user.email}>
                      {user.email || '-'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button 
                          type="button"
                          onClick={() => handleToggleVoucherPrivilege(user)}
                          className={`p-1.5 rounded-lg transition-all ${
                            user.can_request_voucher === 1 
                              ? 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/60' 
                              : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                          }`}
                          title={user.can_request_voucher === 1 ? "Cabut Hak Akses Voucher" : "Berikan Hak Akses Voucher"}
                        >
                          <Key className="w-3.5 h-3.5" />
                        </button>
                        
                        <button 
                          type="button"
                          onClick={() => handleToggleFunnyEgg(user)}
                          className={`p-1.5 rounded-lg transition-all ${
                            user.enable_funny_egg === 1 
                              ? 'text-amber-600 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/60' 
                              : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                          }`}
                          title={user.enable_funny_egg === 1 ? "Matikan Fitur Kolom Lari-Lari" : "Aktifkan Fitur Kolom Lari-Lari"}
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                        </button>
                        
                        <button 
                          type="button"
                          onClick={() => handlePrintLabel(user)}
                          className="p-1.5 text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-lg transition-all"
                          title="Cetak Label"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                        
                        <button 
                          type="button"
                          onClick={() => handleOpenEditMasterUser(user)}
                          className="p-1.5 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg transition-all"
                          title="Edit User"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        
                        <button 
                          type="button"
                          onClick={() => handleDeleteMasterUser(user.id)}
                          className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-all"
                          title="Hapus User"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
