-- Rode este script uma vez no SQL Editor do seu projeto Supabase.

-- Tabela que guarda o status de assinatura de cada e-mail comprador.
-- Uma linha por comprador; ligada ao usuário de autenticação pelo e-mail.
create table if not exists public.subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  auth_user_id uuid references auth.users(id) on delete set null,
  plan text not null default 'mensal',            -- 'mensal' | 'semestral' | 'anual'
  status text not null default 'pending',         -- 'pending' | 'active' | 'canceled' | 'expired'
  voomp_transaction_id text,
  expires_at timestamptz,                          -- null = sem data de expiração conhecida (ex: mensal recorrente)
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists subscribers_email_idx on public.subscribers (email);
create index if not exists subscribers_auth_user_id_idx on public.subscribers (auth_user_id);

-- Mantém updated_at em dia a cada alteração.
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists subscribers_set_updated_at on public.subscribers;
create trigger subscribers_set_updated_at
  before update on public.subscribers
  for each row execute function public.set_updated_at();

-- Row Level Security: cada pessoa só pode LER a própria linha (pelo e-mail
-- do token de login). Nenhuma política de escrita para usuários comuns —
-- só o webhook (com a service role key, que ignora RLS) grava aqui.
alter table public.subscribers enable row level security;

drop policy if exists "Usuário lê a própria assinatura" on public.subscribers;
create policy "Usuário lê a própria assinatura"
  on public.subscribers
  for select
  using (auth.jwt() ->> 'email' = email);
