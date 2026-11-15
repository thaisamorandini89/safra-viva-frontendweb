// Tradução entre o formato das telas de Insumos e o contrato do backend.
import {
  CATEGORIAS_INSUMOS,
  CategoriaInsumo,
  Insumo,
  MovimentacaoEstoque,
  NovaMovimentacaoPayload,
  NovoInsumoPayload,
  ProdutoCadastrado,
  categoriaDoProduto,
} from "../types/insumo";

const texto = (v: unknown): string | undefined =>
  v == null || v === "" ? undefined : String(v);

const numero = (v: unknown): number | undefined =>
  v == null || v === "" ? undefined : Number(v);

function categoriaConhecida(nomeCategoria: unknown, nomeProduto: string): CategoriaInsumo {
  const alvo = String(nomeCategoria ?? "").trim().toLowerCase();
  return (
    CATEGORIAS_INSUMOS.find((c) => c.toLowerCase() === alvo) ??
    categoriaDoProduto(nomeProduto)
  );
}

export function insumoDaApi(raw: any): Insumo {
  const nome = raw?.nome_produto ?? "";
  return {
    id: String(raw?.id_insumo ?? ""),
    id_produto: numero(raw?.id_produto),
    nome,
    categoria: categoriaConhecida(raw?.categoria_nome, nome),
    tipo: texto(raw?.subcategoria),
    unidade_medida: raw?.unidade_medida ?? "",
    id_fabricante: numero(raw?.id_fabricante),
    fabricante: texto(raw?.fabricante_nome),
    id_marca: numero(raw?.id_marca),
    marca: texto(raw?.descricao_marca),
    id_fornecedor: numero(raw?.id_fornecedor),
    fornecedor: texto(raw?.fornecedor_nome),
    estoque_atual: Number(raw?.estoque_atual ?? 0),
    estoque_minimo: Number(raw?.estoque_minimo ?? 0),
    valor_unitario: Number(raw?.valor_unitario ?? 0),
    status: raw?.status === false ? "Inativo" : "Ativo",
    id_propriedade: numero(raw?.id_propriedade),
    nome_propriedade: texto(raw?.nome_propriedade),
    registro_mapa: texto(raw?.registro_mapa),
    ficha_tecnica: texto(raw?.ficha_tecnica),
    observacoes: texto(raw?.observacoes),
    lotes: (Array.isArray(raw?.lotes) ? raw.lotes : []).map((l: any) => ({
      id: String(l?.id_lote ?? ""),
      id_insumo: String(raw?.id_insumo ?? ""),
      numero_lote: l?.numero_lote ?? "",
      data_fabricacao: l?.data_fabricacao ?? null,
      data_validade: l?.data_validade ?? null,
      quantidade: Number(l?.quantidade ?? 0),
    })),
  };
}

export function produtoDaApi(raw: any): ProdutoCadastrado {
  const nome = raw?.nome_produto ?? "";
  return {
    id_produto: Number(raw?.id_produto),
    nome,
    categoria: categoriaConhecida(raw?.categoria_nome, nome),
    tipo: texto(raw?.subcategoria),
    unidade_medida: raw?.unidade_medida ?? "",
    id_fabricante: numero(raw?.id_fabricante),
    id_marca: numero(raw?.id_marca),
    id_fornecedor: numero(raw?.id_fornecedor),
    registro_mapa: texto(raw?.registro_mapa),
    ficha_tecnica: texto(raw?.ficha_tecnica),
    observacoes: texto(raw?.observacoes),
    ativo: raw?.status !== false,
  };
}

export function insumoParaApi(dados: NovoInsumoPayload, edicao = false) {
  // com produto já cadastrado, o insumo só referencia o produto
  const produto =
    !edicao && dados.id_produto != null
      ? { id_produto: dados.id_produto }
      : {
          produto: {
            nome_produto: dados.nome,
            id_categoria_insumo: dados.id_categoria_insumo,
            subcategoria: dados.tipo ?? null,
            unidade_medida: dados.unidade_medida,
            id_fabricante: dados.id_fabricante ?? null,
            id_marca: dados.id_marca ?? null,
            id_fornecedor: dados.id_fornecedor ?? null,
            registro_mapa: dados.registro_mapa ?? null,
            ficha_tecnica: dados.ficha_tecnica ?? null,
            observacoes: dados.observacoes ?? null,
          },
        };
  const comuns = {
    ...produto,
    estoque_minimo: dados.estoque_minimo,
    valor_unitario: dados.valor_unitario,
    id_propriedade: dados.id_propriedade ?? null,
    status: dados.status === "Ativo",
  };

  // na edição o saldo não é enviado: ele só muda por movimentação
  if (edicao) return comuns;

  // o estoque inicial vira uma entrada no backend; sem quantidade ele recusa esses dados
  const entrada = dados.estoque_atual > 0 ? dados.entrada_inicial : undefined;
  return {
    ...comuns,
    estoque_atual: dados.estoque_atual,
    ...(entrada && {
      entrada_inicial: {
        id_funcionario: entrada.id_responsavel || undefined,
        numero_lote: entrada.numero_lote || undefined,
        data_fabricacao: entrada.data_fabricacao || undefined,
        data_validade: entrada.data_validade || undefined,
      },
    }),
  };
}

export function movimentacaoDaApi(raw: any): MovimentacaoEstoque {
  return {
    id: String(raw?.id_movimentacao ?? ""),
    id_insumo: String(raw?.id_insumo ?? ""),
    nome_insumo: texto(raw?.nome_produto),
    tipo: raw?.tipo_movimentacao === "SAIDA" ? "Saída" : "Entrada",
    origem:
      raw?.origem === "ATIVIDADE"
        ? "Atividade"
        : raw?.origem === "CADASTRO"
        ? "Cadastro"
        : "Manual",
    unidade_medida: texto(raw?.unidade_medida),
    quantidade: Number(raw?.quantidade ?? 0),
    valor_unitario: numero(raw?.valor_unitario),
    data_movimentacao: String(raw?.data_movimentacao ?? "").slice(0, 10),
    id_responsavel: raw?.id_funcionario ?? "",
    responsavel: texto(raw?.funcionario_nome),
    fornecedor: texto(raw?.fornecedor_nome),
    nota_fiscal: texto(raw?.numero_nota_fiscal),
    numero_lote: texto(raw?.numero_lote),
    data_fabricacao: raw?.data_fabricacao ?? null,
    data_validade: raw?.data_validade ?? null,
    id_talhao: texto(raw?.id_talhao),
    codigo_talhao: texto(raw?.codigo_talhao),
    nome_talhao: texto(raw?.nome_talhao),
    safra: texto(raw?.safra),
    id_atividade: texto(raw?.id_atividade_agricola),
    atividade: texto(raw?.atividade_descricao),
    destino: texto(raw?.destino_finalidade),
    observacao: texto(raw?.observacao),
    lotes: (Array.isArray(raw?.lotes) ? raw.lotes : []).map((l: any) => ({
      id_lote: String(l?.id_lote ?? ""),
      numero_lote: l?.numero_lote ?? "",
      data_validade: l?.data_validade ?? null,
      quantidade: Number(l?.quantidade ?? 0),
    })),
  };
}

export function movimentacaoParaApi(dados: NovaMovimentacaoPayload) {
  const comuns = {
    id_insumo: Number(dados.id_insumo),
    tipo_movimentacao: dados.tipo === "Entrada" ? "ENTRADA" : "SAIDA",
    quantidade: dados.quantidade,
    valor_unitario: dados.valor_unitario,
    data_movimentacao: dados.data_movimentacao || undefined,
    id_funcionario: dados.id_responsavel || undefined,
    observacao: dados.observacao,
  };

  // o backend recusa campos de entrada numa saída e vice-versa
  if (dados.tipo === "Entrada") {
    return {
      ...comuns,
      id_fornecedor: dados.id_fornecedor,
      numero_nota_fiscal: dados.nota_fiscal,
      numero_lote: dados.numero_lote,
      data_fabricacao: dados.data_fabricacao || undefined,
      data_validade: dados.data_validade || undefined,
    };
  }

  return {
    ...comuns,
    id_talhao: numero(dados.id_talhao),
    safra: dados.safra,
    id_atividade_agricola: numero(dados.id_atividade),
    destino_finalidade: dados.destino,
    id_lote: numero(dados.id_lote),
  };
}

/**
 * Erro a exibir quando o próprio backend recusou a operação. Devolve null
 * quando não houve resposta dele (rede ou proxy), caso em que vale o modo
 * de demonstração.
 */
export function erroDoBackend(e: any): Error | null {
  const dados = e?.response?.data;
  if (typeof dados?.error !== "string") return null;

  const detalhes = Array.isArray(dados.details)
    ? dados.details
        .map((d: any) => [d?.campo, d?.mensagem].filter(Boolean).join(": "))
        .filter(Boolean)
        .join("; ")
    : "";
  return new Error(detalhes ? `${dados.error} ${detalhes}` : dados.error);
}
