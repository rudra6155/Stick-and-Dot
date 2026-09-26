import { NextResponse } from "next/server";
import { PredictionEvent } from "@/utils/sportsData";

export const dynamic = "force-dynamic";

// API-Sports fixtures are date-scoped. `date` params below are derived in this timezone
// (rather than the server's UTC clock) so "today"/"tomorrow" line up with the target
// audience's local day instead of silently drifting a day around UTC midnight.
const FIXTURES_TIMEZONE = process.env.ODDS_TIMEZONE || "America/New_York";

function getDateStringInTimezone(date: Date, timeZone: string): string {
  // en-CA formats as YYYY-MM-DD, which matches what the API-Sports `date` param expects.
  return new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
}

// Clamp a probability (0-100) to a safe range before deriving implied odds so that
// 100 / prob never divides by (or near) zero and returns Infinity.
function clampProbability(prob: number): number {
  if (!Number.isFinite(prob)) return 50;
  return Math.min(99, Math.max(1, prob));
}

function probToOdds(prob: number): number {
  return Number((100 / clampProbability(prob)).toFixed(2));
}

// ── Deterministic seeded pseudo-random number generator ──────────────────
// Replaces Math.random() so that odds, pool sizes, and probabilities are
// STABLE per event per calendar day. Users won't see numbers jump on refresh.
// Uses a simple xorshift32 hash over the seed string + today's date.
function seededRandom(seed: string): () => number {
  const dayKey = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const combined = seed + dayKey;
  // djb2 hash
  let hash = 5381;
  for (let i = 0; i < combined.length; i++) {
    hash = ((hash << 5) + hash) ^ combined.charCodeAt(i);
    hash = hash >>> 0; // keep unsigned 32-bit
  }
  // xorshift32
  return () => {
    hash ^= hash << 13;
    hash ^= hash >> 17;
    hash ^= hash << 5;
    hash = hash >>> 0;
    return hash / 0xFFFFFFFF;
  };
}

// ── Pool size from seed — stable per event per day ───────────────────────
function seededPool(seed: string, min: number, max: number): number {
  const rng = seededRandom(seed);
  return Math.floor(rng() * (max - min) + min);
}

// Derives a proper 3-way (Home / Draw / Away) probability split instead of forcing
// Home + Away to sum to 100%, which artificially strips out Draw's share of probability.
function computeMatchProbabilities(homeGoals: number, awayGoals: number, elapsed: number, isLive: boolean, fixtureSeed?: string) {
  const goalDiff = homeGoals - awayGoals;
  const timeProgress = Math.min(elapsed, 90) / 90; // 0 -> 1 as the match progresses

  if (!isLive) {
    // Pre-match: deterministic home advantage using fixture seed for stability.
    const rng = seededRandom(fixtureSeed || 'default-fixture');
    const homeProb = 38 + Math.floor(rng() * 14); // 38-51, stable per fixture per day
    const drawProb = 24 + Math.floor(rng() * 6);  // 24-29
    const awayProb = 100 - homeProb - drawProb;
    return { homeProb, drawProb, awayProb };
  }

  // Live: draw probability shrinks as the score gap widens and the clock runs down.
  const drawProb = Math.max(6, 30 - Math.abs(goalDiff) * 10 - timeProgress * 12);
  const remaining = 100 - drawProb;

  let homeShare = 0.5;
  if (goalDiff !== 0) {
    const lean = Math.min(0.42, Math.abs(goalDiff) * 0.16 + timeProgress * 0.08);
    homeShare = goalDiff > 0 ? 0.5 + lean : 0.5 - lean;
  }

  const homeProb = remaining * homeShare;
  const awayProb = remaining - homeProb;
  return { homeProb, drawProb, awayProb };
}

function generateMockMarkets(): PredictionEvent[] {
  const events: PredictionEvent[] = [];

  // ── Sports: High-profile matchups across global leagues ───────────────
  const sportsTeams: [string, string, string, string][] = [
    // NBA
    ["Lakers", "Warriors", "NBA", "Tonight"],
    ["Celtics", "Heat", "NBA Playoffs", "Tonight"],
    ["Knicks", "76ers", "NBA Eastern", "Tonight"],
    ["Bucks", "Nuggets", "NBA Finals", "Tonight"],
    ["Thunder", "Clippers", "NBA", "Tonight"],
    // Premier League
    ["Arsenal", "Chelsea", "Premier League", "Tonight"],
    ["Man City", "Liverpool", "Premier League", "Tonight"],
    ["Tottenham", "Man United", "Premier League", "Tonight"],
    ["Newcastle", "Aston Villa", "Premier League", "Tonight"],
    // Champions League
    ["PSG", "Bayern Munich", "Champions League", "Tonight"],
    ["Real Madrid", "Barcelona", "La Liga", "Tonight"],
    ["Inter Milan", "AC Milan", "Serie A Derby", "Tonight"],
    ["Dortmund", "Leverkusen", "Bundesliga", "Tonight"],
    ["Atletico Madrid", "Sevilla", "La Liga", "Tonight"],
    ["Juventus", "Roma", "Serie A", "Tonight"],
    // NFL
    ["Chiefs", "49ers", "NFL", "Tonight"],
    ["Bills", "Eagles", "NFL Playoffs", "Tonight"],
    ["Packers", "Cowboys", "NFC Showdown", "Tonight"],
    ["Ravens", "Bengals", "AFC North", "Tonight"],
    ["Dolphins", "Jets", "AFC East", "Tonight"],
    // MLB
    ["Yankees", "Dodgers", "MLB", "Tonight"],
    ["Mets", "Astros", "World Series", "Tonight"],
    ["Cubs", "Cardinals", "NL Central", "Tonight"],
    // Tennis
    ["Djokovic", "Alcaraz", "Wimbledon Final", "Tonight"],
    ["Nadal", "Sinner", "ATP Finals", "Tonight"],
    ["Swiatek", "Gauff", "US Open Women's Final", "Tonight"],
    // F1
    ["Max Verstappen", "Lando Norris", "F1 Championship", "Tonight"],
    ["Lewis Hamilton", "Charles Leclerc", "Monaco Grand Prix", "Tonight"],
    // Cricket / IPL
    ["Mumbai Indians", "CSK", "IPL Final", "Tonight"],
    ["India", "Australia", "Test Championship", "Tonight"],
    ["KKR", "RCB", "IPL", "Tonight"],
    ["DC", "PBKS", "IPL", "Tonight"],
    // South America
    ["Flamengo", "Palmeiras", "Brasileirao", "Tonight"],
    ["Boca Juniors", "River Plate", "Copa Argentina", "Tonight"],
    // UFC / Boxing
    ["Jon Jones", "Stipe Miocic", "UFC Heavyweight", "Tonight"],
    ["Canelo Alvarez", "Dmitry Bivol", "WBC Super-Middleweight", "Tonight"],
    // Golf
    ["Scottie Scheffler", "Rory McIlroy", "The Open Championship", "Tonight"],
    // Copa América
    ["Brazil", "Argentina", "Copa América Final", "Tonight"],
    ["Colombia", "Uruguay", "Copa América Semi", "Tonight"],
    // Extras
    ["Leverkusen", "Atletico Madrid", "Europa League", "Tonight"],
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
  ];
  
  // Procedurally generate another 150+ realistic-looking matches to reach the >250 events target
  const extraSoccerTeams = ["Ajax", "PSV", "Feyenoord", "Benfica", "Porto", "Sporting", "Celtic", "Rangers", "Galatasaray", "Fenerbahce", "Besiktas", "Olympiacos", "Panathinaikos", "Boca Juniors", "River Plate", "Flamengo", "Palmeiras", "Corinthians", "Sao Paulo", "Santos", "Cruz Azul", "Club America", "Monterrey", "Tigres"];
  for (let i = 0; i < extraSoccerTeams.length; i++) {
    for (let j = i + 1; j < extraSoccerTeams.length; j += 3) {
        sportsTeams.push([extraSoccerTeams[i], extraSoccerTeams[j], "Global Soccer", "Tomorrow"]);
    }
  }

  const extraNbaTeams = ["Suns", "Mavericks", "Timberwolves", "Pelicans", "Kings", "Pacers", "Magic", "Cavaliers", "Bulls", "Hawks"];
  for (let i = 0; i < extraNbaTeams.length; i++) {
    for (let j = i + 1; j < extraNbaTeams.length; j += 2) {
        sportsTeams.push([extraNbaTeams[i], extraNbaTeams[j], "NBA Regular Season", "Tomorrow"]);
    }
  }

  const extraEsportsTeams = ["Cloud9", "NRG", "100 Thieves", "OpTic", "Team Liquid", "TSM", "T1", "Gen.G", "EDG", "RNG"];
  for (let i = 0; i < extraEsportsTeams.length; i++) {
    for (let j = i + 1; j < extraEsportsTeams.length; j += 2) {
        sportsTeams.push([extraEsportsTeams[i], extraEsportsTeams[j], "Global Esports", "Tomorrow"]);
    }
  }

  // ── Startup Predictions: 30 events — Indian + Global unicorns ────────────
  const startups: { title: string; probYes: number; pool: number; date: string }[] = [
    // Global AI Unicorns
    { title: "OpenAI achieves $200B valuation before Q1 2027", probYes: 62, pool: 18500000, date: "2027-03-31" },
    { title: "Anthropic releases Claude 5 with GPT-5 beating benchmarks", probYes: 55, pool: 9200000, date: "2026-12-31" },
    { title: "xAI's Grok surpasses 50M daily active users", probYes: 48, pool: 7800000, date: "2026-12-31" },
    { title: "Perplexity AI crosses 100M monthly active users", probYes: 58, pool: 5600000, date: "2026-12-31" },
    { title: "Mistral AI gets acquired by a major tech company", probYes: 32, pool: 4100000, date: "2026-12-31" },
    { title: "Figure AI deploys 10,000 humanoid robots commercially", probYes: 28, pool: 6700000, date: "2027-06-30" },
    { title: "Waymo expands to 20 US cities by end of 2026", probYes: 45, pool: 8300000, date: "2026-12-31" },
    { title: "Neuralink receives FDA approval for consumer BCI device", probYes: 22, pool: 12400000, date: "2027-06-30" },
    { title: "Runway ML IPO at over $10B valuation", probYes: 30, pool: 3200000, date: "2027-03-31" },
    // Global FinTech / B2B
    { title: "Stripe files IPO S-1 before December 31, 2026", probYes: 52, pool: 22000000, date: "2026-12-31" },
    { title: "Klarna completes NYSE IPO at $14B+ valuation", probYes: 68, pool: 15000000, date: "2026-12-31" },
    { title: "Databricks reaches $100B valuation", probYes: 40, pool: 9800000, date: "2027-06-30" },
    { title: "Canva goes public via NYSE IPO this year", probYes: 35, pool: 7600000, date: "2026-12-31" },
    { title: "Discord raises new funding at $20B+ valuation", probYes: 38, pool: 4500000, date: "2026-12-31" },
    { title: "SpaceX completes first commercial Starship orbital flight", probYes: 72, pool: 28000000, date: "2026-12-31" },
    // Indian Unicorns
    { title: "Zepto achieves $1B revenue run-rate by Q4 2026", probYes: 55, pool: 4800000, date: "2026-12-31" },
    { title: "PhonePe IPO on Indian exchanges by 2027", probYes: 48, pool: 6200000, date: "2027-12-31" },
    { title: "Razorpay reaches $10B valuation in next funding round", probYes: 42, pool: 3900000, date: "2027-06-30" },
    { title: "Groww surpasses 50M registered investors", probYes: 60, pool: 3100000, date: "2026-12-31" },
    { title: "Swiggy Instamart becomes India's largest quick commerce", probYes: 38, pool: 5500000, date: "2027-03-31" },
    { title: "Meesho crosses $2B GMV by Q4 2026", probYes: 50, pool: 2800000, date: "2026-12-31" },
    { title: "Slice Bank launches full banking services by end of 2026", probYes: 44, pool: 1900000, date: "2026-12-31" },
    { title: "Ola Electric delivers 1M EVs in 2026", probYes: 35, pool: 4200000, date: "2026-12-31" },
    { title: "Zerodha launches mutual fund platform with 10M AUM users", probYes: 62, pool: 2600000, date: "2026-12-31" },
    { title: "CRED surpasses 20M active premium users", probYes: 55, pool: 3400000, date: "2026-12-31" },
    { title: "Lenskart expands to 50 countries globally", probYes: 30, pool: 1800000, date: "2027-06-30" },
    { title: "Nykaa Fashion achieves profitability by Q2 FY27", probYes: 45, pool: 2200000, date: "2027-09-30" },
    { title: "Dunzo acquires a rival quick-commerce startup", probYes: 28, pool: 1500000, date: "2026-12-31" },
    { title: "InMobi Group lists one subsidiary on Indian exchanges", probYes: 32, pool: 1700000, date: "2027-12-31" },
    { title: "BharatPe achieves 100M merchant payment network", probYes: 58, pool: 3000000, date: "2026-12-31" },
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
  ];

  // ── Crypto: 20 events ───────────────────────────────────────────────────
  const cryptos: { title: string; probYes: number; pool: number; date: string }[] = [
    { title: "Bitcoin breaks $150,000 before year end", probYes: 58, pool: 45000000, date: "2026-12-31" },
    { title: "Ethereum surpasses $10,000 all-time high", probYes: 42, pool: 28000000, date: "2026-12-31" },
    { title: "Solana reaches $500 per token", probYes: 38, pool: 18000000, date: "2026-12-31" },
    { title: "XRP wins final SEC court appeal", probYes: 65, pool: 22000000, date: "2026-12-31" },
    { title: "Total crypto market cap exceeds $5 Trillion", probYes: 40, pool: 35000000, date: "2026-12-31" },
    { title: "Bitcoin ETF AUM surpasses $200 Billion", probYes: 55, pool: 31000000, date: "2026-12-31" },
    { title: "Dogecoin reaches $1 per coin", probYes: 25, pool: 19000000, date: "2026-12-31" },
    { title: "Cardano achieves $10B TVL in DeFi protocols", probYes: 28, pool: 8500000, date: "2026-12-31" },
    { title: "Uniswap V4 processes $500B cumulative volume", probYes: 48, pool: 7200000, date: "2026-12-31" },
    { title: "Arbitrum surpasses Ethereum mainnet in daily transactions", probYes: 35, pool: 9800000, date: "2026-12-31" },
    { title: "Polygon zkEVM reaches $5B TVL", probYes: 30, pool: 6300000, date: "2026-12-31" },
    { title: "BlackRock launches a second crypto ETF product", probYes: 60, pool: 14500000, date: "2026-12-31" },
    { title: "Binance resolves all US legal issues by end of 2026", probYes: 42, pool: 11000000, date: "2026-12-31" },
    { title: "Avalanche becomes top 5 DeFi chain by TVL", probYes: 32, pool: 7800000, date: "2026-12-31" },
    { title: "EU MiCA regulations drive 3 exchanges out of Europe", probYes: 45, pool: 5600000, date: "2026-12-31" },
    { title: "zkSync mainnet processes $100B in transactions", probYes: 38, pool: 4900000, date: "2026-12-31" },
    { title: "Chainlink CCIP becomes the standard cross-chain protocol", probYes: 40, pool: 6100000, date: "2027-06-30" },
    { title: "Litecoin halving causes 50%+ price surge", probYes: 35, pool: 5300000, date: "2027-08-31" },
    { title: "India legalizes crypto trading with formal taxation framework", probYes: 50, pool: 8900000, date: "2026-12-31" },
    { title: "Toncoin becomes Telegram's primary payment layer", probYes: 62, pool: 7400000, date: "2026-12-31" },
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
  ];

  // ── Equities: 20 market events ──────────────────────────────────────────
  const equities: { title: string; probYes: number; pool: number; date: string }[] = [
    { title: "NVIDIA market cap surpasses $5 Trillion", probYes: 48, pool: 38000000, date: "2026-12-31" },
    { title: "Apple launches AI-native iPhone with on-device LLM", probYes: 72, pool: 24000000, date: "2026-12-31" },
    { title: "Tesla delivers 3 million vehicles in 2026", probYes: 38, pool: 18500000, date: "2026-12-31" },
    { title: "Microsoft Azure officially overtakes AWS in market share", probYes: 30, pool: 21000000, date: "2027-12-31" },
    { title: "Meta Platforms stock crosses $700", probYes: 55, pool: 14000000, date: "2026-12-31" },
    { title: "Google (Alphabet) spins off Waymo as separate public entity", probYes: 28, pool: 16000000, date: "2027-12-31" },
    { title: "Amazon acquires a major Hollywood studio", probYes: 22, pool: 12000000, date: "2027-12-31" },
    { title: "S&P 500 crosses 6,500 points before end of 2026", probYes: 52, pool: 29000000, date: "2026-12-31" },
    { title: "NIFTY 50 crosses 30,000 points by Q4 2026", probYes: 42, pool: 8700000, date: "2026-12-31" },
    { title: "Sensex reaches 1,00,000 mark by 2027", probYes: 35, pool: 6500000, date: "2027-12-31" },
    { title: "Reliance Industries launches Jio AI cloud platform", probYes: 65, pool: 5400000, date: "2026-12-31" },
    { title: "HDFC Bank becomes India's largest company by market cap", probYes: 48, pool: 4800000, date: "2026-12-31" },
    { title: "Goldman Sachs beats Q3 2026 earnings by 20%+", probYes: 40, pool: 9200000, date: "2026-09-30" },
    { title: "Berkshire Hathaway acquires a major Indian company", probYes: 18, pool: 11000000, date: "2027-12-31" },
    { title: "SoftBank Vision Fund achieves profitability in FY2026", probYes: 30, pool: 7800000, date: "2027-03-31" },
    { title: "Tesla launches its own insurance product in all 50 US states", probYes: 55, pool: 8100000, date: "2026-12-31" },
    { title: "AMD surpasses Intel in total data center revenue", probYes: 45, pool: 13500000, date: "2026-12-31" },
    { title: "Adani Group recovers to pre-Hindenburg report valuation", probYes: 50, pool: 6200000, date: "2026-12-31" },
    { title: "Tata Motors Jaguar Land Rover achieves record EV sales year", probYes: 52, pool: 4300000, date: "2027-03-31" },
    { title: "Infosys wins $5B+ TCV contract in H2 FY27", probYes: 38, pool: 3600000, date: "2027-03-31" },
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
  ];

  // ── Build Sports events with deterministic seeded odds ───────────────────
  sportsTeams.forEach(([team1, team2, league, date], i) => {
    const id = `sports-${i}`;
    const rng = seededRandom(id);
    const prob1 = Math.round(38 + rng() * 24); // 38-62
    const prob2 = 100 - prob1;
    events.push({
      id,
      title: `${team1} vs ${team2} (${league})`,
      category: "Sports",
      status: "Open",
      resolutionDate: date,
      outcomes: [
        { label: team1, odds: probToOdds(prob1), probability: prob1 },
        { label: team2, odds: probToOdds(prob2), probability: prob2 },
      ],
      poolSize: seededPool(id, 500000, 8000000),
    });
  });

  // ── Build Startup events ─────────────────────────────────────────────────
  startups.forEach((s, i) => {
    const id = `startup-${i}`;
    events.push({
      id,
      title: s.title,
      category: "Startup",
      status: "Open",
      resolutionDate: s.date,
      outcomes: [
        { label: "Yes", odds: probToOdds(s.probYes), probability: s.probYes },
        { label: "No", odds: probToOdds(100 - s.probYes), probability: 100 - s.probYes },
      ],
      poolSize: s.pool,
    });
  });

  // ── Build Crypto events ──────────────────────────────────────────────────
  cryptos.forEach((c, i) => {
    const id = `crypto-${i}`;
    events.push({
      id,
      title: c.title,
      category: "Crypto",
      status: "Open",
      resolutionDate: c.date,
      outcomes: [
        { label: "Yes", odds: probToOdds(c.probYes), probability: c.probYes },
        { label: "No", odds: probToOdds(100 - c.probYes), probability: 100 - c.probYes },
      ],
      poolSize: c.pool,
    });
  });

  // ── Build Equities events ────────────────────────────────────────────────
  equities.forEach((e, i) => {
    const id = `equities-${i}`;
    events.push({
      id,
      title: e.title,
      category: "Equities",
      status: "Open",
      resolutionDate: e.date,
      outcomes: [
        { label: "Yes", odds: probToOdds(e.probYes), probability: e.probYes },
        { label: "No", odds: probToOdds(100 - e.probYes), probability: 100 - e.probYes },
      ],
      poolSize: e.pool,
    });
  });

  return events;
}

export async function GET() {
  const oddsApiKey = process.env.ODDS_API_KEY;
  const sportsApiKey = process.env.API_SPORTS_KEY;
  const today = getDateStringInTimezone(new Date(), FIXTURES_TIMEZONE);
  const tomorrow = getDateStringInTimezone(new Date(Date.now() + 86400000), FIXTURES_TIMEZONE);
  
  const mockData = generateMockMarkets();
  const nonSportsMock = mockData.filter(m => m.category !== "Sports");
  
  let allSportsEvents: PredictionEvent[] = [];

  // ── Run ALL external API calls in PARALLEL ──────────────────────────────
  // The old sequential approach took 12-20s (4 calls × 3-5s each), which
  // exceeds Vercel's 10s serverless timeout. Promise.allSettled brings it
  // down to ~3-5s (the slowest single call).

  type ApiResult = { source: string; events: PredictionEvent[] };

  const apiCalls: Promise<ApiResult>[] = [];

  // 1. The Odds API
  if (oddsApiKey) {
    apiCalls.push(
      (async (): Promise<ApiResult> => {
        try {
          const res = await fetch(
            `https://api.the-odds-api.com/v4/sports/upcoming/odds/?apiKey=${oddsApiKey}&regions=us,eu&markets=h2h&oddsFormat=decimal`,
            { next: { revalidate: 120 } }
          );
          if (res.status === 429) {
            console.warn("Odds API rate limited (429) - skipping");
            return { source: "odds-api", events: [] };
          }
          if (!res.ok) {
            console.error(`Odds API failed with status ${res.status}`);
            return { source: "odds-api", events: [] };
          }
          const rawData = await res.json();
          if (!Array.isArray(rawData)) return { source: "odds-api", events: [] };

          const mapped: PredictionEvent[] = rawData.slice(0, 500).map((game: any) => {
            const bookmaker = game.bookmakers?.[0];
            const market = bookmaker?.markets?.[0];
            const outcomes = market?.outcomes || [];
            if (outcomes.length < 2) return null;
            const twoOutcomes = outcomes.slice(0, 2);
            return {
              id: `oddsapi-${game.id}`,
              title: `${game.home_team} vs ${game.away_team} (${game.sport_title})`,
              category: "Sports" as const,
              status: "Open" as const,
              resolutionDate: new Date(game.commence_time).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
              outcomes: twoOutcomes.map((o: any) => ({
                label: o.name,
                odds: o.price,
                probability: Math.round((1 / Math.max(o.price, 1.01)) * 100)
              })),
              poolSize: seededPool(`oddsapi-${game.id}`, 200000, 3200000)
            };
          }).filter(Boolean) as PredictionEvent[];
          return { source: "odds-api", events: mapped };
        } catch (e) {
          console.error("Odds API Error", e);
          return { source: "odds-api", events: [] };
        }
      })()
    );
  }

  // 2. API Sports — today + tomorrow fixtures (two parallel calls)
  if (sportsApiKey) {
    for (const date of [today, tomorrow]) {
      apiCalls.push(
        (async (): Promise<ApiResult> => {
          try {
            const res = await fetch(`https://v3.football.api-sports.io/fixtures?date=${date}&timezone=${encodeURIComponent(FIXTURES_TIMEZONE)}`, {
              headers: { 'x-apisports-key': sportsApiKey },
              next: { revalidate: 120 }
            });
            if (res.status === 429) {
              console.warn(`API Sports rate limited (429) for ${date}`);
              return { source: `apisports-${date}`, events: [] };
            }
            if (!res.ok) {
              console.error(`API Sports failed for ${date} with status ${res.status}`);
              return { source: `apisports-${date}`, events: [] };
            }
            const data = await res.json();
            if (!data.response || !Array.isArray(data.response)) return { source: `apisports-${date}`, events: [] };

            const fixtures = data.response
              .filter((m: any) => m.fixture.status.short !== 'PST' && m.fixture.status.short !== 'CANC')
              .slice(0, 500);

            const mapped: PredictionEvent[] = fixtures.map((match: any) => {
              const home = match.teams.home.name;
              const away = match.teams.away.name;
              const league = match.league.name;
              const status = match.fixture.status.short;
              const elapsed = match.fixture.status.elapsed || 0;
              const homeGoals = match.goals?.home ?? 0;
              const awayGoals = match.goals?.away ?? 0;
              const isLive = ['1H', '2H', 'HT', 'ET', 'P'].includes(status);

              const { homeProb, drawProb, awayProb } = computeMatchProbabilities(homeGoals, awayGoals, elapsed, isLive, `apisports-${match.fixture.id}`);

              const prefix = isLive ? `[LIVE ${elapsed}'] ${home} ${homeGoals}-${awayGoals} ${away}` : `${home} vs ${away}`;
              return {
                id: `apisports-${match.fixture.id}`,
                title: `${prefix} (${league})`,
                category: "Sports" as const,
                status: "Open" as const,
                resolutionDate: isLive ? "Live Now" : new Date(match.fixture.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
                outcomes: [
                  { label: home, odds: probToOdds(homeProb), probability: Math.round(homeProb) },
                  { label: "Draw", odds: probToOdds(drawProb), probability: Math.round(drawProb) },
                  { label: away, odds: probToOdds(awayProb), probability: Math.round(awayProb) }
                ],
                poolSize: seededPool(`apisports-${match.fixture.id}`, 100000, 5100000)
              };
            });
            return { source: `apisports-${date}`, events: mapped };
          } catch (e) {
            console.error(`API Sports Error for ${date}`, e);
            return { source: `apisports-${date}`, events: [] };
          }
        })()
      );
    }

    // 3. API Sports — live fixtures
    apiCalls.push(
      (async (): Promise<ApiResult> => {
        try {
          const res = await fetch(`https://v3.football.api-sports.io/fixtures?live=all`, {
            headers: { 'x-apisports-key': sportsApiKey },
            next: { revalidate: 60 }
          });
          if (res.status === 429) {
            console.warn("API Sports live endpoint rate limited (429)");
            return { source: "apisports-live", events: [] };
          }
          if (!res.ok) {
            console.error(`API Sports live failed with status ${res.status}`);
            return { source: "apisports-live", events: [] };
          }
          const data = await res.json();
          if (!data.response || !Array.isArray(data.response)) return { source: "apisports-live", events: [] };

          const liveFixtures = data.response.slice(0, 500).map((match: any) => {
            const home = match.teams.home.name;
            const away = match.teams.away.name;
            const league = match.league.name;
            const elapsed = match.fixture.status.elapsed || 0;
            const homeGoals = match.goals?.home ?? 0;
            const awayGoals = match.goals?.away ?? 0;

            const { homeProb, drawProb, awayProb } = computeMatchProbabilities(homeGoals, awayGoals, elapsed, true);

            return {
              id: `live-${match.fixture.id}`,
              title: `[LIVE ${elapsed}'] ${home} ${homeGoals}-${awayGoals} ${away} (${league})`,
              category: "Sports" as const,
              status: "Open" as const,
              resolutionDate: "Live Now",
              outcomes: [
                { label: home, odds: probToOdds(homeProb), probability: Math.round(homeProb) },
                { label: "Draw", odds: probToOdds(drawProb), probability: Math.round(drawProb) },
                { label: away, odds: probToOdds(awayProb), probability: Math.round(awayProb) }
              ],
              poolSize: seededPool(`live-${match.fixture.id}`, 100000, 5100000)
            };
          });
          return { source: "apisports-live", events: liveFixtures };
        } catch (e) {
          console.error("API Sports Live Error", e);
          return { source: "apisports-live", events: [] };
        }
      })()
    );
  }

  // ── Await ALL calls in parallel ─────────────────────────────────────────
  const results = await Promise.allSettled(apiCalls);
  for (const result of results) {
    if (result.status === "fulfilled") {
      allSportsEvents.push(...result.value.events);
    }
  }

  // Deduplicate by the underlying fixture id. A match can appear both as an
  // `apisports-` (pre-match) entry and a `live-` entry once it kicks off, so
  // dedup on the raw id string alone lets duplicates slip through. Normalize
  // both prefixes to the same key and prefer the fresher `live-` version.
  const normalizeFixtureKey = (id: string): string => {
    if (id.startsWith('apisports-')) return `fixture-${id.slice('apisports-'.length)}`;
    if (id.startsWith('live-')) return `fixture-${id.slice('live-'.length)}`;
    return id;
  };
  const seen = new Map<string, PredictionEvent>();
  for (const e of allSportsEvents) {
    const key = normalizeFixtureKey(e.id);
    const existing = seen.get(key);
    if (!existing || (e.id.startsWith('live-') && !existing.id.startsWith('live-'))) {
      seen.set(key, e);
    }
  }
  allSportsEvents = Array.from(seen.values());

  let finalEvents: PredictionEvent[] = [];

  // Enforce 75% live / 25% mock ratio as requested by user
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
  }

  // Sort sports deterministically by title so order is stable across requests
  finalEvents.sort((a, b) => a.title.localeCompare(b.title));

  return NextResponse.json({ 
    source: allSportsEvents.length > 0 ? "live-apis" : "simulation",
    debug: { hasOddsKey: !!oddsApiKey, hasSportsKey: !!sportsApiKey },
    data: finalEvents 
  });
}

