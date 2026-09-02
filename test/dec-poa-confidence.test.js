const test = require('node:test');
const assert = require('node:assert/strict');

const {
  buildDecPoaConfidence
} = require(
  '../src/document/metadata/dec-poa.confidence'
);

test('DEC POA confidence: retorna confiança total com dados completos', () => {
  const result = buildDecPoaConfidence({
    company: {
      cnpj: '49305799000113',
      razaoSocial: 'EMPRESA TESTE LTDA',
      inscricaoMunicipal: '123456'
    },

    competence: {
      year: 2026,
      month: 7,
      reference: '2026-07',
      display: '07/2026'
    },

    financial: {
      servicesRevenue: 0,
      deductions: 0,
      taxBase: 0,
      taxRate: null,
      issOwn: 0,
      issWithheldSubstitution: 0,
      issWithheldFromThirdParties: 34,
      issSolidaryResponsibility: 0,
      issCpom: 0,
      totalTaxDue: 34,
      totalToCollect: 34
    },

    receipt: {
      status: 'ENTREGUE',
      submittedAt: '2026-08-04T19:47:58-03:00',
      authentication:
        'B1 25 D4 97 75 E7 64 DB 2F 5E 3B 85 E5 3C DA 2A'
    },

    guide: {
      present: true,
      collectionCode: '328300332127217',
      dueDate: '2026-09-30',
      generatedAt: '2026-09-02T11:11:00-03:00',
      barcode:
        '816200000007 377434332021 609300430327 830033212721',
      taxAmount: 34,
      amountToPay: 37.74
    }
  });

  assert.deepStrictEqual(
    result,
    {
      company: 1,
      competence: 1,
      financial: 1,
      receipt: 1,
      guide: 1
    }
  );
});

test('DEC POA confidence: guia ausente pode ter confiança 1', () => {
  const result = buildDecPoaConfidence({
    guide: {
      present: false
    }
  });

  assert.equal(
    result.guide,
    1
  );
});

test('DEC POA confidence: retorna null quando grupo está incompleto', () => {
  const result = buildDecPoaConfidence({
    company: {
      cnpj: '49305799000113'
    },

    competence: {},

    financial: {},

    receipt: {},

    guide: {
      present: true
    }
  });

  assert.deepStrictEqual(
    result,
    {
      company: null,
      competence: null,
      financial: null,
      receipt: null,
      guide: null
    }
  );
});