# Spec Delta

## Purpose

Casca do módulo financeiro no frontend web: navegação pela Sidebar e por abas,
camada de acesso aos dados do backend e tratamento de carregamento e erro.

## ADDED Requirements

### Requirement: Acesso ao módulo pela navegação

O sistema SHALL tornar o item "Financeiro" da Sidebar funcional, abrindo o módulo
financeiro ao ser selecionado, mantendo o padrão de navegação por abas já usado
pelos demais módulos.

#### Scenario: Abrir o módulo financeiro

- **WHEN** o usuário clica no item "Financeiro" da Sidebar
- **THEN** o módulo financeiro é exibido na área de conteúdo
- **AND** o item "Financeiro" aparece como ativo na Sidebar

### Requirement: Navegação por abas do módulo

O módulo financeiro SHALL apresentar abas internas (Dashboard, Lançamentos,
Fluxo de Caixa, Relatórios e Novo Lançamento), exibindo a aba Dashboard por
padrão ao abrir.

#### Scenario: Troca de aba

- **WHEN** o usuário seleciona outra aba dentro do módulo financeiro
- **THEN** o conteúdo correspondente àquela aba é exibido
- **AND** a aba selecionada é destacada visualmente

#### Scenario: Aba inicial

- **WHEN** o módulo financeiro é aberto
- **THEN** a aba Dashboard é exibida por padrão

### Requirement: Camada de acesso a dados

O módulo SHALL consumir os endpoints do backend financeiro via React Query e
Axios, centralizando as chamadas em `src/services/api.ts`.

#### Scenario: Carregamento de dados

- **WHEN** uma tela do módulo é aberta
- **THEN** os dados correspondentes são buscados no backend via React Query

### Requirement: Estados de carregamento e erro

O módulo SHALL exibir indicação de carregamento enquanto os dados são buscados e
uma mensagem de erro quando a requisição falhar, sem quebrar a interface.

#### Scenario: Carregando

- **WHEN** uma requisição de dados está em andamento
- **THEN** a tela exibe um indicador de carregamento

#### Scenario: Erro na requisição

- **WHEN** uma requisição de dados falha
- **THEN** a tela exibe uma mensagem de erro
- **AND** a aplicação permanece utilizável

#### Scenario: Fallback para dados mock

- **WHEN** um endpoint financeiro ainda não está disponível no backend
- **THEN** a tela utiliza dados mock de desenvolvimento, sem quebrar a interface
