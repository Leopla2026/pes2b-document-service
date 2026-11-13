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

## Documentos fiscais federais

A engine 1.11.0 acrescenta, sem alterar os tipos anteriores:

- `DARF`: retorna todas as linhas em `data.tributos`, com códigos, regime, valores e período mensal ou trimestral;
- `RECIBO_EFD_CONTRIBUICOES`: retorna identificação, blocos PIS/COFINS cumulativos e não cumulativos, CPRB e transmissão;
- `DCTFWEB`: retorna declaração, MIT, responsáveis, todos os débitos e resumo consolidado.
- `RELATORIO_EFD_REINF`: lê o relatório Domínio de consulta do envio dos arquivos da EFD-Reinf. Retorna CNPJ do contribuinte, competência ou intervalo, emissão e `data.eventos` com código Domínio, ambiente, recibo, situação e tipo de envio (inclusive retificação). O documento é destinado somente ao arquivamento: `data.documento.enviarAoCliente` é `false`.

O parser DARF 1.1.0 preserva `documentType: DARF` e os campos anteriores. Cada linha em `data.tributos` identifica também `IRRF`, `INSS` ou `CRF` quando aplicável. Os códigos inicialmente mapeados são 1708/8045 (IRRF), 1162 (INSS) e 5952 (CRF), conforme os layouts atendidos. Códigos não mapeados e descrições ambíguas exigem conferência; o serviço não calcula a obrigação tributária.

`data.retencoes` consolida principal, multa, juros e total por tributo. Uma guia unificada continua sendo um só documento. `valorTotalGuia` representa o cabeçalho e `total` representa somente as linhas de retenção; guias mistas, divergências de valores ou competências e códigos não mapeados são sinalizados por `requerAnalise` e `motivos`. O CNPJ do prestador dentro da composição não substitui o CNPJ do contribuinte.

No relatório Reinf, `data.resumo.situacaoDeclaracao` permanece `NAO_INFERIDA`, mesmo que todos os eventos apresentados tenham sucesso. Situações como processando ou invalidado, linhas não interpretadas, ambiente não oficial ou divergência de empresa/período são preservadas para conferência. Relatórios de várias competências não recebem automaticamente uma única `identificacao.competencia`.

Em DARFs trimestrais, o vencimento não é usado como competência. Quando o PDF não informa o número da quota, `data.parcelamento.numeroQuota` permanece `null`.

## Request ID

Toda resposta contém o cabeçalho `X-Request-Id`. Também é possível enviar um identificador próprio no mesmo cabeçalho.
