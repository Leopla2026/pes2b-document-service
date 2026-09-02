const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const pdfExtractor = require(
  '../src/document/extractors/pdf.extractor'
);

const decPoaParser = require(
  '../src/document/parsers/municipal/dec-poa'
);

async function parseFixture(nomeArquivo) {
  const caminho = path.join(
    __dirname,
    'fixtures',
    'municipal',
    'dec-poa',
    nomeArquivo
  );

  const buffer = fs.readFileSync(caminho);

  const extracao = await pdfExtractor.extract(buffer);

  assert.equal(extracao.success, true);
  assert.ok(extracao.text);

  return decPoaParser.parse(extracao.text);
}

test(
  'DEC POA financeiro: 4 LEDS',
  async () => {
    const resultado = await parseFixture(
      'declaracao-com-iss.pdf'
    );

    assert.deepEqual(
      resultado.financial,
      {
        servicesRevenue: 5120,
        deductions: 0,
        taxBase: 1610,
        taxRate: null,
        issOwn: 40.25,
        issWithheldSubstitution: -40.25,
        issWithheldFromThirdParties: 0,
        issSolidaryResponsibility: 0,
        issCpom: 0,
        totalTaxDue: 0,
        totalToCollect: 0
      }
    );
  }
);

test(
  'DEC POA financeiro: Laura Tomasi',
  async () => {
    const resultado = await parseFixture(
      'declaracao-sem-iss.pdf'
    );

    assert.deepEqual(
      resultado.financial,
      {
        servicesRevenue: 14560,
        deductions: 0,
        taxBase: 14560,
        taxRate: null,
        issOwn: 0,
        issWithheldSubstitution: 0,
        issWithheldFromThirdParties: 0,
        issSolidaryResponsibility: 0,
        issCpom: 0,
        totalTaxDue: 0,
        totalToCollect: 0
      }
    );
  }
);

test(
  'DEC POA financeiro: Di Lorenzo',
  async () => {
    const resultado = await parseFixture(
      'declaracao-di-lorenzo.pdf'
    );

    assert.deepEqual(
      resultado.financial,
      {
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
      }
    );
  }
);

test(
  'DEC POA financeiro: Born Holding',
  async () => {
    const resultado = await parseFixture(
      'declaracao-born.pdf'
    );

    assert.deepEqual(
      resultado.financial,
      {
        servicesRevenue: 20389.15,
        deductions: 0,
        taxBase: 20389.15,
        taxRate: null,
        issOwn: 1019.46,
        issWithheldSubstitution: 0,
        issWithheldFromThirdParties: 0,
        issSolidaryResponsibility: 0,
        issCpom: 0,
        totalTaxDue: 1019.46,
        totalToCollect: 1019.46
      }
    );
  }
);