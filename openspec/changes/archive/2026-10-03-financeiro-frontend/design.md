# Design

## Context

Ver proposal.md — Why para a motivação. O frontend é React 19 + TypeScript +
Vite + Tailwind CSS v4, com TanStack React Query e Axios. A navegação atual é por
índice numérico de aba: `App.tsx` mantém `useState(tab)` e renderiza o módulo
conforme o índice; a `Sidebar` dispara `onTabChange(tab)` e já contém o item
"Financeiro" (💰) sem `tab` definido. Cada domínio segue o padrão
`XModule.tsx` com abas internas (Dashboard, Lista, Form, Relatórios), consumindo
`src/services/api.ts`, com tipos em `src/types/` e UI compartilhada em
`src/components/ui/` (`StatCard`, `ChartCard`, `Gauge`, `BarChart`,
`DonutChart`, `LineChart`, `PageHeader`, `Field`, `Input`, `Select`, `Button`,
`ConfirmDialog`, `Toast`, `StatusBadge`). Há precedente de dados mock
(`talhoesMock`, `insumosMock`, `atividadesMock`) e de fallback silencioso quando
um endpoint não existe (ex.: `getPropriedadesLista`).

## Goals / Non-Goals

**Goals:**
- Entregar o módulo financeiro web no mesmo padrão arquitetural e visual dos
  módulos existentes, sem introduzir novas dependências.
- Reutilizar os componentes de UI e gráficos já existentes.
- Consumir os endpoints do backend financeiro, com fallback mock para permitir
  desenvolvimento antes do backend estar pronto.

**Non-Goals:**
- Alterar o backend (coberto pelo change `financeiro` do backend).
- Introduzir React Router (a navegação continua por índice de abas).
- Adicionar biblioteca de gráficos externa (reutilizar os componentes SVG
  próprios).
- Autenticação/autorização (não existe no projeto hoje).
- Exportação real de Excel/PDF (pode ser um botão placeholder; a geração de
  arquivo não faz parte deste change).

## Decisions

### Manter navegação por índice de abas

Em vez de adicionar roteamento, o item "Financeiro" recebe um índice de aba em
`App.tsx`/`Sidebar.tsx`, renderizando `<FinanceiroModule />`, consistente com os
demais módulos. Alternativa descartada: migrar para React Router — mudança
transversal fora do escopo deste change.

### Estrutura do módulo espelhando `InsumosModule`

`FinanceiroModule.tsx` controla as abas internas (Dashboard, Lançamentos, Fluxo
de Caixa, Relatórios, Novo Lançamento) via `useState`, delegando para
subcomponentes: `FinanceiroDashboard`, `LancamentosLista`, `LancamentoForm`,
`FluxoCaixa`, `FinanceiroRelatorios`. Mantém coesão com o padrão já conhecido no
projeto.

### React Query para dados e invalidação de cache

Leituras usam `useQuery` com `queryKey` por recurso (ex.: `['lancamentos',
filtros]`, `['financeiro-saldo']`, `['financeiro-indicadores', agruparPor]`);
escritas usam `useMutation` com `invalidateQueries` para atualizar listas e
dashboard após criar/editar/excluir, igual ao `InsumosModule`.

### Camada de API e fallback mock

Novas funções em `src/services/api.ts` para os endpoints financeiros. Um
`src/services/financeiroMock.ts` fornece dados de desenvolvimento; as funções de
leitura capturam indisponibilidade do endpoint e retornam o mock, seguindo o
padrão de fallback já presente. Alternativa descartada: bloquear a UI até o
backend existir (atrasaria o desenvolvimento do frontend).

### Tipos e formatação monetária

`src/types/financeiro.ts` define `Lancamento`, `TipoLancamento`
('RECEITA'|'DESPESA'), `FormaPagamento`, `StatusLancamento`, `CentroCusto`,
`Safra`, `IndicadorFinanceiro`, além de um helper `fmtMoeda` (R$) análogo ao
`fmtQtd` de `insumo.ts`. Enums como union types de string, validados na borda do
formulário.

### Validações no formulário espelham as regras do backend

O `LancamentoForm` valida campos obrigatórios (Tipo, Categoria, Data, Valor),
valor positivo e soma de rateio = 100% antes de enviar, oferecendo feedback
imediato; o backend continua sendo a fonte da verdade e seus erros (400/404) são
exibidos via `Toast`.

## Risks / Trade-offs

- **Divergência entre mock e contrato real do backend** → mitigar tipando as
  respostas conforme as specs do change `financeiro` do backend e concentrando o
  mock em um único arquivo fácil de remover.
- **Formatação/agregação por cultura depende de texto livre** → exibir conforme
  retornado pelo backend; não reprocessar no frontend.
- **Gráficos SVG próprios podem ter limitações** → reutilizar os componentes
  existentes e, se faltar algum tipo de gráfico, compor com os disponíveis
  (barras/linha/donut) em vez de adicionar dependência.
- **Exportar Excel/PDF fora de escopo** → botão pode ficar desabilitado/placeholder
  para não sugerir função inexistente.

## Open Questions

- Nenhuma que bloqueie a implementação; o contrato de dados segue as specs do
  change `financeiro` do backend.
