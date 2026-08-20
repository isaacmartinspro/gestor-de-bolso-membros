-- Rode isso uma vez no SQL Editor do Supabase (adiciona os campos do
-- novo formulário de cadastro).

alter table public.subscribers add column if not exists cargo text;
alter table public.subscribers add column if not exists whatsapp text;
