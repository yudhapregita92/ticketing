const fs = require('fs');

let code = fs.readFileSync('src/components/AssetManagement.tsx', 'utf8');

// We'll extract the printing logic into a function called printAssets(assetsList)
const printAssetsFunc = `  const printAssets = (assetsToPrint: IAsset[]) => {
    if (assetsToPrint.length === 0) {
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
              padding: 12px;
              display: flex;
              flex-direction: row;
              justify-content: space-between;
              align-items: center;
              page-break-inside: avoid;
              min-height: 90px;
              border-radius: 8px;
            }
            .label-content {
              display: flex;
              flex-direction: column;
              justify-content: center;
              align-items: flex-start;
              flex: 1;
              padding-right: 10px;
            }
            .title {
              font-size: 13px;
              font-weight: bold;
              margin-bottom: 4px;
              color: #111;
            }
            .jabatan {
              font-size: 11px;
              color: #555;
              margin-bottom: 2px;
            }
            .departemen {
              font-size: 11px;
              color: #555;
              margin-bottom: 8px;
            }
            .kode {
              font-size: 12px;
              border: 1px solid #333;
              padding: 3px 6px;
              border-radius: 4px;
              display: inline-block;
              font-weight: bold;
            }
            .qr-container {
              width: 70px;
              height: 70px;
              flex-shrink: 0;
              border: 1px solid #eee;
              padding: 2px;
              background: white;
              border-radius: 6px;
            }
            .qr-container img {
              width: 100%;
              height: 100%;
              display: block;
              object-fit: contain;
            }
          </style>
        </head>
        <body>
          <div class="grid-container">
            \${assetsToPrint.map(asset => {
              const matchedUser = masterUsers.find(u => u.full_name === asset.assigned_to);
              const jabatan = matchedUser?.jabatan || '-';
              const departemen = asset.department || '-';
              
              // Generate QR URL pointing to the public asset detail page
              const assetId = asset.device_code || asset.asset_id || asset.id;
              const qrData = \`\${window.location.origin}?asset=\${assetId}\`;
              const qrUrl = \`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=\${encodeURIComponent(qrData)}\`;
              
              return \`
              <div class="label-box">
                <div class="label-content">
                  <div class="title">\${asset.name || asset.category}</div>
                  <div class="jabatan">\${jabatan}</div>
                  <div class="departemen">\${departemen}</div>
                  <div class="kode">\${asset.device_code || asset.asset_id || '-'}</div>
                </div>
                <div class="qr-container">
                  <img src="\${qrUrl}" alt="QR" />
                </div>
              </div>
              \`;
            }).join('')}
          </div>
          <script>
            window.onload = function() {
              // Wait a bit for images to load before printing
              setTimeout(function() {
                window.print();
                setTimeout(function() { window.close(); }, 500);
              }, 1000);
            }
          </script>
        </body>
      </html>
    \`;

    printWindow.document.open();
    printWindow.document.write(printContent);
    printWindow.document.close();
  };

  const handlePrintAllLabels = () => {
    printAssets(filteredAssets);
  };
  
  const handlePrintSingleLabel = (asset: IAsset) => {
    printAssets([asset]);
  };
`;

const regexPrintAll = /  const handlePrintAllLabels = \(\) => \{[\s\S]*?printWindow\.document\.close\(\);\n  \};/g;

code = code.replace(regexPrintAll, printAssetsFunc);

fs.writeFileSync('src/components/AssetManagement.tsx', code);
