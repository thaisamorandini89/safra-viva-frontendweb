# Spec Delta

## Purpose

Oferecer alertas proativos, recomendações e indicadores consolidados do SafraIA para operação, finanças e estoque.

## ADDED Requirements

### Requirement: Alertas operacionais, financeiros e de estoque
O sistema SHALL calcular alertas ativos por categoria com nível (info, alerta, crítico), título e descrição.

#### Scenario: Estoque mínimo
- **WHEN** um insumo atinge ou fica abaixo do estoque mínimo
- **THEN** existe alerta de estoque com o nome do insumo

#### Scenario: Vencimento próximo
- **WHEN** um lote vence em até 30 dias
- **THEN** existe alerta indicando o produto e os dias restantes

#### Scenario: Atividade atrasada
- **WHEN** há atividade planejada com data prevista vencida
- **THEN** existe alerta operacional listando a atividade

#### Scenario: Custo acima do orçamento
- **WHEN** o custo apurado de uma safra excede o orçado ou a média histórica
- **THEN** existe alerta financeiro, visível apenas a perfis com acesso financeiro

### Requirement: Alertas climáticos
O sistema SHALL gerar alerta climático quando a previsão para a propriedade afetar atividades planejadas.

#### Scenario: Chuva com pulverização planejada
- **WHEN** há chuva prevista nas próximas 24 horas e atividade de pulverização planejada para o período
- **THEN** existe alerta recomendando adiar a pulverização

### Requirement: Alertas de certidão e pendências
O sistema SHALL alertar sobre certidão vencida ou prestes a vencer e sobre pendências vencidas com fornecedores, visíveis apenas a perfis com acesso financeiro.

#### Scenario: Certidão a vencer
- **WHEN** uma certidão registrada vence em até 30 dias
- **THEN** existe alerta financeiro indicando o tipo da certidão e os dias restantes

### Requirement: Recomendações agronômicas
O sistema SHALL gerar recomendações baseadas nos dados, como queda de produtividade, uso excessivo de insumos e comparação entre talhões semelhantes.

#### Scenario: Queda de produtividade
- **WHEN** a produtividade de um talhão cai em relação à safra anterior
- **THEN** há uma recomendação pendente citando o talhão e a variação percentual

### Requirement: Dashboard de IA
O sistema SHALL expor indicadores: alertas ativos, recomendações pendentes, custos anormais, talhões com baixa produtividade e estoques críticos.

#### Scenario: Consulta ao dashboard
- **WHEN** o usuário abre o Dashboard de IA
- **THEN** os cinco indicadores são exibidos com contagens consistentes com os alertas listados

#### Scenario: Falha parcial
- **WHEN** um indicador não pode ser calculado
- **THEN** os demais continuam exibidos e o indicador com falha é sinalizado
