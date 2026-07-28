const fs = require('fs');

let code = fs.readFileSync('src/components/AssetManagement.tsx', 'utf8');

const oldQrData = `              // Generate QR Data string
              const qrData = \`Aset: \${asset.name || asset.category}\\nKode: \${asset.device_code || asset.asset_id || '-'}\\nPengguna: \${asset.assigned_to || '-'}\\nJabatan: \${jabatan}\`;
              const qrUrl = \`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=\${encodeURIComponent(qrData)}\`;`;

const newQrData = `              // Generate QR URL pointing to the public asset detail page
              const assetId = asset.device_code || asset.asset_id || asset.id;
              const qrData = \`\${window.location.origin}?asset=\${assetId}\`;
              const qrUrl = \`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=\${encodeURIComponent(qrData)}\`;`;

code = code.replace(oldQrData, newQrData);

fs.writeFileSync('src/components/AssetManagement.tsx', code);
