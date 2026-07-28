const fs = require('fs');

let code = fs.readFileSync('src/components/AssetManagement.tsx', 'utf8');

const printLabelsCode = `
  const handlePrintAllLabels = () => {
    if (filteredAssets.length === 0) {
      toast.error('Tidak ada aset untuk dicetak');
      return;
    }

    const printWindow = window.open('', '', 'width=800,height=600');
    if (!printWindow) {
      toast.error("Browser memblokir pop-up. Izinkan pop-up untuk mencetak label.");
      return;
    }
    
    const printContent = \`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Cetak Label Aset</title>
          <style>
            @page { size: A4; margin: 10mm; }
            body { 
              margin: 0; 
              padding: 0;
              font-family: sans-serif;
              background-color: white;
            }
            .grid-container {
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 15px;
              width: 100%;
            }
            .label-box {
              border: 1px dashed #ccc;
              padding: 15px;
              text-align: center;
              display: flex;
              flex-direction: column;
              justify-content: center;
              align-items: center;
              page-break-inside: avoid;
              min-height: 100px;
            }
            .title {
              font-size: 14px;
              font-weight: bold;
              margin-bottom: 4px;
            }
            .jabatan {
              font-size: 11px;
              color: #555;
              margin-bottom: 8px;
            }
            .kode {
              font-size: 14px;
              border: 1px solid black;
              padding: 4px 8px;
              border-radius: 4px;
              display: inline-block;
              font-weight: bold;
            }
          </style>
        </head>
        <body>
          <div class="grid-container">
            \${filteredAssets.map(asset => {
              const matchedUser = masterUsers.find(u => u.full_name === asset.assigned_to);
              const jabatan = matchedUser?.jabatan || '-';
              return \`
              <div class="label-box">
                <div class="title">\${asset.name || asset.category}</div>
                <div class="jabatan">\${jabatan}</div>
                <div class="kode">Kode: \${asset.device_code || asset.asset_id || '-'}</div>
              </div>
              \`;
            }).join('')}
          </div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            }
          </script>
        </body>
      </html>
    \`;

    printWindow.document.open();
    printWindow.document.write(printContent);
    printWindow.document.close();
  };
`;

code = code.replace(
  "const handleExportExcel = () => {",
  printLabelsCode + "\n  const handleExportExcel = () => {"
);

const oldButtons = `<button
            onClick={() => {
              setDeleteAllPassword('');
              setShowDeleteAllModal(true);
            }}
            title="Hapus Semua Data Aset"
            className="px-2.5 sm:px-3 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl text-[11px] sm:text-xs font-bold border flex items-center gap-1.5 whitespace-nowrap transition-all bg-rose-500/10 border-rose-500/30 text-rose-600 hover:bg-rose-500 hover:text-white dark:text-rose-400"
          >
            <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>Hapus Semua</span>
          </button>`;

const newButtons = `<button
            onClick={handlePrintAllLabels}
            title="Cetak Label Aset"
            className={\`px-2.5 sm:px-3 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl text-[11px] sm:text-xs font-bold border flex items-center gap-1.5 whitespace-nowrap transition-all \${
              isDark 
                ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white' 
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900'
            }\`}
          >
            <Printer className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-500" />
            <span>Cetak Label</span>
          </button>
          
          <button
            onClick={() => {
              setDeleteAllPassword('');
              setShowDeleteAllModal(true);
            }}
            title="Hapus Semua Data Aset"
            className="px-2.5 sm:px-3 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl text-[11px] sm:text-xs font-bold border flex items-center gap-1.5 whitespace-nowrap transition-all bg-rose-500/10 border-rose-500/30 text-rose-600 hover:bg-rose-500 hover:text-white dark:text-rose-400"
          >
            <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>Hapus Semua</span>
          </button>`;

code = code.replace(oldButtons, newButtons);

fs.writeFileSync('src/components/AssetManagement.tsx', code);
