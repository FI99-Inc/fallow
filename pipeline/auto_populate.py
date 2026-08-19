import argparse
import os
import sys
import time

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

try:
    import generate_activities
    import seed_supabase
except ImportError as e:
    print(f"Error importing pipeline modules: {e}")
    sys.exit(1)

def main():
    parser = argparse.ArgumentParser(description="End-to-End: Generate activities and sync to Supabase")
    parser.add_argument("--count", type=int, default=500, help="Total number of activities to generate (default: 500 with demographic splits)")
    args = parser.parse_args()

    gemini_key = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")
    supabase_url = os.environ.get("SUPABASE_URL")
    supabase_service_key = os.environ.get("SUPABASE_SERVICE_KEY")

    if not gemini_key:
        print("❌ Error: GEMINI_API_KEY environment variable is missing.")
        sys.exit(1)
        
    if not supabase_url or not supabase_service_key:
        print("❌ Error: SUPABASE_URL and SUPABASE_SERVICE_KEY environment variables are required.")
        sys.exit(1)

    # Demographics definition
    batches = [
        {"count": 150, "audience": "young (18-22), highly social, extraverted people looking for group activities and high-energy environments"},
        {"count": 100, "audience": "young (18-22), quieter, social, introverted people looking for relaxed, low-pressure group or parallel-play activities"},
        {"count": 100, "audience": "young (18-22) people who want to do deep, engaging solo hobbies by themselves"},
        {"count": 150, "audience": "a broad, evenly spread out general audience with diverse interests and varied demographics"}
    ]

    print(f"🚀 Starting Auto-Populate Pipeline with Demographic Splits")
    print("-" * 50)

    for b in batches:
        target_count = b['count']
        audience = b['audience']
        print(f"\n🎯 Processing Demographic: {audience} (Target: {target_count} activities)")
        
        BATCH_SIZE = 50
        remaining = target_count
        
        while remaining > 0:
            current_batch = min(BATCH_SIZE, remaining)
            print(f"\n🧠 Generating batch of {current_batch} activities ({remaining} remaining in this demographic)...")
            
            try:
                generate_activities.run_pipeline(count=current_batch, category_filter=None, target_audience=audience, dry_run=False)
            except Exception as e:
                print(f"⚠️ Encountered an error during batch generation: {e}")
                print("⏳ Waiting 10 seconds before resuming next batch to let the API cool down...")
                time.sleep(10)
                
            remaining -= current_batch

    print("\n" + "-" * 50)
    
    print("☁️ STEP 2: Syncing all activities to Supabase...")
    seed_supabase.SUPABASE_URL = supabase_url.rstrip('/')
    seed_supabase.SUPABASE_KEY = supabase_service_key
    
    try:
        seed_supabase.upload_activities()
        print("✅ Sync complete!")
    except Exception as e:
        print(f"❌ Failed to sync to Supabase: {e}")

if __name__ == "__main__":
    main()
