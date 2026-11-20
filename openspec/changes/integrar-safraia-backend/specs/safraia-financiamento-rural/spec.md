# Spec Delta

## Purpose

Indicar a prontidão da empresa para financiamento rural a partir dos dados internos e das certidões registradas, sem substituir a análise do banco.

## ADDED Requirements

### Requirement: Indicativo de prontidão para financiamento
O sistema SHALL calcular um indicativo de prontidão considerando pendências vencidas com fornecedores, fluxo de caixa, custo contra orçamento e certidões registradas.

#### Scenario: Empresa em dia
- **WHEN** não há pendências vencidas, o fluxo de caixa é positivo e as certidões estão válidas
- **THEN** o indicativo é favorável e lista os critérios atendidos

#### Scenario: Pendência com fornecedor
- **WHEN** há lançamentos vencidos e não pagos com fornecedores
- **THEN** o indicativo aponta a pendência como impeditivo, com fornecedor, valor e dias de atraso

### Requirement: Aviso de indicativo
Toda resposta de prontidão SHALL informar que é apenas indicativo e que a aprovação depende do banco.

#### Scenario: Exibição do aviso
- **WHEN** o usuário consulta a prontidão para financiamento
- **THEN** a resposta inclui o aviso de que não substitui a análise da instituição financeira

### Requirement: Registro de certidões
O sistema SHALL permitir registrar certidões da empresa (tipo, número, emissão, validade e status) e usá-las na avaliação, informando a data do último registro.

#### Scenario: Certidão vencida
- **WHEN** a validade da certidão registrada já passou
- **THEN** o indicativo trata a situação fiscal como irregular e orienta renovar a certidão

#### Scenario: Sem certidão registrada
- **WHEN** não há certidão registrada
- **THEN** a resposta informa que a situação tributária não pôde ser avaliada, sem assumir regularidade

### Requirement: Sem consulta automática a órgãos
O sistema SHALL NOT afirmar a situação fiscal real da empresa com base em consulta a órgãos públicos; a avaliação usa apenas o que foi registrado.

#### Scenario: Pergunta sobre dívida na Receita
- **WHEN** o usuário pergunta se há dívida com a Receita
- **THEN** a resposta explica que o sistema usa as certidões registradas e orienta emitir a certidão oficial

### Requirement: Acesso financeiro
O sistema SHALL restringir o indicativo e o registro de certidões a perfis com acesso financeiro.

#### Scenario: Perfil sem permissão
- **WHEN** um perfil sem acesso financeiro consulta a prontidão
- **THEN** o sistema nega a consulta com mensagem de permissão
