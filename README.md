# P&S2B Document Service

API para extração e estruturação de documentos usados nas automações da P&S2B.

## Recursos

- identificação e leitura de PDFs do Simples Nacional;
- declaração, recibo, DAS, extrato, relatório e declaração de faturamento;
- declaração original e retificadora;
- separação de declaração e recibo combinados;
- múltiplas apurações e consolidação por anexo;
- autenticação por API Key;
- Request ID, OpenAPI e portal de desenvolvedores.

## Configuração

Copie `.env.example` para `.env` e defina uma chave com pelo menos 32 caracteres:

```bash
openssl rand -hex 32
```

```env
PORT=3000
APP_ENV=production
API_KEY_REQUIRED=true
API_KEY=CHAVE_GERADA
```

Nunca grave a chave real no Git.

## Execução

```bash
npm install
npm start
```

## Testes

```bash
npm test
```

## Endpoints

- `GET /api/v1/health` — público;
- `GET /api/v1/info` — público;
- `GET /openapi.json` — público;
- `POST /api/v1/pdf/extract` — exige `X-API-Key`;
- `POST /api/v1/pdf/extract-batch` — exige `X-API-Key`.

A documentação detalhada está em [`docs/api.md`](docs/api.md).

## Arquitetura 1.7.0 - confiança ponderada

- detecção documental baseada em sinais ponderados;
- níveis de confiança HIGH, MEDIUM e LOW;
- auditoria de regras encontradas e ausentes;
- bloqueio seguro do parser abaixo de `minimumConfidence`;
- compatibilidade preservada com `documentType` e endpoints existentes.
## Estrutura padronizada dos parsers

Cada tipo documental deve utilizar a seguinte estrutura:

```text
src/document/parsers/<familia>/<tipo>/
├── index.js
├── parser.js
├── schema.js
└── rules.js
```

- `parser.js`: implementação da extração dos dados.
- `schema.js`: versão e campos obrigatórios esperados.
- `rules.js`: tipo documental, família, versão e confiança mínima.
- `index.js`: ponto único de exportação do parser e dos metadados.

Os caminhos antigos foram preservados por wrappers para evitar quebra de integrações e testes existentes.


## Fixtures e testes de contrato

A suíte mantém amostras textuais anonimizadas em `test/fixtures/simples`. Elas representam os formatos aceitos pelos detectores e parsers sem armazenar PDFs reais de clientes.

Cada fixture positiva valida: tipo documental, confiança mínima, parser registrado e campos essenciais. A pasta `negativos` contém textos semelhantes a documentos fiscais que não devem ser classificados.

Para executar:

```bash
npm ci
npm test
```

A Etapa 5 possui 31 testes automatizados.

## Testes end-to-end

Além dos testes unitários e de contrato, o projeto possui testes end-to-end em `test/e2e-api.test.js`.

Esses testes iniciam a aplicação em uma porta temporária e validam o fluxo completo:

```text
upload multipart do PDF
→ middleware de autenticação
→ extração do texto
→ detecção documental
→ execução do parser
→ resposta HTTP consumida pelo n8n
```

As amostras PDF ficam em `test/fixtures/http/` e contêm somente dados fictícios.

## Observabilidade

A API gera logs estruturados em JSON para facilitar a consulta no EasyPanel e a correlação com o n8n. Cada requisição possui um `requestId`.

Principais eventos:

- `request_started` e `request_completed`;
- `document_processed`;
- `batch_document_processed` e `batch_completed`;
- `document_rejected`, `upload_failed` e `request_failed`.

Os logs incluem duração, tipo documental, confiança, parser, quantidade de páginas e motivo de bloqueio, sem registrar o texto integral do PDF.
