"""
Fallow Content Pipeline
=======================
Generates new activity entries for the Fallow database using the Gemini API.

Usage:
    python pipeline/generate_activities.py --count 20
    python pipeline/generate_activities.py --count 10 --category "Culinary"
    python pipeline/generate_activities.py --count 5 --dry-run

The script:
  1. Loads the existing database to avoid duplicates.
  2. Asks Gemini for a batch of novel activity IDEAS (names only).
  3. For each idea, asks Gemini to produce the full structured JSON entry.
  4. Validates every entry against the schema.
  5. Appends valid entries to activities.json.
"""

import argparse
import json
import os
import re
import sys
import time
import requests

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")
if not GEMINI_API_KEY:
    sys.exit("Set GEMINI_API_KEY or GOOGLE_API_KEY environment variable first.")

MODEL = "gemini-flash-latest"
API_URL = f"https://generativelanguage.googleapis.com/v1beta/models/{MODEL}:generateContent?key={GEMINI_API_KEY}"

DB_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "activities.json")

# ---------------------------------------------------------------------------
# Schema validation
# ---------------------------------------------------------------------------

REQUIRED_TOP_KEYS = {
    "id", "name", "category", "subcategory", "shortDescription", "hook",
    "dimensions", "practicalConstraints", "progression", "socialProfile",
    "experiment", "tags"
}

DIMENSION_KEYS = {"sociality", "structure", "physicality", "expression", "environment", "barrier"}

CONSTRAINT_KEYS = {
    "startCost", "ongoingCost", "timePerSession", "equipmentNeeded",
    "spaceRequired", "locationDependency", "scheduleFlexibility"
}

PROGRESSION_KEYS = {
    "learningCurve", "skillCeiling", "timeToFirstReward",
    "progressionClarity", "beginnerFriendly", "masteryPotential"
}

SOCIAL_KEYS = {
    "anxietyBurden", "performanceAnxiety", "failureVisibility",
    "communityStrength", "beginnerWelcome"
}

EXPERIMENT_KEYS = {
    "smallestStep", "firstCost", "firstTime", "soloFriendly",
    "whatSuccessFeelsLike", "commonBeginnerMistake", "nextStep"
}


def validate_entry(entry):
    """Returns (is_valid, list_of_issues)."""
    issues = []

    # Top-level keys
    missing = REQUIRED_TOP_KEYS - set(entry.keys())
    if missing:
        issues.append(f"Missing top-level keys: {missing}")

    # Dimensions
    dims = entry.get("dimensions", {})
    dim_missing = DIMENSION_KEYS - set(dims.keys())
    if dim_missing:
        issues.append(f"Missing dimension keys: {dim_missing}")
    for k, v in dims.items():
        if not isinstance(v, (int, float)):
            issues.append(f"Dimension '{k}' is not a number: {v}")
        elif not (-1.0 <= v <= 1.0):
            issues.append(f"Dimension '{k}' out of range [-1, 1]: {v}")

    # Sub-objects
    for label, required, key in [
        ("practicalConstraints", CONSTRAINT_KEYS, "practicalConstraints"),
        ("progression", PROGRESSION_KEYS, "progression"),
        ("socialProfile", SOCIAL_KEYS, "socialProfile"),
        ("experiment", EXPERIMENT_KEYS, "experiment"),
    ]:
        sub = entry.get(key, {})
        sub_missing = required - set(sub.keys())
        if sub_missing:
            issues.append(f"Missing {label} keys: {sub_missing}")

    # Tags should be a list
    tags = entry.get("tags", None)
    if not isinstance(tags, list) or len(tags) == 0:
        issues.append("tags must be a non-empty list")

    return (len(issues) == 0, issues)


# ---------------------------------------------------------------------------
# Gemini helpers
# ---------------------------------------------------------------------------

def call_gemini(prompt, temperature=0.8, max_tokens=8192):
    """Call the Gemini REST API and return the text response."""
    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "temperature": temperature,
            "maxOutputTokens": max_tokens,
        }
    }
    for attempt in range(3):
        try:
            resp = requests.post(API_URL, json=payload, timeout=120)
            if resp.status_code == 429:
                wait = 2 ** (attempt + 1)
                print(f"  Rate limited, waiting {wait}s...")
                time.sleep(wait)
                continue
            resp.raise_for_status()
            data = resp.json()
            return data["candidates"][0]["content"]["parts"][0]["text"]
        except Exception as e:
            if attempt < 2:
                print(f"  Retrying ({attempt+1}/3): {e}")
                time.sleep(2)
            else:
                raise
    return None


def extract_json(text):
    """Pull a JSON array or object out of a markdown-wrapped LLM response."""
    # Try to find ```json ... ``` blocks first
    match = re.search(r"```(?:json)?\s*\n?([\s\S]*?)```", text)
    if match:
        text = match.group(1).strip()

    # Try parsing as-is
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass

    # Try to find array or object boundaries
    for start_char, end_char in [("[", "]"), ("{", "}")]:
        start = text.find(start_char)
        end = text.rfind(end_char)
        if start != -1 and end != -1 and end > start:
            try:
                return json.loads(text[start:end+1])
            except json.JSONDecodeError:
                continue

    return None


# ---------------------------------------------------------------------------
# Pipeline steps
# ---------------------------------------------------------------------------

CATEGORIES = [
    "Physical/Outdoor", "Creative/Making", "Intellectual/Analytical",
    "Social/Performative", "Technical/Building", "Culinary/Lifestyle",
    "Niche/Unexpected", "Performing Arts", "Wellness/Introspection",
    "Collecting/Curating", "Nature/Environmental", "Digital/Creative"
]


def generate_idea_list(existing_names, count, category_filter=None):
    """Ask Gemini to brainstorm activity names we don't already have."""
    cat_clause = ""
    if category_filter:
        cat_clause = f"Focus specifically on the '{category_filter}' category."

    prompt = f"""You are a hobby and activity researcher for Fallow, a product that helps people discover activities they'd genuinely enjoy.

We already have these {len(existing_names)} activities in our database:
{json.dumps(sorted(existing_names), indent=2)}

Generate exactly {count} NEW activity ideas that are NOT in the list above.

Requirements:
- Prioritize niche, surprising, or lesser-known activities that most people wouldn't think of on their own.
- Include a mix across these categories: {', '.join(CATEGORIES)}
- Each activity must be a real, concrete thing a person could start doing.
- No generic entries like "Volunteering" or "Reading" — be specific (e.g., "Mycology Field Walks" not "Nature Walks").
- No activities that are just slight variations of ones we already have.
{cat_clause}

Return ONLY a JSON array of strings (activity names), nothing else.
Example: ["Sashiko Stitching", "Competitive Yo-Yo", "Sound Design"]"""

    print(f"Brainstorming {count} activity ideas...")
    text = call_gemini(prompt, temperature=0.9)
    ideas = extract_json(text)
    if not isinstance(ideas, list):
        print(f"  Failed to parse idea list, raw response:\n{text[:500]}")
        return []

    # Filter out anything that matches existing names (case-insensitive)
    existing_lower = {n.lower() for n in existing_names}
    filtered = [name for name in ideas if name.lower() not in existing_lower]
    print(f"  Got {len(filtered)} new ideas (filtered {len(ideas) - len(filtered)} duplicates)")
    return filtered


def generate_full_entry(activity_name, existing_entry_example):
    """Ask Gemini to produce the full JSON schema for a single activity."""
    prompt = f"""You are a hobby researcher creating a structured database entry for the activity: "{activity_name}"

Here is an example of a completed entry for reference (use this exact schema):

{json.dumps(existing_entry_example, indent=2)}

Now create a complete entry for "{activity_name}" following these rules:

1. "id": lowercase, hyphenated version of the name (e.g., "sashiko-stitching")
2. "category": Choose from: {', '.join(CATEGORIES)}
3. "dimensions": Each value MUST be a float between -1.0 and 1.0:
   - sociality: -1 (deeply solo) to 1 (requires others)
   - structure: -1 (freeform/improvised) to 1 (rule-based/systematic)
   - physicality: -1 (purely mental) to 1 (intensely physical)
   - expression: -1 (analytical/consuming) to 1 (creative/producing)
   - environment: -1 (indoor) to 1 (outdoor)
   - barrier: -1 (free, no equipment) to 1 (expensive, gear-heavy)
4. "hook": A single punchy sentence that makes someone curious. Write it like a friend telling you about it, not like marketing copy.
5. "experiment.smallestStep": The absolute lowest-effort way to try this for the first time.
6. "experiment.whatSuccessFeelsLike": A specific sensory/emotional moment, not a generic statement.
7. "tags": 3-6 lowercase descriptive tags.
8. All string fields should be written in plain, direct language. No exclamation marks, no hype.

Return ONLY the JSON object, no markdown wrapping, no explanation."""

    text = call_gemini(prompt, temperature=0.6)
    entry = extract_json(text)
    if not isinstance(entry, dict):
        print(f"    Failed to parse entry for '{activity_name}'")
        return None
    return entry


def run_pipeline(count=20, category_filter=None, dry_run=False):
    """Main pipeline: brainstorm ideas, generate entries, validate, save."""
    # Load existing database
    with open(DB_PATH, "r", encoding="utf-8") as f:
        existing = json.load(f)

    existing_names = [a["name"] for a in existing]
    existing_ids = {a["id"] for a in existing}
    example_entry = existing[0]  # Use bouldering as the schema reference

    print(f"Database currently has {len(existing)} activities.\n")

    # Step 1: Brainstorm ideas
    ideas = generate_idea_list(existing_names, count, category_filter)
    if not ideas:
        print("No new ideas generated. Exiting.")
        return

    # Step 2: Generate full entries
    new_entries = []
    for i, name in enumerate(ideas):
        print(f"  [{i+1}/{len(ideas)}] Generating entry for: {name}")
        entry = generate_full_entry(name, example_entry)
        if entry is None:
            continue

        # Validate
        is_valid, issues = validate_entry(entry)
        if not is_valid:
            print(f"    Validation failed for '{name}':")
            for issue in issues:
                print(f"      - {issue}")
            continue

        # Check for duplicate IDs
        entry_id = entry.get("id", "")
        if entry_id in existing_ids:
            print(f"    Skipping duplicate ID: {entry_id}")
            continue

        existing_ids.add(entry_id)
        new_entries.append(entry)
        print(f"    Valid entry created.")

        # Small delay to avoid rate limits
        time.sleep(1)

    # Step 3: Report
    print(f"\nGenerated {len(new_entries)} valid entries out of {len(ideas)} ideas.")

    if dry_run:
        print("\n[DRY RUN] Would add these activities:")
        for e in new_entries:
            dims = e.get("dimensions", {})
            dim_str = ", ".join(f"{k}={v:.1f}" for k, v in dims.items())
            print(f"  - {e['name']} [{e['category']}] ({dim_str})")
        return

    if not new_entries:
        print("No valid entries to save.")
        return

    # Step 4: Append to database
    existing.extend(new_entries)
    with open(DB_PATH, "w", encoding="utf-8") as f:
        json.dump(existing, f, indent=2, ensure_ascii=False)

    print(f"Saved. Database now has {len(existing)} activities.")

    # Print summary
    print("\nNew activities added:")
    for e in new_entries:
        print(f"  + {e['name']} [{e['category']}]")


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Fallow Content Pipeline: generate new activities using Gemini")
    parser.add_argument("--count", type=int, default=20, help="Number of activities to generate (default: 20)")
    parser.add_argument("--category", type=str, default=None, help="Focus on a specific category")
    parser.add_argument("--dry-run", action="store_true", help="Preview without saving to the database")
    args = parser.parse_args()

    run_pipeline(count=args.count, category_filter=args.category, dry_run=args.dry_run)
