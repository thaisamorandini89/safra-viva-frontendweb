import { useEffect, useState } from "react";
import Field from "../../ui/Field";
import Input from "../../ui/Input";
import Select from "../../ui/Select";
import Button from "../../ui/Button";
import { Secao } from "../ui";
import {
  useConfig,
  ParametrosAgricolas as Parametros,
  UNIDADES_DISPONIVEIS,
  UNIDADES_PRODUTIVIDADE,
} from "../store";

export default function ParametrosAgricolas() {
  const { estado, atualizar, notificar, registrarLog } = useConfig();
  const [form, setForm] = useState<Parametros>(estado.parametros);

  useEffect(() => setForm(estado.parametros), [estado.parametros]);

  const campo = (chave: keyof Parametros, valor: string) =>
    setForm((f) => ({ ...f, [chave]: valor }));

  const alternarUnidade = (unidade: string) =>
    setForm((f) => ({
      ...f,
      unidadesAtivas: f.unidadesAtivas.includes(unidade)
        ? f.unidadesAtivas.filter((u) => u !== unidade)
        : [...f.unidadesAtivas, unidade],
    }));

  const salvar = () => {
    atualizar("parametros", form);
    registrarLog("Atualização dos parâmetros agrícolas", "Configurações › Parâmetros Agrícolas");
    notificar({ tipo: "sucesso", titulo: "Parâmetros salvos" });
  };

  return (
    <div className="space-y-5">
      <Secao titulo="Configurações de Safra" descricao="Valores padrão sugeridos ao cadastrar novas safras." icone="📅">
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Nome padrão da safra">
            <Input value={form.safraNomePadrao} onChange={(e) => campo("safraNomePadrao", e.target.value)} placeholder="2025/26" />
          </Field>
          <Field label="Data de início padrão">
            <Input type="date" value={form.safraInicioPadrao} onChange={(e) => campo("safraInicioPadrao", e.target.value)} />
          </Field>
          <Field label="Data de encerramento padrão">
            <Input type="date" value={form.safraFimPadrao} onChange={(e) => campo("safraFimPadrao", e.target.value)} />
          </Field>
        </div>
      </Secao>

      <Secao titulo="Configuração de Unidades" descricao="Unidades de medida disponíveis na operação." icone="📏">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Unidade de área padrão">
            <Select value={form.unidadeArea} onChange={(e) => campo("unidadeArea", e.target.value)} options={UNIDADES_DISPONIVEIS} />
          </Field>
          <Field label="Unidade de produtividade padrão">
            <Select value={form.unidadeProdutividade} onChange={(e) => campo("unidadeProdutividade", e.target.value)} options={UNIDADES_PRODUTIVIDADE} />
          </Field>
        </div>
        <p className="mt-4 mb-2 text-xs font-semibold text-gray-600">Unidades habilitadas</p>
        <div className="flex flex-wrap gap-2">
          {UNIDADES_DISPONIVEIS.map((u) => {
            const ativo = form.unidadesAtivas.includes(u);
            return (
              <button
                key={u}
                onClick={() => alternarUnidade(u)}
                className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                  ativo ? "border-green-300 bg-green-600 text-white" : "border-gray-200 bg-white text-gray-500 hover:bg-gray-50"
                }`}
              >
                {ativo ? "✓ " : ""}{u}
              </button>
            );
          })}
        </div>
      </Secao>

      <Secao titulo="Configuração de Produtividade" descricao="Formas de medir a produtividade das culturas." icone="📈">
        <div className="flex flex-wrap gap-2">
          {UNIDADES_PRODUTIVIDADE.map((u) => (
            <span
              key={u}
              className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                form.unidadeProdutividade === u
                  ? "border-green-300 bg-green-50 text-green-700"
                  : "border-gray-200 text-gray-500"
              }`}
            >
              {u}
            </span>
          ))}
        </div>
      </Secao>

      <div className="flex justify-end">
        <Button onClick={salvar}>Salvar parâmetros</Button>
      </div>
    </div>
  );
}
