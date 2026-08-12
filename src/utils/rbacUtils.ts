import { isUserTicket } from './ticketUtils';

export const isSubDeptHeadOrSuperAdmin = (user: any): boolean => {
  if (!user) return false;
  const role = (user.role || '').toString().toLowerCase();
  const jabatan = (user.jabatan || '').toString().toLowerCase();
  const combined = `${role} ${jabatan}`;

  if (combined.includes('super admin') || combined.includes('superadmin')) return true;
  if (combined.includes('sub dept head') || combined.includes('sub dept') || combined.includes('subdept')) return true;
  if (combined.includes('kdkhead') || combined.includes('kdk head')) return true;
  if (combined.includes('dept head') || combined.includes('department head')) return true;
  if (role === 'manager' || jabatan === 'manager') return true;

  return false;
};

export const canViewTeamTickets = (user: any): boolean => {
  if (!user) return false;
  const role = (user.role || '').toString().toLowerCase();
  const jabatan = (user.jabatan || '').toString().toLowerCase();
  const combined = `${role} ${jabatan}`;

  if (combined.includes('super admin') || combined.includes('admin') || combined.includes('it support')) return true;
  if (combined.includes('sub dept head') || combined.includes('kdkhead') || combined.includes('dept head')) return true;
  if (combined.includes('section head') || combined.includes('staff') || combined.includes('specialist')) return true;
  if (role === 'manager' || jabatan === 'manager') return true;

  return false;
};

export const isPelaksana = (user: any): boolean => {
  if (!user) return false;
  const role = (user.role || '').toString().toLowerCase();
  const jabatan = (user.jabatan || '').toString().toLowerCase();
  const combined = `${role} ${jabatan}`;

  // If user has Atasan or Admin/IT role, they are NOT Pelaksana
  if (
    combined.includes('super admin') ||
    combined.includes('superadmin') ||
    combined.includes('admin') ||
    combined.includes('it support') ||
    combined.includes('staff it') ||
    combined.includes('app support') ||
    combined.includes('sub dept head') ||
    combined.includes('sub dept') ||
    combined.includes('subdept') ||
    combined.includes('kdkhead') ||
    combined.includes('kdk head') ||
    combined.includes('dept head') ||
    combined.includes('department head') ||
    combined.includes('section head') ||
    combined.includes('manager') ||
    role === 'manager' ||
    jabatan === 'manager'
  ) {
    return false;
  }

  // Everyone else is Pelaksana / Karyawan / Regular User
  return true;
};

export const isITSupportStaff = (user: any): boolean => {
  if (!user) return false;
  const role = (user.role || '').toString().toLowerCase();
  return (
    role.includes('staff it') ||
    role.includes('it support') ||
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

export const parseSubDepts = (str?: string): string[] => {
  if (!str) return [];
  return str
    .toLowerCase()
    .split(/[,/]/)
    .map((s: string) => s.trim())
    .filter((s: string) => Boolean(s) && s !== '-' && s !== 'none' && s !== 'n/a' && s !== 'null');
};

export const isTeamTicketForUser = (ticket: any, user: any, masterUsers: any[] = []): boolean => {
  if (!user || !ticket) return false;

  const myRole = (user.role || '').toLowerCase();
  if (myRole === 'admin' || myRole.includes('super admin')) return true;

  const myId = user.id;
  const myDept = (user.department || '').toLowerCase().trim();
  const tDept = (ticket.department || '').toLowerCase().trim();
  const mySubDepts = parseSubDepts(user.sub_department);

  // Creator lookup
  const creator = masterUsers.find((u: any) => 
    (u.full_name && ticket.name && u.full_name.toLowerCase() === ticket.name.toLowerCase()) || 
    (u.employee_index && ticket.employee_index && u.employee_index === ticket.employee_index)
  );

  // 1. Direct Atasan match
  if (creator && creator.atasan_id && creator.atasan_id === myId) {
    return true;
  }

  // 2. Department & Sub-Department match
  const creatorDept = creator ? (creator.department || '').toLowerCase().trim() : tDept;
  const creatorSubDepts = creator ? parseSubDepts(creator.sub_department) : parseSubDepts(ticket.sub_department);

  if (mySubDepts.length > 0) {
    if (
      mySubDepts.includes(creatorDept) || 
      mySubDepts.includes(tDept) ||
      creatorSubDepts.some((s: string) => mySubDepts.includes(s))
    ) {
      return true;
    }
  }

  if (myDept && myDept !== '-') {
    if (creatorDept === myDept || tDept === myDept) {
      return true;
    }
  }

  return false;
};

export const canViewTicketDetail = (
  ticket: any,
  user: any,
  adminUser: any,
  masterUsers: any[] = []
): boolean => {
  // 1. Super Admin / Admin / IT Support can view everything
  if (adminUser) return true;
  if (!user) return false;

  // Lookup in masterUsers to get complete user metadata if available
  const master = masterUsers.find((m: any) => 
    (m.id && user.id && Number(m.id) === Number(user.id)) ||
    (m.employee_index && user.employee_index && String(m.employee_index).toLowerCase().trim() === String(user.employee_index).toLowerCase().trim()) ||
    (m.full_name && user.full_name && m.full_name.toLowerCase().trim() === user.full_name.toLowerCase().trim()) ||
    (m.username && user.username && m.username.toLowerCase().trim() === user.username.toLowerCase().trim())
  );
  
  const activeUser = master ? { ...user, ...master } : user;

  const myRole = (activeUser.role || '').toString().toLowerCase().trim();
  const myJabatan = (activeUser.jabatan || '').toString().toLowerCase().trim();
  const combined = `${myRole} ${myJabatan}`;

  // IT Team / Admin roles -> Full access
  if (
    combined.includes('super admin') ||
    combined.includes('superadmin') ||
    combined.includes('admin') ||
    combined.includes('it support') ||
    combined.includes('staff it') ||
    combined.includes('app support')
  ) {
    return true;
  }

  // 2. Ticket creator can ALWAYS view their own ticket
  if (isUserTicket(ticket, activeUser) || isUserTicket(ticket, user)) {
    return true;
  }

  // 3. Pelaksana / Regular Employee CANNOT view other users' tickets even in the same department
  if (isPelaksana(activeUser)) {
    return false;
  }

  // 4. For Atasan / Leadership: Check department match
  const inSameDept = isTeamTicketForUser(ticket, activeUser, masterUsers);
  if (!inSameDept) {
    return false;
  }

  // 5. Within same department: Atasan (Sub Dept Head, Section Head, Dept Head, KDKHead, Manager) can view
  const isDeptAtasan = 
    combined.includes('sub dept head') ||
    combined.includes('sub dept') ||
    combined.includes('subdept') ||
    combined.includes('kdkhead') ||
    combined.includes('kdk head') ||
    combined.includes('dept head') ||
    combined.includes('department head') ||
    combined.includes('section head') ||
    combined.includes('manager') ||
    myRole === 'manager' ||
    myJabatan === 'manager';

  if (isDeptAtasan) {
    return true;
  }

  return false;
};
