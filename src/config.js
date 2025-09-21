const DEFAULT_JWT_SECRET = 'change-this-secret-in-production';

const config = {
  port: Number(process.env.PORT || 4000),
  jwtSecret: process.env.JWT_SECRET || DEFAULT_JWT_SECRET,
  tokenExpiresInSeconds: Number(process.env.TOKEN_EXPIRES_IN || 60 * 60 * 12),
  freeDebtLimit: Number(process.env.FREE_DEBT_LIMIT || 5),
  reminderLookAheadDays: Number(process.env.REMINDER_LOOK_AHEAD_DAYS || 30),
  supabase: {
    url: process.env.SUPABASE_URL || '',
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
    anonKey: process.env.SUPABASE_ANON_KEY || '',
    schema: process.env.SUPABASE_SCHEMA || 'public',
  },
};

export default config;
