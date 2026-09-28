const fs = require('fs');

function getFiles(dir, files = []) {
  fs.readdirSync(dir).forEach(file => {
    const name = dir + '/' + file;
    if (fs.statSync(name).isDirectory()) {
      getFiles(name, files);
    } else if (name.endsWith('route.ts')) {
      files.push(name);
    }
  });
  return files;
}

getFiles('src/app/api').forEach(f => {
  let c = fs.readFileSync(f, 'utf8');
  if (!c.includes('force-dynamic')) {
    fs.writeFileSync(f, "export const dynamic = 'force-dynamic';\n" + c);
  }
});
console.log('Done');
