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
