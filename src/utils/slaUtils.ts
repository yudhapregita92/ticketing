import { parseSafeDate } from './dateUtils';
import { IAppSettings } from '../types';

export interface SLAWorkingHoursConfig {
  enabled: boolean;
  weekdayStart: string; // e.g. "07:45"
  weekdayEnd: string;   // e.g. "16:00"
  satStart: string;     // e.g. "07:45"
  satEnd: string;       // e.g. "12:00"
  satEnabled: boolean;
  sunStart?: string;
  sunEnd?: string;
  sunEnabled: boolean;
}

export const getSLAConfigFromSettings = (settings?: IAppSettings | null): SLAWorkingHoursConfig => {
  let appSettings: any = settings;
  if (!appSettings) {
    try {
      const saved = typeof window !== 'undefined' ? localStorage.getItem('appSettings') : null;
      if (saved) appSettings = JSON.parse(saved);
    } catch (e) {
      // ignore
    }
  }

  return {
    enabled: appSettings?.sla_working_hours_enabled !== false, // default true
    weekdayStart: appSettings?.sla_work_weekday_start || '07:45',
    weekdayEnd: appSettings?.sla_work_weekday_end || '16:00',
    satStart: appSettings?.sla_work_sat_start || '07:45',
    satEnd: appSettings?.sla_work_sat_end || '12:00',
    satEnabled: appSettings?.sla_work_sat_enabled !== false, // default true
    sunStart: appSettings?.sla_work_sun_start || '07:45',
    sunEnd: appSettings?.sla_work_sun_end || '12:00',
    sunEnabled: appSettings?.sla_work_sun_enabled === true, // default false
  };
};

/**
 * Check if a given Date is currently within working hours according to SLA config
 */
export const isCurrentlyWorkingHours = (date: Date = new Date(), config?: SLAWorkingHoursConfig): boolean => {
  const cfg = config || getSLAConfigFromSettings();
  if (!cfg.enabled) return true; // If working hours SLA disabled, always active

  const day = date.getDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat
  let startTimeStr = '';
  let endTimeStr = '';

  if (day === 0) {
    if (!cfg.sunEnabled) return false;
    startTimeStr = cfg.sunStart || '07:45';
    endTimeStr = cfg.sunEnd || '12:00';
  } else if (day === 6) {
    if (!cfg.satEnabled) return false;
    startTimeStr = cfg.satStart;
    endTimeStr = cfg.satEnd;
  } else {
    startTimeStr = cfg.weekdayStart;
    endTimeStr = cfg.weekdayEnd;
  }

  const [startH, startM] = startTimeStr.split(':').map(Number);
  const [endH, endM] = endTimeStr.split(':').map(Number);

  const startMin = startH * 60 + startM;
  const endMin = endH * 60 + endM;
  const currentMin = date.getHours() * 60 + date.getMinutes();

  return currentMin >= startMin && currentMin < endMin;
};

/**
 * Calculates total working hours elapsed between two dates based on operating hours.
 * Returns duration in fractional hours (e.g., 2.25 hours).
 */
export const calculateWorkingHoursElapsed = (
  startDateInput: Date | string,
  endDateInput: Date | string = new Date(),
  config?: SLAWorkingHoursConfig
): number => {
  const cfg = config || getSLAConfigFromSettings();
  const start = typeof startDateInput === 'string' ? parseSafeDate(startDateInput) : startDateInput;
  const end = typeof endDateInput === 'string' ? parseSafeDate(endDateInput) : endDateInput;

  if (isNaN(start.getTime()) || isNaN(end.getTime()) || end <= start) {
    return 0;
  }

  // If working hours SLA disabled, return standard wall-clock difference
  if (!cfg.enabled) {
    return (end.getTime() - start.getTime()) / (1000 * 60 * 60);
  }

  let totalMs = 0;

  // Loop day by day from start date to end date
  const curDay = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const lastDay = new Date(end.getFullYear(), end.getMonth(), end.getDate());

  while (curDay <= lastDay) {
    const dayOfWeek = curDay.getDay(); // 0 = Sun, 6 = Sat, 1..5 = Mon..Fri
    let startTimeStr = '';
    let endTimeStr = '';
    let isDayEnabled = false;

    if (dayOfWeek === 0) {
      isDayEnabled = cfg.sunEnabled;
      startTimeStr = cfg.sunStart || '07:45';
      endTimeStr = cfg.sunEnd || '12:00';
    } else if (dayOfWeek === 6) {
      isDayEnabled = cfg.satEnabled;
      startTimeStr = cfg.satStart;
      endTimeStr = cfg.satEnd;
    } else {
      isDayEnabled = true;
      startTimeStr = cfg.weekdayStart;
      endTimeStr = cfg.weekdayEnd;
    }

    if (isDayEnabled && startTimeStr && endTimeStr) {
      const [sh, sm] = (startTimeStr || '07:45').split(':').map(Number);
      const [eh, em] = (endTimeStr || '16:00').split(':').map(Number);

      const workStart = new Date(curDay.getFullYear(), curDay.getMonth(), curDay.getDate(), sh || 0, sm || 0, 0, 0);
      const workEnd = new Date(curDay.getFullYear(), curDay.getMonth(), curDay.getDate(), eh || 0, em || 0, 0, 0);

      if (workEnd > workStart) {
        // Calculate intersection of [start, end] and [workStart, workEnd]
        const effectiveStart = Math.max(start.getTime(), workStart.getTime());
        const effectiveEnd = Math.min(end.getTime(), workEnd.getTime());

        if (effectiveEnd > effectiveStart) {
          totalMs += (effectiveEnd - effectiveStart);
        }
      }
    }

    // Move to next day
    curDay.setDate(curDay.getDate() + 1);
  }

  return totalMs / (1000 * 60 * 60);
};

/**
 * Calculates total working minutes elapsed between two dates.
 */
export const calculateWorkingMinutesElapsed = (
  startDateInput: Date | string,
  endDateInput: Date | string = new Date(),
  config?: SLAWorkingHoursConfig
): number => {
  const hours = calculateWorkingHoursElapsed(startDateInput, endDateInput, config);
  return Math.round(hours * 60);
};
