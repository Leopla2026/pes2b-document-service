const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { PDFDocument } = require('pdf-lib');

const splitter = require(
  '../src/document/splitters/dec-poa.splitter'
);

const extractor = require(
  '../src/document/extractors/pdf.extractor'
);

function fixture(nomeArquivo) {
  return fs.readFileSync(
    path.join(
      __dirname,
      'fixtures',
      'municipal',
      'dec-poa',
      nomeArquivo
    )
  );
}

test(
  'DEC POA splitter: Di Lorenzo separa declaração, guia e recibo',
  async () => {
    const parts = await splitter.split(
      fixture('declaracao-di-lorenzo.pdf')
    );

    assert.equal(parts.length, 3);

    assert.equal(parts[0].role, 'DECLARACAO');
    assert.deepEqual(parts[0].pages, [1, 2]);

    assert.equal(parts[1].role, 'GUIA');
    assert.deepEqual(parts[1].pages, [3]);

    assert.equal(parts[2].role, 'RECIBO');
    assert.deepEqual(parts[2].pages, [4]);

    const { PDFDocument } = require('pdf-lib');

const declaracaoPdf = await PDFDocument.load(
  parts[0].buffer
);

const guiaPdf = await PDFDocument.load(
  parts[1].buffer
);

const reciboPdf = await PDFDocument.load(
  parts[2].buffer
);

assert.equal(
  declaracaoPdf.getPageCount(),
  2
);

assert.equal(
  guiaPdf.getPageCount(),
  1
);

assert.equal(
  reciboPdf.getPageCount(),
  1
);

const guia = await extractor.extract(
  parts[1].buffer
);

const recibo = await extractor.extract(
  parts[2].buffer
);

assert.match(
  guia.text,
  /GUIA PARA PAGAMENTO DE ISSQN/i
);

assert.match(
  recibo.text,
  /RECIBO DE ENTREGA - DECLARAÇÃO MENSAL/i
);
  }
);

test(
  'DEC POA splitter: Born separa declaração, guia e recibo',
  async () => {
    const parts = await splitter.split(
      fixture('declaracao-born.pdf')
    );

    assert.equal(parts.length, 3);

    assert.deepEqual(
      parts.map(part => ({
        role: part.role,
        pages: part.pages
      })),
      [
        {
          role: 'DECLARACAO',
          pages: [1]
        },
        {
          role: 'GUIA',
          pages: [2]
        },
        {
          role: 'RECIBO',
          pages: [3]
        }
      ]
    );
  }
);

test(
  'DEC POA splitter: documento sem guia retorna declaração e recibo',
  async () => {
    const parts = await splitter.split(
      fixture('declaracao-sem-iss.pdf')
    );

    assert.equal(parts.length, 2);

    assert.deepEqual(
      parts.map(part => ({
        role: part.role,
        pages: part.pages
      })),
      [
        {
          role: 'DECLARACAO',
          pages: [1]
        },
        {
          role: 'RECIBO',
          pages: [2]
        }
      ]
    );

    assert.equal(
      parts.some(part => part.role === 'GUIA'),
      false
    );
  }
);

test(
  'DEC POA splitter: gera nomes padronizados para as partes',
  async () => {
    const parts = await splitter.split(
      fixture('declaracao-di-lorenzo.pdf'),
      {
        razaoSocial:
          'INCORPORADORA DI LORENZO APPEL SPE LTDA.',
        cnpj:
          '49305799000113',
        competence: {
          year: 2026,
          month: 7,
          reference: '2026-07'
        }
      }
    );

    assert.deepEqual(
      parts.map(part => ({
        role: part.role,
        fileName: part.fileName
      })),
      [
        {
          role: 'DECLARACAO',
          fileName:
            'INCORPORADORA_DI_LORENZO_APPEL_SPE_LTDA__49305799000113__07-2026_declaracao.pdf'
        },
        {
          role: 'GUIA',
          fileName:
            'INCORPORADORA_DI_LORENZO_APPEL_SPE_LTDA__49305799000113__07-2026_guia.pdf'
        },
        {
          role: 'RECIBO',
          fileName:
            'INCORPORADORA_DI_LORENZO_APPEL_SPE_LTDA__49305799000113__07-2026_recibo.pdf'
        }
      ]
    );
  }
);