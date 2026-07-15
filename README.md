# P&S2B Document Service

Microserviço responsável pela extração, interpretação e manipulação de documentos utilizados nas automações da P&S2B.

## Recursos atuais

- extração de texto de PDFs;
- identificação de documentos do Simples Nacional;
- separação de PDF combinado de declaração e recibo do PGDAS-D;
- leitura de DAS, declaração, recibo, extrato, relatório e declaração de faturamento;
- identificação de declaração original ou retificadora;
- extração do número da declaração, número do recibo, autenticação e transmissão;
- valores numéricos estruturados no recibo do PGDAS-D.

## Retificações do PGDAS-D

Os parsers de declaração e recibo retornam os seguintes metadados:

```json
{
  "tipoDeclaracao": "RETIFICADORA",
  "ehRetificadora": true,
  "tipoDeclaracaoIdentificado": true,
  "numeroDeclaracao": "29223375202606004",
  "numeroRecibo": "01.07.26190.0432924-9"
}
```

A transmissão também é devolvida em formato brasileiro e ISO:

```json
{
  "dataTransmissao": "09/07/2026",
  "horaTransmissao": "20:30:40",
  "dataTransmissaoISO": "2026-07-09T20:30:40-03:00"
}
```

Quando o documento não contém marcador explícito, o parser utiliza:

```json
{
  "tipoDeclaracao": "NAO_IDENTIFICADO",
  "ehRetificadora": false,
  "tipoDeclaracaoIdentificado": false
}
```

## Execução local

```bash
npm install
npm start
```

## Testes

```bash
npm test
```
