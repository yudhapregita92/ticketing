import { parseSafeDate } from './dateUtils';

export const getSLAColor = (createdAt: string, status: string, criticalHours?: number, delayedHours?: number) => {
  if (status !== 'New') return '';
  const created = parseSafeDate(createdAt).getTime();
  const now = new Date().getTime();
  const diffHours = (now - created) / (1000 * 60 * 60);

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
  return '';
};

export const getSLALabel = (createdAt: string, status: string, criticalHours?: number, delayedHours?: number) => {
  if (status !== 'New') return null;
  const created = parseSafeDate(createdAt).getTime();
  const now = new Date().getTime();
  const diffHours = (now - created) / (1000 * 60 * 60);

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
