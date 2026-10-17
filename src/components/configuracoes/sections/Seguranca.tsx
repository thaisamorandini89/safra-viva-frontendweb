import { useEffect, useState } from "react";
import Field from "../../ui/Field";
import Input from "../../ui/Input";
import Button from "../../ui/Button";
import { Secao, Toggle } from "../ui";
import { useConfig, Seguranca as SegurancaTipo } from "../store";

export default function Seguranca() {
  const { estado, atualizar, notificar, registrarLog } = useConfig();
  const [form, setForm] = useState<SegurancaTipo>(estado.seguranca);

  useEffect(() => setForm(estado.seguranca), [estado.seguranca]);

  const num = (chave: keyof SegurancaTipo, valor: string) =>
    setForm((f) => ({ ...f, [chave]: Number(valor) || 0 }));
  const bool = (chave: keyof SegurancaTipo, valor: boolean) =>
    setForm((f) => ({ ...f, [chave]: valor }));

  const salvar = () => {
    atualizar("seguranca", form);
    registrarLog("Atualização das políticas de segurança", "Configurações › Segurança");
    notificar({ tipo: "sucesso", titulo: "Configurações de segurança salvas" });
  };

  return (
    <div className="space-y-5">
      <Secao titulo="Políticas de Senha" descricao="Requisitos mínimos para senhas dos usuários." icone="🔑">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Tamanho mínimo (caracteres)">
            <Input type="number" min={4} value={form.senhaTamanhoMin} onChange={(e) => num("senhaTamanhoMin", e.target.value)} />
          </Field>
          <Field label="Expiração (dias)">
            <Input type="number" min={0} value={form.senhaExpiracaoDias} onChange={(e) => num("senhaExpiracaoDias", e.target.value)} />
          </Field>
          <Field label="Histórico de senhas (últimas bloqueadas)">
            <Input type="number" min={0} value={form.senhaHistorico} onChange={(e) => num("senhaHistorico", e.target.value)} />
          </Field>
          <div className="flex items-end">
            <div className="w-full rounded-lg border border-gray-100 p-3">
              <Toggle
                rotulo="Exigir complexidade"
                descricao="Maiúsculas, minúsculas, números e símbolos"
                ativo={form.senhaComplexidade}
                onChange={(v) => bool("senhaComplexidade", v)}
              />
            </div>
          </div>
        </div>
      </Secao>

      <Secao titulo="Autenticação" descricao="Formas de acesso e recuperação de conta." icone="🔐">
        <div className="space-y-3">
          <div className="rounded-lg border border-gray-100 p-3">
            <Toggle rotulo="Login e senha" descricao="Autenticação básica (sempre habilitada)" ativo onChange={() => undefined} />
          </div>
          <div className="rounded-lg border border-gray-100 p-3">
            <Toggle rotulo="MFA — Autenticação em dois fatores" descricao="Código adicional no login" ativo={form.mfa} onChange={(v) => bool("mfa", v)} />
          </div>
          <div className="rounded-lg border border-gray-100 p-3">
            <Toggle rotulo="Recuperação de senha por e-mail" descricao="Permite redefinir a senha pelo e-mail cadastrado" ativo={form.recuperacaoSenha} onChange={(v) => bool("recuperacaoSenha", v)} />
          </div>
        </div>
      </Secao>

      <Secao titulo="Sessão" descricao="Controle de tempo de sessão dos usuários." icone="⏱️">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Tempo limite de sessão (minutos)">
            <Input type="number" min={1} value={form.sessaoTimeoutMin} onChange={(e) => num("sessaoTimeoutMin", e.target.value)} />
          </Field>
          <div className="flex items-end">
            <div className="w-full rounded-lg border border-gray-100 p-3">
              <Toggle rotulo="Logout automático" descricao="Encerra a sessão após o tempo limite" ativo={form.logoutAutomatico} onChange={(v) => bool("logoutAutomatico", v)} />
            </div>
          </div>
        </div>
      </Secao>

      <div className="flex justify-end">
        <Button onClick={salvar}>Salvar segurança</Button>
      </div>
    </div>
  );
}
