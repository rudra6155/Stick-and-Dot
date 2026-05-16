import sqlite3
import json
import math
import os

def sanitize_record(record: dict) -> dict:
    """Replace Infinity / -Infinity / NaN float values with None so the
    output is valid JSON (those tokens are illegal in JSON spec)."""
    cleaned = {}
    for k, v in record.items():
        if isinstance(v, float) and (math.isinf(v) or math.isnan(v)):
            cleaned[k] = None
        else:
            cleaned[k] = v
    return cleaned

def export_to_json():
    conn = sqlite3.connect('finance_hub.db')
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    data = {
        "crypto_assets": [],
        "traditional_assets": []
    }

    try:
        # Deduplicate crypto_assets by keeping the latest entry per asset (highest id)
        cursor.execute('''
            SELECT * FROM crypto_assets 
            WHERE id IN (
                SELECT MAX(id) FROM crypto_assets GROUP BY asset_name
            )
        ''')
        crypto_rows = cursor.fetchall()
        for row in crypto_rows:
            data["crypto_assets"].append(sanitize_record(dict(row)))
    except sqlite3.OperationalError as e:
        print(f"Error fetching crypto_assets: {e}")

    try:
        # Deduplicate traditional_assets by keeping the latest entry per asset (highest id)
        cursor.execute('''
            SELECT * FROM traditional_assets 
            WHERE id IN (
                SELECT MAX(id) FROM traditional_assets GROUP BY ticker
            )
        ''')
        traditional_rows = cursor.fetchall()
        for row in traditional_rows:
            data["traditional_assets"].append(sanitize_record(dict(row)))
    except sqlite3.OperationalError as e:
        print(f"Error fetching traditional_assets: {e}")

    conn.close()

    output_path = os.path.join('src', 'data', 'marketData.json')
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    
    with open(output_path, 'w') as f:
        json.dump(data, f, indent=2, allow_nan=False)
        
    print(f"Successfully exported deduplicated data to {output_path}")
    print(f"OK Exported {len(data['crypto_assets'])} crypto assets")
    print(f"OK Exported {len(data['traditional_assets'])} traditional assets")
    print(f"OK Total: {len(data['crypto_assets']) + len(data['traditional_assets'])} assets")

if __name__ == "__main__":
    export_to_json()
