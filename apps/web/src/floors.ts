// Registro dos andares do prédio. Vai migrar para packages/core assim que
// o pacote existir, para que web e worker leiam a mesma lista.

export interface Floor {
  id: string;
  nome: string;
  rota: string;
  descricao: string;
}

export const FLOORS: readonly Floor[] = [
  { id: "hoje", nome: "Hoje", rota: "/", descricao: "Seu dia em uma tela: próxima aula, provas, hábitos, prazos e propostas da Orion." },
  { id: "faculdade", nome: "Faculdade", rota: "/faculdade", descricao: "Semestres, cadeiras, horário, avaliações e faltas." },
  { id: "estudo", nome: "Estudo", rota: "/estudo", descricao: "Trilhas de estudo, sessões e progresso." },
  { id: "projetos", nome: "Projetos", rota: "/projetos", descricao: "Freelas, projetos pessoais, portfólio e candidaturas." },
  { id: "rotina", nome: "Rotina", rota: "/rotina", descricao: "Hábitos, semana-tipo e janelas livres." },
  { id: "compras", nome: "Compras", rota: "/compras", descricao: "Lista de desejos, compras e itens recorrentes." },
  { id: "skincare", nome: "Skincare", rota: "/skincare", descricao: "Produtos, rotinas AM/PM e check diário." },
  { id: "metas", nome: "Metas", rota: "/metas", descricao: "Metas por horizonte e revisões mensais." },
  { id: "arquivo", nome: "Arquivo", rota: "/arquivo", descricao: "Tudo que foi concluído ou arquivado." },
  { id: "orion", nome: "Orion", rota: "/orion", descricao: "Converse com a Orion e acompanhe o que ela propôs." },
] as const;
