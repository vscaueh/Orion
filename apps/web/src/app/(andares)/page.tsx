import { faculdade, hoje, rotina } from "@orion/core";
import { pendentes } from "@orion/orion";
import { marcarHabitoAction } from "@/app/(andares)/rotina/actions";
import { Propostas } from "@/components/propostas";
import { saudacao } from "@/lib/saudacao";
import { sessao } from "@/lib/sessao";

// O Hoje é recalculado a cada visita: o "agora" muda o tempo todo.
export const dynamic = "force-dynamic";

export default async function HojePage() {
  const ctx = await sessao();
  if (!ctx) return null; // o middleware não deixa chegar aqui deslogado

  const [resumo, propostas] = await Promise.all([
    hoje.resumoDoDia(ctx),
    pendentes(ctx),
  ]);
  const vazio =
    !resumo.proximaAula &&
    resumo.provas.length === 0 &&
    resumo.habitos.length === 0 &&
    resumo.tarefas.length === 0;

  return (
    <div className="max-w-2xl space-y-8 p-8">
      <header>
        <h1 className="text-2xl font-semibold text-zinc-50">Hoje</h1>
        <p className="mt-1 text-sm text-zinc-500">
          {saudacao(resumo.agora.minutos, process.env.OWNER_NAME ?? null)} ·{" "}
          {diaPorExtenso(resumo.agora)}
        </p>
      </header>

      {propostas.length > 0 ? <Propostas propostas={propostas} /> : null}

      {vazio ? (
        <p className="text-sm text-zinc-500">
          Nada por aqui ainda. Cadastre suas cadeiras na{" "}
          <a href="/faculdade" className="text-zinc-300 underline">
            Faculdade
          </a>
          , seus hábitos na{" "}
          <a href="/rotina" className="text-zinc-300 underline">
            Rotina
          </a>{" "}
          e o dia começa a se montar sozinho.
        </p>
      ) : null}

      {resumo.proximaAula ? (
        <section>
          <h2 className="text-xs tracking-wide text-zinc-500 uppercase">
            Próxima aula
          </h2>
          <p className="mt-2 text-lg text-zinc-100">
            {resumo.proximaAula.cadeira.name}
          </p>
          <p className="mt-0.5 text-sm text-zinc-400">
            {quandoAula(resumo.proximaAula)}
            {resumo.proximaAula.aula.location
              ? ` · ${resumo.proximaAula.aula.location}`
              : ""}
          </p>
        </section>
      ) : null}

      {resumo.provas.length > 0 ? (
        <section>
          <h2 className="text-xs tracking-wide text-zinc-500 uppercase">
            Provas nos próximos 14 dias
          </h2>
          <ul className="mt-2 divide-y divide-zinc-800 rounded-md border border-zinc-800">
            {resumo.provas.map(({ avaliacao, cadeira }) => {
              const dias = hoje.diasAte(resumo.agora.dataIso, avaliacao.date!);
              return (
                <li
                  key={avaliacao.id}
                  className="flex items-baseline gap-3 px-4 py-3"
                >
                  <span className="text-sm text-zinc-100">{cadeira.name}</span>
                  <span className="text-xs text-zinc-500">{avaliacao.type}</span>
                  <span className={`ml-auto text-xs ${corDoPrazo(dias)}`}>
                    {prazoPorExtenso(dias)}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      {resumo.habitos.length > 0 ? (
        <section>
          <h2 className="text-xs tracking-wide text-zinc-500 uppercase">
            Hábitos de hoje
          </h2>
          <ul className="mt-2 space-y-1">
            {resumo.habitos.map(({ habito, feito, sequencia }) => (
              <li key={habito.id} className="flex items-center gap-2 text-sm">
                <form action={marcarHabitoAction} className="flex">
                  <input type="hidden" name="habit_id" value={habito.id} />
                  <input type="hidden" name="date" value={resumo.agora.dataIso} />
                  <input type="hidden" name="done" value={feito ? "0" : "1"} />
                  <button
                    type="submit"
                    title={feito ? "Desmarcar" : "Marcar como feito"}
                    className={`flex h-5 w-5 items-center justify-center rounded border text-xs transition-colors ${
                      feito
                        ? "border-emerald-500 bg-emerald-500/20 text-emerald-400"
                        : "border-zinc-600 text-transparent hover:border-zinc-400"
                    }`}
                  >
                    ✓
                  </button>
                </form>
                <span className={feito ? "text-zinc-500 line-through" : "text-zinc-200"}>
                  {habito.name}
                </span>
                {habito.suggested_time ? (
                  <span className="text-xs text-zinc-600">
                    {faculdade.formatarHora(habito.suggested_time)}
                  </span>
                ) : null}
                {sequencia > 0 ? (
                  <span className="ml-auto text-xs text-amber-400">
                    {sequencia} {sequencia === 1 ? "dia" : "dias"}
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {resumo.tarefas.length > 0 ? (
        <section>
          <h2 className="text-xs tracking-wide text-zinc-500 uppercase">
            Tarefas com prazo
          </h2>
          <ul className="mt-2 divide-y divide-zinc-800 rounded-md border border-zinc-800">
            {resumo.tarefas.map(({ tarefa, projeto }) => {
              const dias = hoje.diasAte(resumo.agora.dataIso, tarefa.due_on!);
              return (
                <li key={tarefa.id} className="flex items-baseline gap-3 px-4 py-3">
                  <span className="text-sm text-zinc-100">{tarefa.title}</span>
                  <span className="text-xs text-zinc-500">{projeto.name}</span>
                  {tarefa.estimated_minutes ? (
                    <span className="text-xs text-zinc-600">
                      {rotina.descreverDuracao(tarefa.estimated_minutes)}
                    </span>
                  ) : null}
                  <span className={`ml-auto text-xs ${corDoPrazo(dias)}`}>
                    {prazoPorExtenso(dias)}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      {resumo.janelas.length > 0 ? (
        <section>
          <h2 className="text-xs tracking-wide text-zinc-500 uppercase">
            Janelas livres · {rotina.descreverDuracao(resumo.minutosLivres)} hoje
          </h2>
          <ul className="mt-2 flex flex-wrap gap-2">
            {resumo.janelas.map((janela) => {
              const passou = janela.fim <= resumo.agora.minutos;
              return (
                <li
                  key={janela.inicio}
                  className={`rounded-md border px-3 py-1.5 text-xs ${
                    passou
                      ? "border-zinc-800 text-zinc-600"
                      : "border-emerald-500/30 text-emerald-400/80"
                  }`}
                >
                  {rotina.formatarMinutos(janela.inicio)}–
                  {rotina.formatarMinutos(janela.fim)} ·{" "}
                  {rotina.descreverDuracao(rotina.duracao(janela))}
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

function diaPorExtenso({ dataIso, diaSemana }: { dataIso: string; diaSemana: number }) {
  const [, mes, dia] = dataIso.split("-");
  return `${faculdade.DIAS_SEMANA[diaSemana]?.toLowerCase()}, ${dia}/${mes}`;
}

function quandoAula(proxima: { diasAFrente: number; minutosAte: number; aula: { weekday: number; starts_at: string } }): string {
  const hora = faculdade.formatarHora(proxima.aula.starts_at);

  if (proxima.diasAFrente === 0) {
    const h = Math.floor(proxima.minutosAte / 60);
    const m = proxima.minutosAte % 60;
    const falta = h > 0 ? `em ${h}h${m > 0 ? String(m).padStart(2, "0") : ""}` : `em ${m} min`;
    return `hoje às ${hora} · ${falta}`;
  }
  if (proxima.diasAFrente === 1) return `amanhã às ${hora}`;
  return `${faculdade.DIAS_SEMANA[proxima.aula.weekday]?.toLowerCase()} às ${hora}`;
}

function prazoPorExtenso(dias: number): string {
  if (dias === 0) return "hoje";
  if (dias === 1) return "amanhã";
  return `em ${dias} dias`;
}

function corDoPrazo(dias: number): string {
  if (dias <= 1) return "text-red-400";
  if (dias <= 3) return "text-amber-400";
  return "text-zinc-500";
}
