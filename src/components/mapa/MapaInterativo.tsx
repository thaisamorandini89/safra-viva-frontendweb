import { useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Polygon,
  Polyline,
  CircleMarker,
  Tooltip,
  useMap,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  Coordenada,
  StatusMapa,
  STATUS_MAPA_META,
  areaPoligonoHa,
  fmtHa,
} from "./georefStore";

export interface TalhaoGeo {
  id: string;
  nome: string;
  status: StatusMapa;
  poligono: Coordenada[];
  area: number;
}

interface Props {
  talhoes: TalhaoGeo[];
  selecionadoId: string | null;
  onSelecionar: (id: string) => void;
  desenhando: boolean;
  onConcluirDesenho: (poligono: Coordenada[]) => void;
  onCancelarDesenho: () => void;
  centro?: Coordenada | null;
}

const CENTRO_PADRAO: Coordenada = [-12.6, -55.7];

/** Captura cliques no mapa para adicionar vértices durante o desenho. */
function CapturaDesenho({
  ativo,
  onAdicionar,
}: {
  ativo: boolean;
  onAdicionar: (p: Coordenada) => void;
}) {
  useMapEvents({
    click(e) {
      if (ativo) onAdicionar([e.latlng.lat, e.latlng.lng]);
    },
  });
  return null;
}

/** Ajusta o enquadramento do mapa aos polígonos existentes. */
function AjustarEnquadramento({
  talhoes,
  centro,
}: {
  talhoes: TalhaoGeo[];
  centro?: Coordenada | null;
}) {
  const map = useMap();
  useEffect(() => {
    const todos = talhoes.flatMap((t) => t.poligono);
    if (todos.length >= 2) {
      map.fitBounds(L.latLngBounds(todos as L.LatLngExpression[]), { padding: [40, 40] });
    } else if (centro) {
      map.flyTo(centro, 13, { duration: 0.8 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [talhoes.length, centro?.[0], centro?.[1]]);
  return null;
}

export default function MapaInterativo({
  talhoes,
  selecionadoId,
  onSelecionar,
  desenhando,
  onConcluirDesenho,
  onCancelarDesenho,
  centro,
}: Props) {
  const [pontos, setPontos] = useState<Coordenada[]>([]);

  useEffect(() => {
    if (!desenhando) setPontos([]);
  }, [desenhando]);

  const concluir = () => {
    if (pontos.length >= 3) onConcluirDesenho(pontos);
  };

  const cancelar = () => {
    setPontos([]);
    onCancelarDesenho();
  };

  const centroInicial = talhoes[0]?.poligono[0] ?? centro ?? CENTRO_PADRAO;
  const areaPreview = areaPoligonoHa(pontos);

  return (
    <div className="relative h-full w-full">
      <MapContainer
        center={centroInicial}
        zoom={13}
        scrollWheelZoom
        doubleClickZoom={!desenhando}
        className={`h-full w-full rounded-lg z-0 ${desenhando ? "cursor-crosshair" : ""}`}
      >
        <TileLayer
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          attribution="Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics"
          maxZoom={19}
        />

        {/* Polígonos dos talhões georreferenciados */}
        {talhoes.map((t) => {
          const cor = STATUS_MAPA_META[t.status].cor;
          const selecionado = t.id === selecionadoId;
          return (
            <Polygon
              key={t.id}
              positions={t.poligono}
              pathOptions={{
                color: selecionado ? "#1e3a8a" : cor,
                weight: selecionado ? 4 : 2,
                fillColor: cor,
                fillOpacity: selecionado ? 0.55 : 0.4,
              }}
              eventHandlers={{ click: () => !desenhando && onSelecionar(t.id) }}
            >
              <Tooltip direction="center" permanent>
                <span className="text-[11px] font-semibold text-gray-800">
                  {t.nome}
                  <br />
                  {fmtHa(t.area)} ha
                </span>
              </Tooltip>
            </Polygon>
          );
        })}

        {/* Desenho em andamento */}
        {pontos.length > 0 && (
          <>
            <Polyline positions={[...pontos, ...(pontos.length >= 3 ? [pontos[0]] : [])]} pathOptions={{ color: "#1d4ed8", weight: 2, dashArray: "6 4" }} />
            {pontos.map((p, i) => (
              <CircleMarker key={i} center={p} radius={5} pathOptions={{ color: "#1d4ed8", fillColor: "#fff", fillOpacity: 1 }} />
            ))}
          </>
        )}

        <CapturaDesenho ativo={desenhando} onAdicionar={(p) => setPontos((atual) => [...atual, p])} />
        <AjustarEnquadramento talhoes={talhoes} centro={centro} />
      </MapContainer>

      {/* Barra de desenho */}
      {desenhando && (
        <div className="absolute left-1/2 top-3 z-[1000] -translate-x-1/2 rounded-lg bg-white/95 px-4 py-2 shadow-lg">
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-600">
              {pontos.length < 3
                ? `Clique no mapa para marcar os vértices (${pontos.length}/3 mín.)`
                : `${pontos.length} vértices · ${fmtHa(areaPreview)} ha`}
            </span>
            {pontos.length > 0 && (
              <button
                onClick={() => setPontos((p) => p.slice(0, -1))}
                className="rounded-md border border-gray-200 px-2 py-1 text-xs font-semibold text-gray-600 hover:bg-gray-50"
              >
                Desfazer
              </button>
            )}
            <button
              onClick={concluir}
              disabled={pontos.length < 3}
              className="rounded-md bg-green-700 px-3 py-1 text-xs font-semibold text-white hover:bg-green-800 disabled:opacity-50"
            >
              Concluir
            </button>
            <button onClick={cancelar} className="rounded-md border border-gray-200 px-2 py-1 text-xs font-semibold text-gray-600 hover:bg-gray-50">
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Legenda */}
      <div className="absolute bottom-3 left-3 z-[1000] rounded-lg bg-white/95 px-3 py-2 shadow">
        <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-gray-500">Status do talhão</p>
        <ul className="space-y-0.5">
          {Object.values(STATUS_MAPA_META).map((m) => (
            <li key={m.label} className="flex items-center gap-1.5 text-xs text-gray-600">
              <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: m.cor }} />
              {m.label}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
