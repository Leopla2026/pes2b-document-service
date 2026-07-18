const test = require('node:test');
const assert = require('node:assert/strict');

const detector = require('../src/document/detectors/document.detector');
const { buildResponse } = require('../src/document/engine/engine.response');

test('DAS completo recebe confiança alta', () => {
  const resultado = detector.detectDetailed(`
    DOCUMENTO DE ARRECADAÇÃO DO SIMPLES NACIONAL
    PAGUE COM O PIX
    PAGAR ESTE DOCUMENTO ATÉ
    CÓDIGO PRINCIPAL
  `);

  assert.equal(resultado.documentType, 'DAS');
  assert.ok(resultado.confidence >= 0.9);
  assert.equal(resultado.confidenceLevel, 'HIGH');
  assert.ok(resultado.matchedRules.length >= 3);
});

test('DAS parcial é identificado com confiança baixa', () => {
  const resultado = detector.detectDetailed(`
    DOCUMENTO DE ARRECADAÇÃO DO SIMPLES NACIONAL
    PAGUE COM O PIX
  `);

  assert.equal(resultado.documentType, 'DAS');
  assert.equal(resultado.confidence, 0.72);
  assert.equal(resultado.confidenceLevel, 'LOW');
  assert.ok(resultado.missingRules.length > 0);
});


test('DAS com sinais intermediários recebe confiança média', () => {
  const resultado = detector.detectDetailed(`
    DOCUMENTO DE ARRECADAÇÃO DO SIMPLES NACIONAL
    PAGUE COM O PIX
    CÓDIGO PRINCIPAL
  `);

  assert.equal(resultado.documentType, 'DAS');
  assert.equal(resultado.confidence, 0.81);
  assert.equal(resultado.confidenceLevel, 'MEDIUM');
});

test('resposta bloqueia parser abaixo da confiança mínima', () => {
  const resposta = buildResponse({
    documentType: 'DAS',
    parser: 'das',
    pages: 1,
    data: {},
    text: 'texto parcial',
    detection: {
      confidence: 0.72,
      confidenceLevel: 'LOW',
      family: 'SIMPLES_NACIONAL',
      detector: 'simples.detector',
      matchedRules: ['DOCUMENTO DE ARRECADACAO DO SIMPLES NACIONAL'],
      missingRules: ['CODIGO PRINCIPAL'],
      excludedRules: []
    },
    parserDefinition: {
      version: '1.0.0',
      status: 'active',
      schemaVersion: '1.0',
      minimumConfidence: 0.8
    },
    parserBlocked: true
  });

  assert.equal(resposta.engine.parserExecuted, false);
  assert.equal(resposta.engine.parserBlocked, true);
  assert.equal(resposta.engine.minimumConfidence, 0.8);
  assert.match(resposta.warnings[0], /confiança 0.72 abaixo do mínimo 0.8/);
});
