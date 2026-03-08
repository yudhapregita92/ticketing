export const getDeviceInfo = (ua: string) => {
  if (!ua) return 'Unknown Device';
  
  let os = 'Unknown OS';
  if (ua.includes('Windows')) os = 'Windows';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('iPhone')) os = 'iPhone';
  else if (ua.includes('iPad')) os = 'iPad';
  else if (ua.includes('Macintosh')) os = 'Mac OS';
  else if (ua.includes('Linux')) os = 'Linux';

  let browser = 'Unknown Browser';
  if (ua.includes('Chrome')) browser = 'Chrome';
  else if (ua.includes('Firefox')) browser = 'Firefox';
  else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari';
  else if (ua.includes('Edge')) browser = 'Edge';
  else if (ua.includes('Opera')) browser = 'Opera';

  return `${os} (${browser})`;
};

export const getSLAColor = (createdAt: string, status: string) => {
  if (status !== 'New') return '';
  const created = new Date(createdAt).getTime();
  const now = new Date().getTime();
  const diffHours = (now - created) / (1000 * 60 * 60);

  if (diffHours > 5) return 'bg-rose-500/10 border-rose-500/20 text-rose-600 animate-pulse';
  if (diffHours > 2) return 'bg-amber-500/10 border-amber-500/20 text-amber-600';
  return '';
};

export const getSLALabel = (createdAt: string, status: string) => {
  if (status !== 'New') return null;
  const created = new Date(createdAt).getTime();
  const now = new Date().getTime();
  const diffHours = (now - created) / (1000 * 60 * 60);

  if (diffHours > 5) return 'CRITICAL (>5h)';
  if (diffHours > 2) return 'DELAYED (>2h)';
  return null;
};

export const getThemeClasses = (isDark: boolean) => ({
  card: isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200',
  header: isDark ? 'bg-zinc-900/80 border-zinc-800' : 'bg-white/80 border-slate-200',
  text: isDark ? 'text-white' : 'text-slate-900',
  textMuted: isDark ? 'text-zinc-500' : 'text-slate-500',
  border: isDark ? 'border-zinc-800' : 'border-slate-100',
  bgSecondary: isDark ? 'bg-zinc-800/50' : 'bg-slate-50/50',
  input: isDark ? 'bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-600' : 'bg-white border-slate-200 text-slate-900 placeholder:text-slate-400',
});
