import { createClient } from '@supabase/supabase-js';

function ensureEnvVar(value, name) {
  if (!value) {
    throw new Error(`Missing Supabase configuration: ${name}`);
  }
  return value;
}

function parseBody(rawBody) {
  if (!rawBody) {
    return {};
  }

  if (typeof rawBody === 'string') {
    try {
      return JSON.parse(rawBody);
    } catch (error) {
      throw new Error('Invalid JSON body.');
    }
  }

  return rawBody;
}

const supabaseUrl = ensureEnvVar(process.env.VITE_SUPABASE_URL, 'VITE_SUPABASE_URL');
const supabaseAnonKey = ensureEnvVar(process.env.VITE_SUPABASE_ANON_KEY, 'VITE_SUPABASE_ANON_KEY');
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let body;
  try {
    body = parseBody(req.body);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }

  const { email, password } = body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error || !data) {
    const message = error?.message || 'Failed to authenticate with Supabase.';
    return res.status(401).json({ error: message });
  }

  const { user, session } = data;

  return res.status(200).json({ user, session });
}
