# Proposal

## Why

A Sidebar do SafraViva já exibe o item "Financeiro" (💰), mas ele não está ligado
a nenhum módulo — clicar nele não abre nada. O backend está ganhando o módulo
financeiro (change `financeiro`: lançamentos, safra, centro de custo, saldo,
fluxo de caixa e indicadores), e o produtor rural precisa de telas para registrar
movimentações e acompanhar a saúde financeira e a rentabilidade por safra, talhão
e cultura. Este change entrega a interface web do módulo financeiro, seguindo o
mesmo padrão visual e arquitetural dos módulos existentes.

## What Changes

- Novo módulo `FinanceiroModule` (`src/components/financeiro/FinanceiroModule.tsx`)
  com navegação por abas (Dashboard, Lançamentos, Fluxo de Caixa, Relatórios,
  Novo Lançamento), no mesmo padrão de `InsumosModule`/`EmpresasModule`.
- Integração na navegação: ligar o item "Financeiro" da Sidebar e registrar a
  aba correspondente em `App.tsx` (hoje a navegação é por índice de abas).
- **Dashboard Financeiro**: cards (Receita Total, Despesa Total, Lucro Líquido,
  Custo por Hectare, Receita por Hectare, Fluxo de Caixa) e gráficos (Receitas x
  Despesas mensal, Custos por Categoria, Rentabilidade por Cultura, Resultado por
  Safra) reutilizando `StatCard`, `ChartCard`, `BarChart`, `DonutChart`,
  `LineChart` e `Gauge`.
- **Tela de Lançamentos**: listagem com filtros (período, tipo, safra,
  propriedade, talhão), formulário de criação/edição (tipo, categoria, data,
  valor, vínculos, forma de pagamento, observação, rateio entre talhões) e
  exclusão com confirmação respeitando a regra de lançamento conciliado.
- **Tela de Fluxo de Caixa**: tabela com Data, Descrição, Entrada, Saída e Saldo
  acumulado, filtrável por período.
- **Relatórios/Indicadores**: visões por safra, talhão e cultura com ROI, margem
  de lucro e custo por hectare, além de top 10 despesas e evolução mensal.
- Novas funções de cliente HTTP em `src/services/api.ts` para os endpoints do
  backend financeiro (`/api/lancamentos`, `/api/centros-custo`, `/api/safras`,
  `/api/financeiro/saldo`, `/api/financeiro/fluxo-caixa`,
  `/api/financeiro/indicadores`), com fallback para dados mock enquanto o backend
  não estiver disponível — mesmo padrão de `talhoesMock`/`insumosMock`.
- Novos tipos TypeScript em `src/types/financeiro.ts` (lançamento, categoria,
  forma de pagamento, status, centro de custo, safra, indicadores) e helpers de
  formatação monetária (R$).

## Capabilities

### New Capabilities
- `financeiro-modulo`: casca do módulo financeiro — navegação pela Sidebar/abas,
  camada de acesso a dados (React Query + Axios) e estados de carregamento/erro.
- `financeiro-dashboard`: painel com cards de indicadores e gráficos consolidados
  do financeiro.
- `financeiro-lancamentos`: listagem, filtros, cadastro/edição e exclusão de
  lançamentos financeiros, incluindo rateio entre talhões.
- `financeiro-fluxo-caixa`: tela de fluxo de caixa com entradas, saídas e saldo
  acumulado por período.
- `financeiro-relatorios`: relatórios e indicadores de rentabilidade por safra,
  talhão e cultura.

### Modified Capabilities
<!-- Nenhuma capacidade existente possui spec no OpenSpec ainda; a navegação é
     ajustada como parte de `financeiro-modulo`. -->

## Impact

- Affected specs: `financeiro-modulo` (nova), `financeiro-dashboard` (nova),
  `financeiro-lancamentos` (nova), `financeiro-fluxo-caixa` (nova),
  `financeiro-relatorios` (nova)
- Affected code: `src/components/financeiro/*` (novos componentes),
  `src/components/layout/Sidebar.tsx`, `src/App.tsx`, `src/services/api.ts`,
  `src/services/financeiroMock.ts` (novo), `src/types/financeiro.ts` (novo)
- APIs consumidas (backend): endpoints do change `financeiro` do backend.
- Dependências: reutiliza React 19, React Query, Axios e Tailwind já presentes;
  sem novas dependências.
- Sem breaking changes: módulos e navegação existentes permanecem funcionando;
  apenas adiciona a aba Financeiro.
