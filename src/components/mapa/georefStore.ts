import { StatusTalhao } from "../../types/talhao";

// ---------------------------------------------------------------------------
// Georreferenciamento — tipos, utilitários e persistência local.
// As geometrias (polígonos) dos talhões e os planejamentos de safra são
// mantidos no localStorage enquanto não há backend geoespacial (GIS).
// ---------------------------------------------------------------------------

export type Coordenada = [number, number]; // [lat, lng]

export type StatusMapa = "Livre" | "Preparado" | "Plantado" | "Colhido";

export const STATUS_MAPA: StatusMapa[] = ["Livre", "Preparado", "Plantado", "Colhido"];

export const STATUS_MAPA_META: Record<StatusMapa, { cor: string; label: string }> = {
  Livre: { cor: "#9ca3af", label: "Livre / Vazio" },
  Preparado: { cor: "#f59e0b", label: "Preparado" },
  Plantado: { cor: "#16a34a", label: "Plantado" },
  Colhido: { cor: "#f97316", label: "Colhido" },
};

/** Converte o status do cadastro de talhões para o status simplificado do mapa. */
export function statusDoTalhao(status?: StatusTalhao): StatusMapa {
  switch (status) {
    case "Planejado":
    case "Preparado":
      return "Preparado";
    case "Plantado":
    case "Em Desenvolvimento":
      return "Plantado";
    case "Colheita":
    case "Finalizado":
      return "Colhido";
    default:
      return "Livre";
  }
}

/** Talhão criado diretamente no mapa (não vinculado ao cadastro via API). */
export interface TalhaoMapa {
  id: string;
  nome: string;
  idPropriedade: string;
  status: StatusMapa;
  poligono: Coordenada[];
}

/** Mapeamento Safra × Talhão (planejamento de plantio). */
export interface Plantio {
  id: string;
  idTalhao: string;
  idSafra: string;
  nomeSafra: string;
  cultura: string;
  areaPlantada: number;
}

export interface GeorefEstado {
  /** Geometria dos talhões vindos do cadastro (id do talhão -> polígono). */
  geometrias: Record<string, Coordenada[]>;
  /** Status operacional no mapa (id do talhão -> status). */
  status: Record<string, StatusMapa>;
  /** Talhões desenhados diretamente no mapa. */
  talhoesMapa: TalhaoMapa[];
  /** Planejamentos de safra. */
  plantios: Plantio[];
}

export const ESTADO_GEOREF_PADRAO: GeorefEstado = {
  geometrias: {},
  status: {},
  talhoesMapa: [],
  plantios: [],
};

// --------------------------------------------------------- cálculo de área
/**
 * Área geodésica de um polígono em hectares (fórmula esférica — equivalente à
 * L.GeometryUtil.geodesicArea do leaflet-draw).
 */
export function areaPoligonoHa(coords: Coordenada[]): number {
  if (!coords || coords.length < 3) return 0;
  const R = 6378137; // raio da Terra em metros
  const rad = (g: number) => (g * Math.PI) / 180;
  let area = 0;
  for (let i = 0; i < coords.length; i++) {
    const [lat1, lng1] = coords[i];
    const [lat2, lng2] = coords[(i + 1) % coords.length];
    area += rad(lng2 - lng1) * (2 + Math.sin(rad(lat1)) + Math.sin(rad(lat2)));
  }
  area = Math.abs((area * R * R) / 2);
  return area / 10000; // m² -> ha
}

/** Centro aproximado (centroide simples) de um polígono. */
export function centroPoligono(coords: Coordenada[]): Coordenada | null {
  if (!coords.length) return null;
  const soma = coords.reduce<[number, number]>(
    (acc, [lat, lng]) => [acc[0] + lat, acc[1] + lng],
    [0, 0]
  );
  return [soma[0] / coords.length, soma[1] / coords.length];
}

export const fmtHa = (v: number, casas = 2) =>
  Number(v || 0).toLocaleString("pt-BR", {
    minimumFractionDigits: casas,
    maximumFractionDigits: casas,
  });

// --------------------------------------------------------- importação GeoJSON
/** Extrai polígonos (anéis externos) de um GeoJSON em coordenadas [lat, lng]. */
export function poligonosDeGeoJSON(geojson: unknown): { nome?: string; poligono: Coordenada[] }[] {
  const resultado: { nome?: string; poligono: Coordenada[] }[] = [];

  const paraLatLng = (anel: number[][]): Coordenada[] =>
    anel
      .filter((p) => Array.isArray(p) && p.length >= 2)
      .map(([lng, lat]) => [lat, lng] as Coordenada);

  const processarGeometria = (geom: any, nome?: string) => {
    if (!geom) return;
    if (geom.type === "Polygon" && Array.isArray(geom.coordinates?.[0])) {
      resultado.push({ nome, poligono: paraLatLng(geom.coordinates[0]) });
    } else if (geom.type === "MultiPolygon" && Array.isArray(geom.coordinates)) {
      geom.coordinates.forEach((poly: number[][][]) => {
        if (Array.isArray(poly?.[0])) resultado.push({ nome, poligono: paraLatLng(poly[0]) });
      });
    }
  };

  const obj = geojson as any;
  if (obj?.type === "FeatureCollection" && Array.isArray(obj.features)) {
    obj.features.forEach((f: any) =>
      processarGeometria(f.geometry, f.properties?.nome ?? f.properties?.name)
    );
  } else if (obj?.type === "Feature") {
    processarGeometria(obj.geometry, obj.properties?.nome ?? obj.properties?.name);
  } else if (obj?.type) {
    processarGeometria(obj);
  }

  return resultado.filter((r) => r.poligono.length >= 3);
}

// --------------------------------------------------------------- persistência
const STORAGE_KEY = "safraviva:georef:v1";

export function carregarGeoref(): GeorefEstado {
  try {
    if (typeof localStorage === "undefined") return ESTADO_GEOREF_PADRAO;
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return ESTADO_GEOREF_PADRAO;
    const salvo = JSON.parse(raw) as Partial<GeorefEstado>;
    return {
      geometrias: salvo.geometrias ?? {},
      status: salvo.status ?? {},
      talhoesMapa: salvo.talhoesMapa ?? [],
      plantios: salvo.plantios ?? [],
    };
  } catch {
    return ESTADO_GEOREF_PADRAO;
  }
}

export function salvarGeoref(estado: GeorefEstado): void {
  try {
    if (typeof localStorage === "undefined") return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(estado));
  } catch {
    /* ignora falhas de persistência */
  }
}

export const uid = () => Math.random().toString(36).slice(2, 10);
