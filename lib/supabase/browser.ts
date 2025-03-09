import { createBrowserClient } from '@supabase/ssr';
import type { Database } from "@/types/database";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase URL and Anon Key must be provided in environment variables");
  }

export const supabase = createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);