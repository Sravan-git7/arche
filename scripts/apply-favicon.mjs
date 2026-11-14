import fs from 'fs';

const p = JSON.parse(fs.readFileSync('scripts/accurate_divided_paths.json', 'utf-8'));

const faviconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" fill="none">
  <rect width="32" height="32" rx="7" fill="#0c0c0d"/>
  <g transform="translate(3, 6.1) scale(0.26, 0.26)">
    <path fill="#f4f2ed" fill-rule="evenodd" d="${p.pathA}" />
    <path fill="#c8f14f" fill-rule="evenodd" d="${p.pathCLime}" />
    <path fill="#f4f2ed" fill-rule="evenodd" d="${p.pathCIvory}" />
    <circle cx="${p.dot.cx}" cy="${p.dot.cy}" r="${p.dot.r}" fill="#c8f14f" />
  </g>
</svg>`;

fs.writeFileSync('public/favicon.svg', faviconSvg, 'utf-8');
console.log('Successfully updated public/favicon.svg');
