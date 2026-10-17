import { ReactNode, useState } from "react";

// ---------------------------------------------------------------------------
// Componentes compartilhados do módulo de Configurações
// ---------------------------------------------------------------------------

/** Cartão de seção com título, descrição e ações opcionais. */
export function Secao({
  titulo,
  descricao,
  icone,
  acoes,
  children,
}: {
  titulo: string;
  descricao?: string;
  icone?: string;
  acoes?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          {icone && (
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50 text-xl text-green-700 ring-4 ring-green-100">
              {icone}
            </span>
          )}
          <div>
            <h3 className="text-sm font-bold text-gray-800">{titulo}</h3>
            {descricao && <p className="mt-0.5 text-xs text-gray-400">{descricao}</p>}
          </div>
        </div>
        {acoes}
      </div>
      {children}
    </section>
  );
}

/** Interruptor liga/desliga acessível. */
export function Toggle({
  ativo,
  onChange,
  rotulo,
  descricao,
}: {
  ativo: boolean;
  onChange: (valor: boolean) => void;
  rotulo?: string;
  descricao?: string;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3">
      {(rotulo || descricao) && (
        <span className="min-w-0">
          {rotulo && <span className="block text-sm font-medium text-gray-700">{rotulo}</span>}
          {descricao && <span className="block text-xs text-gray-400">{descricao}</span>}
        </span>
      )}
      <button
        type="button"
        role="switch"
        aria-checked={ativo}
        onClick={() => onChange(!ativo)}
        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
          ativo ? "bg-green-600" : "bg-gray-300"
        }`}
      >
        <span
          className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
            ativo ? "translate-x-5" : "translate-x-0.5"
          }`}
        />
      </button>
    </label>
  );
}

/** Lista editável de textos exibidos como chips (adicionar/remover). */
export function ChipsInput({
  titulo,
  icone,
  itens,
  onChange,
  placeholder = "Adicionar item...",
}: {
  titulo: string;
  icone?: string;
  itens: string[];
  onChange: (itens: string[]) => void;
  placeholder?: string;
}) {
  const [texto, setTexto] = useState("");

  const adicionar = () => {
    const valor = texto.trim();
    if (!valor) return;
    if (itens.some((i) => i.toLowerCase() === valor.toLowerCase())) {
      setTexto("");
      return;
    }
    onChange([...itens, valor]);
    setTexto("");
  };

  const remover = (alvo: string) => onChange(itens.filter((i) => i !== alvo));

  return (
    <div className="rounded-lg border border-gray-100 p-3">
      <p className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-gray-500">
        {icone && <span>{icone}</span>}
        {titulo}
        <span className="ml-auto rounded-full bg-gray-100 px-1.5 text-[11px] font-semibold text-gray-500">
          {itens.length}
        </span>
      </p>
      <div className="mb-2 flex flex-wrap gap-1.5">
        {itens.length === 0 && <span className="text-xs text-gray-400">Nenhum item cadastrado.</span>}
        {itens.map((item) => (
          <span
            key={item}
            className="inline-flex items-center gap-1 rounded-full border border-green-200 bg-green-50 px-2.5 py-1 text-xs font-medium text-green-800"
          >
            {item}
            <button
              type="button"
              onClick={() => remover(item)}
              className="text-green-600 hover:text-red-600"
              aria-label={`Remover ${item}`}
            >
              ✕
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              adicionar();
            }
          }}
          placeholder={placeholder}
          className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-green-400"
        />
        <button
          type="button"
          onClick={adicionar}
          className="shrink-0 rounded-md bg-green-700 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-green-800"
        >
          Adicionar
        </button>
      </div>
    </div>
  );
}

const CORES_STATUS: Record<string, string> = {
  Ativo: "bg-green-50 text-green-700 border-green-200",
  Inativo: "bg-slate-100 text-slate-600 border-slate-200",
  Bloqueado: "bg-red-50 text-red-600 border-red-200",
  Concluído: "bg-green-50 text-green-700 border-green-200",
  "Em andamento": "bg-amber-50 text-amber-700 border-amber-200",
  Falha: "bg-red-50 text-red-600 border-red-200",
};

export function Badge({ texto }: { texto: string }) {
  const cor = CORES_STATUS[texto] ?? "bg-gray-100 text-gray-600 border-gray-200";
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold ${cor}`}>
      {texto}
    </span>
  );
}
