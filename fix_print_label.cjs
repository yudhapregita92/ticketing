const fs = require('fs');

let code = fs.readFileSync('src/components/AssetManagement.tsx', 'utf8');

const targetCSS = `            .qr-container {
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
            }`;

const replaceCSS = `            .qr-wrapper {
              display: flex;
              flex-direction: column;
              align-items: center;
              flex-shrink: 0;
            }
            .qr-container {
              width: 66px;
              height: 66px;
              border: 1px solid #eee;
              padding: 2px;
              background: white;
              border-radius: 6px;
              margin-bottom: 4px;
            }
            .qr-container img {
              width: 100%;
              height: 100%;
              display: block;
              object-fit: contain;
            }
            .koperasi-text {
              font-size: 7.5px;
              text-align: center;
              color: #333;
              font-weight: 700;
              line-height: 1.2;
              max-width: 70px;
            }`;

code = code.replace(targetCSS, replaceCSS);

const targetHTML = `                <div class="qr-container">
                  <img src="\${qrUrl}" alt="QR" />
                </div>`;

const replaceHTML = `                <div class="qr-wrapper">
                  <div class="qr-container">
                    <img src="\${qrUrl}" alt="QR" />
                  </div>
                  <div class="koperasi-text">Koperasi Konsumen<br/>Karyawan Dwi Karya</div>
                </div>`;

code = code.replace(targetHTML, replaceHTML);

fs.writeFileSync('src/components/AssetManagement.tsx', code);
