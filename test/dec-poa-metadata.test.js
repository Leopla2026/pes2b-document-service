const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const engine = require(
  '../src/document/engine/document.engine'
);

function fixture(nomeArquivo) {
  return fs.readFileSync(
    path.join(
      __dirname,
      'fixtures',
      'municipal',
      'dec-poa',
      nomeArquivo
    )
  );
}

test(
  'DEC POA metadata: adiciona metadados com expected válido',
  async () => {
    const resultado = await engine.process(
      fixture('declaracao-di-lorenzo.pdf'),
      {
        expected: {
          cnpj: '49305799000113',
          competence: '2026-07',
          municipality: {
            ibgeCode: '4314902',
            uf: 'RS'
          }
        }
      }
    );

    assert.equal(
  resultado.documentType,
  'DEC_POA_DECLARACAO_MENSAL'
);

assert.equal(
  resultado.classification,
  'DECLARACAO_MENSAL'
);

assert.deepStrictEqual(
  resultado.confidence,
  {
    company: 1,
    competence: 1,
    financial: 1,
    receipt: 1,
    guide: 1
  }
);

assert.equal(
  resultado.engine.parser,
  'dec-poa'
);

    assert.match(
      resultado.parseId,
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    );

    assert.deepStrictEqual(
      resultado.contract,
      {
        version: '1.0.0',
        adapter: 'dec-poa',
        layoutVersion: '2026.1'
      }
    );

    assert.equal(
      resultado.document.pages,
      4
    );

    assert.equal(
      resultado.document.size,
      fixture('declaracao-di-lorenzo.pdf').length
    );

    assert.match(
      resultado.document.sha256,
      /^[0-9a-f]{64}$/
    );

    assert.equal(
      resultado.processing.engine,
      'pes2b-document-engine'
    );

    assert.equal(
      resultado.processing.engineVersion,
      '1.11.0'
    );

    assert.equal(
      typeof resultado.processing.durationMs,
      'number'
    );

    assert.ok(
      resultado.processing.startedAt
    );

    assert.ok(
      resultado.processing.finishedAt
    );

    assert.equal(
      resultado.validation.valid,
      true
    );

    assert.equal(
      resultado.isExpectedDocument,
      true
    );
  }
);

test(
  'DEC POA metadata: isExpectedDocument false quando contexto diverge',
  async () => {
    const resultado = await engine.process(
      fixture('declaracao-di-lorenzo.pdf'),
      {
        expected: {
          cnpj: '14572545000187',
          competence: '2026-07',
          municipality: {
            ibgeCode: '4314902',
            uf: 'RS'
          }
        }
      }
    );

    assert.equal(
      resultado.validation.valid,
      false
    );

    assert.equal(
      resultado.isExpectedDocument,
      false
    );

    assert.ok(
      resultado.validation.mismatches.length > 0
    );
  }
);

test(
  'DEC POA metadata: isExpectedDocument null sem expected',
  async () => {
    const resultado = await engine.process(
      fixture('declaracao-di-lorenzo.pdf')
    );

    assert.equal(
      resultado.isExpectedDocument,
      null
    );

    assert.equal(
      Object.prototype.hasOwnProperty.call(
        resultado,
        'validation'
      ),
      false
    );
  }
);
