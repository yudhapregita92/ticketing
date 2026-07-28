import { IJenisMasalahRule } from '../types';

export const DEFAULT_JENIS_MASALAH_RULES: IJenisMasalahRule[] = [
  { name: 'Hardware', require_device_code: true },
  { name: 'Aplikasi', require_device_code: false },
];

export function parseJenisMasalahRules(rulesRaw?: any, categories?: any[]): IJenisMasalahRule[] {
  let list: IJenisMasalahRule[] = [];

  if (rulesRaw) {
    if (typeof rulesRaw === 'string') {
      try {
        const parsed = JSON.parse(rulesRaw);
        if (Array.isArray(parsed)) list = parsed;
      } catch {
        list = [];
      }
    } else if (Array.isArray(rulesRaw)) {
      list = rulesRaw;
    }
  }

  // Fallback to defaults if list is empty or invalid
  if (!Array.isArray(list) || list.length === 0) {
    list = [...DEFAULT_JENIS_MASALAH_RULES];
  }

  // Ensure Hardware and Aplikasi are always included
  const existingNames = list.map(item => (item.name || '').trim().toLowerCase());
  
  if (!existingNames.includes('hardware')) {
    list.unshift({ name: 'Hardware', require_device_code: true });
  }
  if (!existingNames.includes('aplikasi')) {
    list.push({ name: 'Aplikasi', require_device_code: false });
  }

  // Also include any custom jenis_masalah found in categories if not already present
  if (Array.isArray(categories)) {
    categories.forEach(cat => {
      if (cat.jenis_masalah && typeof cat.jenis_masalah === 'string' && cat.jenis_masalah.trim()) {
        const val = cat.jenis_masalah.trim();
        const norm = val.toLowerCase();
        if (!list.some(item => item.name.trim().toLowerCase() === norm)) {
          list.push({ name: val, require_device_code: false });
        }
      }
    });
  }

  return list;
}

export function isDeviceCodeRequiredForJenisMasalah(jenisMasalah: string | null | undefined, rulesRaw?: any, categories?: any[]): boolean {
  if (!jenisMasalah || !jenisMasalah.trim()) return false;
  const norm = jenisMasalah.trim().toLowerCase();
  
  const rules = parseJenisMasalahRules(rulesRaw, categories);
  const matched = rules.find(r => r.name.trim().toLowerCase() === norm);

  if (matched) {
    return matched.require_device_code;
  }

  // Fallback rule if not found in list: 'hardware' requires device code, otherwise false
  return norm === 'hardware';
}
