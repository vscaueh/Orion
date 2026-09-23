# Fase 4 — Orion acordando

## O que foi feito

- **Encaixe de tarefas** — dadas as tarefas com duração estimada e as janelas livres do dia, sai uma proposta de blocos com horário. Função pura, 11 testes.
- **Agendador** no worker (`node-cron`), no fuso do usuário, com quatro rotinas: montar o dia (7h), pendências (de 2 em 2h, 9h–21h), fechamento (22h) e semana (domingo 19h).
- **`orion_jobs`** — registro de execuções que garante que cada rotina roda uma vez por janela.
- **`settings` em uso** — fuso, faixa do dia, teto de foco e canal padrão saem da tabela criada na Fase 0, com padrões para o que não estiver gravado.
- **`pnpm start -- rodar "montar o dia"`** — executa uma rotina na hora, sem esperar o relógio.

## Conceitos novos

- **Idempotência não vem do agendador, vem do registro.** O cron dispara; quem decide se a rotina age é a tabela `orion_jobs`. Worker reiniciado às 7h05, cron atrasado, duas instâncias no ar — em qualquer um desses casos a mensagem sai uma vez, porque a chave `(rotina, janela)` é única no banco.
- **A marca é gravada antes do trabalho.** Se a rotina explode no meio, ela não se repete sozinha na próxima batida. Repetir um aviso é pior do que perder um: ensina o usuário a ignorar as mensagens.
- **Silêncio é uma resposta.** Toda rotina pode devolver `null`, e a de pendências devolve na maior parte das vezes. Um sistema que fala sem ter assunto vira ruído e deixa de ser lido.
- **Modelo só onde há linguagem.** As rotinas montam a mensagem a partir de consultas ao banco, sem chamar o modelo. "Tem prova amanhã?" é uma consulta — não erra, não custa token e não inventa. Isso também é o que torna a Fase 4 viável no free tier: mil execuções por mês do agendador custam zero.
- **Encaixe guloso com regras explícitas.** Ordena por prazo, desempata por prioridade, e entre iguais a tarefa mais curta vai primeiro (para uma grande não bloquear três pequenas). Respeita o teto de foco do dia, ignora o que já passou e aproveita o resto da janela em curso. Nada disso é opinião do modelo: é aritmética testada.
- **Configuração com padrão.** `lerConfiguracoes` cai nos padrões para o que faltar. Um valor ausente nunca deve impedir uma rotina de rodar.

## Testando manualmente

```bash
cd apps/worker
cp .env.example .env   # e preencha
pnpm start -- rodar "montar o dia"
```

A mensagem chega no Telegram na hora. Rode duas vezes: a segunda não envia nada, porque `orion_jobs` já registrou a janela — é a idempotência funcionando.

Depois, `pnpm start` sem argumentos deixa o agendador e o bot no ar.

## Onde hospedar

O Codespaces desliga sozinho, então as rotinas não vão acontecer com o worker rodando lá. Para receber o plano do dia às 7h de verdade, o worker precisa de um lugar que fique de pé: Railway, Render ou uma VPS, conforme o CLAUDE.md. O `apps/web` continua indo para a Vercel.

## Para aprofundar

- [node-cron](https://github.com/node-cron/node-cron) — expressões cron e fuso horário
- [Idempotência](https://en.wikipedia.org/wiki/Idempotence) aplicada a jobs
- [Bin packing](https://en.wikipedia.org/wiki/Bin_packing_problem) — a família de problemas do encaixe; o guloso é a aproximação prática
