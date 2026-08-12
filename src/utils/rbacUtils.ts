export const isSubDeptHeadOrSuperAdmin = (user: any): boolean => {
  if (!user) return false;
  const role = (user.role || '').toString().toLowerCase();
  const jabatan = (user.jabatan || '').toString().toLowerCase();
  const combined = `${role} ${jabatan}`;
  return (
    combined.includes('super admin') ||
    combined.includes('sub dept head') ||
    combined.includes('sub dept') ||
    role === 'manager' ||
    jabatan === 'manager' ||
    role.includes('head') ||
    jabatan.includes('head')
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
