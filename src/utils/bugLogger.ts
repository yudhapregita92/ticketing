export interface BugLog {
  id: string;
  timestamp: string;
  message: string;
  stack?: string;
  source?: string;
  line?: number;
  col?: number;
  type: 'runtime' | 'unhandledrejection' | 'manual' | 'api';
  url: string;
  userAgent: string;
  userEmail?: string;
  userRole?: string;
  resolved?: boolean;
}

const BUG_LOGS_STORAGE_KEY = 'app_bug_logs_v1';

export const getBugLogs = (): BugLog[] => {
  try {
    const data = localStorage.getItem(BUG_LOGS_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error('Failed to parse bug logs:', e);
    return [];
  }
};

export const saveBugLogs = (logs: BugLog[]) => {
  try {
    localStorage.setItem(BUG_LOGS_STORAGE_KEY, JSON.stringify(logs.slice(0, 100)));
  } catch (e) {
    console.error('Failed to save bug logs:', e);
  }
};

export const addBugLog = (bug: Omit<BugLog, 'id' | 'timestamp' | 'url' | 'userAgent'> & { url?: string; userAgent?: string }): BugLog => {
  const newLog: BugLog = {
    id: 'bug_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
    timestamp: new Date().toISOString(),
    url: bug.url || (typeof window !== 'undefined' ? window.location.href : ''),
    userAgent: bug.userAgent || (typeof window !== 'undefined' ? navigator.userAgent : ''),
    ...bug,
  };
  const currentLogs = getBugLogs();
  const updated = [newLog, ...currentLogs];
  saveBugLogs(updated);
  return newLog;
};

export const deleteBugLog = (id: string): BugLog[] => {
  const currentLogs = getBugLogs();
  const updated = currentLogs.filter(l => l.id !== id);
  saveBugLogs(updated);
  return updated;
};

export const clearBugLogs = (): BugLog[] => {
  localStorage.removeItem(BUG_LOGS_STORAGE_KEY);
  return [];
};

export const toggleBugResolved = (id: string): BugLog[] => {
  const currentLogs = getBugLogs();
  const updated = currentLogs.map(l => l.id === id ? { ...l, resolved: !l.resolved } : l);
  saveBugLogs(updated);
  return updated;
};

export const formatBugForAgent = (bug: BugLog): string => {
  return `[BUG REPORT UNTUK AI AGENT]
--------------------------------------------------
ID Bug: ${bug.id}
Waktu: ${new Date(bug.timestamp).toLocaleString('id-ID')}
Tipe: ${bug.type.toUpperCase()}
Status: ${bug.resolved ? 'Selesai / Resolved' : 'Belum Dibenahi / Open'}
Pesan Error: ${bug.message}
Lokasi/Source: ${bug.source || 'N/A'}${bug.line ? ` (Line: ${bug.line}, Col: ${bug.col})` : ''}
URL: ${bug.url}
User Email/Role: ${bug.userEmail || 'Guest'} (${bug.userRole || 'User'})
User Agent: ${bug.userAgent}

--- Stack Trace ---
${bug.stack || 'Tidak ada stack trace'}
--------------------------------------------------
Instruksi perbaikan untuk AI Agent:
Tolong analisis error di atas, temukan file dan bagian kode penyebabnya, lalu perbaiki bug ini dengan cepat.`;
};

export const formatAllBugsForAgent = (logs: BugLog[]): string => {
  if (logs.length === 0) return 'Tidak ada log bug yang tersimpan.';
  return `[LAPORAN SEMUA BUG PRODUKSI UNTUK AI AGENT (${logs.length} Log)]
==================================================
` + logs.map((bug, idx) => `
# BUG #${idx + 1} (${bug.type.toUpperCase()})
- ID: ${bug.id}
- Waktu: ${new Date(bug.timestamp).toLocaleString('id-ID')}
- Pesan: ${bug.message}
- Source: ${bug.source || 'N/A'}
- URL: ${bug.url}
- Stack: ${bug.stack ? bug.stack.slice(0, 300) + '...' : 'N/A'}
--------------------------------------------------
`).join('\n') + `
Mohon periksa dan perbaiki bug di atas.`;
};

export const initBugLogger = (getUserInfo?: () => { email?: string; role?: string }) => {
  if (typeof window === 'undefined') return;

  if ((window as any).__bugLoggerInitialized) return;
  (window as any).__bugLoggerInitialized = true;

  window.addEventListener('error', (event) => {
    try {
      const message = event.message || 'Unknown runtime error';
      
      // Abaikan error benign dari Vite HMR / WebSocket yang diharapkan di environment ini
      if (
        message.toLowerCase().includes('websocket') || 
        message.includes('failed to connect') ||
        (event.filename && event.filename.includes('@vite/client'))
      ) {
        return;
      }

      const userInfo = getUserInfo ? getUserInfo() : {};
      addBugLog({
        message,
        stack: event.error?.stack || '',
        source: event.filename || '',
        line: event.lineno,
        col: event.colno,
        type: 'runtime',
        userEmail: userInfo.email,
        userRole: userInfo.role,
      });
    } catch (err) {
      console.error('Error recording bug log:', err);
    }
  });

  window.addEventListener('unhandledrejection', (event) => {
    try {
      const reason = event.reason;
      const message = typeof reason === 'string' ? reason : (reason?.message || 'Unhandled Promise Rejection');
      
      // Abaikan error benign dari Vite HMR / WebSocket yang diharapkan di environment ini
      if (
        message.toLowerCase().includes('websocket') || 
        message.includes('failed to connect') ||
        (reason?.stack && reason.stack.includes('@vite/client'))
      ) {
        return;
      }

      const userInfo = getUserInfo ? getUserInfo() : {};
      addBugLog({
        message,
        stack: reason?.stack || '',
        type: 'unhandledrejection',
        userEmail: userInfo.email,
        userRole: userInfo.role,
      });
    } catch (err) {
      console.error('Error recording rejection log:', err);
    }
  });
};
