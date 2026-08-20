# Gestor de Bolso — Área de Membros

Projeto Next.js + Supabase que faz a ponte entre a compra no Voomp e o
acesso ao portal do Gestor de Bolso.

## Como funciona o fluxo

1. A pessoa compra no Voomp.
2. O Voomp chama o webhook `/api/webhook/voomp` deste projeto.
3. O webhook libera o acesso no banco (tabela `subscribers`) e, se for a
   primeira compra desse e-mail, cria a conta de login — **sem senha**.
4. Para entrar, a pessoa digita o e-mail em `/login`, recebe um **código de
   6 dígitos por e-mail** e digita esse código. Não existe senha em nenhum
   momento do fluxo.
5. `/portal` só abre para quem tem sessão válida **e** assinatura com
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
regras de segurança — é a única tabela que este projeto realmente precisa
hoje (os frameworks ficam fixos no arquivo do portal, não no banco).

### 3. Ativar o login por código (OTP) no Supabase
Em **Authentication > Providers > Email**, confirme que o login por e-mail
está habilitado (é o padrão). O Supabase já envia um código de 6 dígitos
junto com o link mágico por padrão — não precisa ativar nada extra.

Em **Authentication > Email Templates**, edite o template **"Magic Link"**
para deixar o código `{{ .Token }}` bem visível no corpo do e-mail (é esse
número que a pessoa vai digitar na tela de login). Aproveite para deixar
com a cara do Instituto Isaac Martins.

Em **Authentication > URL Configuration**, coloque a URL do seu site em
produção (ex: `https://gestordebolso.ia.br`) em **Site URL**.

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

### 6. Publicar (Hostinger, Vercel ou similar)
1. Suba este projeto para um repositório no GitHub.
2. Conecte o repositório na sua hospedagem (Node.js/Next.js).
3. Nas variáveis de ambiente da hospedagem, cole as mesmas do `.env.local`.
4. Faça o deploy.
5. Aponte o domínio (ex: `gestordebolso.ia.br`) para esse app.

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
4. Em `/login`, digite esse e-mail e confirme que o código de 6 dígitos
   chega por e-mail (confira também a caixa de spam).
5. Digite o código e confirme que o portal abre normalmente.

## Estrutura do projeto

```
app/
  login/                — tela de login (e-mail + código de 6 dígitos)
  portal/               — página protegida que exibe o Gestor de Bolso
  admin/                 — área de administração (assinantes e avisos)
  api/webhook/voomp/   — recebe as notificações de compra do Voomp
  api/portal-content/  — entrega o HTML do portal, só para quem está autenticado e ativo
  api/me/                — retorna nome/e-mail do assinante logado (saudação personalizada)
lib/supabase/          — clients do Supabase (navegador, servidor, admin)
private/                — o HTML do Gestor de Bolso, com os 200 frameworks fixos (não é público, só sai por /api/portal-content)
public/lp.html           — a landing page de vendas (pública, é a home do site)
supabase/schema.sql     — schema do banco de dados
middleware.ts           — protege as rotas /portal, /admin e as APIs relacionadas
```

## Atualizando o conteúdo do Gestor de Bolso

Os 200 frameworks e as 16 áreas ficam **fixos dentro do arquivo**
`private/gestor-de-bolso-content.html` — não dependem do banco de dados.
Para adicionar, editar ou remover frameworks, é só pedir a atualização (ou
editar esse arquivo diretamente) e publicar uma nova versão.

## Área de administração (`/admin`)

Acesse `https://SEU-DOMINIO/admin` logado com um e-mail que esteja na
variável de ambiente `ADMIN_EMAILS`. A área tem 2 abas:

- **Assinantes** — ver todos (nome, e-mail, plano, status, último acesso),
  adicionar alguém manualmente (cria a conta na hora, sem precisar de
  senha nem convite) e remover acesso de alguém
- **Avisos** — publicar uma mensagem em destaque no topo do portal e na
  seção "Novidades", para todos os assinantes (some quando a pessoa clica
  em "Fechar", e não volta a aparecer para ela na mesma sessão)

Para adicionar outro administrador, edite a variável `ADMIN_EMAILS` (separe
vários e-mails por vírgula) e refaça o deploy.

## Sobre os planos e preços

Os nomes de plano usados no webhook (`mensal`, `semestral`, `anual`) e a
duração de cada um estão no início do arquivo
`app/api/webhook/voomp/route.ts`, na constante `PLAN_DURATIONS_DAYS`.
Ajuste ali se os nomes dos planos no Voomp forem diferentes.

