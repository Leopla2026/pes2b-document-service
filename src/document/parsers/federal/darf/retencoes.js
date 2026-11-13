// Códigos presentes nas guias de retenção atendidas por esta integração.
const CODES = Object.freeze({ '1708': 'IRRF', '8045': 'IRRF', '5952': 'CRF', '1162': 'INSS' });

function classify(code, description) {
  const text = String(description || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();
  const byDescription = /\bIRRF\b/.test(text) ? 'IRRF'
    : /RETENCAO PREVIDENCIARIA|\bINSS\b|CP PATRONAL.*RETENCAO/.test(text) ? 'INSS'
      : /RET.*CONTRIBUICOES|\bCSRF\b|\bCRF\b/.test(text) ? 'CRF' : null;
  return {
    tributo: CODES[code] || byDescription,
    codigoMapeado: Boolean(CODES[code]),
    descricaoDivergente: Boolean(CODES[code] && byDescription && CODES[code] !== byDescription),
    indicioRetencao: Boolean(CODES[code] || byDescription || /RETEN|\bRET\b/.test(text))
  };
}

function summarize(rows, headerTotal, headerCompetence) {
  const retained = rows.filter(row => row.retencao === true);
  const sum = (items, key) => items.reduce((a, row) => a + Math.round((row[key] || 0) * 100), 0) / 100;
  const motivos = [];
  const rowTotal = sum(rows, 'total');
  if (retained.length) {
    if (headerTotal === null || Math.round(rowTotal * 100) !== Math.round(headerTotal * 100)) {
      motivos.push('TOTAL_COMPOSICAO_DIVERGE_DO_CABECALHO');
    }
    if (rows.some(row => row.tributo === 'OUTRO')) motivos.push('TRIBUTO_NAO_CLASSIFICADO');
    if (rows.some(row => row.retencao !== true)) motivos.push('GUIA_CONTEM_TRIBUTOS_FORA_DAS_RETENCOES');
    if (retained.some(row => row.principal === null || row.total === null)) motivos.push('VALOR_DA_RETENCAO_AUSENTE');
    if (retained.some(row => !row.codigoRetencaoMapeado)) motivos.push('CODIGO_RETENCAO_REQUER_VALIDACAO');
    if (retained.some(row => row.descricaoRetencaoDivergente)) motivos.push('CODIGO_E_DESCRICAO_DIVERGENTES');
    if (!headerCompetence || retained.some(row => !row.periodoApuracao || row.periodoApuracao !== headerCompetence)) {
      motivos.push('COMPETENCIA_RETENCAO_DIVERGENTE_OU_AUSENTE');
    }
  } else if (rows.some(row => row.indicioRetencao)) {
    motivos.push('RETENCAO_NAO_CLASSIFICADA');
  }
  const porTributo = {};
  for (const tipo of ['INSS', 'IRRF', 'CRF']) {
    const items = retained.filter(row => row.tributo === tipo);
    porTributo[tipo] = {
      encontrada: items.length > 0,
      principal: sum(items, 'principal'), multa: sum(items, 'multa'),
      juros: sum(items, 'juros'), total: sum(items, 'total')
    };
  }
  return {
    possuiRetencoes: retained.length > 0,
    guiaSomenteRetencoes: retained.length > 0 && retained.length === rows.length,
    tributos: [...new Set(retained.map(row => row.tributo))],
    porTributo,
    principal: sum(retained, 'principal'), multa: sum(retained, 'multa'),
    juros: sum(retained, 'juros'), total: sum(retained, 'total'),
    valorTotalGuia: headerTotal,
    requerAnalise: motivos.length > 0,
    motivos
  };
}

module.exports = { classify, summarize };
