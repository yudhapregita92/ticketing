const fs = require('fs');

let code = fs.readFileSync('src/components/PublicAssetView.tsx', 'utf8');

code = code.replace("import { getThemeClasses } from '../utils/themeUtils';\n", '');
code = code.replace("const themeClasses = getThemeClasses(isDark);\n", '');

fs.writeFileSync('src/components/PublicAssetView.tsx', code);
