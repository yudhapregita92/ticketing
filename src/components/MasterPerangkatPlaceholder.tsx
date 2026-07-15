import React from 'react';

export const MasterPerangkatPlaceholder = ({ isDark }: { isDark: boolean }) => (
  <div className={`p-8 rounded-2xl ${isDark ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}`}>
    <h2 className="text-2xl font-bold mb-4">Master Data Perangkat</h2>
    <p>Halaman ini sedang dalam pengembangan...</p>
  </div>
);
