// Tradução entre o formato das telas de Insumos e o contrato do backend.
import {
  CATEGORIAS_INSUMOS,
  CategoriaInsumo,
  Insumo,
  MovimentacaoEstoque,
  NovaMovimentacaoPayload,
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
    nome,
    categoria: categoriaConhecida(raw?.categoria_nome, nome),
    unidade_medida: raw?.unidade_medida ?? "",
    fabricante: texto(raw?.fabricante_nome),
    marca: texto(raw?.descricao_marca),
    estoque_atual: Number(raw?.estoque_atual ?? 0),
    estoque_minimo: Number(raw?.estoque_minimo ?? 0),
    valor_unitario: Number(raw?.valor_unitario ?? 0),
    status: raw?.status === false ? "Inativo" : "Ativo",
    lotes: [],
  };
}

export function movimentacaoDaApi(raw: any): MovimentacaoEstoque {
  return {
    id: String(raw?.id_movimentacao ?? ""),
    id_insumo: String(raw?.id_insumo ?? ""),
    nome_insumo: texto(raw?.nome_produto),
    tipo: raw?.tipo_movimentacao === "SAIDA" ? "Saída" : "Entrada",
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
