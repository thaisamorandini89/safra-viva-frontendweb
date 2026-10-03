# financeiro-relatorios Specification

## Purpose

Tela de relatórios e indicadores de rentabilidade do módulo financeiro, com
agregações por safra, talhão e cultura.

## Requirements

### Requirement: Relatórios de rentabilidade

A tela de relatórios SHALL apresentar indicadores agregados por safra, talhão e
cultura, exibindo receita, despesa, lucro líquido, margem de lucro, ROI e custo
por hectare, com valores monetários em R$.

#### Scenario: Relatório por safra

- **WHEN** o usuário seleciona o agrupamento por safra
- **THEN** a tela exibe, por safra, receita, despesa, lucro líquido, margem, ROI
  e custo por hectare

#### Scenario: Relatório por cultura

- **WHEN** o usuário seleciona o agrupamento por cultura
- **THEN** a tela exibe os indicadores agregados por cultura

#### Scenario: Custo por hectare sem área

- **WHEN** a área correspondente não está disponível
- **THEN** o custo por hectare é apresentado como indisponível, sem erro

### Requirement: Indicadores de gestão

A tela SHALL apresentar visões de gestão: Top 10 maiores despesas e evolução
mensal de receitas e despesas.

#### Scenario: Top 10 despesas

- **WHEN** a tela de relatórios é aberta
- **THEN** as 10 maiores despesas do período são listadas em ordem decrescente de
  valor

#### Scenario: Evolução mensal

- **WHEN** a tela de relatórios é aberta
- **THEN** um gráfico mostra a evolução mensal de receitas e despesas no período
