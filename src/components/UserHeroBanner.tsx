import React from 'react';
import { motion } from 'framer-motion';

interface UserHeroBannerProps {
  currentUser: any;
  tickets: any[];
  isDark: boolean;
  primaryColor?: string;
  appSettings?: any;
}

export const UserHeroBanner: React.FC<UserHeroBannerProps> = ({
  currentUser,
  tickets,
  isDark,
  primaryColor = '#059669',
  appSettings
}) => {
  if (appSettings?.banner_enabled === false) {
    return null;
  }

  const paddingY = appSettings?.banner_padding_y ?? 14;
  const marginBottom = appSettings?.banner_margin_bottom ?? 2;
  const imageType = appSettings?.banner_image_type || 'default_vector';
  const customImage = appSettings?.banner_custom_image || '';
  const imageSize = appSettings?.banner_image_size ?? 110;
  const cardRadius = appSettings?.ui_card_radius ?? 24;

  // Determine greeting based on current time
  const hour = new Date().getHours();
  let greetingTime = 'Selamat Pagi';
  if (hour >= 11 && hour < 15) {
    greetingTime = 'Selamat Siang';
  } else if (hour >= 15 && hour < 18) {
    greetingTime = 'Selamat Sore';
  } else if (hour >= 18 || hour < 4) {
    greetingTime = 'Selamat Malam';
  }

  // Get user's first name
  const fullName = currentUser?.full_name || 'User';
  const firstName = fullName.trim().split(' ')[0] || fullName;

  // Calculate ticket counts for User vs Admin
  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'it_support' || currentUser?.is_admin || currentUser?.employee_index === 'IT' || currentUser?.employee_index === 'ADMIN';

  const myTickets = tickets.filter(t => 
    (currentUser?.employee_index && t.employee_index === currentUser.employee_index) || 
    (currentUser?.name && t.name?.toLowerCase() === currentUser.name?.toLowerCase())
  );
  const myNewCount = myTickets.filter(t => t.status === 'New').length;
  const myProgressCount = myTickets.filter(t => t.status === 'In Progress' || t.status === 'Progres').length;
  const myPendingCount = myTickets.filter(t => t.status === 'Pending' || t.status === 'Pending Pengadaan').length;

  const globalNewCount = tickets.filter(t => t.status === 'New').length;
  const globalProgressCount = tickets.filter(t => t.status === 'In Progress' || t.status === 'Progres').length;

  // Construct dynamic text appropriate for User or Admin
  let bannerText = '';
  if (isAdmin) {
    if (globalNewCount > 0 && globalProgressCount > 0) {
      bannerText = `Ada ${globalNewCount} tiket baru dan ${globalProgressCount} tiket progres perlu ditangani tim IT hari ini.`;
    } else if (globalNewCount > 0) {
      bannerText = `Ada ${globalNewCount} tiket baru menunggu respon tim IT hari ini.`;
    } else if (globalProgressCount > 0) {
      bannerText = `Ada ${globalProgressCount} tiket sedang dalam proses penanganan IT hari ini.`;
    } else {
      bannerText = 'Semua antrian tiket telah selesai ditangani oleh tim IT hari ini.';
    }
  } else {
    // User / Karyawan perspective
    if (myProgressCount > 0 && myNewCount > 0) {
      bannerText = `Status Tiket Anda: ${myProgressCount} sedang diproses IT dan ${myNewCount} baru diajukan.`;
    } else if (myProgressCount > 0) {
      bannerText = `Tiket Anda (${myProgressCount}) saat ini sedang dalam proses penanganan oleh tim IT Support.`;
    } else if (myPendingCount > 0) {
      bannerText = `Tiket Anda (${myPendingCount}) sedang dalam status Pending (proses pengadaan perangkat / persetujuan).`;
    } else if (myNewCount > 0) {
      bannerText = `Tiket Anda (${myNewCount}) berhasil dikirim dan sedang menunggu giliran penanganan tim IT.`;
    } else if (myTickets.length > 0) {
      bannerText = 'Semua tiket Anda telah selesai ditangani. Apabila menemukan kendala baru, silakan ajukan tiket di bawah.';
    } else {
      bannerText = 'Selamat datang! Jika Anda mengalami kendala komputer, jaringan, atau aplikasi, silakan buat tiket baru.';
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      style={{
        paddingTop: `${paddingY}px`,
        paddingBottom: `${paddingY}px`,
        marginBottom: `${marginBottom}px`,
        borderRadius: `${cardRadius}px`
      }}
      className={`relative overflow-hidden px-4 sm:px-6 border transition-all ${
        isDark 
          ? 'bg-gradient-to-r from-slate-900 via-slate-900/95 to-slate-800/90 border-slate-800 text-slate-100 shadow-md' 
          : 'bg-gradient-to-r from-slate-50/90 via-emerald-50/20 to-teal-50/40 border-slate-200/80 text-slate-900 shadow-xs'
      }`}
    >
      <div className="flex flex-row items-center justify-between gap-3 sm:gap-6">
        {/* Left Side: Greeting & Subtitle (Always left-aligned) */}
        <div className="flex-1 min-w-0 z-10 text-left">
          <h2 
            className="text-lg xs:text-xl sm:text-2xl font-black tracking-tight leading-snug"
            style={{ color: isDark ? '#34d399' : primaryColor }}
          >
            {greetingTime}, {firstName}!
          </h2>
          <p className={`mt-1 sm:mt-1.5 text-xs sm:text-sm font-medium leading-relaxed max-w-xl ${
            isDark ? 'text-slate-300' : 'text-slate-600'
          }`}>
            {bannerText}
          </p>
        </div>

        {/* Right Side: Technician Illustration or Custom Uploaded Image */}
        <div className="relative shrink-0 flex items-center justify-end">
          {/* Speech Bubble */}
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
            className={`absolute -top-1.5 right-0 sm:-top-2 sm:right-1 z-20 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-xl rounded-br-none border shadow-xs flex items-center gap-0.5 ${
              isDark ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-white border-slate-200 text-slate-600'
            }`}
          >
            <span className="flex items-center gap-0.5">
              <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '300ms' }} />
            </span>
          </motion.div>

          {/* Custom Uploaded Image or Default Vector */}
          {imageType === 'custom_image' && customImage ? (
            <div 
              style={{ width: `${imageSize}px` }} 
              className="relative flex items-center justify-center overflow-hidden shrink-0"
            >
              <img 
                src={customImage} 
                alt="Banner Illustration" 
                style={{ width: `${imageSize}px`, maxHeight: `${imageSize * 1.2}px` }} 
                className="object-contain drop-shadow-sm rounded-xl"
                referrerPolicy="no-referrer"
              />
            </div>
          ) : (
            <div 
              style={{ width: `${imageSize}px`, height: `${Math.round(imageSize * 0.85)}px` }} 
              className="relative flex items-center justify-center shrink-0"
            >
              <svg viewBox="0 0 200 180" className="w-full h-full drop-shadow-sm">
                {/* Subtle background glow circle */}
                <circle cx="100" cy="100" r="75" fill={isDark ? "rgba(16,185,129,0.08)" : "rgba(16,185,129,0.1)"} />

                {/* Technician Head & Hair */}
                <path d="M 75 45 C 75 30, 115 30, 115 45 L 115 62 C 115 72, 75 72, 75 62 Z" fill="#2d3748" />
                {/* Hair Top Styling */}
                <path d="M 72 48 C 72 25, 118 25, 118 48 C 110 32, 80 32, 72 48 Z" fill="#1a202c" />

                {/* Face */}
                <ellipse cx="95" cy="55" rx="18" ry="20" fill="#fbd38d" />
                {/* Ears */}
                <ellipse cx="76" cy="55" rx="4" ry="5" fill="#f6ad55" />
                <ellipse cx="114" cy="55" rx="4" ry="5" fill="#f6ad55" />

                {/* Eyes */}
                <circle cx="89" cy="52" r="2.5" fill="#2d3748" />
                <circle cx="101" cy="52" r="2.5" fill="#2d3748" />
                {/* Eyebrows */}
                <path d="M 85 46 Q 89 44 93 46" stroke="#2d3748" strokeWidth="1.5" strokeLinecap="round" fill="none" />
                <path d="M 97 46 Q 101 44 105 46" stroke="#2d3748" strokeWidth="1.5" strokeLinecap="round" fill="none" />

                {/* Cheerful Smile */}
                <path d="M 89 62 Q 95 68 101 62" stroke="#e53e3e" strokeWidth="2" strokeLinecap="round" fill="none" />

                {/* Neck */}
                <rect x="90" y="73" width="10" height="10" fill="#f6ad55" rx="2" />

                {/* Shirt Body (Blue/Teal Polo) */}
                <path d="M 60 82 Q 95 78 130 82 L 138 140 Q 95 145 52 140 Z" fill="#0284c7" />
                {/* Polo Collar */}
                <path d="M 80 82 L 95 96 L 110 82 Z" fill="#0369a1" />
                {/* Pocket & Pen */}
                <rect x="110" y="100" width="14" height="16" fill="#0369a1" rx="2" />
                <rect x="115" y="94" width="3" height="10" fill="#cbd5e1" rx="1" />

                {/* Arm Left (Bent) */}
                <path d="M 60 84 Q 45 110 65 125" stroke="#0284c7" strokeWidth="16" strokeLinecap="round" fill="none" />
                <circle cx="65" cy="125" r="8" fill="#fbd38d" />

                {/* Arm Right (Holding Toolbox Strap) */}
                <path d="M 130 84 Q 148 110 135 130" stroke="#0284c7" strokeWidth="16" strokeLinecap="round" fill="none" />
                <circle cx="135" cy="130" r="8" fill="#fbd38d" />

                {/* Toolbox (Brown/Orange) */}
                <g transform="translate(115, 115)">
                  {/* Main Box */}
                  <rect x="0" y="10" width="55" height="38" fill="#c05621" rx="6" />
                  <rect x="3" y="13" width="49" height="12" fill="#dd6b20" rx="3" />
                  {/* Metal Latch */}
                  <rect x="23" y="20" width="9" height="10" fill="#e2e8f0" rx="2" />

                  {/* Handle */}
                  <path d="M 18 10 L 18 3 Q 27.5 -2 37 3 L 37 10" stroke="#742a2a" strokeWidth="4" strokeLinecap="round" fill="none" />

                  {/* Wrench protruding from toolbox */}
                  <g transform="translate(36, -6) rotate(20)">
                    <path d="M 0 0 L 0 22" stroke="#94a3b8" strokeWidth="4" strokeLinecap="round" />
                    <circle cx="0" cy="0" r="5" fill="none" stroke="#94a3b8" strokeWidth="3" />
                  </g>

                  {/* Screwdriver protruding */}
                  <g transform="translate(12, -8) rotate(-15)">
                    <rect x="-2" y="0" width="4" height="16" fill="#e53e3e" rx="1" />
                    <path d="M 0 16 L 0 26" stroke="#94a3b8" strokeWidth="3" strokeLinecap="round" />
                  </g>
                </g>
              </svg>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};
