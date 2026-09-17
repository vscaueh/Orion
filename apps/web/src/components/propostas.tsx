import type { Proposta } from "@orion/orion";
import {
  aprovarPropostaAction,
  rejeitarPropostaAction,
} from "@/app/(andares)/orion/actions";

/**
 * Propostas pendentes da Orion. Aparecem no Hoje e na aba dela — são o
 * ponto onde "a Orion propõe, o usuário aprova" vira um botão.
 */
export function Propostas({ propostas }: { propostas: Proposta[] }) {
  if (propostas.length === 0) return null;

  return (
    <section>
      <h2 className="text-xs tracking-wide text-amber-500/80 uppercase">
        A Orion propôs
      </h2>
      <ul className="mt-2 space-y-2">
        {propostas.map((proposta) => (
          <li
            key={proposta.id}
            className="rounded-md border border-amber-500/30 px-4 py-3"
          >
            <p className="text-sm text-zinc-200">
              {descrever(proposta.action)}
            </p>
            <p className="mt-1 font-mono text-xs break-words text-zinc-500">
              {JSON.stringify(proposta.payload)}
            </p>
            {proposta.result ? (
              <p className="mt-1 text-xs text-red-400">
                Falhou: {proposta.result}
              </p>
            ) : null}

            <div className="mt-2 flex gap-2">
              <form action={aprovarPropostaAction}>
                <input type="hidden" name="id" value={proposta.id} />
                <button
                  type="submit"
                  className="rounded-md border border-emerald-500/40 px-3 py-1 text-xs text-emerald-400 transition-colors hover:bg-emerald-500/10"
                >
                  Aprovar
                </button>
              </form>
              <form action={rejeitarPropostaAction}>
                <input type="hidden" name="id" value={proposta.id} />
                <button
                  type="submit"
                  className="rounded-md border border-zinc-700 px-3 py-1 text-xs text-zinc-400 transition-colors hover:text-zinc-100"
                >
                  Rejeitar
                </button>
              </form>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** "faculdade.criar_cadeira" -> "Faculdade · criar cadeira". */
function descrever(action: string): string {
  const [andar = "", acao = ""] = action.split(".");
  const nome = andar.charAt(0).toUpperCase() + andar.slice(1);
  return `${nome} · ${acao.replace(/_/g, " ")}`;
}
