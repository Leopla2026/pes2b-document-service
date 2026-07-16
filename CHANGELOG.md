# Changelog

## 2.0.0 — 2026-07-15

### Adicionado

- autenticação por API Key no cabeçalho `X-API-Key`;
- Request ID em todas as requisições;
- respostas padronizadas para erros;
- endpoint público `/api/v1/info`;
- especificação OpenAPI;
- portal de desenvolvedores;
- extração de múltiplas apurações do relatório do Simples;
- consolidação ponderada por anexo;
- carga tributária total sobre o faturamento;
- testes de autenticação e de relatórios com múltiplos anexos.

### Corrigido

- leitura da competência em relatórios antigos do Domínio quando o valor aparece distante do rótulo `Período`;
- leitura de RBA atual e anterior em PDFs com texto compactado.
