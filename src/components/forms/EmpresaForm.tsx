import React, { useState, useEffect } from "react";

import {
  getEstados,
  getCidadesPorEstado,
  getRegimesTributarios,
  getTiposEmpresas,
  salvarEmpresa,
  atualizarEmpresa,
} from "../../services/api";

import { Estado, Cidade } from "../../types/geo";

import { RegimeTributario } from "../../types/regimeTributario";

import { TipoEmpresa } from "../../types/tipoEmpresa";

import { EmpresaAgricola } from "../../types/empresaAgricola";

import FormWrapper from "../../components/forms/FormWrapper";

import FormSection from "../ui/FormSection";

import Field from "../ui/Field";

import Input from "../ui/Input";

import Select from "../ui/Select";

import FormActions from "../ui/FormActions";

import Toast, { DadosToast } from "../ui/Toast";

import {
  compor,
  CampoObrigatorio,
  ValidadorEmail,
  ValidadorCNPJ,
  ValidadorTelefone,
} from "../../utils/validators";

interface EmpresaFormProps {
  /** Renderiza apenas o formulário (sem TopBar/PageHeader) para uso dentro de um módulo */
  embedded?: boolean;
  /** Chamado após salvar com sucesso (recebe o nome da empresa cadastrada) */
  onSaved?: (nomeEmpresa: string) => void;
  /** Chamado ao cancelar */
  onCancelar?: () => void;
  /** Empresas já cadastradas — usado para alertar sobre CNPJ duplicado antes de enviar */
  empresasExistentes?: EmpresaAgricola[];
  /** Quando informado, o formulário entra em modo de edição pré-preenchido */
  empresaEdicao?: EmpresaAgricola | null;
}

export default function EmpresaForm({
  embedded = false,
  onSaved,
  onCancelar,
  empresasExistentes = [],
  empresaEdicao = null,
}: EmpresaFormProps) {
  const modoEdicao = empresaEdicao != null;
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

  // Mensagens de erro por campo obrigatório
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Notificação flutuante (sucesso/erro)
  const [toast, setToast] = useState<DadosToast | null>(null);

  // Pré-preenche o formulário quando em modo de edição
  useEffect(() => {
    if (!empresaEdicao) return;
    setRazaoSocial(empresaEdicao.razao_social ?? "");
    setNomeFantasia(empresaEdicao.nome_fantasia ?? "");
    setCnpj(empresaEdicao.cnpj ?? "");
    setInscricaoEstadual(empresaEdicao.inscricao_estadual ?? "");
    setInscricaoMunicipal(empresaEdicao.inscricao_municipal ?? "");
    setTelefone(empresaEdicao.telefone ?? "");
    setEmail(empresaEdicao.email ?? "");
    setWebsite(empresaEdicao.website ?? "");
    setRegimeSelecionado(
      empresaEdicao.id_regime_tributario ? String(empresaEdicao.id_regime_tributario) : ""
    );
    setTipoSelecionado(
      empresaEdicao.id_tipo_empresa ? String(empresaEdicao.id_tipo_empresa) : ""
    );
    setErrors({});
  }, [empresaEdicao]);

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

  // Limpa o erro de um campo assim que o usuário começa a corrigi-lo
  const limparErro = (campo: string) =>
    setErrors((atuais) => {
      if (!atuais[campo]) return atuais;
      const { [campo]: _removido, ...resto } = atuais;
      return resto;
    });

  // Valida todos os campos obrigatórios e retorna um mapa de erros
  const validar = (): Record<string, string> => {
    const novos: Record<string, string> = {};

    const regras: { campo: string; valor: string; validador: ReturnType<typeof compor> }[] = [
      {
        campo: "razaoSocial",
        valor: razaoSocial,
        validador: compor(new CampoObrigatorio("Informe a razão social da empresa.")),
      },
      {
        campo: "cnpj",
        valor: cnpj,
        validador: compor(
          new CampoObrigatorio("Informe o CNPJ da empresa."),
          new ValidadorCNPJ("O CNPJ informado é inválido. Confira os dígitos.")
        ),
      },
      {
        campo: "regime",
        valor: regimeSelecionado,
        validador: compor(new CampoObrigatorio("Selecione o regime tributário.")),
      },
      {
        campo: "tipo",
        valor: tipoSelecionado,
        validador: compor(new CampoObrigatorio("Selecione o tipo tributário.")),
      },
      {
        campo: "telefone",
        valor: telefone,
        validador: compor(new ValidadorTelefone()),
      },
      {
        campo: "email",
        valor: email,
        validador: compor(
          new CampoObrigatorio("Informe o e-mail de contato."),
          new ValidadorEmail()
        ),
      },
    ];

    // No modo edição o endereço não é recarregado, portanto não é obrigatório
    if (!modoEdicao) {
      regras.push(
        {
          campo: "estado",
          valor: estadoSelecionado,
          validador: compor(new CampoObrigatorio("Selecione o estado.")),
        },
        {
          campo: "cidade",
          valor: cidadeSelecionada,
          validador: compor(new CampoObrigatorio("Selecione a cidade.")),
        }
      );
    }

    regras.forEach(({ campo, valor, validador }) => {
      const erro = validador.validar(valor);
      if (erro) novos[campo] = erro;
    });

    // Verifica CNPJ duplicado apenas quando o formato já é válido (ignora a própria empresa em edição)
    if (!novos.cnpj) {
      const cnpjDigitos = cnpj.replace(/\D/g, "");
      const jaExiste = empresasExistentes.some(
        (e) =>
          (e.cnpj ?? "").replace(/\D/g, "") === cnpjDigitos &&
          e.id_empresa !== empresaEdicao?.id_empresa
      );
      if (jaExiste) {
        novos.cnpj =
          "Este CNPJ já está cadastrado no sistema. Verifique o número ou consulte a listagem de empresas.";
      }
    }

    return novos;
  };

  // Restaura o formulário ao estado inicial após um cadastro bem-sucedido
  const limparFormulario = () => {
    setRazaoSocial("");
    setNomeFantasia("");
    setCnpj("");
    setInscricaoEstadual("");
    setInscricaoMunicipal("");
    setTelefone("");
    setEmail("");
    setWebsite("");
    setRegimeSelecionado("");
    setTipoSelecionado("");
    setCep("");
    setLogradouro("");
    setBairro("");
    setComplemento("");
    setNumero("");
    setEstadoSelecionado("");
    setCidadeSelecionada("");
    setErrors({});
  };

  const handleSalvar = async () => {
    // Validação de todos os campos obrigatórios (*)
    const novosErros = validar();
    setErrors(novosErros);
    if (Object.keys(novosErros).length > 0) {
      // Leva o usuário até o topo do formulário para ver o resumo
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    // Montando o JSON exatamente como no Insomnia
    const camposBase = {
      razao_social: razaoSocial,
      nome_fantasia: nomeFantasia,
      cnpj: cnpj.replace(/\D/g, ""), // Remove pontuação para enviar apenas números
      inscricao_estadual: inscricaoEstadual,
      inscricao_municipal: inscricaoMunicipal,
      telefone: telefone.replace(/\D/g, ""),
      email: email,
      website: website,
      id_tipo_empresa: Number(tipoSelecionado),
      id_regime_tributario: Number(regimeSelecionado),
    };

    // Endereço só é anexado quando há cidade selecionada (obrigatório no cadastro, opcional na edição)
    const payload = cidadeSelecionada
      ? {
          ...camposBase,
          cep: cep.replace(/\D/g, ""),
          logradouro,
          numero,
          complemento,
          bairro,
          id_cidade: Number(cidadeSelecionada),
        }
      : camposBase;

    const nome = nomeFantasia || razaoSocial;

    try {
      if (modoEdicao && empresaEdicao) {
        const response = await atualizarEmpresa(empresaEdicao.id_empresa, payload);
        console.log("Resposta da API:", response.data);
        if (embedded) {
          onSaved?.(nome);
        } else {
          setToast({
            tipo: "sucesso",
            titulo: "Empresa atualizada com sucesso!",
            descricao: `As alterações de ${nome} foram salvas.`,
          });
        }
      } else {
        const response = await salvarEmpresa(payload);
        console.log("Resposta da API:", response.data);
        if (embedded) {
          // O módulo exibe a notificação de sucesso e redireciona para a listagem
          onSaved?.(nome);
        } else {
          setToast({
            tipo: "sucesso",
            titulo: "Empresa cadastrada com sucesso!",
            descricao: `${nome} já está disponível na sua lista de empresas.`,
          });
          limparFormulario();
        }
      }
    } catch (error) {
      console.error("Erro ao salvar:", error);
      const resposta = (error as any)?.response;
      const mensagemApi: string | undefined =
        resposta?.data?.error ?? resposta?.data?.message;
      const cnpjDuplicado =
        resposta?.status === 400 && /cnpj/i.test(mensagemApi ?? "");

      if (cnpjDuplicado) {
        setErrors((atuais) => ({
          ...atuais,
          cnpj:
            mensagemApi ??
            "Este CNPJ já está cadastrado no sistema. Verifique o número informado.",
        }));
        setToast({
          tipo: "erro",
          titulo: "CNPJ já cadastrado",
          descricao:
            "Já existe uma empresa com este CNPJ. Confira o número ou consulte a listagem de empresas.",
        });
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        setToast({
          tipo: "erro",
          titulo: "Não foi possível salvar a empresa",
          descricao:
            mensagemApi ??
            "Verifique os dados informados e a conexão, depois tente novamente.",
        });
      }
    }
  };

  const corpo = (
    <>
      {modoEdicao && (
        <div className="mb-5 rounded-lg border border-sky-200 bg-sky-50 p-4">
          <p className="text-sm text-sky-800 flex items-center gap-2">
            <span aria-hidden>ℹ️</span>
            Você está editando uma empresa. O endereço não é recarregado — preencha os
            campos de endereço apenas se desejar atualizá-los.
          </p>
        </div>
      )}

      {Object.keys(errors).length > 0 && (
        <div className="mb-5 rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm font-semibold text-red-700 flex items-center gap-2">
            <span aria-hidden>⚠️</span>
            Não foi possível salvar. Revise os campos obrigatórios abaixo:
          </p>
          <ul className="mt-2 ml-6 list-disc space-y-0.5">
            {Object.entries(errors).map(([campo, msg]) => (
              <li key={campo} className="text-xs text-red-600">
                {msg}
              </li>
            ))}
          </ul>
        </div>
      )}

      <FormSection title="Dados Cadastrais" cols={2}>
        <Field label="Razão Social" required error={errors.razaoSocial}>
          <Input 
            placeholder="Ex.: Agropecuária Boa Vista Ltda."
            value={razaoSocial}
            error={!!errors.razaoSocial}
            onChange={(e) => {
              setRazaoSocial(e.target.value);
              limparErro("razaoSocial");
            }}
          />
        </Field>

        <Field label="Nome Fantasia">
          <Input 
            placeholder="Ex.: Fazenda Boa Vista" 
            value={nomeFantasia} 
            onChange={(e) => setNomeFantasia(e.target.value)}
          />
        </Field>

        <Field label="CNPJ" required error={errors.cnpj}>
          <Input 
            placeholder="00.000.000/0001-00" 
            value={cnpj} 
            error={!!errors.cnpj}
            onChange={(e) => {
              setCnpj(e.target.value);
              limparErro("cnpj");
            }} 
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

        <Field label="Regime Tributário" required error={errors.regime}>
          <Select
            value={regimeSelecionado}
            error={!!errors.regime}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
              setRegimeSelecionado(e.target.value);
              limparErro("regime");
            }}
            placeholder="Selecione o regime"
            options={regimes}
            getOptionLabel={(r: RegimeTributario) => r.descricao}
            getOptionValue={(r: RegimeTributario) => r.id}
          />
        </Field>

        <Field label="Tipo Tributário" required error={errors.tipo}>
          <Select
            value={tipoSelecionado}
            error={!!errors.tipo}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
              setTipoSelecionado(e.target.value);
              limparErro("tipo");
            }}
            placeholder="Selecione o tipo"
            options={tipos}
            getOptionLabel={(t: TipoEmpresa) => t.descricao}
            getOptionValue={(t: TipoEmpresa) => t.id}
          />
        </Field>
      </FormSection>

      <FormSection title="Contato" cols={3}>
        <Field label="Telefone" error={errors.telefone}>
          <Input 
            placeholder="(00) 00000-0000" 
            value={telefone} 
            error={!!errors.telefone}
            onChange={(e) => {
              setTelefone(e.target.value);
              limparErro("telefone");
            }} 
          />
        </Field>

        <Field label="E-mail" required error={errors.email}>
          <Input 
            placeholder="exemplo@empresa.com.br" 
            type="email" 
            value={email} 
            error={!!errors.email}
            onChange={(e) => {
              setEmail(e.target.value);
              limparErro("email");
            }} 
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

        <Field label="Estado" required error={errors.estado}>
          <Select
            value={estadoSelecionado}
            error={!!errors.estado}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
              setEstadoSelecionado(e.target.value);
              limparErro("estado");
            }}
          >
            <option value="">Selecione um estado</option>

            {estados.map((estado) => (
              <option key={estado.id} value={estado.id}>
                {estado.nome} ({estado.uf})
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Cidade" required error={errors.cidade}>
          <Select
            value={cidadeSelecionada}
            error={!!errors.cidade}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
              setCidadeSelecionada(e.target.value);
              limparErro("cidade");
            }}
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
    </>
  );

  if (embedded) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 lg:p-8 mt-4">
        {toast && (
          <Toast {...toast} onFechar={() => setToast(null)} />
        )}
        {corpo}
        <FormActions
          onCancel={onCancelar ?? (() => console.log("Ação de cancelar"))}
          onSave={handleSalvar}
          saveLabel={modoEdicao ? "Salvar alterações" : "Salvar"}
        />
      </div>
    );
  }

  return (
    <FormWrapper
      breadcrumb="Empresas Agrícolas"
      page="Novo Cadastro"
      title="Cadastro de Empresa Agrícola"
      description="Preencha as informações da empresa agrícola."
      onSave={handleSalvar}
      onCancel={onCancelar ?? (() => console.log("Ação de cancelar"))}
    >
      {toast && <Toast {...toast} onFechar={() => setToast(null)} />}
      {corpo}
    </FormWrapper>
  );
}
