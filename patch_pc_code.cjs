const fs = require('fs');

let content = fs.readFileSync('src/components/modals/NewTicketModal.tsx', 'utf8');

const regex = /const isPcCodeMatched = React\.useMemo\(\(\) => \{[\s\S]*?\}, \[masterUsers, newTicket\.pc_code\]\);/;

const replacement = `const isPcCodeMatched = React.useMemo(() => {
    if (!newTicket.pc_code || !Array.isArray(masterAssets)) return false;
    const inputCode = (newTicket.pc_code || '').trim().toLowerCase();
    const cleanInput = inputCode.replace(/^[- \\t]+/g, '').trim();
    if (!cleanInput) return false;

    return masterAssets.some(asset => {
      const assetCode = (asset.device_code || asset.asset_id || '').trim().toLowerCase();
      if (!assetCode || assetCode === '-' || assetCode === '(tidak ada)') return false;
      if (assetCode === inputCode) return true;
      const cleanAsset = assetCode.replace(/^[- \\t]+/g, '').trim();
      return cleanAsset === cleanInput || cleanAsset.includes(cleanInput) || cleanInput.includes(cleanAsset);
    });
  }, [masterAssets, newTicket.pc_code]);`;

content = content.replace(regex, replacement);
fs.writeFileSync('src/components/modals/NewTicketModal.tsx', content);
