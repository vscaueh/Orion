# Fase 3 — Orion falando

## O que foi feito

- **`packages/orion`** — `LLMProvider` (implementado sobre o Gemini), `prompt.ts` com a personalidade, memória de fatos duráveis, executor de tools sobre as actions do core, loop do agente e propostas com aprovação.
- **`apps/worker`** — processo Node onde a Orion vive fora do site. Hoje roda o bot do Telegram; na Fase 4 ganha o agendador.
- **Canais** (`packages/orion/src/channels/`) — interface comum, implementação do Telegram com botões de aprovar/rejeitar, e o WhatsApp como stub.
- **Aba Orion no site** — conversa com histórico, e as propostas pendentes aparecendo também no Hoje.
- **4 tabelas** — `orion_memory`, `orion_conversations`, `orion_messages`, `orion_proposals`.
- **19 testes** no `packages/orion`, incluindo o loop inteiro sem tocar na rede.

## Conceitos novos

- **Interface antes de implementação.** `LLMProvider` tem um método. Nada fora de `providers/` sabe qual modelo roda — trocar de modelo é escrever um arquivo e mudar uma variável de ambiente. A mesma ideia vale para `Canal`: o código que fala com o usuário não sabe se é site ou Telegram.
- **Loop de ferramentas.** O modelo não "executa" nada: ele devolve um pedido, o nosso código valida e executa, o resultado volta como mensagem, e o modelo responde de novo. Até oito voltas, senão um pedido mal formulado gira para sempre.
- **As tools são as actions.** Cada action já declarava nome, descrição em português e schema zod desde a Fase 1. O registro de ferramentas é literalmente uma lista delas — zero reimplementação. Foi a aposta da Fase 1 pagando aqui.
- **Redução de schema na fronteira.** O modelo aceita só um subconjunto do JSON Schema. Mandar o schema zod cru faz a chamada ser recusada; o que se perde (formato de data) vira texto na descrição, que ele lê igual.
- **Proposta em vez de execução.** Action com `requiresApproval` não roda no loop: é validada, guardada e devolvida ao modelo como "pendente" — para ele não dizer que fez o que não fez. Aprovar executa a action guardada; se falhar, a proposta continua pendente com o erro, para corrigir em vez de perder o pedido.
- **Testar um agente sem rede.** Um `LLMProvider` falso com respostas roteirizadas testa o loop inteiro: proposta em vez de execução, entrada inválida voltando como erro, teto de iterações. Rápido, determinístico e de graça.
- **Long polling.** O bot pergunta ao Telegram se há novidade e espera até 30 segundos pela resposta. Sem webhook, sem URL pública — funciona igual no Codespaces e numa VPS.
- **Servidor sem sessão.** O worker não tem usuário logado: usa a chave secreta do Supabase e o id do dono. Isso contorna a RLS, então o cuidado passa para o código — e ele já filtra por `userId` em toda action e query, porque o `ActionContext` sempre carregou isso.

## Configurando

No `apps/web/.env.local`: `GEMINI_API_KEY` (gere em [aistudio.google.com/apikey](https://aistudio.google.com/apikey); exige 18+).

Para o worker, copie `apps/worker/.env.example` para `apps/worker/.env`. Além da chave do modelo, ele precisa da **chave secreta** do Supabase e do seu `OWNER_USER_ID` (Authentication → Users). Para o Telegram: crie o bot com o [@BotFather](https://t.me/BotFather), mande uma mensagem a ele e pegue o `chat.id` em `https://api.telegram.org/bot<TOKEN>/getUpdates`.

```bash
pnpm --filter @orion/worker start
```

## Testando manualmente

Na aba **Orion**: pergunte algo que dependa dos seus dados ("quanto posso faltar em POO?"), peça algo que mude dados ("cria um projeto freela chamado X" — deve virar proposta) e conte algo já feito ("marquei a academia hoje" — deve executar direto, porque é `auto_ok`).

No **Telegram**, as mesmas coisas, com os botões de aprovar e rejeitar nas propostas.

## Para aprofundar

- [Function calling no Gemini](https://ai.google.dev/gemini-api/docs/function-calling)
- [Telegram Bot API](https://core.telegram.org/bots/api) — `getUpdates`, `sendMessage`, `answerCallbackQuery`
- [Service role e RLS no Supabase](https://supabase.com/docs/guides/database/postgres/row-level-security)
