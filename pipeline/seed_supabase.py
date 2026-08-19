import os
import json
import requests
import sys

# Supabase details passed via env vars or arguments
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_KEY") or os.environ.get("SUPABASE_PUBLISHABLE_KEY")

# Ensure URL doesn't end with slash
if SUPABASE_URL:
    SUPABASE_URL = SUPABASE_URL.rstrip('/')

DB_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "activities.json")

def upload_activities():
    with open(DB_PATH, "r", encoding="utf-8") as f:
        activities = json.load(f)
        
    print(f"Found {len(activities)} activities in local JSON.")
    
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "resolution=merge-duplicates" # Upsert
    }
    
    # We need to map camelCase keys to snake_case for the Postgres table
    payload = []
    for act in activities:
        payload.append({
            "id": act["id"],
            "name": act["name"],
            "category": act["category"],
            "subcategory": act.get("subcategory"),
            "short_description": act.get("shortDescription"),
            "hook": act["hook"],
            "dimensions": act["dimensions"],
            "practical_constraints": act["practicalConstraints"],
            "progression": act["progression"],
            "social_profile": act.get("socialProfile", {}),
            "experiment": act.get("experiment", {}),
            "tags": act.get("tags", [])
        })
        
    url = f"{SUPABASE_URL}/rest/v1/activities"
    
    # Supabase allows bulk inserts up to a limit, let's do batches of 50
    batch_size = 50
    for i in range(0, len(payload), batch_size):
        batch = payload[i:i+batch_size]
        print(f"Uploading batch {i} to {i+len(batch)}...")
        
        response = requests.post(url, headers=headers, json=batch)
        if response.status_code not in (200, 201):
            print(f"Error {response.status_code}: {response.text}")
        else:
            print(f"Batch success.")

if __name__ == "__main__":
    upload_activities()
    print("Done seeding Supabase.")
