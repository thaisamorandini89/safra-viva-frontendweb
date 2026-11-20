# Spec Delta

## Purpose

Permitir que o usuário faça perguntas em linguagem natural ao SafraIA e receba respostas estruturadas baseadas nos dados reais da fazenda, adaptadas à sua persona.

## ADDED Requirements

### Requirement: Consulta em linguagem natural
O sistema SHALL receber uma pergunta e devolver uma resposta estruturada (texto, destaques, alertas, tabela e sugestões de acompanhamento) calculada a partir dos dados persistidos da fazenda.

#### Scenario: Pergunta sobre produtividade
- **WHEN** o usuário pergunta "Qual foi o talhão mais produtivo da safra atual?"
- **THEN** a resposta identifica o talhão com base nos dados cadastrados e inclui o valor de produtividade

#### Scenario: Pergunta sobre custo
- **WHEN** o usuário pergunta "Quanto gastei com fertilizantes este mês?"
- **THEN** a resposta traz o total apurado dos lançamentos do período

#### Scenario: Dados insuficientes
- **WHEN** não há dados para responder a pergunta
- **THEN** a resposta informa a ausência de dados, sem inventar valores

### Requirement: Números originados dos dados
Todo valor numérico em uma resposta SHALL ser obtido de consultas aos dados da fazenda, nunca gerado livremente pelo modelo.

#### Scenario: Valor conferível
- **WHEN** a resposta cita um custo, área ou produtividade
- **THEN** o mesmo valor é obtido pela consulta correspondente ao banco no mesmo escopo

### Requirement: Escopo e permissões por persona
O sistema SHALL restringir dados e análises ao escopo (empresa/propriedades) do usuário autenticado e bloquear análises financeiras para perfis sem permissão.

#### Scenario: Agrônomo pergunta sobre finanças
- **WHEN** um usuário sem permissão financeira pergunta sobre lucro por safra
- **THEN** a resposta informa que o perfil não tem acesso e não revela valores

#### Scenario: Outra empresa
- **WHEN** a pergunta se refere a dados de outra empresa
- **THEN** nenhum dado dessa empresa é utilizado ou revelado

### Requirement: Conhecimento agronômico geral
O sistema SHALL responder perguntas técnicas gerais (rotação, manejo, adubação) identificando-as como orientação geral, distinta de dados da fazenda.

#### Scenario: Rotação após soja
- **WHEN** o usuário pergunta "Qual a recomendação geral para rotação após soja?"
- **THEN** a resposta traz boas práticas e indica que é orientação geral, não prescrição agronômica

### Requirement: Simulação de planejamento
O sistema SHALL calcular cenários de ocupação de talhões a partir da área disponível real.

#### Scenario: Soja em talhões livres
- **WHEN** o usuário pergunta qual será a área cultivada se plantar soja em todos os talhões livres
- **THEN** a resposta informa a soma das áreas livres e a área total resultante

### Requirement: Degradação controlada
O frontend SHALL exibir resposta de demonstração local, sinalizada como tal, quando o backend estiver indisponível, e uma mensagem de erro clara quando o backend recusar a consulta.

#### Scenario: Backend fora do ar
- **WHEN** a chamada não obtém resposta do backend
- **THEN** o chat responde com o motor local e indica modo de demonstração

#### Scenario: Backend recusa
- **WHEN** o backend responde erro (permissão, limite de taxa, falha do LLM)
- **THEN** o chat mostra a mensagem do backend e não usa o mock
