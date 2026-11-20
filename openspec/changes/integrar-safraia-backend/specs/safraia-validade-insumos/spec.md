# Spec Delta

## Purpose

Acompanhar a validade de insumos e fertilizantes por lote e estimar o impacto financeiro de perdas por vencimento.

## ADDED Requirements

### Requirement: Controle de validade por lote
O sistema SHALL informar, por lote com saldo, a data de validade e os dias restantes, classificando em vencido, a vencer em até 30 dias ou em dia.

#### Scenario: Lote a vencer
- **WHEN** um lote com saldo vence em 20 dias
- **THEN** a resposta e o alerta indicam insumo, lote, saldo e 20 dias restantes

#### Scenario: Lote sem validade
- **WHEN** um lote não tem data de validade cadastrada
- **THEN** ele é listado como sem validade informada, sem classificação de vencimento

### Requirement: Perda financeira estimada
O sistema SHALL estimar o valor em risco de lotes vencidos ou a vencer multiplicando o saldo do lote pelo valor unitário do insumo.

#### Scenario: Valor em risco
- **WHEN** o usuário pergunta quanto vai perder com produtos vencendo
- **THEN** a resposta traz o total estimado e o detalhamento por lote

#### Scenario: Insumo sem valor unitário
- **WHEN** o insumo não tem valor unitário
- **THEN** o lote aparece como pendente de valor e fica fora do total, com aviso

### Requirement: Histórico de vencimentos
O sistema SHALL listar lotes vencidos no período com saldo remanescente.

#### Scenario: Consulta histórica
- **WHEN** o usuário pede os produtos que venceram neste ano
- **THEN** a resposta lista os lotes vencidos com insumo, data de validade e saldo

### Requirement: Priorização de uso
O sistema SHALL sugerir o uso prioritário dos lotes mais próximos do vencimento (primeiro a vencer, primeiro a sair).

#### Scenario: Dois lotes do mesmo insumo
- **WHEN** um insumo tem dois lotes com validades diferentes
- **THEN** a resposta recomenda usar primeiro o lote que vence antes
