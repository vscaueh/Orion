# Fase 1 — Faculdade + Hoje

## O que foi feito

- **7 tabelas novas** — `semesters`, `courses`, `class_slots`, `assessments`, `absences`, `course_materials` e `time_blocks` (esta do andar Rotina, antecipada porque a fase gera blocos de aula). Todas com RLS.
- **Padrão de action** (`packages/core/src/action.ts`) — o contrato de toda mutação do sistema: nome `andar.acao`, descrição em português, schema zod, flags de `mutation` e aprovação. `runAction()` valida antes de executar. É o mesmo contrato que a Orion vai ler na Fase 3 para expor cada ação como tool.
- **Tela de Faculdade** — semestre, cadeiras, horários, notas e faltas, com edição e arquivamento.
- **Regras da UNIFOR em código testado** — liberação da AV3 (média das parciais ≥ 4), aprovação (AV3 ≥ 4 e média final ≥ 5), nota necessária em cada etapa, limite de 25% de faltas.
- **Hoje** — próxima aula e provas nos próximos 14 dias, alimentado pelos dados da Faculdade.
- **55 testes** no `packages/core`.

## Conceitos novos

- **Actions como contrato único** — as telas nunca falam com o Supabase; chamam `runAction(action, ctx, dados)`. A validação zod acontece num lugar só, e a mesma função vira tool da Orion sem reescrita. É a decisão "Tools da Orion = ações do core" do CLAUDE.md virando código.
- **Server Actions do Next** — funções marcadas com `"use server"` que um `<form>` chama direto, sem API REST no meio. Aqui elas só fazem a ponte: montam o contexto e traduzem `FormData`. Regra de negócio nenhuma mora nelas.
- **Unidade de domínio vs. unidade de interface** — as faltas são contadas em horas-aula (como a UNIFOR registra) e exibidas em dias de aula (como se planeja). A conversão vive numa função só, na borda.
- **Funções puras + Vitest** — `situacao()`, `proximaAula()`, `provasProximas()` não tocam no banco: recebem dados, devolvem resultado. Por isso dá para testar os casos de borda em milissegundos.
- **Soft delete (`archived_at`)** — nada é apagado. As queries filtram `archived_at is null`, e o andar Arquivo (Fase 6) será a consulta inversa. Arquivar uma cadeira leva junto seus horários e os blocos que eles geraram na semana-tipo.
- **Fuso horário do usuário, não do servidor** — `agoraNoFuso()` resolve o "agora" em `America/Fortaleza` via `Intl.DateTimeFormat`. Sem isso, o Hoje visto às 22h já mostraria o dia seguinte, porque o servidor roda em UTC.
- **Dados espelhados entre andares** — `class_slots` (Faculdade) gera `time_blocks` (Rotina), ligados por `class_slot_id`. Um dado mora num andar só; o outro reflete.

## Testando manualmente

```bash
pnpm dev
```

Em **Faculdade**: cadastre o semestre, adicione uma cadeira com carga horária, um horário, notas e uma falta. Confira se o limite de faltas e a frase de situação batem com a realidade.

Em **Hoje**: deve aparecer a próxima aula (com quanto falta) e as provas marcadas para os próximos 14 dias.

## Para aprofundar

- [Server Actions](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations)
- [Zod](https://zod.dev) — validação e inferência de tipos
- [Vitest](https://vitest.dev)
- [Intl.DateTimeFormat e fusos](https://developer.mozilla.org/pt-BR/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat)
