# Spec Delta

## Purpose

Estimar o orçamento de insumos de uma safra a partir do histórico de consumo e dos valores cadastrados, para apoiar o planejamento de compras.

## ADDED Requirements

### Requirement: Estimativa de orçamento por safra
O sistema SHALL estimar o custo de insumos de uma safra com base no consumo histórico e nos valores unitários cadastrados, detalhado por insumo e por talhão.

#### Scenario: Pedido de orçamento
- **WHEN** o usuário pede o orçamento de insumos da próxima safra de soja
- **THEN** a resposta traz o total estimado e uma tabela por insumo com quantidade, valor unitário e custo

### Requirement: Lacunas explícitas
O sistema SHALL informar insumos sem histórico de consumo ou sem valor unitário, sem assumir valores.

#### Scenario: Insumo sem preço
- **WHEN** um insumo estimado não tem valor unitário cadastrado
- **THEN** ele aparece como pendente de preço e fica fora do total, com aviso

### Requirement: Acesso financeiro
O sistema SHALL restringir o orçamento de insumos a perfis com acesso financeiro.

#### Scenario: Perfil sem permissão
- **WHEN** um perfil sem acesso financeiro pede o orçamento
- **THEN** o sistema nega o pedido com mensagem de permissão
