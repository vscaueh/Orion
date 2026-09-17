import type { ActionContext } from "../../action";
import { agoraNoFuso, type Agora } from "../../tempo";
import {
  listarAvaliacoes,
  listarCadeiras,
  listarHorarios,
  listarSemestres,
  type Assessment,
  type ClassSlot,
  type Course,
} from "../faculdade";
import { proximaAula, provasProximas, type ProximaAula } from "./resumo";

// O Hoje não tem tabelas próprias: é uma consulta que junta os andares.
// Por ora, Faculdade; Rotina e Projetos entram na Fase 2.

export interface ResumoHoje {
  agora: Agora;
  proximaAula: (ProximaAula<ClassSlot> & { cadeira: Course }) | null;
  provas: { avaliacao: Assessment; cadeira: Course }[];
}

export async function resumoDoDia(
  ctx: ActionContext,
  quando = new Date(),
): Promise<ResumoHoje> {
  const agora = agoraNoFuso(undefined, quando);

  const semestres = await listarSemestres(ctx);
  const ativo = semestres.find((s) => s.active);
  if (!ativo) return { agora, proximaAula: null, provas: [] };

  const cadeiras = await listarCadeiras(ctx, ativo.id);
  const ids = cadeiras.map((c) => c.id);
  const [horarios, avaliacoes] = await Promise.all([
    listarHorarios(ctx, ids),
    listarAvaliacoes(ctx, ids),
  ]);

  const porId = new Map(cadeiras.map((c) => [c.id, c]));
  const proxima = proximaAula(agora.diaSemana, agora.minutos, horarios);

  return {
    agora,
    proximaAula: proxima
      ? { ...proxima, cadeira: porId.get(proxima.aula.course_id)! }
      : null,
    // Nota já lançada significa prova feita, mesmo que a data ainda
    // não tenha chegado no calendário.
    provas: provasProximas(
      agora.dataIso,
      avaliacoes.filter((a) => a.grade === null),
    ).map((avaliacao) => ({
      avaliacao,
      cadeira: porId.get(avaliacao.course_id)!,
    })),
  };
}
