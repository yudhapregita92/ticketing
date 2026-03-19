import { ShieldCheck, Cpu, Globe, Zap, Ticket } from 'lucide-react';
import { Logo } from './components/Logo';

export const STATUSES = ['New', 'In Progress', 'Completed', 'Cancelled'];

export const LOGO_OPTIONS = [
  { id: 'ShieldCheck', icon: ShieldCheck },
  { id: 'Cpu', icon: Cpu },
  { id: 'Globe', icon: Globe },
  { id: 'Zap', icon: Zap },
  { id: 'Ticket', icon: Ticket },
  { id: 'Send', icon: Logo }
];

export const PRIORITIES = ['Low', 'Medium', 'High', 'Urgent'];
