const fs = require('fs');

let code = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

const targetCards = `      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className={cardClass}>
          <div className="flex items-center justify-between mb-4">
            <div className={\`w-8 h-8 rounded-lg flex items-center justify-center bg-blue-500/10 text-blue-500\`}>
              <Ticket className="w-4 h-4" />
            </div>
          </div>
          <div className={\`text-4xl font-black mb-1 \${textMain}\`}>{stats.total}</div>
          <div className={\`text-xs font-medium \${textMuted}\`}>Total Tiket</div>
        </div>
        
        <div className={cardClass}>
          <div className="flex items-center justify-between mb-4">
            <div className={\`w-8 h-8 rounded-lg flex items-center justify-center bg-orange-500/10 text-orange-500\`}>
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className={\`text-4xl font-black mb-1 \${textMain}\`}>{stats.open}</div>
          <div className={\`text-xs font-medium \${textMuted}\`}>Tiket Open</div>
        </div>

        <div className={cardClass}>
          <div className="flex items-center justify-between mb-4">
            <div className={\`w-8 h-8 rounded-lg flex items-center justify-center bg-emerald-500/10 text-emerald-500\`}>
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className={\`text-4xl font-black mb-1 \${textMain}\`}>{stats.resolved}</div>
          <div className={\`text-xs font-medium \${textMuted}\`}>Resolved</div>
        </div>

        <div className={cardClass}>
          <div className="flex items-center justify-between mb-4">
            <div className={\`w-8 h-8 rounded-lg flex items-center justify-center bg-rose-500/10 text-rose-500\`}>
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className={\`text-4xl font-black mb-1 \${textMain}\`}>{stats.overdue}</div>
          <div className={\`text-xs font-medium \${textMuted}\`}>Overdue</div>
        </div>
      </div>`;

const replaceCards = `      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        <div className={\`p-3 sm:p-4 rounded-2xl border shadow-sm flex items-center justify-between \${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}\`}>
          <div>
            <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-slate-400">Total Tiket</p>
            <h3 className="text-xl sm:text-2xl font-black mt-0.5 sm:mt-1 text-blue-600 dark:text-blue-400">{stats.total}</h3>
          </div>
          <div className="p-2 sm:p-3 rounded-2xl bg-blue-500/10 text-blue-500">
            <Ticket className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
        </div>

        <div className={\`p-3 sm:p-4 rounded-2xl border shadow-sm flex items-center justify-between \${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}\`}>
          <div>
            <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-slate-400">Tiket Open</p>
            <h3 className="text-xl sm:text-2xl font-black mt-0.5 sm:mt-1 text-orange-600 dark:text-orange-400">{stats.open}</h3>
          </div>
          <div className="p-2 sm:p-3 rounded-2xl bg-orange-500/10 text-orange-500">
            <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
        </div>

        <div className={\`p-3 sm:p-4 rounded-2xl border shadow-sm flex items-center justify-between \${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}\`}>
          <div>
            <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-slate-400">Resolved</p>
            <h3 className="text-xl sm:text-2xl font-black mt-0.5 sm:mt-1 text-emerald-600 dark:text-emerald-400">{stats.resolved}</h3>
          </div>
          <div className="p-2 sm:p-3 rounded-2xl bg-emerald-500/10 text-emerald-500">
            <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
        </div>

        <div className={\`p-3 sm:p-4 rounded-2xl border shadow-sm flex items-center justify-between \${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}\`}>
          <div>
            <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-slate-400">Overdue</p>
            <h3 className="text-xl sm:text-2xl font-black mt-0.5 sm:mt-1 text-rose-600 dark:text-rose-400">{stats.overdue}</h3>
          </div>
          <div className="p-2 sm:p-3 rounded-2xl bg-rose-500/10 text-rose-500">
            <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
        </div>
      </div>`;

code = code.replace(targetCards, replaceCards);

fs.writeFileSync('src/components/AdminDashboard.tsx', code);
