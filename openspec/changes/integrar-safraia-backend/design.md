# Design

## Context

Backend Flask em `../backend` (controllers/services/models, blueprints sob `/api`), sem módulo SafraIA. O frontend chama `consultarSafraIA` em `src/services/api.ts`, que faz fallback para `safraIAMock.ts` em qualquer erro, e hoje envia só `pergunta` e `persona`. A UI consome `SafraIAResposta`. Os serviços existentes (financeiro, insumo, talhão, atividade, safra) já contêm a lógica de dados reaproveitável. Motivação: ver proposal.md.

## Goals / Non-Goals

**Goals:**
- Respostas fundamentadas nos dados reais, sem alucinação numérica.
- Manter o contrato `SafraIAResposta` e a UI atual.
- Usar Google Gemini (Flash) com modelo trocável por configuração.

**Non-Goals:**
- Voz e imagem (apenas pontos de extensão).
- Consulta automática de dívidas na Receita ou órgãos (sem API pública simples; Integra Contador do Serpro é paga, exige procuração e certificado digital) e raspagem de sites.
- Aprovar, simular ou contratar crédito junto a bancos.
- Análise química do solo (pH, P, K) e upload de laudo; possível mudança futura.
- Treinar/ajustar modelos ou usar RAG sobre documentos.
- Substituir o recebimento de dados pelas telas existentes.

## Decisions

1. **Agente com tools (*function calling* do Gemini) em vez de enviar o contexto inteiro ao LLM.** O LLM escolhe tools (`produtividade`, `custos`, `estoque`, `atividades`, `funcionarios`, `area_disponivel`, `lucro_safra`) que executam serviços Flask existentes. Alternativa descartada: enviar todo o contexto no prompt (caro, vaza dados, limite de tokens, números não confiáveis).
2. **Respostas estruturadas**: o LLM devolve a narrativa; destaques/tabela/alertas são montados no backend a partir dos resultados das tools, garantindo valores corretos.
3. **Camadas**: `controllers/safra_ia_controller.py` (HTTP), `services/safra_ia/` (agente, tools, alertas, relatórios), schemas Marshmallow/equivalente em `schemas/`. Alertas, dashboard e relatórios são determinísticos (regras SQL); o LLM só opcionalmente redige o resumo. Assim funcionam mesmo sem LLM.
4. **Provedor fixo: Google Gemini**, via SDK `google-genai`, configurado por env (`GEMINI_API_KEY`, `SAFRAIA_MODEL` com padrão `gemini-3.5-flash-lite`, `SAFRAIA_MODEL_RELATORIOS` opcional, `SAFRAIA_TIMEOUT`). Modelo Flash (rápido, com camada gratuita) para consultas e, opcionalmente, um Pro para resumos de relatórios; trocar de modelo não exige mudança de código. Chave só no backend. Alternativa descartada: multiprovedor com fallback (complexidade sem necessidade no MVP); a chamada ao Gemini fica isolada em um módulo para permitir reabrir essa decisão.
5. **Segurança**: rotas exigem usuário autenticado (usar o mecanismo de auth do backend; confirmar na implementação); persona derivada do perfil no servidor, ignorando a persona enviada pelo cliente para decisões de permissão; todas as tools filtram por empresa do usuário; rate limit por usuário.
6. **Frontend**: `consultarSafraIA` deixa de enviar o contexto; distingue "sem resposta" (fallback mock com selo "demonstração") de "backend recusou" (propaga mensagem), mesma regra já usada no Financeiro. Novos `getSafraIAAlertas`, `getSafraIADashboard`, `gerarRelatorioSafraIA` e componente `SafraIADashboard`, com React Query (queryFns devolvem dados puros).
7. **Clima via Open-Meteo**, chamado só pelo backend com latitude/longitude da propriedade (já cadastradas), com timeout e cache curto. Falha do serviço afeta apenas respostas e alertas de clima. Alternativas descartadas: OpenWeather (exige chave) e INMET (integração mais pesada).
8. **Aptidão do solo só com o cadastro** (tipo de solo e classe de capacidade de uso). Sem análise química, a resposta é marcada como avaliação preliminar. Ferramenta `aptidao_solo`.
9. **Orçamento de insumos determinístico**: `orcamento_insumos` estima custo por insumo e talhão multiplicando consumo histórico por `valor_unitario` cadastrado; o LLM apenas redige o resumo. Restrito a perfis com acesso financeiro.
10. **Prontidão para financiamento determinística**: ferramenta `prontidao_financiamento` combina critérios fixos (pendências vencidas com fornecedores, saldo de fluxo de caixa, custo versus orçamento, certidões válidas) em um indicativo com lista de impeditivos e ações sugeridas. O LLM só redige o resumo. Sempre acompanhado de aviso de que não substitui a análise do banco. Restrito a perfis com acesso financeiro.
11. **Situação tributária por registro manual**: nova entidade de certidão da empresa (tipo, número, emissão, validade, status) com alerta de vencimento. Alternativas descartadas nesta mudança: raspagem do site da Receita (captcha, frágil, risco de violar termos) e Integra Contador (custo e certificado digital); ficam para evolução futura isolada em módulo próprio.
12. **Dados financeiros necessários**: lançamentos hoje não têm fornecedor nem vencimento; adicionar `id_fornecedor` e `data_vencimento` opcionais (migração aditiva, sem quebrar clientes). Lançamentos antigos sem esses campos ficam fora da apuração de pendências, e a resposta informa essa limitação.
13. **Validade por lote**: reutilizar `lote_insumo.data_validade` e o saldo do lote; perda estimada = saldo × `valor_unitario` do insumo. Histórico a partir das movimentações de lote existentes.
14. **Autenticação própria mínima** (resolve a pergunta do design anterior): tabela `usuario` (nome, e-mail, hash de senha com `werkzeug.security`, perfil, `id_empresa`, ativo), `POST /api/auth/login` devolvendo JWT (PyJWT, expiração curta, segredo em `JWT_SECRET`), `GET /api/auth/me` e decorator `requer_auth` aplicado só às rotas `/api/safra-ia/*`. Perfil e empresa vêm do token, nunca do corpo da requisição. Proteger as demais rotas existentes fica fora desta mudança. Alternativa descartada: confiar em perfil enviado pelo cliente (inseguro).
15. **Frontend com login real e demonstração**: o login tenta o backend e guarda o token; se o backend estiver inacessível, mantém o login local atual (demonstração) sem token, caso em que o SafraIA usa o motor local. Token enviado por interceptor `Authorization: Bearer`.
16. **Sem streaming no MVP**; indicador de "digitando" já existe.

## Risks / Trade-offs

- [Dados enviados ao Google] → enviar só resultados agregados das tools, sem dados pessoais de funcionários além do necessário; na camada gratuita o Google pode usar os dados para melhorar produtos, então usar dados reais apenas com faturamento ativo; documentar na política de privacidade.
- [Limites da camada gratuita] → tratar 429 do provedor com mensagem clara e manter alertas/dashboard sem LLM.
- [Latência/custo do LLM] → timeout, rate limit, cache curto para alertas/dashboard.
- [Classificação errada de tool] → cobertura de testes com perguntas-exemplo do Taiga e fallback "não entendi" com sugestões.
- [Recomendação agronômica tratada como prescrição] → aviso de orientação geral nas respostas técnicas.
- [Aptidão do solo imprecisa sem análise química] → aviso de avaliação preliminar e recomendação de análise laboratorial.
- [Open-Meteo indisponível ou limitada] → timeout, cache e mensagem clara; demais recursos seguem funcionando.
- [Orçamento sem histórico ou preço] → informar lacunas por insumo em vez de assumir valores.
- [Indicativo de crédito interpretado como aprovação] → aviso fixo em toda resposta e na UI; critérios exibidos de forma transparente.
- [Certidão registrada manualmente desatualizada] → mostrar data do último registro e alertar vencimento; não afirmar situação fiscal real.
- [Dados de fornecedor/vencimento ausentes em lançamentos antigos] → informar a limitação e incentivar preenchimento.
- [Rotas existentes continuam abertas] → registrar como risco conhecido e tratar em mudança própria; SafraIA nunca expõe dados sem token.
- [Modelo indisponível] → alertas/dashboard/relatórios seguem funcionando sem LLM; consulta devolve erro claro.

## Migration Plan

Entrega incremental: backend com flag; frontend continua com fallback até o endpoint estar no ar. Rollback: desligar a flag, o frontend volta ao mock automaticamente.

## Open Questions

- Nenhuma sobre o provedor: padrão `gemini-3.5-flash-lite`, ajustável em `SAFRAIA_MODEL*` sem mudar código.
