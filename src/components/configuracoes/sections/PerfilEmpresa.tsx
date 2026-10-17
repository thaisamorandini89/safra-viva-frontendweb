import { useEffect, useState } from "react";
import Field from "../../ui/Field";
import Input from "../../ui/Input";
import Button from "../../ui/Button";
import { Secao } from "../ui";
import { useConfig, EmpresaConfig } from "../store";

export default function PerfilEmpresa() {
  const { estado, atualizar, notificar, registrarLog } = useConfig();
  const [form, setForm] = useState<EmpresaConfig>(estado.empresa);

  useEffect(() => setForm(estado.empresa), [estado.empresa]);

  const campo = (chave: keyof EmpresaConfig, valor: string) =>
    setForm((f) => ({ ...f, [chave]: valor }));

  const enviarLogo = (arquivo?: File | null) => {
    if (!arquivo) return;
    const leitor = new FileReader();
    leitor.onload = () => setForm((f) => ({ ...f, logo: String(leitor.result) }));
    leitor.readAsDataURL(arquivo);
  };

  const salvar = () => {
    atualizar("empresa", form);
    registrarLog("Atualização do perfil da empresa", "Configurações › Perfil da Empresa");
    notificar({ tipo: "sucesso", titulo: "Perfil da empresa atualizado", descricao: "Os dados cadastrais foram salvos." });
  };

  return (
    <Secao
      titulo="Perfil da Empresa"
      descricao="Informações institucionais e identidade visual."
      icone="🏢"
    >
      <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
        {/* Logotipo */}
        <div>
          <p className="mb-2 text-xs font-semibold text-gray-600">Logotipo</p>
          <div className="flex h-32 w-full items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-gray-200 bg-gray-50">
            {form.logo ? (
              <img src={form.logo} alt="Logotipo" className="max-h-28 max-w-full object-contain" />
            ) : (
              <span className="text-3xl text-gray-300">🏞️</span>
            )}
          </div>
          <label className="mt-2 block">
            <span className="sr-only">Enviar logotipo</span>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => enviarLogo(e.target.files?.[0])}
              className="block w-full text-xs text-gray-500 file:mr-2 file:rounded-md file:border-0 file:bg-green-50 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-green-700 hover:file:bg-green-100"
            />
          </label>
          {form.logo && (
            <button
              type="button"
              onClick={() => setForm((f) => ({ ...f, logo: null }))}
              className="mt-1 text-xs font-semibold text-red-600 hover:text-red-700"
            >
              Remover logotipo
            </button>
          )}
        </div>

        {/* Campos */}
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Razão Social">
            <Input value={form.razaoSocial} onChange={(e) => campo("razaoSocial", e.target.value)} />
          </Field>
          <Field label="Nome Fantasia">
            <Input value={form.nomeFantasia} onChange={(e) => campo("nomeFantasia", e.target.value)} />
          </Field>
          <Field label="CNPJ">
            <Input value={form.cnpj} onChange={(e) => campo("cnpj", e.target.value)} />
          </Field>
          <Field label="Responsável Legal">
            <Input value={form.responsavelLegal} onChange={(e) => campo("responsavelLegal", e.target.value)} />
          </Field>
          <Field label="Telefone">
            <Input value={form.telefone} onChange={(e) => campo("telefone", e.target.value)} />
          </Field>
          <Field label="E-mail">
            <Input type="email" value={form.email} onChange={(e) => campo("email", e.target.value)} />
          </Field>
          <Field label="Endereço" className="sm:col-span-2">
            <Input value={form.endereco} onChange={(e) => campo("endereco", e.target.value)} />
          </Field>
        </div>
      </div>

      <div className="mt-5 flex justify-end">
        <Button onClick={salvar}>Salvar alterações</Button>
      </div>
    </Secao>
  );
}
