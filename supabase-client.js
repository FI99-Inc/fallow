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
