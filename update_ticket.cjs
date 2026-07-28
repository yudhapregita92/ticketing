const fs = require('fs');
let code = fs.readFileSync('src/components/modals/NewTicketModal.tsx', 'utf8');

// Update validation
code = code.replace(
  /if \(newTicket\.jenis_masalah === 'Hardware'\) \{\s*if \(\!newTicket\.pc_code\?\.trim\(\)\) \{\s*alert\('Kode Komputer wajib diisi jika jenis masalah adalah Hardware\.'\);\s*return;\s*\}\s*if \(\!isPcCodeMatched\) \{\s*alert\('Kode Komputer tidak valid atau tidak ditemukan di database\.'\);\s*return;\s*\}\s*\}/,
  `if (!newTicket.pc_code?.trim()) {
      alert('Kode Perangkat wajib diisi.');
      return;
    }
    if (!isPcCodeMatched) {
      alert('Kode Perangkat tidak valid atau tidak ditemukan di database.');
      return;
    }`
);

// Update render condition & labels
code = code.replace(
  /\{newTicket\.jenis_masalah === 'Hardware' && \(\s*<div className="space-y-0\.5 sm:col-span-2">\s*<label className="flex items-center gap-1\.5 text-\[8px\] font-black text-slate-400 capitalize tracking-widest ml-0\.5">\s*<Monitor className="w-2\.5 h-2\.5 text-blue-500" \/> Kode Komputer \(Berlabel di Monitor\) <span className="text-rose-500 font-bold">\* Wajib<\/span>\s*<\/label>/g,
  `<div className="space-y-0.5 sm:col-span-2">
                <label className="flex items-center gap-1.5 text-[8px] font-black text-slate-400 capitalize tracking-widest ml-0.5">
                  <Monitor className="w-2.5 h-2.5 text-blue-500" /> Kode Perangkat <span className="text-rose-500 font-bold">* Wajib</span>
                </label>`
);

code = code.replace(
  /\* Masukkan nomor PC yang tertera pada stiker label di casing\/layar monitor Anda\./,
  '* Masukkan nomor perangkat yang tertera pada stiker label perangkat Anda.'
);

// Don't forget the closing parenthesis for the removed condition
code = code.replace(
  /<\/p>\s*<\/div>\s*\)\}\s*<div className="space-y-0\.5 sm:col-span-2">\s*<label className="flex items-center gap-1\.5 text-\[8px\] font-black text-slate-400 capitalize tracking-widest ml-0\.5">\s*<AlertTriangle className="w-2 h-2" \/> Prioritas/,
  `</p>
              </div>

            <div className="space-y-0.5 sm:col-span-2">
              <label className="flex items-center gap-1.5 text-[8px] font-black text-slate-400 capitalize tracking-widest ml-0.5">
                <AlertTriangle className="w-2 h-2" /> Prioritas`
);


// Update Submit Button disabled state
code = code.replace(
  /\(newTicket\.jenis_masalah === 'Hardware' && \(\!newTicket\.pc_code\?\.trim\(\) \|\| \!isPcCodeMatched\)\)/,
  `(!newTicket.pc_code?.trim() || !isPcCodeMatched)`
);

code = code.replace(
  /\(newTicket\.jenis_masalah !== 'Hardware' \|\| \(newTicket\.pc_code\?\.trim\(\) && isPcCodeMatched\)\)/,
  `(newTicket.pc_code?.trim() && isPcCodeMatched)`
);

fs.writeFileSync('src/components/modals/NewTicketModal.tsx', code);
