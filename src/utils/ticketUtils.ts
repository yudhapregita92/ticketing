import { parseSafeDate } from './dateUtils';
import { calculateWorkingHoursElapsed, isCurrentlyWorkingHours } from './slaUtils';

export const getSLAColor = (createdAt: string, status: string, criticalHours?: number, delayedHours?: number, actionType?: string | null) => {
  if (status === 'Pending' || status === 'Pending Pengadaan' || status === 'Menunggu Persetujuan Sub Dept Head' || actionType === 'Harus Dibeli') {
    return 'bg-purple-500/10 border-purple-500/30 text-purple-400';
  }
  if (status !== 'New') return '';
  const diffHours = calculateWorkingHoursElapsed(createdAt, new Date());

  let crit = criticalHours;
  let del = delayedHours;

  if (crit === undefined || del === undefined) {
    try {
      const saved = localStorage.getItem('appSettings');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (crit === undefined && parsed.sla_critical_hours !== undefined) {
          crit = parseFloat(parsed.sla_critical_hours);
        }
        if (del === undefined && parsed.sla_delayed_hours !== undefined) {
          del = parseFloat(parsed.sla_delayed_hours);
        }
      }
    } catch (e) {
      // ignore
    }
  }

  if (crit === undefined || isNaN(crit)) crit = 5;
  if (del === undefined || isNaN(del)) del = 2;

  if (diffHours > crit) return 'bg-rose-500/10 border-rose-500/20 text-rose-600 animate-pulse';
  if (diffHours > del) return 'bg-amber-500/10 border-amber-500/20 text-amber-600';
  if (!isCurrentlyWorkingHours()) return 'bg-sky-500/10 border-sky-500/20 text-sky-600';
  return '';
};

export const getSLALabel = (createdAt: string, status: string, criticalHours?: number, delayedHours?: number, actionType?: string | null) => {
  if (status === 'Pending' || status === 'Pending Pengadaan' || status === 'Menunggu Persetujuan Sub Dept Head' || actionType === 'Harus Dibeli') {
    return '⏸️ SLA Paused (Pengadaan)';
  }
  if (status !== 'New') return null;
  const diffHours = calculateWorkingHoursElapsed(createdAt, new Date());

  let crit = criticalHours;
  let del = delayedHours;

  if (crit === undefined || del === undefined) {
    try {
      const saved = localStorage.getItem('appSettings');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (crit === undefined && parsed.sla_critical_hours !== undefined) {
          crit = parseFloat(parsed.sla_critical_hours);
        }
        if (del === undefined && parsed.sla_delayed_hours !== undefined) {
          del = parseFloat(parsed.sla_delayed_hours);
        }
      }
    } catch (e) {
      // ignore
    }
  }

  if (crit === undefined || isNaN(crit)) crit = 5;
  if (del === undefined || isNaN(del)) del = 2;

  if (diffHours > crit) return `Critical (>${crit}h)`;
  if (diffHours > del) return `Delayed (>${del}h)`;
  if (!isCurrentlyWorkingHours()) return '⏸️ SLA Di-pause (Luar Jam Kerja)';
  return null;
};

export const processPhotoWithWatermark = async (
  file: File, 
  latitude: number, 
  longitude: number
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject('Canvas context not available');

        // Set dimensions (max 400px width/height for smaller size)
        const maxDim = 400;
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > maxDim) {
            height *= maxDim / width;
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width *= maxDim / height;
            height = maxDim;
          }
        }
        canvas.width = width;
        canvas.height = height;

        // Draw image
        ctx.drawImage(img, 0, 0, width, height);

        // Draw watermark background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        const padding = 8;
        const fontSize = Math.max(9, Math.floor(width / 40));
        ctx.font = `${fontSize}px sans-serif`;
        const text1 = `Lat: ${latitude.toFixed(6)}, Lng: ${longitude.toFixed(6)}`;
        const text2 = `Time: ${new Date().toLocaleString()}`;
        const text3 = `Google Maps Location`;
        
        const metrics1 = ctx.measureText(text1);
        const metrics2 = ctx.measureText(text2);
        const metrics3 = ctx.measureText(text3);
        const bgWidth = Math.max(metrics1.width, metrics2.width, metrics3.width) + padding * 2;
        const bgHeight = fontSize * 3 + padding * 3;

        ctx.fillRect(5, height - bgHeight - 5, bgWidth, bgHeight);

        // Draw watermark text
        ctx.fillStyle = 'white';
        ctx.fillText(text3, padding, height - bgHeight + fontSize - 2);
        ctx.fillText(text1, padding, height - bgHeight + fontSize * 2 + padding / 2 - 2);
        ctx.fillText(text2, padding, height - bgHeight + fontSize * 3 + padding - 2);

        // Compress to stay under 30KB to save space
        let quality = 0.6;
        let base64 = canvas.toDataURL('image/jpeg', quality);
        
        // Iteratively reduce quality if still too large
        while (base64.length > 40000 && quality > 0.1) {
          quality -= 0.1;
          base64 = canvas.toDataURL('image/jpeg', quality);
        }

        resolve(base64);
      };
      img.src = event.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const isUserTicket = (ticket: any, currentUser?: any): boolean => {
  if (!ticket) return false;
  const tName = (ticket.name || '').toLowerCase().trim();
  const tIndex = (ticket.employee_index || '').toLowerCase().trim();
  const tPhone = (ticket.phone || '').toLowerCase().trim();
  const tNo = (ticket.ticket_no || '').toLowerCase().trim();

  if (currentUser) {
    const myName = (currentUser.full_name || currentUser.name || '').toLowerCase().trim();
    const myIndex = (currentUser.employee_index || '').toLowerCase().trim();
    const myPhone = (currentUser.phone || '').toLowerCase().trim();
    const myEmail = (currentUser.email || '').toLowerCase().trim();
    const tEmail = (ticket.email || '').toLowerCase().trim();

    if (myName.length >= 2 && tName === myName) return true;
    if (myIndex.length >= 2 && tIndex.length >= 2 && tIndex === myIndex) return true;
    if (myPhone.length >= 4 && tPhone.length >= 4 && tPhone === myPhone) return true;
    if (myEmail.length >= 4 && tEmail.length >= 4 && tEmail === myEmail) return true;

    // Strict isolation: logged-in user tickets MUST match currentUser credentials. Do NOT fall back to localStorage.
    return false;
  }

  // Fallback to localStorage / guest session ONLY when currentUser is not logged in
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem('my_ticket_numbers') : null;
    let storedNos: string[] = [];
    if (raw && Array.isArray(JSON.parse(raw))) {
      storedNos = JSON.parse(raw);
    }
    if (storedNos.length > 0 && storedNos.some(no => String(no).toLowerCase().trim() === tNo)) {
      return true;
    }

    const savedPhone = (typeof window !== 'undefined' && localStorage.getItem('my_user_phone') || '').toLowerCase().trim();
    const savedIndex = (typeof window !== 'undefined' && localStorage.getItem('my_employee_index') || '').toLowerCase().trim();
    const savedName = (typeof window !== 'undefined' && localStorage.getItem('my_user_name') || '').toLowerCase().trim();

    if (savedName.length >= 2 && tName === savedName) return true;
    if (savedIndex.length >= 2 && tIndex.length >= 2 && tIndex === savedIndex) return true;
    if (savedPhone.length >= 4 && tPhone.length >= 4 && tPhone === savedPhone) return true;
  } catch (e) {
    // ignore localStorage errors
  }

  return false;
};
