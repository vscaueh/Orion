import { faculdade, hoje } from "@orion/core";
import { createClient } from "@/lib/supabase/server";

// O Hoje é recalculado a cada visita: o "agora" muda o tempo todo.
export const dynamic = "force-dynamic";

export default async function HojePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const resumo = await hoje.resumoDoDia({ supabase, userId: user.id });
  const vazio = !resumo.proximaAula && resumo.provas.length === 0;

  return (
    <div className="max-w-2xl space-y-8 p-8">
      <header>
        <h1 className="text-2xl font-semibold text-zinc-50">Hoje</h1>
        <p className="mt-1 text-sm text-zinc-500">
          {saudacao(resumo.agora.minutos)}, {diaPorExtenso(resumo.agora)}.
        </p>
      </header>

      {vazio ? (
        <p className="text-sm text-zinc-500">
          Nada por aqui ainda. Cadastre suas cadeiras e horários na{" "}
          <a href="/faculdade" className="text-zinc-300 underline">
            Faculdade
          </a>{" "}
          para o dia começar a se montar sozinho.
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
    </div>
  );
}

function saudacao(minutos: number): string {
  if (minutos < 12 * 60) return "Bom dia";
  if (minutos < 18 * 60) return "Boa tarde";
  return "Boa noite";
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
