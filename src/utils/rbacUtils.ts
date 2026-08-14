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

export const isStaffOrSectionHead = (user: any): boolean => {
  if (!user) return false;
  const role = (user.role || '').toString().toLowerCase();
  const jabatan = (user.jabatan || '').toString().toLowerCase();
  const combined = `${role} ${jabatan}`;

  if (
    combined.includes('section head') ||
    combined.includes('staff') ||
    combined.includes('specialist') ||
    combined.includes('supervisor')
  ) {
    if (!isSubDeptHeadOrSuperAdmin(user) && !isITSupportStaff(user)) {
      return true;
    }
  }
  return false;
};

export const canViewTeamTickets = (user: any): boolean => {
  if (!user) return false;
  if (isPelaksana(user)) return false;
  return true;
};

export const isPelaksana = (user: any): boolean => {
  if (!user) return false;
  const role = (user.role || '').toString().toLowerCase();
  const jabatan = (user.jabatan || '').toString().toLowerCase();
  const combined = `${role} ${jabatan}`;

  // If user has Atasan, Leadership, Staff, or Admin/IT role, they are NOT Pelaksana
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
    combined.includes('staff') ||
    combined.includes('specialist') ||
    combined.includes('supervisor') ||
    combined.includes('manager') ||
    role === 'manager' ||
    jabatan === 'manager'
  ) {
    return false;
  }

  // Pure Pelaksana / Karyawan / Operator / Worker
  return true;
};

export const isITSupportStaff = (user: any): boolean => {
  if (!user) return false;
  const role = (user.role || '').toString().toLowerCase();
  const jabatan = (user.jabatan || '').toString().toLowerCase();
  const combined = `${role} ${jabatan}`;

  return (
    combined.includes('staff it') ||
    combined.includes('it support') ||
    combined.includes('app support') ||
    combined.includes('admin it')
  );
};

export const getPendingApprovalCount = (tickets: any[], user?: any, masterUsers: any[] = []): number => {
  if (!Array.isArray(tickets)) return 0;
  return tickets.filter(t => {
    // If user is provided, check team match
    if (user && !isTeamTicketForUser(t, user, masterUsers)) return false;

    return (
      (t.action_type === 'Harus Dibeli' || 
       t.status === 'Pending' || 
       t.status === 'Pending Pengadaan' || 
       t.status === 'Menunggu Persetujuan Sub Dept Head') &&
      t.status !== 'Completed' && 
      t.status !== 'Pengadaan Ditolak' && 
      t.status !== 'Disetujui (Dalam Pengadaan)'
    );
  }).length;
};

export const parseSubDepts = (str?: string): string[] => {
  if (!str) return [];
  return str
    .toLowerCase()
    .split(/[,/]/)
    .map((s: string) => s.trim())
    .filter((s: string) => Boolean(s) && s !== '-' && s !== 'none' && s !== 'n/a' && s !== 'null' && s !== 'semua' && s !== 'all');
};

export const isTeamTicketForUser = (ticket: any, user: any, masterUsers: any[] = []): boolean => {
  if (!user || !ticket) return false;

  const masterMe = Array.isArray(masterUsers) ? masterUsers.find((m: any) => 
    (m.id && user.id && Number(m.id) === Number(user.id)) ||
    (m.employee_index && user.employee_index && String(m.employee_index).toLowerCase().trim() === String(user.employee_index).toLowerCase().trim()) ||
    (m.full_name && user.full_name && m.full_name.toLowerCase().trim() === user.full_name.toLowerCase().trim()) ||
    (m.username && user.username && m.username.toLowerCase().trim() === user.username.toLowerCase().trim())
  ) : null;
  const activeUser = masterMe ? { ...user, ...masterMe } : user;

  const myRole = (activeUser.role || '').toString().toLowerCase();
  const myJabatan = (activeUser.jabatan || '').toString().toLowerCase();
  const combined = `${myRole} ${myJabatan}`;

  if (
    combined.includes('admin') || 
    combined.includes('super admin') || 
    combined.includes('superadmin') || 
    combined.includes('it support') || 
    combined.includes('staff it') || 
    combined.includes('app support')
  ) {
    return true;
  }

  const myId = activeUser.id;
  const myDept = (activeUser.department || '').toString().toLowerCase().trim();
  const tDept = (ticket.department || '').toString().toLowerCase().trim();
  const mySubDepts = parseSubDepts(activeUser.sub_department);

  // Find creator in masterUsers
  const creator = Array.isArray(masterUsers) ? masterUsers.find((u: any) => 
    (u.id && ticket.user_id && Number(u.id) === Number(ticket.user_id)) ||
    (u.full_name && ticket.name && u.full_name.toLowerCase().trim() === ticket.name.toLowerCase().trim()) || 
    (u.employee_index && ticket.employee_index && String(u.employee_index).toLowerCase().trim() === String(ticket.employee_index).toLowerCase().trim())
  ) : null;

  // 1. Direct Atasan match (if creator's atasan_id points to user's id)
  if (creator && creator.atasan_id && (Number(creator.atasan_id) === Number(myId) || String(creator.atasan_id) === String(myId))) {
    return true;
  }

  const creatorDept = creator ? (creator.department || '').toString().toLowerCase().trim() : tDept;
  const creatorSubDepts = creator ? parseSubDepts(creator.sub_department) : parseSubDepts(ticket.sub_department);
  const ticketSubDepts = parseSubDepts(ticket.sub_department);
  const allTicketSubDepts = Array.from(new Set([...creatorSubDepts, ...ticketSubDepts]));

  // Check department match first
  const deptMatch = (myDept && myDept !== '-' && (myDept === creatorDept || myDept === tDept));

  // If user sub_department explicitly contains creatorDept or tDept
  const subDeptContainsDept = mySubDepts.includes(creatorDept) || mySubDepts.includes(tDept);

  if (!deptMatch && !subDeptContainsDept) {
    return false;
  }

  // Department matches! Now handle sub-department isolation:
  // Is user a top-level leader for the whole department (Dept Head, KDKHead, Manager)?
  const isTopDeptLeader = 
    combined.includes('dept head') ||
    combined.includes('department head') ||
    combined.includes('kdkhead') ||
    combined.includes('kdk head') ||
    myRole === 'manager' ||
    myJabatan === 'manager';

  if (isTopDeptLeader) {
    return true; // Top dept leader can see all sub-departments in their department
  }

  // If user has specific sub-departments assigned (e.g. ["tax"]):
  if (mySubDepts.length > 0) {
    if (allTicketSubDepts.length > 0) {
      // Must have at least 1 overlapping sub-department
      const hasOverlap = allTicketSubDepts.some((s: string) => mySubDepts.includes(s));
      return hasOverlap;
    } else {
      // If user is a Sub Dept Head or Section Head, do not allow leakage across sub-departments
      if (combined.includes('sub') || combined.includes('section')) {
        return false;
      }
    }
  }

  return true;
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

  // 3. Pure Pelaksana / Karyawan CANNOT view other users' tickets
  if (isPelaksana(activeUser)) {
    return false;
  }

  // 4. Staff, Section Head, Sub Dept Head, KDKHead, Dept Head, Manager: Must match team & sub-department rules
  return isTeamTicketForUser(ticket, activeUser, masterUsers);
};
