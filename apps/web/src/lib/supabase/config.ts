export function getSupabasePublicConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return url && key ? { url, key } : null;
}
export function requireSupabasePublicConfig() {
  const config = getSupabasePublicConfig();
  if (!config) throw new Error("Supabase public configuration is required.");
  return config;
}
