## 2.0.0 / Engine 1.8.0 - Padronização estrutural dos parsers


## [2.0.0] - Etapa 5 - Fixtures e testes de contrato

- adicionadas fixtures textuais anonimizadas para DAS, declaração PGDAS, recibo PGDAS, extrato PGDAS, relatório do Simples e declaração de faturamento;
- adicionada fixture negativa para proteção contra falso positivo de DAS;
- criado teste de contrato que valida detecção, confiança mínima, execução do parser e campos essenciais;
- cobertura automatizada ampliada de 24 para 31 testes.

- Cada parser do Simples Nacional passou a possuir pasta própria com `index.js`, `parser.js`, `schema.js` e `rules.js`.
- O registry agora carrega metadados diretamente dos arquivos `schema.js` e `rules.js`.
- Foram mantidos wrappers compatíveis para os caminhos antigos.
- Adicionados testes estruturais e de compatibilidade.
- Engine atualizada para 1.8.0.

# Changelog

## 1.7.1 - 2026-07-18

- Corrige falso bloqueio de declarações PGDAS quando o PDF contém “Nº da Declaração” em uma ocorrência e “Número da Declaração” em outra.
- Adiciona teste de regressão com declaração retificadora real.

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

## Arquitetura 1.7.0 - confiança ponderada

- detecção documental baseada em sinais ponderados;
- níveis de confiança HIGH, MEDIUM e LOW;
- auditoria de regras encontradas e ausentes;
- bloqueio seguro do parser abaixo de `minimumConfidence`;
- compatibilidade preservada com `documentType` e endpoints existentes.
