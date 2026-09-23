# Ideias e pendências

Coisas que surgiram durante o uso e ainda não entraram. Não é o plano
de fases (esse está no CLAUDE.md) — é o caderno de rascunho.

## Feito

- [x] Saudação variada no Hoje, com o nome do usuário e mensagem de
      madrugada (`apps/web/src/lib/saudacao.ts`).

## A fazer

- [ ] **Streaming da resposta da Orion.** Hoje a resposta chega inteira
      de uma vez; ver o texto aparecendo palavra a palavra encurta a
      espera percebida mais do que qualquer otimização de servidor.

- [ ] **Hospedar o worker.** O Codespaces desliga sozinho; sem um lugar
      que fique de pé (Railway, Render, VPS), as rotinas da Fase 4 não
      acontecem.
- [ ] **Tela de configurações.** `settings` já é lida pelo código (fuso,
      faixa do dia, teto de foco, canal), mas só dá para gravar pelo
      banco.

- [ ] **Faixa do dia nas janelas livres.** Hoje é fixa em 7h–23h
      (`DIA_COMECA`/`DIA_TERMINA` em `rotina/janelas.ts`). Deveria vir da
      tabela `settings`, junto com o fuso.

- [ ] **Desarquivar pela interface.** Hoje, arquivar é irreversível sem
      mexer no Table Editor do Supabase. O andar Arquivo (Fase 6) deve
      resolver, mas um "desfazer" logo após arquivar seria útil antes.
- [ ] **Nome e fuso na tabela `settings`.** Agora `OWNER_NAME` é
      variável de ambiente; o certo é vir do banco, editável pelo site.
- [ ] **Deploy na Vercel.** Resolve o incômodo da URL do Codespaces
      mudar a cada recriação, que obriga a reconfigurar o Supabase.
- [ ] **Falta parcial.** Chegar atrasado e perder só a primeira de duas
      aulas seguidas conta como 2. Decisão consciente (o portal da
      UNIFOR é a fonte oficial), mas pode incomodar.
- [ ] **Materiais da cadeira.** A tabela `course_materials` existe desde
      a Fase 1 e ainda não tem tela.
