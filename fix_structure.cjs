const fs = require('fs');

let code = fs.readFileSync('src/components/AssetManagement.tsx', 'utf8');

const target = `        {/* Search and Category Filter */}
        <div className="flex flex-col gap-2.5">
          <div className="flex flex-col sm:flex-row gap-2.5 justify-between">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Cari aset (Kode, Nama, Pengguna)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={\`w-full pl-10 pr-4 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-medium border focus:ring-2 focus:outline-none transition-all \${
                isDark ? 'bg-slate-800 border-slate-700 text-white focus:ring-emerald-500/50' : 'bg-white border-slate-200 text-slate-900 focus:ring-emerald-500/20'
              }\`}
            />
          </div>

          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:w-48">
              <Filter className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className={\`w-full pl-9 pr-7 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-medium border appearance-none focus:ring-2 focus:outline-none transition-all \${
                  isDark ? 'bg-slate-800 border-slate-700 text-white focus:ring-emerald-500/50' : 'bg-white border-slate-200 text-slate-900 focus:ring-emerald-500/20'
                }\`}
              >
                <option value="">Semua Kategori</option>
                {assetCategories.map(c => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>
            
            <div className="relative flex-1 min-w-[140px] sm:w-40">
              <Filter className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
              <select
                value={filterDepartment}
                onChange={(e) => setFilterDepartment(e.target.value)}
                className={\`w-full pl-9 pr-7 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-medium border appearance-none focus:ring-2 focus:outline-none transition-all \${
                  isDark ? 'bg-slate-800 border-slate-700 text-white focus:ring-emerald-500/50' : 'bg-white border-slate-200 text-slate-900 focus:ring-emerald-500/20'
                }\`}
              >
                <option value="">Semua Departemen</option>
                {Array.from(new Set(assets.map(a => a.department).filter(Boolean))).sort().map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
            
            <div className="relative flex-1 min-w-[140px] sm:w-40">
              <Filter className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
              <select
                value={filterUsageStatus}
                onChange={(e) => setFilterUsageStatus(e.target.value)}
                className={\`w-full pl-9 pr-7 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-medium border appearance-none focus:ring-2 focus:outline-none transition-all \${
                  isDark ? 'bg-slate-800 border-slate-700 text-white focus:ring-emerald-500/50' : 'bg-white border-slate-200 text-slate-900 focus:ring-emerald-500/20'
                }\`}
              >
                <option value="">Semua Status Pengguna</option>
                <option value="karyawan">Karyawan</option>
                <option value="shared department">Shared Dept</option>
              </select>
            </div>
            
            <div className="relative flex-1 min-w-[140px] sm:w-40">
              <Filter className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
              <select
                value={filterAssetStatus}
                onChange={(e) => setFilterAssetStatus(e.target.value)}
                className={\`w-full pl-9 pr-7 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-medium border appearance-none focus:ring-2 focus:outline-none transition-all \${
                  isDark ? 'bg-slate-800 border-slate-700 text-white focus:ring-emerald-500/50' : 'bg-white border-slate-200 text-slate-900 focus:ring-emerald-500/20'
                }\`}
              >
                <option value="">Semua Status Aset</option>
                <option value="Active">Aktif</option>
                <option value="Broken">Rusak</option>
                <option value="Lost">Hilang</option>
              </select>
            </div>
          </div>
        </div>`;

const replace = `        {/* Search and Category Filter */}
        <div className="flex flex-col gap-2.5">
          <div className="relative w-full">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Cari aset (Kode, Nama, Pengguna)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={\`w-full pl-10 pr-4 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-medium border focus:ring-2 focus:outline-none transition-all \${
                isDark ? 'bg-slate-800 border-slate-700 text-white focus:ring-emerald-500/50' : 'bg-white border-slate-200 text-slate-900 focus:ring-emerald-500/20'
              }\`}
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[140px]">
              <Filter className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className={\`w-full pl-9 pr-7 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-medium border appearance-none focus:ring-2 focus:outline-none transition-all \${
                  isDark ? 'bg-slate-800 border-slate-700 text-white focus:ring-emerald-500/50' : 'bg-white border-slate-200 text-slate-900 focus:ring-emerald-500/20'
                }\`}
              >
                <option value="">Semua Kategori</option>
                {assetCategories.map(c => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>
            
            <div className="relative flex-1 min-w-[140px]">
              <Filter className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
              <select
                value={filterDepartment}
                onChange={(e) => setFilterDepartment(e.target.value)}
                className={\`w-full pl-9 pr-7 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-medium border appearance-none focus:ring-2 focus:outline-none transition-all \${
                  isDark ? 'bg-slate-800 border-slate-700 text-white focus:ring-emerald-500/50' : 'bg-white border-slate-200 text-slate-900 focus:ring-emerald-500/20'
                }\`}
              >
                <option value="">Semua Departemen</option>
                {Array.from(new Set(assets.map(a => a.department).filter(Boolean))).sort().map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
            
            <div className="relative flex-1 min-w-[140px]">
              <Filter className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
              <select
                value={filterUsageStatus}
                onChange={(e) => setFilterUsageStatus(e.target.value)}
                className={\`w-full pl-9 pr-7 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-medium border appearance-none focus:ring-2 focus:outline-none transition-all \${
                  isDark ? 'bg-slate-800 border-slate-700 text-white focus:ring-emerald-500/50' : 'bg-white border-slate-200 text-slate-900 focus:ring-emerald-500/20'
                }\`}
              >
                <option value="">Semua Status Pengguna</option>
                <option value="karyawan">Karyawan</option>
                <option value="shared department">Shared Dept</option>
              </select>
            </div>
            
            <div className="relative flex-1 min-w-[140px]">
              <Filter className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
              <select
                value={filterAssetStatus}
                onChange={(e) => setFilterAssetStatus(e.target.value)}
                className={\`w-full pl-9 pr-7 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-medium border appearance-none focus:ring-2 focus:outline-none transition-all \${
                  isDark ? 'bg-slate-800 border-slate-700 text-white focus:ring-emerald-500/50' : 'bg-white border-slate-200 text-slate-900 focus:ring-emerald-500/20'
                }\`}
              >
                <option value="">Semua Status Aset</option>
                <option value="Active">Aktif</option>
                <option value="Broken">Rusak</option>
                <option value="Lost">Hilang</option>
              </select>
            </div>
          </div>
        </div>`;

code = code.replace(target, replace);
fs.writeFileSync('src/components/AssetManagement.tsx', code);
