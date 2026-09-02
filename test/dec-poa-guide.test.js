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
  'DEC POA guia: extrai dados da Di Lorenzo',
  async () => {
    const resultado = await parseFixture(
      'declaracao-di-lorenzo.pdf'
    );

    assert.deepEqual(
      resultado.guide,
      {
        present: true,
        collectionCode: '328300332127217',
        dueDate: '2026-09-30',
        generatedAt: '2026-09-02T11:11:00-03:00',
        barcode:
          '816200000007 377434332021 609300430327 830033212721',
        taxAmount: 34,
        amountToPay: 37.74,
        revenue: 0
      }
    );
  }
);

test(
  'DEC POA guia: extrai dados da Born Holding',
  async () => {
    const resultado = await parseFixture(
      'declaracao-born.pdf'
    );

    assert.deepEqual(
      resultado.guide,
      {
        present: true,
        collectionCode: '328300592081284',
        dueDate: '2026-09-30',
        generatedAt: '2026-09-02T11:10:00-03:00',
        barcode:
          '816700000119 315934332026 609300430327 830059208124',
        taxAmount: 1019.46,
        amountToPay: 1131.59,
        revenue: 20389.15
      }
    );
  }
);

test(
  'DEC POA guia: retorna null quando não existe guia',
  async () => {
    const resultado = await parseFixture(
      'declaracao-sem-iss.pdf'
    );

    assert.equal(
      resultado.guide,
      null
    );
  }
);