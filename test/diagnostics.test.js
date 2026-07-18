const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

process.env.API_KEY_REQUIRED = 'true';
process.env.API_KEY = 'diagnostics-test-api-key-123456789012345678';

const app = require('../src/app');
const metrics = require('../src/metrics/operational-metrics');

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

test('métricas calculam taxa, média e distribuição', () => {
  metrics.resetForTests();

  metrics.recordDocument({
    success: true,
    documentType: 'DAS',
    engine: {
      confidenceLevel: 'HIGH',
      parserBlocked: false
    },
    errors: []
  }, 100);

  metrics.recordDocument({
    success: true,
    documentType: 'UNKNOWN',
    engine: {
      confidenceLevel: 'LOW',
      parserBlocked: true
    },
    errors: []
  }, 200);

  const snapshot = metrics.snapshot({
    engineVersion: '1.10.0',
    parserDefinitions: [
      { status: 'active' },
      { status: 'inactive' }
    ]
  });

  assert.equal(snapshot.processedDocuments, 2);
  assert.equal(snapshot.successfulDocuments, 2);
  assert.equal(snapshot.successRate, 1);
  assert.equal(snapshot.averageProcessingMs, 150);
  assert.equal(snapshot.blockedByConfidence, 1);
  assert.equal(snapshot.unknownDocuments, 1);
  assert.equal(snapshot.byDocumentType.DAS, 1);
  assert.equal(snapshot.byDocumentType.UNKNOWN, 1);
  assert.equal(snapshot.parsers.active, 1);
  assert.equal(snapshot.parsers.inactive, 1);
});

test('endpoint de diagnóstico exige API Key', async () => {
  metrics.resetForTests();

  await withServer(async baseUrl => {
    const response = await fetch(`${baseUrl}/api/v1/diagnostics`);
    const body = await response.json();

    assert.equal(response.status, 401);
    assert.equal(body.success, false);
    assert.equal(body.errors[0].code, 'UNAUTHORIZED');
  });
});

test('endpoint de diagnóstico reflete documento processado', async () => {
  metrics.resetForTests();

  await withServer(async baseUrl => {
    const form = new FormData();
    form.append('file', pdfBlob('das.pdf'), 'das.pdf');

    const processingResponse = await fetch(
      `${baseUrl}/api/v1/pdf/extract`,
      {
        method: 'POST',
        headers: { 'X-API-Key': API_KEY },
        body: form
      }
    );

    assert.equal(processingResponse.status, 200);

    const response = await fetch(`${baseUrl}/api/v1/diagnostics`, {
      headers: { 'X-API-Key': API_KEY }
    });
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.success, true);
    assert.equal(body.data.engineVersion, '1.10.0');
    assert.equal(body.data.processedDocuments, 1);
    assert.equal(body.data.successfulDocuments, 1);
    assert.equal(body.data.failedDocuments, 0);
    assert.equal(body.data.byDocumentType.DAS, 1);
    assert.ok(body.data.averageProcessingMs >= 0);
    assert.equal(body.data.parsers.active, 6);
    assert.ok(body.requestId);
    assert.equal(body.warnings.length, 1);
  });
});
