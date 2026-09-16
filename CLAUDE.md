# ORION — Sistema pessoal de vida com IA embutida

Este arquivo é a fonte de verdade do projeto. Leia-o inteiro antes de qualquer tarefa. Quando uma decisão aqui conflitar com uma sugestão sua, siga este documento e, se discordar, explique antes de implementar.

---

## 1. O que é o Orion

Um site pessoal, de uso diário e de um único usuário (Caueh), que centraliza toda a vida dele: faculdade, estudos, projetos, rotina, compras, skincare e metas. Embutida nele vive a **Orion**, uma assistente de IA própria que conversa, executa ações no sistema e, em segundo plano, monta o dia, vigia pendências e ajuda a encaixar tarefas no horário.

Metáfora mental (não visual): um **prédio**, onde cada **andar** é um domínio da vida. Na interface isso vira uma **sidebar sóbria e funcional** — nada de ilustração de prédio.

Objetivos, em ordem:
1. Ser usado todo dia. Cada fase entrega algo utilizável no dia seguinte.
2. Servir de aprendizado para o Caueh (ver seção 9 — Modo aprendizado).
3. Ao final, servir de peça de portfólio (repositório público + rota `/demo` com dados fictícios).

Contexto do usuário: estudante de ADS na UNIFOR (Fortaleza), formatura prevista em 2028, faz freelas de desenvolvimento web, busca estágio. Idioma da interface e da Orion: **português do Brasil**.

---

## 2. Decisões fechadas

| Tema | Decisão |
|---|---|
| Usuários | Um só. Login Google restrito a um e-mail (variável `OWNER_EMAIL`). Sem cadastro, sem recuperação de senha. |
| Segurança | RLS ligada em todas as tabelas mesmo com um usuário. Chaves de API nunca vão ao cliente. |
| Navegação | Sidebar com os andares. Orion acessível como andar e como atalho global (Cmd/Ctrl+K). |
| Andares | Hoje · Faculdade · Estudo · Projetos · Rotina · Compras · Skincare · Metas · Arquivo · Orion |
| Regra de dados | **Um dado mora em um único andar.** Outros andares apenas o exibem. Hoje e Arquivo não têm tabelas próprias — são consultas. |
| Orion | Camada própria (personalidade + memória + tools) sobre um modelo de linguagem trocável. Começa com Gemini Flash (free tier). |
| Tools da Orion | São **exatamente** as ações do `packages/core`. O site e a Orion chamam o mesmo código. Nunca duplicar lógica. |
| Autonomia | A Orion **propõe, o usuário aprova**. Exceções: ações marcadas como `auto_ok` na config do usuário. |
| Segundo plano | Worker Node separado com agendador. A Orion "vive" no worker. |
| Canal externo | Telegram primeiro. WhatsApp depois, via adaptador (Evolution API em número secundário, nunca no principal). |
| Skincare | Andar próprio, sem vínculo com o app Skincycle (projeto de portfólio separado). |
| Portfólio | Só na Fase 7. Rota `/demo` com seed fictício; dados reais sempre atrás do login. |

---

## 3. Stack

- **Monorepo** com pnpm workspaces (ou Turborepo).
- **apps/web** — Next.js (App Router) + TypeScript + Tailwind. Deploy: Vercel.
- **apps/worker** — Node + TypeScript. Agendador, loop da Orion, adaptadores de canal. Deploy: Railway/Render (ou VPS).
- **packages/core** — modelo de dados, validações (zod), ações dos andares, contratos das tools. Importado por `web` e `worker`.
- **packages/orion** — LLMProvider, prompt/personalidade, memória, executor de tools, canais.
- **Banco/Auth** — Supabase (Postgres + Auth Google + RLS). Acesso via `@supabase/supabase-js`; migrations versionadas em `supabase/migrations`.
- **IA** — Gemini Flash via `LLMProvider`. Interface obrigatória:
  ```ts
  interface LLMProvider {
    complete(input: { system: string; messages: Message[]; tools?: ToolSpec[] }): Promise<LLMResult>;
  }
  ```
  Trocar de modelo = trocar uma implementação. Nada fora de `packages/orion/providers/` pode importar SDK de IA.
- **Integrações** — Google Calendar e Gmail (OAuth Google com escopos incrementais), GitHub (token pessoal), Notion (opcional).
- **Testes** — Vitest. Testar `core` e `orion` com prioridade; UI só o essencial.
- **Não usar**: Firebase, ORMs pesados, bibliotecas de agente prontas (LangChain etc.). O agente é escrito à mão — é parte do aprendizado.

---

## 4. Estrutura do repositório

```
orion/
  apps/
    web/          # Next.js — sidebar, andares, aba Orion, /demo
    worker/       # agendador + Orion em segundo plano + Telegram
  packages/
    core/         # schema, tipos, ações por andar, consultas do Hoje
    orion/        # providers/, memory/, tools/, channels/, prompt.ts
  supabase/
    migrations/
    seed.demo.sql # dados fictícios para /demo
  CLAUDE.md
```

Convenção: cada andar tem uma pasta em `packages/core/floors/<andar>/` com `schema.ts`, `actions.ts` e `queries.ts`. As `actions` são as tools da Orion. Cada action declara: nome, descrição em português, schema zod de entrada, se é `mutation`, e se exige aprovação.

---

## 5. Modelo de dados por andar

Todas as tabelas têm `id uuid`, `user_id`, `created_at`, `updated_at`, `archived_at` (nulo = ativo). Arquivo = tudo com `archived_at` preenchido ou status concluído.

### Faculdade (grão: semestre)
- `semesters` — nome, início, fim, ativo
- `courses` (cadeiras) — semester_id, nome, código, professor, cor, limite_faltas
- `class_slots` — course_id, dia_semana, hora_início, hora_fim, local
- `assessments` — course_id, título, tipo, data, peso, nota (nulo até sair)
- `absences` — course_id, data, justificada
- `course_materials` — course_id, título, url
- Derivados: próxima aula, provas nos próximos 14 dias, "nota necessária" por cadeira, faltas restantes.

### Estudo (grão: trilha)
- `tracks` — nome, tipo (curso, livro, idioma, tema), status, course_id opcional (liga a uma cadeira)
- `track_items` — track_id, título, ordem, concluído_em
- `study_sessions` — track_id, data, duração_min, notas
- Derivados: próximo item por trilha ativa, horas na semana.

### Projetos (grão: projeto)
- `projects` — nome, tipo (freela, pessoal, portfólio, candidatura), status, repo_url, deploy_url, cliente, prazo, próximo_passo
- `project_tasks` — project_id, título, duração_est_min, prioridade, prazo, concluída_em
- `project_activity` — project_id, fonte (github, manual), payload, data
- Busca de estágio vive aqui como projetos do tipo `candidatura`.
- Derivados: projetos parados há > N dias, tarefas com prazo nos próximos 7 dias.

### Rotina (grão: hábito e bloco)
- `habits` — nome, frequência (diária, dias da semana), horário sugerido, ativo
- `habit_logs` — habit_id, data, feito
- `time_blocks` (semana-tipo) — tipo (aula, trabalho, treino, sono, livre…), dia_semana, início, fim, origem (manual ou gerado de `class_slots`)
- Derivados: hábitos do dia, streaks, **janelas livres** (calculadas a partir de `time_blocks` + eventos do Calendar).

### Compras (grão: item)
- `wishlist_items` — nome, preço_est, prioridade, url, comprado_em
- `purchases` — nome, valor, data, categoria, fonte (manual, gmail), aprovado
- `recurring_items` — nome, categoria, intervalo_dias, última_compra, próxima_prevista
- Derivados: reposições vencendo, gasto do mês por categoria, entregas previstas.

### Skincare (grão: rotina)
- `skincare_products` — nome, marca, tipo, aberto_em, duração_est_dias, recurring_item_id opcional
- `skincare_routines` — período (AM, PM), lista ordenada de product_id
- `skincare_logs` — data, período, feito, observação_pele
- Derivados: check do dia, produtos perto do fim.

### Metas (grão: meta)
- `goals` — título, horizonte (semestre, ano, longo_prazo), status, prazo
- `goal_links` — goal_id, tipo_alvo (project, track, course, habit), alvo_id
- `goal_reviews` — goal_id, data, avanço, travas, decisão
- Não alimenta o Hoje. Revisão mensal guiada pela Orion.

### Orion (interno)
- `orion_memory` — fato, categoria, origem (usuário, inferido), confiança, última_confirmação
- `orion_conversations` / `orion_messages` — histórico por canal (web, telegram)
- `orion_proposals` — ação proposta, payload, status (pendente, aprovada, rejeitada), expira_em
- `orion_jobs` — rotina, agendamento, última_execução, resultado (garante idempotência)

### Hoje (consulta)
Junta: próxima aula, provas ≤ 14 dias, hábitos do dia, tarefas com prazo ≤ 7 dias, próximo item de estudo, reposições vencendo, entregas, propostas pendentes da Orion, plano do dia gerado pela Orion.

---

## 6. A Orion

### Identidade
Assistente pessoal do Caueh. Fala português, tom direto e próximo, sem enrolação. Conhece o sistema inteiro e age através das tools. Nunca inventa dados — se não sabe, consulta ou pergunta. `packages/orion/prompt.ts` contém o system prompt; personalidade e regras vivem lá, não espalhadas.

### Arquitetura
1. **Entrada** chega por um canal (web ou Telegram) ou por uma rotina do agendador.
2. **Contexto** é montado: system prompt + memória relevante + resumo do Hoje + histórico recente da conversa.
3. **Loop de tools**: o modelo responde; se pedir tool, o executor valida a entrada (zod), verifica se exige aprovação e executa ou cria uma `orion_proposal`; o resultado volta ao modelo; repete até resposta final. Limite de iterações por turno (ex.: 8).
4. **Saída** vai pelo mesmo canal de entrada. Rotinas usam o canal padrão (Telegram, com fallback para o site).

### Memória
- Fatos duráveis sobre o usuário (preferências, padrões, decisões), não transcrição de conversa.
- Escrita: após cada turno, um passo separado extrai fatos novos; o usuário pode pedir "lembra que…" ou "esquece…".
- Leitura: busca por categoria e texto (full-text do Postgres basta no início; embeddings só se precisar).
- Nunca guardar dados sensíveis desnecessários.

### Regras de autonomia
- Toda tool `mutation` exige aprovação, exceto as listadas em `auto_ok` (ex.: marcar hábito feito quando o usuário disse que fez, registrar sessão de estudo relatada).
- Propostas aparecem no Hoje e no Telegram com botões aprovar/rejeitar. Expiram em 24h.
- A Orion nunca envia e-mail, nunca altera o Calendar sem aprovação, nunca apaga nada — só arquiva.

### Encaixe de tarefas no horário
Entrada: tarefas com `duração_est_min` e prioridade + janelas livres (Rotina + Calendar). Saída: proposta de blocos ("Java OOP, 1h30, terça 14h"). Regras: respeitar sono e refeições, não encaixar mais que N horas de foco por dia (config), preferir manhã para estudo se o usuário não disser o contrário. Sempre proposta.

---

## 7. Worker e rotinas

Agendador com cron em memória (`node-cron` ou similar) + tabela `orion_jobs` para registrar execuções. **Idempotente**: rodar duas vezes não duplica nada — cada rotina checa `orion_jobs` antes de agir.

| Rotina | Quando | Faz |
|---|---|---|
| Montar o dia | 07:00 | Lê Hoje, monta plano em texto curto + propostas de encaixe, envia. |
| Vigia | a cada 30 min, 7h–23h | Gmail (avisos, pedidos), Calendar (mudanças), GitHub (atividade). Registra novidades como propostas. |
| Pendências | a cada 2h, 9h–21h | Avisa o que falta e a próxima janela livre. Silencia se nada mudou. |
| Fechamento | 22:00 | Lista o que ficou, propõe empurrar para amanhã, pergunta como foi o dia (alimenta memória). |
| Semana | domingo 19:00 | Planeja a semana com provas, prazos e semana-tipo. |
| Reposição | diário 08:00 | Itens recorrentes e produtos de skincare perto do fim. |

Horários e fuso (`America/Fortaleza`) configuráveis em uma tabela `settings`.

---

## 8. Canais e integrações

### Canais (`packages/orion/channels/`)
Interface: `send(userId, message, options)` e um handler de entrada. Implementações: `web` (aba do site), `telegram` (bot via grammY ou telegraf, com botões inline para propostas). Preparar `whatsapp` como stub com a mesma interface.

### Integrações (`packages/core/integrations/`)
Cada uma é um adaptador com `sync()` e, quando houver, `push()`.
- **Google Calendar** — leitura de eventos (janelas livres, Hoje); escrita apenas via proposta aprovada. Aulas de `class_slots` podem ser espelhadas no Calendar (opcional).
- **Gmail** — só leitura. Filtros: remetentes da UNIFOR, confirmações de pedido. Gera propostas; nunca envia nada.
- **GitHub** — atividade dos repositórios ligados a `projects`.
- **Notion** — opcional, importação para Estudo.
Tokens OAuth ficam no Supabase, criptografados, acessíveis só pelo worker/servidor.

---

## 9. Modo aprendizado (obrigatório)

O objetivo é o Caueh **entender** o que está sendo construído, não só receber código pronto.

1. Antes de implementar algo com decisão de arquitetura (schema, auth, worker, tools, integração), explique em poucos parágrafos **o que** vai fazer, **por que** assim e **qual alternativa** foi descartada. Espere confirmação.
2. Trabalhe em **features pequenas**, um commit por feature, mensagem de commit descritiva em português.
3. Ao terminar cada feature, diga como testar manualmente e peça para ele rodar antes de seguir.
4. Comente o código onde a intenção não é óbvia; não comente o óbvio.
5. Ao final de cada fase, escreva um `docs/fase-N.md` curto: o que foi feito, conceitos novos, o que ler para aprofundar.
6. Se ele pedir "explica isso", explique no nível de quem está aprendendo, com exemplo do próprio projeto.
7. Não pule etapas para "ir mais rápido".

---

## 10. Plano de fases

Regra: uma fase só termina quando o Caueh usou o resultado por pelo menos um dia real.

### Fase 0 — Fundação
Monorepo, `apps/web` com sidebar vazia e os andares como rotas, Supabase com login Google travado em `OWNER_EMAIL`, RLS, tabela `settings`, migrations iniciais, `packages/core` com estrutura de andares. Entrega: abrir o site logado e ver a estrutura.

### Fase 1 — Faculdade + Hoje
Tabelas de Faculdade, telas de semestre/cadeiras/horário/avaliações/faltas, cálculo de nota necessária, `time_blocks` gerados a partir de `class_slots`. Hoje mostra próxima aula e provas próximas. Entrega: semestre atual cadastrado e em uso.

### Fase 2 — Rotina + Projetos
Hábitos com check e streak, semana-tipo editável, cálculo de janelas livres. Projetos com tarefas e próximos passos. Hoje completo (sem Orion). Entrega: o site substitui a organização atual.

### Fase 3 — Orion falando
`packages/orion`: `LLMProvider` (Gemini Flash), prompt, memória, executor de tools sobre as actions existentes, propostas com aprovação. `apps/worker` com endpoint de chat. Aba Orion no site e bot no Telegram. Entrega: conversar com a Orion e ela executar ações nos andares existentes.

### Fase 4 — Orion acordando
Agendador e rotinas (montar o dia, fechamento, semana, pendências). `orion_jobs` com idempotência. Encaixe de tarefas nas janelas livres. Entrega: receber o plano do dia no Telegram às 7h.

### Fase 5 — Integrações
Google Calendar, Gmail (vigia), GitHub. Uma por vez, cada uma com `sync()` e testes. Entrega: Hoje e Orion alimentados por dados de fora.

### Fase 6 — Andares restantes
Estudo, Compras, Skincare, Metas (com revisão mensal), Arquivo. Cada um seguindo o padrão: schema → actions/tools → tela → rotina se houver.

### Fase 7 — Portfólio
README com arquitetura e diagrama, `seed.demo.sql`, rota `/demo` em modo leitura com dados fictícios, prints. Revisão de segurança final (nenhum segredo no cliente, RLS em tudo).

---

## 11. Convenções

- TypeScript estrito, sem `any`.
- Nomes de tabelas e colunas em inglês; textos de interface e da Orion em português.
- Validação de entrada sempre com zod, no `core`.
- Toda mutação passa por uma action do `core` — nunca chamar o Supabase direto de um componente.
- Variáveis de ambiente documentadas em `.env.example`; nunca commitar segredos.
- Perguntar antes de adicionar dependência nova.
