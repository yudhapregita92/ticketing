const fs = require('fs');

let code = fs.readFileSync('src/components/AssetManagement.tsx', 'utf8');

const actionMobile = `                  {/* Actions */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button 
                      onClick={() => handlePrintSingleLabel(asset)}
                      className="p-1.5 rounded-lg text-amber-600 hover:bg-amber-50 dark:hover:bg-slate-800 transition-colors"
                      title="Cetak Label"
                    >
                      <Printer className="w-4 h-4" />
                    </button>`;

code = code.replace(/                  \{\/\* Actions \*\/}[\s\S]*?<div className="flex items-center gap-1 flex-shrink-0">/g, actionMobile);

const actionDesktop = `                    <td className="px-3 py-2.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button 
                          onClick={() => handlePrintSingleLabel(asset)}
                          className="p-1.5 rounded-lg text-amber-600 hover:bg-amber-50 dark:hover:bg-slate-800 transition-colors"
                          title="Cetak Label"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>`;

code = code.replace(/                    <td className="px-3 py-2.5 text-right">[\s\S]*?<div className="flex items-center justify-end gap-1">/g, actionDesktop);

fs.writeFileSync('src/components/AssetManagement.tsx', code);
