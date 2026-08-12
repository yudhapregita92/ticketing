export const isSubDeptHeadOrSuperAdmin = (user: any): boolean => {
  if (!user) return false;
  const role = (user.role || user.jabatan || '').toString().toLowerCase();
  return (
    role.includes('super admin') ||
    role.includes('sub dept head') ||
    role.includes('sub dept') ||
    role === 'manager' ||
    role.includes('head')
  );
};

export const isITSupportStaff = (user: any): boolean => {
  if (!user) return false;
  const role = (user.role || '').toString().toLowerCase();
  return (
    role.includes('staff it') ||
    role.includes('it support') ||
    role.includes('pelaksana') ||
    role.includes('app support')
  );
};

export const getPendingApprovalCount = (tickets: any[]): number => {
  if (!Array.isArray(tickets)) return 0;
  return tickets.filter(t => 
    (t.action_type === 'Harus Dibeli' || 
     t.status === 'Pending' || 
     t.status === 'Pending Pengadaan' || 
     t.status === 'Menunggu Persetujuan Sub Dept Head') &&
    t.status !== 'Completed' && 
    t.status !== 'Pengadaan Ditolak' && 
    t.status !== 'Disetujui (Dalam Pengadaan)'
  ).length;
};
