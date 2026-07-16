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

A API devolve um `requestId` no JSON e no cabeçalho `X-Request-Id`. Registre esse identificador para localizar a execução nos logs.

## Swagger

`https://developer.document.pes2b.com/swagger/`

---

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

`src/document/parsers/sped/recibo.ecd.parser.js`

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
  path.join(__dirname, 'sped', 'recibo.ecd.parser.js')
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
