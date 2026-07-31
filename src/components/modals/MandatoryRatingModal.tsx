import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Star, MessageSquare, Send, ShieldAlert, CheckCircle2, Award, UserCheck } from 'lucide-react';
import { ITicket } from '../../types';
import { api } from '../../services/api';
import { toast } from 'react-hot-toast';

interface MandatoryRatingModalProps {
  unratedTickets: ITicket[];
  onRatingSubmitted: () => void;
  isDark?: boolean;
}

export const MandatoryRatingModal: React.FC<MandatoryRatingModalProps> = ({
  unratedTickets,
  onRatingSubmitted,
  isDark = false,
}) => {
  const currentTicket = unratedTickets[0];
  const [rating, setRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [feedback, setFeedback] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  if (!currentTicket) return null;

  const activeRating = hoverRating || rating;

  const ratingLabels: Record<number, { label: string; color: string; bg: string }> = {
    1: { label: 'Sangat Tidak Puas 😞', color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800' },
    2: { label: 'Kurang Puas 🙁', color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-950/40 border-orange-200 dark:border-orange-800' },
    3: { label: 'Cukup Baik 😐', color: 'text-yellow-600', bg: 'bg-yellow-50 dark:bg-yellow-950/40 border-yellow-200 dark:border-yellow-800' },
    4: { label: 'Puas / Bagus 🙂', color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800' },
    5: { label: 'Sangat Puas / Luar Biasa! 😁', color: 'text-emerald-600', bg: 'bg-emerald-100 dark:bg-emerald-900/50 border-emerald-300 dark:border-emerald-700' },
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      toast.error('Silakan pilih rating bintang terlebih dahulu (1 - 5 Bintang)');
      return;
    }

    setSubmitting(true);
    try {
      await api.rateTicket(
        currentTicket.id,
        rating,
        feedback.trim(),
        currentTicket.name
      );
      toast.success('Terima kasih! Penilaian layanan Anda telah berhasil disimpan.');
      setRating(0);
      setHoverRating(0);
      setFeedback('');
      onRatingSubmitted();
    } catch (err: any) {
      console.error('Error submitting rating:', err);
      toast.error(err.message || 'Gagal menyimpan penilaian');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-2 sm:p-4 bg-slate-900/80 backdrop-blur-md select-none overflow-y-auto">
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 15 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 15 }}
        className={`w-full max-w-lg max-h-[90vh] flex flex-col rounded-2xl shadow-2xl overflow-hidden border ${
          isDark ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Top Warning Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-3.5 sm:p-5 text-white shrink-0 relative">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="p-2 sm:p-2.5 bg-white/20 rounded-xl backdrop-blur-sm shadow-inner shrink-0">
              <Award className="w-5 h-5 sm:w-7 sm:h-7 text-amber-300 animate-bounce" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                <span className="px-2 py-0.5 text-[9px] sm:text-[10px] font-black uppercase tracking-wider bg-amber-400 text-slate-950 rounded-full">
                  Wajib Diisi
                </span>
                {unratedTickets.length > 1 && (
                  <span className="text-[10px] sm:text-[11px] font-semibold bg-white/20 px-2 py-0.5 rounded-full truncate">
                    {unratedTickets.length} Tiket Menunggu Ulasan
                  </span>
                )}
              </div>
              <h3 className="text-base sm:text-lg font-black tracking-tight mt-0.5 truncate">Penilaian Layanan IT</h3>
              <p className="text-[11px] sm:text-xs text-emerald-100 font-medium leading-tight">
                Mohon beri nilai untuk membuka akses penuh aplikasi Helpdesk.
              </p>
            </div>
          </div>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="p-3.5 sm:p-6 space-y-3.5 sm:space-y-5 overflow-y-auto flex-1 custom-scrollbar">
          {/* Ticket Summary Box */}
          <div className={`p-3 sm:p-4 rounded-xl border ${
            isDark ? 'bg-slate-800/80 border-slate-700' : 'bg-slate-50 border-slate-200'
          }`}>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] sm:text-xs font-black text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/60 px-2 sm:px-2.5 py-0.5 rounded-lg">
                #{currentTicket.ticket_no}
              </span>
              <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Selesai
              </span>
            </div>
            <h4 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 mb-0.5 truncate">
              {currentTicket.category}
            </h4>
            <p className="text-[11px] sm:text-xs text-slate-600 dark:text-slate-300 line-clamp-2 italic mb-1.5 leading-snug">
              "{currentTicket.description || 'Tidak ada deskripsi'}"
            </p>
            {currentTicket.assigned_to && (
              <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 font-medium border-t border-slate-200 dark:border-slate-700/60 pt-1.5">
                <UserCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>Ditangani oleh: <span className="font-bold text-slate-700 dark:text-slate-200">{currentTicket.assigned_to}</span></span>
              </div>
            )}
          </div>

          {/* Star Rating Section */}
          <div className="text-center space-y-2">
            <label className="block text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
              Bagaimana Tingkat Kepuasan Layanan Kami? <span className="text-red-500">*</span>
            </label>

            <div className="flex items-center justify-center gap-1.5 sm:gap-2.5 py-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="p-1 transition-transform active:scale-110 sm:hover:scale-125 focus:outline-none cursor-pointer"
                >
                  <Star
                    className={`w-7 h-7 sm:w-9 sm:h-9 transition-colors ${
                      star <= activeRating
                        ? 'fill-amber-400 text-amber-400 drop-shadow-md'
                        : 'text-slate-300 dark:text-slate-700'
                    }`}
                  />
                </button>
              ))}
            </div>

            {/* Rating Label Display */}
            {activeRating > 0 ? (
              <div className={`py-1 px-2.5 sm:py-1.5 sm:px-3 rounded-lg border inline-block text-[11px] sm:text-xs font-bold transition-all ${ratingLabels[activeRating]?.bg} ${ratingLabels[activeRating]?.color}`}>
                {ratingLabels[activeRating]?.label}
              </div>
            ) : (
              <p className="text-[11px] sm:text-xs text-slate-400 italic">Pilih 1 sampai 5 bintang</p>
            )}
          </div>

          {/* Feedback Text Area */}
          <div>
            <label className="block text-[11px] sm:text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              Kritik / Saran / Masukan Pelayanan (Opsional):
            </label>
            <textarea
              rows={2}
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Contoh: Penanganan sangat cepat dan ramah. Terimakasih!"
              className={`w-full p-2.5 sm:p-3 rounded-xl text-xs border outline-none focus:ring-2 focus:ring-emerald-500 transition-all ${
                isDark ? 'bg-slate-800 border-slate-700 text-slate-100 placeholder-slate-500' : 'bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400'
              }`}
            />
          </div>

          {/* Lock Notice */}
          <div className="flex items-start gap-2 p-2.5 sm:p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 rounded-xl text-[10px] sm:text-[11px] text-amber-800 dark:text-amber-300">
            <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <p className="leading-snug">
              Akses fitur aplikasi akan terbuka secara otomatis setelah Anda mengirimkan ulasan layanan ini.
            </p>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting || rating === 0}
            className={`w-full py-2.5 sm:py-3.5 px-4 rounded-xl text-xs font-bold text-white shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer ${
              rating === 0 || submitting
                ? 'bg-slate-400 dark:bg-slate-700 cursor-not-allowed opacity-60'
                : 'bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] shadow-emerald-600/30'
            }`}
          >
            <Send className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            {submitting ? 'Menyimpan Penilaian...' : 'Kirim Penilaian & Buka Aplikasi'}
          </button>
        </form>
      </motion.div>
    </div>
  );
};
