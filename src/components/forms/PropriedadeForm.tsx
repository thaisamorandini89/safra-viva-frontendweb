import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query"; // 1. Importando o hook
import { 
  getEmpresasAgricolas, 
  getEstados, 
  getCidadesPorEstado, 
  getTiposSolo // <-- Importação da nova função da API
} from "../../services/api";
import { Estado, Cidade } from "../../types/geo"; 
import { TipoSolo } from "../../types/tipoSolo";

import FormWrapper from "./FormWrapper";
import FormSection from "../ui/FormSection";
import Field from "../ui/Field";
import Input from "../ui/Input";
import Select from "../ui/Select";
import SectionTitle from "../ui/SectionTitle";
import Button from "../ui/Button";

function MapPlaceholder() {
  return (
    <div className="w-full h-full bg-gray-100 rounded-lg relative flex items-center justify-center overflow-hidden border border-gray-200">
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            "linear-gradient(#ccc 1px, transparent 1px), linear-gradient(90deg, #ccc 1px, transparent 1px)",
          backgroundSize: "20px 20px",
        }}
      />
      <div className="bg-white border border-gray-300 rounded px-2 py-1 text-xs text-gray-500 shadow z-10 flex flex-col items-center gap-1">
        <span className="text-2xl">📍</span>
        <span>Mato Grosso, BR</span>
      </div>
      <div className="absolute top-2 right-2 flex flex-col gap-1">
        <button className="w-6 h-6 bg-white border border-gray-300 rounded text-sm shadow hover:bg-gray-50">
          +
        </button>
        <button className="w-6 h-6 bg-white border border-gray-300 rounded text-sm shadow hover:bg-gray-50">
          −
        </button>
      </div>
    </div>
  );
}

export default function PropriedadeForm() {
  const [estadoSelecionado, setEstadoSelecionado] = useState<string>("");
  const [cidadeSelecionada, setCidadeSelecionada] = useState<string>("");
  const [cep, setCep] = useState<string>("");
  const [logradouro, setLogradouro] = useState<string>("");
  const [cidadePendente, setCidadePendente] = useState<string>("");
  const [empresaSelecionada, setEmpresaSelecionada] = useState<string>("");

  // <-- Novo estado para o Tipo de Solo
  const [tipoSoloSelecionado, setTipoSoloSelecionado] = useState<string>("");

  // Queries para dados geográficos
  const { data: estados = [] } = useQuery({
    queryKey: ["estados"],
    queryFn: async () => (await getEstados()).data,
  });

  const { data: cidades = [], isLoading: carregandoCidades } = useQuery({
    queryKey: ["cidades", estadoSelecionado],
    queryFn: async () =>
      (await getCidadesPorEstado(Number(estadoSelecionado))).data,
    enabled: !!estadoSelecionado, // Só busca se houver um estado selecionado
  });

  // Limpa cidade ao mudar estado
  const handleEstadoChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setEstadoSelecionado(e.target.value);
    setCidadeSelecionada("");
  };

  // A única vez que a palavra "empresas" é declarada é aqui:
  const {
    data: empresas = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["empresasAgricolas"],
    queryFn: async () => {
      const response = await getEmpresasAgricolas();
      return response.data;
    },
  });

  // <-- Nova Query para buscar os Tipos de Solo
  const { data: tiposSolo = [], isLoading: carregandoTiposSolo } = useQuery({
    queryKey: ["tiposSolo"],
    queryFn: async () => {
      const response = await getTiposSolo();
      return response.data;
    },
  });

  const buscarCep = async () => {
    const cepLimpo = cep.replace(/\D/g, "");
    if (cepLimpo.length !== 8) {
      alert("Por favor, digite um CEP válido com 8 números.");
      return;
    }

    try {
      const response = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
      const data = await response.json();

      if (data.erro) {
        alert("CEP não encontrado.");
        return;
      }

      setLogradouro(data.logradouro || "");
      setCidadePendente(data.localidade); // <-- ADICIONE ESTA LINHA AQUI

      const estadoEncontrado = estados.find((e: Estado) => e.uf === data.uf);
      if (estadoEncontrado) {
        setEstadoSelecionado(String(estadoEncontrado.id));
      }
    } catch (error) {
      console.error("Erro ao buscar CEP:", error);
      alert("Erro ao conectar com o ViaCEP.");
    }
  };

  useEffect(() => {
    // Só tenta procurar se houver cidades na lista e uma cidade pendente aguardando
    if (cidades.length > 0 && cidadePendente) {
      const cidadeMatch = cidades.find(
        (c: Cidade) =>
          c.nome.toLowerCase().trim() === cidadePendente.toLowerCase().trim()
      );

      if (cidadeMatch) {
        setCidadeSelecionada(String(cidadeMatch.id));
      }
      
      // Limpa a pendência para não rodar novamente à toa
      setCidadePendente("");
    }
  }, [cidades, cidadePendente]);

  return (
    <FormWrapper
      breadcrumb="Propriedades"
      page="Nova Propriedade"
      title="Cadastro de Propriedade"
      description="Preencha as informações da propriedade rural."
      saveLabel="Salvar Propriedade"
      onSave={() =>
        console.log("Salvar clicado - id empresa:", empresaSelecionada)
      }
    >
      <FormSection title="Vinculação" cols={2}>
        <Field label="Empresa Agrícola" required>
          <Select
            value={empresaSelecionada}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
              setEmpresaSelecionada(e.target.value)
            }
            disabled={isLoading} // Trava o campo enquanto a API está buscando os dados
          >
            {/* O texto inicial muda dinamicamente */}
            <option value="">
              {isLoading ? "Carregando empresas..." : "Selecione a empresa"}
            </option>

            {/* Se a API do Python/Flask cair ou der erro, avisamos aqui */}
            {isError && (
              <option value="" disabled>
                Erro ao carregar empresas
              </option>
            )}

            {/* O map continua igual, renderizando os dados quando estiverem prontos */}
            {empresas.map((empresa) => (
              <option key={empresa.id_empresa} value={empresa.id_empresa}>
                {empresa.nome_fantasia || empresa.razao_social} - {empresa.cnpj}
              </option>
            ))}
          </Select>
        </Field>
      </FormSection>

      <FormSection title="Identificação Legal" cols={3}>
        <Field label="CAR" required>
          <div className="relative">
            <Input placeholder="Ex.: MT-5104851-1234.5678.9012.3456" />
            <span className="absolute right-2 top-2 text-gray-400 text-xs cursor-help">
              ⓘ
            </span>
          </div>
        </Field>
        <Field label="CCIR">
          <div className="relative">
            <Input placeholder="Ex.: 123.456.789.012-3" />
            <span className="absolute right-2 top-2 text-gray-400 text-xs cursor-help">
              ⓘ
            </span>
          </div>
        </Field>
        <Field label="NIRF">
          <div className="relative">
            <Input placeholder="Ex.: 5.123.456-7" />
            <span className="absolute right-2 top-2 text-gray-400 text-xs cursor-help">
              ⓘ
            </span>
          </div>
        </Field>
      </FormSection>

      <FormSection title="Localização" cols={3}>
        <Field label="Estado" required>
          <Select value={estadoSelecionado} onChange={handleEstadoChange}>
            <option value="">Selecione um estado</option>
            {estados.map((estado: Estado) => (
              <option key={estado.id} value={estado.id}>
                {estado.nome} ({estado.uf})
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Cidade" required>
          <Select
            value={cidadeSelecionada}
            onChange={(e) => setCidadeSelecionada(e.target.value)}
            disabled={!estadoSelecionado || carregandoCidades}
          >
            <option value="">
              {carregandoCidades ? "Carregando..." : "Selecione uma cidade"}
            </option>
            {cidades.map((cidade: Cidade) => (
              <option key={cidade.id} value={cidade.id}>
                {cidade.nome}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="CEP">
          <div className="flex gap-2">
            <Input
              placeholder="00000-000"
              value={cep}
              onChange={(e) => setCep(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && buscarCep()}
            />
            <button
              type="button"
              onClick={buscarCep}
              className="shrink-0 border border-green-600 text-green-700 text-xs px-3 py-2 rounded-md hover:bg-green-50 font-semibold transition"
            >
              Buscar
            </button>
          </div>
        </Field>
        <Field label="Logradouro / Acesso">
          <Input 
            placeholder="Ex.: Rodovia BR-163, KM 845" 
            value={logradouro} // Adicione esta linha
            onChange={(e) => setLogradouro(e.target.value)} // E esta linha
          />
        </Field>
        <Field label="Ponto de Referência" className="col-span-2">
          <Input placeholder="Ex.: Após a ponte, entrar à direita" />
        </Field>
      </FormSection>

      {/* Coordenadas + Mapa lado a lado — layout especial, fora do FormSection */}
      <div className="grid grid-cols-2 gap-4 mt-3">
        <div>
          <SectionTitle>Coordenadas Geográficas</SectionTitle>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <Field label="Latitude" required>
              <Input placeholder="Ex.: -12.34567890" />
            </Field>
            <Field label="Longitude" required>
              <Input placeholder="Ex.: -55.67890123" />
            </Field>
          </div>
          <Button variant="primary">📍 Abrir Mapa</Button>
        </div>
        <div className="h-44 mt-5">
          <MapPlaceholder />
          <p className="text-xs text-gray-400 mt-1 text-center">
            *Clique no mapa para definir a localização da sede da propriedade.
          </p>
        </div>
      </div>

      <FormSection title="Dados Físicos" cols={3}>
        <Field label="Área Total (ha)" required>
          <Input placeholder="Ex.: 1.500,00" />
        </Field>
        <Field label="Área Agricultável (ha)" required>
          <Input placeholder="Ex.: 1.100,00" />
        </Field>
        <Field label="Área de Preservação (APP + Reserva) (ha)" required>
          <Input placeholder="Ex.: 400,00" />
        </Field>
        <Field label="Área de Pastagem (ha)">
          <Input placeholder="Ex.: 0,00" />
        </Field>
        <Field label="Área de Vegetação Nativa (ha)">
          <Input placeholder="Ex.: 0,00" />
        </Field>
        <Field label="Altitude Média (m)">
          <Input placeholder="Ex.: 450" />
        </Field>
      </FormSection>

      <FormSection title="Outras Informações" cols={3}>
        <Field label="Tipo de Solo Predominante">
          {/* <-- Select de Tipos de Solo atualizado */}
          <Select
            value={tipoSoloSelecionado}
            onChange={(e) => setTipoSoloSelecionado(e.target.value)}
            disabled={carregandoTiposSolo}
          >
            <option value="">
              {carregandoTiposSolo ? "Carregando..." : "Selecione o tipo de solo"}
            </option>
            {tiposSolo.map((solo: TipoSolo) => (
              <option key={solo.id} value={solo.id}>
                {solo.sigla} - {solo.descricao}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Classe de Capacidade de Uso">
          <Select placeholder="Selecione" />
        </Field>
        <Field label="Observações">
          <textarea
            rows={3}
            placeholder="Informações adicionais sobre a propriedade..."
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400 resize-none transition"
          />
          <div className="text-right text-xs text-gray-400 -mt-1">
            0/500 caracteres
          </div>
        </Field>
      </FormSection>
    </FormWrapper>
  );
}
