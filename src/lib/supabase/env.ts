// Supabase env helper. Aceita os dois nomes de chave (formato antigo `_ANON_KEY`
// e novo `_PUBLISHABLE_KEY`) pra evitar problema de naming no Vercel.

export function getSupabaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) throw new Error("NEXT_PUBLIC_SUPABASE_URL is not set.");
  return url;
}

export function getSupabasePublicKey(): string {
  const k =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!k) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (or legacy NEXT_PUBLIC_SUPABASE_ANON_KEY) is not set.",
    );
  }
  return k;
}

export function getSupabaseSecretKey(): string {
  const k =
    process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!k) {
    throw new Error(
      "SUPABASE_SECRET_KEY (or legacy SUPABASE_SERVICE_ROLE_KEY) is not set.",
    );
  }
  return k;
}
