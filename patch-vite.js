const fs = require('fs');
let content = fs.readFileSync('vite.config.ts', 'utf8');
content = content.replace('server: {', 'build: { outDir: "dist" },\n    server: {');
fs.writeFileSync('vite.config.ts', content);
