const test = require('node:test');
const assert = require('node:assert/strict');

const {
  buildExpectedContext,
} = require(
  '../src/document/validators/expected-context.builder'
);

test('expected context builder: monta contexto completo', () => {
  const result = buildExpectedContext({
    expectedCnpj: '49.305.799/0001-13',
    expectedCompetence: '2026-07',
    expectedMunicipalityIbge: '4314902',
    expectedUf: 'RS',
  });

  assert.deepStrictEqual(result, {
    cnpj: '49.305.799/0001-13',
    competence: '2026-07',
    municipality: {
      ibgeCode: '4314902',
      uf: 'RS',
    },
  });
});

test('expected context builder: monta contexto parcial', () => {
  const result = buildExpectedContext({
    expectedCnpj: '49.305.799/0001-13',
  });

  assert.deepStrictEqual(result, {
    cnpj: '49.305.799/0001-13',
  });
});

test('expected context builder: ignora campos vazios', () => {
  const result = buildExpectedContext({
    expectedCnpj: '',
    expectedCompetence: '   ',
    expectedMunicipalityIbge: null,
    expectedUf: undefined,
  });

  assert.equal(result, null);
});

test('expected context builder: retorna null quando body está vazio', () => {
  const result = buildExpectedContext({});

  assert.equal(result, null);
});