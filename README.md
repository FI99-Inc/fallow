<div align="center">
  <img src="assets/fallow_hero.jpg" alt="Fallow - Discover what you love" width="100%">
  
  <h1>Fallow</h1>
  <p><em>A cure for adult boredom. A psychological profiling tool disguised as a hobby finder.</em></p>
</div>

<br />

## 🌾 What is Fallow?

We all know the feeling. Staying home feels unfulfilling. Going out feels exhausting. The internet tells you to "get a hobby," but finding something you actually want to stick with feels impossible. 

**Fallow isn't a directory of hobbies.** It's a behavioral engine that matches your latent psychological preferences to activities you'd never think to search for. 

Instead of asking "What do you like to do?", Fallow asks:
- *Do you prefer fixing things that are broken, or building from scratch?*
- *Do you need the satisfaction of instant results, or the slow burn of mastery?*
- *Do you recharge in chaotic social environments or quiet, structured solitude?*

Based on your answers, Fallow generates your unique **Activity DNA** and matches you with surprisingly accurate, highly specific hobbies.

---

## 🧬 How It Works

### 1. The Psychological Quiz
Users go through a beautifully minimal, Tinder-style onboarding quiz. Instead of asking about interests, we ask behavioral questions, A/B scenarios, and constraint checks (budget, space, time).

### 2. The DNA Engine
Your answers generate a 6-dimensional psychological profile (Sociality, Structure, Physicality, Expression, Environment, Barrier). This is your DNA.

### 3. The Discovery Swipe
Instead of overwhelming lists, you are presented with one highly-curated activity at a time. Swipe right to save, swipe left to pass. Every swipe subtly shifts your DNA profile in real-time, making the next recommendation even more accurate.

### 4. The Content Pipeline (The Magic)
Fallow is powered by a completely free, infinitely scalable AI pipeline. A standalone Python script runs in the background, querying Gemini's API to brainstorm obscure, fascinating new hobbies. It forces the AI into a strict JSON schema, calculates the psychological dimensions for the new hobby, validates the math, and injects it directly into the database. No human curation required.

---

## 🛠️ The Tech Stack

We believe in speed, simplicity, and owning your code. Fallow is built incredibly lean:

* **Frontend:** 100% Vanilla HTML, CSS, and JavaScript. No React, no Vue, no bloated bundlers. It's lightning-fast and universally compatible.
* **Backend:** **Supabase** (PostgreSQL). We bypass complex server architecture and talk directly to Supabase from the client for lightning-fast database reads and auth.
* **Content Generation:** **Python** + **Gemini API** (`gemini-flash-latest`). 

---

## 🚀 Running Locally

Because there's no build step, getting Fallow running locally takes seconds.

### Prerequisites
- Python 3.10+ (if you want to run the data pipeline)
- A free [Supabase](https://supabase.com) account

### Setup
1. **Clone the repo**
   ```bash
   git clone https://github.com/FI99-Inc/fallow.git
   cd fallow
   ```

2. **Serve the Frontend**
   You can use any basic HTTP server to run the app.
   ```bash
   npx serve .
   # or
   python -m http.server 8000
   ```

3. **Supabase Integration**
   - Create a Supabase project and run the SQL schema located in `supabase/schema.sql`.
   - Update `supabase-client.js` with your Project URL and Anon Key.
   - Run the seed script to populate your database with the starting 65 activities:
     ```bash
     export SUPABASE_URL="your-url"
     export SUPABASE_SERVICE_KEY="your-secret-key"
     python pipeline/seed_supabase.py
     ```

4. **Generating New Activities**
   Want to expand the database? Get a free Google Gemini API key.
   ```bash
   export GEMINI_API_KEY="your-api-key"
   python pipeline/generate_activities.py --count 10
   ```

---

<div align="center">
  <em>Let your mind lie fallow. See what grows.</em>
</div>
