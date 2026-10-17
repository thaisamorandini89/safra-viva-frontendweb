import { useState } from "react";
import Field from "../../ui/Field";
import Input from "../../ui/Input";
import Select from "../../ui/Select";
import ConfirmDialog from "../../ui/ConfirmDialog";
import { Secao, Badge } from "../ui";
import { useConfig, Usuario, StatusUsuario, uid } from "../store";

const vazio = (): Usuario => ({
  id: "",
  nome: "",
  email: "",
  telefone: "",
  perfil: "operador",
  status: "Ativo",
});

export default function Usuarios() {
  const { estado, atualizar, notificar, registrarLog } = useConfig();
  const [editando, setEditando] = useState<Usuario | null>(null);
  const [excluindo, setExcluindo] = useState<Usuario | null>(null);
  const [erro, setErro] = useState("");

  const perfis = estado.perfis;
  const nomePerfil = (id: string) => perfis.find((p) => p.id === id)?.nome ?? id;

  const setUsuarios = (lista: Usuario[]) => atualizar("usuarios", lista);

  const salvar = () => {
    if (!editando) return;
    if (!editando.nome.trim() || !editando.email.trim()) {
      setErro("Informe nome e e-mail.");
      return;
    }
    const existe = estado.usuarios.some((u) => u.id === editando.id);
    if (existe) {
      setUsuarios(estado.usuarios.map((u) => (u.id === editando.id ? editando : u)));
      registrarLog(`Edição do usuário ${editando.nome}`, "Configurações › Usuários");
      notificar({ tipo: "sucesso", titulo: "Usuário atualizado", descricao: editando.nome });
    } else {
      const novo = { ...editando, id: uid() };
      setUsuarios([...estado.usuarios, novo]);
      registrarLog(`Cadastro do usuário ${novo.nome}`, "Configurações › Usuários");
      notificar({ tipo: "sucesso", titulo: "Usuário cadastrado", descricao: novo.nome });
    }
    setEditando(null);
    setErro("");
  };

  const alterarStatus = (u: Usuario, status: StatusUsuario) => {
    setUsuarios(estado.usuarios.map((x) => (x.id === u.id ? { ...x, status } : x)));
    registrarLog(`Usuário ${u.nome} marcado como ${status}`, "Configurações › Usuários");
    notificar({ tipo: "sucesso", titulo: `Usuário ${status.toLowerCase()}`, descricao: u.nome });
  };

  const redefinirSenha = (u: Usuario) => {
    registrarLog(`Redefinição de senha de ${u.nome}`, "Configurações › Usuários");
    notificar({ tipo: "sucesso", titulo: "Senha redefinida", descricao: `Um link foi enviado para ${u.email}.` });
  };

  const confirmarExclusao = () => {
    if (!excluindo) return;
    setUsuarios(estado.usuarios.filter((u) => u.id !== excluindo.id));
    registrarLog(`Exclusão do usuário ${excluindo.nome}`, "Configurações › Usuários");
    notificar({ tipo: "sucesso", titulo: "Usuário removido", descricao: excluindo.nome });
    setExcluindo(null);
  };

  return (
    <Secao
      titulo="Usuários"
      descricao="Gerencie quem acessa o sistema."
      icone="👥"
      acoes={
        <button
          onClick={() => { setEditando(vazio()); setErro(""); }}
          className="rounded-lg bg-green-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-800"
        >
          + Novo usuário
        </button>
      }
    >
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-xs uppercase tracking-wide text-gray-400">
              <th className="py-2 pr-3 font-semibold">Nome</th>
              <th className="py-2 pr-3 font-semibold">E-mail</th>
              <th className="py-2 pr-3 font-semibold">Telefone</th>
              <th className="py-2 pr-3 font-semibold">Perfil</th>
              <th className="py-2 pr-3 font-semibold">Status</th>
              <th className="py-2 pr-3 font-semibold text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {estado.usuarios.map((u) => (
              <tr key={u.id} className="border-b border-gray-50 last:border-0">
                <td className="py-2.5 pr-3 font-medium text-gray-700">{u.nome}</td>
                <td className="py-2.5 pr-3 text-gray-600">{u.email}</td>
                <td className="py-2.5 pr-3 text-gray-600">{u.telefone || "—"}</td>
                <td className="py-2.5 pr-3 text-gray-600">{nomePerfil(u.perfil)}</td>
                <td className="py-2.5 pr-3"><Badge texto={u.status} /></td>
                <td className="py-2.5 pr-3">
                  <div className="flex flex-wrap justify-end gap-1.5 text-xs font-semibold">
                    <button onClick={() => { setEditando(u); setErro(""); }} className="text-green-700 hover:text-green-900">Editar</button>
                    {u.status !== "Bloqueado" ? (
                      <button onClick={() => alterarStatus(u, "Bloqueado")} className="text-amber-700 hover:text-amber-900">Bloquear</button>
                    ) : (
                      <button onClick={() => alterarStatus(u, "Ativo")} className="text-green-700 hover:text-green-900">Desbloquear</button>
                    )}
                    {u.status === "Ativo" ? (
                      <button onClick={() => alterarStatus(u, "Inativo")} className="text-slate-600 hover:text-slate-800">Inativar</button>
                    ) : (
                      <button onClick={() => alterarStatus(u, "Ativo")} className="text-green-700 hover:text-green-900">Ativar</button>
                    )}
                    <button onClick={() => redefinirSenha(u)} className="text-sky-700 hover:text-sky-900">Redefinir senha</button>
                    <button onClick={() => setExcluindo(u)} className="text-red-600 hover:text-red-700">Excluir</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal de cadastro/edição */}
      {editando && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setEditando(null)}>
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="mb-4 text-base font-bold text-gray-800">
              {estado.usuarios.some((u) => u.id === editando.id) ? "Editar usuário" : "Novo usuário"}
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Nome" required className="sm:col-span-2">
                <Input value={editando.nome} onChange={(e) => setEditando({ ...editando, nome: e.target.value })} />
              </Field>
              <Field label="E-mail" required>
                <Input type="email" value={editando.email} onChange={(e) => setEditando({ ...editando, email: e.target.value })} />
              </Field>
              <Field label="Telefone">
                <Input value={editando.telefone} onChange={(e) => setEditando({ ...editando, telefone: e.target.value })} />
              </Field>
              <Field label="Perfil de Acesso">
                <Select
                  value={editando.perfil}
                  onChange={(e) => setEditando({ ...editando, perfil: e.target.value })}
                  options={perfis}
                  getOptionValue={(p) => p.id}
                  getOptionLabel={(p) => p.nome}
                />
              </Field>
              <Field label="Status">
                <Select
                  value={editando.status}
                  onChange={(e) => setEditando({ ...editando, status: e.target.value as StatusUsuario })}
                  options={["Ativo", "Inativo", "Bloqueado"]}
                />
              </Field>
            </div>
            {erro && <p className="mt-3 text-xs font-semibold text-red-600">{erro}</p>}
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setEditando(null)} className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50">
                Cancelar
              </button>
              <button onClick={salvar} className="rounded-lg bg-green-700 px-4 py-2 text-sm font-semibold text-white hover:bg-green-800">
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        aberto={excluindo != null}
        tipo="perigo"
        titulo="Excluir usuário"
        mensagem={<>Tem certeza que deseja excluir <strong className="text-gray-700">{excluindo?.nome}</strong>? Essa ação não poderá ser desfeita.</>}
        textoConfirmar="Excluir"
        onConfirmar={confirmarExclusao}
        onCancelar={() => setExcluindo(null)}
      />
    </Secao>
  );
}
