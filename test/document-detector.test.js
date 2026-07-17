const test = require('node:test');
const assert = require('node:assert/strict');

const detector = require('../src/document/detectors/document.detector');

test('detector detalhado identifica recibo PGDAS e preserva compatibilidade', () => {
  const texto = 'RECIBO DE ENTREGA DA APURAÇÃO NO PGDAS-D';

  const detalhado = detector.detectDetailed(texto);

  assert.equal(detalhado.documentType, 'RECIBO_PGDAS');
  assert.equal(detalhado.family, 'SIMPLES_NACIONAL');
  assert.equal(detalhado.confidence, 1);
  assert.ok(detalhado.matchedRules.length > 0);

  assert.equal(detector.detect(texto), 'RECIBO_PGDAS');
});

test('detector retorna UNKNOWN quando nenhuma regra é atendida', () => {
  const resultado = detector.detectDetailed('DOCUMENTO SEM PADRAO CONHECIDO');

  assert.equal(resultado.documentType, 'UNKNOWN');
  assert.equal(resultado.family, 'UNKNOWN');
  assert.equal(resultado.confidence, 0);
});
