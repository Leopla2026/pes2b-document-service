const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

process.env.API_KEY_REQUIRED = 'true';
process.env.API_KEY = 'e2e-test-api-key-123456789012345678901234';

const app = require('../src/app');

const API_KEY = process.env.API_KEY;
const fixtureDir = path.join(__dirname, 'fixtures', 'http');

async function withServer(run) {
  const server = app.listen(0);

  try {
    await new Promise((resolve, reject) => {
      server.once('listening', resolve);
      server.once('error', reject);
    });

    const { port } = server.address();
    await run(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
}

function pdfBlob(filename) {
  const buffer = fs.readFileSync(path.join(fixtureDir, filename));
  return new Blob([buffer], { type: 'application/pdf' });
}

async function postPdf(baseUrl, filename) {
  const form = new FormData();
  form.append('file', pdfBlob(filename), filename);

  return fetch(`${baseUrl}/api/v1/pdf/extract`, {
    method: 'POST',
    headers: {
      'X-API-Key': API_KEY
    },
    body: form
  });
}

test('E2E: health responde sem autenticação e com request id', async () => {
  await withServer(async baseUrl => {
    const response = await fetch(`${baseUrl}/api/v1/health`);
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.success, true);
    assert.equal(body.data.status, 'UP');
    assert.ok(response.headers.get('x-request-id'));
  });
});

test('E2E: upload de DAS percorre HTTP, extração, detecção e parser', async () => {
  await withServer(async baseUrl => {
    const response = await postPdf(baseUrl, 'das.pdf');
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.success, true);
    assert.equal(body.documentType, 'DAS');
    assert.equal(body.engine.version, '1.8.0');
    assert.equal(body.engine.parserExecuted, true);
    assert.equal(body.engine.parserBlocked, false);
    assert.equal(body.data.identificacao.cnpj, '67.600.788/0001-48');
    assert.equal(body.data.identificacao.competencia, '06/2026');
    assert.equal(body.data.valores.valorDocumento, '108,00');
    assert.equal(body.data.datas.vencimento, '20/07/2026');
    assert.ok(body.requestId);
    assert.equal(response.headers.get('x-request-id'), body.requestId);
  });
});

test('E2E: declaração retificadora não é bloqueada por confiança', async () => {
  await withServer(async baseUrl => {
    const response = await postPdf(baseUrl, 'declaracao-retificadora.pdf');
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.documentType, 'DECLARACAO_PGDAS');
    assert.equal(body.engine.parserExecuted, true);
    assert.equal(body.engine.parserBlocked, false);
    assert.ok(body.engine.confidence >= body.engine.minimumConfidence);
    assert.equal(body.data.documento.tipoDeclaracao, 'RETIFICADORA');
    assert.equal(body.data.documento.ehRetificadora, true);
    assert.equal(body.data.identificacao.competencia, '06/2026');
    assert.equal(body.data.resumo.valorDebitoDeclarado, '108,00');
    assert.deepEqual(body.warnings, []);
  });
});

test('E2E: lote processa DAS e recibo mantendo contrato por arquivo', async () => {
  await withServer(async baseUrl => {
    const form = new FormData();
    form.append('files', pdfBlob('das.pdf'), 'das.pdf');
    form.append('files', pdfBlob('recibo-retificadora.pdf'), 'recibo-retificadora.pdf');

    const response = await fetch(`${baseUrl}/api/v1/pdf/extract-batch`, {
      method: 'POST',
      headers: {
        'X-API-Key': API_KEY
      },
      body: form
    });
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.success, true);
    assert.equal(body.totalFiles, 2);
    assert.equal(body.documents.length, 2);

    const das = body.documents.find(item => item.filename === 'das.pdf');
    const recibo = body.documents.find(item => item.filename === 'recibo-retificadora.pdf');

    assert.ok(das);
    assert.ok(recibo);
    assert.equal(das.documentType, 'DAS');
    assert.equal(das.data.valores.valorDocumento, '108,00');
    assert.equal(recibo.documentType, 'RECIBO_PGDAS');
    assert.equal(recibo.data.documento.ehRetificadora, true);
    assert.equal(recibo.data.valores.totalDebitoDeclaradoNumero, 108);
  });
});

test('E2E: ausência de arquivo mantém erro HTTP compatível com o n8n', async () => {
  await withServer(async baseUrl => {
    const form = new FormData();
    const response = await fetch(`${baseUrl}/api/v1/pdf/extract`, {
      method: 'POST',
      headers: {
        'X-API-Key': API_KEY
      },
      body: form
    });
    const body = await response.json();

    assert.equal(response.status, 400);
    assert.equal(body.success, false);
    assert.equal(body.errors[0].code, 'FILE_REQUIRED');
    assert.equal(body.errors[0].field, 'file');
    assert.ok(body.requestId);
  });
});
