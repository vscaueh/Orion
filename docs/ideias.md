# Ideias e pendências

Coisas que surgiram durante o uso e ainda não entraram. Não é o plano
de fases (esse está no CLAUDE.md) — é o caderno de rascunho.

## Feito

- [x] Saudação variada no Hoje, com o nome do usuário e mensagem de
      madrugada (`apps/web/src/lib/saudacao.ts`).

## A fazer

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
