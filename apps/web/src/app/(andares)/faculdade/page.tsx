import { faculdade } from "@orion/core";
import { createClient } from "@/lib/supabase/server";
import {
  criarCadeiraAction,
  criarHorarioAction,
  criarSemestreAction,
  registrarFaltaAction,
} from "./actions";

const inputClass =
  "rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600";
const buttonClass =
  "rounded-md border border-zinc-700 bg-zinc-800 px-4 py-2 text-sm text-zinc-100 transition-colors hover:bg-zinc-700";

export default async function FaculdadePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null; // o middleware não deixa chegar aqui deslogado

  const ctx = { supabase, userId: user.id };
  const semestres = await faculdade.listarSemestres(ctx);
  const ativo = semestres.find((s) => s.active) ?? null;
  const cadeiras = ativo ? await faculdade.listarCadeiras(ctx, ativo.id) : [];
  const idsCadeiras = cadeiras.map((c) => c.id);
  const [horarios, faltas] = await Promise.all([
    faculdade.listarHorarios(ctx, idsCadeiras),
    faculdade.listarFaltas(ctx, idsCadeiras),
  ]);

  return (
    <div className="max-w-2xl space-y-10 p-8">
      <header>
        <h1 className="text-2xl font-semibold text-zinc-50">Faculdade</h1>
        {ativo ? (
          <p className="mt-1 text-sm text-zinc-400">
            Semestre ativo: <span className="text-zinc-200">{ativo.name}</span> ·{" "}
            {formatarData(ativo.starts_on)} a {formatarData(ativo.ends_on)}
          </p>
        ) : null}
      </header>

      {!ativo ? (
        <section className="space-y-4">
          <h2 className="text-lg font-medium text-zinc-100">
            Cadastre seu semestre
          </h2>
          <p className="text-sm text-zinc-400">
            Tudo na Faculdade pende de um semestre — comece por ele.
          </p>
          <FormSemestre />
        </section>
      ) : (
        <>
          <section className="space-y-4">
            <h2 className="text-lg font-medium text-zinc-100">Cadeiras</h2>
            {cadeiras.length === 0 ? (
              <p className="text-sm text-zinc-500">
                Nenhuma cadeira ainda — cadastra a primeira aí embaixo.
              </p>
            ) : (
              <ul className="space-y-3">
                {cadeiras.map((cadeira) => (
                  <Cadeira
                    key={cadeira.id}
                    cadeira={cadeira}
                    horarios={horarios.filter((h) => h.course_id === cadeira.id)}
                    faltas={faltas.filter((f) => f.course_id === cadeira.id)}
                  />
                ))}
              </ul>
            )}

            <form action={criarCadeiraAction} className="space-y-3 pt-2">
              <input type="hidden" name="semester_id" value={ativo.id} />
              <div className="flex flex-wrap gap-3">
                <input
                  name="name"
                  required
                  placeholder="Nome da cadeira"
                  className={`${inputClass} min-w-48 flex-1`}
                />
                <input
                  name="code"
                  placeholder="Código (T164-70)"
                  className={`${inputClass} w-36`}
                />
              </div>
              <div className="flex flex-wrap gap-3">
                <input
                  name="professor"
                  placeholder="Professor(a)"
                  className={`${inputClass} min-w-48 flex-1`}
                />
                <input
                  name="total_hours"
                  type="number"
                  min="1"
                  placeholder="Carga horária (64)"
                  className={`${inputClass} w-40`}
                />
              </div>
              <button type="submit" className={buttonClass}>
                Adicionar cadeira
              </button>
            </form>
          </section>

          <details className="rounded-md border border-zinc-800 p-4">
            <summary className="cursor-pointer text-sm text-zinc-400">
              Novo semestre (desativa o atual)
            </summary>
            <div className="mt-4">
              <FormSemestre />
            </div>
          </details>
        </>
      )}
    </div>
  );
}

function Cadeira({
  cadeira,
  horarios,
  faltas,
}: {
  cadeira: faculdade.Course;
  horarios: faculdade.ClassSlot[];
  faltas: faculdade.Absence[];
}) {
  // O peso de cada falta sai do horário da cadeira naquele dia, então o
  // número acompanha a grade atual — é a mesma contagem do portal da
  // UNIFOR, que registra uma falta por hora-aula.
  const horasFaltadas = faltas.reduce(
    (total, f) => total + faculdade.horasAulaEmData(f.date, horarios),
    0,
  );
  const limite = cadeira.total_hours
    ? faculdade.limiteFaltasEmHoras(cadeira.total_hours)
    : null;
  const restantes =
    limite === null ? null : faculdade.faltasRestantes(limite, horasFaltadas);
  return (
    <li className="rounded-md border border-zinc-800 px-4 py-3">
      <div className="flex items-baseline gap-3">
        <span className="text-sm text-zinc-100">{cadeira.name}</span>
        {cadeira.code ? (
          <span className="text-xs text-zinc-500">{cadeira.code}</span>
        ) : null}
        {cadeira.professor ? (
          <span className="ml-auto text-xs text-zinc-500">
            {cadeira.professor}
          </span>
        ) : null}
      </div>

      {limite !== null ? (
        <p className="mt-1 text-xs text-zinc-500">
          {cadeira.total_hours}h · limite de {limite} faltas (25%) ·{" "}
          <span className={corDoSaldo(restantes!, limite)}>
            {horasFaltadas} usadas, {restantes} restantes
          </span>
        </p>
      ) : null}

      {horarios.length > 0 ? (
        <ul className="mt-2 space-y-0.5">
          {horarios.map((h) => (
            <li key={h.id} className="text-xs text-zinc-400">
              {faculdade.DIAS_SEMANA_CURTO[h.weekday]}{" "}
              {faculdade.formatarHora(h.starts_at)}–
              {faculdade.formatarHora(h.ends_at)}
              {h.location ? ` · ${h.location}` : ""}
            </li>
          ))}
        </ul>
      ) : null}

      <details className="mt-2">
        <summary className="cursor-pointer text-xs text-zinc-500 hover:text-zinc-300">
          Faltas{faltas.length > 0 ? ` (${faltas.length})` : ""}
        </summary>
        <div className="mt-3 space-y-2">
          {faltas.length > 0 ? (
            <ul className="space-y-0.5">
              {faltas.map((f) => (
                <li key={f.id} className="text-xs text-zinc-400">
                  {formatarData(f.date)} ·{" "}
                  {faculdade.horasAulaEmData(f.date, horarios)} faltas
                  {f.justified ? " · justificada" : ""}
                </li>
              ))}
            </ul>
          ) : null}
          <form action={registrarFaltaAction} className="flex flex-wrap gap-2">
            <input type="hidden" name="course_id" value={cadeira.id} />
            <input name="date" type="date" required className={inputClass} />
            <label className="flex items-center gap-2 text-xs text-zinc-400">
              <input name="justified" type="checkbox" />
              Justificada
            </label>
            <button type="submit" className={buttonClass}>
              Registrar falta
            </button>
          </form>
        </div>
      </details>

      <details className="mt-2">
        <summary className="cursor-pointer text-xs text-zinc-500 hover:text-zinc-300">
          {horarios.length > 0 ? "Adicionar outro horário" : "Adicionar horário"}
        </summary>
        <form action={criarHorarioAction} className="mt-3 flex flex-wrap gap-2">
          <input type="hidden" name="course_id" value={cadeira.id} />
          <select name="weekday" required className={inputClass}>
            {faculdade.DIAS_SEMANA.map((dia, i) => (
              <option key={dia} value={i}>
                {dia}
              </option>
            ))}
          </select>
          <input name="starts_at" type="time" required className={inputClass} />
          <input name="ends_at" type="time" required className={inputClass} />
          <input
            name="location"
            placeholder="Sala"
            className={`${inputClass} w-24`}
          />
          <button type="submit" className={buttonClass}>
            Salvar
          </button>
        </form>
      </details>
    </li>
  );
}

function corDoSaldo(restantes: number, limite: number): string {
  if (restantes < 0) return "text-red-400";
  if (restantes <= limite / 4) return "text-amber-400";
  return "text-zinc-400";
}

function FormSemestre() {
  return (
    <form action={criarSemestreAction} className="space-y-3">
      <input
        name="name"
        required
        placeholder="Nome (ex.: 2026.2)"
        className={`${inputClass} w-full max-w-56`}
      />
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-sm text-zinc-400">
          Início
          <input name="starts_on" type="date" required className={inputClass} />
        </label>
        <label className="flex items-center gap-2 text-sm text-zinc-400">
          Fim
          <input name="ends_on" type="date" required className={inputClass} />
        </label>
      </div>
      <button type="submit" className={buttonClass}>
        Criar semestre
      </button>
    </form>
  );
}

function formatarData(iso: string): string {
  const [ano, mes, dia] = iso.split("-");
  return `${dia}/${mes}/${ano}`;
}
