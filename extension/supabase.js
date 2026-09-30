const SUPABASE_URL = 'https://jkhzzojucazfgepqnevi.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpraHp6b2p1Y2F6ZmdlcHFuZXZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEwMDM4NzUsImV4cCI6MjA5NjU3OTg3NX0.wpI-5_qIuuwXsZUDMaJOY5GhVs3U2Q4-FM83DDhdiMA';

// Shape stored in chrome.storage.local.session, from a Supabase token response.
function toSession(data) {
  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: data.expires_at ?? Math.floor(Date.now() / 1000) + data.expires_in,
  };
}
