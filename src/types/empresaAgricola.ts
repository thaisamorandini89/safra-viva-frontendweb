// ---------------------------------------------------------------------------
// Módulo de Empresas Agrícolas — tipos de domínio
// ---------------------------------------------------------------------------

export interface EmpresaAgricola {
    id_empresa: number;
    razao_social: string;
    nome_fantasia?: string;
    cnpj: string;
    inscricao_estadual?: string | null;
    inscricao_municipal?: string | null;
    telefone?: string | null;
    email?: string | null;
    website?: string | null;
    id_regime_tributario?: number;
    regime_tributario_descricao?: string;
    id_tipo_empresa?: number;
    tipo_empresa_descricao?: string;
    data_fundacao?: string | null;
    data_cadastro?: string;
    status?: boolean;
    endereco?: string | null;
}

// ---------------------------------------------------------------------------
// Helpers de formatação
// ---------------------------------------------------------------------------

/** Formata um CNPJ (com ou sem pontuação) no padrão 00.000.000/0001-00 */
export const fmtCNPJ = (cnpj?: string | null): string => {
  const d = String(cnpj ?? "").replace(/\D/g, "");
  if (d.length !== 14) return cnpj ?? "—";
  return d.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5");
};

/** Formata um telefone brasileiro (10 ou 11 dígitos) */
export const fmtTelefone = (tel?: string | null): string => {
  const d = String(tel ?? "").replace(/\D/g, "");
  if (d.length === 11) return d.replace(/^(\d{2})(\d{5})(\d{4})$/, "($1) $2-$3");
  if (d.length === 10) return d.replace(/^(\d{2})(\d{4})(\d{4})$/, "($1) $2-$3");
  return tel || "—";
};

/** Converte "2026-09-04 00:06:39" ou ISO em data pt-BR */
export const fmtDataBR = (valor?: string | null): string => {
  if (!valor) return "—";
  const iso = valor.includes("T") ? valor : valor.replace(" ", "T");
  const data = new Date(iso);
  return isNaN(data.getTime()) ? "—" : data.toLocaleDateString("pt-BR");
};

/** Empresa considerada ativa */
export const isEmpresaAtiva = (e: EmpresaAgricola) => e.status !== false;