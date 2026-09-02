const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const pdfExtractor = require(
  '../src/document/extractors/pdf.extractor'
);

const decPoaParser = require(
  '../src/document/parsers/municipal/dec-poa/parser'
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
  'DEC POA parser básico: extrai identificação da 4 LEDS',
  async () => {
    const resultado = await parseFixture(
      'declaracao-com-iss.pdf'
    );

    assert.deepEqual(
      resultado.company,
      {
        cnpj: '14572545000187',
        razaoSocial: '4 LEDS COMPONENTES ELÉTRICOS LTDA.',
        inscricaoMunicipal: '256657-2-3'
      }
    );

    assert.deepEqual(
      resultado.competence,
      {
        year: 2026,
        month: 7,
        reference: '2026-07',
        display: '07/2026'
      }
    );
  }
);

test(
  'DEC POA parser básico: extrai identificação da Laura Tomasi',
  async () => {
    const resultado = await parseFixture(
      'declaracao-sem-iss.pdf'
    );

    assert.deepEqual(
      resultado.company,
      {
        cnpj: '64267643000189',
        razaoSocial: 'LAURA TOMASI PSICANALISE LTDA',
        inscricaoMunicipal: '957292-2-4'
      }
    );

    assert.deepEqual(
      resultado.competence,
      {
        year: 2026,
        month: 7,
        reference: '2026-07',
        display: '07/2026'
      }
    );
  }
);