import { agoraNoFuso, projetos, rotina } from "@orion/core";
import { sessao } from "@/lib/sessao";
import {
  arquivarProjetoAction,
  arquivarTarefaAction,
  concluirTarefaAction,
  criarProjetoAction,
  criarTarefaAction,
  editarProjetoAction,
} from "./actions";

export const dynamic = "force-dynamic";

const inputClass =
  "rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600";
const buttonClass =
  "rounded-md border border-zinc-700 bg-zinc-800 px-4 py-2 text-sm text-zinc-100 transition-colors hover:bg-zinc-700";

const ROTULO_DO_TIPO: Record<projetos.TipoDeProjeto, string> = {
  freela: "Freela",
  pessoal: "Pessoal",
  portfolio: "Portfólio",
  candidatura: "Candidatura",
};

export default async function ProjetosPage() {
  const ctx = await sessao();
  if (!ctx) return null; // o middleware não deixa chegar aqui deslogado

  const agora = agoraNoFuso();
  const [lista, tarefas] = await Promise.all([
    projetos.listarProjetos(ctx),
    projetos.listarTarefas(ctx),
  ]);

  const ativos = lista.filter((p) => p.status === "ativo");
  const resto = lista.filter((p) => p.status !== "ativo");

  return (
    <div className="max-w-2xl space-y-10 p-8">
      <header>
        <h1 className="text-2xl font-semibold text-zinc-50">Projetos</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Freelas, projetos pessoais, portfólio e candidaturas de estágio.
        </p>
      </header>

      <section className="space-y-3">
        {lista.length === 0 ? (
          <p className="text-sm text-zinc-500">
            Nenhum projeto ainda — cadastre o primeiro aí embaixo.
          </p>
        ) : null}

        <ul className="space-y-3">
          {ativos.map((projeto) => (
            <Projeto
              key={projeto.id}
              projeto={projeto}
              tarefas={tarefas.filter((t) => t.project_id === projeto.id)}
              hoje={agora.dataIso}
            />
          ))}
        </ul>

        {resto.length > 0 ? (
          <details className="pt-2">
            <summary className="cursor-pointer text-sm text-zinc-500 hover:text-zinc-300">
              Pausados e concluídos ({resto.length})
            </summary>
            <ul className="mt-3 space-y-3">
              {resto.map((projeto) => (
                <Projeto
                  key={projeto.id}
                  projeto={projeto}
                  tarefas={tarefas.filter((t) => t.project_id === projeto.id)}
                  hoje={agora.dataIso}
                />
              ))}
            </ul>
          </details>
        ) : null}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-medium text-zinc-100">Novo projeto</h2>
        <form action={criarProjetoAction} className="space-y-3">
          <CamposDoProjeto />
          <button type="submit" className={buttonClass}>
            Criar projeto
          </button>
        </form>
      </section>
    </div>
  );
}

function Projeto({
  projeto,
  tarefas,
  hoje,
}: {
  projeto: projetos.Project;
  tarefas: projetos.ProjectTask[];
  hoje: string;
}) {
  const abertas = tarefas.filter((t) => t.completed_at === null);
  const parado =
    projeto.status === "ativo" && projetos.estaParado(hoje, projeto.updated_at);

  return (
    <li className="rounded-md border border-zinc-800 px-4 py-3">
      <div className="flex items-baseline gap-3">
        <span className="text-sm text-zinc-100">{projeto.name}</span>
        <span className="text-xs text-zinc-500">
          {ROTULO_DO_TIPO[projeto.type]}
        </span>
        {projeto.client ? (
          <span className="text-xs text-zinc-600">{projeto.client}</span>
        ) : null}
        {projeto.status !== "ativo" ? (
          <span className="ml-auto text-xs text-zinc-600">
            {projeto.status}
          </span>
        ) : null}
      </div>

      {projeto.next_step ? (
        <p className="mt-1 text-xs text-zinc-400">
          Próximo passo: {projeto.next_step}
        </p>
      ) : null}

      <div className="mt-1 flex flex-wrap gap-3 text-xs">
        {projeto.due_on ? (
          <span className="text-zinc-500">
            Prazo {formatarData(projeto.due_on)}
          </span>
        ) : null}
        {parado ? (
          <span className="text-amber-400">
            Parado há {projetos.diasParado(hoje, projeto.updated_at)} dias
          </span>
        ) : null}
        {projeto.repo_url ? (
          <a
            href={projeto.repo_url}
            className="text-zinc-500 underline hover:text-zinc-300"
          >
            repo
          </a>
        ) : null}
        {projeto.deploy_url ? (
          <a
            href={projeto.deploy_url}
            className="text-zinc-500 underline hover:text-zinc-300"
          >
            deploy
          </a>
        ) : null}
      </div>

      {abertas.length > 0 ? (
        <ul className="mt-3 space-y-1">
          {abertas.map((tarefa) => (
            <Tarefa key={tarefa.id} tarefa={tarefa} hoje={hoje} />
          ))}
        </ul>
      ) : null}

      <details className="mt-2">
        <summary className="cursor-pointer text-xs text-zinc-500 hover:text-zinc-300">
          Nova tarefa
        </summary>
        <form action={criarTarefaAction} className="mt-3 flex flex-wrap gap-2">
          <input type="hidden" name="project_id" value={projeto.id} />
          <input
            name="title"
            required
            placeholder="O que fazer"
            className={`${inputClass} min-w-48 flex-1`}
          />
          <input
            name="estimated_minutes"
            type="number"
            min="5"
            step="5"
            placeholder="min"
            className={`${inputClass} w-20`}
            title="Duração estimada em minutos"
          />
          <select name="priority" className={inputClass}>
            {projetos.PRIORIDADES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
          <input name="due_on" type="date" className={inputClass} />
          <button type="submit" className={buttonClass}>
            Adicionar
          </button>
        </form>
      </details>

      <details className="mt-2">
        <summary className="cursor-pointer text-xs text-zinc-500 hover:text-zinc-300">
          Editar projeto
        </summary>
        <form action={editarProjetoAction} className="mt-3 space-y-3">
          <input type="hidden" name="id" value={projeto.id} />
          <CamposDoProjeto projeto={projeto} />
          <div className="flex flex-wrap items-center gap-3">
            <select name="status" defaultValue={projeto.status} className={inputClass}>
              {projetos.STATUS_DE_PROJETO.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <button type="submit" className={buttonClass}>
              Salvar
            </button>
          </div>
        </form>
        <form action={arquivarProjetoAction} className="mt-3">
          <input type="hidden" name="id" value={projeto.id} />
          <button
            type="submit"
            className="text-xs text-zinc-500 transition-colors hover:text-red-400"
          >
            Arquivar projeto e suas tarefas
          </button>
        </form>
      </details>
    </li>
  );
}

function Tarefa({
  tarefa,
  hoje,
}: {
  tarefa: projetos.ProjectTask;
  hoje: string;
}) {
  const atrasada = tarefa.due_on !== null && tarefa.due_on < hoje;

  return (
    <li className="flex items-center gap-2 text-xs">
      <form action={concluirTarefaAction} className="flex">
        <input type="hidden" name="id" value={tarefa.id} />
        <input type="hidden" name="concluida" value="1" />
        <button
          type="submit"
          title="Concluir"
          className="flex h-4 w-4 items-center justify-center rounded border border-zinc-600 text-transparent transition-colors hover:border-emerald-500 hover:text-emerald-400"
        >
          ✓
        </button>
      </form>

      <span className="text-zinc-300">{tarefa.title}</span>

      {tarefa.priority === "alta" ? (
        <span className="text-red-400">alta</span>
      ) : null}
      {tarefa.estimated_minutes ? (
        <span className="text-zinc-600">
          {rotina.descreverDuracao(tarefa.estimated_minutes)}
        </span>
      ) : null}
      {tarefa.due_on ? (
        <span className={atrasada ? "text-red-400" : "text-zinc-500"}>
          {formatarData(tarefa.due_on)}
        </span>
      ) : null}

      <form action={arquivarTarefaAction} className="ml-auto flex">
        <input type="hidden" name="id" value={tarefa.id} />
        <button
          type="submit"
          title="Remover tarefa"
          className="text-zinc-700 transition-colors hover:text-red-400"
        >
          ×
        </button>
      </form>
    </li>
  );
}

function CamposDoProjeto({ projeto }: { projeto?: projetos.Project }) {
  return (
    <>
      <div className="flex flex-wrap gap-3">
        <input
          name="name"
          required
          defaultValue={projeto?.name}
          placeholder="Nome do projeto"
          className={`${inputClass} min-w-48 flex-1`}
        />
        <select name="type" defaultValue={projeto?.type ?? "pessoal"} className={inputClass}>
          {projetos.TIPOS_DE_PROJETO.map((t) => (
            <option key={t} value={t}>
              {ROTULO_DO_TIPO[t]}
            </option>
          ))}
        </select>
      </div>
      <input
        name="next_step"
        defaultValue={projeto?.next_step ?? ""}
        placeholder="Próximo passo"
        className={`${inputClass} w-full`}
      />
      <div className="flex flex-wrap gap-3">
        <input
          name="client"
          defaultValue={projeto?.client ?? ""}
          placeholder="Cliente (freela)"
          className={`${inputClass} min-w-40 flex-1`}
        />
        <input
          name="due_on"
          type="date"
          defaultValue={projeto?.due_on ?? ""}
          className={inputClass}
        />
      </div>
      <div className="flex flex-wrap gap-3">
        <input
          name="repo_url"
          type="url"
          defaultValue={projeto?.repo_url ?? ""}
          placeholder="URL do repositório"
          className={`${inputClass} min-w-40 flex-1`}
        />
        <input
          name="deploy_url"
          type="url"
          defaultValue={projeto?.deploy_url ?? ""}
          placeholder="URL do deploy"
          className={`${inputClass} min-w-40 flex-1`}
        />
      </div>
    </>
  );
}

function formatarData(iso: string): string {
  const [, mes, dia] = iso.split("-");
  return `${dia}/${mes}`;
}
