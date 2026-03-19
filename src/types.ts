export interface ITicket {
  id: number;
  ticket_no: string;
  name: string;
  department: string;
  phone: string;
  category: string;
  description: string;
  assigned_to: string | null;
  admin_reply: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  responded_at?: string | null;
  resolved_at?: string | null;
  photo?: string | null;
  ip_address?: string | null;
  user_agent?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  internal_notes?: string | null;
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  face_photo?: string | null;
}

export interface IUser {
  id: number;
  username: string;
  full_name: string;
  role: string;
}

export interface IDepartment {
  id: number;
  name: string;
}

export interface ICategory {
  id: number;
  name: string;
}

export interface IMasterUser {
  id: number;
  full_name: string;
  department: string;
  phone: string;
}

export interface ISettings {
  id: number;
  app_name: string;
  app_logo: string;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  contact_phone: string;
  contact_email: string;
  is_maintenance: boolean;
  maintenance_message: string;
  allow_new_tickets: boolean;
  auto_assign_it: boolean;
  enable_notifications: boolean;
  footer_text: string;
  header_gradient_start: string;
  header_gradient_end: string;
  card_style: 'minimal' | 'glass' | 'bordered';
  font_family: string;
  show_stats_to_users: boolean;
  max_upload_size: number;
  theme_mode?: 'light' | 'dark' | 'system';
  admin_theme_mode?: 'light' | 'dark' | 'system';
  admin_primary_color?: string;
  notification_emails?: string;
  telegram_bot_token?: string;
  telegram_chat_ids?: string;
}

export interface IAdminUser extends IUser {}
export type IAppSettings = ISettings;
export type ViewMode = 'today' | 'all' | 'my_tickets' | 'dashboard';
export interface IAsset {
  id: number;
  asset_id: string;
  name: string;
  type: string;
  category: string;
  department: string;
  purchase_date: string;
  condition: string;
  status: string;
  notes?: string;
  assigned_to?: string;
}
export const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];
export const PRIORITIES = [
  { id: 'Low', label: 'Low', color: 'bg-emerald-500' },
  { id: 'Medium', label: 'Medium', color: 'bg-amber-500' },
  { id: 'High', label: 'High', color: 'bg-orange-500' },
  { id: 'Urgent', label: 'Urgent', color: 'bg-rose-500' }
];
