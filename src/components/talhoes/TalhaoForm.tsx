import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getTiposSolo } from "../../services/api";
import { TipoSolo } from "../../types/tipoSolo";
import {
  Talhao,
  NovoTalhaoPayload,
  STATUS_TALHAO,
  StatusTalhao,
  TOPOGRAFIAS,
  fmtHa,
} from "../../types/talhao";

import FormSection from "../ui/FormSection";
import Field from "../ui/Field";
import Input from "../ui/Input";
import Select from "../ui/Select";
import SectionTitle from "../ui/SectionTitle";
import Button from "../ui/Button";
import MapaPropriedade from "../ui/MapaPropriedade";

interface Props {
  /** Talhões já existentes — usados para validar o nome único (RN001) */
  talhoes: Talhao[];
  /** Quando presente, o formulário entra em modo edição e pré-preenche os campos */
  talhaoEditar?: Talhao | null;
  onCancelar: () => void;
  onSalvar: (dados: NovoTalhaoPayload) => void;
  salvando?: boolean;
}

/** Tipos de solo padrão caso o backend não responda */
const SOLOS_PADRAO = ["Arenoso", "Argiloso", "Siltoso", "Misto"];

export default function TalhaoForm({
  talhoes,
  talhaoEditar,
  onCancelar,
  onSalvar,
  salvando = false,
}: Props) {
  const editando = !!talhaoEditar;

  const [nome, setNome] = useState(talhaoEditar?.nome ?? "");
  const [codigo, setCodigo] = useState(talhaoEditar?.codigo ?? "");
  const [idPropriedade, setIdPropriedade] = useState(
    talhaoEditar ? String(talhaoEditar.id_propriedade) : ""
  );
  const [areaTotal, setAreaTotal] = useState(
    talhaoEditar ? String(talhaoEditar.area_total) : ""
  );
  const [areaUtilizavel, setAreaUtilizavel] = useState(
    talhaoEditar ? String(talhaoEditar.area_utilizavel) : ""
  );
  const [tipoSolo, setTipoSolo] = useState(talhaoEditar?.tipo_solo ?? "");
  const [topografia, setTopografia] = useState(talhaoEditar?.topografia ?? "");
  const [status, setStatus] = useState<StatusTalhao>(
    talhaoEditar?.status ?? "Livre"
  );
  const [observacoes, setObservacoes] = useState(talhaoEditar?.observacoes ?? "");
  const [latitude, setLatitude] = useState(
    talhaoEditar?.latitude != null ? String(talhaoEditar.latitude) : ""
  );
  const [longitude, setLongitude] = useState(
    talhaoEditar?.longitude != null ? String(talhaoEditar.longitude) : ""
  );
  const [erros, setErros] = useState<Record<string, string>>({});

  // Propriedades derivadas dos talhões já carregados
  const propriedades = useMemo(() => {
    const mapa = new Map<number, string>();
    talhoes.forEach((t) =>
      mapa.set(t.id_propriedade, t.nome_propriedade ?? `Propriedade ${t.id_propriedade}`)
    );
    return Array.from(mapa.entries());
  }, [talhoes]);

  const { data: tiposSolo = [] } = useQuery({
    queryKey: ["tiposSolo"],
    queryFn: async () => (await getTiposSolo()).data,
  });

  const opcoesSolo = tiposSolo.length
    ? tiposSolo.map((s: TipoSolo) => s.descricao)
    : SOLOS_PADRAO;

  const numArea = Number(areaTotal.replace(",", ".")) || 0;
  const numUtil = Number(areaUtilizavel.replace(",", ".")) || 0;

  const posicaoMapa: [number, number] | null =
    latitude !== "" && longitude !== "" && !isNaN(Number(latitude)) && !isNaN(Number(longitude))
      ? [Number(latitude), Number(longitude)]
      : null;

  const handleSelecionarNoMapa = (lat: number, lng: number) => {
    setLatitude(lat.toFixed(8));
    setLongitude(lng.toFixed(8));
  };

  /** Sugere o próximo código sequencial (TLH-00X) */
  const sugerirCodigo = () => {
    const numeros = talhoes
      .map((t) => Number(t.codigo.replace(/\D/g, "")))
      .filter((n) => !isNaN(n));
    const proximo = (numeros.length ? Math.max(...numeros) : 0) + 1;
    setCodigo(`TLH-${String(proximo).padStart(3, "0")}`);
  };

  const validar = () => {
    const e: Record<string, string> = {};

    if (!nome.trim()) e.nome = "Informe o nome do talhão.";
    if (!codigo.trim()) e.codigo = "Informe o código do talhão.";
    if (!idPropriedade) e.propriedade = "Selecione a propriedade.";
    if (!tipoSolo) e.tipoSolo = "Selecione o tipo de solo predominante.";

    // RN002 – Área obrigatória e maior que zero
    if (numArea <= 0) e.areaTotal = "A área total deve ser maior que zero.";

    // Área utilizável não pode exceder a área total
    if (numUtil > numArea && numArea > 0)
      e.areaUtilizavel = "A área utilizável não pode ser maior que a área total.";

    // RN001 – Nome único dentro da mesma propriedade
    const duplicado = talhoes.some(
      (t) =>
        t.id !== talhaoEditar?.id &&
        String(t.id_propriedade) === idPropriedade &&
        t.nome.trim().toLowerCase() === nome.trim().toLowerCase()
    );
    if (duplicado)
      e.nome = "Já existe um talhão com este nome nesta propriedade (RN001).";

    const codigoDuplicado = talhoes.some(
      (t) =>
        t.id !== talhaoEditar?.id &&
        t.codigo.trim().toLowerCase() === codigo.trim().toLowerCase()
    );
    if (codigoDuplicado) e.codigo = "Este código já está em uso.";

    setErros(e);
    return Object.keys(e).length === 0;
  };

  const handleSalvar = () => {
    if (!validar()) return;

    onSalvar({
      nome: nome.trim(),
      codigo: codigo.trim(),
      id_propriedade: Number(idPropriedade),
      area_total: numArea,
      area_utilizavel: numUtil || numArea,
      tipo_solo: tipoSolo,
      topografia: topografia || undefined,
      latitude: latitude ? Number(latitude) : null,
      longitude: longitude ? Number(longitude) : null,
      status,
      observacoes: observacoes.trim() || undefined,
    });
  };

  const Erro = ({ campo }: { campo: string }) =>
    erros[campo] ? (
      <p className="text-xs text-red-600 mt-1">⚠️ {erros[campo]}</p>
    ) : null;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 lg:p-8">
      {/* ------------------------------------------------------- Dados básicos */}
      <FormSection title="Dados Básicos" cols={3}>
        <Field label="Nome do Talhão" required>
          <Input
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Ex.: Talhão Boa Vista"
          />
          <Erro campo="nome" />
        </Field>

        <Field label="Código do Talhão" required>
          <div className="flex gap-2">
            <Input
              value={codigo}
              onChange={(e) => setCodigo(e.target.value.toUpperCase())}
              placeholder="Ex.: TLH-001"
            />
            <button
              type="button"
              onClick={sugerirCodigo}
              title="Gerar código sequencial"
              className="px-3 rounded-md border border-gray-300 text-gray-500 hover:bg-gray-50 text-sm shrink-0"
            >
              ⚡
            </button>
          </div>
          <Erro campo="codigo" />
        </Field>

        <Field label="Propriedade" required>
          <Select
            value={idPropriedade}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
              setIdPropriedade(e.target.value)
            }
            placeholder="Selecione a propriedade"
          >
            {propriedades.map(([id, nomeProp]) => (
              <option key={id} value={id}>
                {nomeProp}
              </option>
            ))}
          </Select>
          <Erro campo="propriedade" />
        </Field>

        <Field label="Área Total (ha)" required>
          <Input
            type="number"
            step="0.01"
            min="0"
            value={areaTotal}
            onChange={(e) => setAreaTotal(e.target.value)}
            placeholder="0,00"
          />
          <Erro campo="areaTotal" />
        </Field>

        <Field label="Área Utilizável (ha)">
          <Input
            type="number"
            step="0.01"
            min="0"
            value={areaUtilizavel}
            onChange={(e) => setAreaUtilizavel(e.target.value)}
            placeholder="Se vazio, usa a área total"
          />
          <Erro campo="areaUtilizavel" />
        </Field>

        <Field label="Status Inicial">
          <Select
            value={status}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
              setStatus(e.target.value as StatusTalhao)
            }
          >
            {STATUS_TALHAO.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
        </Field>
      </FormSection>

      {/* Resumo visual das áreas */}
      {numArea > 0 && (
        <div className="mt-4 rounded-lg bg-green-50/60 border border-green-100 p-4">
          <div className="flex items-center justify-between text-xs text-gray-600 mb-2">
            <span className="font-semibold text-green-800">
              Aproveitamento da área
            </span>
            <span className="tabular-nums">
              {fmtHa(numUtil || numArea, 1)} ha de {fmtHa(numArea, 1)} ha
            </span>
          </div>
          <div className="h-2.5 rounded-full bg-white overflow-hidden border border-green-100">
            <div
              className="h-full bg-green-600 rounded-full transition-all duration-500"
              style={{
                width: `${Math.min(100, ((numUtil || numArea) / numArea) * 100)}%`,
              }}
            />
          </div>
        </div>
      )}

      {/* --------------------------------------------- Características técnicas */}
      <FormSection title="Características Técnicas" cols={3}>
        <Field label="Tipo de Solo" required>
          <Select
            value={tipoSolo}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
              setTipoSolo(e.target.value)
            }
            placeholder="Selecione o tipo de solo"
          >
            {opcoesSolo.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
          <Erro campo="tipoSolo" />
        </Field>

        <Field label="Topografia">
          <Select
            value={topografia}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
              setTopografia(e.target.value)
            }
            placeholder="Selecione a topografia"
          >
            {TOPOGRAFIAS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Observações" className="sm:col-span-2 lg:col-span-1">
          <textarea
            value={observacoes}
            onChange={(e) => setObservacoes(e.target.value)}
            rows={3}
            placeholder="Anotações agronômicas, correções de solo, restrições..."
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent transition resize-none"
          />
        </Field>
      </FormSection>

      {/* -------------------------------------------------------- Localização */}
      <SectionTitle>Localização</SectionTitle>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="space-y-4">
          <Field label="Latitude">
            <Input
              value={latitude}
              onChange={(e) => setLatitude(e.target.value)}
              placeholder="-12.64000000"
            />
          </Field>
          <Field label="Longitude">
            <Input
              value={longitude}
              onChange={(e) => setLongitude(e.target.value)}
              placeholder="-55.72000000"
            />
          </Field>
          <p className="text-xs text-gray-400 leading-relaxed">
            💡 Clique no mapa para capturar automaticamente as coordenadas do
            centro do talhão.
          </p>
          {posicaoMapa && (
            <button
              type="button"
              onClick={() => {
                setLatitude("");
                setLongitude("");
              }}
              className="text-xs text-red-600 hover:underline"
            >
              Limpar coordenadas
            </button>
          )}
        </div>

        <div className="lg:col-span-2 h-[320px] rounded-lg overflow-hidden border border-gray-200">
          <MapaPropriedade
            posicao={posicaoMapa}
            onSelecionar={handleSelecionarNoMapa}
            label={nome.trim() || "Novo talhão"}
          />
        </div>
      </div>

      {/* ------------------------------------------------------------- Ações */}
      <div className="flex justify-end gap-3 mt-8 pt-5 border-t border-gray-100">
        <Button variant="secondary" onClick={onCancelar} disabled={salvando}>
          Cancelar
        </Button>
        <Button onClick={handleSalvar} disabled={salvando}>
          {salvando
            ? "Salvando..."
            : editando
            ? "Salvar Alterações"
            : "Salvar Talhão"}
        </Button>
      </div>
    </div>
  );
}
