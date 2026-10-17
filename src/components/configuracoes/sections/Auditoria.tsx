import { useMemo, useState } from "react";
import Input from "../../ui/Input";
import Select from "../../ui/Select";
import { Secao } from "../ui";
import { useConfig, fmtDataHora } from "../store";

export default function Auditoria() {
  const { estado } = useConfig();
  const [busca, setBusca] = useState("");
  const [tela, setTela] = useState("");

  const telas = useMemo(
    () => [...new Set(estado.auditoria.map((l) => l.tela))].sort(),
    [estado.auditoria]
  );

  const logs = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return [...estado.auditoria]
      .sort((a, b) => b.dataHora.localeCompare(a.dataHora))
      .filter((l) => (!tela || l.tela === tela) && (!termo || `${l.usuario} ${l.acao} ${l.ip}`.toLowerCase().includes(termo)));
  }, [estado.auditoria, busca, tela]);

  const exportar = () => {
    const linhas = [
      ["Data/Hora", "Usuário", "Tela", "Ação", "IP"],
      ...logs.map((l) => [fmtDataHora(l.dataHora), l.usuario, l.tela, l.acao, l.ip]),
    ];
    const csv = linhas.map((l) => l.map((c) => `"${String(c).replaceAll('"', '""')}"`).join(";")).join("\r\n");
    const blob = new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `safraviva-auditoria-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Secao
      titulo="Auditoria"
      descricao="Registro de ações realizadas no sistema (login, inclusões, alterações, exclusões e aprovações)."
      icone="📋"
      acoes={
        <button onClick={exportar} className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50">
          Exportar CSV
        </button>
      }
    >
      <div className="mb-3 flex flex-wrap gap-2">
        <div className="w-full sm:w-64">
          <Input placeholder="Buscar por usuário, ação ou IP..." value={busca} onChange={(e) => setBusca(e.target.value)} />
        </div>
        <div className="w-full sm:w-48">
          <Select placeholder="Todas as telas" value={tela} onChange={(e) => setTela(e.target.value)} options={telas} />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-xs uppercase tracking-wide text-gray-400">
              <th className="py-2 pr-3 font-semibold">Data/Hora</th>
              <th className="py-2 pr-3 font-semibold">Usuário</th>
              <th className="py-2 pr-3 font-semibold">Tela</th>
              <th className="py-2 pr-3 font-semibold">Ação</th>
              <th className="py-2 pr-3 font-semibold">IP</th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 && (
              <tr>
                <td colSpan={5} className="py-6 text-center text-sm text-gray-400">Nenhum registro encontrado.</td>
              </tr>
            )}
            {logs.map((l) => (
              <tr key={l.id} className="border-b border-gray-50 last:border-0">
                <td className="whitespace-nowrap py-2.5 pr-3 text-gray-600">{fmtDataHora(l.dataHora)}</td>
                <td className="py-2.5 pr-3 font-medium text-gray-700">{l.usuario}</td>
                <td className="py-2.5 pr-3 text-gray-600">{l.tela}</td>
                <td className="py-2.5 pr-3 text-gray-600">{l.acao}</td>
                <td className="py-2.5 pr-3 text-gray-500 tabular-nums">{l.ip}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Secao>
  );
}
