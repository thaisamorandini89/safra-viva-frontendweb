import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getSafras, getCentrosCusto, getTalhoes } from "../../services/api";
import {
  Lancamento,
  NovoLancamentoPayload,
  RateioItem,
  Safra,
  CentroCusto,
  TipoLancamento,
  StatusLancamento,
  FormaPagamento,
  CATEGORIAS_RECEITA,
  CATEGORIAS_DESPESA,
  FORMAS_PAGAMENTO,
} from "../../types/financeiro";
import Field from "../ui/Field";
import Input from "../ui/Input";
import Select from "../ui/Select";
import Button from "../ui/Button";
import SectionTitle from "../ui/SectionTitle";

interface TalhaoOpc {
  id: number;
  nome: string;
}

interface Props {
  inicial?: Lancamento | null;
  salvando?: boolean;
  onCancelar: () => void;
  onSalvar: (payload: NovoLancamentoPayload) => void;
}

interface RateioLinha {
  id_talhao: string;
  percentual: string;
}

export default function LancamentoForm({
  inicial,
  salvando,
  onCancelar,
  onSalvar,
}: Props) {
  const { data: safras = [] } = useQuery<Safra[]>({
    queryKey: ["financeiro-safras"],
    queryFn: () => getSafras(),
  });
  const { data: centros = [] } = useQuery<CentroCusto[]>({
    queryKey: ["financeiro-centros-custo"],
    queryFn: () => getCentrosCusto(),
  });
  const { data: talhoesRaw = [] } = useQuery({
    queryKey: ["talhoes"],
    queryFn: () => getTalhoes(),
  });

  const talhoes: TalhaoOpc[] = useMemo(
    () =>
      talhoesRaw.map((t) => ({
        id: Number(t.id),
        nome: `${t.codigo ? `${t.codigo} · ` : ""}${t.nome}`,
      })),
    [talhoesRaw]
  );

  const propriedades = useMemo(() => {
    const mapa = new Map<number, string>();
    safras.forEach((s) =>
      mapa.set(s.id_propriedade, s.nome_propriedade ?? `Propriedade ${s.id_propriedade}`)
    );
    return Array.from(mapa, ([id, nome]) => ({ id, nome }));
  }, [safras]);

  const [tipo, setTipo] = useState<TipoLancamento>(inicial?.tipo ?? "DESPESA");
  const [categoria, setCategoria] = useState(inicial?.categoria ?? "");
  const [data, setData] = useState(
    inicial?.data_lancamento ?? new Date().toISOString().slice(0, 10)
  );
  const [valor, setValor] = useState(inicial ? String(inicial.valor) : "");
  const [idPropriedade, setIdPropriedade] = useState(
    inicial?.id_propriedade ? String(inicial.id_propriedade) : ""
  );
  const [idSafra, setIdSafra] = useState(
    inicial?.id_safra ? String(inicial.id_safra) : ""
  );
  const [idTalhao, setIdTalhao] = useState(
    inicial?.id_talhao ? String(inicial.id_talhao) : ""
  );
  const [idCentro, setIdCentro] = useState(
    inicial?.id_centro_custo ? String(inicial.id_centro_custo) : ""
  );
  const [formaPagamento, setFormaPagamento] = useState<string>(
    inicial?.forma_pagamento ?? ""
  );
  const [status, setStatus] = useState<StatusLancamento>(inicial?.status ?? "PENDENTE");
  const [descricao, setDescricao] = useState(inicial?.descricao ?? "");
  const [observacao, setObservacao] = useState(inicial?.observacao ?? "");

  const [usaRateio, setUsaRateio] = useState<boolean>(
    !!(inicial?.rateio && inicial.rateio.length)
  );
  const [rateio, setRateio] = useState<RateioLinha[]>(
    inicial?.rateio?.map((r) => ({
      id_talhao: String(r.id_talhao),
      percentual: String(r.percentual),
    })) ?? [{ id_talhao: "", percentual: "" }]
  );

  const [erros, setErros] = useState<Record<string, string>>({});

  const categorias = tipo === "RECEITA" ? CATEGORIAS_RECEITA : CATEGORIAS_DESPESA;
  const somaRateio = rateio.reduce((s, r) => s + (Number(r.percentual) || 0), 0);

  const addRateio = () =>
    setRateio((r) => [...r, { id_talhao: "", percentual: "" }]);
  const removeRateio = (i: number) =>
    setRateio((r) => (r.length > 1 ? r.filter((_, idx) => idx !== i) : r));
  const setRateioLinha = (i: number, patch: Partial<RateioLinha>) =>
    setRateio((r) => r.map((linha, idx) => (idx === i ? { ...linha, ...patch } : linha)));

  function validar(): boolean {
    const e: Record<string, string> = {};
    if (!tipo) e.tipo = "Informe o tipo.";
    if (!categoria) e.categoria = "Selecione a categoria.";
    if (!data) e.data = "Informe a data.";
    const v = Number(valor);
    if (!valor || Number.isNaN(v) || v <= 0)
      e.valor = "O valor deve ser maior que zero.";

    if (usaRateio) {
      const linhasValidas = rateio.filter((r) => r.id_talhao && r.percentual);
      if (linhasValidas.length === 0) {
        e.rateio = "Adicione ao menos um talhão ao rateio.";
      } else if (Math.abs(somaRateio - 100) > 0.01) {
        e.rateio = `A soma dos percentuais deve ser 100% (atual: ${somaRateio.toFixed(0)}%).`;
      } else if (linhasValidas.some((r) => !r.id_talhao)) {
        e.rateio = "Selecione o talhão em todas as linhas do rateio.";
      }
    }
    setErros(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    if (!validar()) return;

    const rateioPayload: RateioItem[] | undefined =
      usaRateio && tipo === "DESPESA"
        ? rateio
            .filter((r) => r.id_talhao && r.percentual)
            .map((r) => ({
              id_talhao: Number(r.id_talhao),
              percentual: Number(r.percentual),
            }))
        : undefined;

    const payload: NovoLancamentoPayload = {
      tipo,
      categoria,
      data_lancamento: data,
      valor: Number(valor),
      descricao: descricao.trim() || null,
      forma_pagamento: (formaPagamento as FormaPagamento) || null,
      status,
      observacao: observacao.trim() || null,
      id_propriedade: idPropriedade ? Number(idPropriedade) : null,
      id_safra: idSafra ? Number(idSafra) : null,
      id_talhao: usaRateio ? null : idTalhao ? Number(idTalhao) : null,
      id_centro_custo: idCentro ? Number(idCentro) : null,
      rateio: rateioPayload,
    };
    onSalvar(payload);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 max-w-4xl"
    >
      <SectionTitle>Informações Básicas</SectionTitle>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Field label="Tipo" required error={erros.tipo}>
          <Select
            value={tipo}
            error={!!erros.tipo}
            onChange={(e) => {
              setTipo(e.target.value as TipoLancamento);
              setCategoria("");
              if (e.target.value === "RECEITA") setUsaRateio(false);
            }}
          >
            <option value="DESPESA">Despesa</option>
            <option value="RECEITA">Receita</option>
          </Select>
        </Field>
        <Field label="Categoria" required error={erros.categoria}>
          <Select
            value={categoria}
            placeholder="Selecione..."
            error={!!erros.categoria}
            onChange={(e) => setCategoria(e.target.value)}
          >
            {categorias.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Data" required error={erros.data}>
          <Input
            type="date"
            value={data}
            error={!!erros.data}
            onChange={(e) => setData(e.target.value)}
          />
        </Field>
        <Field label="Valor (R$)" required error={erros.valor}>
          <Input
            type="number"
            min="0"
            step="0.01"
            placeholder="0,00"
            value={valor}
            error={!!erros.valor}
            onChange={(e) => setValor(e.target.value)}
          />
        </Field>
      </div>

      <SectionTitle>Vinculações</SectionTitle>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Field label="Propriedade">
          <Select
            value={idPropriedade}
            placeholder="Nenhuma"
            onChange={(e) => setIdPropriedade(e.target.value)}
          >
            {propriedades.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nome}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Safra">
          <Select
            value={idSafra}
            placeholder="Nenhuma"
            onChange={(e) => setIdSafra(e.target.value)}
          >
            {safras.map((s) => (
              <option key={s.id_safra} value={s.id_safra}>
                {s.nome}
              </option>
            ))}
          </Select>
        </Field>
        {!usaRateio && (
          <Field label="Talhão">
            <Select
              value={idTalhao}
              placeholder="Nenhum"
              onChange={(e) => setIdTalhao(e.target.value)}
            >
              {talhoes.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nome}
                </option>
              ))}
            </Select>
          </Field>
        )}
        {tipo === "DESPESA" && (
          <Field label="Centro de Custo">
            <Select
              value={idCentro}
              placeholder="Nenhum"
              onChange={(e) => setIdCentro(e.target.value)}
            >
              {centros.map((c) => (
                <option key={c.id_centro_custo} value={c.id_centro_custo}>
                  {c.nome} ({c.tipo === "OPERACIONAL" ? "Operacional" : "Administrativo"})
                </option>
              ))}
            </Select>
          </Field>
        )}
      </div>

      {/* Rateio entre talhões (apenas despesa) */}
      {tipo === "DESPESA" && (
        <>
          <div className="flex items-center justify-between mt-8 mb-2">
            <h3 className="text-green-700 font-bold text-sm">Rateio entre Talhões</h3>
            <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
              <input
                type="checkbox"
                checked={usaRateio}
                onChange={(e) => setUsaRateio(e.target.checked)}
                className="accent-green-600"
              />
              Distribuir esta despesa entre vários talhões
            </label>
          </div>

          {usaRateio && (
            <div className="border border-gray-100 rounded-lg p-4 bg-gray-50/50">
              {erros.rateio && (
                <p className="mb-2 text-xs text-red-600 flex items-center gap-1">
                  <span aria-hidden>⚠️</span>
                  {erros.rateio}
                </p>
              )}
              <div className="space-y-2">
                {rateio.map((linha, i) => (
                  <div key={i} className="flex items-end gap-2">
                    <Field label={i === 0 ? "Talhão" : ""} className="flex-1">
                      <Select
                        value={linha.id_talhao}
                        placeholder="Selecione..."
                        onChange={(e) => setRateioLinha(i, { id_talhao: e.target.value })}
                      >
                        {talhoes.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.nome}
                          </option>
                        ))}
                      </Select>
                    </Field>
                    <Field label={i === 0 ? "Percentual (%)" : ""} className="w-32">
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        placeholder="0"
                        value={linha.percentual}
                        onChange={(e) =>
                          setRateioLinha(i, { percentual: e.target.value })
                        }
                      />
                    </Field>
                    <button
                      type="button"
                      onClick={() => removeRateio(i)}
                      className="mb-1 px-2 py-2 text-gray-400 hover:text-red-600 transition"
                      title="Remover"
                    >
                      🗑️
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between mt-3">
                <button
                  type="button"
                  onClick={addRateio}
                  className="text-sm font-semibold text-green-700 hover:text-green-800"
                >
                  + Adicionar talhão
                </button>
                <span
                  className={`text-sm font-semibold ${
                    Math.abs(somaRateio - 100) < 0.01 ? "text-green-700" : "text-red-600"
                  }`}
                >
                  Soma: {somaRateio.toFixed(0)}%
                </span>
              </div>
            </div>
          )}
        </>
      )}

      <SectionTitle>Informações Complementares</SectionTitle>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Field label="Forma de Pagamento">
          <Select
            value={formaPagamento}
            placeholder="Nenhuma"
            onChange={(e) => setFormaPagamento(e.target.value)}
          >
            {FORMAS_PAGAMENTO.map((f) => (
              <option key={f.valor} value={f.valor}>
                {f.label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Status">
          <Select
            value={status}
            onChange={(e) => setStatus(e.target.value as StatusLancamento)}
          >
            <option value="PENDENTE">Pendente</option>
            <option value="PAGO">Pago</option>
          </Select>
        </Field>
        <Field label="Descrição" className="lg:col-span-2">
          <Input
            value={descricao ?? ""}
            placeholder="Descrição breve do lançamento"
            onChange={(e) => setDescricao(e.target.value)}
          />
        </Field>
        <Field label="Observação" className="lg:col-span-4">
          <textarea
            value={observacao ?? ""}
            onChange={(e) => setObservacao(e.target.value)}
            rows={3}
            placeholder="Observações adicionais..."
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent transition"
          />
        </Field>
      </div>

      <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-gray-100">
        <Button variant="secondary" onClick={onCancelar} type="button">
          Cancelar
        </Button>
        <Button type="submit" disabled={salvando}>
          {salvando ? "Salvando..." : inicial ? "Salvar Alterações" : "Cadastrar Lançamento"}
        </Button>
      </div>
    </form>
  );
}
