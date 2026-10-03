# financeiro-lancamentos Specification

## Purpose

Telas de gestão dos lançamentos financeiros no frontend: listagem com filtros,
cadastro e edição com rateio entre talhões, e exclusão respeitando a integridade
de lançamentos conciliados.

## Requirements

### Requirement: Listagem de lançamentos

A tela de lançamentos SHALL listar os lançamentos retornados pelo backend em
ordem decrescente de data, exibindo tipo, categoria, data, valor (em R$), status
e vínculos principais.

#### Scenario: Listagem carregada

- **WHEN** a aba Lançamentos é aberta
- **THEN** os lançamentos são exibidos em ordem decrescente de data com valor
  formatado em R$

#### Scenario: Diferenciação de receita e despesa

- **WHEN** a lista contém receitas e despesas
- **THEN** receitas e despesas são distinguidas visualmente (ex.: cor/badge)

### Requirement: Filtros de lançamentos

A tela SHALL permitir filtrar os lançamentos por período (data inicial/final),
tipo, safra, propriedade e talhão, aplicando os filtros à consulta do backend.

#### Scenario: Filtro por período

- **WHEN** o usuário informa data inicial e final e aplica o filtro
- **THEN** apenas os lançamentos no intervalo são exibidos

#### Scenario: Filtro por tipo

- **WHEN** o usuário seleciona o tipo Receita ou Despesa
- **THEN** apenas os lançamentos daquele tipo são exibidos

### Requirement: Cadastro de lançamento

A tela SHALL oferecer um formulário para criar um lançamento com os campos
obrigatórios Tipo, Categoria, Data e Valor, e os campos opcionais de vínculos
(empresa, propriedade, talhão, safra, centro de custo), forma de pagamento e
observação, enviando ao backend.

#### Scenario: Criação bem-sucedida

- **WHEN** o usuário preenche os campos obrigatórios com valor positivo e salva
- **THEN** o lançamento é enviado ao backend
- **AND** após o sucesso a lista é atualizada e uma confirmação é exibida

#### Scenario: Validação de campos obrigatórios

- **WHEN** o usuário tenta salvar sem Tipo, Categoria, Data ou Valor
- **THEN** o formulário impede o envio e sinaliza os campos pendentes

#### Scenario: Valor não positivo

- **WHEN** o usuário informa um valor menor ou igual a zero
- **THEN** o formulário impede o envio e sinaliza o campo valor

### Requirement: Rateio de despesa entre talhões

O formulário SHALL permitir, em uma despesa, distribuir o valor entre vários
talhões por percentual, exigindo que a soma dos percentuais seja 100% antes de
enviar.

#### Scenario: Rateio válido

- **WHEN** o usuário adiciona talhões cujo rateio soma 100% e salva
- **THEN** o lançamento é enviado com as parcelas de rateio

#### Scenario: Soma de rateio inválida

- **WHEN** a soma dos percentuais de rateio é diferente de 100%
- **THEN** o formulário impede o envio e sinaliza a inconsistência

### Requirement: Edição de lançamento

A tela SHALL permitir editar um lançamento existente, pré-preenchendo o
formulário e aplicando as mesmas validações do cadastro.

#### Scenario: Edição bem-sucedida

- **WHEN** o usuário edita um lançamento e salva com dados válidos
- **THEN** a alteração é enviada ao backend e a lista é atualizada

### Requirement: Exclusão de lançamento

A tela SHALL permitir excluir um lançamento mediante confirmação, respeitando a
regra de que lançamentos conciliados não podem ser excluídos.

#### Scenario: Exclusão confirmada

- **WHEN** o usuário confirma a exclusão de um lançamento não conciliado
- **THEN** o lançamento é removido e a lista é atualizada

#### Scenario: Lançamento conciliado

- **WHEN** o usuário tenta excluir um lançamento conciliado
- **THEN** a exclusão é bloqueada
- **AND** uma mensagem informa que lançamentos conciliados não podem ser
  excluídos
