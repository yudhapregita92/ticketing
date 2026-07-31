import { ITicket } from '../types';

export const formatPhoneNumber = (phone: string | null | undefined): string => {
  if (!phone) return '';
  let cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('0')) {
    cleaned = '62' + cleaned.slice(1);
  } else if (cleaned.startsWith('8')) {
    cleaned = '62' + cleaned;
  }
  return cleaned;
};

export const findAgentPhoneNumber = (
  assignedTo: string | null | undefined,
  adminUsers: any[] = [],
  teamMembers: any[] = [],
  masterUsers: any[] = []
): { phone: string; name: string } | null => {
  if (!assignedTo) return null;
  const cleanAssigned = assignedTo.replace(/^@/, '').trim().toLowerCase();
  if (!cleanAssigned) return null;

  // 1. Search adminUsers
  if (Array.isArray(adminUsers)) {
    const admin = adminUsers.find(
      u => (u.username && u.username.toLowerCase() === cleanAssigned) ||
           (u.full_name && u.full_name.toLowerCase() === cleanAssigned) ||
           (u.username && u.username.toLowerCase().includes(cleanAssigned)) ||
           (u.full_name && u.full_name.toLowerCase().includes(cleanAssigned)) ||
           (cleanAssigned.includes(u.username?.toLowerCase() || '')) ||
           (cleanAssigned.includes(u.full_name?.toLowerCase() || ''))
    );
    if (admin && admin.phone) {
      return { phone: formatPhoneNumber(admin.phone), name: admin.full_name || admin.username };
    }
  }

  // 2. Search teamMembers
  if (Array.isArray(teamMembers)) {
    const member = teamMembers.find(
      m => (m.name && m.name.toLowerCase() === cleanAssigned) ||
           (m.id && m.id.toLowerCase() === cleanAssigned) ||
           (m.name && m.name.toLowerCase().includes(cleanAssigned)) ||
           (cleanAssigned.includes(m.name?.toLowerCase() || ''))
    );
    if (member && member.phone) {
      return { phone: formatPhoneNumber(member.phone), name: member.name };
    }
  }

  // 3. Search masterUsers
  if (Array.isArray(masterUsers)) {
    const master = masterUsers.find(
      u => (u.full_name && u.full_name.toLowerCase() === cleanAssigned) ||
           (u.full_name && u.full_name.toLowerCase().includes(cleanAssigned)) ||
           (cleanAssigned.includes(u.full_name?.toLowerCase() || ''))
    );
    if (master && master.phone) {
      return { phone: formatPhoneNumber(master.phone), name: master.full_name };
    }
  }

  return null;
};

export const generateTicketWhatsAppText = (ticket: ITicket): string => {
  const ticketNo = ticket.ticket_no || `#${ticket.id}`;
  const pelapor = ticket.name || 'Pengguna';
  const dept = ticket.department || '-';
  const phonePelapor = ticket.phone || '-';
  const category = ticket.category || '-';
  const priority = ticket.priority || 'Medium';
  const status = ticket.status || 'Baru';
  const desc = ticket.description || '-';
  const assigned = ticket.assigned_to ? `@${ticket.assigned_to.replace(/^@/, '')}` : 'Belum Ditugaskan';

  return `*PEMBERITAHUAN TIKET IT SUPPORT* 🛠️

*No Tiket:* ${ticketNo}
*Pelapor:* ${pelapor} (${dept})
*HP Pelapor:* ${phonePelapor}
*Kategori:* ${category}
*Prioritas:* ${priority}
*Status:* ${status}

*Deskripsi Kendala:*
${desc}

*Status Penugasan:* Diarahkan ke ${assigned}

_Mohon segera ditindaklanjuti. Terima kasih!_`;
};

export const forwardTicketToWhatsApp = (
  ticket: ITicket,
  adminUsers: any[] = [],
  teamMembers: any[] = [],
  masterUsers: any[] = [],
  overridePhone?: string
) => {
  const text = generateTicketWhatsAppText(ticket);
  let targetPhone = overridePhone ? formatPhoneNumber(overridePhone) : '';

  if (!targetPhone) {
    const agentData = findAgentPhoneNumber(ticket.assigned_to, adminUsers, teamMembers, masterUsers);
    if (agentData) {
      targetPhone = agentData.phone;
    }
  }

  if (targetPhone) {
    const url = `https://wa.me/${targetPhone}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
    return { success: true, phone: targetPhone };
  }

  return { success: false, reason: 'PHONE_NOT_FOUND' };
};
