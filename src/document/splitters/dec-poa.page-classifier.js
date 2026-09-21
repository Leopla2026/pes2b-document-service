const pdfExtractor = require('../extractors/pdf.extractor');
const textNormalizer = require('../utils/text.normalizer');

function normalizar(texto) {
  return textNormalizer
    .normalize(String(texto || ''))
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase();
}

function classificarTextoPagina(texto) {
  const normalized = normalizar(texto);

  if (
    normalized.includes(
      'RECIBO DE ENTREGA - DECLARACAO MENSAL'
    )
  ) {
    return 'RECIBO';
  }

  if (
    normalized.includes(
      'GUIA PARA PAGAMENTO DE ISSQN'
    )
  ) {
    return 'GUIA';
  }

  if (
    normalized.includes(
      'DECLARACAO MENSAL - ISSQN'
    ) ||
    normalized.includes(
      'IDENTIFICACAO DO DECLARANTE'
    )
  ) {
    return 'DECLARACAO';
  }

  return 'UNKNOWN';
}

async function extrairPaginas(buffer) {
  const pageTexts = await pdfExtractor.extractPages(buffer);

  return pageTexts.map((text, index) => ({
    pageNumber: index + 1,
    text,
    type: classificarTextoPagina(text)
  }));
}

module.exports = {
  classificarTextoPagina,
  extrairPaginas
};
