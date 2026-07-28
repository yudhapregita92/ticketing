const fs = require('fs');

let code = fs.readFileSync('src/components/AssetManagement.tsx', 'utf8');

const targetCSS = `            .koperasi-text {
              font-size: 7.5px;
              text-align: center;
              color: #333;
              font-weight: 700;
              line-height: 1.2;
              max-width: 70px;
            }`;

const replaceCSS = `            .koperasi-text {
              font-size: 6.5px;
              text-align: center;
              color: #333;
              font-weight: 800;
              line-height: 1.5;
              width: 100%;
              margin-top: 2px;
              white-space: nowrap;
            }`;

code = code.replace(targetCSS, replaceCSS);
fs.writeFileSync('src/components/AssetManagement.tsx', code);
