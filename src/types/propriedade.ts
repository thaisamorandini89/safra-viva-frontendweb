// Payload enviado ao backend para cadastrar uma propriedade
export interface NovaPropriedadePayload {
  nome_propriedade: string;
  id_empresa: number;
  car?: string;
  cep?: string;
  id_cidade?: number;
  logradouro?: string;
  latitude: number;
  longitude: number;
  area_total?: string;
  area_agricultavel?: string;
  area_preservacao?: string;
  id_tipo_solo?: number;
  id_classe_capacidade_uso?: number;
}

// Resposta do backend após cadastrar com sucesso
export interface PropriedadeCriadaResponse {
  id_propriedade: number;
  message: string;
  nome_propriedade: string;
}
