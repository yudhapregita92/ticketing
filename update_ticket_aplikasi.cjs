const fs = require('fs');
let code = fs.readFileSync('src/components/modals/NewTicketModal.tsx', 'utf8');

// Update validation
code = code.replace(
  /if \(\!newTicket\.pc_code\?\.trim\(\)\) \{\s*alert\('Kode Perangkat wajib diisi\.'\);\s*return;\s*\}\s*if \(\!isPcCodeMatched\) \{\s*alert\('Kode Perangkat tidak valid atau tidak ditemukan di database\.'\);\s*return;\s*\}/,
  `if (newTicket.jenis_masalah !== 'Aplikasi') {
      if (!newTicket.pc_code?.trim()) {
        alert('Kode Perangkat wajib diisi.');
        return;
      }
      if (!isPcCodeMatched) {
        alert('Kode Perangkat tidak valid atau tidak ditemukan di database.');
        return;
      }
    }`
);

// Update render condition
code = code.replace(
  /<div className="space-y-0\.5 sm:col-span-2">\s*<label className="flex items-center gap-1\.5 text-\[8px\] font-black text-slate-400 capitalize tracking-widest ml-0\.5">\s*<Monitor className="w-2\.5 h-2\.5 text-blue-500" \/> Kode Perangkat <span className="text-rose-500 font-bold">\* Wajib<\/span>\s*<\/label>/,
  `{newTicket.jenis_masalah !== 'Aplikasi' && (
              <div className="space-y-0.5 sm:col-span-2">
                <label className="flex items-center gap-1.5 text-[8px] font-black text-slate-400 capitalize tracking-widest ml-0.5">
                  <Monitor className="w-2.5 h-2.5 text-blue-500" /> Kode Perangkat <span className="text-rose-500 font-bold">* Wajib</span>
                </label>`
);

// Close the render condition wrapper
code = code.replace(
  /\* Masukkan nomor perangkat yang tertera pada stiker label perangkat Anda\.\s*<\/p>\s*<\/div>\s*<div className="space-y-0\.5 sm:col-span-2">\s*<label className="flex items-center gap-1\.5 text-\[8px\] font-black text-slate-400 capitalize tracking-widest ml-0\.5">\s*<AlertTriangle className="w-2 h-2" \/> Prioritas/,
  `* Masukkan nomor perangkat yang tertera pada stiker label perangkat Anda.
                </p>
              </div>
            )}

            <div className="space-y-0.5 sm:col-span-2">
              <label className="flex items-center gap-1.5 text-[8px] font-black text-slate-400 capitalize tracking-widest ml-0.5">
                <AlertTriangle className="w-2 h-2" /> Prioritas`
);

// Update Submit Button disabled state
code = code.replace(
  /\(\!newTicket\.pc_code\?\.trim\(\) \|\| \!isPcCodeMatched\)/,
  `(newTicket.jenis_masalah !== 'Aplikasi' && (!newTicket.pc_code?.trim() || !isPcCodeMatched))`
);

code = code.replace(
  /\(newTicket\.pc_code\?\.trim\(\) && isPcCodeMatched\)/,
  `(newTicket.jenis_masalah === 'Aplikasi' || (newTicket.pc_code?.trim() && isPcCodeMatched))`
);

fs.writeFileSync('src/components/modals/NewTicketModal.tsx', code);
