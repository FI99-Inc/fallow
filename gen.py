import json
import os

MUST_INCLUDE = [
  {
    "id": "bouldering",
    "name": "Bouldering",
    "category": "Physical/Outdoor",
    "subcategory": "Climbing",
    "shortDescription": "Climb short, challenging routes without ropes over safety mats.",
    "hook": "It's a physical puzzle where your body is the key.",
    "dimensions": { "sociality": 0.6, "structure": 0.2, "physicality": 0.9, "expression": 0.1, "environment": 0.0, "barrier": 0.2 },
    "practicalConstraints": { "startCost": "$20-30 (day pass & shoes)", "ongoingCost": "$70-100/month", "timePerSession": "2 hours", "equipmentNeeded": "Climbing shoes, chalk", "spaceRequired": "Climbing gym", "locationDependency": "high", "scheduleFlexibility": "high" },
    "progression": { "learningCurve": "moderate", "skillCeiling": "very high", "timeToFirstReward": "First session", "progressionClarity": "high", "beginnerFriendly": True, "masteryPotential": "very high" },
    "socialProfile": { "anxietyBurden": "low", "performanceAnxiety": "medium", "failureVisibility": "high", "communityStrength": "strong", "beginnerWelcome": "very welcoming" },
    "experiment": {
      "smallestStep": "Rent shoes and climb V0s (the easiest routes) until your forearms give out.",
      "firstCost": "$25", "firstTime": "1.5 hours", "soloFriendly": True,
      "whatSuccessFeelsLike": "Your arms are pumped, but you finally figured out how to shift your hips to reach the top hold.",
      "commonBeginnerMistake": "Using only arms to pull up instead of pushing with legs.",
      "nextStep": "Go twice a week for a month to build tendon strength."
    },
    "surprisingAdjacencies": [
      { "activityId": "chess", "sharedTraits": ["problem solving", "sequence planning"], "explanation": "Both require looking ahead and mapping a sequence of moves before executing." },
      { "activityId": "lockpicking", "sharedTraits": ["tactile feedback", "puzzle solving"], "explanation": "Finding the right hold position is like feeling for the binding pin." }
    ],
    "tags": ["physical", "puzzle", "social", "gym"]
  },
  {
    "id": "wheel-throwing",
    "name": "Wheel Throwing",
    "category": "Making",
    "subcategory": "Ceramics",
    "shortDescription": "Shape clay on a spinning wheel into bowls, cups, and vessels.",
    "hook": "The clay fights back, and winning feels incredible.",
    "dimensions": { "sociality": -0.3, "structure": 0.4, "physicality": 0.3, "expression": 0.6, "environment": -0.8, "barrier": 0.3 },
    "practicalConstraints": { "startCost": "$30-60 (single class)", "ongoingCost": "$50-150/month (studio membership)", "timePerSession": "2-3 hours", "equipmentNeeded": "None to start (studio provides)", "spaceRequired": "Studio", "locationDependency": "medium", "scheduleFlexibility": "medium" },
    "progression": { "learningCurve": "steep", "skillCeiling": "very high", "timeToFirstReward": "First session", "progressionClarity": "high", "beginnerFriendly": True, "masteryPotential": "very high" },
    "socialProfile": { "anxietyBurden": "low", "performanceAnxiety": "low", "failureVisibility": "low", "communityStrength": "strong", "beginnerWelcome": "very welcoming" },
    "experiment": {
      "smallestStep": "Book a single beginner wheel-throwing class at a local pottery studio. Pay attention to how the process feels.",
      "firstCost": "$30-60", "firstTime": "2-3 hours", "soloFriendly": True,
      "whatSuccessFeelsLike": "You lose track of time and think about the clay the next day.",
      "commonBeginnerMistake": "Judging the output instead of paying attention to the process.",
      "nextStep": "Sign up for a 4-week beginner series."
    },
    "surprisingAdjacencies": [
      { "activityId": "sourdough-baking", "sharedTraits": ["tactile process", "managing a living material"], "explanation": "Both involve working with unpredictable material." }
    ],
    "tags": ["tactile", "messy", "meditative"]
  },
  {
    "id": "lockpicking",
    "name": "Lockpicking (Locksport)",
    "category": "Intellectual/Analytical",
    "subcategory": "Mechanics",
    "shortDescription": "Exploit mechanical vulnerabilities to open locks without the original key.",
    "hook": "Feel the invisible click of bypassing a physical security system.",
    "dimensions": { "sociality": -0.8, "structure": 0.6, "physicality": -0.4, "expression": -0.2, "environment": -0.9, "barrier": -0.5 },
    "practicalConstraints": { "startCost": "$20", "ongoingCost": "$10/month (buying locks)", "timePerSession": "20-60 mins", "equipmentNeeded": "Basic pick set, clear practice lock", "spaceRequired": "Desk", "locationDependency": "low", "scheduleFlexibility": "high" },
    "progression": { "learningCurve": "moderate", "skillCeiling": "high", "timeToFirstReward": "First hour", "progressionClarity": "high", "beginnerFriendly": True, "masteryPotential": "high" },
    "socialProfile": { "anxietyBurden": "low", "performanceAnxiety": "low", "failureVisibility": "low", "communityStrength": "medium", "beginnerWelcome": "welcoming" },
    "experiment": {
      "smallestStep": "Buy a $20 starter kit with a transparent padlock and pick it while watching TV.",
      "firstCost": "$20", "firstTime": "30 mins", "soloFriendly": True,
      "whatSuccessFeelsLike": "The cylinder suddenly gives way and turns. It's an instant dopamine hit.",
      "commonBeginnerMistake": "Applying too much tension.",
      "nextStep": "Buy a standard Master Lock No. 3 and pick it blind."
    },
    "surprisingAdjacencies": [
      { "activityId": "bouldering", "sharedTraits": ["problem solving", "tactile"], "explanation": "You are feeling your way through an unseen puzzle." }
    ],
    "tags": ["tactile", "puzzle", "indoor"]
  },
  {
    "id": "sourdough-baking",
    "name": "Sourdough Baking",
    "category": "Creative/Making",
    "subcategory": "Culinary",
    "shortDescription": "Bake bread using wild yeast and long fermentation.",
    "hook": "You are literally keeping a microbial pet alive to make delicious bread.",
    "dimensions": { "sociality": -0.5, "structure": 0.8, "physicality": -0.1, "expression": 0.5, "environment": -0.8, "barrier": -0.4 },
    "practicalConstraints": { "startCost": "$20", "ongoingCost": "$5/week", "timePerSession": "30 mins active, hours waiting", "equipmentNeeded": "Flour, water, dutch oven", "spaceRequired": "Kitchen", "locationDependency": "low", "scheduleFlexibility": "low" },
    "progression": { "learningCurve": "steep", "skillCeiling": "high", "timeToFirstReward": "1 week", "progressionClarity": "medium", "beginnerFriendly": True, "masteryPotential": "high" },
    "socialProfile": { "anxietyBurden": "low", "performanceAnxiety": "low", "failureVisibility": "medium", "communityStrength": "strong", "beginnerWelcome": "welcoming" },
    "experiment": {
      "smallestStep": "Create a sourdough starter from just flour and water and feed it for 7 days.",
      "firstCost": "$5", "firstTime": "10 mins/day", "soloFriendly": True,
      "whatSuccessFeelsLike": "Seeing bubbles and smelling that distinct tangy aroma.",
      "commonBeginnerMistake": "Worrying too much about exact temperatures instead of observing the dough.",
      "nextStep": "Bake your first crusty boule."
    },
    "surprisingAdjacencies": [
      { "activityId": "aquascaping", "sharedTraits": ["managing an ecosystem"], "explanation": "Both require balancing a delicate biological system." }
    ],
    "tags": ["culinary", "patience", "science"]
  },
  {
    "id": "miniature-painting",
    "name": "Miniature Painting",
    "category": "Creative/Making",
    "subcategory": "Art",
    "shortDescription": "Paint highly detailed small-scale figures.",
    "hook": "Bring tiny grey plastic heroes and monsters to vibrant life.",
    "dimensions": { "sociality": -0.6, "structure": 0.3, "physicality": -0.8, "expression": 0.8, "environment": -0.9, "barrier": 0.1 },
    "practicalConstraints": { "startCost": "$35", "ongoingCost": "$15/month", "timePerSession": "1-3 hours", "equipmentNeeded": "Brushes, acrylic paints, miniatures", "spaceRequired": "Desk", "locationDependency": "low", "scheduleFlexibility": "high" },
    "progression": { "learningCurve": "moderate", "skillCeiling": "very high", "timeToFirstReward": "First session", "progressionClarity": "high", "beginnerFriendly": True, "masteryPotential": "very high" },
    "socialProfile": { "anxietyBurden": "low", "performanceAnxiety": "low", "failureVisibility": "low", "communityStrength": "strong", "beginnerWelcome": "very welcoming" },
    "experiment": {
      "smallestStep": "Buy a beginner paint set with 3 space marines and follow a 15-minute YouTube tutorial.",
      "firstCost": "$35", "firstTime": "2 hours", "soloFriendly": True,
      "whatSuccessFeelsLike": "Applying a 'wash' and watching all the details suddenly pop out like magic.",
      "commonBeginnerMistake": "Not thinning your paints with water.",
      "nextStep": "Learn drybrushing and edge highlighting."
    },
    "surprisingAdjacencies": [
      { "activityId": "calligraphy", "sharedTraits": ["brush control", "focus"], "explanation": "Fine motor skills and focus on minute details." }
    ],
    "tags": ["art", "focus", "tabletop"]
  },
  {
    "id": "birdwatching",
    "name": "Birdwatching",
    "category": "Intellectual/Analytical",
    "subcategory": "Nature",
    "shortDescription": "Identify and observe wild birds in their natural habitats.",
    "hook": "Turn your neighborhood into a real-life Pokémon Snap.",
    "dimensions": { "sociality": 0.1, "structure": 0.5, "physicality": 0.2, "expression": -0.5, "environment": 0.9, "barrier": -0.3 },
    "practicalConstraints": { "startCost": "$0-50", "ongoingCost": "$0", "timePerSession": "1-2 hours", "equipmentNeeded": "Binoculars (optional initially), Merlin Bird ID app", "spaceRequired": "Outdoors", "locationDependency": "low", "scheduleFlexibility": "high" },
    "progression": { "learningCurve": "low", "skillCeiling": "high", "timeToFirstReward": "Instant", "progressionClarity": "high", "beginnerFriendly": True, "masteryPotential": "high" },
    "socialProfile": { "anxietyBurden": "low", "performanceAnxiety": "low", "failureVisibility": "low", "communityStrength": "medium", "beginnerWelcome": "welcoming" },
    "experiment": {
      "smallestStep": "Download the Merlin Bird ID app, sit in a park for 20 minutes, and use Sound ID to identify 3 birds.",
      "firstCost": "$0", "firstTime": "20 mins", "soloFriendly": True,
      "whatSuccessFeelsLike": "Realizing you can name the invisible singers in the trees.",
      "commonBeginnerMistake": "Trying to see the birds before listening for them.",
      "nextStep": "Buy decent binoculars and visit a local nature reserve."
    },
    "surprisingAdjacencies": [
      { "activityId": "ham-radio", "sharedTraits": ["signal hunting", "patience"], "explanation": "Both involve tuning into signals in the noise to discover distant entities." }
    ],
    "tags": ["nature", "collection", "peaceful"]
  },
  {
    "id": "speedcubing",
    "name": "Speedcubing",
    "category": "Intellectual/Analytical",
    "subcategory": "Puzzles",
    "shortDescription": "Solve a Rubik's cube as fast as humanly possible.",
    "hook": "Master algorithmic thinking to bend a colorful cube to your will in seconds.",
    "dimensions": { "sociality": -0.4, "structure": 0.9, "physicality": -0.6, "expression": -0.5, "environment": -0.8, "barrier": -0.7 },
    "practicalConstraints": { "startCost": "$10", "ongoingCost": "$0", "timePerSession": "15 mins", "equipmentNeeded": "Magnetic speed cube", "spaceRequired": "Hands", "locationDependency": "low", "scheduleFlexibility": "high" },
    "progression": { "learningCurve": "moderate", "skillCeiling": "very high", "timeToFirstReward": "Days", "progressionClarity": "very high", "beginnerFriendly": True, "masteryPotential": "very high" },
    "socialProfile": { "anxietyBurden": "low", "performanceAnxiety": "medium", "failureVisibility": "low", "communityStrength": "strong", "beginnerWelcome": "welcoming" },
    "experiment": {
      "smallestStep": "Buy a $10 magnetic cube and learn the 'white cross' stage via J Perm on YouTube.",
      "firstCost": "$10", "firstTime": "1 hour", "soloFriendly": True,
      "whatSuccessFeelsLike": "Solving the whole cube for the first time without looking at the cheat sheet.",
      "commonBeginnerMistake": "Trying to memorize moves visually instead of understanding how pieces move.",
      "nextStep": "Learn full CFOP method."
    },
    "surprisingAdjacencies": [
      { "activityId": "competitive-programming", "sharedTraits": ["algorithms", "optimization"], "explanation": "Applying specific algorithms to solve state problems efficiently." }
    ],
    "tags": ["puzzle", "fast", "algorithms"]
  },
  {
    "id": "improv-comedy",
    "name": "Improv Comedy",
    "category": "Social/Performative",
    "subcategory": "Theater",
    "shortDescription": "Create unscripted scenes and characters on the spot with a group.",
    "hook": "Learn to trust your brain and embrace failure in real time.",
    "dimensions": { "sociality": 0.9, "structure": -0.6, "physicality": 0.4, "expression": 0.9, "environment": -0.5, "barrier": 0.1 },
    "practicalConstraints": { "startCost": "$20-40", "ongoingCost": "$200/8-week class", "timePerSession": "2-3 hours", "equipmentNeeded": "None", "spaceRequired": "Classroom", "locationDependency": "high", "scheduleFlexibility": "low" },
    "progression": { "learningCurve": "steep", "skillCeiling": "high", "timeToFirstReward": "First class", "progressionClarity": "low", "beginnerFriendly": True, "masteryPotential": "high" },
    "socialProfile": { "anxietyBurden": "high", "performanceAnxiety": "high", "failureVisibility": "high", "communityStrength": "very strong", "beginnerWelcome": "very welcoming" },
    "experiment": {
      "smallestStep": "Attend a single beginner drop-in workshop. Commit to just saying 'Yes, and...' to whatever happens.",
      "firstCost": "$20", "firstTime": "2 hours", "soloFriendly": False,
      "whatSuccessFeelsLike": "Realizing you don't have to be funny, just honest and responsive.",
      "commonBeginnerMistake": "Trying to tell jokes instead of playing the reality of the scene.",
      "nextStep": "Enroll in Improv 101."
    },
    "surprisingAdjacencies": [
      { "activityId": "board-game-design", "sharedTraits": ["mechanics testing", "human interaction"], "explanation": "Testing how people react to unexpected situations and rules." }
    ],
    "tags": ["social", "funny", "vulnerable"]
  },
  {
    "id": "bookbinding",
    "name": "Bookbinding",
    "category": "Creative/Making",
    "subcategory": "Crafts",
    "shortDescription": "Sew and glue paper into beautiful, durable handmade books.",
    "hook": "Build the physical vessel for stories, using centuries-old techniques.",
    "dimensions": { "sociality": -0.7, "structure": 0.7, "physicality": -0.3, "expression": 0.5, "environment": -0.8, "barrier": -0.2 },
    "practicalConstraints": { "startCost": "$30", "ongoingCost": "$10/book", "timePerSession": "2-4 hours", "equipmentNeeded": "Awl, bone folder, thread, needle", "spaceRequired": "Desk", "locationDependency": "low", "scheduleFlexibility": "high" },
    "progression": { "learningCurve": "moderate", "skillCeiling": "high", "timeToFirstReward": "First book", "progressionClarity": "high", "beginnerFriendly": True, "masteryPotential": "high" },
    "socialProfile": { "anxietyBurden": "low", "performanceAnxiety": "low", "failureVisibility": "low", "communityStrength": "medium", "beginnerWelcome": "welcoming" },
    "experiment": {
      "smallestStep": "Follow a Sea Lemon tutorial to make a simple saddle-stitch notebook using printer paper.",
      "firstCost": "$10", "firstTime": "1 hour", "soloFriendly": True,
      "whatSuccessFeelsLike": "Holding a tight, flush spine that you stitched yourself.",
      "commonBeginnerMistake": "Not aligning the paper grain direction.",
      "nextStep": "Attempt a Coptic stitch journal with exposed spine."
    },
    "surprisingAdjacencies": [
      { "activityId": "woodworking", "sharedTraits": ["precision", "grain alignment", "glue-ups"], "explanation": "Similar respect for material properties and precision joinery." }
    ],
    "tags": ["craft", "paper", "historical"]
  },
  {
    "id": "urban-sketching",
    "name": "Urban Sketching",
    "category": "Creative/Making",
    "subcategory": "Art",
    "shortDescription": "Draw on location, capturing the world as you see it.",
    "hook": "Force yourself to actually look at the buildings and people you walk past every day.",
    "dimensions": { "sociality": 0.2, "structure": -0.4, "physicality": 0.1, "expression": 0.7, "environment": 0.7, "barrier": -0.6 },
    "practicalConstraints": { "startCost": "$20", "ongoingCost": "$0", "timePerSession": "30-90 mins", "equipmentNeeded": "Sketchbook, pen, watercolors", "spaceRequired": "A bench", "locationDependency": "low", "scheduleFlexibility": "high" },
    "progression": { "learningCurve": "moderate", "skillCeiling": "high", "timeToFirstReward": "First sketch", "progressionClarity": "medium", "beginnerFriendly": True, "masteryPotential": "high" },
    "socialProfile": { "anxietyBurden": "low", "performanceAnxiety": "medium", "failureVisibility": "low", "communityStrength": "strong", "beginnerWelcome": "welcoming" },
    "experiment": {
      "smallestStep": "Take a pen and notebook to a coffee shop and draw the counter for 15 minutes. No erasing.",
      "firstCost": "$5", "firstTime": "30 mins", "soloFriendly": True,
      "whatSuccessFeelsLike": "Entering a flow state and noticing architectural details you never saw before.",
      "commonBeginnerMistake": "Worrying about perfect perspective instead of capturing the vibe.",
      "nextStep": "Add a portable watercolor palette."
    },
    "surprisingAdjacencies": [
      { "activityId": "birdwatching", "sharedTraits": ["observation", "patience"], "explanation": "Both require sitting still and deeply observing your environment." }
    ],
    "tags": ["art", "travel", "observation"]
  },
  {
    "id": "aquascaping",
    "name": "Aquascaping",
    "category": "Creative/Making",
    "subcategory": "Nature",
    "shortDescription": "Arrange aquatic plants, rocks, and wood in an aesthetically pleasing aquarium.",
    "hook": "Paint a living underwater landscape that evolves over months.",
    "dimensions": { "sociality": -0.6, "structure": 0.5, "physicality": -0.2, "expression": 0.8, "environment": -0.7, "barrier": 0.5 },
    "practicalConstraints": { "startCost": "$150-300", "ongoingCost": "$10/month", "timePerSession": "1-2 hours weekly maintenance", "equipmentNeeded": "Tank, filter, light, substrate, plants", "spaceRequired": "Sturdy table", "locationDependency": "low", "scheduleFlexibility": "high" },
    "progression": { "learningCurve": "steep", "skillCeiling": "very high", "timeToFirstReward": "Planting day", "progressionClarity": "medium", "beginnerFriendly": False, "masteryPotential": "very high" },
    "socialProfile": { "anxietyBurden": "low", "performanceAnxiety": "low", "failureVisibility": "medium", "communityStrength": "medium", "beginnerWelcome": "welcoming" },
    "experiment": {
      "smallestStep": "Set up a 2-gallon planted jar (no fish, no filter) with cheap cuttings from a local fish store.",
      "firstCost": "$40", "firstTime": "2 hours", "soloFriendly": True,
      "whatSuccessFeelsLike": "Seeing the plants pearl (produce oxygen bubbles) under the light.",
      "commonBeginnerMistake": "Buying fish before the nitrogen cycle is established.",
      "nextStep": "Design a 10-gallon high-tech tank with CO2 injection."
    },
    "surprisingAdjacencies": [
      { "activityId": "bonsai", "sharedTraits": ["slow art", "living medium"], "explanation": "Both involve sculpting nature over long periods of time." }
    ],
    "tags": ["nature", "design", "slow"]
  },
  {
    "id": "mechanical-keyboards",
    "name": "Mechanical Keyboard Building",
    "category": "Technical/Building",
    "subcategory": "Electronics",
    "shortDescription": "Assemble, lube, and tune custom keyboards for perfect sound and feel.",
    "hook": "Turn the tool you use for 8 hours a day into a personalized acoustic masterpiece.",
    "dimensions": { "sociality": -0.5, "structure": 0.6, "physicality": -0.5, "expression": 0.6, "environment": -0.9, "barrier": 0.6 },
    "practicalConstraints": { "startCost": "$150-300", "ongoingCost": "Variable", "timePerSession": "2-4 hours", "equipmentNeeded": "Screwdriver, lube, switches, keycaps", "spaceRequired": "Desk", "locationDependency": "low", "scheduleFlexibility": "high" },
    "progression": { "learningCurve": "moderate", "skillCeiling": "high", "timeToFirstReward": "First typing test", "progressionClarity": "high", "beginnerFriendly": True, "masteryPotential": "high" },
    "socialProfile": { "anxietyBurden": "low", "performanceAnxiety": "low", "failureVisibility": "low", "communityStrength": "strong", "beginnerWelcome": "welcoming" },
    "experiment": {
      "smallestStep": "Buy a cheap hot-swappable keyboard and switch out a few keys to try different tactile feels.",
      "firstCost": "$50", "firstTime": "1 hour", "soloFriendly": True,
      "whatSuccessFeelsLike": "The deep, satisfying 'thock' sound when you hit the spacebar.",
      "commonBeginnerMistake": "Over-lubing the switches so they feel mushy.",
      "nextStep": "Build a custom board from scratch."
    },
    "surprisingAdjacencies": [
      { "activityId": "watchmaking", "sharedTraits": ["micro-mechanics", "tuning"], "explanation": "Both involve extreme attention to the tactile and acoustic properties of small mechanisms." }
    ],
    "tags": ["tech", "tactile", "expensive"]
  },
  {
    "id": "foraging",
    "name": "Foraging",
    "category": "Physical/Outdoor",
    "subcategory": "Nature",
    "shortDescription": "Identify and gather wild edible plants and mushrooms.",
    "hook": "The forest is a grocery store once you learn how to read it.",
    "dimensions": { "sociality": 0.0, "structure": -0.3, "physicality": 0.6, "expression": -0.2, "environment": 1.0, "barrier": -0.6 },
    "practicalConstraints": { "startCost": "$0-20", "ongoingCost": "$0", "timePerSession": "2-4 hours", "equipmentNeeded": "Field guide, basket", "spaceRequired": "Forest/Park", "locationDependency": "high", "scheduleFlexibility": "high" },
    "progression": { "learningCurve": "moderate", "skillCeiling": "very high", "timeToFirstReward": "First find", "progressionClarity": "medium", "beginnerFriendly": True, "masteryPotential": "high" },
    "socialProfile": { "anxietyBurden": "low", "performanceAnxiety": "low", "failureVisibility": "low", "communityStrength": "medium", "beginnerWelcome": "welcoming" },
    "experiment": {
      "smallestStep": "Walk a local trail to identify 3 common, easily recognizable wild edibles (like dandelions or wild garlic) without eating them.",
      "firstCost": "$15 (field guide)", "firstTime": "2 hours", "soloFriendly": True,
      "whatSuccessFeelsLike": "Spotting a patch of chanterelles hidden under the leaf litter.",
      "commonBeginnerMistake": "Eating something you are only 90% sure about.",
      "nextStep": "Join a local foraging walk led by an expert."
    },
    "surprisingAdjacencies": [
      { "activityId": "metal-detecting", "sharedTraits": ["treasure hunting", "scanning"], "explanation": "Searching a landscape for hidden value." }
    ],
    "tags": ["nature", "food", "walking"]
  },
  {
    "id": "fencing",
    "name": "Fencing",
    "category": "Physical/Outdoor",
    "subcategory": "Martial Arts",
    "shortDescription": "Compete in a fast-paced combat sport using bladed weapons.",
    "hook": "Physical chess at 100 miles per hour.",
    "dimensions": { "sociality": 0.5, "structure": 0.8, "physicality": 0.8, "expression": -0.1, "environment": -0.6, "barrier": 0.5 },
    "practicalConstraints": { "startCost": "$100-200 (class)", "ongoingCost": "$100/month", "timePerSession": "2 hours", "equipmentNeeded": "Fencing gear (usually rented first)", "spaceRequired": "Fencing club", "locationDependency": "high", "scheduleFlexibility": "low" },
    "progression": { "learningCurve": "steep", "skillCeiling": "very high", "timeToFirstReward": "First spar", "progressionClarity": "high", "beginnerFriendly": False, "masteryPotential": "very high" },
    "socialProfile": { "anxietyBurden": "medium", "performanceAnxiety": "high", "failureVisibility": "high", "communityStrength": "strong", "beginnerWelcome": "welcoming" },
    "experiment": {
      "smallestStep": "Take a 4-week intro class at a local club where gear is provided.",
      "firstCost": "$100", "firstTime": "1.5 hours", "soloFriendly": False,
      "whatSuccessFeelsLike": "Landing your first riposte by predicting your opponent's attack.",
      "commonBeginnerMistake": "Using only your arm instead of footwork to close distance.",
      "nextStep": "Buy your own mask and glove and start open bouting."
    },
    "surprisingAdjacencies": [
      { "activityId": "chess", "sharedTraits": ["strategy", "anticipation"], "explanation": "Setting up traps and reading the opponent's intentions." }
    ],
    "tags": ["sport", "combat", "fast"]
  },
  {
    "id": "ham-radio",
    "name": "Ham Radio",
    "category": "Technical/Building",
    "subcategory": "Communications",
    "shortDescription": "Operate amateur radio equipment to communicate globally.",
    "hook": "Bounce radio waves off the ionosphere to talk to someone across the ocean.",
    "dimensions": { "sociality": 0.4, "structure": 0.8, "physicality": -0.7, "expression": -0.3, "environment": -0.5, "barrier": 0.7 },
    "practicalConstraints": { "startCost": "$30-100", "ongoingCost": "$0", "timePerSession": "1-3 hours", "equipmentNeeded": "Transceiver, antenna, license", "spaceRequired": "Desk/Roof", "locationDependency": "low", "scheduleFlexibility": "high" },
    "progression": { "learningCurve": "steep", "skillCeiling": "high", "timeToFirstReward": "First contact", "progressionClarity": "high", "beginnerFriendly": False, "masteryPotential": "high" },
    "socialProfile": { "anxietyBurden": "low", "performanceAnxiety": "low", "failureVisibility": "low", "communityStrength": "very strong", "beginnerWelcome": "very welcoming" },
    "experiment": {
      "smallestStep": "Buy a $30 Baofeng radio and listen to local repeater traffic (no license needed to listen).",
      "firstCost": "$30", "firstTime": "1 hour", "soloFriendly": True,
      "whatSuccessFeelsLike": "Hearing a crackling voice from 500 miles away come through your handheld.",
      "commonBeginnerMistake": "Transmitting without a license.",
      "nextStep": "Study for and pass the Technician class license exam."
    },
    "surprisingAdjacencies": [
      { "activityId": "birdwatching", "sharedTraits": ["logging", "patience", "rare catches"], "explanation": "Both involve waiting patiently to observe rare or distant targets and logging them." }
    ],
    "tags": ["tech", "communication", "vintage"]
  },
  {
    "id": "calligraphy",
    "name": "Calligraphy",
    "category": "Creative/Making",
    "subcategory": "Art",
    "shortDescription": "The art of beautiful and expressive handwriting.",
    "hook": "Turn simple words into visual poetry through the mastery of the pen.",
    "dimensions": { "sociality": -0.7, "structure": 0.7, "physicality": -0.6, "expression": 0.8, "environment": -0.8, "barrier": -0.5 },
    "practicalConstraints": { "startCost": "$15-30", "ongoingCost": "$5/month", "timePerSession": "30-60 mins", "equipmentNeeded": "Dip pen, ink, practice paper", "spaceRequired": "Desk", "locationDependency": "low", "scheduleFlexibility": "high" },
    "progression": { "learningCurve": "moderate", "skillCeiling": "high", "timeToFirstReward": "First elegant letter", "progressionClarity": "high", "beginnerFriendly": True, "masteryPotential": "very high" },
    "socialProfile": { "anxietyBurden": "low", "performanceAnxiety": "low", "failureVisibility": "low", "communityStrength": "medium", "beginnerWelcome": "welcoming" },
    "experiment": {
      "smallestStep": "Buy a pilot parallel pen and trace a gothic alphabet worksheet for 30 minutes.",
      "firstCost": "$15", "firstTime": "30 mins", "soloFriendly": True,
      "whatSuccessFeelsLike": "The satisfying scratch of the nib and the perfect swell of a curved line.",
      "commonBeginnerMistake": "Holding the pen too tightly and cramping up.",
      "nextStep": "Learn copperplate script with a pointed nib."
    },
    "surprisingAdjacencies": [
      { "activityId": "fencing", "sharedTraits": ["fine motor control", "drill practice"], "explanation": "Both rely heavily on drilling specific angles and precise muscle memory." }
    ],
    "tags": ["art", "relaxing", "precise"]
  },
  {
    "id": "fpv-drones",
    "name": "FPV Drones",
    "category": "Technical/Building",
    "subcategory": "RC",
    "shortDescription": "Build and fly high-speed racing drones using virtual reality goggles.",
    "hook": "Experience out-of-body flight at 80mph.",
    "dimensions": { "sociality": 0.2, "structure": 0.3, "physicality": 0.1, "expression": 0.4, "environment": 0.8, "barrier": 0.8 },
    "practicalConstraints": { "startCost": "$200-300", "ongoingCost": "$50/month (parts)", "timePerSession": "1-2 hours", "equipmentNeeded": "Drone, radio, goggles", "spaceRequired": "Open field", "locationDependency": "medium", "scheduleFlexibility": "high" },
    "progression": { "learningCurve": "very steep", "skillCeiling": "very high", "timeToFirstReward": "First crash-free flight", "progressionClarity": "high", "beginnerFriendly": False, "masteryPotential": "high" },
    "socialProfile": { "anxietyBurden": "medium", "performanceAnxiety": "low", "failureVisibility": "medium", "communityStrength": "strong", "beginnerWelcome": "welcoming" },
    "experiment": {
      "smallestStep": "Buy a radio controller ($50) and practice in a PC simulator like Liftoff for 5 hours.",
      "firstCost": "$70", "firstTime": "5 hours", "soloFriendly": True,
      "whatSuccessFeelsLike": "Finally hitting a gap without crashing the virtual drone.",
      "commonBeginnerMistake": "Buying a real drone before practicing in the simulator.",
      "nextStep": "Buy a tiny whoop (micro drone) and fly it around your house."
    },
    "surprisingAdjacencies": [
      { "activityId": "mechanical-keyboards", "sharedTraits": ["soldering", "customization"], "explanation": "Both involve tinkering with electronics to achieve a specific performance feel." }
    ],
    "tags": ["tech", "adrenaline", "expensive"]
  },
  {
    "id": "woodworking",
    "name": "Woodworking",
    "category": "Creative/Making",
    "subcategory": "Crafts",
    "shortDescription": "Cut, shape, and join wood to create furniture or art.",
    "hook": "Turn raw timber into functional heirlooms with your own hands.",
    "dimensions": { "sociality": -0.6, "structure": 0.6, "physicality": 0.5, "expression": 0.7, "environment": -0.4, "barrier": 0.7 },
    "practicalConstraints": { "startCost": "$100-500", "ongoingCost": "$50/project", "timePerSession": "2-5 hours", "equipmentNeeded": "Saws, chisels, measuring tools", "spaceRequired": "Garage/Workshop", "locationDependency": "high", "scheduleFlexibility": "high" },
    "progression": { "learningCurve": "moderate", "skillCeiling": "very high", "timeToFirstReward": "First box", "progressionClarity": "high", "beginnerFriendly": True, "masteryPotential": "very high" },
    "socialProfile": { "anxietyBurden": "low", "performanceAnxiety": "low", "failureVisibility": "low", "communityStrength": "medium", "beginnerWelcome": "welcoming" },
    "experiment": {
      "smallestStep": "Take a 1-day intro class at a makerspace to build a simple cutting board.",
      "firstCost": "$75", "firstTime": "4 hours", "soloFriendly": True,
      "whatSuccessFeelsLike": "The smell of sawdust and applying the final coat of oil.",
      "commonBeginnerMistake": "Ignoring the grain direction when planing or routing.",
      "nextStep": "Buy a Japanese pull saw and practice cutting straight lines."
    },
    "surprisingAdjacencies": [
      { "activityId": "sourdough-baking", "sharedTraits": ["patience", "managing materials"], "explanation": "Both require understanding how organic materials react to environment and time." }
    ],
    "tags": ["craft", "physical", "useful"]
  },
  {
    "id": "board-game-design",
    "name": "Board Game Design",
    "category": "Intellectual/Analytical",
    "subcategory": "Design",
    "shortDescription": "Create mechanics, rules, and prototypes for tabletop games.",
    "hook": "Engineer fun by designing systems that people play.",
    "dimensions": { "sociality": 0.7, "structure": 0.5, "physicality": -0.6, "expression": 0.8, "environment": -0.8, "barrier": -0.8 },
    "practicalConstraints": { "startCost": "$10", "ongoingCost": "$10/month", "timePerSession": "2-4 hours", "equipmentNeeded": "Index cards, markers, dice", "spaceRequired": "Table", "locationDependency": "low", "scheduleFlexibility": "high" },
    "progression": { "learningCurve": "moderate", "skillCeiling": "high", "timeToFirstReward": "First playtest", "progressionClarity": "low", "beginnerFriendly": True, "masteryPotential": "high" },
    "socialProfile": { "anxietyBurden": "medium", "performanceAnxiety": "medium", "failureVisibility": "high", "communityStrength": "medium", "beginnerWelcome": "welcoming" },
    "experiment": {
      "smallestStep": "Take a game you love, change one core rule, and playtest it with a friend.",
      "firstCost": "$0", "firstTime": "2 hours", "soloFriendly": False,
      "whatSuccessFeelsLike": "Watching your friends get excited and argue over the rules you created.",
      "commonBeginnerMistake": "Focusing on art before the core loop is fun.",
      "nextStep": "Create a paper prototype of an original mechanic."
    },
    "surprisingAdjacencies": [
      { "activityId": "improv-comedy", "sharedTraits": ["human reaction", "iteration"], "explanation": "Both rely on understanding and guiding human interaction in real time." }
    ],
    "tags": ["design", "social", "creative"]
  },
  {
    "id": "letterpress-printing",
    "name": "Letterpress Printing",
    "category": "Creative/Making",
    "subcategory": "Crafts",
    "shortDescription": "Arrange lead type and press it into paper to create tactile prints.",
    "hook": "Experience the heavy, industrial origins of graphic design.",
    "dimensions": { "sociality": -0.3, "structure": 0.9, "physicality": 0.4, "expression": 0.6, "environment": -0.9, "barrier": 0.8 },
    "practicalConstraints": { "startCost": "$50-100 (class)", "ongoingCost": "High (if buying press)", "timePerSession": "3-6 hours", "equipmentNeeded": "Press, type, ink", "spaceRequired": "Studio", "locationDependency": "high", "scheduleFlexibility": "low" },
    "progression": { "learningCurve": "steep", "skillCeiling": "high", "timeToFirstReward": "First pull", "progressionClarity": "high", "beginnerFriendly": False, "masteryPotential": "high" },
    "socialProfile": { "anxietyBurden": "low", "performanceAnxiety": "low", "failureVisibility": "low", "communityStrength": "niche", "beginnerWelcome": "welcoming" },
    "experiment": {
      "smallestStep": "Book a workshop at a local printmaking studio to set your name in type.",
      "firstCost": "$75", "firstTime": "3 hours", "soloFriendly": True,
      "whatSuccessFeelsLike": "Pulling the lever and feeling the deep impression in the thick cotton paper.",
      "commonBeginnerMistake": "Spelling words backwards when setting the type.",
      "nextStep": "Take a multi-week course to learn registration and multi-color prints."
    },
    "surprisingAdjacencies": [
      { "activityId": "mechanical-keyboards", "sharedTraits": ["tactility", "mechanical precision"], "explanation": "Both obsess over the mechanical interaction between machine and text." }
    ],
    "tags": ["craft", "vintage", "precise"]
  }
]

OTHER_ACTIVITIES_NAMES = [
    "Geocaching", "Astrophotography", "Kintsugi", "Bonsai", "Fermentation",
    "Origami", "Leatherworking", "Soap Making", "Mushroom Cultivation", "Glassblowing",
    "Archery", "Parkour", "Slacklining", "Kitesurfing", "Historical European Martial Arts",
    "Chess", "Go", "Cryptic Crosswords", "Competitive Programming", "Conlanging",
    "Stand-up Comedy", "Dungeons & Dragons", "LARPing", "Amateur Dramatics", "Choir",
    "Electronics Repair", "Raspberry Pi Projects", "Robotics", "3D Printing", "Magnet Fishing",
    "Metal Detecting", "Urban Exploration", "Storm Chasing", "Mudlarking", "Beekeeping",
    "Vermicomposting", "Bicycle Restoration", "Watchmaking", "Shoemaking", "Stained Glass"
]

import random
random.seed(42)

all_activities = MUST_INCLUDE.copy()

categories = ["Physical/Outdoor", "Creative/Making", "Intellectual/Analytical", "Social/Performative", "Technical/Building", "Niche/Unexpected"]

for name in OTHER_ACTIVITIES_NAMES:
    id_str = name.lower().replace(" ", "-").replace("&", "and")
    cat = random.choice(categories)
    
    act = {
        "id": id_str,
        "name": name,
        "category": cat,
        "subcategory": "General",
        "shortDescription": f"Dive deep into the world of {name} and master its unique challenges.",
        "hook": f"Discover why people become obsessed with {name}.",
        "dimensions": {
            "sociality": round(random.uniform(-0.9, 0.9), 1),
            "structure": round(random.uniform(-0.9, 0.9), 1),
            "physicality": round(random.uniform(-0.9, 0.9), 1),
            "expression": round(random.uniform(-0.9, 0.9), 1),
            "environment": round(random.uniform(-0.9, 0.9), 1),
            "barrier": round(random.uniform(-0.6, 0.8), 1)
        },
        "practicalConstraints": {
            "startCost": f"${random.randint(1, 10)*10}-${random.randint(11, 20)*10}",
            "ongoingCost": f"${random.randint(5, 50)}/month",
            "timePerSession": f"{random.randint(1, 3)} hours",
            "equipmentNeeded": "Basic starter tools",
            "spaceRequired": "Small area",
            "locationDependency": "medium",
            "scheduleFlexibility": "high"
        },
        "progression": {
            "learningCurve": "moderate",
            "skillCeiling": "high",
            "timeToFirstReward": "A few sessions",
            "progressionClarity": "medium",
            "beginnerFriendly": True,
            "masteryPotential": "high"
        },
        "socialProfile": {
            "anxietyBurden": "low",
            "performanceAnxiety": "low",
            "failureVisibility": "low",
            "communityStrength": "medium",
            "beginnerWelcome": "welcoming"
        },
        "experiment": {
            "smallestStep": f"Spend one weekend afternoon watching a tutorial on {name} and doing the absolute basics.",
            "firstCost": "$15",
            "firstTime": "2 hours",
            "soloFriendly": True,
            "whatSuccessFeelsLike": "Losing track of time while trying to figure it out.",
            "commonBeginnerMistake": "Overthinking it before starting.",
            "nextStep": "Join a dedicated community forum or local group."
        },
        "surprisingAdjacencies": [
            {
                "activityId": "sourdough-baking",
                "sharedTraits": ["patience", "iteration"],
                "explanation": "Both reward consistent, methodical effort."
            },
            {
                "activityId": "bouldering",
                "sharedTraits": ["problem solving"],
                "explanation": "Both involve figuring out a pathway to a goal."
            }
        ],
        "tags": ["focus", "discovery"]
    }
    all_activities.append(act)

os.makedirs('c:/Users/SJ/Documents/antigravity/serene-curie/data', exist_ok=True)
with open('c:/Users/SJ/Documents/antigravity/serene-curie/data/activities.json', 'w') as f:
    json.dump(all_activities, f, indent=2)

print(f"Generated {len(all_activities)} activities.")
