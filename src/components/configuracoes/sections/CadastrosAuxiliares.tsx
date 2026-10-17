import { Secao, ChipsInput } from "../ui";
import { useConfig, CadastrosAux } from "../store";

export default function CadastrosAuxiliares() {
  const { estado, atualizar, notificar, registrarLog } = useConfig();
  const c = estado.cadastros;

  const atualizarLista = (chave: keyof CadastrosAux, itens: string[]) => {
    atualizar("cadastros", { ...c, [chave]: itens });
    registrarLog(`Atualização de cadastros auxiliares (${chave})`, "Configurações › Cadastros Auxiliares");
    notificar({ tipo: "sucesso", titulo: "Cadastro atualizado" });
  };

  return (
    <Secao
      titulo="Cadastros Auxiliares"
      descricao="Listas de apoio utilizadas em todo o sistema."
      icone="🗃️"
    >
      <div className="grid gap-4 lg:grid-cols-2">
        <ChipsInput titulo="Tipos de Solo" icone="⛰️" itens={c.tiposSolo} onChange={(v) => atualizarLista("tiposSolo", v)} placeholder="Ex.: Latossolo" />
        <ChipsInput titulo="Culturas" icone="🌱" itens={c.culturas} onChange={(v) => atualizarLista("culturas", v)} placeholder="Ex.: Sorgo" />
        <ChipsInput titulo="Categorias Financeiras — Receitas" icone="⬆️" itens={c.categoriasReceita} onChange={(v) => atualizarLista("categoriasReceita", v)} placeholder="Ex.: Venda de Sementes" />
        <ChipsInput titulo="Categorias Financeiras — Despesas" icone="⬇️" itens={c.categoriasDespesa} onChange={(v) => atualizarLista("categoriasDespesa", v)} placeholder="Ex.: Arrendamento" />
        <ChipsInput titulo="Funções de Funcionários" icone="👷" itens={c.funcoes} onChange={(v) => atualizarLista("funcoes", v)} placeholder="Ex.: Mecânico" />
      </div>
    </Secao>
  );
}
