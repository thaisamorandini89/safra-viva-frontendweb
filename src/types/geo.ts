/**
 * Tipos relacionados à localização (Estados e Cidades)
 * Utilizados para garantir a consistência dos dados recebidos da API.
 */

export interface Estado {
  /** ID do IBGE para o estado */
  id: number;
  /** Sigla do estado (Ex: SP, MG) */
  uf: string;
  /** Nome completo do estado */
  nome: string;
}

export interface Cidade {
  /** ID do IBGE para o município */
  id: number;
  /** Nome completo do município */
  nome: string;
  /** ID do estado ao qual esta cidade pertence */
  id_estado: number;
}