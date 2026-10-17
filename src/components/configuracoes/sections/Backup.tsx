import { useState } from "react";
import Field from "../../ui/Field";
import Input from "../../ui/Input";
import ConfirmDialog from "../../ui/ConfirmDialog";
import { Secao, Toggle, Badge } from "../ui";
import { useConfig, fmtDataHora, uid, ItemBackup } from "../store";

export default function Backup() {
  const { estado, atualizar, notificar, registrarLog } = useConfig();
  const b = estado.backup;
  const [restaurando, setRestaurando] = useState<ItemBackup | null>(null);

  const historicoOrdenado = [...b.historico].sort((a, b) => b.data.localeCompare(a.data));

  const toggleAutomatico = (valor: boolean) => {
    atualizar("backup", { ...b, automaticoDiario: valor });
    registrarLog(`Backup automático ${valor ? "ativado" : "desativado"}`, "Configurações › Backup");
    notificar({ tipo: "sucesso", titulo: `Backup automático ${valor ? "ativado" : "desativado"}` });
  };

  const alterarHorario = (horario: string) => atualizar("backup", { ...b, horario });

  const backupManual = () => {
    const novo: ItemBackup = {
      id: uid(),
      data: new Date().toISOString(),
      responsavel: estado.empresa.responsavelLegal || "Administrador",
      status: "Concluído",
      tipo: "Manual",
    };
    atualizar("backup", { ...b, historico: [novo, ...b.historico] });
    registrarLog("Execução de backup manual", "Configurações › Backup");
    notificar({ tipo: "sucesso", titulo: "Backup realizado", descricao: "Cópia manual concluída com sucesso." });
  };

  const confirmarRestauracao = () => {
    if (!restaurando) return;
    registrarLog(`Restauração do backup de ${fmtDataHora(restaurando.data)}`, "Configurações › Backup");
    notificar({ tipo: "sucesso", titulo: "Restauração iniciada", descricao: `Backup de ${fmtDataHora(restaurando.data)}.` });
    setRestaurando(null);
  };

  return (
    <div className="space-y-5">
      <Secao
        titulo="Backup e Recuperação"
        descricao="Cópias de segurança automáticas e manuais dos dados."
        icone="💾"
        acoes={
          <button onClick={backupManual} className="rounded-lg bg-green-700 px-4 py-2 text-sm font-semibold text-white hover:bg-green-800">
            Fazer backup agora
          </button>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border border-gray-100 p-3">
            <Toggle
              rotulo="Backup automático diário"
              descricao="Executa uma cópia completa todos os dias"
              ativo={b.automaticoDiario}
              onChange={toggleAutomatico}
            />
          </div>
          <Field label="Horário do backup automático">
            <Input type="time" value={b.horario} onChange={(e) => alterarHorario(e.target.value)} disabled={!b.automaticoDiario} />
          </Field>
        </div>
      </Secao>

      <Secao titulo="Histórico de Backups" descricao="Últimas cópias executadas.">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-xs uppercase tracking-wide text-gray-400">
                <th className="py-2 pr-3 font-semibold">Data do Backup</th>
                <th className="py-2 pr-3 font-semibold">Responsável</th>
                <th className="py-2 pr-3 font-semibold">Tipo</th>
                <th className="py-2 pr-3 font-semibold">Status</th>
                <th className="py-2 pr-3 font-semibold text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {historicoOrdenado.map((item) => (
                <tr key={item.id} className="border-b border-gray-50 last:border-0">
                  <td className="whitespace-nowrap py-2.5 pr-3 text-gray-600">{fmtDataHora(item.data)}</td>
                  <td className="py-2.5 pr-3 font-medium text-gray-700">{item.responsavel}</td>
                  <td className="py-2.5 pr-3 text-gray-600">{item.tipo}</td>
                  <td className="py-2.5 pr-3"><Badge texto={item.status} /></td>
                  <td className="py-2.5 pr-3 text-right">
                    <button onClick={() => setRestaurando(item)} className="text-xs font-semibold text-sky-700 hover:text-sky-900">
                      Restaurar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Secao>

      <ConfirmDialog
        aberto={restaurando != null}
        titulo="Restaurar backup"
        mensagem={<>Deseja restaurar os dados a partir do backup de <strong className="text-gray-700">{restaurando ? fmtDataHora(restaurando.data) : ""}</strong>? Os dados atuais serão substituídos.</>}
        textoConfirmar="Restaurar"
        onConfirmar={confirmarRestauracao}
        onCancelar={() => setRestaurando(null)}
      />
    </div>
  );
}
