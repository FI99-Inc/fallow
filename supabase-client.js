// Supabase Configuration and Initialization
// Import the Supabase client library via CDN (version 2)
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'

const SUPABASE_URL = 'https://irddgvtayrmwquaixlpg.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_849y9wOpjPpBdUDNZMbuXw_HozSsudV';

// Initialize the Supabase client
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Helper function to get or create an anonymous session
export async function getSession() {
  const { data: { session }, error } = await supabase.auth.getSession();

  if (session) {
    return session;
  }

  // If no session exists, sign in anonymously
  const { data: signInData, error: signInError } = await supabase.auth.signInAnonymously();

  if (signInError) {
    console.error("Error creating anonymous session:", signInError);
    return null;
  }

  return signInData.session;
}

// Supabase returns snake_case columns; the renderers were written against the
// camelCase shape of the original data/activities.json. Normalise once here so
// a column-name mismatch can never blank a page again.
export function normalizeActivity(row) {
  if (!row) return null;
  return {
    ...row,
    shortDescription: row.shortDescription || row.short_description || '',
    practicalConstraints: row.practicalConstraints || row.practical_constraints || {},
    socialProfile: row.socialProfile || row.social_profile || {},
    dimensions: row.dimensions || {},
    experiment: row.experiment || {},
    progression: row.progression || {}
  };
}

// Sync local profile to Supabase on login/signup
supabase.auth.onAuthStateChange(async (event, session) => {
  if (event === 'SIGNED_IN' && session?.user) {
    const profileStr = localStorage.getItem('fallow_profile');
    if (profileStr) {
      try {
        const profile = JSON.parse(profileStr);
        await supabase.from('profiles').upsert({
          id: session.user.id,
          email: session.user.email,
          scores: profile.scores || profile,
          updated_at: new Date().toISOString()
        });
      } catch (e) {
        console.error("Error syncing profile to Supabase on auth change:", e);
      }
    }
  }
});
