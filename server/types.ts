export interface User {
  id: number;
  username: string;
  password?: string;
  full_name: string;
  role: string;
  theme_mode?: string;
  primary_color?: string;
}

export interface Ticket {
  id: number;
  ticket_no: string;
  name: string;
  department: string;
  phone: string;
  category: string;
  description: string;
  photo?: string;
  face_photo?: string;
  assigned_to?: string;
  admin_reply?: string;
  status: string;
  priority: string;
  created_at: string;
  updated_at?: string;
  responded_at?: string;
  resolved_at?: string;
  ip_address?: string;
  user_agent?: string;
  latitude?: number;
  longitude?: number;
  internal_notes?: string;
}

export interface TicketLog {
  id: number;
  ticket_id: number;
  action: string;
  note: string;
  performed_by: string;
  created_at: string;
}

export interface Setting {
  key: string;
  value: string;
}
