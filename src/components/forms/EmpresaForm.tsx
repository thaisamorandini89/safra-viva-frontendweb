import React, { useState, useEffect } from "react";

import {
  getEstados,
  getCidadesPorEstado,
  getRegimesTributarios,
  getTiposEmpresas,
  salvarEmpresa,
} from "../../services/api";

import { Estado, Cidade } from "../../types/geo";

import { RegimeTributario } from "../../types/regimeTributario";

import { TipoEmpresa } from "../../types/tipoEmpresa";

import FormWrapper from "../../components/forms/FormWrapper";

import FormSection from "../ui/FormSection";

import Field from "../ui/Field";

import Input from "../ui/Input";

import Select from "../ui/Select";

export default function EmpresaForm() {
  const [empresaAtiva, setEmpresaAtiva] = useState(true);
  const [razaoSocial, setRazaoSocial] = useState("");
  const [nomeFantasia, setNomeFantasia] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [inscricaoEstadual, setInscricaoEstadual] = useState("");
  const [inscricaoMunicipal, setInscricaoMunicipal] = useState("");
  const [telefone, setTelefone] = useState("");
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");

  const [estados, setEstados] = useState<Estado[]>([]);
  const [cidades, setCidades] = useState<Cidade[]>([]);
  const [regimes, setRegimes] = useState<RegimeTributario[]>([]);
  const [tipos, setTipos] = useState<TipoEmpresa[]>([]);

  const [estadoSelecionado, setEstadoSelecionado] = useState<string>("");
  const [cidadeSelecionada, setCidadeSelecionada] = useState<string>("");
  const [regimeSelecionado, setRegimeSelecionado] = useState<string>("");
  const [tipoSelecionado, setTipoSelecionado] = useState<string>("");

  // Estados para o endereço

  const [cep, setCep] = useState<string>("");
  const [logradouro, setLogradouro] = useState<string>("");
  const [bairro, setBairro] = useState<string>("");
  const [complemento, setComplemento] = useState<string>("");
  const [numero, setNumero] = useState<string>("");
  const [cidadePendente, setCidadePendente] = useState<string>("");

  // 1. Carregar Estados, Regimes e Tipos ao montar o componente// 1. CARREGAR TUDO NO INÍCIO

  useEffect(() => {
    getEstados()
      .then((res) => setEstados(res.data))
      .catch((err) => console.error("Erro ao carregar estados:", err));

    getRegimesTributarios()
      .then(({ data }) => {
        setRegimes(data);
      })
      .catch((err) => console.error("Erro ao carregar regimes:", err));

    getTiposEmpresas()
      .then(({ data }) => {
        setTipos(data);
      })
      .catch((err) =>
        console.error("Erro ao carregar tipos de empresas:", err),
      );
  }, []);

  // 2. Carregar Cidades quando o estado muda

  useEffect(() => {
    if (estadoSelecionado) {
      getCidadesPorEstado(Number(estadoSelecionado))
        .then((res) => {
          setCidades(res.data);

          if (cidadePendente) {
            const cidadeMatch = res.data.find(
              (c: Cidade) =>
                c.nome.toLowerCase().trim() ===
                cidadePendente.toLowerCase().trim(),
            );

            if (cidadeMatch) {
              setCidadeSelecionada(String(cidadeMatch.id));
            }

            setCidadePendente("");
          } else {
            setCidadeSelecionada("");
          }
        })

        .catch((err) => console.error("Erro ao carregar cidades:", err));
    } else {
      setCidades([]);

      setCidadeSelecionada("");
    }
  }, [estadoSelecionado]);

  const buscarCep = async () => {
    console.log("Clicou no CEP:");

    const cepLimpo = cep.replace(/\D/g, "");

    if (cepLimpo.length !== 8) {
      alert("Por favor, digite um CEP válido com 8 números.");

      return;
    }

    try {
      const response = await fetch(
        `https://viacep.com.br/ws/${cepLimpo}/json/`,
      );

      const data = await response.json();

      if (data.erro) {
        alert("CEP não encontrado.");

        return;
      }

      setLogradouro(data.logradouro || "");

      setBairro(data.bairro || "");

      setCidadePendente(data.localidade);

      if (estados.length > 0) {
        const estadoEncontrado = estados.find((e) => e.uf === data.uf);

        if (estadoEncontrado) {
          setEstadoSelecionado(String(estadoEncontrado.id));
        }
      }
    } catch (error) {
      console.error("Erro ao buscar CEP:", error);

      alert("Erro ao conectar com o ViaCEP.");
    }
  };

  const handleSalvar = async () => {
    // Validação básica
    if (!razaoSocial || !cnpj || !regimeSelecionado || !tipoSelecionado || !cidadeSelecionada) {
      alert("Preencha todos os campos obrigatórios (*)");
      return;
    }

    // Montando o JSON exatamente como no Insomnia
    const payload = {
      razao_social: razaoSocial,
      nome_fantasia: nomeFantasia,
      cnpj: cnpj.replace(/\D/g, ""), // Remove pontuação para enviar apenas números
      inscricao_estadual: inscricaoEstadual,
      inscricao_municipal: inscricaoMunicipal,
      telefone: telefone.replace(/\D/g, ""),
      email: email,
      website: website,
      // data_fundacao: "2015-05-15", // OBS: Você não tem esse campo no form do React. Se for obrigatório na API, você precisará criar um Input de data.
      id_tipo_empresa: Number(tipoSelecionado),
      id_regime_tributario: Number(regimeSelecionado),
      cep: cep.replace(/\D/g, ""),
      logradouro: logradouro,
      numero: numero,
      complemento: complemento,
      bairro: bairro,
      id_cidade: Number(cidadeSelecionada)
    };

    try {
      const response = await salvarEmpresa(payload);
      alert("Empresa agrícola cadastrada com sucesso!");
      console.log("Resposta da API:", response.data);
      // Aqui você pode limpar os campos ou redirecionar o usuário
    } catch (error) {
      console.error("Erro ao salvar:", error);
      alert("Ocorreu um erro ao salvar a empresa. Verifique o console.");
    }
  };

  return (
    <FormWrapper
      breadcrumb="Empresas Agrícolas"
      page="Novo Cadastro"
      title="Cadastro de Empresa Agrícola"
      description="Preencha as informações da empresa agrícola."
      onSave={handleSalvar}
      onCancel={() => console.log("Ação de cancelar")}
    >
      <FormSection title="Dados Cadastrais" cols={2}>
        <Field label="Razão Social" required>
          <Input 
            placeholder="Ex.: Agropecuária Boa Vista Ltda."
            value={razaoSocial}
            onChange={(e) => setRazaoSocial(e.target.value)}
          />
        </Field>

        <Field label="Nome Fantasia">
          <Input 
            placeholder="Ex.: Fazenda Boa Vista" 
            value={nomeFantasia} 
            onChange={(e) => setNomeFantasia(e.target.value)}
          />
        </Field>

        <Field label="CNPJ" required>
          <Input 
            placeholder="00.000.000/0001-00" 
            value={cnpj} 
            onChange={(e) => setCnpj(e.target.value)} 
          />
        </Field>

        <Field label="Inscrição Estadual">
          <Input 
            placeholder="Ex.: 123.456.789.123" 
            value={inscricaoEstadual} 
            onChange={(e) => setInscricaoEstadual(e.target.value)} 
          />
        </Field>

        <Field label="Inscrição Municipal">
          <Input 
            placeholder="Ex.: 123456" 
            value={inscricaoMunicipal} 
            onChange={(e) => setInscricaoMunicipal(e.target.value)} 
          />
        </Field>

        <Field label="Regime Tributário" required>
          <Select
            value={regimeSelecionado}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
              setRegimeSelecionado(e.target.value)
            }
            placeholder="Selecione o regime"
            options={regimes}
            getOptionLabel={(r: RegimeTributario) => r.descricao}
            getOptionValue={(r: RegimeTributario) => r.id}
          />
        </Field>

        <Field label="Tipo Tributário" required>
          <Select
            value={tipoSelecionado}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
              setTipoSelecionado(e.target.value)
            }
            placeholder="Selecione o tipo"
            options={tipos}
            getOptionLabel={(t: TipoEmpresa) => t.descricao}
            getOptionValue={(t: TipoEmpresa) => t.id}
          />
        </Field>
      </FormSection>

      <FormSection title="Contato" cols={3}>
        <Field label="Telefone">
          <Input 
            placeholder="(00) 00000-0000" 
            value={telefone} 
            onChange={(e) => setTelefone(e.target.value)} 
          />
        </Field>

        <Field label="E-mail" required>
          <Input 
            placeholder="exemplo@empresa.com.br" 
            type="email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
          />
        </Field>

        <Field label="Website">
          <Input 
            placeholder="www.empresa.com.br" 
            value={website} 
            onChange={(e) => setWebsite(e.target.value)} 
          />
        </Field>
      </FormSection>

      <FormSection title="Endereço Sede" cols={3}>
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
              Buscar CEP
            </button>
          </div>
        </Field>

        <Field label="Logradouro" className="col-span-2">
          <Input
            placeholder="Ex.: Rua das Palmeiras"
            value={logradouro}
            onChange={(e) => setLogradouro(e.target.value)}
          />
        </Field>

        <Field label="Número">
          <Input
            placeholder="Ex.: 123"
            value={numero}
            onChange={(e) => setNumero(e.target.value)}
          />
        </Field>

        <Field label="Complemento">
          <Input
            placeholder="Ex.: Sala 01"
            value={complemento}
            onChange={(e) => setComplemento(e.target.value)}
          />
        </Field>

        <Field label="Bairro">
          <Input
            placeholder="Ex.: Centro"
            value={bairro}
            onChange={(e) => setBairro(e.target.value)}
          />
        </Field>

        <Field label="Estado" required>
          <Select
            value={estadoSelecionado}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
              setEstadoSelecionado(e.target.value)
            }
          >
            <option value="">Selecione um estado</option>

            {estados.map((estado) => (
              <option key={estado.id} value={estado.id}>
                {estado.nome} ({estado.uf})
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Cidade" required>
          <Select
            value={cidadeSelecionada}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
              setCidadeSelecionada(e.target.value)
            }
            disabled={!estadoSelecionado}
          >
            <option value="">
              {estadoSelecionado
                ? "Selecione uma cidade"
                : "Selecione o estado primeiro"}
            </option>

            {cidades.map((cidade) => (
              <option key={cidade.id} value={cidade.id}>
                {cidade.nome}
              </option>
            ))}
          </Select>
        </Field>
      </FormSection>
    </FormWrapper>
  );
}
