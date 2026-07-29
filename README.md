# Gestor de Bolso — Área de Membros

Projeto Next.js + Supabase que faz a ponte entre a compra no Voomp e o
acesso ao portal do Gestor de Bolso.

## Como funciona o fluxo

1. A pessoa compra no Voomp.
2. O Voomp chama o webhook `/api/webhook/voomp` deste projeto.
3. O webhook libera o acesso no banco (tabela `subscribers`) e, se for a
   primeira compra desse e-mail, cria a conta de login e dispara
   automaticamente um e-mail com um link de **"criar senha"**.
4. A pessoa clica no link, cria a senha em `/set-password`, e cai direto
   no portal.
5. Nas próximas vezes, ela entra em `/login` com e-mail e senha.
6. `/portal` só abre para quem tem sessão válida **e** assinatura com
   status `active` na tabela `subscribers`.

## Passo a passo para colocar no ar

### 1. Criar o projeto no Supabase
1. Crie uma conta/projeto em https://supabase.com (tem plano gratuito).
2. Em **Project Settings > API**, copie:
   - `Project URL` → vai em `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public key` → vai em `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role key` → vai em `SUPABASE_SERVICE_ROLE_KEY` (**nunca**
     compartilhe essa chave, ela dá acesso total ao banco)

### 2. Rodar o schema do banco
No Supabase, abra **SQL Editor** e rode o conteúdo do arquivo
`supabase/schema.sql` deste projeto. Isso cria a tabela `subscribers` e as
regras de segurança.

### 3. Configurar o e-mail de convite (criar senha)
Em **Authentication > Email Templates** no Supabase, edite o template
**"Invite user"** — é esse e-mail que a pessoa recebe para criar a senha.
Você pode personalizar o texto e o assunto para ficar com a cara do
Instituto Isaac Martins.

Em **Authentication > URL Configuration**, adicione a URL do seu site em
produção (ex: `https://membros.isaacmartins.com.br`) em **Site URL** e em
**Redirect URLs** (incluindo `/set-password`).

### 4. Configurar as variáveis de ambiente
Copie `.env.example` para `.env.local` e preencha todos os valores,
incluindo um `VOOMP_WEBHOOK_SECRET` forte (uma senha longa e aleatória,
só você e o Voomp sabem).

### 5. Rodar localmente (opcional, para testar)
```bash
npm install
npm run dev
```
Acesse http://localhost:3000

### 6. Publicar no Vercel
1. Suba este projeto para um repositório no GitHub.
2. Importe o repositório no Vercel (https://vercel.com/new).
3. Em **Environment Variables**, cole as mesmas variáveis do `.env.local`.
4. Deploy.
5. Configure o domínio (ex: `membros.isaacmartins.com.br`) nas
   configurações do projeto no Vercel.

### 7. Configurar o webhook no Voomp
No painel do Voomp, cadastre a URL do webhook do produto "Gestor de
Bolso" apontando para:
```
https://SEU-DOMINIO/api/webhook/voomp?secret=SEU_VOOMP_WEBHOOK_SECRET
```
**Importante:** o arquivo `app/api/webhook/voomp/route.ts` tem comentários
marcados com "AJUSTE AQUI" — os nomes exatos dos campos que o Voomp envia
(e-mail do comprador, status do pedido, nome do plano) precisam ser
conferidos com a documentação do Voomp ou com um payload de teste real, e
ajustados nesse arquivo antes de ir para produção. Peça ao suporte do
Voomp um exemplo de payload de webhook se a documentação não deixar claro.

### 8. Testar o fluxo de ponta a ponta
1. Faça uma compra de teste no Voomp (ou simule uma chamada ao webhook
   com uma ferramenta como Postman/Insomnia).
2. Confira na tabela `subscribers` do Supabase se a linha foi criada com
   `status = active`.
3. Confira em **Authentication > Users** no Supabase se a conta foi criada.
4. Veja se o e-mail de "criar senha" chegou na caixa de entrada (confira
   também a caixa de spam).
5. Crie a senha e confirme que o portal abre normalmente.

## Estrutura do projeto

```
app/
  login/              — tela de login (e-mail + senha)
  set-password/        — tela de criar senha (a partir do link do e-mail)
  portal/               — página protegida que exibe o Gestor de Bolso
  api/webhook/voomp/   — recebe as notificações de compra do Voomp
  api/portal-content/  — entrega o HTML do portal, só para quem está autenticado e ativo
lib/supabase/          — clients do Supabase (navegador, servidor, admin)
private/                — o HTML do Gestor de Bolso (não é público, só sai por /api/portal-content)
supabase/schema.sql     — schema do banco de dados
middleware.ts           — protege as rotas /portal e /api/portal-content
```

## Atualizando o conteúdo do Gestor de Bolso

Sempre que adicionar novos frameworks ao portal, é só substituir o arquivo
`private/gestor-de-bolso-content.html` pela versão mais recente e fazer
um novo deploy — não precisa mexer em mais nada.

## Sobre os planos e preços

Os nomes de plano usados no webhook (`mensal`, `semestral`, `anual`) e a
duração de cada um estão no início do arquivo
`app/api/webhook/voomp/route.ts`, na constante `PLAN_DURATIONS_DAYS`.
Ajuste ali se os nomes dos planos no Voomp forem diferentes.
