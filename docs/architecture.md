# Arquitetura

## Fluxo

1. O cliente envia um PDF por multipart/form-data.
2. O middleware valida a API Key.
3. O extrator lê o texto do PDF.
4. O detector identifica o tipo documental.
5. O parser específico estrutura os dados.
6. A engine devolve dados, avisos, erros e o texto extraído.

## Segurança

- autenticação por `X-API-Key` nos endpoints de processamento;
- comparação da chave com `crypto.timingSafeEqual`;
- chave obrigatória com no mínimo 32 caracteres;
- Request ID em todas as respostas;
- Helmet e limites de upload;
- health e documentação sem autenticação.

## Evolução

A API foi estruturada para receber novos detectores e parsers sem alterar os consumidores existentes. Cada parser deve preservar campos já publicados e adicionar novos blocos de forma retrocompatível.
