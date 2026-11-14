import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getTalhoes, getPropriedadesLista, getSafras } from "../../services/api";
import { Talhao } from "../../types/talhao";
import { Safra } from "../../types/financeiro";
import TopBar from "../layout/TopBar";
import PageHeader from "../ui/PageHeader";
import StatCard from "../ui/StatCard";
import Field from "../ui/Field";
import Input from "../ui/Input";
import Select from "../ui/Select";
import Toast, { DadosToast } from "../ui/Toast";
import ConfirmDialog from "../ui/ConfirmDialog";
import MapaInterativo, { TalhaoGeo } from "./MapaInterativo";
import {
  Coordenada,
  GeorefEstado,
  Plantio,
  StatusMapa,
  STATUS_MAPA,
  STATUS_MAPA_META,
  TalhaoMapa,
  areaPoligonoHa,
  carregarGeoref,
  centroPoligono,
  fmtHa,
  poligonosDeGeoJSON,
  salvarGeoref,
  statusDoTalhao,
  uid,
} from "./georefStore";

const idStr = (v: unknown) => String(v ?? "");

interface TalhaoUnificado {
  id: string;
  nome: string;
  idPropriedade: string;
  nomeProp?: string;
  status: StatusMapa;
  poligono: Coordenada[] | null;
  area: number;
  origem: "cadastro" | "mapa";
  latlng?: Coordenada | null;
}

type Aba = "talhoes" | "safra";
type DesenhoAlvo =
  | { modo: "cadastro" | "mapa"; id: string }
  | { modo: "novo"; nome: string; idPropriedade: string }
  | null;

export default function MapaModule() {
  const [estado, setEstado] = useState<GeorefEstado>(() => carregarGeoref());
  const [toast, setToast] = useState<DadosToast | null>(null);
  const [aba, setAba] = useState<Aba>("talhoes");
  const [filtroProp, setFiltroProp] = useState("");
  const [filtroSafra, setFiltroSafra] = useState("");
  const [selecionadoId, setSelecionadoId] = useState<string | null>(null);
  const [desenhoAlvo, setDesenhoAlvo] = useState<DesenhoAlvo>(null);
  const [excluindo, setExcluindo] = useState<TalhaoUnificado | null>(null);
  const inputArquivo = useRef<HTMLInputElement>(null);

  // novo talhão
  const [novoNome, setNovoNome] = useState("");
  const [novoProp, setNovoProp] = useState("");

  // plantio
  const [planTalhao, setPlanTalhao] = useState("");
  const [planSafra, setPlanSafra] = useState("");
  const [planCultura, setPlanCultura] = useState("");
  const [planArea, setPlanArea] = useState("");
  const [erroPlan, setErroPlan] = useState("");

  useEffect(() => salvarGeoref(estado), [estado]);

  const notificar = (dados: DadosToast) => setToast(dados);

  const talhoesQuery = useQuery<Talhao[]>({ queryKey: ["talhoes"], queryFn: getTalhoes });
  const propriedadesQuery = useQuery<any[]>({ queryKey: ["propriedades"], queryFn: getPropriedadesLista });
  const safrasQuery = useQuery<Safra[]>({ queryKey: ["financeiro-safras"], queryFn: () => getSafras() });

  const talhoes = talhoesQuery.data ?? [];
  const propriedades = propriedadesQuery.data ?? [];
  const safras = safrasQuery.data ?? [];

  const propriedadeOpcoes = useMemo(() => {
    const mapa = new Map<string, string>();
    propriedades.forEach((p) => mapa.set(idStr(p.id_propriedade), p.nome_propriedade || `Propriedade ${p.id_propriedade}`));
    talhoes.forEach((t) => {
      const k = idStr(t.id_propriedade);
      if (!mapa.has(k)) mapa.set(k, t.nome_propriedade || `Propriedade ${k}`);
    });
    estado.talhoesMapa.forEach((t) => {
      if (!mapa.has(t.idPropriedade)) mapa.set(t.idPropriedade, `Propriedade ${t.idPropriedade}`);
    });
    return [...mapa.entries()].map(([value, label]) => ({ value, label }));
  }, [propriedades, talhoes, estado.talhoesMapa]);

  const nomeProp = (id: string) => propriedadeOpcoes.find((p) => p.value === id)?.label ?? id;

  // ----------------------------------------------- lista unificada de talhões
  const unificados = useMemo<TalhaoUnificado[]>(() => {
    const doCadastro: TalhaoUnificado[] = talhoes.map((t) => {
      const poligono = estado.geometrias[t.id] ?? null;
      const area = poligono ? areaPoligonoHa(poligono) : Number(t.area_total || 0);
      const latlng: Coordenada | null =
        t.latitude != null && t.longitude != null ? [Number(t.latitude), Number(t.longitude)] : null;
      return {
        id: t.id,
        nome: t.nome,
        idPropriedade: idStr(t.id_propriedade),
        nomeProp: t.nome_propriedade,
        status: estado.status[t.id] ?? statusDoTalhao(t.status),
        poligono,
        area,
        origem: "cadastro",
        latlng,
      };
    });
    const doMapa: TalhaoUnificado[] = estado.talhoesMapa.map((t) => ({
      id: t.id,
      nome: t.nome,
      idPropriedade: t.idPropriedade,
      nomeProp: nomeProp(t.idPropriedade),
      status: t.status,
      poligono: t.poligono,
      area: areaPoligonoHa(t.poligono),
      origem: "mapa",
      latlng: centroPoligono(t.poligono),
    }));
    return [...doCadastro, ...doMapa];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [talhoes, estado]);

  const filtrados = useMemo(
    () => unificados.filter((t) => !filtroProp || t.idPropriedade === filtroProp),
    [unificados, filtroProp]
  );

  const comPoligono = useMemo<TalhaoGeo[]>(
    () =>
      filtrados
        .filter((t) => t.poligono && t.poligono.length >= 3)
        .map((t) => ({ id: t.id, nome: t.nome, status: t.status, poligono: t.poligono!, area: t.area })),
    [filtrados]
  );

  const centroMapa = useMemo<Coordenada | null>(() => {
    const comGeo = filtrados.find((t) => t.poligono && t.poligono.length >= 3);
    if (comGeo?.poligono) return centroPoligono(comGeo.poligono);
    const comCoord = filtrados.find((t) => t.latlng);
    return comCoord?.latlng ?? null;
  }, [filtrados]);

  // ----------------------------------------------------------------- plantios
  const plantiosSafra = useMemo(
    () =>
      estado.plantios.filter(
        (p) => (!filtroSafra || p.idSafra === filtroSafra) && filtrados.some((t) => t.id === p.idTalhao)
      ),
    [estado.plantios, filtroSafra, filtrados]
  );

  const areaPlantadaTalhaoSafra = (idTalhao: string, idSafra: string, exceto?: string) =>
    estado.plantios
      .filter((p) => p.idTalhao === idTalhao && p.idSafra === idSafra && p.id !== exceto)
      .reduce((s, p) => s + Number(p.areaPlantada || 0), 0);

  // -------------------------------------------------------------------- KPIs
  const kpis = useMemo(() => {
    const areaTotal = filtrados.reduce((s, t) => s + t.area, 0);
    const georref = filtrados.filter((t) => t.poligono && t.poligono.length >= 3).length;
    const plantada = plantiosSafra.reduce((s, p) => s + Number(p.areaPlantada || 0), 0);
    const propriedadesScope = new Set(filtrados.map((t) => t.idPropriedade)).size;
    return {
      propriedades: propriedadesScope,
      talhoes: filtrados.length,
      georref,
      areaTotal,
      plantada,
      livre: Math.max(0, areaTotal - plantada),
    };
  }, [filtrados, plantiosSafra]);

  // --------------------------------------------------------------- ações mapa
  const concluirDesenho = (poligono: Coordenada[]) => {
    const alvo = desenhoAlvo;
    if (!alvo) return;
    if (alvo.modo === "novo") {
      const novo: TalhaoMapa = {
        id: uid(),
        nome: alvo.nome,
        idPropriedade: alvo.idPropriedade,
        status: "Livre",
        poligono,
      };
      setEstado((e) => ({ ...e, talhoesMapa: [...e.talhoesMapa, novo] }));
      setSelecionadoId(novo.id);
      setNovoNome("");
      notificar({ tipo: "sucesso", titulo: "Talhão criado no mapa", descricao: `${novo.nome} · ${fmtHa(areaPoligonoHa(poligono))} ha` });
    } else if (alvo.modo === "mapa") {
      setEstado((e) => ({
        ...e,
        talhoesMapa: e.talhoesMapa.map((t) => (t.id === alvo.id ? { ...t, poligono } : t)),
      }));
      notificar({ tipo: "sucesso", titulo: "Polígono atualizado", descricao: `Área: ${fmtHa(areaPoligonoHa(poligono))} ha` });
    } else {
      setEstado((e) => ({ ...e, geometrias: { ...e.geometrias, [alvo.id]: poligono } }));
      notificar({ tipo: "sucesso", titulo: "Talhão georreferenciado", descricao: `Área: ${fmtHa(areaPoligonoHa(poligono))} ha` });
    }
    setDesenhoAlvo(null);
  };

  const iniciarDesenhoCadastro = (t: TalhaoUnificado) => {
    setSelecionadoId(t.id);
    setDesenhoAlvo({ modo: t.origem === "mapa" ? "mapa" : "cadastro", id: t.id });
  };

  const iniciarNovoTalhao = () => {
    const prop = novoProp || filtroProp || propriedadeOpcoes[0]?.value || "";
    if (!novoNome.trim() || !prop) {
      notificar({ tipo: "erro", titulo: "Dados incompletos", descricao: "Informe o nome e a propriedade do novo talhão." });
      return;
    }
    setDesenhoAlvo({ modo: "novo", nome: novoNome.trim(), idPropriedade: prop });
  };

  const alterarStatus = (t: TalhaoUnificado, status: StatusMapa) => {
    if (t.origem === "mapa") {
      setEstado((e) => ({ ...e, talhoesMapa: e.talhoesMapa.map((x) => (x.id === t.id ? { ...x, status } : x)) }));
    } else {
      setEstado((e) => ({ ...e, status: { ...e.status, [t.id]: status } }));
    }
  };

  const removerGeorreferenciamento = (t: TalhaoUnificado) => {
    if (t.origem === "mapa") {
      setExcluindo(t);
    } else {
      setEstado((e) => {
        const g = { ...e.geometrias };
        delete g[t.id];
        return { ...e, geometrias: g };
      });
      notificar({ tipo: "sucesso", titulo: "Georreferenciamento removido", descricao: t.nome });
    }
  };

  const confirmarExclusao = () => {
    if (!excluindo) return;
    setEstado((e) => ({
      ...e,
      talhoesMapa: e.talhoesMapa.filter((t) => t.id !== excluindo.id),
      plantios: e.plantios.filter((p) => p.idTalhao !== excluindo.id),
    }));
    notificar({ tipo: "sucesso", titulo: "Talhão removido", descricao: excluindo.nome });
    if (selecionadoId === excluindo.id) setSelecionadoId(null);
    setExcluindo(null);
  };

  const importarGeoJSON = (arquivo?: File | null) => {
    if (!arquivo) return;
    const leitor = new FileReader();
    leitor.onload = () => {
      try {
        const json = JSON.parse(String(leitor.result));
        const poligonos = poligonosDeGeoJSON(json);
        if (!poligonos.length) {
          notificar({ tipo: "erro", titulo: "Nenhum polígono encontrado", descricao: "Verifique se o arquivo contém geometrias do tipo Polygon." });
          return;
        }
        const prop = filtroProp || propriedadeOpcoes[0]?.value || "0";
        const novos: TalhaoMapa[] = poligonos.map((p, i) => ({
          id: uid(),
          nome: p.nome || `Talhão importado ${estado.talhoesMapa.length + i + 1}`,
          idPropriedade: prop,
          status: "Livre",
          poligono: p.poligono,
        }));
        setEstado((e) => ({ ...e, talhoesMapa: [...e.talhoesMapa, ...novos] }));
        notificar({ tipo: "sucesso", titulo: "GeoJSON importado", descricao: `${novos.length} talhão(ões) adicionado(s).` });
      } catch {
        notificar({ tipo: "erro", titulo: "Arquivo inválido", descricao: "Não foi possível ler o GeoJSON." });
      }
    };
    leitor.readAsText(arquivo);
    if (inputArquivo.current) inputArquivo.current.value = "";
  };

  // ------------------------------------------------------------- planejamento
  const adicionarPlantio = () => {
    setErroPlan("");
    if (!planTalhao || !planSafra || !planCultura.trim() || !planArea) {
      setErroPlan("Preencha talhão, safra, cultura e área.");
      return;
    }
    const area = Number(planArea.replace(",", "."));
    if (!(area > 0)) {
      setErroPlan("Informe uma área válida.");
      return;
    }
    const talhao = unificados.find((t) => t.id === planTalhao);
    if (!talhao) return;
    const jaPlantado = areaPlantadaTalhaoSafra(planTalhao, planSafra);
    const disponivel = talhao.area - jaPlantado;
    if (area > disponivel + 0.0001) {
      setErroPlan(
        `Área excede o disponível do talhão. Disponível: ${fmtHa(Math.max(0, disponivel))} ha (talhão: ${fmtHa(talhao.area)} ha).`
      );
      return;
    }
    const safra = safras.find((s) => idStr(s.id_safra) === planSafra);
    const plantio: Plantio = {
      id: uid(),
      idTalhao: planTalhao,
      idSafra: planSafra,
      nomeSafra: safra?.nome ?? planSafra,
      cultura: planCultura.trim(),
      areaPlantada: area,
    };
    setEstado((e) => ({ ...e, plantios: [...e.plantios, plantio] }));
    // ao planejar o plantio, o talhão passa a "Plantado"
    alterarStatus(talhao, "Plantado");
    notificar({ tipo: "sucesso", titulo: "Plantio planejado", descricao: `${talhao.nome} · ${plantio.cultura}` });
    setPlanArea("");
  };

  const removerPlantio = (id: string) => {
    setEstado((e) => ({ ...e, plantios: e.plantios.filter((p) => p.id !== id) }));
  };

  const nomeTalhao = (id: string) => unificados.find((t) => t.id === id)?.nome ?? id;

  const carregando = talhoesQuery.isLoading;

  return (
    <div className="flex-1 overflow-auto bg-gray-50">
      {toast && <Toast {...toast} onFechar={() => setToast(null)} />}
      <TopBar breadcrumb="Gestão Agrícola" page="Mapa" />

      <main className="px-5 py-6 lg:px-8">
        <div className="mx-auto w-full max-w-[1500px] space-y-5">
          <PageHeader
            title="Georreferenciamento"
            description="Delimite os talhões no mapa, calcule a área real (ha) e planeje as safras por talhão."
          />

          {/* Filtros */}
          <section className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Field label="Propriedade">
                <Select
                  value={filtroProp}
                  onChange={(e) => setFiltroProp(e.target.value)}
                  placeholder="Todas"
                  options={propriedadeOpcoes}
                  getOptionValue={(o) => o.value}
                  getOptionLabel={(o) => o.label}
                />
              </Field>
              <Field label="Safra (planejamento)">
                <Select
                  value={filtroSafra}
                  onChange={(e) => setFiltroSafra(e.target.value)}
                  placeholder="Todas"
                  options={safras}
                  getOptionValue={(s) => idStr(s.id_safra)}
                  getOptionLabel={(s) => `${s.nome}${s.cultura ? ` · ${s.cultura}` : ""}`}
                />
              </Field>
              <div className="flex items-end">
                <button
                  onClick={() => inputArquivo.current?.click()}
                  className="w-full rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50"
                >
                  📥 Importar GeoJSON
                </button>
                <input ref={inputArquivo} type="file" accept=".geojson,.json,application/geo+json" className="hidden" onChange={(e) => importarGeoJSON(e.target.files?.[0])} />
              </div>
            </div>
          </section>

          {/* KPIs */}
          <section className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
            <StatCard icone="🌿" titulo="Propriedades" valor={String(kpis.propriedades)} descricao="no escopo filtrado" tom="green" />
            <StatCard icone="🗂️" titulo="Talhões" valor={String(kpis.talhoes)} descricao={`${kpis.georref} georreferenciados`} tom="lime" />
            <StatCard icone="📐" titulo="Área total" valor={fmtHa(kpis.areaTotal, 0)} sufixo="ha" descricao="dos talhões" tom="sky" />
            <StatCard icone="🌱" titulo="Área plantada" valor={fmtHa(kpis.plantada, 0)} sufixo="ha" descricao={filtroSafra ? "na safra" : "todas as safras"} tom="orange" />
            <StatCard icone="⬜" titulo="Área livre" valor={fmtHa(kpis.livre, 0)} sufixo="ha" descricao="disponível" tom="slate" />
          </section>

          {carregando ? (
            <div className="flex flex-col items-center justify-center py-24 text-gray-400">
              <span className="mb-3 h-8 w-8 animate-spin rounded-full border-2 border-green-600 border-t-transparent" />
              <p className="text-sm">Carregando mapa...</p>
            </div>
          ) : (
            <div className="grid gap-4 lg:grid-cols-[1fr_380px]">
              {/* Mapa */}
              <div className="h-[620px] overflow-hidden rounded-xl border border-gray-200 shadow-sm">
                <MapaInterativo
                  talhoes={comPoligono}
                  selecionadoId={selecionadoId}
                  onSelecionar={setSelecionadoId}
                  desenhando={desenhoAlvo != null}
                  onConcluirDesenho={concluirDesenho}
                  onCancelarDesenho={() => setDesenhoAlvo(null)}
                  centro={centroMapa}
                />
              </div>

              {/* Painel lateral */}
              <div className="flex max-h-[620px] flex-col rounded-xl border border-gray-100 bg-white shadow-sm">
                <div className="flex border-b border-gray-100">
                  <button
                    onClick={() => setAba("talhoes")}
                    className={`flex-1 px-4 py-3 text-sm font-semibold ${aba === "talhoes" ? "border-b-2 border-green-600 text-green-700" : "text-gray-400 hover:text-gray-600"}`}
                  >
                    🗂️ Talhões
                  </button>
                  <button
                    onClick={() => setAba("safra")}
                    className={`flex-1 px-4 py-3 text-sm font-semibold ${aba === "safra" ? "border-b-2 border-green-600 text-green-700" : "text-gray-400 hover:text-gray-600"}`}
                  >
                    🌱 Planejar safra
                  </button>
                </div>

                <div className="min-h-0 flex-1 overflow-auto p-4">
                  {aba === "talhoes" ? (
                    <div className="space-y-4">
                      {/* Novo talhão */}
                      <div className="rounded-lg border border-gray-100 p-3">
                        <p className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-500">Novo talhão no mapa</p>
                        <div className="space-y-2">
                          <Input placeholder="Nome do talhão" value={novoNome} onChange={(e) => setNovoNome(e.target.value)} />
                          <Select
                            value={novoProp || filtroProp}
                            onChange={(e) => setNovoProp(e.target.value)}
                            placeholder="Selecione a propriedade"
                            options={propriedadeOpcoes}
                            getOptionValue={(o) => o.value}
                            getOptionLabel={(o) => o.label}
                          />
                          <button
                            onClick={iniciarNovoTalhao}
                            disabled={desenhoAlvo != null}
                            className="w-full rounded-lg bg-green-700 px-3 py-2 text-sm font-semibold text-white hover:bg-green-800 disabled:opacity-50"
                          >
                            ✏️ Desenhar no mapa
                          </button>
                        </div>
                      </div>

                      {/* Lista de talhões */}
                      {filtrados.length === 0 && <p className="text-sm text-gray-400">Nenhum talhão no escopo.</p>}
                      {filtrados.map((t) => {
                        const temGeo = t.poligono && t.poligono.length >= 3;
                        return (
                          <div
                            key={t.id}
                            className={`rounded-lg border p-3 transition ${selecionadoId === t.id ? "border-green-300 bg-green-50" : "border-gray-100"}`}
                            onClick={() => setSelecionadoId(t.id)}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <p className="flex items-center gap-1.5 text-sm font-semibold text-gray-700">
                                  <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: STATUS_MAPA_META[t.status].cor }} />
                                  {t.nome}
                                </p>
                                <p className="text-xs text-gray-400">
                                  {t.nomeProp || nomeProp(t.idPropriedade)} ·{" "}
                                  {temGeo ? `${fmtHa(t.area)} ha` : "sem polígono"}
                                  {t.origem === "mapa" && " · mapa"}
                                </p>
                              </div>
                              <span className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${temGeo ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"}`}>
                                {temGeo ? "georref." : "pendente"}
                              </span>
                            </div>
                            <div className="mt-2 flex flex-wrap items-center gap-1.5">
                              <select
                                value={t.status}
                                onChange={(e) => alterarStatus(t, e.target.value as StatusMapa)}
                                onClick={(e) => e.stopPropagation()}
                                className="rounded-md border border-gray-200 px-2 py-1 text-xs text-gray-600"
                              >
                                {STATUS_MAPA.map((s) => (
                                  <option key={s} value={s}>{STATUS_MAPA_META[s].label}</option>
                                ))}
                              </select>
                              <button
                                onClick={(e) => { e.stopPropagation(); iniciarDesenhoCadastro(t); }}
                                disabled={desenhoAlvo != null}
                                className="rounded-md border border-green-200 px-2 py-1 text-xs font-semibold text-green-700 hover:bg-green-50 disabled:opacity-50"
                              >
                                {temGeo ? "Redesenhar" : "Desenhar"}
                              </button>
                              {temGeo && (
                                <button
                                  onClick={(e) => { e.stopPropagation(); removerGeorreferenciamento(t); }}
                                  className="rounded-md border border-gray-200 px-2 py-1 text-xs font-semibold text-gray-500 hover:bg-gray-50"
                                >
                                  {t.origem === "mapa" ? "Excluir" : "Limpar"}
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Formulário de plantio */}
                      <div className="rounded-lg border border-gray-100 p-3">
                        <p className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-500">Planejar plantio</p>
                        <div className="space-y-2">
                          <Select
                            value={planTalhao}
                            onChange={(e) => setPlanTalhao(e.target.value)}
                            placeholder="Selecione o talhão"
                            options={filtrados}
                            getOptionValue={(t) => t.id}
                            getOptionLabel={(t) => `${t.nome} (${fmtHa(t.area)} ha)`}
                          />
                          <Select
                            value={planSafra}
                            onChange={(e) => {
                              setPlanSafra(e.target.value);
                              const s = safras.find((x) => idStr(x.id_safra) === e.target.value);
                              if (s?.cultura && !planCultura) setPlanCultura(s.cultura);
                            }}
                            placeholder="Selecione a safra"
                            options={safras}
                            getOptionValue={(s) => idStr(s.id_safra)}
                            getOptionLabel={(s) => s.nome}
                          />
                          <Input placeholder="Cultura (ex.: Soja)" value={planCultura} onChange={(e) => setPlanCultura(e.target.value)} />
                          <Input type="number" placeholder="Área plantada (ha)" value={planArea} onChange={(e) => setPlanArea(e.target.value)} />
                          {planTalhao && planSafra && (
                            <p className="text-xs text-gray-400">
                              Disponível:{" "}
                              {fmtHa(
                                Math.max(
                                  0,
                                  (unificados.find((t) => t.id === planTalhao)?.area ?? 0) -
                                    areaPlantadaTalhaoSafra(planTalhao, planSafra)
                                )
                              )}{" "}
                              ha
                            </p>
                          )}
                          {erroPlan && <p className="text-xs font-semibold text-red-600">{erroPlan}</p>}
                          <button onClick={adicionarPlantio} className="w-full rounded-lg bg-green-700 px-3 py-2 text-sm font-semibold text-white hover:bg-green-800">
                            Adicionar plantio
                          </button>
                        </div>
                      </div>

                      {/* Lista de plantios */}
                      <div>
                        <p className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-500">
                          Plantios {filtroSafra ? "da safra" : "(todas as safras)"}
                        </p>
                        {plantiosSafra.length === 0 && <p className="text-sm text-gray-400">Nenhum plantio planejado.</p>}
                        <ul className="space-y-2">
                          {plantiosSafra.map((p) => (
                            <li key={p.id} className="flex items-center justify-between gap-2 rounded-lg border border-gray-100 p-2.5">
                              <div className="min-w-0">
                                <p className="truncate text-sm font-medium text-gray-700">
                                  {nomeTalhao(p.idTalhao)} · {p.cultura}
                                </p>
                                <p className="text-xs text-gray-400">{p.nomeSafra} · {fmtHa(p.areaPlantada)} ha</p>
                              </div>
                              <button onClick={() => removerPlantio(p.id)} className="shrink-0 text-xs font-semibold text-red-600 hover:text-red-700">
                                Remover
                              </button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <ConfirmDialog
        aberto={excluindo != null}
        tipo="perigo"
        titulo="Excluir talhão do mapa"
        mensagem={<>Remover <strong className="text-gray-700">{excluindo?.nome}</strong> e seus plantios? Essa ação não poderá ser desfeita.</>}
        textoConfirmar="Excluir"
        onConfirmar={confirmarExclusao}
        onCancelar={() => setExcluindo(null)}
      />
    </div>
  );
}
