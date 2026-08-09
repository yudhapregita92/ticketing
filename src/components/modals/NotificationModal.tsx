import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Bell, CheckCheck, MessageSquare, Zap, Activity, Clock, Package, ShoppingCart, AlertTriangle, ChevronRight, PauseCircle } from 'lucide-react';
import { INotification } from '../../types';

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: INotification[];
  onMarkAsRead: (id?: number, all?: boolean) => void;
  onSelectTicket?: (ticketNo: string) => void;
  isDark: boolean;
}

export const NotificationModal: React.FC<NotificationModalProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkAsRead,
  onSelectTicket,
  isDark
}) => {
  const [filter, setFilter] = useState<'all' | 'unread' | 'recommendation'>('all');

  if (!isOpen) return null;

  const getNotifCategory = (item: INotification) => {
    const t = (item.type || '').toLowerCase();
    const title = (item.title || '').toLowerCase();
    const msg = (item.message || '').toLowerCase();

    if (t === 'part_loan' || title.includes('peminjaman') || msg.includes('dipinjamkan')) {
      return 'part_loan';
    }
    if (t === 'urgent_purchase' || title.includes('pembelian') || title.includes('urgent') || msg.includes('harus dibeli') || msg.includes('pengadaan')) {
      return 'urgent_purchase';
    }
    if (t === 'admin_reply' || title.includes('balasan')) {
      return 'admin_reply';
    }
    if (t === 'auto_respond') {
      return 'auto_respond';
    }
    return 'status_change';
  };

  const filtered = notifications.filter(n => {
    if (filter === 'unread') return n.is_read === 0;
    if (filter === 'recommendation') {
      const cat = getNotifCategory(n);
      return cat === 'part_loan' || cat === 'urgent_purchase';
    }
    return true;
  });

  const unreadCount = notifications.filter(n => n.is_read === 0).length;
  const recCount = notifications.filter(n => {
    const cat = getNotifCategory(n);
    return cat === 'part_loan' || cat === 'urgent_purchase';
  }).length;

  const formatTimeAgo = (dateStr: string) => {
    try {
      const date = new Date(dateStr.includes('T') ? dateStr : dateStr.replace(' ', 'T'));
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffSecs = Math.floor(diffMs / 1000);
      const diffMins = Math.floor(diffSecs / 60);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffSecs < 60) return 'Baru saja';
      if (diffMins < 60) return `${diffMins} mnt lalu`;
      if (diffHours < 24) return `${diffHours} jam lalu`;
      if (diffDays === 1) return 'Kemarin';
      return `${diffDays} hr lalu`;
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        key="notif-modal-content"
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className={`w-full max-w-lg rounded-2xl shadow-2xl border overflow-hidden flex flex-col max-h-[85vh] ${
          isDark ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Header */}
        <div className="p-3.5 sm:p-4 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500 shrink-0">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-black">Notifikasi & Respon IT</h2>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400 font-medium">
                {unreadCount > 0 ? `${unreadCount} notifikasi baru belum dibaca` : 'Semua notifikasi terupdate'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className={`p-1.5 sm:p-2 rounded-xl transition-all ${
              isDark ? 'text-zinc-400 hover:bg-zinc-800' : 'text-slate-400 hover:bg-slate-100'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action & Filter Bar */}
        <div className="px-3 sm:px-4 py-2 border-b border-slate-100 dark:border-zinc-800/60 bg-slate-50/60 dark:bg-zinc-900/60 flex items-center justify-between gap-2 text-xs flex-wrap">
          <div className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            <button
              onClick={() => setFilter('all')}
              className={`px-2.5 py-1 rounded-lg text-[10.5px] sm:text-xs font-bold transition-all whitespace-nowrap ${
                filter === 'all'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : isDark ? 'text-zinc-400 hover:bg-zinc-800' : 'text-slate-600 hover:bg-slate-200/60'
              }`}
            >
              Semua ({notifications.length})
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-2.5 py-1 rounded-lg text-[10.5px] sm:text-xs font-bold transition-all whitespace-nowrap ${
                filter === 'unread'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : isDark ? 'text-zinc-400 hover:bg-zinc-800' : 'text-slate-600 hover:bg-slate-200/60'
              }`}
            >
              Belum Dibaca ({unreadCount})
            </button>
            {recCount > 0 && (
              <button
                onClick={() => setFilter('recommendation')}
                className={`px-2.5 py-1 rounded-lg text-[10.5px] sm:text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1 ${
                  filter === 'recommendation'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : isDark ? 'text-amber-400 hover:bg-zinc-800' : 'text-amber-700 hover:bg-amber-50'
                }`}
              >
                <span>Part / Urgent</span>
                <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-amber-500/20 text-amber-300 font-extrabold">{recCount}</span>
              </button>
            )}
          </div>

          {unreadCount > 0 && (
            <button
              onClick={() => onMarkAsRead(undefined, true)}
              className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline shrink-0 ml-auto"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>Tandai Semua</span>
            </button>
          )}
        </div>

        {/* Notification List */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2">
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-slate-400 dark:text-zinc-500">
              <Bell className="w-10 h-10 mx-auto mb-2 opacity-25" />
              <p className="text-xs sm:text-sm font-bold">
                Tidak ada notifikasi {filter === 'unread' ? 'belum dibaca' : filter === 'recommendation' ? 'peminjaman / urgent' : ''}
              </p>
            </div>
          ) : (
            filtered.map((item, idx) => {
              const isUnread = item.is_read === 0;
              const category = getNotifCategory(item);
              const msgLower = (item.message || '').toLowerCase();
              const titleLower = (item.title || '').toLowerCase();
              const isSlaPaused = category === 'urgent_purchase' || msgLower.includes('harus dibeli') || msgLower.includes('pengadaan') || msgLower.includes('pending') || msgLower.includes('sla paused') || titleLower.includes('pengadaan') || titleLower.includes('pembelian');

              let icon = <Activity className="w-4 h-4" />;
              let iconBg = "bg-emerald-500/10 text-emerald-500";
              let badgeTag = <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">Progres</span>;
              let cardBorder = isUnread 
                ? (isDark ? 'bg-emerald-950/20 border-emerald-800/40' : 'bg-emerald-50/50 border-emerald-200') 
                : (isDark ? 'bg-zinc-900/50 border-zinc-800/60' : 'bg-white border-slate-200/80');

              if (category === 'part_loan') {
                icon = <Package className="w-4 h-4" />;
                iconBg = "bg-amber-500/20 text-amber-500 ring-1 ring-amber-500/30";
                badgeTag = (
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 flex items-center gap-1">
                    <Package className="w-2.5 h-2.5" />
                    <span>📦 Peminjaman Part</span>
                  </span>
                );
                cardBorder = isUnread
                  ? (isDark ? 'bg-amber-950/25 border-amber-500/50' : 'bg-amber-50/80 border-amber-300')
                  : (isDark ? 'bg-zinc-900/60 border-amber-900/30' : 'bg-amber-50/20 border-slate-200');
              } else if (category === 'urgent_purchase') {
                icon = <ShoppingCart className="w-4 h-4" />;
                iconBg = "bg-rose-500/20 text-rose-500 ring-1 ring-rose-500/30";
                badgeTag = (
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30 flex items-center gap-1">
                    <AlertTriangle className="w-2.5 h-2.5" />
                    <span>🚨 Pembelian Urgent</span>
                  </span>
                );
                cardBorder = isUnread
                  ? (isDark ? 'bg-rose-950/25 border-rose-500/50' : 'bg-rose-50/80 border-rose-300')
                  : (isDark ? 'bg-zinc-900/60 border-rose-900/30' : 'bg-rose-50/20 border-slate-200');
              } else if (category === 'admin_reply') {
                icon = <MessageSquare className="w-4 h-4" />;
                iconBg = "bg-blue-500/10 text-blue-500";
                badgeTag = <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">Balasan IT</span>;
              } else if (category === 'auto_respond') {
                icon = <Zap className="w-4 h-4" />;
                iconBg = "bg-amber-500/10 text-amber-500";
                badgeTag = <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">Auto Respond</span>;
              }

              return (
                <div
                  key={`notif-${item.id}-${idx}`}
                  onClick={() => {
                    if (isUnread) onMarkAsRead(item.id);
                    if (onSelectTicket) {
                      onSelectTicket(item.ticket_no);
                      onClose();
                    }
                  }}
                  className={`p-3 rounded-xl border transition-all cursor-pointer group ${cardBorder} hover:border-emerald-500/60 hover:shadow-sm`}
                >
                  <div className="flex items-start gap-2.5">
                    <div className={`p-2 rounded-xl shrink-0 mt-0.5 ${iconBg}`}>
                      {icon}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1.5 mb-1 flex-wrap">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {badgeTag}
                          {isSlaPaused && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-600 flex items-center gap-1 shadow-2xs">
                              <PauseCircle className="w-2.5 h-2.5 text-purple-600 dark:text-purple-400 shrink-0" />
                              <span>⏸️ SLA Paused</span>
                            </span>
                          )}
                          <span className="text-[10px] font-mono font-bold text-slate-500 dark:text-zinc-400">
                            #{item.ticket_no}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 shrink-0 ml-auto">
                          <span className="text-[10px] text-slate-400 dark:text-zinc-500 flex items-center gap-0.5">
                            <Clock className="w-2.5 h-2.5" />
                            {formatTimeAgo(item.created_at)}
                          </span>
                          {isUnread && (
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse ml-1" />
                          )}
                        </div>
                      </div>

                      <h4 className="text-xs font-black leading-snug mb-1 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                        {item.title}
                      </h4>
                      <p className="text-[11px] text-slate-600 dark:text-zinc-300 line-clamp-2 leading-relaxed font-normal">
                        {item.message}
                      </p>

                      <div className="mt-2 pt-1.5 border-t border-slate-100 dark:border-zinc-800/50 flex items-center justify-between text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                        <span>Lihat detail tiket & rekomendasi</span>
                        <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </motion.div>
    </div>
  );
};
