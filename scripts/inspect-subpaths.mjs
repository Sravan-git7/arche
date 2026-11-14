import fs from 'fs';

const data = JSON.parse(fs.readFileSync('scripts/marching_ac_paths.json', 'utf-8'));

console.log('Loops A count:', data.loopsACount);
console.log('Loops C Lime count:', data.loopsCLimeCount);
console.log('Loops C Ivory count:', data.loopsCIvoryCount);

// Let's inspect the subpaths in pathA
const aSubpaths = data.pathA.split('M ').filter(Boolean).map(s => 'M ' + s.trim());
console.log('\nSubpaths in pathA:');
aSubpaths.forEach((sp, idx) => {
  console.log(`Subpath A[${idx}]: length=${sp.length}`);
});

const cLimeSubpaths = data.pathCLime.split('M ').filter(Boolean).map(s => 'M ' + s.trim());
console.log('\nSubpaths in pathCLime:');
cLimeSubpaths.forEach((sp, idx) => {
  console.log(`Subpath C Lime[${idx}]: length=${sp.length}`);
});

const cIvorySubpaths = data.pathCIvory.split('M ').filter(Boolean).map(s => 'M ' + s.trim());
console.log('\nSubpaths in pathCIvory:');
cIvorySubpaths.forEach((sp, idx) => {
  console.log(`Subpath C Ivory[${idx}]: length=${sp.length}`);
});
