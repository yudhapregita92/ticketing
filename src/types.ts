export interface ITicket {
  id: number;
  ticket_no: string;
  name: string;
  employee_index?: string | null;
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
  device_type?: string | null;
  pc_code?: string | null;
  jenis_masalah?: string | null;
  estimated_duration?: string | null;
  estimated_start_at?: string | null;
  estimated_target_at?: string | null;
  rating?: number | null;
  rating_feedback?: string | null;
  rating_at?: string | null;
  require_rating?: number | null;
  action_type?: string | null;
  action_notes?: string | null;
}

export interface IUser {
  id: number;
  username: string;
  full_name: string;
  role: string;
  is_on_duty?: number;
  phone?: string | null;
}

export interface IDepartment {
  id: number;
  name: string;
}

export interface ICategory {
  id: number;
  name: string;
  assigned_to?: string;
  assigned_to_list?: string | string[];
  device_code?: string;
  brand?: string;
  specs?: string;
  serial_number?: string;
  usage_status?: string;
  response_time?: number;
  jenis_masalah?: string;
}

export interface IMasterUser {
  id: number;
  full_name: string;
  department: string;
  sub_department?: string;
  phone: string;
  employee_index?: string;
  email?: string;
  jenis_piranti?: string;
  kode_piranti?: string;
  jabatan?: string;
  atasan_id?: number | null;
}

export interface IJenisMasalahRule {
  name: string;
  require_device_code: boolean;
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
  logo_type?: string;
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
  custom_logo?: string;
  custom_pwa_icon?: string;
  custom_favicon?: string;
  notification_emails?: string;
  telegram_bot_token?: string;
  telegram_chat_ids?: string;
  member_card_template?: string;
  card_layout?: string;
  sla_critical_hours?: number;
  sla_delayed_hours?: number;
  gps_working_hours_start?: string;
  gps_working_hours_end?: string;
  yudha_auto_respond_enabled?: boolean | string;
  yudha_auto_respond_categories?: string | string[];
  yudha_auto_respond_delay?: number;
  yudha_auto_respond_assignee?: string;
  jenis_masalah_rules?: string;
  berita_acara_settings?: string;
  fab_size?: number;
  fab_top_offset?: number;
  fab_icon_size?: number;
  nav_container_height?: number;
  nav_container_radius?: number;
  nav_text_size?: number;
  nav_text_weight?: string;
  nav_text_color?: string;
  nav_bg_color?: string;
  nav_bg_opacity?: number;
  fab_bg_color?: string;
  fab_icon_color?: string;
  fab_border_color?: string;
  fab_border_width?: number;
  banner_enabled?: boolean;
  banner_padding_y?: number;
  banner_margin_bottom?: number;
  banner_image_type?: 'default_vector' | 'custom_image';
  banner_custom_image?: string;
  banner_image_size?: number;
  ui_card_radius?: number;
  it_company_name?: string;
  it_dept_subtitle?: string;
  it_company_address?: string;
  it_document_title?: string;
  it_sig1_title?: string;
  it_sig2_title?: string;
  it_default_loan_notes?: string;
  it_default_buy_notes?: string;
  it_pic_name?: string;
  it_logo_left?: string;
  it_logo_right?: string;
  it_digital_signature?: string;
}

export interface IAdminUser extends IUser {}
export type IAppSettings = ISettings;
export type ViewMode = 'today' | 'all' | 'my_tickets' | 'team_tickets' | 'dashboard' | 'assets' | 'network' | 'ba' | 'panduan' | 'settings' | 'testing' | 'membership' | 'evaluasi_project' | 'jurnal' | 'voucher' | 'master_user' | 'master_perangkat' | 'master_team' | 'report_sla' | 'report_perangkat' | 'team_location';
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
  device_code?: string;
  brand?: string;
  specs?: string;
  serial_number?: string;
  usage_status?: string;
  user_index?: string;
  budget_type?: string;
  is_issued?: number | boolean;
  issued_reason?: string;
}

export interface IBorrowedAsset {
  id: number;
  asset_id?: number | null;
  device_name: string;
  device_code?: string | null;
  budget_type?: string | null;
  borrower_name: string;
  borrower_department?: string | null;
  borrow_date: string;
  expected_return_date?: string | null;
  actual_return_date?: string | null;
  received_by?: string | null;
  notes?: string | null;
  signature?: string | null;
  status: 'Dipinjam' | 'Dikembalikan';
  created_at?: string;
  updated_at?: string;
}
export interface IMembershipLog {
  id: number;
  membership_id: number;
  keterangan: string;
  created_at: string;
}

export interface IMembership {
  id: number;
  kode_lokal: string;
  indek_kdk: string;
  indek_ggf: string;
  nama: string;
  bagian: string;
  barcode: string;
  foto?: string | null;
  nik_ktp?: string | null;
  no_hp?: string | null;
  photo_scale?: number | null;
  photo_offset_x?: number | null;
  photo_offset_y?: number | null;
  updated_at?: string;
  created_at?: string;
}

export interface INotification {
  id: number;
  ticket_id: number;
  ticket_no: string;
  employee_index?: string | null;
  recipient_name?: string | null;
  title: string;
  message: string;
  type: string;
  is_read: number;
  created_at: string;
}

export const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];
export const PRIORITIES = [
  { id: 'Low', label: 'Low', color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700' },
  { id: 'Medium', label: 'Medium', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300 border-amber-200 dark:border-amber-800' },
  { id: 'High', label: 'High', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300 border-orange-200 dark:border-orange-800' },
  { id: 'Urgent', label: 'Urgent', color: 'bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300 border-rose-200 dark:border-rose-800' }
];
