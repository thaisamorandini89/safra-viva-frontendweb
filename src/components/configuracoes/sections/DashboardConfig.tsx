import StatCard from "../../ui/StatCard";
import { useConfig, fmtDataHora } from "../store";

export default function DashboardConfig({ onIr }: { onIr: (secao: string) => void }) {
  const { estado } = useConfig();

  const usuariosAtivos = estado.usuarios.filter((u) => u.status === "Ativo").length;
  const perfisCriados = estado.perfis.length;
  const integracoesAtivas = estado.integracoes.filter((i) => i.ativa).length;
  const alertasConfigurados = Object.values(estado.notificacoes).filter(Boolean).length;
  const ultimoBackup = [...estado.backup.historico].sort((a, b) =>
    b.data.localeCompare(a.data)
  )[0];

  const cards = [
    { chave: "usuarios", icone: "👤", titulo: "Usuários Ativos", valor: String(usuariosAtivos), descricao: `${estado.usuarios.length} no total`, tom: "green" as const, secao: "usuarios" },
    { chave: "perfis", icone: "🛡️", titulo: "Perfis Criados", valor: String(perfisCriados), descricao: "perfis de acesso", tom: "sky" as const, secao: "perfis" },
    { chave: "integracoes", icone: "🔌", titulo: "Integrações Ativas", valor: String(integracoesAtivas), descricao: `${estado.integracoes.length} disponíveis`, tom: "lime" as const, secao: "integracoes" },
    { chave: "alertas", icone: "🔔", titulo: "Alertas Configurados", valor: String(alertasConfigurados), descricao: "notificações ativas", tom: "amber" as const, secao: "notificacoes" },
    { chave: "backup", icone: "💾", titulo: "Último Backup", valor: ultimoBackup ? fmtDataHora(ultimoBackup.data).split(" ")[0] : "—", descricao: ultimoBackup ? `${ultimoBackup.tipo} · ${ultimoBackup.status}` : "sem registros", tom: "slate" as const, secao: "backup" },
  ];

  const logsRecentes = [...estado.auditoria]
    .sort((a, b) => b.dataHora.localeCompare(a.dataHora))
    .slice(0, 5);

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-sky-100 bg-sky-50 p-4 text-sm text-sky-800">
        🛡️ <strong>Área administrativa.</strong> Este módulo é restrito a usuários com perfil de
        administrador e concentra a governança, a segurança e a personalização da plataforma.
      </div>

      <section className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
        {cards.map((c) => (
          <button key={c.chave} onClick={() => onIr(c.secao)} className="text-left">
            <StatCard icone={c.icone} titulo={c.titulo} valor={c.valor} descricao={c.descricao} tom={c.tom} />
          </button>
        ))}
      </section>

      <section className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-bold text-gray-800">Atividade recente (auditoria)</h3>
          <button onClick={() => onIr("auditoria")} className="text-xs font-semibold text-green-700 hover:text-green-900">
            Ver tudo →
          </button>
        </div>
        <ul className="space-y-2.5">
          {logsRecentes.map((l) => (
            <li key={l.id} className="flex items-center gap-3 text-sm">
              <span className="text-base">📝</span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-gray-700">{l.acao}</p>
                <p className="text-xs text-gray-400">
                  {l.usuario} · {l.tela}
                </p>
              </div>
              <span className="shrink-0 text-xs text-gray-400">{fmtDataHora(l.dataHora)}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
