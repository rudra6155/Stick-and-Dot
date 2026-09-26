import json

def expand_odds(content):
    sports_additions = [
        ["Real Madrid", "Atletico Madrid", "La Liga"],
        ["Bayern Munich", "BVB", "Bundesliga"],
        ["Juventus", "AC Milan", "Serie A"],
        ["Man United", "Chelsea", "Premier League"],
        ["Lakers", "Suns", "NBA"],
        ["Warriors", "Clippers", "NBA"],
        ["Patriots", "Jets", "NFL"],
        ["Rams", "Seahawks", "NFL"],
        ["Yankees", "Red Sox", "MLB"],
        ["Dodgers", "Giants", "MLB"],
        ["Celtics", "Sixers", "NBA"],
        ["Nets", "Knicks", "NBA"],
        ["Eagles", "Cowboys", "NFL"],
        ["Packers", "Bears", "NFL"],
        ["Astros", "Rangers", "MLB"],
        ["Braves", "Mets", "MLB"],
        ["Maple Leafs", "Canadiens", "NHL"],
        ["Bruins", "Rangers", "NHL"],
        ["Avalanche", "Golden Knights", "NHL"],
        ["Lightning", "Panthers", "NHL"],
    ]
    
    startups_additions = ["OpenAI releases GPT-5 by Q3", "Anthropic hits $50B valuation", "xAI launches Grok 3"]
    crypto_additions = ["Bitcoin reaches $200k", "Ethereum ETF approved in UK", "Solana overtakes Ethereum in TVL"]
    equities_additions = ["Nvidia reaches $4T market cap", "Apple launches AR glasses", "Microsoft acquires a major game studio"]
    macros_additions = ["US Fed cuts rates by 50bps in Q2", "US GDP growth exceeds 3% in Q3", "Eurozone enters recession"]

    sports_str = ", ".join([json.dumps(x) for x in sports_additions])
    startups_str = ", ".join([json.dumps(x) for x in startups_additions])
    cryptos_str = ", ".join([json.dumps(x) for x in crypto_additions])
    equities_str = ", ".join([json.dumps(x) for x in equities_additions])
    
    content = content.replace('const sportsTeams = [', 'const sportsTeams = [' + sports_str + ',')
    content = content.replace('const startups = [', 'const startups = [' + startups_str + ',')
    content = content.replace('const cryptos = [', 'const cryptos = [' + cryptos_str + ',')
    content = content.replace('const equities = [', 'const equities = [' + equities_str + ',')
    
    return content

with open('src/app/api/odds/route.ts', 'r', encoding='utf-8') as f:
    content = f.read()

new_content = expand_odds(content)

with open('src/app/api/odds/route.ts', 'w', encoding='utf-8') as f:
    f.write(new_content)
