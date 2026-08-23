import { useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Tooltip,
  useMapEvents,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Corrige o ícone padrão do marcador (que quebra no Vite/Webpack por causa dos caminhos das imagens)
const iconePadrao = new L.Icon({
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

interface MapaPropriedadeProps {
  // Posição atual do marcador [latitude, longitude] ou null se ainda não escolhido
  posicao: [number, number] | null;
  // Callback disparado ao clicar no mapa, devolvendo lat e lng
  onSelecionar: (lat: number, lng: number) => void;
  // Texto exibido no tooltip do marcador (ex.: nome da propriedade/empresa)
  label?: string;
}

// Componente interno: escuta o clique no mapa e desenha o marcador
function SeletorDeLocal({ posicao, onSelecionar, label }: MapaPropriedadeProps) {
  useMapEvents({
    click(e) {
      onSelecionar(e.latlng.lat, e.latlng.lng);
    },
  });

  return posicao ? (
    <Marker position={posicao} icon={iconePadrao}>
      <Tooltip direction="top" offset={[0, -38]} permanent>
        <span className="font-semibold text-green-700">
          📍 {label || "Sede da propriedade"}
        </span>
      </Tooltip>
    </Marker>
  ) : null;
}

// Componente interno: recentraliza o mapa quando a posição muda (ex.: digitação manual)
function CentralizarMapa({ posicao }: { posicao: [number, number] | null }) {
  const map = useMap();

  useEffect(() => {
    if (posicao) {
      map.flyTo(posicao, 14, { duration: 1 });
    }
  }, [posicao, map]);

  return null;
}

export default function MapaPropriedade({
  posicao,
  onSelecionar,
  label,
}: MapaPropriedadeProps) {
  // Centro inicial: Mato Grosso, Brasil (ajuste se quiser outra região padrão)
  const centroInicial: [number, number] = posicao ?? [-12.6, -55.7];

  return (
    <MapContainer
      center={centroInicial}
      zoom={posicao ? 14 : 6}
      scrollWheelZoom={true}
      className="w-full h-full rounded-lg z-0"
    >
      {/* Camada de SATÉLITE gratuita da Esri (ótima para ver os talhões da fazenda) */}
      <TileLayer
        url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
        attribution="Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics"
        maxZoom={19}
      />

      <SeletorDeLocal
        posicao={posicao}
        onSelecionar={onSelecionar}
        label={label}
      />
      <CentralizarMapa posicao={posicao} />
    </MapContainer>
  );
}
