import axios from 'axios';
import { Estado, Cidade } from '../types/geo';
import { RegimeTributario } from '../types/regimeTributario';
import { TipoEmpresa } from '../types/tipoEmpresa';
import { EmpresaAgricola } from '../types/empresaAgricola';
import { TipoSolo } from '../types/tipoSolo';

// Deixe vazio para usar o proxy do Vite (localhost:5173 -> localhost:5000)
const api = axios.create({});

export const getEstados = () => api.get<Estado[]>('/api/estados');

export const getCidadesPorEstado = (idEstado: number) => 
  api.get<Cidade[]>(`/api/estados/${idEstado}/cidades`);

// As rotas exatas montadas pelos seus Blueprints do Flask
export const getRegimesTributarios = () => api.get<RegimeTributario[]>('/api/regimes-tributarios');
export const getTiposEmpresas = () => api.get<TipoEmpresa[]>('/api/tipos-empresa');

//export const salvarEmpresa = (dados: any) => api.post('/api/empresas', dados);
export const salvarEmpresa = (dados: any) => api.post('/api/empresas-agricolas', dados);

export const getEmpresasAgricolas = () => api.get<EmpresaAgricola[]>('/api/empresas-agricolas');

export const getTiposSolo = () => api.get<TipoSolo[]>('/api/tipos-solo');
