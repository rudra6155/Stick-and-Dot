import { NextResponse } from "next/server";
import { PredictionEvent } from "@/utils/sportsData";

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

// Derives a proper 3-way (Home / Draw / Away) probability split instead of forcing
// Home + Away to sum to 100%, which artificially strips out Draw's share of probability.
function computeMatchProbabilities(homeGoals: number, awayGoals: number, elapsed: number, isLive: boolean) {
  const goalDiff = homeGoals - awayGoals;
  const timeProgress = Math.min(elapsed, 90) / 90; // 0 -> 1 as the match progresses

  if (!isLive) {
    // Pre-match: modest home advantage, standard football draw probability.
    const homeProb = 38 + Math.floor(Math.random() * 14); // 38-51
    const drawProb = 24 + Math.floor(Math.random() * 6); // 24-29
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
  
  const sportsTeams = [
    ["Lakers", "Warriors", "NBA"], ["Arsenal", "Chelsea", "Premier League"],
    ["Real Madrid", "Barcelona", "La Liga"], ["Chiefs", "49ers", "NFL"],
    ["Yankees", "Dodgers", "MLB"], ["Djokovic", "Alcaraz", "Tennis Grand Slam"],
    ["Max Verstappen", "Lando Norris", "F1 Championship"], ["Celtics", "Heat", "NBA Playoffs"],
    ["Man City", "Liverpool", "Premier League"], ["PSG", "Bayern Munich", "Champions League"],
    ["Nadal", "Sinner", "ATP Finals"], ["Mumbai Indians", "CSK", "IPL"],
    ["Bills", "Eagles", "NFL Playoffs"], ["Inter Milan", "AC Milan", "Serie A Derby"],
    ["Flamengo", "Palmeiras", "Brasileirao"], ["Knicks", "76ers", "NBA Eastern"],
    ["Bucks", "Nuggets", "NBA Finals"], ["Mets", "Astros", "World Series"],
    ["Packers", "Cowboys", "NFC Showdown"], ["Dortmund", "Leverkusen", "Bundesliga"]
  ];

  const startups = [
    "OpenAI reaches $150B valuation by Q4",
    "Stripe finally IPOs this year",
    "SpaceX completes Mars orbital test",
    "Figure AI deploys 10k robots",
    "Anthropic releases Claude 5",
    "xAI raises another $10B",
    "Perplexity AI surpasses 100M MAUs",
    "Neuralink gets FDA approval for V2",
    "Waymo expands to 20 cities",
    "Mistral AI valued over $10B"
  ];

  const cryptos = [
    "Bitcoin breaks $150k by year end",
    "Ethereum surpasses $10k",
    "Solana reaches $500",
    "Dogecoin hits $1",
    "XRP wins final SEC appeal",
    "Total crypto market cap exceeds $5T",
    "Bitcoin ETF AUM exceeds $200B",
    "Cardano smart contracts TVL > $5B"
  ];

  const equities = [
    "NVIDIA hits $5T market cap",
    "Apple announces AI-first iPhone",
    "Tesla delivers 3M vehicles this year",
    "Microsoft Azure overtakes AWS",
    "Meta stock crosses $700",
    "Google spins off Waymo as IPO",
    "Amazon acquires a major studio",
    "Goldman Sachs beats Q3 estimates by 20%"
  ];

  // Sports
  sportsTeams.forEach((match, i) => {
    const odds1 = (1.3 + Math.random() * 1.2).toFixed(2);
    const prob1 = Math.round((1 / Number(odds1)) * 100);
    const odds2 = (1 + (100 - prob1) / prob1 + Math.random() * 0.2).toFixed(2);
    events.push({
      id: `sports-${i}`,
      title: `${match[0]} vs ${match[1]} (${match[2]})`,
      category: "Sports", status: "Open", resolutionDate: "Tonight",
      outcomes: [
        { label: match[0], odds: Number(odds1), probability: prob1 },
        { label: match[1], odds: Number(odds2), probability: 100 - prob1 }
      ],
      poolSize: Math.floor(Math.random() * 5000000) + 100000
    });
  });

  // Startups
  startups.forEach((title, i) => {
    const probYes = Math.floor(Math.random() * 60) + 20;
    events.push({
      id: `startup-${i}`, title, category: "Startup", status: "Open",
      resolutionDate: "2026-12-31",
      outcomes: [
        { label: "Yes", odds: probToOdds(probYes), probability: probYes },
        { label: "No", odds: probToOdds(100 - probYes), probability: 100 - probYes }
      ],
      poolSize: Math.floor(Math.random() * 10000000) + 500000
    });
  });

  // Crypto
  cryptos.forEach((title, i) => {
    const probYes = Math.floor(Math.random() * 70) + 10;
    events.push({
      id: `crypto-${i}`, title, category: "Crypto", status: "Open",
      resolutionDate: "End of Quarter",
      outcomes: [
        { label: "Yes", odds: probToOdds(probYes), probability: probYes },
        { label: "No", odds: probToOdds(100 - probYes), probability: 100 - probYes }
      ],
      poolSize: Math.floor(Math.random() * 50000000) + 1000000
    });
  });

  // Equities
  equities.forEach((title, i) => {
    const probYes = Math.floor(Math.random() * 55) + 25;
    events.push({
      id: `equities-${i}`, title, category: "Equities", status: "Open",
      resolutionDate: "Q4 2026",
      outcomes: [
        { label: "Yes", odds: probToOdds(probYes), probability: probYes },
        { label: "No", odds: probToOdds(100 - probYes), probability: 100 - probYes }
      ],
      poolSize: Math.floor(Math.random() * 20000000) + 2000000
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

  // 1. Fetch from The Odds API (upcoming events across all sports)
  if (oddsApiKey) {
    try {
      const res = await fetch(
        `https://api.the-odds-api.com/v4/sports/upcoming/odds/?apiKey=${oddsApiKey}&regions=us,eu&markets=h2h&oddsFormat=decimal`,
        { next: { revalidate: 120 } }
      );
      if (res.status === 429) {
        console.warn("Odds API rate limited (429) - skipping live odds for this cycle");
      } else if (!res.ok) {
        console.error(`Odds API request failed with status ${res.status}`);
      } else {
        const rawData = await res.json();
        if (Array.isArray(rawData)) {
          const mapped: PredictionEvent[] = rawData.slice(0, 40).map((game: any) => {
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
                probability: Math.round((1 / o.price) * 100)
              })),
              poolSize: Math.floor(Math.random() * 3000000) + 200000
            };
          }).filter(Boolean) as PredictionEvent[];
          allSportsEvents.push(...mapped);
        }
      }
    } catch (e) {
      console.error("Odds API Error", e);
    }
  }

  // 2. Fetch from API Sports (today + tomorrow fixtures)
  if (sportsApiKey) {
    for (const date of [today, tomorrow]) {
      try {
        const res = await fetch(`https://v3.football.api-sports.io/fixtures?date=${date}&timezone=${encodeURIComponent(FIXTURES_TIMEZONE)}`, {
          headers: { 'x-apisports-key': sportsApiKey },
          next: { revalidate: 120 }
        });
        if (res.status === 429) {
          console.warn(`API Sports rate limited (429) for ${date} - skipping this cycle`);
        } else if (!res.ok) {
          console.error(`API Sports request failed for ${date} with status ${res.status}`);
        } else {
          const data = await res.json();
          if (data.response && Array.isArray(data.response)) {
            const fixtures = data.response
              .filter((m: any) => m.fixture.status.short !== 'PST' && m.fixture.status.short !== 'CANC')
              .slice(0, 30);

            const mapped: PredictionEvent[] = fixtures.map((match: any) => {
              const home = match.teams.home.name;
              const away = match.teams.away.name;
              const league = match.league.name;
              const status = match.fixture.status.short;
              const elapsed = match.fixture.status.elapsed || 0;
              const homeGoals = match.goals.home ?? 0;
              const awayGoals = match.goals.away ?? 0;
              const isLive = ['1H', '2H', 'HT', 'ET', 'P'].includes(status);

              const { homeProb, drawProb, awayProb } = computeMatchProbabilities(homeGoals, awayGoals, elapsed, isLive);

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
                poolSize: Math.floor(Math.random() * 5000000) + 100000
              };
            });
            allSportsEvents.push(...mapped);
          }
        }
      } catch (e) {
        console.error(`API Sports Error for ${date}`, e);
      }
    }

    // Also try live fixtures
    try {
      const res = await fetch(`https://v3.football.api-sports.io/fixtures?live=all`, {
        headers: { 'x-apisports-key': sportsApiKey },
        next: { revalidate: 60 }
      });
      if (res.status === 429) {
        console.warn("API Sports live endpoint rate limited (429) - skipping this cycle");
      } else if (!res.ok) {
        console.error(`API Sports live request failed with status ${res.status}`);
      } else {
        const data = await res.json();
        if (data.response && Array.isArray(data.response)) {
          const liveFixtures = data.response.slice(0, 20).map((match: any) => {
            const home = match.teams.home.name;
            const away = match.teams.away.name;
            const league = match.league.name;
            const elapsed = match.fixture.status.elapsed || 0;
            const homeGoals = match.goals.home ?? 0;
            const awayGoals = match.goals.away ?? 0;

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
              poolSize: Math.floor(Math.random() * 5000000) + 100000
            };
          });
          allSportsEvents.push(...liveFixtures);
        }
      }
    } catch (e) {
      console.error("API Sports Live Error", e);
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

  // Fallback to mock sports if both APIs fail
  if (allSportsEvents.length === 0) {
    allSportsEvents = mockData.filter(m => m.category === "Sports");
  }

  // Shuffle sports
  allSportsEvents.sort(() => Math.random() - 0.5);

  return NextResponse.json({ 
    source: allSportsEvents.some(e => e.id.startsWith('oddsapi') || e.id.startsWith('apisports') || e.id.startsWith('live')) ? "live-apis" : "simulation",
    data: [...allSportsEvents, ...nonSportsMock] 
  });
}
