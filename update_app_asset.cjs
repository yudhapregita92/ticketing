const fs = require('fs');

let code = fs.readFileSync('src/App.tsx', 'utf8');

if (!code.includes('import { PublicAssetView }')) {
  code = code.replace(
    "import { ReportPerangkat } from './components/ReportPerangkat';",
    "import { ReportPerangkat } from './components/ReportPerangkat';\nimport { PublicAssetView } from './components/PublicAssetView';"
  );
}

const urlParamsCode = `
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const publicAssetId = searchParams.get('asset');
`;

if (!code.includes("const publicAssetId = searchParams.get('asset');")) {
  code = code.replace(
    "const queryClient = useQueryClient();",
    "const queryClient = useQueryClient();\n" + urlParamsCode
  );
}

const renderPublicCode = `
  if (publicAssetId) {
    return <PublicAssetView assetId={publicAssetId} isDark={isDark} />;
  }
`;

if (!code.includes("if (publicAssetId) {")) {
  code = code.replace(
    "return (",
    renderPublicCode + "\n  return ("
  );
}

fs.writeFileSync('src/App.tsx', code);
