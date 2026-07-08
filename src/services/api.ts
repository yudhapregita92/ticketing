import { ITicket, IUser, IDepartment, ICategory, IMasterUser, ISettings } from '../types';

const handleResponse = async (res: Response) => {
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API error ${res.status}: ${text}`);
  }
  const contentType = res.headers.get("content-type");
  if (!contentType || !contentType.includes("application/json")) {
    throw new Error("API returned non-JSON response");
  }
  return res.json();
};

export const api = {
  // Tickets
  getTickets: async (username?: string, role?: string): Promise<ITicket[]> => {
    const url = username && role 
      ? `/api/tickets?username=${encodeURIComponent(username)}&role=${encodeURIComponent(role)}`
      : '/api/tickets';
    const res = await fetch(url);
    return handleResponse(res);
  },

  getTicketDetails: async (id: number) => {
    const [photoRes, facePhotoRes, logsRes] = await Promise.all([
      fetch(`/api/tickets/${id}/photo`),
      fetch(`/api/tickets/${id}/face_photo`),
      fetch(`/api/tickets/${id}/logs`)
    ]);
    
    const photoData = await handleResponse(photoRes);
    const facePhotoData = await handleResponse(facePhotoRes);
    const logsData = await handleResponse(logsRes);

    return {
      photo: photoData.photo || null,
      face_photo: facePhotoData.face_photo || null,
      logs: Array.isArray(logsData) ? logsData : []
    };
  },

  createTicket: async (formData: any) => {
    const res = await fetch('/api/tickets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });
    return handleResponse(res);
  },

  updateTicket: async (id: number, data: any) => {
    const res = await fetch(`/api/tickets/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  // Management Data
  getManagementData: (): Promise<any> => fetch('/api/master-data/all').then(handleResponse),
  getPublicData: (): Promise<any> => fetch('/api/public-data/all').then(handleResponse),
  getITPersonnel: (): Promise<any[]> => fetch('/api/it-personnel').then(handleResponse),
  addITPersonnel: (data: any) => fetch('/api/it-personnel', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(handleResponse),
  updateITPersonnel: (id: number, data: any) => fetch(`/api/it-personnel/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(handleResponse),
  deleteITPersonnel: (id: number) => fetch(`/api/it-personnel/${id}`, {
    method: 'DELETE'
  }).then(handleResponse),

  getDepartments: (): Promise<IDepartment[]> => fetch('/api/departments').then(handleResponse),
  addDepartment: (data: any) => fetch('/api/departments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(handleResponse),
  updateDepartment: (id: number, data: any) => fetch(`/api/departments/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(handleResponse),
  deleteDepartment: (id: number) => fetch(`/api/departments/${id}`, {
    method: 'DELETE'
  }).then(handleResponse),

  getCategories: (): Promise<ICategory[]> => fetch('/api/categories').then(handleResponse),
  addCategory: (data: any) => fetch('/api/categories', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(handleResponse),
  updateCategory: (id: number, data: any) => fetch(`/api/categories/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(handleResponse),
  deleteCategory: (id: number) => fetch(`/api/categories/${id}`, {
    method: 'DELETE'
  }).then(handleResponse),

  getUsers: (): Promise<IUser[]> => fetch('/api/users').then(handleResponse),
  
  getMasterUsers: (): Promise<IMasterUser[]> => fetch('/api/master-users').then(handleResponse),
  addMasterUser: (data: any) => fetch('/api/master-users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(handleResponse),
  updateMasterUser: (id: number, data: any) => fetch(`/api/master-users/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(handleResponse),
  deleteMasterUser: (id: number) => fetch(`/api/master-users/${id}`, {
    method: 'DELETE'
  }).then(handleResponse),
  uploadMasterUsers: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return fetch('/api/master-users/upload', {
      method: 'POST',
      body: formData
    }).then(handleResponse);
  },

  getAdminUsers: (): Promise<IUser[]> => fetch('/api/admin-users').then(handleResponse),
  addAdminUser: (data: any) => fetch('/api/admin-users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(handleResponse),
  updateAdminUser: (id: number, data: any) => fetch(`/api/admin-users/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(handleResponse),
  deleteAdminUser: (id: number) => fetch(`/api/admin-users/${id}`, {
    method: 'DELETE'
  }).then(handleResponse),

  // Tickets Extra
  resetTickets: () => fetch('/api/tickets/reset', { method: 'POST' }).then(handleResponse),
  deleteTicket: (id: number) => fetch(`/api/tickets/${id}`, { method: 'DELETE' }).then(handleResponse),
  checkHealth: () => fetch('/api/health').then(handleResponse),

  // Assets
  getAssets: (): Promise<any[]> => fetch('/api/assets').then(handleResponse),
  addAsset: (data: any) => fetch('/api/assets', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(handleResponse),
  updateAsset: (id: number, data: any) => fetch(`/api/assets/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(handleResponse),
  deleteAsset: (id: number) => fetch(`/api/assets/${id}`, {
    method: 'DELETE'
  }).then(handleResponse),

  // Settings
  getSettings: (): Promise<ISettings> => fetch('/api/settings').then(handleResponse),
  updateSettings: (settings: any) => fetch('/api/settings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(settings)
  }).then(handleResponse),
  updateUserSettings: (id: number, settings: any) => fetch(`/api/users/${id}/settings`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(settings)
  }).then(handleResponse),

  // Images
  getImages: () => fetch('/api/images').then(handleResponse),
  deleteImage: (id: number, type: 'photo' | 'face_photo' | 'both') => fetch(`/api/images/${id}?type=${type}`, {
    method: 'DELETE'
  }).then(handleResponse),
  cleanupImages: () => fetch('/api/images/cleanup', {
    method: 'POST'
  }).then(handleResponse),

  // Auth
  login: (data: any) => fetch('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(handleResponse),

  // Memberships
  getMemberships: (): Promise<any[]> => fetch('/api/memberships').then(handleResponse),
  addMembership: (data: any) => fetch('/api/memberships', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(handleResponse),
  updateMembership: (id: number, data: any) => fetch(`/api/memberships/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(handleResponse),
  deleteMembership: (id: number) => fetch(`/api/memberships/${id}`, {
    method: 'DELETE'
  }).then(handleResponse),
  getMembershipLogs: (id: number): Promise<any[]> => fetch(`/api/memberships/${id}/logs`).then(handleResponse),
  uploadMemberships: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return fetch('/api/memberships/upload', {
      method: 'POST',
      body: formData
    }).then(handleResponse);
  },

  // DB Connection test
  testDbConnection: (data: any) => fetch('/api/network/test-db-connection', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(handleResponse),

  // Personal Password Change
  changePassword: (data: { username: string; newPassword: string }) => fetch('/api/change-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(handleResponse),

  // Evaluation Projects
  getEvalProjects: (): Promise<any[]> => fetch('/api/eval-projects').then(handleResponse),
  createEvalProject: (data: { name: string; description?: string; target_users?: number }) => fetch('/api/eval-projects', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(handleResponse),
  deleteEvalProject: (id: number) => fetch(`/api/eval-projects/${id}`, {
    method: 'DELETE'
  }).then(handleResponse),
  getEvalProjectDashboard: (id: number): Promise<any> => fetch(`/api/eval-projects/${id}/dashboard`).then(handleResponse),
  importEvalProjectData: (id: number, records: any[]) => fetch(`/api/eval-projects/${id}/import`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ records })
  }).then(handleResponse),
  clearEvalProjectData: (id: number) => fetch(`/api/eval-projects/${id}/clear`, {
    method: 'POST'
  }).then(handleResponse),

  // Evaluation Project Timelines
  getOverallProjectTimelines: (): Promise<any[]> => fetch(`/api/eval-projects/all-timelines`).then(handleResponse),
  getEvalProjectTimeline: (id: number): Promise<any[]> => fetch(`/api/eval-projects/${id}/timeline`).then(handleResponse),
  createEvalProjectTimeline: (id: number, data: { title: string; description?: string; target_date: string; status?: string }) => fetch(`/api/eval-projects/${id}/timeline`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(handleResponse),
  updateEvalProjectTimeline: (id: number, timelineId: number, data: { title: string; description?: string; target_date: string; status?: string }) => fetch(`/api/eval-projects/${id}/timeline/${timelineId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(handleResponse),
  deleteEvalProjectTimeline: (id: number, timelineId: number) => fetch(`/api/eval-projects/${id}/timeline/${timelineId}`, {
    method: 'DELETE'
  }).then(handleResponse),

  // Vouchers & Request Privileges
  toggleVoucherPrivilege: (id: number, can_request_voucher: boolean) => fetch(`/api/master-users/${id}/toggle-voucher`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ can_request_voucher })
  }).then(handleResponse),
  getVoucherRequests: (): Promise<any[]> => fetch('/api/voucher-requests').then(handleResponse),
  createVoucherRequest: (data: { requester_name: string; department: string; deadline: string; theme: string; slogan?: string; validity_date: string; qty: number; created_by?: string; voucher_value?: string }) => fetch('/api/voucher-requests', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(handleResponse),
  updateVoucherRequestStatus: (id: number, status: string) => fetch(`/api/voucher-requests/${id}/status`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status })
  }).then(handleResponse),
  updateVoucherRequestDesign: (id: number, design_data: string, status?: string) => fetch(`/api/voucher-requests/${id}/design`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ design_data, status })
  }).then(handleResponse),
  deleteVoucherRequest: (id: number) => fetch(`/api/voucher-requests/${id}`, {
    method: 'DELETE'
  }).then(handleResponse),
};
