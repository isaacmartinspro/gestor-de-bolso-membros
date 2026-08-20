# Gestor de Bolso — Área de Membros

Projeto Next.js + Supabase que faz a ponte entre a compra no Voomp e o
acesso ao portal do Gestor de Bolso.

## Como funciona o fluxo

1. A pessoa compra no Voomp.
2. O Voomp redireciona (ou, dentro da área de membros do Voomp, mostra um
   link) para `/cadastro-gestor` deste site.
3. A pessoa preenche nome, e-mail, cargo, WhatsApp e cria uma senha. A
   conta é criada na hora — sem confirmação por e-mail — e ela já cai
   logada direto no portal.
4. Nas próximas vezes, ela entra em `/login-gestor` com e-mail e senha.
5. `/portal` só abre para quem tem sessão válida **e** assinatura com
   status `active` na tabela `subscribers`.

Como o link de cadastro só é divulgado dentro da área de membros do Voomp
(só quem comprou vê esse link), o próprio Voomp já funciona como a
"trava" de quem pode se cadastrar — o app não depende do webhook já ter
rodado antes para liberar o acesso. O webhook (`/api/webhook/voomp`)
continua existindo e pode ser configurado em paralelo, para manter o
`plan`/`status`/`expires_at` sincronizados automaticamente, mas não é
obrigatório para o cadastro funcionar.

## Passo a passo para colocar no ar

### 1. Criar o projeto no Supabase
1. Crie uma conta/projeto em https://supabase.com (tem plano gratuito).
2. Em **Project Settings > API**, copie:
   - `Project URL` → vai em `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public key` → vai em `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role key` → vai em `SUPABASE_SERVICE_ROLE_KEY` (**nunca**
     compartilhe essa chave, ela dá acesso total ao banco)

### 2. Rodar o schema do banco
No Supabase, abra **SQL Editor** e rode, nesta ordem:
1. `supabase/schema.sql` — cria a tabela `subscribers` e as regras de segurança.
2. `supabase/schema-cadastro.sql` — adiciona os campos `cargo` e `whatsapp`
   usados no formulário de cadastro.

Os frameworks ficam fixos no arquivo do portal, não no banco — não
precisa de mais nenhuma tabela além dessas.

### 3. Configurar o domínio no Supabase
Em **Authentication > URL Configuration**, coloque a URL do seu site em
produção (ex: `https://gestordebolso.ia.br`) em **Site URL**. Não precisa
mexer em templates de e-mail nem em provedores — o cadastro é feito com
senha própria, sem depender de e-mail de confirmação.

**Atenção:** o plano gratuito do Supabase pausa o projeto automaticamente
depois de um tempo sem uso. Se o login parar de funcionar do nada, o
primeiro lugar a checar é a página inicial do projeto no Supabase — se
aparecer "Project is paused", clique em **"Resume project"**.

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

### 7. Configurar o Voomp
No painel do Voomp, cadastre a URL do webhook do produto "Gestor de
Bolso" apontando para (opcional, mas recomendado para manter os dados
sincronizados):
```
https://SEU-DOMINIO/api/webhook/voomp?secret=SEU_VOOMP_WEBHOOK_SECRET
```
**Importante:** o arquivo `app/api/webhook/voomp/route.ts` tem comentários
marcados com "AJUSTE AQUI" — os nomes exatos dos campos que o Voomp envia
precisam ser conferidos com a documentação do Voomp antes de confiar
100% no webhook.

O essencial de verdade é configurar, dentro da **área de membros do
Voomp** (Voomp Play) do produto, um link/botão apontando para:
```
https://SEU-DOMINIO/cadastro-gestor
```
É esse link que a pessoa vê depois de comprar, e é ele quem "libera" o
cadastro — por isso não precisa divulgar esse endereço em nenhum outro
lugar.

### 8. Testar o fluxo de ponta a ponta
1. Acesse `/cadastro-gestor` você mesmo, com um e-mail de teste, e
   preencha o formulário.
2. Confira se caiu direto no portal depois de cadastrar.
3. Confira na tabela `subscribers` do Supabase se a linha foi criada com
   `status = active`.
4. Saia e entre de novo em `/login-gestor` com esse e-mail e a senha que
   você criou, para confirmar que o login também funciona.

## Estrutura do projeto

```
app/
  cadastro-gestor/      — tela de cadastro (nome, e-mail, cargo, whatsapp, senha)
  login-gestor/          — tela de login (e-mail + senha)
  portal/               — página protegida que exibe o Gestor de Bolso
  admin/                 — área de administração (assinantes e avisos)
  api/register/           — cria a conta a partir do formulário de cadastro
  api/webhook/voomp/   — recebe as notificações de compra do Voomp (opcional)
  api/portal-content/  — entrega o HTML do portal, só para quem está autenticado e ativo
  api/me/                — retorna nome/e-mail do assinante logado (saudação personalizada)
lib/supabase/          — clients do Supabase (navegador, servidor, admin)
private/                — o HTML do Gestor de Bolso, com os 200 frameworks fixos (não é público, só sai por /api/portal-content)
public/lp.html           — a landing page de vendas (pública, é a home do site)
supabase/schema.sql     — schema do banco de dados
supabase/schema-cadastro.sql — colunas extras (cargo, whatsapp) usadas no cadastro
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

- **Assinantes** — ver todos (nome, e-mail, cargo, WhatsApp, plano, status,
  último acesso), adicionar alguém manualmente (cria a conta na hora, sem
  precisar de senha nem convite) e remover acesso de alguém
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

