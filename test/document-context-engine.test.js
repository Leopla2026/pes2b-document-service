const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const engine = require(
  '../src/document/engine/document.engine'
);

const fixturePath = path.join(
  __dirname,
  'fixtures',
  'municipal',
  'dec-poa',
  'declaracao-di-lorenzo.pdf'
);

test('engine: valida contexto correto do DEC POA', async () => {
  const buffer = fs.readFileSync(fixturePath);

  const result = await engine.process(
    buffer,
    {
      expected: {
        cnpj: '49.305.799/0001-13',
        competence: '2026-07',
        municipality: {
          ibgeCode: '4314902',
          uf: 'RS',
        },
      },
    }
  );

  assert.equal(
    result.documentType,
    'DEC_POA_DECLARACAO_MENSAL'
  );

  assert.deepStrictEqual(
    result.validation,
    {
      valid: true,
      mismatches: [],
    }
  );
});

test('engine: identifica CNPJ divergente no DEC POA', async () => {
  const buffer = fs.readFileSync(fixturePath);

  const result = await engine.process(
    buffer,
    {
      expected: {
        cnpj: '14.572.545/0001-87',
        competence: '2026-07',
        municipality: {
          ibgeCode: '4314902',
          uf: 'RS',
        },
      },
    }
  );

  assert.equal(
    result.validation.valid,
    false
  );

  assert.deepStrictEqual(
    result.validation.mismatches,
    [
      {
        field: 'cnpj',
        expected: '14572545000187',
        actual: '49305799000113',
        code: 'CNPJ_MISMATCH',
      },
    ]
  );
});

test('engine: identifica competência divergente no DEC POA', async () => {
  const buffer = fs.readFileSync(fixturePath);

  const result = await engine.process(
    buffer,
    {
      expected: {
        cnpj: '49.305.799/0001-13',
        competence: '2026-08',
        municipality: {
          ibgeCode: '4314902',
          uf: 'RS',
        },
      },
    }
  );

  assert.equal(
    result.validation.valid,
    false
  );

  assert.deepStrictEqual(
    result.validation.mismatches,
    [
      {
        field: 'competence',
        expected: '2026-08',
        actual: '2026-07',
        code: 'COMPETENCE_MISMATCH',
      },
    ]
  );
});

test('engine: mantém resposta antiga quando expected não é informado', async () => {
  const buffer = fs.readFileSync(fixturePath);

  const result = await engine.process(buffer);

  assert.equal(
    Object.prototype.hasOwnProperty.call(
      result,
      'validation'
    ),
    false
  );
});