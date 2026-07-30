export interface IDepreciationResult {
  ageText: string;
  percentage: number;
  status: string;
  isReplaceReady: boolean;
  badgeClass: string;
  years: number;
  months: number;
}

export const calculateAssetDepreciation = (purchaseDateStr?: string): IDepreciationResult => {
  if (!purchaseDateStr || purchaseDateStr === '-' || purchaseDateStr.trim() === '') {
    return {
      ageText: 'Belum diisi',
      percentage: 0,
      status: 'Tgl Beli Belum Diisi',
      isReplaceReady: false,
      badgeClass: 'bg-slate-500/10 text-slate-500 border-slate-500/20',
      years: 0,
      months: 0
    };
  }

  const purchaseDate = new Date(purchaseDateStr);
  if (isNaN(purchaseDate.getTime())) {
    return {
      ageText: purchaseDateStr,
      percentage: 0,
      status: 'Format Tgl Tidak Valid',
      isReplaceReady: false,
      badgeClass: 'bg-slate-500/10 text-slate-500 border-slate-500/20',
      years: 0,
      months: 0
    };
  }

  const now = new Date();
  let months = (now.getFullYear() - purchaseDate.getFullYear()) * 12 + (now.getMonth() - purchaseDate.getMonth());
  if (now.getDate() < purchaseDate.getDate()) {
    months--;
  }
  months = Math.max(0, months);

  const years = Math.floor(months / 12);
  const remMonths = months % 12;

  let ageText = '';
  if (years > 0) ageText += `${years} Thn `;
  ageText += `${remMonths} Bln`;
  if (years === 0 && remMonths === 0) ageText = '< 1 Bln';

  // Standar Masa Pakai Penyusutan 4 Tahun = 48 Bulan
  const totalUsefulMonths = 48;
  const percentage = Math.min(100, Math.round((months / totalUsefulMonths) * 100));

  let status = 'Normal (Layak)';
  let isReplaceReady = false;
  let badgeClass = 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400';

  if (months >= totalUsefulMonths) {
    status = 'Siap Replace (100% / 4+ Thn)';
    isReplaceReady = true;
    badgeClass = 'bg-rose-500/10 text-rose-600 border-rose-500/20 dark:text-rose-400';
  } else if (months >= 42) {
    status = 'Mendekati Replace (>3.5 Thn)';
    isReplaceReady = false;
    badgeClass = 'bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400';
  }

  return {
    ageText,
    percentage,
    status,
    isReplaceReady,
    badgeClass,
    years,
    months
  };
};
