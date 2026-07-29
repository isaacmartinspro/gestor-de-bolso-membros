import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// ATENÇÃO: usa a service role key, que ignora as regras de Row Level Security.
// Só pode ser importado dentro de código que roda no servidor (rotas de API),
// nunca em código que vai para o navegador. É o que permite ao webhook do
// Voomp criar contas e liberar acesso sem exigir login.
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
