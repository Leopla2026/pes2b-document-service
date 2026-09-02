const test = require('node:test');
const assert = require('node:assert/strict');

const {
  detectDetailed
} = require(
  '../src/document/detectors/document.detector'
);

test('detector central identifica DEC POA corretamente', () => {
  const texto = `
    Prefeitura de Porto Alegre
    Declaração Mensal - ISSQN Jul/2026

    RECIBO DE ENTREGA - DECLARAÇÃO MENSAL
    Secretaria Municipal da Fazenda

    RECEITA BRUTA
    R$ 5.120,00

    IMPOSTO RESPONSABILIDADE PRÓPRIA
    R$ 40,25

    IMPOSTO RETIDO DE TERCEIROS
    R$ 0,00

    DECLARAÇÃO RECEBIDA EM
    04/08/2026 às 11:49:52
  `;

  const resultado = detectDetailed(texto);

  assert.ok(resultado);

  assert.equal(
    resultado.documentType,
    'DEC_POA_DECLARACAO_MENSAL'
  );

  assert.equal(
    resultado.family,
    'DECLARACAO_MUNICIPAL'
  );

  assert.equal(
    resultado.detector,
    'municipal.detector'
  );

  assert.equal(
    resultado.confidence,
    1
  );

  assert.equal(
    resultado.confidenceLevel,
    'HIGH'
  );
});