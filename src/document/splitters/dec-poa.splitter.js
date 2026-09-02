const { PDFDocument } = require('pdf-lib');

const {
  buildDecPoaFileName
} = require('./dec-poa.filename');

const {
  extrairPaginas
} = require('./dec-poa.page-classifier');

async function criarPdfComPaginas(
  sourcePdf,
  pageIndexes
) {
  const outputPdf = await PDFDocument.create();

  const copiedPages = await outputPdf.copyPages(
    sourcePdf,
    pageIndexes
  );

  for (const page of copiedPages) {
    outputPdf.addPage(page);
  }

  const bytes = await outputPdf.save();

  return Buffer.from(bytes);
}

async function split(
  buffer,
  context = {}
) {
  const paginas = await extrairPaginas(buffer);

  const declaracaoPages = paginas
    .filter(page => page.type === 'DECLARACAO')
    .map(page => page.pageNumber - 1);

  const guiaPages = paginas
    .filter(page => page.type === 'GUIA')
    .map(page => page.pageNumber - 1);

  const reciboPages = paginas
    .filter(page => page.type === 'RECIBO')
    .map(page => page.pageNumber - 1);

  const unknownPages = paginas.filter(
    page => page.type === 'UNKNOWN'
  );

  if (unknownPages.length > 0) {
    throw new Error(
      'DEC_POA_SPLIT_UNKNOWN_PAGE: ' +
      unknownPages
        .map(page => page.pageNumber)
        .join(', ')
    );
  }

  if (declaracaoPages.length === 0) {
    throw new Error(
      'DEC_POA_SPLIT_DECLARACAO_NOT_FOUND'
    );
  }

  if (reciboPages.length === 0) {
    throw new Error(
      'DEC_POA_SPLIT_RECIBO_NOT_FOUND'
    );
  }

  const sourcePdf = await PDFDocument.load(
    buffer
  );

  const parts = [];

  parts.push({
    role: 'DECLARACAO',
    suggestedSuffix: 'declaracao',
    pages: declaracaoPages.map(
      index => index + 1
    ),
    buffer: await criarPdfComPaginas(
      sourcePdf,
      declaracaoPages
    )
  });

  if (guiaPages.length > 0) {
    parts.push({
      role: 'GUIA',
      suggestedSuffix: 'guia',
      pages: guiaPages.map(
        index => index + 1
      ),
      buffer: await criarPdfComPaginas(
        sourcePdf,
        guiaPages
      )
    });
  }

  parts.push({
    role: 'RECIBO',
    suggestedSuffix: 'recibo',
    pages: reciboPages.map(
      index => index + 1
    ),
    buffer: await criarPdfComPaginas(
      sourcePdf,
      reciboPages
    )
  });

  /*
   * A nomenclatura deve ser aplicada somente depois
   * que todas as partes tiverem sido criadas.
   */
  for (const part of parts) {
    part.fileName = buildDecPoaFileName({
      razaoSocial:
        context.razaoSocial,

      cnpj:
        context.cnpj,

      competence:
        context.competence,

      suffix:
        part.suggestedSuffix
    });
  }

  return parts;
}

module.exports = {
  split
};