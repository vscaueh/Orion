import { faculdade, rotina, type hoje } from "@orion/core";

/**
 * O Hoje em texto, para entrar no contexto do modelo. Deliberadamente
 * compacto: o que ele precisa é saber o que existe, não ler um
 * relatório.
 */
export function resumoEmTexto(resumo: hoje.ResumoHoje): string {
  const linhas: string[] = [];

  if (resumo.proximaAula) {
    const { cadeira, aula, diasAFrente } = resumo.proximaAula;
    const quando =
      diasAFrente === 0
        ? "hoje"
        : diasAFrente === 1
          ? "amanhã"
          : faculdade.DIAS_SEMANA[aula.weekday]?.toLowerCase();
    linhas.push(
      `Próxima aula: ${cadeira.name}, ${quando} às ${faculdade.formatarHora(aula.starts_at)}.`,
    );
  }

  if (resumo.provas.length > 0) {
    const provas = resumo.provas
      .map((p) => `${p.cadeira.name} ${p.avaliacao.type ?? ""} em ${p.avaliacao.date}`)
      .join("; ");
    linhas.push(`Provas nos próximos 14 dias: ${provas}.`);
  }

  if (resumo.habitos.length > 0) {
    const habitos = resumo.habitos
      .map((h) => `${h.habito.name}${h.feito ? " (feito)" : ""}`)
      .join("; ");
    linhas.push(`Hábitos de hoje: ${habitos}.`);
  }

  if (resumo.tarefas.length > 0) {
    const tarefas = resumo.tarefas
      .map((t) => `${t.tarefa.title} (${t.projeto.name}, prazo ${t.tarefa.due_on})`)
      .join("; ");
    linhas.push(`Tarefas com prazo: ${tarefas}.`);
  }

  if (resumo.janelas.length > 0) {
    const janelas = resumo.janelas
      .filter((j) => j.fim > resumo.agora.minutos)
      .map(
        (j) =>
          `${rotina.formatarMinutos(Math.max(j.inicio, resumo.agora.minutos))}–${rotina.formatarMinutos(j.fim)}`,
      )
      .join(", ");
    if (janelas) linhas.push(`Janelas livres ainda hoje: ${janelas}.`);
  }

  return linhas.length > 0 ? linhas.join("\n") : "Nada registrado para hoje.";
}
