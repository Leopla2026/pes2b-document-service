const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { PDFDocument } = require('pdf-lib');

const engine = require(
  '../src/document/engine/document.engine'
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
  'DEC POA engine: retorna declaração, guia e recibo separados',
  async () => {
    const resultado = await engine.process(
      fixture('declaracao-di-lorenzo.pdf')
    );

    assert.equal(
      resultado.documentType,
      'DEC_POA_DECLARACAO_MENSAL'
    );

    assert.equal(
      resultado.compound,
      true
    );

    assert.ok(
      Array.isArray(resultado.documents)
    );

    assert.equal(
      resultado.documents.length,
      3
    );

    assert.deepEqual(
      resultado.documents.map(documento => ({
        role: documento.role,
        fileName: documento.fileName,
        pages: documento.pages
      })),
      [
        {
          role: 'DECLARACAO',
          fileName:
            'INCORPORADORA_DI_LORENZO_APPEL_SPE_LTDA__49305799000113__07-2026_declaracao.pdf',
          pages: [1, 2]
        },
        {
          role: 'GUIA',
          fileName:
            'INCORPORADORA_DI_LORENZO_APPEL_SPE_LTDA__49305799000113__07-2026_guia.pdf',
          pages: [3]
        },
        {
          role: 'RECIBO',
          fileName:
            'INCORPORADORA_DI_LORENZO_APPEL_SPE_LTDA__49305799000113__07-2026_recibo.pdf',
          pages: [4]
        }
      ]
    );

    for (const documento of resultado.documents) {
      assert.equal(
        documento.file.mimeType,
        'application/pdf'
      );

      assert.equal(
        documento.file.extension,
        'pdf'
      );

      assert.equal(
        documento.file.fileName,
        documento.fileName
      );

      assert.ok(
        documento.file.size > 0
      );

      assert.ok(
        documento.file.base64.length > 0
      );

      const buffer = Buffer.from(
        documento.file.base64,
        'base64'
      );

      assert.equal(
        buffer.slice(0, 5).toString(),
        '%PDF-'
      );

      const pdf = await PDFDocument.load(buffer);

      assert.equal(
        pdf.getPageCount(),
        documento.pages.length
      );
    }
  }
);

test(
  'DEC POA engine: documento sem guia retorna somente declaração e recibo',
  async () => {
    const resultado = await engine.process(
      fixture('declaracao-sem-iss.pdf')
    );

    assert.equal(
      resultado.documentType,
      'DEC_POA_DECLARACAO_MENSAL'
    );

    assert.equal(
      resultado.compound,
      true
    );

    assert.ok(
      Array.isArray(resultado.documents)
    );

    assert.equal(
      resultado.documents.length,
      2
    );

    assert.deepEqual(
      resultado.documents.map(
        documento => documento.role
      ),
      [
        'DECLARACAO',
        'RECIBO'
      ]
    );

    assert.equal(
      resultado.documents.some(
        documento =>
          documento.role === 'GUIA'
      ),
      false
    );

    for (const documento of resultado.documents) {
      assert.ok(documento.fileName);
      assert.ok(
        documento.file.base64.length > 0
      );

      const buffer = Buffer.from(
        documento.file.base64,
        'base64'
      );

      const pdf = await PDFDocument.load(buffer);

      assert.equal(
        pdf.getPageCount(),
        documento.pages.length
      );
    }
  }
);