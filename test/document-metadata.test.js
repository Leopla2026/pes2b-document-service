const test = require('node:test');
const assert = require('node:assert/strict');

const {
  CONTRACT_VERSION,
  createParseId,
  calculateSha256,
  buildContractMetadata,
  buildDocumentMetadata,
  buildProcessingMetadata,
  resolveIsExpectedDocument
} = require(
  '../src/document/metadata/document.metadata'
);

test('metadata: gera parseId UUID', () => {
  const parseId = createParseId();

  assert.match(
    parseId,
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  );
});

test('metadata: calcula SHA-256 do documento', () => {
  const hash = calculateSha256(
    Buffer.from('PES2B')
  );

  assert.equal(
    hash.length,
    64
  );

  assert.match(
    hash,
    /^[0-9a-f]{64}$/
  );
});

test('metadata: monta contrato DEC POA', () => {
  assert.deepStrictEqual(
    buildContractMetadata({
      adapter: 'dec-poa',
      layoutVersion: '2026.1'
    }),
    {
      version: CONTRACT_VERSION,
      adapter: 'dec-poa',
      layoutVersion: '2026.1'
    }
  );
});

test('metadata: monta dados do PDF', () => {
  const buffer = Buffer.from('arquivo');

  const result = buildDocumentMetadata({
    buffer,
    pages: 4
  });

  assert.equal(result.pages, 4);
  assert.equal(result.size, buffer.length);
  assert.equal(result.sha256.length, 64);
});

test('metadata: monta informações de processamento', () => {
  const result = buildProcessingMetadata({
    startedAt: '2026-09-02T17:00:00.000Z',
    finishedAt: '2026-09-02T17:00:00.846Z',
    durationMs: 846.123,
    engineVersion: '1.9.0'
  });

  assert.deepStrictEqual(result, {
    startedAt: '2026-09-02T17:00:00.000Z',
    finishedAt: '2026-09-02T17:00:00.846Z',
    durationMs: 846.12,
    engine: 'pes2b-document-engine',
    engineVersion: '1.9.0'
  });
});

test('metadata: expected document true quando validação é válida', () => {
  assert.equal(
    resolveIsExpectedDocument({
      expected: {
        cnpj: '49305799000113'
      },
      validation: {
        valid: true
      }
    }),
    true
  );
});

test('metadata: expected document false quando existe divergência', () => {
  assert.equal(
    resolveIsExpectedDocument({
      expected: {
        cnpj: '49305799000113'
      },
      validation: {
        valid: false
      }
    }),
    false
  );
});

test('metadata: expected document fica null sem contexto esperado', () => {
  assert.equal(
    resolveIsExpectedDocument({
      expected: null,
      validation: null
    }),
    null
  );
});