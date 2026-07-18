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

## Em desenvolvimento — Arquitetura Etapa 2

### Alterado

- registry de parsers convertido para catálogo central de metadados;
- cada parser agora registra família, nome, versão, versão do schema, status, descrição e confiança mínima;
- engine passou a resolver parsers por meio de `getDefinition()` e `getParser()`;
- resposta da engine agora informa `parserVersion`, `parserStatus` e `schemaVersion`;
- preservada compatibilidade com o acesso legado `registry.DAS`.

### Testes

- adicionados testes de metadados, listagem, validação, compatibilidade e tipos desconhecidos.
