# Proposal

## Why

O chat SafraIA do frontend já existe (botão flutuante, personas, respostas estruturadas), mas sua "inteligência" é um motor de palavras-chave local (`safraIAMock.ts`) que só enxerga dados já carregados no navegador. O endpoint `/api/safra-ia/consultar` não existe no backend, então toda resposta vem do mock. É preciso um agente real no backend, com acesso aos dados da fazenda, para entregar consultas em linguagem natural, análises, alertas, recomendações e relatórios descritos no módulo SafraIA (Taiga).

## What Changes

- **Backend (Flask)**: novo módulo `safra-ia` com `POST /api/safra-ia/consultar` que interpreta a pergunta com o Google Gemini (modelo Flash), usando *function calling* com *tools* determinísticas que consultam o banco (produção por talhão/cultura/safra, custos, estoque, atividades, funcionários, área disponível). Números sempre vêm das tools, nunca inventados pelo modelo.
- **Backend**: endpoints de insights proativos: `GET /api/safra-ia/alertas`, `GET /api/safra-ia/dashboard` e `POST /api/safra-ia/relatorios/{executivo|agronomico|financeiro}`.
- **Backend**: respeito a persona/perfil do usuário autenticado (dados financeiros só para perfis autorizados), escopo por empresa/propriedade e limite de taxa.
- **Frontend**: `consultarSafraIA` passa a depender do backend como fonte principal; o contexto enviado deixa de ser a base da análise (o backend consulta o banco). O mock permanece só como fallback de demonstração quando o backend não responde. Novas chamadas para alertas, dashboard e relatórios, com cartão de Dashboard de IA e ação de gerar relatório no chat.
- Mantém o contrato `SafraIAResposta` (texto, destaques, alertas, tabela, sugestões) para não quebrar a UI atual.
- **Clima e solo**: previsão (chuva, temperatura, umidade, vento) para as coordenadas da propriedade via Open-Meteo, e avaliação de aptidão do solo para plantio a partir do cadastro (tipo de solo e classe de uso).
- **Orçamento de insumos**: estimativa de custo de insumos de uma safra a partir do histórico de consumo e dos valores unitários cadastrados.
- **Prontidão para financiamento rural**: indicativo (não é aprovação de crédito) calculado com pendências vencidas com fornecedores, fluxo de caixa, custo contra orçamento e situação das certidões (CND) registradas manualmente, com alerta de vencimento da certidão.
- **Validade de insumos e fertilizantes**: controle por lote (já existe `lote_insumo.data_validade`), alertas por faixa de vencimento, histórico e estimativa da perda financeira de produto vencido ou a vencer.
- **BREAKING (schema, aditivo)**: lançamentos financeiros passam a aceitar fornecedor e data de vencimento (hoje inexistentes), necessários para apurar pendências com fornecedores; nova tabela de certidões da empresa.
- **Autenticação (pré-requisito)**: o backend não tem login; o login atual do frontend é local. Entra login com token (JWT) emitido pelo backend, usuários com perfil e empresa, e proteção das rotas `/api/safra-ia/*`. As rotas existentes não são alteradas nesta mudança.
- Fora do escopo (futuro, consulta automática de dívidas na Receita/órgãos (Integra Contador do Serpro), apenas pontos de extensão): voz, imagem (pragas/doenças), análise química do solo (pH, P, K) e upload de laudo.

## Capabilities

### New Capabilities
- `safraia-consultas`: perguntas em linguagem natural sobre produtividade, finanças, estoque, funcionários, planejamento de safra e conhecimento agronômico, com respeito a persona e escopo.
- `safraia-alertas-dashboard`: alertas operacionais, financeiros e de estoque, recomendações e indicadores do Dashboard de IA.
- `safraia-relatorios`: geração automática dos relatórios executivo, agronômico e financeiro.
- `safraia-clima-solo`: previsão do tempo da propriedade e aptidão do solo para plantio.
- `safraia-orcamento-insumos`: estimativa de orçamento de insumos por safra.
- `autenticacao-usuarios`: login com token, identidade (perfil e empresa) no servidor e proteção de rotas.
- `safraia-financiamento-rural`: indicativo de prontidão para crédito rural e registro de certidões.
- `safraia-validade-insumos`: controle de validade por lote e perda financeira estimada.

### Modified Capabilities
<!-- Nenhuma: não há specs SafraIA existentes. -->

## Impact

- Backend: novo blueprint, serviço de agente/tools, dependência do SDK `google-genai`, variáveis de ambiente (`GEMINI_API_KEY`, `SAFRAIA_MODEL` padrão `gemini-3.5-flash-lite`, `SAFRAIA_MODEL_RELATORIOS` opcional, `SAFRAIA_TIMEOUT`), autenticação nas rotas.
- Frontend: `src/services/api.ts`, `src/services/safraIAMock.ts` (vira fallback), `src/types/safraIA.ts`, `src/components/safraia/*`, novo componente de dashboard de IA.
- Segurança/privacidade: dados da fazenda são enviados ao Google (apenas resultados agregados); na camada gratuita do Gemini o Google pode usar prompts e respostas para melhorar produtos, então usar dados reais só com faturamento ativo; chave jamais exposta ao frontend.
- Custo: camada gratuita do Gemini para desenvolvimento (sujeita a limites por minuto/dia); faturamento por uso em produção.
- Nova dependência externa: API Open-Meteo (sem chave), chamada apenas pelo backend com coordenadas da propriedade.
