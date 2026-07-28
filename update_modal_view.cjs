const fs = require('fs');
let code = fs.readFileSync('src/components/AssetManagement.tsx', 'utf8');

// The block to replace:
// from `{/* Asset View Modal */}` to `</AnimatePresence>\n\n      {/* Modal Hapus Semua Data Aset */}`
code = code.replace(
  /\{\/\* Asset View Modal \*\/\}[\s\S]*?\{\/\* Modal Hapus Semua Data Aset \*\/\}/,
  `{/* Modal Hapus Semua Data Aset */}`
);

// Now update showModal to support View Mode
const oldHeader = `              <div className={\`px-4 sm:px-6 py-3.5 sm:py-4 border-b flex items-center justify-between sticky top-0 z-10 flex-shrink-0 \${
                isDark ? 'border-slate-800 bg-slate-900' : 'border-slate-100 bg-white'
              }\`}>
                <h2 className={\`text-base sm:text-lg font-black flex items-center gap-2 \${themeClasses.heading}\`}>
                  <Package className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500" />
                  {editingAsset ? 'Edit Aset' : 'Tambah Aset Baru'}
                </h2>
                <button 
                  onClick={() => setShowModal(false)}
                  className="p-1.5 sm:p-2 rounded-xl hover:bg-slate-200/50 transition-colors"
                >
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>`;

const newHeader = `              <div className={\`px-4 sm:px-6 py-3.5 sm:py-4 border-b flex items-center justify-between sticky top-0 z-10 flex-shrink-0 \${
                isDark ? 'border-slate-800 bg-slate-900' : 'border-slate-100 bg-white'
              }\`}>
                <h2 className={\`text-base sm:text-lg font-black flex items-center gap-2 \${themeClasses.heading}\`}>
                  {isViewMode ? (
                    <><Eye className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500" /> Detail Aset</>
                  ) : (
                    <><Package className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500" /> {editingAsset ? 'Edit Aset' : 'Tambah Aset Baru'}</>
                  )}
                </h2>
                <div className="flex items-center gap-2">
                  {isViewMode && (
                    <button 
                      onClick={() => setIsViewMode(false)}
                      className="px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 text-xs font-bold transition-colors flex items-center gap-1.5"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Edit</span>
                    </button>
                  )}
                  <button 
                    onClick={() => setShowModal(false)}
                    className="p-1.5 sm:p-2 rounded-xl hover:bg-slate-200/50 transition-colors"
                  >
                    <X className="w-5 h-5 text-slate-400" />
                  </button>
                </div>
              </div>`;

code = code.replace(oldHeader, newHeader);

const oldFormStart = `<form onSubmit={handleSave} className="p-4 sm:p-6 overflow-y-auto space-y-4 sm:space-y-5">`;
const newFormStart = `
              {isViewMode && editingAsset ? (
                <div className="p-4 sm:p-6 overflow-y-auto space-y-4 sm:space-y-5 text-sm">
                  <div className="flex items-center gap-3 mb-2">
                    <div className={\`p-3 rounded-2xl flex-shrink-0 \${isDark ? 'bg-slate-800' : 'bg-slate-100'}\`}>
                      {getCategoryIcon(editingAsset.category)}
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">{editingAsset.name || editingAsset.category}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                          {editingAsset.category}
                        </span>
                        {getStatusBadge(editingAsset.status)}
                      </div>
                    </div>
                  </div>

                  <div className={\`p-4 rounded-2xl grid grid-cols-1 sm:grid-cols-2 gap-4 \${
                    isDark ? 'bg-slate-800/40 border border-slate-800' : 'bg-slate-50 border border-slate-100'
                  }\`}>
                    <div>
                      <span className="text-[10px] font-black uppercase text-slate-400 block mb-1">Kode Perangkat</span>
                      <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{editingAsset.device_code || '-'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-black uppercase text-slate-400 block mb-1">Kode Aset</span>
                      <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{editingAsset.asset_id || '-'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-black uppercase text-slate-400 block mb-1">Merk</span>
                      <span className="font-semibold text-slate-700 dark:text-slate-300">{editingAsset.brand || '-'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-black uppercase text-slate-400 block mb-1">Serial Number</span>
                      <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">{editingAsset.serial_number || '-'}</span>
                    </div>
                    <div className="sm:col-span-2">
                      <span className="text-[10px] font-black uppercase text-slate-400 block mb-1">Spesifikasi</span>
                      <span className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{editingAsset.specs || '-'}</span>
                    </div>
                  </div>

                  <div className={\`p-4 rounded-2xl grid grid-cols-1 sm:grid-cols-2 gap-4 \${
                    isDark ? 'bg-slate-800/40 border border-slate-800' : 'bg-slate-50 border border-slate-100'
                  }\`}>
                    <div>
                      <span className="text-[10px] font-black uppercase text-slate-400 block mb-1">Pengguna / PJ</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200 block">{editingAsset.assigned_to || '-'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-black uppercase text-slate-400 block mb-1">Index / NIK</span>
                      <span className="font-semibold text-slate-700 dark:text-slate-300 block">{editingAsset.user_index || '-'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-black uppercase text-slate-400 block mb-1">Departemen</span>
                      <span className="font-semibold text-slate-700 dark:text-slate-300">{editingAsset.department || '-'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-black uppercase text-slate-400 block mb-1">Status Pengguna</span>
                      <span className="font-semibold text-slate-700 dark:text-slate-300 capitalize">{editingAsset.usage_status || '-'}</span>
                    </div>
                  </div>

                  {(editingAsset.notes || editingAsset.condition) && (
                    <div className={\`p-4 rounded-2xl space-y-3 \${
                      isDark ? 'bg-slate-800/40 border border-slate-800' : 'bg-slate-50 border border-slate-100'
                    }\`}>
                      {editingAsset.condition && (
                        <div>
                          <span className="text-[10px] font-black uppercase text-slate-400 block mb-1">Kondisi Fisik</span>
                          <span className="text-slate-700 dark:text-slate-300">{editingAsset.condition}</span>
                        </div>
                      )}
                      {editingAsset.notes && (
                        <div>
                          <span className="text-[10px] font-black uppercase text-slate-400 block mb-1">Catatan Tambahan</span>
                          <span className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap text-sm">{editingAsset.notes}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <form onSubmit={handleSave} className="p-4 sm:p-6 overflow-y-auto space-y-4 sm:space-y-5">`;
code = code.replace(oldFormStart, newFormStart);

const oldFormEnd = `                </div>
              </form>
            </motion.div>`;
const newFormEnd = `                </div>
              </form>
              )}
            </motion.div>`;

code = code.replace(oldFormEnd, newFormEnd);

fs.writeFileSync('src/components/AssetManagement.tsx', code);
