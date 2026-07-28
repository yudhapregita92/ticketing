const fs = require('fs');
let code = fs.readFileSync('src/components/AssetManagement.tsx', 'utf8');

// 1. Add states
code = code.replace(
  "const [filterCategory, setFilterCategory] = useState('');",
  "const [filterCategory, setFilterCategory] = useState('');\n  const [filterDepartment, setFilterDepartment] = useState('');\n  const [filterUsageStatus, setFilterUsageStatus] = useState('');\n  const [filterAssetStatus, setFilterAssetStatus] = useState('');"
);

// 2. Update pagination effect
code = code.replace(
  "  }, [searchQuery, filterCategory]);",
  "  }, [searchQuery, filterCategory, filterDepartment, filterUsageStatus, filterAssetStatus]);"
);

// 3. Update filtering logic
const oldFilterLogic = `  const filteredAssets = assets.filter(asset => {
    const matchesSearch = asset.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          asset.asset_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (asset.device_code && asset.device_code.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = filterCategory ? asset.category === filterCategory : true;
    
    return matchesSearch && matchesCategory;
  });`;

const newFilterLogic = `  const filteredAssets = assets.filter(asset => {
    const query = searchQuery.toLowerCase();
    const matchesSearch = asset.name.toLowerCase().includes(query) || 
                          asset.asset_id.toLowerCase().includes(query) ||
                          (asset.device_code && asset.device_code.toLowerCase().includes(query)) ||
                          (asset.assigned_to && asset.assigned_to.toLowerCase().includes(query));
    const matchesCategory = filterCategory ? asset.category === filterCategory : true;
    const matchesDepartment = filterDepartment ? asset.department === filterDepartment : true;
    const matchesUsageStatus = filterUsageStatus ? asset.usage_status === filterUsageStatus : true;
    const matchesAssetStatus = filterAssetStatus ? asset.status === filterAssetStatus : true;
    
    return matchesSearch && matchesCategory && matchesDepartment && matchesUsageStatus && matchesAssetStatus;
  });`;

code = code.replace(oldFilterLogic, newFilterLogic);

// 4. Update UI to add more selects
const oldHeader = `        {/* Search and Category Filter */}
        <div className="flex flex-col sm:flex-row gap-2.5 sm:items-center justify-between">
          <div className="relative flex-1">`;

const newHeader = `        {/* Search and Category Filter */}
        <div className="flex flex-col gap-2.5">
          <div className="flex flex-col sm:flex-row gap-2.5 justify-between">
          <div className="relative flex-1">`;

code = code.replace(oldHeader, newHeader);

const oldSearchEnd = `          </div>
          
          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:w-48">`;

const newSearchEnd = `          </div>
          <div className="flex items-center gap-2">
            {/* Mobile Primary Add Button */}
            <button
              onClick={() => {
                resetForm();
              setEditingAsset(null);
              setIsViewMode(false);
              setShowModal(true);
              }}
              style={{ backgroundColor: primaryColor }}
              className="sm:hidden px-3 py-2 rounded-xl text-white text-xs font-bold flex items-center gap-1.5 whitespace-nowrap shadow-md hover:brightness-110 active:scale-95 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah</span>
            </button>
          </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[140px] sm:w-48">`;

code = code.replace(oldSearchEnd, newSearchEnd);

const oldSelectCategory = `              </select>
            </div>

            {/* Mobile Primary Add Button */}
            <button
              onClick={() => {
                resetForm();
              setEditingAsset(null);
              setIsViewMode(false);
              setShowModal(true);
              }}
              style={{ backgroundColor: primaryColor }}
              className="sm:hidden px-3 py-2 rounded-xl text-white text-xs font-bold flex items-center gap-1.5 whitespace-nowrap shadow-md hover:brightness-110 active:scale-95 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah</span>
            </button>
          </div>
        </div>`;

const newSelectCategory = `              </select>
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

code = code.replace(oldSelectCategory, newSelectCategory);

fs.writeFileSync('src/components/AssetManagement.tsx', code);
