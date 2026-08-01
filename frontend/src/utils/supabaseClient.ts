import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    "Missing Supabase env vars. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to frontend/.env",
  );
}

const supabase = createClient(supabaseUrl ?? "", supabaseAnonKey ?? "", {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    // AuthCallback exchanges the PKCE code once — auto-detect would double-consume it
    // (React Strict Mode remount → flow_state_already_used).
    detectSessionInUrl: false,
    flowType: "pkce",
  },
});

export default supabase;
