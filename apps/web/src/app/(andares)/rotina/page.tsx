import { agoraNoFuso, faculdade, rotina } from "@orion/core";
import { createClient } from "@/lib/supabase/server";
import {
  arquivarHabitoAction,
  criarHabitoAction,
  editarHabitoAction,
  marcarHabitoAction,
} from "./actions";

export const dynamic = "force-dynamic";

const inputClass =
  "rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600";
const buttonClass =
  "rounded-md border border-zinc-700 bg-zinc-800 px-4 py-2 text-sm text-zinc-100 transition-colors hover:bg-zinc-700";

export default async function RotinaPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const ctx = { supabase, userId: user.id };
  const agora = agoraNoFuso();
  const [habitos, registros] = await Promise.all([
    rotina.listarHabitos(ctx),
    rotina.listarRegistros(ctx, agora.dataIso),
  ]);

  const feitosPorHabito = new Map<string, Set<string>>();
  for (const r of registros) {
    const datas = feitosPorHabito.get(r.habit_id) ?? new Set<string>();
    datas.add(r.date);
    feitosPorHabito.set(r.habit_id, datas);
  }

  const doDia = habitos.filter((h) => rotina.valeHoje(agora.dataIso, h.weekdays));
  const outros = habitos.filter(
    (h) => !rotina.valeHoje(agora.dataIso, h.weekdays),
  );

  return (
    <div className="max-w-2xl space-y-10 p-8">
      <header>
        <h1 className="text-2xl font-semibold text-zinc-50">Rotina</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Hábitos e a semana-tipo que define suas janelas livres.
        </p>
      </header>

      <section className="space-y-4">
        <h2 className="text-lg font-medium text-zinc-100">Hábitos de hoje</h2>
        {doDia.length === 0 ? (
          <p className="text-sm text-zinc-500">
            {habitos.length === 0
              ? "Nenhum hábito ainda — cadastre o primeiro aí embaixo."
              : "Nenhum hábito vale hoje. Dia livre."}
          </p>
        ) : (
          <ul className="space-y-2">
            {doDia.map((habito) => (
              <Habito
                key={habito.id}
                habito={habito}
                hoje={agora.dataIso}
                feitos={feitosPorHabito.get(habito.id) ?? new Set()}
              />
            ))}
          </ul>
        )}
      </section>

      {outros.length > 0 ? (
        <section className="space-y-4">
          <h2 className="text-lg font-medium text-zinc-100">Outros dias</h2>
          <ul className="space-y-2">
            {outros.map((habito) => (
              <Habito
                key={habito.id}
                habito={habito}
                hoje={agora.dataIso}
                feitos={feitosPorHabito.get(habito.id) ?? new Set()}
              />
            ))}
          </ul>
        </section>
      ) : null}

      <section className="space-y-3">
        <h2 className="text-lg font-medium text-zinc-100">Novo hábito</h2>
        <form action={criarHabitoAction} className="space-y-3">
          <div className="flex flex-wrap gap-3">
            <input
              name="name"
              required
              placeholder="Nome do hábito"
              className={`${inputClass} min-w-48 flex-1`}
            />
            <input
              name="suggested_time"
              type="time"
              className={inputClass}
              title="Horário sugerido (opcional)"
            />
          </div>
          <SeletorDeDias />
          <button type="submit" className={buttonClass}>
            Criar hábito
          </button>
        </form>
      </section>
    </div>
  );
}

function Habito({
  habito,
  hoje,
  feitos,
}: {
  habito: rotina.Habit;
  hoje: string;
  feitos: Set<string>;
}) {
  const feitoHoje = feitos.has(hoje);
  const sequencia = rotina.streak(hoje, habito.weekdays, feitos);
  const valeHoje = rotina.valeHoje(hoje, habito.weekdays);

  return (
    <li className="rounded-md border border-zinc-800 px-4 py-3">
      <div className="flex items-center gap-3">
        {valeHoje ? (
          <form action={marcarHabitoAction} className="flex">
            <input type="hidden" name="habit_id" value={habito.id} />
            <input type="hidden" name="date" value={hoje} />
            <input type="hidden" name="done" value={feitoHoje ? "0" : "1"} />
            <button
              type="submit"
              title={feitoHoje ? "Desmarcar" : "Marcar como feito"}
              className={`flex h-5 w-5 items-center justify-center rounded border text-xs transition-colors ${
                feitoHoje
                  ? "border-emerald-500 bg-emerald-500/20 text-emerald-400"
                  : "border-zinc-600 text-transparent hover:border-zinc-400"
              }`}
            >
              ✓
            </button>
          </form>
        ) : null}

        <span
          className={`text-sm ${feitoHoje ? "text-zinc-500 line-through" : "text-zinc-100"}`}
        >
          {habito.name}
        </span>

        {habito.suggested_time ? (
          <span className="text-xs text-zinc-500">
            {faculdade.formatarHora(habito.suggested_time)}
          </span>
        ) : null}

        {sequencia > 0 ? (
          <span className="ml-auto text-xs text-amber-400">
            {sequencia} {sequencia === 1 ? "dia" : "dias"} seguidos
          </span>
        ) : null}
      </div>

      <p className="mt-1 text-xs text-zinc-600">{descreverDias(habito.weekdays)}</p>

      <details className="mt-2">
        <summary className="cursor-pointer text-xs text-zinc-500 hover:text-zinc-300">
          Editar
        </summary>
        <form action={editarHabitoAction} className="mt-3 space-y-3">
          <input type="hidden" name="id" value={habito.id} />
          <div className="flex flex-wrap gap-3">
            <input
              name="name"
              required
              defaultValue={habito.name}
              className={`${inputClass} min-w-48 flex-1`}
            />
            <input
              name="suggested_time"
              type="time"
              defaultValue={
                habito.suggested_time
                  ? faculdade.formatarHora(habito.suggested_time)
                  : ""
              }
              className={inputClass}
            />
          </div>
          <SeletorDeDias marcados={habito.weekdays} />
          <button type="submit" className={buttonClass}>
            Salvar
          </button>
        </form>

        <form action={arquivarHabitoAction} className="mt-3">
          <input type="hidden" name="id" value={habito.id} />
          <button
            type="submit"
            className="text-xs text-zinc-500 transition-colors hover:text-red-400"
          >
            Arquivar hábito
          </button>
        </form>
      </details>
    </li>
  );
}

function SeletorDeDias({
  marcados = rotina.TODOS_OS_DIAS,
}: {
  marcados?: readonly number[];
}) {
  return (
    <div className="flex flex-wrap gap-1">
      {faculdade.DIAS_SEMANA_CURTO.map((dia, i) => (
        <label
          key={dia}
          className="cursor-pointer rounded border border-zinc-700 px-2 py-1 text-xs text-zinc-400 has-checked:border-zinc-500 has-checked:bg-zinc-800 has-checked:text-zinc-100"
        >
          <input
            type="checkbox"
            name="weekdays"
            value={i}
            defaultChecked={marcados.includes(i)}
            className="sr-only"
          />
          {dia}
        </label>
      ))}
    </div>
  );
}

function descreverDias(dias: readonly number[]): string {
  if (dias.length === 7) return "Todo dia";
  const ordenados = [...dias].sort((a, b) => a - b);
  if (ordenados.join() === "1,2,3,4,5") return "Dias de semana";
  if (ordenados.join() === "0,6") return "Fim de semana";
  return ordenados.map((d) => faculdade.DIAS_SEMANA_CURTO[d]).join(" · ");
}
