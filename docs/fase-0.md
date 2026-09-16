# Fase 0 — Fundação

## O que foi feito

- **Monorepo** com pnpm workspaces: `apps/web` e `packages/core`, com `tsconfig.base.json` estrito compartilhado. Sem Turborepo por enquanto — com dois pacotes, o cache de build não paga a complexidade.
- **`apps/web`** — Next.js (App Router) + Tailwind. Sidebar sóbria com os 10 andares como rotas; Hoje é a raiz (`/`). Cada andar é um placeholder até sua fase chegar.
- **`packages/core`** — nasce com `BaseRow` (colunas comuns a toda tabela) e `FLOORS` (fonte única da lista de andares, que a sidebar importa). As pastas `floors/<andar>/` nascem na fase de cada andar.
- **Supabase** — primeira migration (`settings` com RLS completa + função `set_updated_at`), clientes browser/server via `@supabase/ssr`, variáveis documentadas em `apps/web/.env.example`.
- **Login travado** — OAuth Google via Supabase; middleware barra qualquer conta que não seja `OWNER_EMAIL`. Rotas em grupos: `(andares)` atrás do login, `(auth)` fora dele.

## Conceitos novos

- **Route groups do App Router** — pastas com parênteses, como `(andares)`, agrupam rotas sob um layout sem aparecer na URL. É como o site tem duas "cascas": com sidebar (andares) e sem (login).
- **Middleware do Next** — roda antes de toda request, no edge. É onde a sessão é renovada e a regra do dono é aplicada. Detalhe importante: usamos `getUser()` (valida o token no servidor do Supabase) e não `getSession()` (confia no cookie sem verificar).
- **RLS (Row Level Security)** — policies no Postgres que filtram linhas por `auth.uid()`. A anon key do Supabase é pública por design; sem RLS, qualquer pessoa com ela leria o banco. O middleware protege as *páginas*; a RLS protege os *dados*. Duas camadas, propósitos diferentes.
- **Sessão em cookies com `@supabase/ssr`** — o token vive em cookies para o servidor (Server Components, middleware) enxergar a sessão. Por isso existem dois clientes: `lib/supabase/client.ts` (browser) e `server.ts` (servidor).
- **Trigger `set_updated_at`** — função plpgsql reutilizável que mantém `updated_at` correto sem depender de a aplicação lembrar de preencher.

## Configurando (uma vez)

1. **Supabase**: crie um projeto em [supabase.com](https://supabase.com). Em *Settings → API*, copie a URL e a anon key.
2. **Google OAuth**: no [Google Cloud Console](https://console.cloud.google.com), crie um projeto → *APIs & Services → Credentials → OAuth client ID* (tipo Web). Em *Authorized redirect URIs* adicione `https://SEU-PROJETO.supabase.co/auth/v1/callback`. No dashboard do Supabase, *Authentication → Providers → Google*, cole client ID e secret.
3. **Migration**: instale a [CLI do Supabase](https://supabase.com/docs/guides/cli), rode `supabase link --project-ref SEU-REF` e `supabase db push` na raiz do repositório.
4. **Env**: copie `apps/web/.env.example` para `apps/web/.env.local` e preencha (o `OWNER_EMAIL` é o seu Gmail).

## Testando manualmente

```bash
pnpm install
pnpm dev        # abre http://localhost:3000
```

- Sem login → redirecionado para `/entrar`.
- Entrar com seu Google → cai no Hoje, sidebar com os 10 andares, seu e-mail no rodapé da sidebar.
- Navegar pelos andares → cada um mostra nome e descrição.
- Sair → volta para `/entrar`.
- Entrar com outra conta Google → `/acesso-negado`, sem acesso a nenhum andar.

## Para aprofundar

- [Row Level Security no Supabase](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Auth com Next.js App Router (@supabase/ssr)](https://supabase.com/docs/guides/auth/server-side/nextjs)
- [Route groups no Next](https://nextjs.org/docs/app/building-your-application/routing/route-groups)
- [pnpm workspaces](https://pnpm.io/workspaces)
