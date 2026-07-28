const fs = require('fs');
let code = fs.readFileSync('src/components/MasterUserManagement.tsx', 'utf8');

// The block to remove
const oldBlock = `<div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[9px] font-black uppercase tracking-wider text-slate-400 mb-1.5">Kode Piranti (Opsional)</label>
                    <input 
                      type="text"
                      placeholder="Contoh: KMP-01 atau LPT-02"
                      className={\`w-full px-3 py-2.5 rounded-xl border text-xs font-medium outline-none focus:ring-2 focus:ring-emerald-500 \${themeClasses.bgSecondary} \${themeClasses.border} \${themeClasses.text}\`}
                      value={masterUserKodePiranti}
                      onChange={e => setMasterUserKodePiranti(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-black uppercase tracking-wider text-slate-400 mb-1.5">Email (Opsional)</label>`;

const newBlock = `<div className="grid grid-cols-1 gap-3">
                  <div>
                    <label className="block text-[9px] font-black uppercase tracking-wider text-slate-400 mb-1.5">Email (Opsional)</label>`;

code = code.replace(oldBlock, newBlock);

fs.writeFileSync('src/components/MasterUserManagement.tsx', code);
