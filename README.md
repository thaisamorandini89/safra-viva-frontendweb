# SafraViva — Frontend

Aplicação React 19 e TypeScript para gestão agrícola, com Vite, Tailwind CSS e
TanStack Query.

## Como o sistema está organizado

- `src/App.tsx` controla a navegação entre os módulos.
- `src/main.tsx` inicializa a aplicação e o cache global do TanStack Query.
- `src/components/` contém as telas de empresas, propriedades, talhões,
  atividades, insumos, financeiro e relatórios.
- `src/services/api.ts` concentra as chamadas aos endpoints `/api` do backend
  Flask. O Vite encaminha essas chamadas para `flask_backend:5000`.
- `src/types/` define os modelos usados pelas telas. Alguns serviços usam dados
  locais de demonstração quando os endpoints ainda não estão disponíveis.

## Central de Relatórios

A opção **Relatórios** reúne visões executiva, operacional, agronômica,
financeira e de estoque. Os filtros são combinados antes de gerar o relatório;
as tabelas têm paginação e os dados podem ser exportados para CSV, Excel (`.xlsx`),
PDF ou impressão A4 horizontal.

As exportações são carregadas sob demanda. O Excel contém uma tabela formatada,
filtros e totais calculados para o demonstrativo financeiro.

### Limites atuais dos dados

- A produtividade vem do histórico dos talhões e é expressa em sacas por
  hectare; o sistema ainda não fornece produção total em toneladas.
- O relatório de funcionários agrega responsáveis de atividades e consumo de
  insumos. Não há cadastro de RH, apontamento de horas ou folha de pagamento.
- Estoque e utilização de talhões representam posições atuais; não há histórico
  suficiente para reconstruir essas posições em qualquer data passada.
- Os relatórios agregam no frontend os dados disponíveis nos módulos. Paginação
  no servidor, autenticação e aplicação de RBAC precisam ser implementadas e
  validadas no backend; a interface não substitui essas verificações.

## Desenvolvimento

```sh
npm install
npm run dev
```

Antes de enviar alterações, valide com:

```sh
npm run lint
npm run build
```
