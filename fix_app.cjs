const fs = require('fs');

let code = fs.readFileSync('src/App.tsx', 'utf8');

// Remove existing if (publicAssetId) { ... }
code = code.replace(/  if \(publicAssetId\) \{\n    return <PublicAssetView assetId=\{publicAssetId\} isDark=\{isDark\} \/>;\n  \}\n/g, '');

// Insert it before isPublicJurnalRoute
const newAssetCheck = `  if (publicAssetId) {
    return <PublicAssetView assetId={publicAssetId} isDark={isDark} />;
  }

  if (isPublicJurnalRoute) {`;

code = code.replace('  if (isPublicJurnalRoute) {', newAssetCheck);

fs.writeFileSync('src/App.tsx', code);
