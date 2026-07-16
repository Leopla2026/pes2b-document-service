# PES2B Document API

## URL base

`https://document.pes2b.com`

## Autenticação

Envie a API Key no cabeçalho `X-API-Key`.

## Endpoints

- `GET /api/v1/health`
- `GET /api/v1/info`
- `GET /openapi.json`
- `POST /api/v1/pdf/extract`
- `POST /api/v1/pdf/extract-batch`

## Processar um PDF

```bash
curl -X POST \
  'https://document.pes2b.com/api/v1/pdf/extract' \
  -H 'X-API-Key: SUA_CHAVE' \
  -F 'file=@documento.pdf;type=application/pdf'
```

## Processar em lote

Envie até 10 PDFs no campo multipart `files`.

## Rastreabilidade

Registre o `requestId` retornado pela API para consulta dos logs.

## Swagger

`https://document.pes2b.com/docs`
