const fs = require('fs');

let code = fs.readFileSync('src/components/modals/SettingsModal.tsx', 'utf8');

// State definitions
code = code.replace(/const \[masterUserKodePiranti, setMasterUserKodePiranti\] = React\.useState\(''\);\n/, '');

// Search filter
code = code.replace(/\|\|\s*\(user\.kode_piranti \|\| ''\)\.toLowerCase\(\)\.includes\(term\)/, '');

// Submit form
code = code.replace(/kode_piranti:\s*masterUserKodePiranti,/g, '');

// Clear form
code = code.replace(/setMasterUserKodePiranti\(''\);\n/g, '');

// Editing form
code = code.replace(/setMasterUserKodePiranti\(user\.kode_piranti && user\.kode_piranti !== '-' \? user\.kode_piranti : ''\);\n/, '');

// Note: SettingsModal.tsx has label printing functionality that uses `user.kode_piranti`. 
// I will keep the label printing using `kode_piranti` if it exists in the database, because we are removing the field from being *managed* (created/edited), but existing labels might still need it. Wait, the user said "hilangkan kode piranti di master data user".

fs.writeFileSync('src/components/modals/SettingsModal.tsx', code);
