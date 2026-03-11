import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Filter, Calendar } from 'lucide-react';

interface MobileFilterModalProps {
  show: boolean;
  onClose: () => void;
  isDark: boolean;
  themeClasses: any;
  tempFilters: any;
  setTempFilters: (filters: any) => void;
  departments: any[];
  STATUSES: string[];
  onReset: () => void;
  onApply: () => void;
}

export const MobileFilterModal: React.FC<MobileFilterModalProps> = ({
  show,
  onClose,
  isDark,
  themeClasses,
  tempFilters,
  setTempFilters,
  departments,
  STATUSES,
  onReset,
  onApply
}) => {
  return (
    <AnimatePresence>
      {show && (
        <div className="fixed inset-0 z-[150] lg:hidden">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
          />
          <motion.div 
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className={`absolute right-0 top-0 bottom-0 w-full max-w-xs shadow-2xl flex flex-col ${themeClasses.card}`}
          >
            <div className={`p-6 border-b shrink-0 flex items-center justify-between ${themeClasses.border}`}>
              <div>
                <h2 className={`text-xl font-black tracking-tight ${themeClasses.text}`}>Filter Antrian</h2>
                <p className={`text-[10px] ${themeClasses.textMuted} mt-0.5 font-medium uppercase tracking-widest`}>Sesuaikan tampilan antrian</p>
              </div>
              <button 
                onClick={onClose}
                className={`p-2 rounded-xl transition-all border ${themeClasses.input}`}
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto custom-scrollbar space-y-6">
              {/* Search Filter */}
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Cari Tiket</label>
                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                  <input 
                    type="text"
                    placeholder="ID, Nama, atau Masalah..."
                    value={tempFilters.search}
                    onChange={(e) => setTempFilters({ ...tempFilters, search: e.target.value })}
                    className={`w-full border rounded-xl py-3 pl-10 pr-4 text-xs font-bold outline-none transition-all ${themeClasses.input}`}
                  />
                </div>
              </div>

              {/* Department Filter */}
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Bagian / Departemen</label>
                <div className="flex flex-wrap gap-2">
                  <button 
                    onClick={() => setTempFilters({ ...tempFilters, dept: '' })}
                    className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all border ${
                      tempFilters.dept === '' 
                      ? 'bg-emerald-600 border-emerald-600 text-white' 
                      : isDark 
                        ? 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-750' 
                        : 'bg-slate-50 border-slate-100 text-slate-500 hover:bg-slate-100'
                    }`}
                  >
                    Semua
                  </button>
                  {departments.map(dept => (
                    <button 
                      key={dept.id}
                      onClick={() => setTempFilters({ ...tempFilters, dept: dept.name })}
                      className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all border ${
                        tempFilters.dept === dept.name 
                        ? 'bg-emerald-600 border-emerald-600 text-white' 
                        : isDark 
                          ? 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-750' 
                          : 'bg-slate-50 border-slate-100 text-slate-500 hover:bg-slate-100'
                      }`}
                    >
                      {dept.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Status Filter */}
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Status Tiket</label>
                <div className="flex flex-wrap gap-2">
                  <button 
                    onClick={() => setTempFilters({ ...tempFilters, status: '' })}
                    className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all border ${
                      tempFilters.status === '' 
                      ? 'bg-emerald-600 border-emerald-600 text-white' 
                      : isDark 
                        ? 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-750' 
                        : 'bg-slate-50 border-slate-100 text-slate-500 hover:bg-slate-100'
                    }`}
                  >
                    Semua
                  </button>
                  {STATUSES.map(status => (
                    <button 
                      key={status}
                      onClick={() => setTempFilters({ ...tempFilters, status: status })}
                      className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all border ${
                        tempFilters.status === status 
                        ? 'bg-emerald-600 border-emerald-600 text-white' 
                        : isDark 
                          ? 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-750' 
                          : 'bg-slate-50 border-slate-100 text-slate-500 hover:bg-slate-100'
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>

              {/* Date Filter */}
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tanggal Spesifik</label>
                <div className="relative">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    type="date"
                    value={tempFilters.date}
                    onChange={(e) => setTempFilters({ ...tempFilters, date: e.target.value })}
                    className={`w-full border rounded-xl py-3 pl-12 pr-4 text-xs font-bold focus:ring-2 focus:ring-emerald-500 outline-none transition-all ${
                      isDark 
                      ? 'bg-slate-800 border-slate-700 text-slate-200' 
                      : 'bg-slate-50 border-slate-100 text-slate-700'
                    }`}
                  />
                </div>
              </div>
            </div>

            <div className={`p-6 border-t shrink-0 flex gap-3 ${
              isDark ? 'border-slate-800' : 'border-slate-100'
            }`}>
              <button 
                onClick={onReset}
                className={`flex-1 py-4 font-black text-[10px] uppercase tracking-widest rounded-2xl transition-all ${
                  isDark ? 'bg-slate-800 text-slate-400 hover:bg-slate-750' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Reset
              </button>
              <button 
                onClick={onApply}
                className={`flex-[2] py-4 text-white font-black text-[10px] uppercase tracking-widest rounded-2xl shadow-lg transition-all active:scale-[0.98] ${
                  isDark ? 'bg-emerald-500 shadow-emerald-900/40 hover:bg-emerald-400' : 'bg-emerald-600 shadow-emerald-900/20 hover:opacity-90'
                }`}
              >
                Apply Filters
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
