# Tasks

## 0. Autenticação (pré-requisito)

- [x] 0.1 Preparar testes do backend (pytest, banco SQLite em memória ou PostgreSQL de teste) e dependências `PyJWT` e `pytest`; verificar `pytest` rodando um teste de sanidade
- [ ] 0.2 Criar modelo e migração `usuario` (perfil, `id_empresa`, hash de senha) e seed de usuários de demonstração; verificar migração aplicada e usuários criados
- [x] 0.3 Implementar `POST /api/auth/login`, `GET /api/auth/me` e decorator `requer_auth` (JWT com expiração, segredo em `JWT_SECRET`); verificar testes de login válido, senha errada, token expirado e ausente
- [x] 0.4 Frontend: login chama o backend, guarda o token, interceptor `Authorization` no `api.ts` e fallback local sem token quando o backend está inacessível; verificar teste Vitest e login manual nos dois modos

## 1. Backend: base do módulo SafraIA (repositório `../backend`)

- [x] 1.1 Criar blueprint `safra_ia` registrado em `/api`, config por env e schemas de entrada/saída; verificar `POST /api/safra-ia/consultar` respondendo 401 sem login e 422 com pergunta vazia (teste de API)
- [ ] 1.2 Implementar tools determinísticas (produtividade, custos, estoque, atividades, funcionários, área disponível, lucro por safra) sobre os serviços existentes, filtradas por empresa; verificar com testes unitários usando dados de seed
- [x] 1.3 Implementar persona/permissão no servidor (financeiro restrito); verificar teste que nega finanças ao agrônomo e isola dados de outra empresa

## 2. Backend: agente e consultas

- [x] 2.1 Implementar cliente Gemini (SDK `google-genai`, modelo Flash) isolado em módulo próprio, com function calling, timeout e tratamento de erro; verificar com cliente fake nos testes
- [ ] 2.2 Montar resposta estruturada (destaques/tabela/alertas/sugestões) a partir das tools; verificar testes com as perguntas-exemplo da spec `safraia-consultas`
- [ ] 2.3 Adicionar resposta de orientação agronômica geral e simulação de ocupação de talhões; verificar testes dos cenários "rotação após soja" e "soja em talhões livres"
- [ ] 2.4 Adicionar rate limit e documentar `GEMINI_API_KEY`, `SAFRAIA_MODEL`, `SAFRAIA_MODEL_RELATORIOS` e `SAFRAIA_TIMEOUT` no README do backend; verificar 429 em teste

## 3. Backend: alertas, dashboard e relatórios

- [ ] 3.1 Implementar `GET /api/safra-ia/alertas` (estoque, vencimento, atividades atrasadas, custo acima do orçamento) e verificar com testes por cenário da spec
- [ ] 3.2 Implementar recomendações e `GET /api/safra-ia/dashboard` com os cinco indicadores; verificar consistência de contagens com os alertas
- [ ] 3.3 Implementar `POST /api/safra-ia/relatorios/{tipo}` (executivo, agronômico, financeiro restrito, período vazio); verificar testes de permissão e conteúdo
- [ ] 3.4 Atualizar coleção Insomnia com os novos endpoints; verificar execução manual das requisições

## 4. Backend: clima, solo e orçamento de insumos

- [ ] 4.1 Implementar cliente Open-Meteo com timeout e cache curto, usando latitude/longitude da propriedade, e a tool `previsao_clima`; verificar com testes usando resposta simulada, incluindo falha do serviço
- [ ] 4.2 Implementar a tool `aptidao_solo` com tipo de solo e classe de uso do talhão e aviso de avaliação preliminar; verificar testes com talhão completo e sem tipo de solo
- [ ] 4.3 Implementar a tool `orcamento_insumos` (consumo histórico x valor unitário, lacunas explícitas, acesso financeiro); verificar testes de total, insumo sem preço e permissão
- [ ] 4.4 Adicionar alerta climático (chuva prevista com pulverização planejada) a `GET /api/safra-ia/alertas`; verificar teste do cenário

## 5. Backend: financiamento rural e validade de insumos

- [ ] 5.1 Migração aditiva: `id_fornecedor` e `data_vencimento` opcionais em lançamentos e tabela de certidões da empresa; verificar migração aplicada e revertida e que endpoints existentes seguem passando nos testes
- [ ] 5.2 Expor fornecedor/vencimento no cadastro de lançamentos e criar CRUD de certidões restrito a perfis financeiros; verificar testes de API e permissão
- [ ] 5.3 Implementar a tool `prontidao_financiamento` (pendências com fornecedores, fluxo de caixa, custo versus orçamento, certidões) com aviso fixo; verificar testes de empresa em dia, com pendência, certidão vencida e sem certidão
- [ ] 5.4 Implementar a tool `validade_lotes` (classificação, perda estimada, histórico, prioridade de uso) sobre `lote_insumo`; verificar testes de lote a vencer, sem validade e sem valor unitário
- [ ] 5.5 Adicionar alertas de certidão e pendência com fornecedor a `GET /api/safra-ia/alertas`; verificar testes dos cenários

## 6. Frontend: integração da consulta

- [x] 6.1 Ajustar `consultarSafraIA` em `src/services/api.ts`: backend como fonte principal, fallback só sem resposta, propagar erros do backend; verificar com teste Vitest em `src/services` (mock de axios)
- [ ] 6.2 Remover o envio/dependência do contexto pesado e marcar respostas do mock como "modo demonstração" em `SafraIAAssistant.tsx`/`SafraIAMensagem.tsx`; verificar `npm run build` e checagem manual no chat
- [ ] 6.3 Atualizar `src/types/safraIA.ts` com campos novos (origem da resposta, categoria de alerta); verificar `tsc` sem erros

## 7. Frontend: alertas, dashboard e relatórios

- [ ] 7.1 Criar `getSafraIAAlertas`, `getSafraIADashboard` e `gerarRelatorioSafraIA` (queryFns retornando dados puros) com testes Vitest
- [ ] 7.2 Criar `SafraIADashboard` com os cinco indicadores e estado de falha parcial; verificar renderização manual e teste de componente
- [ ] 7.3 Adicionar no chat ações de gerar relatório (executivo/agronômico/financeiro, oculto sem permissão); verificar fluxo manual por persona
- [ ] 7.4 Exibir resumo do clima da propriedade e ação de orçamento de insumos no chat (oculta sem permissão financeira); verificar manualmente por persona e com a previsão indisponível
- [ ] 7.5 Criar tela de registro de certidões e ação de prontidão para financiamento no chat, com aviso de indicativo e oculta sem permissão financeira; verificar manualmente por persona
- [ ] 7.6 Exibir validade por lote e valor em risco no chat e no dashboard; verificar manualmente com lotes de teste

## 8. Verificação integrada

- [ ] 8.1 Subir backend + frontend e executar as perguntas do Taiga ponta a ponta, com backend ligado e desligado; verificar respostas reais versus demonstração
