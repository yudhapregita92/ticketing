const fs = require('fs');

let code = fs.readFileSync('src/components/PublicAssetView.tsx', 'utf8');

const oldIcon = `const getCategoryIcon = (category: string) => {
  const c = category.toLowerCase();`;

const newIcon = `const getCategoryIcon = (category: string = '') => {
  if (!category) return <Package className="w-5 h-5" />;
  const c = String(category).toLowerCase();`;

code = code.replace(oldIcon, newIcon);

fs.writeFileSync('src/components/PublicAssetView.tsx', code);
