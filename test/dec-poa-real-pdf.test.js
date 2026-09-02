const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const pdfExtractor = require(
  '../src/document/extractors/pdf.extractor'
);

const {
  detectDetailed
} = require(
  '../src/document/detectors/document.detector'
);

async function detectarPdfFixture(nomeArquivo) {
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
  assert.ok(extracao.pages >= 1);

  return {
    extracao,
    deteccao: detectDetailed(extracao.text)
  };
}

test(
  'DEC POA real: identifica declaração com ISS',
  async () => {
    const {
      extracao,
      deteccao
    } = await detectarPdfFixture(
      'declaracao-com-iss.pdf'
    );

    assert.equal(extracao.pages, 2);

    assert.equal(
      deteccao.documentType,
      'DEC_POA_DECLARACAO_MENSAL'
    );

    assert.equal(
      deteccao.family,
      'DECLARACAO_MUNICIPAL'
    );

    assert.equal(
      deteccao.detector,
      'municipal.detector'
    );

    assert.equal(
      deteccao.confidenceLevel,
      'HIGH'
    );
  }
);

test(
  'DEC POA real: identifica declaração sem ISS',
  async () => {
    const {
      extracao,
      deteccao
    } = await detectarPdfFixture(
      'declaracao-sem-iss.pdf'
    );

    assert.equal(extracao.pages, 2);

    assert.equal(
      deteccao.documentType,
      'DEC_POA_DECLARACAO_MENSAL'
    );

    assert.equal(
      deteccao.family,
      'DECLARACAO_MUNICIPAL'
    );

    assert.equal(
      deteccao.detector,
      'municipal.detector'
    );

    assert.equal(
      deteccao.confidenceLevel,
      'HIGH'
    );
  }
);