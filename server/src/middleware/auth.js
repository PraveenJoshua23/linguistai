import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// Verifies the Supabase access token and sets req.userId from its `sub` claim.
// Routes must use req.userId and never trust a user id sent by the client.
export async function requireAuth(req, res, next) {
  const token = req.headers.authorization?.match(/^Bearer (.+)$/)?.[1];
  if (!token) return res.status(401).json({ error: 'Not signed in' });

  const { data, error } = await supabase.auth.getClaims(token);
  const userId = data?.claims?.sub;
  if (error || !userId) return res.status(401).json({ error: 'Invalid or expired session' });

  req.userId = userId;
  next();
}
