const fs = require('fs');

let code = fs.readFileSync('src/components/MasterUserManagement.tsx', 'utf8');

// State definitions
code = code.replace(/const \[masterUserKodePiranti, setMasterUserKodePiranti\] = React\.useState\(''\);\n/, '');

// Search filter
code = code.replace(/\|\|\s*\(user\.kode_piranti \|\| ''\)\.toLowerCase\(\)\.includes\(term\)/, '');

// Submit form
code = code.replace(/kode_piranti:\s*masterUserKodePiranti,/g, '');

// Clear form
code = code.replace(/setMasterUserKodePiranti\(''\);\n/, '');

// Editing form
code = code.replace(/setMasterUserKodePiranti\(user\.kode_piranti && user\.kode_piranti !== '-' \? user\.kode_piranti : ''\);\n/, '');

// Table render
const oldTableBlock = `{user.jenis_piranti && user.jenis_piranti !== '(Tidak Ada)' ? (
                        <div className="flex flex-col">
                          <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">{user.jenis_piranti}</span>
                          <span className="text-[10px] text-slate-400 dark:text-slate-500">Kode: {user.kode_piranti || '-'}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">-</span>
                      )}`;

const newTableBlock = `{user.jenis_piranti && user.jenis_piranti !== '(Tidak Ada)' ? (
                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">{user.jenis_piranti}</span>
                      ) : (
                        <span className="text-xs text-slate-400">-</span>
                      )}`;
code = code.replace(oldTableBlock, newTableBlock);

fs.writeFileSync('src/components/MasterUserManagement.tsx', code);
