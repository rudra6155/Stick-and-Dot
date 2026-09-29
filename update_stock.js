const fs = require('fs');

function replaceInFile(path, replacer) {
  let c = fs.readFileSync(path, 'utf8');
  let newC = replacer(c);
  if (c !== newC) {
    fs.writeFileSync(path, newC);
    console.log('Updated', path);
  }
}

replaceInFile('src/app/SuperFinanceHub.tsx', c => {
  return c
    .replace(/"All", "Crypto", "Stock"/g, '"All", "Crypto", "US Stock"')
    .replace(/=== "Stock" \|\| activeClass === "US Stock"/g, '=== "US Stock"');
});

replaceInFile('src/app/portfolio/explore/page.tsx', c => {
  return c
    .replace(/"US Stock", "Equity", /g, '"US Stock", ')
    .replace(/Stock: "▸",/g, 'Stock: "▸",\n  "US Stock": "▸",');
});

replaceInFile('src/components/StatsSection.tsx', c => {
  return c.replace(/assetClassCounts\['US Stock'\] \|\| assetClassCounts\['Stock'\]/g, "assetClassCounts['US Stock']");
});

replaceInFile('src/app/portfolio/suggestions/backtest/page.tsx', c => {
  return c
    .replace(/"Stock", "ETF"/g, '"US Stock", "ETF"')
    .replace(/"Stock", "Indian Stock"/g, '"US Stock", "Indian Stock"')
    .replace(/asset_class: "Stock"/g, 'asset_class: "US Stock"');
});

replaceInFile('src/app/portfolio/suggestions/screener/page.tsx', c => {
  return c.replace(/"Stock","ETF"/g, '"US Stock","ETF"');
});

replaceInFile('src/components/PickItem.tsx', c => {
  return c.replace(/Stock:/g, 'Stock:\n  "US Stock": { bg: "rgba(6,182,212,0.08)", text: "text-cyan-400", glow: "rgba(6,182,212,0.3)", border: "border-cyan-500/20" },\n  Stock_OLD:');
});

replaceInFile('src/components/PortfolioRing.tsx', c => {
  return c.replace(/Stock:/g, 'Stock:\n  "US Stock": "#06b6d4",\n  Stock_OLD:');
});

replaceInFile('src/components/AssetCard.tsx', c => {
  return c
    .replace(/Stock: "▸"/g, 'Stock: "▸", "US Stock": "▸"')
    .replace(/Stock: "bg-cyan-500\/10/g, 'Stock: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20", "US Stock": "bg-cyan-500/10');
});

console.log("Done");
