# Spec Delta

## Purpose

Informar o usuário sobre as condições climáticas da propriedade e a aptidão do solo dos talhões para plantio, apoiando decisões de manejo.

## ADDED Requirements

### Requirement: Previsão do tempo da propriedade
O sistema SHALL informar previsão de chuva, temperatura, umidade e velocidade do vento para as coordenadas da propriedade.

#### Scenario: Pergunta sobre chuva
- **WHEN** o usuário pergunta se vai chover nas próximas 24 horas
- **THEN** a resposta informa a previsão para a propriedade

### Requirement: Recomendação operacional por clima
O sistema SHALL recomendar adiar operações sensíveis, como pulverização, quando a previsão indicar chuva ou vento forte.

#### Scenario: Chuva prevista
- **WHEN** o usuário pergunta se pode pulverizar e há chuva prevista nas próximas 24 horas
- **THEN** a resposta recomenda adiar a pulverização e cita a previsão

### Requirement: Aptidão do solo para plantio
O sistema SHALL avaliar a aptidão de cada talhão para plantio com base no tipo de solo e na classe de capacidade de uso cadastrados.

#### Scenario: Avaliação de talhão
- **WHEN** o usuário pergunta se o talhão T-05 é adequado para plantio
- **THEN** a resposta usa o tipo de solo e a classe de uso cadastrados e indica que é uma avaliação preliminar

#### Scenario: Talhão sem dados de solo
- **WHEN** o talhão não tem tipo de solo cadastrado
- **THEN** a resposta informa a ausência do dado, sem inventar avaliação

### Requirement: Indisponibilidade da previsão
O sistema SHALL informar que a previsão está indisponível quando o serviço climático falhar, sem afetar as demais respostas.

#### Scenario: Serviço climático fora do ar
- **WHEN** a consulta ao serviço climático falha
- **THEN** a resposta de clima informa a indisponibilidade e as demais consultas continuam funcionando
