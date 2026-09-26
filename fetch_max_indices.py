import financedatabase as fd
import json
import math

def fetch_and_save():
    print("Fetching indices...")
    try:
        indices_db = fd.Indices()
        indices_data = indices_db.select()
        index_symbols = [str(x) for x in indices_data.index if x is not None and not (isinstance(x, float) and math.isnan(x))]
    except Exception as e:
        print(f"Error fetching indices: {e}")
        index_symbols = []

    print("Fetching equities...")
    try:
        equities_db = fd.Equities()
        equities_data = equities_db.select()
        equity_symbols = [str(x) for x in equities_data.index if x is not None and not (isinstance(x, float) and math.isnan(x))]
    except Exception as e:
        print(f"Error fetching equities: {e}")
        equity_symbols = []

    output = {
        "indices": index_symbols,
        "equities": equity_symbols
    }

    with open("max_indices_equities.json", "w") as f:
        json.dump(output, f)

    print(f"Saved {len(index_symbols)} indices and {len(equity_symbols)} equities to max_indices_equities.json")

if __name__ == "__main__":
    fetch_and_save()
