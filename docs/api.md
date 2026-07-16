# API — P&S2B Document Service

## Autenticação

Os endpoints de processamento exigem o cabeçalho:

```http
X-API-Key: SUA_CHAVE
```

Os endpoints `/api/v1/health`, `/api/v1/info` e `/openapi.json` são públicos.

## Processar um PDF

```bash
curl -X POST \
  'https://regiflowautomacao-irpf-pdf-reader.ftlz6v.easypanel.host/api/v1/pdf/extract' \
  -H 'X-API-Key: SUA_CHAVE' \
  -F 'file=@documento.pdf;type=application/pdf'
```

## Processar um lote

```bash
curl -X POST \
  'https://regiflowautomacao-irpf-pdf-reader.ftlz6v.easypanel.host/api/v1/pdf/extract-batch' \
  -H 'X-API-Key: SUA_CHAVE' \
  -F 'files=@documento-1.pdf;type=application/pdf' \
  -F 'files=@documento-2.pdf;type=application/pdf'
```

## Relatório do Simples Nacional

A versão 2.0 retorna todas as apurações encontradas:

```json
{
  "data": {
    "resumo": {
      "receitaBrutaMesNumero": "10238.00",
      "valorSimplesRecolherNumero": "332.78",
      "cargaTributariaTotalNumero": 3.2504
    },
    "apuracoes": [
      {
        "anexo": "I",
        "receitaTributadaNumero": 2105,
        "aliquotaEfetivaNumero": 2.64,
        "valorSimplesNumero": 55.57
      }
    ],
    "consolidacaoPorAnexo": [
      {
        "anexo": "I",
        "receitaTributadaNumero": 8378,
        "valorSimplesNumero": 221.18,
        "aliquotaMediaNumero": 2.64
      }
    ]
  }
}
```

`apuracoes` preserva cada segregação tributária. `consolidacaoPorAnexo` agrupa as apurações para relatórios e e-mails.

## Request ID

Toda resposta contém o cabeçalho `X-Request-Id`. Também é possível enviar um identificador próprio no mesmo cabeçalho.
