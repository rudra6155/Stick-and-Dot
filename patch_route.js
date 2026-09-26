const fs = require('fs');

const file = 'src/app/api/odds/route.ts';
let code = fs.readFileSync(file, 'utf8');

const sportsExtra = `
    // Extra Sports
    ["New Zealand", "South Africa", "Rugby World Cup", "Tonight"],
    ["France", "Ireland", "Six Nations", "Tonight"],
    ["PSG Handball", "Barca", "EHF Champions League", "Tonight"],
    ["Kiel", "Veszprem", "Handball Bundesliga", "Tonight"],
    ["Trentino", "Civitanova", "Volleyball Serie A", "Tonight"],
    ["Zaksa", "Jastrzebski", "PlusLiga", "Tonight"],
    ["Ma Long", "Fan Zhendong", "Table Tennis World Cup", "Tonight"],
    ["Sun Yingsha", "Chen Meng", "Table Tennis Finals", "Tonight"],
    ["Axelsen", "Momota", "All England Open", "Tonight"],
    ["Tai Tzu Ying", "An Se Young", "Badminton Finals", "Tonight"],
    ["T1", "JDG", "LoL Worlds", "Tonight"],
    ["G2", "Fnatic", "LEC", "Tonight"],
    ["NAVI", "Vitality", "CS2 Major", "Tonight"],
    ["FaZe", "MOUZ", "IEM Katowice", "Tonight"],
    ["Team Spirit", "LGD", "Dota 2 TI", "Tonight"],
    ["Liquid", "Gaimin Gladiators", "Dota 2 Major", "Tonight"],
    ["Sentinels", "LOUD", "Valorant Champions", "Tonight"],
    ["Paper Rex", "DRX", "VCT Pacific", "Tonight"],
    ["Flightline", "Life Is Good", "Breeders Cup", "Tonight"],
    ["Equinox", "Liberty Island", "Japan Cup", "Tonight"],
    ["Marchand", "Milak", "World Aquatics", "Tonight"],
    ["Ledecky", "Titmus", "Olympic Swimming", "Tonight"],
    ["Lyles", "Knighton", "Diamond League 200m", "Tonight"],
    ["Duplantis", "Kendricks", "Pole Vault Final", "Tonight"],
    ["Kipchoge", "Kiptum", "Berlin Marathon", "Tonight"],
    ["Wranglers", "Rodeo", "PBR World Finals", "Tonight"],
    ["O'Sullivan", "Trump", "Snooker World C'ship", "Tonight"],
    ["MVG", "Smith", "PDC Darts", "Tonight"],
    ["Team USA", "Team Europe", "Ryder Cup", "Tonight"],
    ["Australia", "England", "Ashes", "Tonight"],
`;

const startupExtra = `
    // Extra Startups
    { title: "CoreWeave reaches $50B valuation", probYes: 55, pool: 5000000, date: "2026-12-31" },
    { title: "Scale AI IPOs at $30B+", probYes: 45, pool: 6000000, date: "2027-06-30" },
    { title: "Grok launches standalone app", probYes: 70, pool: 4000000, date: "2026-12-31" },
    { title: "IonQ achieves 1000 algorithmic qubits", probYes: 30, pool: 3500000, date: "2027-12-31" },
    { title: "Rigetti computing gets acquired", probYes: 40, pool: 2500000, date: "2026-12-31" },
    { title: "Waymo launches in Europe", probYes: 35, pool: 7000000, date: "2027-12-31" },
    { title: "Cruise resumes full operations in California", probYes: 60, pool: 4500000, date: "2026-12-31" },
    { title: "Zoox launches public robotaxi service", probYes: 50, pool: 3800000, date: "2026-12-31" },
    { title: "Relativity Space launches Terran R", probYes: 48, pool: 5500000, date: "2026-12-31" },
    { title: "Axiom Space deploys first commercial module", probYes: 42, pool: 6200000, date: "2026-12-31" },
    { title: "Ginkgo Bioworks achieves profitability", probYes: 25, pool: 4100000, date: "2027-12-31" },
    { title: "Colossal Biosciences de-extincts the Dodo", probYes: 15, pool: 8000000, date: "2027-12-31" },
    { title: "Northvolt IPOs in Europe", probYes: 55, pool: 5200000, date: "2026-12-31" },
    { title: "Redwood Materials recycles 1M tons of batteries", probYes: 65, pool: 3400000, date: "2027-06-30" },
    { title: "Epic Games launches native Web3 integration", probYes: 35, pool: 4800000, date: "2026-12-31" },
    { title: "Animoca Brands reaches $10B valuation again", probYes: 40, pool: 3100000, date: "2027-12-31" },
    { title: "Sorare signs deal with NFL", probYes: 50, pool: 2900000, date: "2026-12-31" },
    { title: "Magic Leap gets acquired by Apple or Meta", probYes: 20, pool: 7500000, date: "2027-12-31" },
    { title: "Anduril goes public", probYes: 60, pool: 8500000, date: "2027-12-31" },
    { title: "Shield AI reaches $10B valuation", probYes: 55, pool: 4200000, date: "2026-12-31" },
`;

const cryptoExtra = `
    // Extra Crypto
    { title: "Aave V4 reaches $20B TVL", probYes: 55, pool: 4500000, date: "2026-12-31" },
    { title: "MakerDAO transitions fully to Endgame", probYes: 60, pool: 3800000, date: "2026-12-31" },
    { title: "Blur overtakes OpenSea in all-time volume", probYes: 70, pool: 5200000, date: "2026-12-31" },
    { title: "Yuga Labs launches Otherside game fully", probYes: 45, pool: 6100000, date: "2026-12-31" },
    { title: "LayerZero processes 1B messages", probYes: 65, pool: 4900000, date: "2026-12-31" },
    { title: "Wormhole introduces native token utility", probYes: 80, pool: 3200000, date: "2026-12-31" },
    { title: "US passes comprehensive stablecoin bill", probYes: 50, pool: 12000000, date: "2026-12-31" },
    { title: "USDC market cap overtakes USDT", probYes: 25, pool: 15000000, date: "2027-12-31" },
    { title: "Tether holds $10B in Bitcoin reserves", probYes: 60, pool: 8500000, date: "2026-12-31" },
    { title: "Bitcoin network hashrate crosses 1000 EH/s", probYes: 75, pool: 7400000, date: "2026-12-31" },
    { title: "First nation-state publicly mines Bitcoin", probYes: 40, pool: 9200000, date: "2026-12-31" },
    { title: "Ethereum gas fees average under 1 gwei", probYes: 35, pool: 5500000, date: "2026-12-31" },
    { title: "EigenLayer TVL reaches $50B", probYes: 45, pool: 6800000, date: "2026-12-31" },
    { title: "Celestia becomes top DA layer by market share", probYes: 55, pool: 4700000, date: "2026-12-31" },
    { title: "Coinbase launches its own L1 blockchain", probYes: 20, pool: 8100000, date: "2027-12-31" },
`;

const equityExtra = `
    // Extra Equities
    { title: "Nubank becomes largest bank in LATAM by market cap", probYes: 45, pool: 6500000, date: "2027-12-31" },
    { title: "Grab achieves full-year profitability", probYes: 60, pool: 4800000, date: "2026-12-31" },
    { title: "MercadoLibre stock crosses $2500", probYes: 50, pool: 5200000, date: "2026-12-31" },
    { title: "Energy sector outperforms tech in 2026", probYes: 35, pool: 8900000, date: "2026-12-31" },
    { title: "Defense sector ETF (ITA) hits new all-time high", probYes: 70, pool: 7100000, date: "2026-12-31" },
    { title: "Federal Reserve cuts rates to 2.5%", probYes: 40, pool: 14000000, date: "2026-12-31" },
    { title: "ECB cuts rates to 1.5%", probYes: 45, pool: 11000000, date: "2026-12-31" },
    { title: "Bank of Japan raises rates above 1%", probYes: 30, pool: 9500000, date: "2026-12-31" },
    { title: "Gold breaks $3500 per ounce", probYes: 55, pool: 12500000, date: "2026-12-31" },
    { title: "Crude oil crosses $120 per barrel", probYes: 25, pool: 15000000, date: "2026-12-31" },
    { title: "Copper hits $6 per pound", probYes: 60, pool: 8200000, date: "2026-12-31" },
    { title: "Uranium spot price crosses $150", probYes: 50, pool: 6800000, date: "2026-12-31" },
    { title: "VIX spikes above 50", probYes: 35, pool: 18000000, date: "2026-12-31" },
    { title: "US 10-year yield falls below 3%", probYes: 40, pool: 16000000, date: "2026-12-31" },
    { title: "Dollar Index (DXY) falls below 95", probYes: 30, pool: 13500000, date: "2026-12-31" },
`;

code = code.replace(/(\/\/ Extras\\s*\\["Leverkusen", "Atletico Madrid", "Europa League", "Tonight"\\],\\s*)/, "$1" + sportsExtra);
code = code.replace(/(title: "BharatPe achieves 100M merchant payment network", probYes: 58, pool: 3000000, date: "2026-12-31" \\},\\s*)/, "$1" + startupExtra);
code = code.replace(/(title: "Toncoin becomes Telegram's primary payment layer", probYes: 62, pool: 7400000, date: "2026-12-31" \\},\\s*)/, "$1" + cryptoExtra);
code = code.replace(/(title: "Infosys wins \\$5B\\+ TCV contract in H2 FY27", probYes: 38, pool: 3600000, date: "2027-03-31" \\},\\s*)/, "$1" + equityExtra);

const oldLogic = \`  // Enforce 75% live / 25% mock ratio as requested by user
  if (allSportsEvents.length > 0) {
    const targetMockCount = Math.floor(allSportsEvents.length / 3); // so mock is ~25% of total
    
    const allMock = [...mockData.filter(m => m.category === "Sports"), ...nonSportsMock];
    
    // Deterministic shuffle of mock data based on today's date
    const rng = seededRandom(today + "ratio");
    const shuffledMock = [...allMock].sort(() => rng() - 0.5);
    
    const selectedMock = shuffledMock.slice(0, Math.max(targetMockCount, 20)); // At least 20 mocks
    
    finalEvents = [...allSportsEvents, ...selectedMock];
  } else {
    // Fallback if APIs completely fail
    finalEvents = [...mockData.filter(m => m.category === "Sports"), ...nonSportsMock];
  }\`;

const newLogic = \`  // Enforce 75% live / 25% mock ratio as requested by user
  if (allSportsEvents.length > 0) {
    const targetMockCount = Math.ceil(allSportsEvents.length / 3); // so mock is ~25% of total
    
    const allMock = [...mockData.filter(m => m.category === "Sports"), ...nonSportsMock];
    
    // Deterministic shuffle of mock data based on today's date
    const rng = seededRandom(today + "ratio");
    const shuffledMock = [...allMock];
    for (let i = shuffledMock.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      const temp = shuffledMock[i];
      shuffledMock[i] = shuffledMock[j];
      shuffledMock[j] = temp;
    }
    
    const selectedMock = shuffledMock.slice(0, targetMockCount);
    
    finalEvents = [...allSportsEvents, ...selectedMock];
  } else {
    // Fallback if APIs completely fail
    finalEvents = [...mockData.filter(m => m.category === "Sports"), ...nonSportsMock];
  }\`;

code = code.replace(oldLogic, newLogic);

fs.writeFileSync(file, code);
console.log('Patched route.ts');
