import { faculdade } from "@orion/core";
import { createClient } from "@/lib/supabase/server";
import { criarCadeiraAction, criarSemestreAction } from "./actions";

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

  return (
    <div className="max-w-2xl space-y-10 p-8">
      <header>
        <h1 className="text-2xl font-semibold text-zinc-50">Faculdade</h1>
        {ativo ? (
          <p className="mt-1 text-sm text-zinc-400">
            Semestre ativo: <span className="text-zinc-200">{ativo.name}</span>{" "}
            · {formatarData(ativo.starts_on)} a {formatarData(ativo.ends_on)}
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
              <ul className="divide-y divide-zinc-800 rounded-md border border-zinc-800">
                {cadeiras.map((c) => (
                  <li key={c.id} className="px-4 py-3">
                    <div className="flex items-baseline gap-3">
                      <span className="text-sm text-zinc-100">{c.name}</span>
                      {c.code ? (
                        <span className="text-xs text-zinc-500">{c.code}</span>
                      ) : null}
                      {c.professor ? (
                        <span className="ml-auto text-xs text-zinc-500">
                          {c.professor}
                        </span>
                      ) : null}
                    </div>
                    {c.total_hours ? (
                      <p className="mt-1 text-xs text-zinc-500">
                        {c.total_hours}h · pode faltar até{" "}
                        <span className="text-zinc-400">
                          {faculdade.limiteFaltasEmHoras(c.total_hours)}{" "}
                          horas-aula
                        </span>{" "}
                        (25%)
                      </p>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}

            <form action={criarCadeiraAction} className="space-y-3">
              <input type="hidden" name="semester_id" value={ativo.id} />
              <div className="flex flex-wrap gap-3">
                <input
                  name="name"
                  required
                  placeholder="Nome da cadeira"
                  className={`${inputClass} flex-1 min-w-48`}
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
                  className={`${inputClass} flex-1 min-w-48`}
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
