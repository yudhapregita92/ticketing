import { ITicket, IAppSettings, IAdminUser } from '../types';

export const fetchTicketsApi = async (adminUser: IAdminUser | null) => {
  const url = adminUser 
    ? `/api/tickets?username=${encodeURIComponent(adminUser.username)}&role=${encodeURIComponent(adminUser.role)}`
    : '/api/tickets';
  const res = await fetch(url);
  
  if (!res.ok) {
    const text = await res.text();
    console.error(`API Error (${res.status}):`, text.substring(0, 100));
    throw new Error(`Server returned ${res.status}`);
  }

  return res.json();
};

export const fetchManagementDataApi = async () => {
  const [itRes, deptRes, catRes, usersRes] = await Promise.all([
    fetch('/api/it-personnel'),
    fetch('/api/departments'),
    fetch('/api/categories'),
    fetch('/api/users')
  ]);
  
  if (!itRes.ok || !deptRes.ok || !catRes.ok || !usersRes.ok) {
    throw new Error('Gagal mengambil data manajemen');
  }

  return Promise.all([
    itRes.json(),
    deptRes.json(),
    catRes.json(),
    usersRes.json()
  ]);
};

export const fetchSettingsApi = async () => {
  const res = await fetch('/api/settings');
  if (!res.ok) throw new Error('Failed to fetch settings');
  return res.json();
};

export const loginApi = async (loginData: any) => {
  const res = await fetch('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(loginData)
  });
  return res.json();
};

export const updateTicketApi = async (id: number, data: any) => {
  const res = await fetch(`/api/tickets/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Failed to update ticket');
  return res.json();
};

export const deleteTicketApi = async (id: number) => {
  const res = await fetch(`/api/tickets/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete ticket');
  return res.json();
};

export const resetTicketsApi = async () => {
  const res = await fetch('/api/tickets/reset', { method: 'POST' });
  if (!res.ok) throw new Error('Reset failed');
  return res.json();
};

export const createTicketApi = async (formData: any) => {
  const res = await fetch('/api/tickets', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(formData)
  });
  if (!res.ok) throw new Error('Failed to create ticket');
  return res.json();
};
