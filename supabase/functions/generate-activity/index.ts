import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { profile, constraints } = await req.json()
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')

    if (!GEMINI_API_KEY) {
      throw new Error("Missing Gemini API Key")
    }

    const systemInstruction = `You are Fallow AI, an expert at recommending niche, unique, and highly specific offline hobbies and activities.
Given a user's DNA (scores from -1 to 1 across 6 dimensions) and their practical constraints, you must generate ONE entirely unique, hyper-specific activity for them to try.

The output MUST be valid JSON with the exact following schema:
{
  "id": "A unique string ID, e.g., 'custom-activity-123'",
  "category": "A short category string (e.g., 'Maker', 'Physical', 'Exploration')",
  "name": "The hyper-specific name of the activity",
  "hook": "A short 1-sentence hook explaining why they will like it",
  "dimensions": {
    "sociality": -1 to 1,
    "structure": -1 to 1,
    "physicality": -1 to 1,
    "expression": -1 to 1,
    "environment": -1 to 1,
    "barrier": -1 to 1
  },
  "practicalConstraints": {
    "startCost": "e.g., $0, $20, etc.",
    "timePerSession": "e.g., 30 mins, 2 hours"
  },
  "experiment": {
    "smallestStep": "The absolute smallest, lowest-friction first step they can take today."
  }
}`

    const userPrompt = `User DNA Profile:\n${JSON.stringify(profile, null, 2)}\n\nUser Constraints:\n${JSON.stringify(constraints, null, 2)}\n\nSynthesize a 1-of-1 activity tailored perfectly to this DNA.`

    // Hit the Gemini REST API
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        system_instruction: {
          parts: [{ text: systemInstruction }]
        },
        contents: [{
          parts: [{ text: userPrompt }]
        }],
        generationConfig: {
          temperature: 0.8,
          response_mime_type: "application/json"
        }
      })
    })

    const data = await response.json()
    if (data.error) throw new Error(data.error.message)

    const rawText = data.candidates[0].content.parts[0].text
    const activity = JSON.parse(rawText)

    return new Response(
      JSON.stringify({ activity }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    )
  }
})
