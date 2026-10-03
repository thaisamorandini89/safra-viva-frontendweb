# financeiro-dashboard Specification

## Purpose

Painel inicial do módulo financeiro com cards de indicadores e gráficos
consolidados, dando visão rápida da saúde financeira da operação.

## Requirements

### Requirement: Cards de indicadores do dashboard

O dashboard financeiro SHALL exibir cards com Receita Total, Despesa Total,
Lucro Líquido, Custo por Hectare, Receita por Hectare e Fluxo de Caixa, usando o
componente `StatCard` e formatação monetária em Real (R$).

#### Scenario: Exibição dos cards

- **WHEN** o dashboard financeiro é aberto
- **THEN** os seis cards de indicadores são exibidos com seus valores formatados
  em R$

#### Scenario: Lucro líquido negativo destacado

- **WHEN** o lucro líquido é negativo
- **THEN** o card correspondente apresenta o valor com destaque visual de
  prejuízo

### Requirement: Gráficos do dashboard

O dashboard financeiro SHALL exibir gráficos de Receitas x Despesas (mensal),
Custos por Categoria, Rentabilidade por Cultura e Resultado por Safra,
reutilizando os componentes de gráfico existentes (`BarChart`, `DonutChart`,
`LineChart`) dentro de `ChartCard`.

#### Scenario: Exibição dos gráficos

- **WHEN** o dashboard financeiro é aberto com dados disponíveis
- **THEN** os gráficos de receitas x despesas, custos por categoria,
  rentabilidade por cultura e resultado por safra são renderizados

#### Scenario: Ausência de dados

- **WHEN** não há lançamentos no período selecionado
- **THEN** cada gráfico exibe um estado vazio informativo em vez de quebrar
