import { 
  ShieldCheck, 
  Cpu, 
  Globe, 
  Zap, 
  Ticket 
} from 'lucide-react';

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
}

export interface IAppSettings {
  app_name: string;
  logo_type: string;
  theme_mode: 'light' | 'dark';
  primary_color: string;
  admin_theme_mode: 'light' | 'dark';
  admin_primary_color: string;
  custom_logo: string;
  custom_favicon: string;
  notification_emails: string[];
  telegram_bot_token: string;
  telegram_chat_ids: string[];
  smtp_host: string;
  smtp_port: string;
  smtp_user: string;
  smtp_pass: string;
  smtp_from: string;
}

export interface IAdminUser {
  username: string;
  role: string;
  full_name: string;
  theme_mode: 'light' | 'dark';
  primary_color: string;
}

export const STATUSES = ['New', 'In Progress', 'Completed', 'Cancelled'];

export const PRIORITIES = [
  { id: 'Low', label: 'Low', color: 'bg-slate-400' },
  { id: 'Medium', label: 'Medium', color: 'bg-blue-500' },
  { id: 'High', label: 'High', color: 'bg-amber-500' },
  { id: 'Urgent', label: 'Urgent', color: 'bg-rose-600' }
];

export const LOGO_OPTIONS = [
  { id: 'ShieldCheck', icon: ShieldCheck },
  { id: 'Cpu', icon: Cpu },
  { id: 'Globe', icon: Globe },
  { id: 'Zap', icon: Zap },
  { id: 'Ticket', icon: Ticket }
];

export const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];
