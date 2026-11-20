# Spec Delta

## Purpose

Identificar o usuário no servidor, com perfil e empresa, para que recursos sensíveis como o SafraIA respeitem permissões e escopo de dados.

## ADDED Requirements

### Requirement: Login com token
O sistema SHALL autenticar e-mail e senha e devolver um token com expiração que identifica usuário, perfil e empresa.

#### Scenario: Credenciais válidas
- **WHEN** um usuário ativo informa e-mail e senha corretos
- **THEN** o sistema devolve um token e os dados do usuário

#### Scenario: Credenciais inválidas
- **WHEN** a senha está errada ou o usuário está inativo
- **THEN** o sistema recusa o login sem revelar qual dado falhou

### Requirement: Rotas protegidas do SafraIA
O sistema SHALL exigir token válido nas rotas `/api/safra-ia/*` e derivar perfil e empresa do token.

#### Scenario: Sem token
- **WHEN** uma requisição ao SafraIA não traz token
- **THEN** o sistema responde 401

#### Scenario: Perfil enviado pelo cliente
- **WHEN** o corpo da requisição informa um perfil diferente do token
- **THEN** o sistema usa o perfil do token

### Requirement: Senhas protegidas
O sistema SHALL armazenar apenas hash das senhas e nunca devolvê-las em respostas.

#### Scenario: Consulta ao usuário
- **WHEN** o endpoint de identidade é chamado
- **THEN** a resposta não contém senha nem hash
