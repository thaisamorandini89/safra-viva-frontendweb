# Spec Delta

## Purpose

Gerar relatórios inteligentes automáticos (executivo, agronômico e financeiro) a partir dos dados da fazenda.

## ADDED Requirements

### Requirement: Relatório executivo
O sistema SHALL gerar relatório com produção, custos, lucro e produtividade do período e safra selecionados.

#### Scenario: Geração
- **WHEN** o usuário solicita o relatório executivo de uma safra
- **THEN** o relatório traz as quatro seções com valores do banco e um resumo em linguagem natural

### Requirement: Relatório agronômico
O sistema SHALL gerar relatório com culturas, talhões, produtividade e histórico.

#### Scenario: Geração
- **WHEN** o usuário solicita o relatório agronômico
- **THEN** o relatório lista produtividade por talhão e cultura com comparação à safra anterior

### Requirement: Relatório financeiro restrito
O sistema SHALL gerar relatório com receitas, despesas, ROI e fluxo de caixa apenas para perfis com acesso financeiro.

#### Scenario: Perfil autorizado
- **WHEN** um administrador solicita o relatório financeiro
- **THEN** o relatório traz receitas, despesas, ROI e fluxo de caixa

#### Scenario: Perfil sem permissão
- **WHEN** um perfil sem acesso financeiro solicita o relatório financeiro
- **THEN** o sistema nega a solicitação com mensagem de permissão

### Requirement: Relatório sem dados
O sistema SHALL informar quando o período selecionado não possui dados, em vez de gerar relatório vazio enganoso.

#### Scenario: Período vazio
- **WHEN** não há lançamentos nem produção no período
- **THEN** a resposta informa a ausência de dados
