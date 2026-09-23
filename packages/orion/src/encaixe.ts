import { rotina, type projetos } from "@orion/core";

// Encaixe de tarefas nas janelas livres. É o que transforma "tenho 3
// tarefas e 4 horas livres" numa proposta concreta de horário.
//
// Puro de propósito: entra lista de tarefas e de janelas, sai lista de
// blocos. Nenhuma chamada de modelo — isto é aritmética, e aritmética
// feita por código não erra nem custa tokens. O modelo entra depois,
// só para escrever a mensagem.

export interface TarefaParaEncaixar {
  id: string;
  titulo: string;
  duracaoMin: number;
  prioridade: projetos.Prioridade;
  prazo: string | null;
}

export interface Encaixe {
  tarefa: TarefaParaEncaixar;
  inicio: number;
  fim: number;
}

export interface ResultadoDoEncaixe {
  encaixes: Encaixe[];
  /** O que não coube — vale dizer, para o dia não parecer resolvido. */
  naoCoube: TarefaParaEncaixar[];
}

/** Teto de foco num dia. Encher 10 horas de tarefas não é um plano. */
export const MAX_FOCO_MIN = 4 * 60;

const PESO: Record<projetos.Prioridade, number> = {
  alta: 0,
  media: 1,
  baixa: 2,
};

/**
 * Ordem de atendimento: prazo mais próximo primeiro, prioridade
 * desempata, e a tarefa mais curta ganha do resto — assim um item
 * grande não bloqueia três pequenos que caberiam no mesmo espaço.
 */
function ordenar(
  tarefas: readonly TarefaParaEncaixar[],
): TarefaParaEncaixar[] {
  return [...tarefas].sort((a, b) => {
    if (a.prazo !== b.prazo) {
      if (a.prazo === null) return 1;
      if (b.prazo === null) return -1;
      return a.prazo.localeCompare(b.prazo);
    }
    return PESO[a.prioridade] - PESO[b.prioridade] || a.duracaoMin - b.duracaoMin;
  });
}

export function encaixarTarefas(
  tarefas: readonly TarefaParaEncaixar[],
  janelas: readonly rotina.Intervalo[],
  {
    agora = 0,
    maxFocoMin = MAX_FOCO_MIN,
  }: { agora?: number; maxFocoMin?: number } = {},
): ResultadoDoEncaixe {
  // Janela que já passou não serve, e a que está em curso só vale do
  // agora em diante.
  const disponiveis = janelas
    .map((j) => ({ inicio: Math.max(j.inicio, agora), fim: j.fim }))
    .filter((j) => j.fim > j.inicio)
    .sort((a, b) => a.inicio - b.inicio);

  const encaixes: Encaixe[] = [];
  const naoCoube: TarefaParaEncaixar[] = [];
  let focoUsado = 0;

  for (const tarefa of ordenar(tarefas)) {
    if (focoUsado + tarefa.duracaoMin > maxFocoMin) {
      naoCoube.push(tarefa);
      continue;
    }

    // Primeiro espaço contíguo que comporta a tarefa inteira. Partir
    // uma tarefa em dois pedaços distantes raramente ajuda.
    const janela = disponiveis.find(
      (j) => j.fim - j.inicio >= tarefa.duracaoMin,
    );
    if (!janela) {
      naoCoube.push(tarefa);
      continue;
    }

    const inicio = janela.inicio;
    const fim = inicio + tarefa.duracaoMin;
    encaixes.push({ tarefa, inicio, fim });

    janela.inicio = fim; // o resto da janela continua disponível
    focoUsado += tarefa.duracaoMin;
  }

  return { encaixes, naoCoube };
}

/** "Ajustar layout do cliente · 14:00–15:30 (1h30)" */
export function descreverEncaixe(encaixe: Encaixe): string {
  const { inicio, fim, tarefa } = encaixe;
  return (
    `${tarefa.titulo} · ${rotina.formatarMinutos(inicio)}–` +
    `${rotina.formatarMinutos(fim)} (${rotina.descreverDuracao(tarefa.duracaoMin)})`
  );
}
