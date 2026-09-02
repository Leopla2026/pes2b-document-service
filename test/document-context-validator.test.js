const test = require('node:test');
const assert = require('node:assert/strict');

const {
  validateExpectedContext,
} = require('../src/document/validators/context.validator');

test('context validator: aceita CNPJ esperado igual ao documento', () => {
  const result = validateExpectedContext({
    expected: {
      cnpj: '49.305.799/0001-13',
    },
    actual: {
      cnpj: '49305799000113',
    },
  });

  assert.deepStrictEqual(result, {
    valid: true,
    mismatches: [],
  });
});

test('context validator: rejeita CNPJ diferente do esperado', () => {
  const result = validateExpectedContext({
    expected: {
      cnpj: '49.305.799/0001-13',
    },
    actual: {
      cnpj: '59.208.128/0001-20',
    },
  });

  assert.equal(result.valid, false);
  assert.equal(result.mismatches.length, 1);

  assert.deepStrictEqual(result.mismatches[0], {
    field: 'cnpj',
    expected: '49305799000113',
    actual: '59208128000120',
    code: 'CNPJ_MISMATCH',
  });
});

test('context validator: não exige CNPJ quando ele não foi informado no contexto esperado', () => {
  const result = validateExpectedContext({
    expected: {},
    actual: {
      cnpj: '49.305.799/0001-13',
    },
  });

  assert.deepStrictEqual(result, {
    valid: true,
    mismatches: [],
  });
});

test('context validator: acusa CNPJ ausente no documento quando havia CNPJ esperado', () => {
  const result = validateExpectedContext({
    expected: {
      cnpj: '49.305.799/0001-13',
    },
    actual: {},
  });

  assert.equal(result.valid, false);

  assert.deepStrictEqual(result.mismatches[0], {
    field: 'cnpj',
    expected: '49305799000113',
    actual: null,
    code: 'CNPJ_NOT_FOUND',
  });
});

test('context validator: aceita competência esperada igual ao documento', () => {
  const result = validateExpectedContext({
    expected: {
      competence: '2026-07',
    },
    actual: {
      competence: '2026-07',
    },
  });

  assert.deepStrictEqual(result, {
    valid: true,
    mismatches: [],
  });
});

test('context validator: aceita competência no formato MM/AAAA', () => {
  const result = validateExpectedContext({
    expected: {
      competence: '07/2026',
    },
    actual: {
      competence: '2026-07',
    },
  });

  assert.deepStrictEqual(result, {
    valid: true,
    mismatches: [],
  });
});

test('context validator: rejeita competência diferente da esperada', () => {
  const result = validateExpectedContext({
    expected: {
      competence: '2026-07',
    },
    actual: {
      competence: '2026-08',
    },
  });

  assert.equal(result.valid, false);

  assert.deepStrictEqual(
    result.mismatches[0],
    {
      field: 'competence',
      expected: '2026-07',
      actual: '2026-08',
      code: 'COMPETENCE_MISMATCH',
    }
  );
});

test('context validator: acusa competência ausente quando ela era esperada', () => {
  const result = validateExpectedContext({
    expected: {
      competence: '2026-07',
    },
    actual: {},
  });

  assert.equal(result.valid, false);

  assert.deepStrictEqual(
    result.mismatches[0],
    {
      field: 'competence',
      expected: '2026-07',
      actual: null,
      code: 'COMPETENCE_NOT_FOUND',
    }
  );
});

test('context validator: aceita município e UF esperados', () => {
  const result = validateExpectedContext({
    expected: {
      municipality: {
        ibgeCode: '4314902',
        uf: 'RS',
      },
    },
    actual: {
      municipality: {
        ibgeCode: '4314902',
        uf: 'RS',
      },
    },
  });

  assert.deepStrictEqual(result, {
    valid: true,
    mismatches: [],
  });
});

test('context validator: rejeita código IBGE divergente', () => {
  const result = validateExpectedContext({
    expected: {
      municipality: {
        ibgeCode: '4314902',
      },
    },
    actual: {
      municipality: {
        ibgeCode: '4205407',
      },
    },
  });

  assert.equal(result.valid, false);

  assert.deepStrictEqual(
    result.mismatches[0],
    {
      field: 'municipality.ibgeCode',
      expected: '4314902',
      actual: '4205407',
      code: 'MUNICIPALITY_MISMATCH',
    }
  );
});

test('context validator: rejeita UF divergente', () => {
  const result = validateExpectedContext({
    expected: {
      municipality: {
        uf: 'RS',
      },
    },
    actual: {
      municipality: {
        uf: 'SC',
      },
    },
  });

  assert.equal(result.valid, false);

  assert.deepStrictEqual(
    result.mismatches[0],
    {
      field: 'municipality.uf',
      expected: 'RS',
      actual: 'SC',
      code: 'MUNICIPALITY_MISMATCH',
    }
  );
});

test('context validator: acusa município ausente quando ele era esperado', () => {
  const result = validateExpectedContext({
    expected: {
      municipality: {
        ibgeCode: '4314902',
        uf: 'RS',
      },
    },
    actual: {},
  });

  assert.equal(result.valid, false);

  assert.deepStrictEqual(
    result.mismatches,
    [
      {
        field: 'municipality.ibgeCode',
        expected: '4314902',
        actual: null,
        code: 'MUNICIPALITY_NOT_FOUND',
      },
      {
        field: 'municipality.uf',
        expected: 'RS',
        actual: null,
        code: 'MUNICIPALITY_NOT_FOUND',
      },
    ]
  );
});