# Fase 2 — Rotina + Projetos

## O que foi feito

- **Andar Rotina** — hábitos com check diário e sequência, e a semana-tipo com o cálculo de janelas livres. Tabelas `habits` e `habit_logs`; `time_blocks` já existia desde a Fase 1.
- **Andar Projetos** — projetos (freela, pessoal, portfólio, candidatura) com próximo passo, prazo e links; tarefas com duração estimada, prioridade e prazo. Tabelas `projects` e `project_tasks`.
- **Hoje completo** (sem Orion) — próxima aula, provas em 14 dias, hábitos do dia, tarefas com prazo em 7 dias e as janelas livres de hoje.
- **88 testes** no `packages/core`.

## Conceitos novos

- **Modelar para eliminar ramificação.** A frequência de um hábito é o próprio conjunto de dias da semana: "diário" é valer nos sete. Um campo só, e a pergunta "vale hoje?" é sempre a mesma checagem — sem `if` entre dois tipos de hábito espalhado pelo código.
- **Algoritmo de intervalos.** `janelasLivres()` é o complemento dos compromissos dentro da faixa aproveitável do dia. O passo que não é óbvio é **unir os intervalos sobrepostos antes** de procurar os vãos: sem isso, dois compromissos que se cruzam deixam um buraco fantasma entre eles. Os testes cobrem justamente esses casos.
- **Sequência com dias condicionais.** A contagem anda para trás olhando só os dias em que o hábito vale, e trata hoje como ainda em aberto: quem treina seg/qua/sex não perde a sequência na terça, e não marcar ainda hoje de manhã não zera nada.
- **`auto_ok` na prática.** `marcarHabito` e `concluirTarefa` são as primeiras actions com `requiresApproval: false`. É a regra de autonomia do CLAUDE.md: quando o usuário está contando o que já fez, não há o que a Orion aprovar.
- **O Hoje como junção, não como tabela.** `resumoDoDia()` chama as queries dos outros andares em paralelo (`Promise.all`) e monta o resumo. Nenhum dado é duplicado — a regra "um dado mora num único andar" continua de pé.
- **Dado espelhado tem dono.** Blocos da semana-tipo gerados de `class_slots` não podem ser removidos pela Rotina: a action filtra por `source = 'manual'`. Quem manda é a Faculdade.

## Testando manualmente

```bash
pnpm dev
```

Em **Rotina**: crie um hábito (experimente um de dias específicos), marque-o, veja a sequência aparecer. Adicione blocos de trabalho e sono à semana-tipo e confira as janelas livres calculadas entre eles.

Em **Projetos**: crie um projeto, adicione uma tarefa com prazo e duração estimada, conclua uma.

Em **Hoje**: tudo deve aparecer junto — aula, provas, hábitos, tarefas e as janelas livres do dia.

## Para aprofundar

- [Merge intervals](https://en.wikipedia.org/wiki/Interval_scheduling) — a família de algoritmos das janelas livres
- [Promise.all](https://developer.mozilla.org/pt-BR/docs/Web/JavaScript/Reference/Global_Objects/Promise/all) — buscar em paralelo em vez de em sequência
- [Índices parciais e compostos no Postgres](https://www.postgresql.org/docs/current/indexes-multicolumn.html)
