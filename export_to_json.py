import sqlite3
import json
import os

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
            data["crypto_assets"].append(dict(row))
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
            data["traditional_assets"].append(dict(row))
    except sqlite3.OperationalError as e:
        print(f"Error fetching traditional_assets: {e}")

    conn.close()

    output_path = os.path.join('src', 'data', 'marketData.json')
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    
    with open(output_path, 'w') as f:
        json.dump(data, f, indent=2)
        
    print(f"Successfully exported deduplicated data to {output_path}")

if __name__ == "__main__":
    export_to_json()
