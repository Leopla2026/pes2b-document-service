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
  'DEC POA recibo: extrai dados da 4 LEDS',
  async () => {
    const resultado = await parseFixture(
      'declaracao-com-iss.pdf'
    );

    assert.deepEqual(
      resultado.receipt,
      {
        status: 'ENTREGUE',
        submittedAt: '2026-08-04T11:49:52-03:00',
        authentication:
          '8C DF 31 25 9B 54 3B 10 58 AF CD F5 CB AE 0C 0A'
      }
    );
  }
);

test(
  'DEC POA recibo: extrai dados da Laura Tomasi',
  async () => {
    const resultado = await parseFixture(
      'declaracao-sem-iss.pdf'
    );

    assert.deepEqual(
      resultado.receipt,
      {
        status: 'ENTREGUE',
        submittedAt: '2026-08-07T17:38:34-03:00',
        authentication:
          '1B 76 E9 9E CA 39 C2 F8 A4 DC D1 0F 44 F2 FD 94'
      }
    );
  }
);

test(
  'DEC POA recibo: extrai dados da Di Lorenzo',
  async () => {
    const resultado = await parseFixture(
      'declaracao-di-lorenzo.pdf'
    );

    assert.deepEqual(
      resultado.receipt,
      {
        status: 'ENTREGUE',
        submittedAt: '2026-08-04T19:47:58-03:00',
        authentication:
          'B1 25 D4 97 75 E7 64 DB 2F 5E 3B 85 E5 3C DA 2A'
      }
    );
  }
);

test(
  'DEC POA recibo: extrai dados da Born Holding',
  async () => {
    const resultado = await parseFixture(
      'declaracao-born.pdf'
    );

    assert.deepEqual(
      resultado.receipt,
      {
        status: 'ENTREGUE',
        submittedAt: '2026-08-04T19:19:45-03:00',
        authentication:
          '1E 46 F6 66 F9 71 0C F0 59 A0 D9 24 9B 28 F7 0B'
      }
    );
  }
);