const fs = require('fs');

function updateFile(file) {
  let code = fs.readFileSync(file, 'utf8');

  code = code.replace(/,\s*'Kode Piranti':\s*'KMP-001'/g, '');
  code = code.replace(/,\s*'Kode Piranti':\s*'LPT-002'/g, '');
  code = code.replace(/,\s*'Kode Piranti':\s*'-'/g, '');
  code = code.replace(/,\s*'Kode Piranti':\s*user\.kode_piranti \|\|\s*'-'/g, '');
  
  // also clean up any trailing commas if there were any, but in the format it was:
  // 'Jenis Piranti': 'Komputer',
  // 'Kode Piranti': 'KMP-001',
  // 'Email': 'budi@example.com',
  // we can just replace the whole line including the newline
  
  code = code.replace(/[ \t]*'Kode Piranti':[^\n]*\n/g, '');

  fs.writeFileSync(file, code);
}

updateFile('src/components/modals/SettingsModal.tsx');
updateFile('src/components/MasterUserManagement.tsx');
