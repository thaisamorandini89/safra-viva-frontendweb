# Tasks

## 1. Tipos e camada de dados

- [x] 1.1 Criar `src/types/financeiro.ts` com `TipoLancamento`
      ('RECEITA'|'DESPESA'), `FormaPagamento`, `StatusLancamento`, `Lancamento`,
      `RateioItem`, `CentroCusto`, `Safra`, `IndicadorFinanceiro`,
      `FluxoCaixaItem` e helper `fmtMoeda`; verificar que `npm run build`
      compila sem erros de tipo.
- [x] 1.2 Adicionar em `src/services/api.ts` as funções de leitura/escrita:
      `getLancamentos(filtros)`, `criarLancamento`, `atualizarLancamento`,
      `excluirLancamento`, `getCentrosCusto`, `criarCentroCusto`, `getSafras`,
      `getFinanceiroSaldo`, `getFluxoCaixa`, `getIndicadores(agruparPor)`;
      verificar tipagem das respostas.
- [x] 1.3 Criar `src/services/financeiroMock.ts` com dados de desenvolvimento e
      aplicar fallback nas funções de leitura (padrão `getPropriedadesLista`);
      verificar que as telas carregam sem backend.

## 2. Casca do módulo e navegação

- [x] 2.1 Criar `src/components/financeiro/FinanceiroModule.tsx` com abas
      internas (Dashboard, Lançamentos, Fluxo de Caixa, Relatórios, Novo
      Lançamento) usando `useState`, `PageHeader` e `TopBar`; Dashboard como aba
      inicial; verificar troca de abas.
- [x] 2.2 Ligar o item "Financeiro" na `src/components/layout/Sidebar.tsx`
      (atribuir `tab`) e registrar a aba em `src/App.tsx` renderizando
      `<FinanceiroModule />`; verificar que clicar em "Financeiro" abre o módulo
      e marca o item como ativo.
- [x] 2.3 Implementar estados de carregamento e erro no módulo (indicador de
      loading e mensagem de erro) reutilizando o padrão dos módulos existentes;
      verificar com erro simulado na API.

## 3. Dashboard financeiro

- [x] 3.1 Criar `src/components/financeiro/FinanceiroDashboard.tsx` com os cards
      (Receita Total, Despesa Total, Lucro Líquido, Custo por Hectare, Receita
      por Hectare, Fluxo de Caixa) usando `StatCard` e `fmtMoeda`; destacar
      lucro negativo; verificar renderização com dados de saldo/indicadores.
- [x] 3.2 Adicionar os gráficos (Receitas x Despesas mensal, Custos por
      Categoria, Rentabilidade por Cultura, Resultado por Safra) com
      `ChartCard` + `BarChart`/`DonutChart`/`LineChart`; incluir estado vazio
      quando não houver dados; verificar renderização e estado vazio.

## 4. Lançamentos

- [x] 4.1 Criar `src/components/financeiro/LancamentosLista.tsx` listando por
      data desc, com diferenciação visual de receita/despesa e valores em R$
      (`useQuery`); verificar ordenação e exibição.
- [x] 4.2 Adicionar filtros (período, tipo, safra, propriedade, talhão) que
      alimentam a `queryKey`/consulta; verificar cada filtro.
- [x] 4.3 Criar `src/components/financeiro/LancamentoForm.tsx` (criação/edição)
      com campos obrigatórios (Tipo, Categoria, Data, Valor), vínculos, forma de
      pagamento e observação, usando `Field`/`Input`/`Select`; validar
      obrigatórios e valor positivo; `useMutation` + `invalidateQueries`;
      verificar criação e edição.
- [x] 4.4 Implementar no formulário o rateio entre talhões com validação de soma
      = 100% antes do envio; verificar bloqueio quando a soma difere de 100%.
- [x] 4.5 Implementar exclusão com `ConfirmDialog`, bloqueando lançamentos
      conciliados e exibindo `Toast` com o erro do backend quando aplicável;
      verificar os dois caminhos (não conciliado exclui, conciliado bloqueia).

## 5. Fluxo de caixa

- [x] 5.1 Criar `src/components/financeiro/FluxoCaixa.tsx` com tabela (Data,
      Descrição, Entrada, Saída, Saldo acumulado) em ordem crescente de data e
      valores em R$; verificar o saldo acumulado.
- [x] 5.2 Adicionar filtro por período e estado vazio quando não houver
      movimentos; verificar recálculo do saldo ao filtrar.

## 6. Relatórios e indicadores

- [x] 6.1 Criar `src/components/financeiro/FinanceiroRelatorios.tsx` com
      agrupamento por safra/talhão/cultura exibindo receita, despesa, lucro,
      margem, ROI e custo por hectare (indisponível quando sem área); verificar
      troca de agrupamento.
- [x] 6.2 Adicionar Top 10 maiores despesas (ordem decrescente) e gráfico de
      evolução mensal de receitas x despesas; verificar ambas as visões.

## 7. Validação de integração

- [x] 7.1 Rodar `npm run build` e `npm run lint` e corrigir erros introduzidos;
      verificar que ambos passam.
- [x] 7.2 Executar `npm run dev` e percorrer o fluxo completo (abrir Financeiro →
      dashboard → criar lançamento de receita e de despesa com rateio → conferir
      lista, fluxo de caixa e relatórios), validando as regras de formulário
      (obrigatórios, valor positivo, rateio = 100%, conciliado não excluível).
