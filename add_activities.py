import json
import os

new_activities = [
    {
        "id": "underground_clubbing",
        "name": "Underground Clubbing",
        "category": "Social/Nightlife",
        "subcategory": "Music & Dance",
        "shortDescription": "Immerse yourself in heavy electronic music and dancing in a dark, high-energy environment.",
        "hook": "Lose yourself in the rhythm and anonymous collective energy of a crowd.",
        "dimensions": {
            "sociality": 0.9,
            "structure": -0.8,
            "physicality": 0.8,
            "expression": 0.7,
            "environment": -0.6,
            "barrier": -0.2
        },
        "practicalConstraints": {
            "startCost": "$20-40 (cover + drinks)",
            "ongoingCost": "Variable",
            "timePerSession": "4-6 hours",
            "equipmentNeeded": "None",
            "spaceRequired": "Club/Warehouse",
            "locationDependency": "high",
            "scheduleFlexibility": "low (weekend nights)"
        },
        "progression": {
            "learningCurve": "low",
            "skillCeiling": "low",
            "timeToFirstReward": "Immediate",
            "progressionClarity": "low",
            "beginnerFriendliness": "moderate",
            "masteryPotential": "low"
        },
        "experiment": {
            "smallestStep": "Find a local electronic music venue on Resident Advisor and buy a ticket for this Friday.",
            "whatSuccessFeelsLike": "Feeling the bass in your chest and dancing without caring who is watching.",
            "whatToNotice": "Notice if the loud, chaotic environment feels overwhelming or liberating.",
            "commonTrap": "Going with a large group of hesitant friends. Try going with one person who already loves it, or go alone."
        }
    },
    {
        "id": "improv_comedy",
        "name": "Improv Comedy Class",
        "category": "Performing Arts",
        "subcategory": "Comedy",
        "shortDescription": "Learn to perform unscripted scenes by actively listening and agreeing with your scene partners.",
        "hook": "A masterclass in letting go of control, being present, and failing joyfully.",
        "dimensions": {
            "sociality": 0.9,
            "structure": -0.5,
            "physicality": 0.4,
            "expression": 0.9,
            "environment": -0.8,
            "barrier": 0.8
        },
        "practicalConstraints": {
            "startCost": "$200-400 (8-week class)",
            "ongoingCost": "Variable",
            "timePerSession": "3 hours",
            "equipmentNeeded": "None",
            "spaceRequired": "Studio",
            "locationDependency": "high",
            "scheduleFlexibility": "low"
        },
        "progression": {
            "learningCurve": "steep (psychologically)",
            "skillCeiling": "very high",
            "timeToFirstReward": "First class laughs",
            "progressionClarity": "moderate",
            "beginnerFriendliness": "high (everyone is scared)",
            "masteryPotential": "high"
        },
        "experiment": {
            "smallestStep": "Sign up for a one-off 2-hour 'intro to improv' drop-in class.",
            "whatSuccessFeelsLike": "Saying the first stupid thing that comes to mind and realizing nobody judges you.",
            "whatToNotice": "Notice how much energy it takes to 'yes, and' instead of blocking ideas.",
            "commonTrap": "Trying to be 'funny'. The best improv comes from reacting honestly, not making jokes."
        }
    },
    {
        "id": "solo_fine_dining",
        "name": "Solo Fine Dining",
        "category": "Culinary/Lifestyle",
        "subcategory": "Dining",
        "shortDescription": "Take yourself out to a high-end restaurant and eat a multi-course meal alone.",
        "hook": "Transform the anxiety of eating alone into a luxurious act of self-care and mindfulness.",
        "dimensions": {
            "sociality": -0.8,
            "structure": 0.6,
            "physicality": -0.5,
            "expression": -0.2,
            "environment": -0.4,
            "barrier": 0.6
        },
        "practicalConstraints": {
            "startCost": "$100-300",
            "ongoingCost": "Variable",
            "timePerSession": "2 hours",
            "equipmentNeeded": "Nice clothes",
            "spaceRequired": "Restaurant",
            "locationDependency": "moderate",
            "scheduleFlexibility": "moderate"
        },
        "progression": {
            "learningCurve": "low",
            "skillCeiling": "low",
            "timeToFirstReward": "Immediate",
            "progressionClarity": "low",
            "beginnerFriendliness": "low (psychologically intimidating)",
            "masteryPotential": "low"
        },
        "experiment": {
            "smallestStep": "Book a table for one at a highly-rated restaurant and leave your phone in your pocket.",
            "whatSuccessFeelsLike": "Feeling comfortable being perceived alone while savoring incredible flavors.",
            "whatToNotice": "Notice the urge to pull out your phone, and instead direct your attention to the ambiance and food.",
            "commonTrap": "Sitting at the bar staring at a screen. Get a table and fully engage with the experience."
        }
    },
    {
        "id": "standup_open_mic",
        "name": "Standup Open Mic",
        "category": "Performing Arts",
        "subcategory": "Comedy",
        "shortDescription": "Write 3 minutes of jokes and perform them in front of a live, usually apathetic, audience.",
        "hook": "Conquer the ultimate fear of public speaking while turning your pain into punchlines.",
        "dimensions": {
            "sociality": 0.6,
            "structure": 0.5,
            "physicality": -0.2,
            "expression": 1.0,
            "environment": -0.7,
            "barrier": 1.0
        },
        "practicalConstraints": {
            "startCost": "$0-5 (sometimes a drink minimum)",
            "ongoingCost": "Minimal",
            "timePerSession": "2-3 hours (mostly waiting)",
            "equipmentNeeded": "Notebook",
            "spaceRequired": "Bar/Club",
            "locationDependency": "high",
            "scheduleFlexibility": "low"
        },
        "progression": {
            "learningCurve": "very steep",
            "skillCeiling": "very high",
            "timeToFirstReward": "First laugh",
            "progressionClarity": "moderate",
            "beginnerFriendliness": "very low",
            "masteryPotential": "high"
        },
        "experiment": {
            "smallestStep": "Write out one funny story and sign up for a local open mic night.",
            "whatSuccessFeelsLike": "Getting off stage having survived, regardless of whether anyone laughed.",
            "whatToNotice": "Notice the adrenaline dump before and after holding the microphone.",
            "commonTrap": "Expecting to kill on your first night. Expect to bomb, it's a rite of passage."
        }
    },
    {
        "id": "sensory_deprivation",
        "name": "Sensory Deprivation Tank",
        "category": "Wellness/Introspection",
        "subcategory": "Meditation",
        "shortDescription": "Float in pitch black, silent, body-temperature salt water for 60-90 minutes.",
        "hook": "Forced, absolute disconnection from the external world to explore your own mind.",
        "dimensions": {
            "sociality": -1.0,
            "structure": -0.8,
            "physicality": -0.8,
            "expression": -0.6,
            "environment": -1.0,
            "barrier": 0.5
        },
        "practicalConstraints": {
            "startCost": "$50-90",
            "ongoingCost": "$50-90/session",
            "timePerSession": "1.5 hours",
            "equipmentNeeded": "None",
            "spaceRequired": "Float center",
            "locationDependency": "high",
            "scheduleFlexibility": "moderate"
        },
        "progression": {
            "learningCurve": "moderate (mental)",
            "skillCeiling": "moderate",
            "timeToFirstReward": "First session",
            "progressionClarity": "low",
            "beginnerFriendliness": "moderate",
            "masteryPotential": "moderate"
        },
        "experiment": {
            "smallestStep": "Book a 60-minute float session at a local spa.",
            "whatSuccessFeelsLike": "Losing track of where your body ends and the water begins.",
            "whatToNotice": "Notice how your brain invents thoughts or sounds when deprived of external stimuli.",
            "commonTrap": "Getting out early because you feel restless. Push through the initial boredom."
        }
    }
]

file_path = "c:/Users/SJ/Documents/antigravity/serene-curie/data/activities.json"
try:
    with open(file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    # check if they already exist
    existing_ids = set(act['id'] for act in data)
    added = 0
    for new_act in new_activities:
        if new_act['id'] not in existing_ids:
            data.append(new_act)
            added += 1
            
    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2)
    print(f"Added {added} extreme activities.")
except Exception as e:
    print(f"Error: {e}")
