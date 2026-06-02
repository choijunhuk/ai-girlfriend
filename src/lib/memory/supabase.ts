import { createClient, SupabaseClient } from '@supabase/supabase-js';

let _serverClient: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!_serverClient) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    // Prefer service_role key (server-side only) for full DB access bypassing RLS
    const key =
      process.env.SUPABASE_SERVICE_ROLE_KEY ??
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    _serverClient = createClient(url, key);
  }
  return _serverClient;
}

export const supabase = new Proxy({} as SupabaseClient, {
  get(_, prop) {
    return getSupabase()[prop as keyof SupabaseClient];
  },
});
