import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Bell, CheckCheck, MessageSquare, Zap, Activity, Clock, CheckCircle2 } from 'lucide-react';
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
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  if (!isOpen) return null;

  const filtered = notifications.filter(n => filter === 'all' || n.is_read === 0);
  const unreadCount = notifications.filter(n => n.is_read === 0).length;

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
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className={`w-full max-w-lg rounded-2xl shadow-2xl border overflow-hidden flex flex-col max-h-[85vh] ${
            isDark ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}
        >
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold">Notifikasi & Respon</h2>
                <p className="text-xs text-slate-500 dark:text-zinc-400">
                  {unreadCount > 0 ? `${unreadCount} notifikasi belum dibaca` : 'Semua notifikasi terupdate'}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className={`p-2 rounded-xl transition-all ${
                isDark ? 'text-zinc-400 hover:bg-zinc-800' : 'text-slate-400 hover:bg-slate-100'
              }`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Action & Filter Bar */}
          <div className="px-4 py-2.5 border-b border-slate-100 dark:border-zinc-800/60 bg-slate-50/50 dark:bg-zinc-900/50 flex items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setFilter('all')}
                className={`px-3 py-1 rounded-lg font-bold transition-all ${
                  filter === 'all'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : isDark ? 'text-zinc-400 hover:bg-zinc-800' : 'text-slate-600 hover:bg-slate-200/60'
                }`}
              >
                Semua ({notifications.length})
              </button>
              <button
                onClick={() => setFilter('unread')}
                className={`px-3 py-1 rounded-lg font-bold transition-all ${
                  filter === 'unread'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : isDark ? 'text-zinc-400 hover:bg-zinc-800' : 'text-slate-600 hover:bg-slate-200/60'
                }`}
              >
                Belum Dibaca ({unreadCount})
              </button>
            </div>

            {unreadCount > 0 && (
              <button
                onClick={() => onMarkAsRead(undefined, true)}
                className="flex items-center gap-1 font-bold text-emerald-600 dark:text-emerald-400 hover:underline shrink-0"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Tandai Semua Dibaca</span>
              </button>
            )}
          </div>

          {/* Notification List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2.5 divide-y divide-slate-100 dark:divide-zinc-800/40">
            {filtered.length === 0 ? (
              <div className="py-12 text-center text-slate-400 dark:text-zinc-500">
                <Bell className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm font-semibold">Tidak ada notifikasi {filter === 'unread' ? 'belum dibaca' : ''}</p>
              </div>
            ) : (
              filtered.map((item) => {
                const isUnread = item.is_read === 0;
                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      if (isUnread) onMarkAsRead(item.id);
                      if (onSelectTicket) {
                        onSelectTicket(item.ticket_no);
                        onClose();
                      }
                    }}
                    className={`pt-2.5 first:pt-0 p-3 rounded-xl border transition-all cursor-pointer flex gap-3 ${
                      isUnread
                        ? (isDark ? 'bg-emerald-950/20 border-emerald-800/40' : 'bg-emerald-50/60 border-emerald-200/80')
                        : (isDark ? 'bg-zinc-900/40 border-zinc-800/60 opacity-80' : 'bg-white border-slate-200/60')
                    } hover:border-emerald-500/50`}
                  >
                    <div className="shrink-0 mt-0.5">
                      {item.type === 'admin_reply' ? (
                        <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
                          <MessageSquare className="w-4 h-4" />
                        </div>
                      ) : item.type === 'auto_respond' ? (
                        <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                          <Zap className="w-4 h-4" />
                        </div>
                      ) : (
                        <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                          <Activity className="w-4 h-4" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-xs font-black tracking-tight text-emerald-600 dark:text-emerald-400 truncate">
                          #{item.ticket_no}
                        </span>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="text-[10px] text-slate-400 dark:text-zinc-500 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatTimeAgo(item.created_at)}
                          </span>
                          {isUnread && (
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                          )}
                        </div>
                      </div>

                      <h4 className="text-xs font-bold leading-tight mb-1">
                        {item.title}
                      </h4>
                      <p className="text-xs text-slate-600 dark:text-zinc-300 line-clamp-2 leading-relaxed">
                        {item.message}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
