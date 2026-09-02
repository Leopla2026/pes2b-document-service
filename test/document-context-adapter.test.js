const test = require('node:test');
const assert = require('node:assert/strict');

const {
  buildActualContext,
} = require('../src/document/validators/context.adapter');

test('context adapter: extrai contexto do formato DEC POA', () => {
  const result = buildActualContext({
    data: {
      municipality: {
        ibgeCode: '4314902',
        name: 'Porto Alegre',
        uf: 'RS',
      },
      company: {
        cnpj: '49305799000113',
      },
      competence: {
        reference: '2026-07',
      },
    },
  });

  assert.deepStrictEqual(result, {
    cnpj: '49305799000113',
    competence: '2026-07',
    municipality: {
      ibgeCode: '4314902',
      uf: 'RS',
    },
  });
});

test('context adapter: tolera estrutura alternativa', () => {
  const result = buildActualContext({
    data: {
      identificacao: {
        cnpj: '49.305.799/0001-13',
        competencia: '07/2026',
      },
      municipality: {
        ibge: '4314902',
        uf: 'rs',
      },
    },
  });

  assert.deepStrictEqual(result, {
    cnpj: '49.305.799/0001-13',
    competence: '07/2026',
    municipality: {
      ibgeCode: '4314902',
      uf: 'rs',
    },
  });
});

test('context adapter: retorna null quando dados não existem', () => {
  const result = buildActualContext({
    data: {},
  });

  assert.deepStrictEqual(result, {
    cnpj: null,
    competence: null,
    municipality: {
      ibgeCode: null,
      uf: null,
    },
  });
});