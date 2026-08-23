import React, { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query"; // 1. Importando o hook
import { 
  getEmpresasAgricolas, 
  getEstados, 
  getCidadesPorEstado, 
  getTiposSolo, // <-- Importação da nova função da API
  getClassesUso, // <-- Classes de Capacidade de Uso
  criarPropriedade // <-- Cadastro de propriedade
} from "../../services/api";
import { Estado, Cidade } from "../../types/geo"; 
import { TipoSolo } from "../../types/tipoSolo";
import { ClasseCapacidadeUso } from "../../types/classeCapacidadeUso";
import { NovaPropriedadePayload } from "../../types/propriedade";

import FormWrapper from "./FormWrapper";
import FormSection from "../ui/FormSection";
import Field from "../ui/Field";
import Input from "../ui/Input";
import Select from "../ui/Select";
import SectionTitle from "../ui/SectionTitle";
import MapaPropriedade from "../ui/MapaPropriedade";

export default function PropriedadeForm() {
  const [estadoSelecionado, setEstadoSelecionado] = useState<string>("");
  const [cidadeSelecionada, setCidadeSelecionada] = useState<string>("");
  const [cep, setCep] = useState<string>("");
  const [logradouro, setLogradouro] = useState<string>("");
  const [cidadePendente, setCidadePendente] = useState<string>("");
  const [empresaSelecionada, setEmpresaSelecionada] = useState<string>("");
  const [nomePropriedade, setNomePropriedade] = useState<string>("");

  // Identificação legal
  const [car, setCar] = useState<string>("");
  const [ccir, setCcir] = useState<string>("");
  const [nirf, setNirf] = useState<string>("");

  // Ponto de referência
  const [pontoReferencia, setPontoReferencia] = useState<string>("");

  // Dados físicos (áreas)
  const [areaTotal, setAreaTotal] = useState<string>("");
  const [areaAgricultavel, setAreaAgricultavel] = useState<string>("");
  const [areaPreservacao, setAreaPreservacao] = useState<string>("");
  const [areaPastagem, setAreaPastagem] = useState<string>("");
  const [areaVegetacaoNativa, setAreaVegetacaoNativa] = useState<string>("");
  const [altitudeMedia, setAltitudeMedia] = useState<string>("");

  // Coordenadas geográficas (capturadas pelo mapa ou digitadas)
  const [latitude, setLatitude] = useState<string>("");
  const [longitude, setLongitude] = useState<string>("");

  // <-- Novo estado para o Tipo de Solo
  const [tipoSoloSelecionado, setTipoSoloSelecionado] = useState<string>("");

  // <-- Novo estado para a Classe de Capacidade de Uso
  const [classeUsoSelecionada, setClasseUsoSelecionada] = useState<string>("");
  const [observacoes, setObservacoes] = useState<string>("");

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

  // <-- Nova Query para buscar as Classes de Capacidade de Uso
  const { data: classesUso = [], isLoading: carregandoClassesUso } = useQuery({
    queryKey: ["classesUso"],
    queryFn: async () => {
      const response = await getClassesUso();
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

  // Ao clicar no mapa: preenche os campos de latitude e longitude
  const handleSelecionarNoMapa = (lat: number, lng: number) => {
    setLatitude(lat.toFixed(8));
    setLongitude(lng.toFixed(8));
  };

  // Converte os campos de texto em uma posição válida para o mapa (ou null)
  const posicaoMapa: [number, number] | null =
    latitude !== "" && longitude !== "" && !isNaN(Number(latitude)) && !isNaN(Number(longitude))
      ? [Number(latitude), Number(longitude)]
      : null;

  // Nome exibido no tooltip do marcador: prioriza o nome digitado da propriedade,
  // depois a empresa vinculada e, por fim, um texto padrão.
  const empresaVinculada = empresas.find(
    (e) => String(e.id_empresa) === empresaSelecionada
  );
  const rotuloMapa =
    nomePropriedade.trim() ||
    (empresaVinculada
      ? empresaVinculada.nome_fantasia || empresaVinculada.razao_social
      : "Sede da propriedade");

  // Mutation para cadastrar a propriedade no backend
  const {
    mutate: salvarPropriedade,
    isPending: salvando,
  } = useMutation({
    mutationFn: async (dados: NovaPropriedadePayload) =>
      (await criarPropriedade(dados)).data,
    onSuccess: (resposta) => {
      alert(
        `✅ ${resposta.message}\n\nPropriedade: ${resposta.nome_propriedade}\nID: ${resposta.id_propriedade}`
      );
      limparFormulario();
    },
    onError: (erro: any) => {
      const msg =
        erro?.response?.data?.message ||
        erro?.response?.data?.erro ||
        erro?.message ||
        "Erro desconhecido ao cadastrar a propriedade.";
      alert(`❌ Não foi possível salvar a propriedade.\n\n${msg}`);
    },
  });

  // Limpa todos os campos após um cadastro bem-sucedido
  const limparFormulario = () => {
    setEmpresaSelecionada("");
    setNomePropriedade("");
    setCar("");
    setCcir("");
    setNirf("");
    setEstadoSelecionado("");
    setCidadeSelecionada("");
    setCep("");
    setLogradouro("");
    setPontoReferencia("");
    setLatitude("");
    setLongitude("");
    setAreaTotal("");
    setAreaAgricultavel("");
    setAreaPreservacao("");
    setAreaPastagem("");
    setAreaVegetacaoNativa("");
    setAltitudeMedia("");
    setTipoSoloSelecionado("");
    setClasseUsoSelecionada("");
    setObservacoes("");
  };

  // Valida os campos obrigatórios e dispara a mutation
  const handleSalvar = () => {
    // Validações mínimas dos campos obrigatórios
    if (!empresaSelecionada) {
      alert("⚠️ Selecione a Empresa Agrícola vinculada.");
      return;
    }
    if (!nomePropriedade.trim()) {
      alert("⚠️ Informe o Nome da Propriedade.");
      return;
    }
    if (!car.trim()) {
      alert("⚠️ Informe o CAR (Cadastro Ambiental Rural).");
      return;
    }
    if (latitude === "" || longitude === "") {
      alert("⚠️ Defina a localização no mapa (Latitude/Longitude).");
      return;
    }

    // Monta o payload no formato esperado pelo backend
    const payload: NovaPropriedadePayload = {
      nome_propriedade: nomePropriedade.trim(),
      id_empresa: Number(empresaSelecionada),
      latitude: Number(latitude),
      longitude: Number(longitude),
    };

    // Campos opcionais — só adiciona se preenchidos
    if (car.trim()) payload.car = car.trim();
    if (cep.trim()) payload.cep = cep.replace(/\D/g, "");
    if (cidadeSelecionada) payload.id_cidade = Number(cidadeSelecionada);
    if (logradouro.trim()) payload.logradouro = logradouro.trim();
    if (areaTotal.trim()) payload.area_total = areaTotal.trim();
    if (areaAgricultavel.trim()) payload.area_agricultavel = areaAgricultavel.trim();
    if (areaPreservacao.trim()) payload.area_preservacao = areaPreservacao.trim();
    if (tipoSoloSelecionado) payload.id_tipo_solo = Number(tipoSoloSelecionado);
    if (classeUsoSelecionada)
      payload.id_classe_capacidade_uso = Number(classeUsoSelecionada);

    salvarPropriedade(payload);
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
      saveLabel={salvando ? "Salvando..." : "Salvar Propriedade"}
      onSave={handleSalvar}
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
        <Field label="Nome da Propriedade" required>
          <Input
            placeholder="Ex.: Fazenda Boa Vista"
            value={nomePropriedade}
            onChange={(e) => setNomePropriedade(e.target.value)}
          />
        </Field>
      </FormSection>

      <FormSection title="Identificação Legal" cols={3}>
        <Field label="CAR" required>
          <div className="relative">
            <Input
              placeholder="Ex.: MT-5104851-1234.5678.9012.3456"
              value={car}
              onChange={(e) => setCar(e.target.value)}
            />
            <span className="absolute right-2 top-2 text-gray-400 text-xs cursor-help">
              ⓘ
            </span>
          </div>
        </Field>
        <Field label="CCIR">
          <div className="relative">
            <Input
              placeholder="Ex.: 123.456.789.012-3"
              value={ccir}
              onChange={(e) => setCcir(e.target.value)}
            />
            <span className="absolute right-2 top-2 text-gray-400 text-xs cursor-help">
              ⓘ
            </span>
          </div>
        </Field>
        <Field label="NIRF">
          <div className="relative">
            <Input
              placeholder="Ex.: 5.123.456-7"
              value={nirf}
              onChange={(e) => setNirf(e.target.value)}
            />
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
          <Input
            placeholder="Ex.: Após a ponte, entrar à direita"
            value={pontoReferencia}
            onChange={(e) => setPontoReferencia(e.target.value)}
          />
        </Field>
      </FormSection>

      {/* Coordenadas + Mapa — layout especial, fora do FormSection */}
      <div>
        <div className="flex items-center justify-between">
          <SectionTitle>Coordenadas Geográficas</SectionTitle>
          <span className="text-xs text-gray-500 flex items-center gap-1 whitespace-nowrap ml-4">
            📍 Clique no mapa para definir a localização da sede
          </span>
        </div>

        {/* Faixa compacta com os campos de coordenadas */}
        <div className="grid grid-cols-2 gap-5 mb-4 max-w-md">
          <Field label="Latitude" required>
            <Input
              placeholder="Ex.: -12.34567890"
              value={latitude}
              onChange={(e) => setLatitude(e.target.value)}
            />
          </Field>
          <Field label="Longitude" required>
            <Input
              placeholder="Ex.: -55.67890123"
              value={longitude}
              onChange={(e) => setLongitude(e.target.value)}
            />
          </Field>
        </div>

        {/* Mapa grande em largura total */}
        <div className="h-[420px] w-full rounded-lg overflow-hidden border border-gray-200 shadow-sm">
          <MapaPropriedade
            posicao={posicaoMapa}
            onSelecionar={handleSelecionarNoMapa}
            label={rotuloMapa}
          />
        </div>
        <p className="text-xs text-gray-400 mt-1">
          💡 Clique em qualquer ponto do mapa para preencher as coordenadas
          automaticamente, ou digite manualmente nos campos acima.
        </p>
      </div>

      <FormSection title="Dados Físicos" cols={3}>
        <Field label="Área Total (ha)" required>
          <Input
            placeholder="Ex.: 1.500,00"
            value={areaTotal}
            onChange={(e) => setAreaTotal(e.target.value)}
          />
        </Field>
        <Field label="Área Agricultável (ha)" required>
          <Input
            placeholder="Ex.: 1.100,00"
            value={areaAgricultavel}
            onChange={(e) => setAreaAgricultavel(e.target.value)}
          />
        </Field>
        <Field label="Área de Preservação (APP + Reserva) (ha)" required>
          <Input
            placeholder="Ex.: 400,00"
            value={areaPreservacao}
            onChange={(e) => setAreaPreservacao(e.target.value)}
          />
        </Field>
        <Field label="Área de Pastagem (ha)">
          <Input
            placeholder="Ex.: 0,00"
            value={areaPastagem}
            onChange={(e) => setAreaPastagem(e.target.value)}
          />
        </Field>
        <Field label="Área de Vegetação Nativa (ha)">
          <Input
            placeholder="Ex.: 0,00"
            value={areaVegetacaoNativa}
            onChange={(e) => setAreaVegetacaoNativa(e.target.value)}
          />
        </Field>
        <Field label="Altitude Média (m)">
          <Input
            placeholder="Ex.: 450"
            value={altitudeMedia}
            onChange={(e) => setAltitudeMedia(e.target.value)}
          />
        </Field>
      </FormSection>

      <FormSection title="Outras Informações" cols={2}>
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
          <Select
            value={classeUsoSelecionada}
            onChange={(e) => setClasseUsoSelecionada(e.target.value)}
            disabled={carregandoClassesUso}
          >
            <option value="">
              {carregandoClassesUso ? "Carregando..." : "Selecione"}
            </option>
            {classesUso.map((classe: ClasseCapacidadeUso) => (
              <option
                key={classe.id_classe_capacidade_uso}
                value={classe.id_classe_capacidade_uso}
                title={classe.descricao}
              >
                {classe.sigla} -{" "}
                {classe.aptidao_principal ?? "Lavouras (sem restrições)"}
              </option>
            ))}
          </Select>
        </Field>
      </FormSection>

      {/* Observações em largura total */}
      <div className="mt-6">
        <Field label="Observações">
          <textarea
            rows={5}
            maxLength={1000}
            value={observacoes}
            onChange={(e) => setObservacoes(e.target.value)}
            placeholder="Informações adicionais sobre a propriedade..."
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400 resize-y transition"
          />
          <div className="text-right text-xs text-gray-400 mt-1">
            {observacoes.length}/1000 caracteres
          </div>
        </Field>
      </div>
    </FormWrapper>
  );
}
