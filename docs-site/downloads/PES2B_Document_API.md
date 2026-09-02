# PES2B Document API

## URL base

`https://document.pes2b.com`


## Versões atuais

- **API pública:** `2.0.0`
- **Engine documental:** `1.10.0`
- **Rota principal:** `/api/v1`

A versão da API representa o contrato público. A versão da engine identifica a evolução interna de detecção, parsers, confiança e métricas.

## Autenticação

Envie a API Key no cabeçalho `X-API-Key`.

## Endpoints

- `GET /api/v1/health`
- `GET /api/v1/info`
- `GET /openapi.json`
- `POST /api/v1/pdf/extract`
- `POST /api/v1/pdf/extract-batch`
- `GET /api/v1/diagnostics`

## Processar um PDF

```bash
curl -X POST \
  'https://document.pes2b.com/api/v1/pdf/extract' \
  -H 'X-API-Key: SUA_CHAVE' \
  -F 'file=@documento.pdf;type=application/pdf'
```

### Validação opcional de contexto

O endpoint individual aceita campos multipart opcionais:

- `expectedCnpj`
- `expectedCompetence` (`AAAA-MM` ou `MM/AAAA`)
- `expectedMunicipalityIbge`
- `expectedUf`

Quando ao menos um desses campos é informado, a resposta inclui `validation`. Somente os campos enviados são comparados. Sem contexto esperado, a chamada mantém o contrato anterior.

```bash
curl -X POST \
  'https://document.pes2b.com/api/v1/pdf/extract' \
  -H 'X-API-Key: SUA_CHAVE' \
  -F 'file=@dec-poa.pdf;type=application/pdf' \
  -F 'expectedCnpj=12.345.678/0001-90' \
  -F 'expectedCompetence=2026-07' \
  -F 'expectedMunicipalityIbge=4314902' \
  -F 'expectedUf=RS'
```

A divergência é informada em `validation.valid = false`; o consumidor decide se deve interromper o processo.

## Documentos reconhecidos

| Tipo | `documentType` | Dados principais |
|---|---|---|
| Declaração PGDAS-D | `DECLARACAO_PGDAS` | Competência, receitas, débito, número da declaração, recibo e tipo original/retificadora. |
| Recibo PGDAS-D | `RECIBO_PGDAS` | Número do recibo, transmissão, CNPJ, competência, receita e débitos. |
| Guia DAS | `DAS` | Empresa, CNPJ, competência, número do documento, valor e vencimento. |
| Extrato PGDAS-D | `EXTRATO_PGDAS` | Identificação do documento; parser detalhado ainda em evolução. |
| Relatório do Simples | `RELATORIO_SIMPLES` | Resumo, RBT12, apurações, consolidação por anexo e carga tributária. |
| Declaração de faturamento | `DECLARACAO_FATURAMENTO` | Período, faturamento mensal, total, emissão, responsável e validações. |
| Declaração + recibo PGDAS no mesmo PDF | `COMBINADO_DECLARACAO_RECIBO_PGDAS` | Separação automática em dois documentos estruturados. |
| DEC Porto Alegre — Declaração Mensal de ISSQN | `DEC_POA_DECLARACAO_MENSAL` | Empresa, competência, município, valores fiscais, recibo, guia opcional, validação de contexto e PDFs separados. |
| Documento não reconhecido | `NAO_IDENTIFICADO` | Metadados técnicos e indicação para conferência manual. |

## Processar em lote

Envie até 10 PDFs no campo multipart `files`.

## Rastreabilidade

A API devolve um `requestId` no JSON e no cabeçalho `X-Request-Id`. Registre esse identificador para localizar a execução nos logs.

## Swagger

`https://developer.document.pes2b.com/swagger/`

---


## Diagnóstico operacional

```http
GET /api/v1/diagnostics
X-API-Key: SUA_CHAVE
```

O endpoint protegido retorna métricas operacionais acumuladas desde o último início do serviço:

- `processedDocuments`: total de documentos contabilizados;
- `successfulDocuments`: documentos processados com sucesso;
- `failedDocuments`: documentos com falha;
- `successRate`: proporção de sucesso entre `0` e `1`;
- `blockedByConfidence`: parsers bloqueados por confiança insuficiente;
- `unknownDocuments`: documentos não reconhecidos;
- `rejectedUploads`: uploads rejeitados antes do processamento;
- `averageProcessingMs`: tempo médio de processamento;
- `parsers`: quantidade total, ativa e inativa;
- `byDocumentType`: volume por tipo documental;
- `byConfidenceLevel`: volume nos níveis `HIGH`, `MEDIUM` e `LOW`.

Exemplo:

```json
{
  "success": true,
  "message": "Diagnóstico operacional do serviço.",
  "requestId": "a1cb5279-4b56-442d-876c-bf4b1ae23aca",
  "data": {
    "service": "pes2b-document-service",
    "environment": "production",
    "engineVersion": "1.10.0",
    "uptimeSeconds": 104,
    "processedDocuments": 0,
    "successfulDocuments": 0,
    "failedDocuments": 0,
    "successRate": 1,
    "blockedByConfidence": 0,
    "unknownDocuments": 0,
    "rejectedUploads": 0,
    "averageProcessingMs": 0,
    "parsers": { "total": 7, "active": 7, "inactive": 0 },
    "byDocumentType": {},
    "byConfidenceLevel": { "HIGH": 0, "MEDIUM": 0, "LOW": 0 }
  },
  "errors": [],
  "warnings": [
    "As métricas são mantidas em memória e reiniciadas quando o serviço é reiniciado."
  ]
}
```

> Nesta versão, as métricas não são persistidas. Um reinício ou novo deploy zera os contadores. A persistência histórica será tratada em evolução posterior.

## Metadados da engine e confiança

A resposta de processamento pode incluir o objeto `engine`, com dados técnicos de auditoria:

```json
{
  "engine": {
    "version": "1.10.0",
    "family": "SIMPLES_NACIONAL",
    "detector": "simples.detector",
    "parser": "declaracao",
    "parserVersion": "1.0.0",
    "parserStatus": "active",
    "schemaVersion": "1.0",
    "confidence": 1,
    "confidenceLevel": "HIGH",
    "minimumConfidence": 0.8,
    "parserExecuted": true,
    "parserBlocked": false,
    "matchedRules": [],
    "missingRules": [],
    "excludedRules": []
  }
}
```

Os níveis são: `HIGH` para confiança igual ou superior a `0.90`, `MEDIUM` a partir de `0.75` e `LOW` abaixo de `0.75`. Cada parser pode definir seu próprio `minimumConfidence`. Abaixo desse limite, o tipo pode ser identificado, mas o parser é bloqueado para evitar extração incorreta.

## Arquitetura e qualidade

A engine `1.10.0` utiliza:

- detectores organizados por família documental;
- registry central de parsers com versão, status e schema;
- módulos de parser com `index.js`, `parser.js`, `schema.js` e `rules.js`;
- validadores de contexto esperado;
- splitters documentais para PDFs compostos;
- fixtures anonimizadas;
- testes unitários, de contrato e end-to-end;
- logs estruturados em JSON;
- rastreamento por `requestId`;
- métricas operacionais em memória;
- contrato DEC POA 1.0.0 homologado em produção após 115 testes automatizados aprovados.

## Declarações municipais — DEC Porto Alegre

O tipo `DEC_POA_DECLARACAO_MENSAL` pertence à família `DECLARACAO_MUNICIPAL` e utiliza o parser `dec-poa`.

A API extrai:

- `data.company`: CNPJ, razão social e inscrição municipal;
- `data.competence`: ano, mês, referência `AAAA-MM` e exibição `MM/AAAA`;
- `data.municipality`: código IBGE, nome, UF e `portal` (`vendor`, `name`, `url`);
- `data.financial`: receita, deduções, base, `taxRate`, ISS próprio, retenções, imposto devido e total a recolher. `taxRate` é `null` quando a alíquota não estiver explicitamente presente e nunca é inferida;
- `data.receipt`: situação da entrega, data/hora e autenticação;
- `data.guide`: dados da guia quando existente.


### Contrato municipal 1.0.0

O DEC POA adiciona, sem remover ou renomear campos existentes:

- `parseId`: UUID único por interpretação;
- `contract`: `version=1.0.0`, `adapter=dec-poa`, `layoutVersion=2026.1`;
- `document`: SHA-256 do PDF original, número de páginas e tamanho em bytes;
- `processing`: `startedAt`, `finishedAt`, `durationMs`, `engine=pes2b-document-engine` e `engineVersion=1.9.0`;
- `isExpectedDocument`: `true` quando o contexto esperado foi enviado e validado, `false` quando diverge e `null` quando não foi enviado;
- `classification`: atualmente `DECLARACAO_MENSAL`; enum preparado para `DECLARACAO_RETIFICADORA`, `DECLARACAO_SEM_MOVIMENTO`, `DECLARACAO_COM_MOVIMENTO`, `GUIA_AVULSA`, `RECIBO` e `OUTRO`;
- `confidence`: `company`, `competence`, `financial`, `receipt` e `guide`. `1` significa que os campos mínimos objetivos estão presentes; `null` significa evidência insuficiente. Não é uma probabilidade estatística.

Roles preparados no contrato: `DECLARACAO`, `GUIA`, `RECIBO`, `PROTOCOLO`, `RELATORIO`, `ANEXO` e `OUTRO`.

### Separação física automática

O PDF original é classificado página a página e devolvido também no array `documents`:

- `DECLARACAO`: obrigatório; pode conter uma ou mais páginas;
- `GUIA`: opcional;
- `RECIBO`: obrigatório.

Cada item contém:

```json
{
  "role": "GUIA",
  "suggestedSuffix": "guia",
  "fileName": "EMPRESA_EXEMPLO_LTDA__12345678000190__07-2026_guia.pdf",
  "pages": [3],
  "file": {
    "fileName": "EMPRESA_EXEMPLO_LTDA__12345678000190__07-2026_guia.pdf",
    "mimeType": "application/pdf",
    "extension": "pdf",
    "size": 13000,
    "base64": "JVBERi0xLjcKLi4u"
  }
}
```

Padrão do nome:

`RAZAO_SOCIAL__CNPJ__MM-AAAA_sufixo.pdf`

Sufixos atuais: `declaracao`, `guia` e `recibo`.

Quando não existe guia, o array `documents` contém somente `DECLARACAO` e `RECIBO`.

### Exemplo de resposta DEC POA

```json
{
  "success": true,
  "documentType": "DEC_POA_DECLARACAO_MENSAL",
  "classification": "DECLARACAO_MENSAL",
  "parseId": "e495bf27-fc09-47fc-b7c3-101801946144",
  "contract": { "version": "1.0.0", "adapter": "dec-poa", "layoutVersion": "2026.1" },
  "document": { "sha256": "82cea2978caabcf03a391037f3600331e6f8dbf3a30eff1590d00707cb85c473", "pages": 4, "size": 21807 },
  "processing": { "durationMs": 682, "engine": "pes2b-document-engine", "engineVersion": "1.9.0" },
  "isExpectedDocument": true,
  "confidence": { "company": 1, "competence": 1, "financial": 1, "receipt": 1, "guide": 1 },
  "compound": true,
  "engine": {
    "family": "DECLARACAO_MUNICIPAL",
    "parser": "dec-poa",
    "confidence": 1,
    "confidenceLevel": "HIGH",
    "parserExecuted": true
  },
  "data": {
    "municipality": {
      "ibgeCode": "4314902",
      "name": "Porto Alegre",
      "uf": "RS",
      "portal": { "vendor": "DEC", "name": "DEC POA", "url": null }
    },
    "company": {
      "cnpj": "12345678000190",
      "razaoSocial": "EMPRESA EXEMPLO PORTO ALEGRE LTDA.",
      "inscricaoMunicipal": "123456-7-8"
    },
    "competence": {
      "year": 2026,
      "month": 7,
      "reference": "2026-07",
      "display": "07/2026"
    },
    "financial": {
      "servicesRevenue": 20000,
      "taxRate": null,
      "issOwn": 1000,
      "issWithheldFromThirdParties": 0,
      "totalTaxDue": 1000,
      "totalToCollect": 1000
    },
    "receipt": {
      "status": "ENTREGUE",
      "submittedAt": "2026-08-04T19:19:45-03:00",
      "authentication": "AA BB CC DD EE FF 00 11 22 33 44 55 66 77 88 99"
    },
    "guide": {
      "present": true,
      "collectionCode": "328300123456789",
      "dueDate": "2026-09-30",
      "generatedAt": "2026-09-02T11:10:00-03:00",
      "barcode": "816700000119 315934332026 609300430327 830012345678",
      "taxAmount": 1000,
      "amountToPay": 1110,
      "revenue": 20000
    }
  },
  "validation": {
    "valid": true,
    "mismatches": []
  },
  "documents": [
    { "role": "DECLARACAO", "pages": [1, 2], "fileName": "..._declaracao.pdf" },
    { "role": "GUIA", "pages": [3], "fileName": "..._guia.pdf" },
    { "role": "RECIBO", "pages": [4], "fileName": "..._recibo.pdf" }
  ]
}
```

### Integração n8n homologada

O subfluxo `PES2B | Declarações Municipais | Interpretar PDF` foi homologado com o contrato:

```text
Entrada:
json.system = DEC_POA
json.expected.cnpj
json.expected.competence
json.expected.municipality.ibgeCode
json.expected.municipality.uf
binary.pdf

Saída:
um item por documento
json.role = DECLARACAO | GUIA | RECIBO
binary.file = PDF separado
```

O fluxo principal continua responsável por SharePoint, arquivamento, envio ao cliente e demais regras de negócio.

# Como incluir um novo documento no parser

A inclusão de um documento envolve mais do que criar uma expressão regular. É necessário definir o contrato de retorno, identificar o PDF com segurança, implementar o parser, criar testes, documentar e homologar o fluxo consumidor.

## Exemplo de necessidade

> Ler o recibo de entrega de um SPED.

Antes de desenvolver, deve ser definido qual SPED será suportado: ECD, ECF, EFD ICMS/IPI, EFD-Contribuições ou outro. Os títulos, campos e leiautes podem variar entre módulos e versões.

## 1. Reunir amostras reais

Forneça preferencialmente de 3 a 5 PDFs do mesmo documento:

- empresas diferentes;
- períodos diferentes;
- versões diferentes do programa, quando houver;
- uma amostra com todos os campos;
- uma amostra com campo opcional ausente.

Os dados podem ser anonimizados, mas os rótulos, posições e estrutura textual devem ser preservados.

## 2. Definir o contrato de saída

Antes do código, liste os campos que a API precisa devolver. Para um recibo da ECD, por exemplo:

- razão social;
- CNPJ;
- período inicial e final;
- número do recibo;
- hash da escrituração;
- data e hora da transmissão;
- situação;
- versão do programa, quando disponível.

Defina também:

- nome do `documentType`;
- campos obrigatórios;
- campos opcionais;
- formato de datas e números;
- comportamento quando um campo não for encontrado.

Campos ausentes devem retornar `null`. A API não deve inventar valores.

## 3. Analisar o texto extraído

A API usa `pdf-parse`. Antes de escrever o parser, processe as amostras e examine o texto bruto. O texto pode vir com:

- colunas concatenadas;
- quebras de linha removidas;
- acentos normalizados de forma diferente;
- rótulos e valores em ordem inesperada.

As regras devem ser construídas sobre o texto realmente extraído, e não apenas sobre a aparência visual do PDF.

## 4. Criar a regra de detecção

Arquivo:

`src/document/detectors/document.detector.js`

Exemplo ilustrativo para ECD:

```javascript
if (
  normalized.includes('RECIBO DE ENTREGA DE ESCRITURAÇÃO CONTÁBIL DIGITAL') &&
  normalized.includes('IDENTIFICAÇÃO DO ARQUIVO') &&
  normalized.includes('HASH DA ESCRITURAÇÃO')
) {
  return 'RECIBO_SPED_ECD';
}
```

Regras específicas devem ficar antes de regras genéricas. Evite identificar um documento usando apenas uma expressão comum, como `RECIBO DE ENTREGA`.

## 5. Implementar o parser

Caminho sugerido:

`src/document/parsers/sped/recibo-ecd/parser.js`

Estrutura sugerida:

```javascript
exports.parse = (text) => ({
  identificacao: {
    empresa: extrairEmpresa(text),
    cnpj: extrairCnpj(text),
    periodo: extrairPeriodo(text)
  },
  documento: {
    tipo: 'RECIBO_SPED_ECD',
    numeroRecibo: extrairNumeroRecibo(text),
    hashEscrituracao: extrairHash(text)
  },
  transmissao: {
    dataHora: extrairDataHora(text),
    situacao: extrairSituacao(text)
  },
  extras: {}
});
```

Reutilize helpers de `src/document/helpers/` para CNPJ, datas, competência e valores. Crie um helper novo apenas quando a regra for reutilizável.

## 6. Registrar o parser

Arquivo:

`src/document/parsers/registry.js`

```javascript
RECIBO_SPED_ECD: require(
  path.join(__dirname, 'sped', 'recibo-ecd')
)
```

O texto retornado pelo detector deve ser exatamente igual à chave do registry.

## 7. Criar testes automatizados

Crie, por exemplo:

`test/recibo-sped-ecd.test.js`

Os testes devem cobrir:

1. identificação correta do documento;
2. extração de todos os campos obrigatórios;
3. campo opcional ausente;
4. variação de espaços e quebras de linha;
5. documento semelhante que não deve ser classificado como ECD;
6. valores anonimizados e previsíveis.

Execute:

```bash
npm test
```

Nenhum teste existente pode deixar de passar.

## 8. Atualizar OpenAPI e documentação

Atualize:

- `docs/openapi.json`;
- `docs-site/openapi.json`;
- `docs-site/index.html`;
- `docs-site/downloads/PES2B_Document_API.md`;
- `CHANGELOG.md`.

Inclua:

- novo `documentType`;
- schema do objeto `data`;
- exemplo JSON anonimizado;
- campos obrigatórios e opcionais;
- warnings conhecidos.

## 9. Versionar e publicar

Fluxo recomendado:

1. criar branch de desenvolvimento;
2. implementar em commits pequenos;
3. executar `npm test`;
4. revisar o Swagger local;
5. atualizar a versão e o changelog;
6. abrir PR para `main`;
7. fazer deploy no EasyPanel;
8. testar `/api/v1/health` e `/api/v1/info`;
9. enviar uma amostra real ao endpoint de extração.

## 10. Ajustar o workflow consumidor

A API e o n8n possuem responsabilidades diferentes.

A API:

- identifica o documento;
- extrai dados;
- devolve JSON estruturado.

O n8n:

- decide a pasta de destino;
- renomeia ou move o arquivo;
- atualiza SharePoint ou PostgreSQL;
- dispara conferência, e-mail ou outra automação;
- registra o `requestId` e o resultado.

Portanto, após a API reconhecer `RECIBO_SPED_ECD`, o workflow deve incluir uma regra para esse novo tipo.

## Exemplo de resposta anonimizada

```json
{
  "success": true,
  "documentType": "RECIBO_SPED_ECD",
  "pages": 1,
  "data": {
    "identificacao": {
      "empresa": "EMPRESA EXEMPLO LTDA.",
      "cnpj": "12.345.678/0001-90",
      "periodo": {
        "inicio": "01/01/2025",
        "fim": "31/12/2025"
      }
    },
    "documento": {
      "tipo": "RECIBO_SPED_ECD",
      "numeroRecibo": "ECD-EXEMPLO-000001",
      "hashEscrituracao": "HASH_ANONIMIZADO"
    },
    "transmissao": {
      "dataHora": "30/06/2026 18:42:10",
      "situacao": "RECEBIDA"
    },
    "extras": {}
  },
  "warnings": [],
  "errors": [],
  "requestId": "00000000-0000-4000-8000-000000000100"
}
```

## Critérios mínimos de aceite

- O novo documento é reconhecido em todas as amostras de homologação.
- Documentos parecidos não geram falso positivo.
- Os campos obrigatórios estão cobertos por testes.
- Campos ausentes retornam `null`.
- O JSON mantém o padrão estrutural da API.
- Swagger, portal, Markdown e changelog estão atualizados.
- O workflow consumidor reconhece o novo `documentType`.
- Uma chamada real foi validada após o deploy.
