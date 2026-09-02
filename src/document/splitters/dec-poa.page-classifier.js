const pdf = require('pdf-parse');
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
  const pages = [];

  const options = {
    pagerender: async function(pageData) {
      const textContent =
        await pageData.getTextContent();

      const texto = textContent.items
        .map(item => item.str)
        .join(' ');

      pages.push({
        pageNumber: pages.length + 1,
        text: textNormalizer.normalize(texto),
        type: classificarTextoPagina(texto)
      });

      return texto;
    }
  };

  await pdf(buffer, options);

  return pages;
}

module.exports = {
  classificarTextoPagina,
  extrairPaginas
};