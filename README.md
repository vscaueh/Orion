# Orion

Sistema pessoal de vida com IA embutida. Um site de uso diário e de um único usuário que centraliza faculdade, estudos, projetos, rotina, compras, skincare e metas — com a **Orion**, uma assistente de IA própria que conversa, executa ações no sistema e trabalha em segundo plano.

> Projeto pessoal e de aprendizado, em construção por fases. A fonte de verdade das decisões é o [CLAUDE.md](./CLAUDE.md); o diário de cada fase fica em [`docs/`](./docs/).

## Andares

A metáfora do projeto é um prédio: cada andar é um domínio da vida.

**Hoje** · Faculdade · Estudo · Projetos · Rotina · Compras · Skincare · Metas · Arquivo · **Orion**

## Stack

- **Monorepo** — pnpm workspaces
- **`apps/web`** — Next.js (App Router) + TypeScript + Tailwind
- **`packages/core`** — modelo de dados, validações e ações dos andares (compartilhado entre site e Orion)
- **Banco/Auth** — Supabase (Postgres + login Google + RLS), migrations em `supabase/migrations/`
- **IA** — camada própria sobre modelo de linguagem trocável (agente escrito à mão, sem frameworks)

## Rodando

Pré-requisitos: Node 22+, pnpm 10+, um projeto Supabase com o provider Google configurado.

```bash
pnpm install
cp apps/web/.env.example apps/web/.env.local   # e preencha
pnpm dev
```

As migrations são aplicadas com a [CLI do Supabase](https://supabase.com/docs/guides/cli): `supabase link` e `supabase db push`.

O login é restrito a um único e-mail (`OWNER_EMAIL`) — o site é pessoal por design. Uma rota `/demo` com dados fictícios está planejada para o final do projeto.

## Status

- ✅ **Fase 0 — Fundação**: monorepo, sidebar com os andares, login Google travado no dono, RLS ([docs/fase-0.md](./docs/fase-0.md))
- ✅ **Fase 1 — Faculdade + Hoje**: semestre, cadeiras, horários, notas e faltas; Hoje com próxima aula e provas próximas ([docs/fase-1.md](./docs/fase-1.md))
- 🔨 **Fase 2 — Rotina + Projetos**: em andamento
