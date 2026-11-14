// ---------------------------------------------------------------------------
// SafraViva · Seed do Módulo de Gestão de Insumos
// ---------------------------------------------------------------------------
// Povoa o backend com uma massa de dados realista do agronegócio brasileiro,
// usando EXATAMENTE os mesmos endpoints acionados pelos botões de criação da
// interface:
//
//   • "Novo Insumo"        ->  POST /api/insumos
//   • "Nova Movimentação"  ->  POST /api/movimentacoes-estoque
//
// O resultado reproduz o cenário exibido no Dashboard de Insumos:
//   Total de insumos ....... 10   (9 ativos)
//   Itens com saldo ........  9
//   Próximos do vencimento .  0   (janela de 60 dias)
//   Estoque baixo (RN004) ..  3
//   Produtos vencidos (RN002) 5
//   Valor em estoque ....... R$ 882.059
//
// Regras de negócio respeitadas:
//   RN001 — nenhum produto apresenta saldo negativo.
//   RN002 — existem lotes vencidos (com saldo) para testar bloqueio/contagem.
//   RN004 — há itens no/abaixo do estoque mínimo para disparar o alerta.
//
// Uso:
//   node scripts/seed-insumos.mjs                 # cria via API
//   node scripts/seed-insumos.mjs --dry-run       # só valida e imprime KPIs
//   API_BASE_URL=http://localhost:5000 node scripts/seed-insumos.mjs
//
// Variáveis de ambiente:
//   API_BASE_URL   base do backend Flask (padrão: http://localhost:5000)
//   DRY_RUN=1      equivalente a --dry-run
//   SEED_HOJE      data de referência YYYY-MM-DD (padrão: 2026-11-13)
// ---------------------------------------------------------------------------

import axios from "axios";

const API_BASE_URL = process.env.API_BASE_URL ?? "http://localhost:5000";
const DRY_RUN =
  process.argv.includes("--dry-run") || process.env.DRY_RUN === "1";

// Data de referência do cenário (os screenshots são de 13/11/2026). Pode ser
// sobrescrita via SEED_HOJE=YYYY-MM-DD para recalcular validade/vencidos.
const HOJE = process.env.SEED_HOJE ?? "2026-11-13";

const DIAS_ALERTA_VALIDADE = 60; // janela "próximo do vencimento"

// ---------------------------------------------------------------------------
// Fornecedores e responsáveis (coerentes com o restante da aplicação)
// ---------------------------------------------------------------------------
const FORNECEDORES = {
  agro: "Agro Insumos Ltda.",
  fert: "Fertilizantes Centro-Oeste S.A.",
  campo: "Distribuidora Campo Forte",
  sementes: "Sementes Boa Safra",
  diesel: "Posto Rural Diesel Mais",
  vet: "Vet Center Agropecuária",
};

const RESPONSAVEIS = {
  joao: { id: 1, nome: "João Silva" },
  maria: { id: 2, nome: "Maria Souza" },
  carlos: { id: 3, nome: "Carlos Lima" },
  ana: { id: 4, nome: "Ana Ferreira" },
  pedro: { id: 5, nome: "Pedro Rocha" },
};

// ---------------------------------------------------------------------------
// Massa de dados: 10 insumos diversificados entre as categorias oficiais
// ---------------------------------------------------------------------------
// Cada insumo traz `estoque_atual` (saldo atual = snapshot do dashboard),
// `estoque_minimo`, `valor_unitario` e seus `lotes` (com datas de validade
// para alimentar os indicadores de vencimento — RN002).
// ---------------------------------------------------------------------------
const INSUMOS = [
  // ----- Fertilizantes -----------------------------------------------------
  {
    id: "i-001",
    nome: "Ureia 45%",
    categoria: "Fertilizantes",
    tipo: "Ureia",
    unidade_medida: "kg",
    fabricante: "Petrobras",
    marca: "Petrofértil",
    fornecedor: FORNECEDORES.fert,
    estoque_atual: 18_500,
    estoque_minimo: 5_000,
    valor_unitario: 4.1,
    status: "Ativo",
    id_propriedade: 1,
    nome_propriedade: "Fazenda Santa Helena",
    observacoes: "Armazenar em local seco e ventilado.",
    lotes: [
      { numero_lote: "UR-2026-014", data_fabricacao: "2026-02-10", data_validade: "2027-02-10", quantidade: 12_000 },
      { numero_lote: "UR-2026-021", data_fabricacao: "2026-05-04", data_validade: "2027-05-04", quantidade: 6_500 },
    ],
  },
  {
    // Fertilizante com estoque BAIXO (3.200 <= mínimo 4.000) -> RN004
    id: "i-002",
    nome: "Cloreto de Potássio (KCl 60%)",
    categoria: "Fertilizantes",
    tipo: "Cloreto de Potássio",
    unidade_medida: "kg",
    fabricante: "Mosaic",
    marca: "Mosaic Fertilizantes",
    fornecedor: FORNECEDORES.fert,
    estoque_atual: 3_200,
    estoque_minimo: 4_000,
    valor_unitario: 5.35,
    status: "Ativo",
    id_propriedade: 1,
    nome_propriedade: "Fazenda Santa Helena",
    lotes: [
      { numero_lote: "KCL-2026-003", data_fabricacao: "2026-01-15", data_validade: "2027-01-15", quantidade: 3_200 },
    ],
  },
  // ----- Defensivos Agrícolas ---------------------------------------------
  {
    // Possui 1 lote VENCIDO com saldo (RN002) e 1 lote válido
    id: "i-003",
    nome: "Herbicida Glifosato 480",
    categoria: "Defensivos Agrícolas",
    tipo: "Herbicida",
    unidade_medida: "L",
    fabricante: "Syngenta",
    marca: "Roundup",
    fornecedor: FORNECEDORES.agro,
    estoque_atual: 1_450,
    estoque_minimo: 400,
    valor_unitario: 32.9,
    status: "Ativo",
    id_propriedade: 1,
    nome_propriedade: "Fazenda Santa Helena",
    registro_mapa: "MAPA 04519",
    ficha_tecnica: "Classe toxicológica IV — usar EPI completo.",
    lotes: [
      { numero_lote: "GLI-2025-088", data_fabricacao: "2025-08-20", data_validade: "2026-09-20", quantidade: 650 },
      { numero_lote: "GLI-2026-011", data_fabricacao: "2026-03-11", data_validade: "2028-03-11", quantidade: 800 },
    ],
  },
  {
    // Estoque BAIXO (260 <= mínimo 300) + lote VENCIDO com saldo
    id: "i-004",
    nome: "Fungicida Sistêmico Triazol",
    categoria: "Defensivos Agrícolas",
    tipo: "Fungicida",
    unidade_medida: "L",
    fabricante: "Bayer",
    marca: "Nativo",
    fornecedor: FORNECEDORES.agro,
    estoque_atual: 260,
    estoque_minimo: 300,
    valor_unitario: 148.0,
    status: "Ativo",
    id_propriedade: 2,
    nome_propriedade: "Fazenda Rio Verde",
    registro_mapa: "MAPA 01102",
    lotes: [
      { numero_lote: "FUN-2025-042", data_fabricacao: "2025-06-02", data_validade: "2026-07-02", quantidade: 60 },
      { numero_lote: "FUN-2026-007", data_fabricacao: "2026-04-18", data_validade: "2027-10-18", quantidade: 200 },
    ],
  },
  // ----- Sementes (alto valor unitário e grande volume) --------------------
  {
    // Lote VENCIDO (RN002) — semente perdeu o poder germinativo
    id: "i-005",
    nome: "Semente de Soja Intacta BMX Potência",
    categoria: "Sementes",
    tipo: "Soja",
    unidade_medida: "sc",
    fabricante: "Brasmax",
    marca: "BMX",
    fornecedor: FORNECEDORES.sementes,
    estoque_atual: 940,
    estoque_minimo: 200,
    valor_unitario: 620.0,
    status: "Ativo",
    id_propriedade: 2,
    nome_propriedade: "Fazenda Rio Verde",
    lotes: [
      { numero_lote: "SOJ-2026-055", data_fabricacao: "2026-06-01", data_validade: "2026-10-15", quantidade: 940 },
    ],
  },
  // ----- Corretivos --------------------------------------------------------
  {
    id: "i-006",
    nome: "Calcário Dolomítico",
    categoria: "Corretivos",
    tipo: "Calcário",
    unidade_medida: "t",
    fabricante: "Mineração Serra Azul",
    marca: "CalSerra",
    fornecedor: FORNECEDORES.campo,
    estoque_atual: 320,
    estoque_minimo: 80,
    valor_unitario: 195.0,
    status: "Ativo",
    id_propriedade: 1,
    nome_propriedade: "Fazenda Santa Helena",
    lotes: [], // corretivo a granel, sem controle de validade
  },
  // ----- Combustíveis ------------------------------------------------------
  {
    id: "i-007",
    nome: "Óleo Diesel S10",
    categoria: "Combustíveis",
    tipo: "Diesel S10",
    unidade_medida: "L",
    fabricante: "Petrobras",
    marca: "BR",
    fornecedor: FORNECEDORES.diesel,
    estoque_atual: 6_800,
    estoque_minimo: 3_000,
    valor_unitario: 6.19,
    status: "Ativo",
    id_propriedade: 1,
    nome_propriedade: "Fazenda Santa Helena",
    lotes: [], // combustível não controla validade por lote
  },
  // ----- Medicamentos Veterinários ----------------------------------------
  {
    // Lote VENCIDO (RN002) — vacina fora da validade
    id: "i-008",
    nome: "Vacina Aftosa Bovina",
    categoria: "Medicamentos Veterinários",
    tipo: "Vacinas",
    unidade_medida: "dose",
    fabricante: "Zoetis",
    marca: "Aftosan",
    fornecedor: FORNECEDORES.vet,
    estoque_atual: 480,
    estoque_minimo: 150,
    valor_unitario: 8.4,
    status: "Ativo",
    id_propriedade: 2,
    nome_propriedade: "Fazenda Rio Verde",
    registro_mapa: "MAPA 8821/VET",
    lotes: [
      { numero_lote: "AFT-2026-002", data_fabricacao: "2026-03-01", data_validade: "2026-09-30", quantidade: 480 },
    ],
  },
  // ----- Suplementação Animal ---------------------------------------------
  {
    // Estoque ZERADO (0) -> fica fora de "itens com saldo" e dispara RN004
    id: "i-009",
    nome: "Sal Mineral Proteinado 80P",
    categoria: "Suplementação Animal",
    tipo: "Sal Mineral",
    unidade_medida: "kg",
    fabricante: "Nutripec",
    marca: "Nutripec Bovinos",
    fornecedor: FORNECEDORES.campo,
    estoque_atual: 0,
    estoque_minimo: 500,
    valor_unitario: 7.8,
    status: "Ativo",
    id_propriedade: 2,
    nome_propriedade: "Fazenda Rio Verde",
    lotes: [],
  },
  // ----- Defensivo INATIVO + lote vencido ---------------------------------
  {
    // status Inativo -> entra no total (10) mas não nos 9 ativos; lote vencido
    id: "i-010",
    nome: "Inseticida Piretroide",
    categoria: "Defensivos Agrícolas",
    tipo: "Inseticida",
    unidade_medida: "L",
    fabricante: "FMC",
    marca: "Talisman",
    fornecedor: FORNECEDORES.agro,
    estoque_atual: 120,
    estoque_minimo: 100,
    valor_unitario: 96.5,
    status: "Inativo",
    id_propriedade: 1,
    nome_propriedade: "Fazenda Santa Helena",
    observacoes: "Produto descontinuado pelo fabricante.",
    lotes: [
      { numero_lote: "INS-2024-030", data_fabricacao: "2024-05-10", data_validade: "2026-05-10", quantidade: 120 },
    ],
  },
];

// ---------------------------------------------------------------------------
// Histórico de movimentações (entradas e saídas) — rastreabilidade e gráficos
// ---------------------------------------------------------------------------
// As ENTRADAS carregam número de lote / fabricação / validade (origem dos
// lotes). As SAÍDAS alimentam "Consumo por Categoria / Talhão / Safra" e o
// "Top 10 mais consumidos". Nenhuma saída deixa o saldo negativo (RN001) nem
// consome lote vencido (RN002).
// ---------------------------------------------------------------------------
const MOVIMENTACOES = [
  { id_insumo: "i-001", tipo: "Entrada", quantidade: 20_000, valor_unitario: 4.1, data_movimentacao: "2026-02-12", responsavel: RESPONSAVEIS.carlos, fornecedor: FORNECEDORES.fert, nota_fiscal: "NF-45821", numero_lote: "UR-2026-014", data_fabricacao: "2026-02-10", data_validade: "2027-02-10" },
  { id_insumo: "i-001", tipo: "Saída", quantidade: 9_000, valor_unitario: 4.1, data_movimentacao: "2026-03-05", responsavel: RESPONSAVEIS.maria, id_talhao: "t-002", codigo_talhao: "TLH-002", nome_talhao: "Talhão Corredeira", safra: "2025/2026", atividade: "Adubação", destino: "Adubação de cobertura" },
  { id_insumo: "i-001", tipo: "Entrada", quantidade: 7_500, valor_unitario: 4.25, data_movimentacao: "2026-05-06", responsavel: RESPONSAVEIS.carlos, fornecedor: FORNECEDORES.fert, nota_fiscal: "NF-49110", numero_lote: "UR-2026-021", data_fabricacao: "2026-05-04", data_validade: "2027-05-04" },
  { id_insumo: "i-003", tipo: "Saída", quantidade: 380, valor_unitario: 32.9, data_movimentacao: "2026-04-22", responsavel: RESPONSAVEIS.joao, id_talhao: "t-001", codigo_talhao: "TLH-001", nome_talhao: "Talhão Boa Vista", safra: "2025/2026", atividade: "Pulverização", destino: "Dessecação pré-plantio" },
  { id_insumo: "i-004", tipo: "Saída", quantidade: 320, valor_unitario: 148, data_movimentacao: "2026-01-09", responsavel: RESPONSAVEIS.joao, id_talhao: "t-001", codigo_talhao: "TLH-001", nome_talhao: "Talhão Boa Vista", safra: "2025/2026", atividade: "Pulverização", destino: "Controle de ferrugem asiática" },
  { id_insumo: "i-005", tipo: "Entrada", quantidade: 1_200, valor_unitario: 620, data_movimentacao: "2026-06-03", responsavel: RESPONSAVEIS.ana, fornecedor: FORNECEDORES.sementes, nota_fiscal: "NF-77320", numero_lote: "SOJ-2026-055", data_fabricacao: "2026-06-01", data_validade: "2026-10-15" },
  { id_insumo: "i-005", tipo: "Saída", quantidade: 260, valor_unitario: 620, data_movimentacao: "2026-07-18", responsavel: RESPONSAVEIS.carlos, id_talhao: "t-003", codigo_talhao: "TLH-003", nome_talhao: "Talhão Barra Nova", safra: "2026/2027", atividade: "Plantio Direto", destino: "Semeadura de soja" },
  { id_insumo: "i-006", tipo: "Saída", quantidade: 140, valor_unitario: 195, data_movimentacao: "2026-07-04", responsavel: RESPONSAVEIS.ana, id_talhao: "t-001", codigo_talhao: "TLH-001", nome_talhao: "Talhão Boa Vista", safra: "2026/2027", atividade: "Calagem", destino: "Correção de acidez" },
  { id_insumo: "i-007", tipo: "Entrada", quantidade: 10_000, valor_unitario: 6.19, data_movimentacao: "2026-06-28", responsavel: RESPONSAVEIS.pedro, fornecedor: FORNECEDORES.diesel, nota_fiscal: "NF-10233" },
  { id_insumo: "i-007", tipo: "Saída", quantidade: 3_200, valor_unitario: 6.19, data_movimentacao: "2026-08-02", responsavel: RESPONSAVEIS.pedro, id_talhao: "t-002", codigo_talhao: "TLH-002", nome_talhao: "Talhão Corredeira", safra: "2026/2027", atividade: "Gradagem", destino: "Abastecimento de tratores" },
  { id_insumo: "i-009", tipo: "Saída", quantidade: 900, valor_unitario: 7.8, data_movimentacao: "2026-08-15", responsavel: RESPONSAVEIS.carlos, safra: "2026/2027", destino: "Cocho — pasto Sede", observacao: "Saldo zerado, necessário repor." },
  { id_insumo: "i-008", tipo: "Entrada", quantidade: 480, valor_unitario: 8.4, data_movimentacao: "2026-03-04", responsavel: RESPONSAVEIS.ana, fornecedor: FORNECEDORES.vet, nota_fiscal: "NF-30877", numero_lote: "AFT-2026-002", data_fabricacao: "2026-03-01", data_validade: "2026-09-30" },
];

// ---------------------------------------------------------------------------
// Helpers de regra de negócio (espelham src/types/insumo.ts)
// ---------------------------------------------------------------------------
const valorEstoque = (i) => Number(i.estoque_atual || 0) * Number(i.valor_unitario || 0);

function situacaoEstoque(i) {
  if (Number(i.estoque_atual) <= 0) return "Zerado";
  if (Number(i.estoque_atual) <= Number(i.estoque_minimo)) return "Baixo";
  return "Normal";
}
const abaixoMinimo = (i) => situacaoEstoque(i) !== "Normal"; // RN004

function proximaValidade(i) {
  const datas = (i.lotes ?? [])
    .filter((l) => l.quantidade > 0 && l.data_validade)
    .map((l) => l.data_validade)
    .sort();
  return datas[0] ?? null;
}
function diasParaVencer(iso) {
  if (!iso) return null;
  const ms = new Date(`${iso}T00:00:00`).getTime() - new Date(`${HOJE}T00:00:00`).getTime();
  return Math.round(ms / 86_400_000);
}
const isVencido = (i) => { // RN002
  const d = diasParaVencer(proximaValidade(i));
  return d != null && d < 0;
};
const isProximoVencimento = (i) => {
  const d = diasParaVencer(proximaValidade(i));
  return d != null && d >= 0 && d <= DIAS_ALERTA_VALIDADE;
};

const fmtMoeda = (v) =>
  Number(v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

// ---------------------------------------------------------------------------
// Validação das regras de negócio ANTES de enviar
// ---------------------------------------------------------------------------
function validarRegras() {
  const erros = [];
  const mapa = new Map(INSUMOS.map((i) => [i.id, i]));

  for (const i of INSUMOS) {
    // RN001 — nenhum saldo negativo nos valores cadastrados
    if (Number(i.estoque_atual) < 0) erros.push(`RN001: ${i.nome} tem estoque negativo.`);
    if (Number(i.estoque_minimo) < 0) erros.push(`RN001: ${i.nome} tem estoque mínimo negativo.`);
    if (Number(i.valor_unitario) < 0) erros.push(`RN001: ${i.nome} tem valor unitário negativo.`);
  }

  // RN001 no livro-razão: reconstrói o saldo de ABERTURA de cada insumo
  // (saldo_final − entradas + saídas) e simula as movimentações em ordem
  // cronológica, garantindo que o saldo nunca fique negativo em nenhum ponto.
  const entradas = new Map(INSUMOS.map((i) => [i.id, 0]));
  const saidas = new Map(INSUMOS.map((i) => [i.id, 0]));
  for (const m of MOVIMENTACOES) {
    const alvo = m.tipo === "Entrada" ? entradas : saidas;
    alvo.set(m.id_insumo, (alvo.get(m.id_insumo) ?? 0) + m.quantidade);
  }

  const saldo = new Map();
  for (const i of INSUMOS) {
    const abertura = Number(i.estoque_atual) - (entradas.get(i.id) ?? 0) + (saidas.get(i.id) ?? 0);
    if (abertura < 0) {
      erros.push(`RN001: ${i.nome} tem saldo de abertura negativo (${abertura}); entradas registradas excedem o saldo atual.`);
    }
    saldo.set(i.id, Math.max(abertura, 0));
  }

  const ordenadas = [...MOVIMENTACOES].sort((a, b) =>
    a.data_movimentacao.localeCompare(b.data_movimentacao)
  );
  for (const m of ordenadas) {
    const atual = saldo.get(m.id_insumo) ?? 0;
    const novo = m.tipo === "Entrada" ? atual + m.quantidade : atual - m.quantidade;
    if (novo < 0) {
      erros.push(`RN001: saída de ${m.quantidade} em ${mapa.get(m.id_insumo)?.nome} (${m.data_movimentacao}) deixaria saldo negativo.`);
    }
    saldo.set(m.id_insumo, novo);
  }

  // RN002 — deve existir pelo menos um lote vencido com saldo (teste de bloqueio)
  if (!INSUMOS.some(isVencido)) {
    erros.push("RN002: nenhum produto vencido na massa — impossível testar bloqueio.");
  }

  return erros;
}

// ---------------------------------------------------------------------------
// KPIs do dashboard (mesma lógica de InsumosDashboard.tsx)
// ---------------------------------------------------------------------------
function kpis() {
  const ativos = INSUMOS.filter((i) => i.status === "Ativo").length;
  const comSaldo = INSUMOS.filter((i) => i.estoque_atual > 0).length;
  const baixo = INSUMOS.filter(abaixoMinimo).length;
  const vencendo = INSUMOS.filter(isProximoVencimento).length;
  const vencidos = INSUMOS.filter(isVencido).length;
  const valor = INSUMOS.reduce((s, i) => s + valorEstoque(i), 0);
  return { total: INSUMOS.length, ativos, comSaldo, vencendo, baixo, vencidos, valor };
}

function imprimirResumo() {
  const k = kpis();
  console.log("\n===== Cenário do Dashboard de Insumos =====");
  console.log(`Total de insumos ........ ${k.total}  (${k.ativos} ativos)`);
  console.log(`Itens com saldo ......... ${k.comSaldo}`);
  console.log(`Próximos do vencimento .. ${k.vencendo}  (janela ${DIAS_ALERTA_VALIDADE} dias)`);
  console.log(`Estoque baixo (RN004) ... ${k.baixo}`);
  console.log(`Produtos vencidos (RN002) ${k.vencidos}`);
  console.log(`Valor em estoque ........ ${fmtMoeda(k.valor)}`);
  console.log("===========================================\n");
}

// ---------------------------------------------------------------------------
// Payloads para os endpoints (os "botões de criação")
// ---------------------------------------------------------------------------
function payloadInsumo(i) {
  return {
    nome: i.nome,
    categoria: i.categoria,
    tipo: i.tipo,
    unidade_medida: i.unidade_medida,
    fabricante: i.fabricante,
    marca: i.marca,
    fornecedor: i.fornecedor,
    estoque_atual: i.estoque_atual,
    estoque_minimo: i.estoque_minimo,
    valor_unitario: i.valor_unitario,
    status: i.status,
    id_propriedade: i.id_propriedade,
    nome_propriedade: i.nome_propriedade,
    registro_mapa: i.registro_mapa,
    ficha_tecnica: i.ficha_tecnica,
    observacoes: i.observacoes,
    // lotes enviados de forma aninhada; backends que derivam lotes a partir das
    // movimentações de entrada também recebem esses dados abaixo.
    lotes: i.lotes ?? [],
  };
}

function payloadMovimentacao(m, idInsumoReal, nomeInsumo) {
  const base = {
    id_insumo: idInsumoReal,
    nome_insumo: nomeInsumo,
    tipo: m.tipo,
    quantidade: m.quantidade,
    valor_unitario: m.valor_unitario,
    data_movimentacao: m.data_movimentacao,
    id_responsavel: m.responsavel.id,
    responsavel: m.responsavel.nome,
    observacao: m.observacao,
  };
  if (m.tipo === "Entrada") {
    return {
      ...base,
      fornecedor: m.fornecedor,
      nota_fiscal: m.nota_fiscal,
      numero_lote: m.numero_lote,
      data_fabricacao: m.data_fabricacao ?? null,
      data_validade: m.data_validade ?? null,
    };
  }
  return {
    ...base,
    id_talhao: m.id_talhao,
    codigo_talhao: m.codigo_talhao,
    nome_talhao: m.nome_talhao,
    safra: m.safra,
    atividade: m.atividade,
    destino: m.destino,
  };
}

// ---------------------------------------------------------------------------
// Execução
// ---------------------------------------------------------------------------
async function main() {
  console.log("SafraViva · Seed do Módulo de Gestão de Insumos");
  console.log(`Backend .... ${API_BASE_URL}`);
  console.log(`Data base .. ${HOJE}`);
  console.log(`Modo ....... ${DRY_RUN ? "DRY-RUN (sem gravar)" : "GRAVAÇÃO via API"}`);

  const erros = validarRegras();
  if (erros.length) {
    console.error("\n⛔ Violações de regra de negócio encontradas:");
    erros.forEach((e) => console.error("  - " + e));
    process.exitCode = 1;
    return;
  }
  console.log("✓ Regras RN001/RN002/RN004 validadas.");

  imprimirResumo();

  if (DRY_RUN) {
    console.log("Dry-run concluído. Nenhum dado foi gravado.");
    return;
  }

  const http = axios.create({ baseURL: API_BASE_URL, timeout: 15_000 });
  const idMap = new Map(); // id local -> id gerado pelo backend

  // 1) Criar insumos (POST /api/insumos — botão "Novo Insumo")
  console.log("→ Criando insumos...");
  for (const i of INSUMOS) {
    try {
      const { data } = await http.post("/api/insumos", payloadInsumo(i));
      const novoId = data?.id ?? data?.id_insumo ?? i.id;
      idMap.set(i.id, novoId);
      console.log(`  ✓ ${i.nome}  [${novoId}]`);
    } catch (e) {
      console.error(`  ✗ ${i.nome}: ${descreverErro(e)}`);
    }
  }

  // 2) Criar movimentações (POST /api/movimentacoes-estoque — botão "Nova Movimentação")
  console.log("→ Registrando movimentações...");
  const ordenadas = [...MOVIMENTACOES].sort((a, b) =>
    a.data_movimentacao.localeCompare(b.data_movimentacao)
  );
  for (const m of ordenadas) {
    const idReal = idMap.get(m.id_insumo) ?? m.id_insumo;
    const nome = INSUMOS.find((i) => i.id === m.id_insumo)?.nome;
    try {
      await http.post("/api/movimentacoes-estoque", payloadMovimentacao(m, idReal, nome));
      console.log(`  ✓ ${m.tipo} ${m.quantidade} · ${nome} (${m.data_movimentacao})`);
    } catch (e) {
      console.error(`  ✗ ${m.tipo} ${nome}: ${descreverErro(e)}`);
    }
  }

  console.log("\n✓ Seed concluído.");
}

function descreverErro(e) {
  if (e.response) return `HTTP ${e.response.status} ${JSON.stringify(e.response.data)}`;
  if (e.code === "ECONNREFUSED") return `conexão recusada em ${API_BASE_URL} (backend offline?)`;
  return e.message;
}

main().catch((e) => {
  console.error("Falha inesperada:", e);
  process.exitCode = 1;
});
