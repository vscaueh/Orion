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
import {
  listarProjetos,
  listarTarefas,
  tarefasComPrazo,
  type Project,
  type ProjectTask,
} from "../projetos";
import {
  intervalosDoDia,
  janelasLivres,
  listarBlocos,
  listarHabitos,
  listarRegistros,
  streak,
  totalLivre,
  valeHoje,
  type Habit,
  type Intervalo,
} from "../rotina";
import { proximaAula, provasProximas, type ProximaAula } from "./resumo";

// O Hoje não tem tabelas próprias: é uma consulta que junta os andares.
// Por ora, Faculdade; Rotina e Projetos entram na Fase 2.

export interface HabitoDoDia {
  habito: Habit;
  feito: boolean;
  sequencia: number;
}

export interface ResumoHoje {
  agora: Agora;
  proximaAula: (ProximaAula<ClassSlot> & { cadeira: Course }) | null;
  provas: { avaliacao: Assessment; cadeira: Course }[];
  habitos: HabitoDoDia[];
  tarefas: { tarefa: ProjectTask; projeto: Project }[];
  janelas: Intervalo[];
  minutosLivres: number;
}

export async function resumoDoDia(
  ctx: ActionContext,
  quando = new Date(),
): Promise<ResumoHoje> {
  const agora = agoraNoFuso(undefined, quando);

  const [semestres, habitos, registros, blocos, projetos, tarefas] =
    await Promise.all([
      listarSemestres(ctx),
      listarHabitos(ctx),
      listarRegistros(ctx, agora.dataIso),
      listarBlocos(ctx),
      listarProjetos(ctx),
      listarTarefas(ctx),
    ]);

  // Rotina: o que vale hoje, com a sequência de cada um.
  const feitosPorHabito = new Map<string, Set<string>>();
  for (const registro of registros) {
    const datas = feitosPorHabito.get(registro.habit_id) ?? new Set<string>();
    datas.add(registro.date);
    feitosPorHabito.set(registro.habit_id, datas);
  }

  const habitosDoDia = habitos
    .filter((h) => valeHoje(agora.dataIso, h.weekdays))
    .map((habito) => {
      const feitos = feitosPorHabito.get(habito.id) ?? new Set<string>();
      return {
        habito,
        feito: feitos.has(agora.dataIso),
        sequencia: streak(agora.dataIso, habito.weekdays, feitos),
      };
    });

  const janelas = janelasLivres(intervalosDoDia(blocos, agora.diaSemana));

  // Projetos: o que tem prazo batendo na porta.
  const projetoPorId = new Map(projetos.map((p) => [p.id, p]));
  const tarefasDoDia = tarefasComPrazo(agora.dataIso, tarefas)
    .filter((t) => projetoPorId.has(t.project_id))
    .map((tarefa) => ({ tarefa, projeto: projetoPorId.get(tarefa.project_id)! }));

  const base = {
    agora,
    habitos: habitosDoDia,
    tarefas: tarefasDoDia,
    janelas,
    minutosLivres: totalLivre(janelas),
  };

  // Faculdade só entra com um semestre ativo.
  const ativo = semestres.find((s) => s.active);
  if (!ativo) return { ...base, proximaAula: null, provas: [] };

  const cadeiras = await listarCadeiras(ctx, ativo.id);
  const ids = cadeiras.map((c) => c.id);
  const [horarios, avaliacoes] = await Promise.all([
    listarHorarios(ctx, ids),
    listarAvaliacoes(ctx, ids),
  ]);

  const porId = new Map(cadeiras.map((c) => [c.id, c]));
  const proxima = proximaAula(agora.diaSemana, agora.minutos, horarios);

  return {
    ...base,
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
