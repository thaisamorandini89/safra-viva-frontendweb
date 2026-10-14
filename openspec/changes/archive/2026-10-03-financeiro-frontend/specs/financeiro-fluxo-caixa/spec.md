# Spec Delta

## Purpose

Tela de fluxo de caixa do módulo financeiro, apresentando entradas, saídas e
saldo acumulado ao longo do tempo.

## ADDED Requirements

### Requirement: Tabela de fluxo de caixa

A tela de fluxo de caixa SHALL exibir uma tabela com as colunas Data, Descrição,
Entrada, Saída e Saldo, em ordem crescente de data, com valores monetários
formatados em R$.

#### Scenario: Exibição do fluxo

- **WHEN** a aba Fluxo de Caixa é aberta
- **THEN** a tabela lista os movimentos com data, descrição, entrada, saída e
  saldo acumulado em ordem crescente de data

#### Scenario: Saldo acumulado

- **WHEN** há múltiplos movimentos no período
- **THEN** o saldo de cada linha reflete o acumulado das linhas anteriores mais a
  atual

### Requirement: Filtro por período do fluxo de caixa

A tela SHALL permitir filtrar o fluxo de caixa por período (data inicial e
final).

#### Scenario: Filtro por período aplicado

- **WHEN** o usuário informa data inicial e final e aplica o filtro
- **THEN** apenas os movimentos do intervalo são exibidos e o saldo é recalculado

#### Scenario: Período sem movimentos

- **WHEN** o período selecionado não possui movimentos
- **THEN** a tela exibe um estado vazio informativo
