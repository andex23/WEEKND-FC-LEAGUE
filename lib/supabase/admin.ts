import { createClient as createSbClient } from "@supabase/supabase-js"

export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  
  if (!url || !serviceKey) {
    throw new Error('Missing Supabase environment variables')
  }
  
  return createSbClient(url, serviceKey, {
    auth: { persistSession: false },
  })
}


