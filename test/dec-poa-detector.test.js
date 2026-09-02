const test = require('node:test');
const assert = require('node:assert/strict');

const municipalDetector = require(
  '../src/document/detectors/familias/municipal.detector'
);

test('DEC POA: identifica declaração mensal com confiança alta', () => {
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

  const resultado = municipalDetector.detect(texto);

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
});

test('DEC POA: não classifica texto municipal genérico como DEC POA', () => {
  const texto = `
    Guia de ISSQN
    Competência 07/2026
    Receita de Serviços
    Imposto Devido
    Prefeitura Municipal
  `;

  const resultado = municipalDetector.detect(texto);

  assert.equal(resultado, null);
});

test('DEC POA: não identifica documento sem Prefeitura de Porto Alegre', () => {
  const texto = `
    Declaração Mensal - ISSQN Jul/2026
    RECIBO DE ENTREGA - DECLARAÇÃO MENSAL
    Secretaria Municipal da Fazenda
    DECLARAÇÃO RECEBIDA EM
    IMPOSTO RESPONSABILIDADE PRÓPRIA
  `;

  const resultado = municipalDetector.detect(texto);

  assert.equal(resultado, null);
});

test('DEC POA: não identifica documento sem marcador de declaração mensal ISSQN', () => {
  const texto = `
    Prefeitura de Porto Alegre
    Secretaria Municipal da Fazenda
    RECIBO DE ENTREGA
    ISSQN
    DECLARAÇÃO RECEBIDA EM
    IMPOSTO RESPONSABILIDADE PRÓPRIA
  `;

  const resultado = municipalDetector.detect(texto);

  assert.equal(resultado, null);
});