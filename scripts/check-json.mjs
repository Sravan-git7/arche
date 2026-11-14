import fs from 'fs';

const p = JSON.parse(fs.readFileSync('scripts/accurate_production_paths.json', 'utf-8'));
console.log('Keys in JSON:', Object.keys(p));
console.log('pathA length:', p.pathA?.length);
console.log('pathCLime length:', p.pathCLime?.length);
console.log('pathCIvory length:', p.pathCIvory?.length);
console.log('dot:', p.dot);
