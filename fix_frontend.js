const fs = require('fs');

function replaceInFile(path, replacer) {
  let c = fs.readFileSync(path, 'utf8');
  let newC = replacer(c);
  if (c !== newC) {
    fs.writeFileSync(path, newC);
    console.log('Updated', path);
  }
}

// 1. StatsSection.tsx O(N^2)
replaceInFile('src/components/StatsSection.tsx', c => {
  let r = c.replace(/const maxCount = Math\.max\(1, \.\.\.Object\.values\(assetClassCounts\)\); \/\/ max bar based on biggest class\n\s*return \(/g, 'return (');
  r = r.replace(/\]\.map\(\(item, i\) => \{/g, "].map((item, i) => {\n            const maxCount = Math.max(1, ...Object.values(assetClassCounts));");
  
  // Wait, I want to move it OUT of the loop, not into it. Let's do it cleanly:
  r = r.replace(/\]\.map\(\(item, i\) => \{\n\s*const maxCount = Math\.max\(1, \.\.\.Object\.values\(assetClassCounts\)\);/g, "].map((item, i) => {");
  
  // Let's just find the array and put it before.
  const regex = /<div className="grid grid-cols-2 md:grid-cols-4 gap-6">([\s\S]*?)\[\n\s*\{\s*label: "Crypto"/;
  r = r.replace(/\[\n\s*\{\s*label: "Crypto"/, "const maxCount = Math.max(1, ...Object.values(assetClassCounts));\n          return (\n            <>\n              [\n              { label: \"Crypto\"");
  
  return r;
});

// Actually let's just do regex replacement for StatsSection.tsx more precisely
