import { createBrowserClient } from "@supabase/ssr";

// Usado em Client Components (formulário de login, tela de criar senha).
// Usa a anon key — segura para expor no navegador, pois as regras de
// segurança reais ficam nas policies de Row Level Security do Supabase.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
