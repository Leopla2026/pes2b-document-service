const {
  first,
  money,
  isoDate,
  normalizeCompetence,
  cnpj,
  taxFrom
} = require('../helpers');

const MONEY = /\d{1,3}(?:\.\d{3})*,\d{2}|\d+,\d{2}/g;

function extractHeader(text) {
  const documentCnpj = cnpj(text);
  const company = documentCnpj
    ? first(text, new RegExp(documentCnpj.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s*([\\s\\S]*?)\\s*Período de Apuração', 'i'))
    : null;
  const number = first(text, /Período de Apuração\s*Data de Vencimento\s*Número do Documento\s*([\d.\-]+)/i)
    || first(text, /Número:\s*([\d.\-]+)/i);
  const due = first(text, /Pagar este documento até\s*(\d{2}\/\d{2}\/\d{4})/i)
    || first(text, /Pagar até:\s*(\d{2}\/\d{2}\/\d{4})/i);
  const issue = first(text, /SENDA\s*\([^)]*\)\s*(\d{2}\/\d{2}\/\d{4})/i);
  const receipt = first(text, /N[ºo]\s*Recibo Declaração:\s*(\d+)/i);
  const total = money(first(text, /Valor Total do Documento\s*([\d.,]+)/i));
  const topPeriod = first(text, /CNPJ\s*Razão Social\s*((?:Janeiro|Fevereiro|Março|Marco|Abril|Maio|Junho|Julho|Agosto|Setembro|Outubro|Novembro|Dezembro)\/\d{4}|\d{2}\/\d{2}\/\d{4})/i);

  return {
    cnpj: documentCnpj,
    company,
    number,
    due,
    issue,
    receipt,
    total,
    competence: normalizeCompetence(topPeriod),
    originalPeriod: topPeriod
  };
}

function quarterlyInfo(description, period) {
  const explicit = `${description} ${period}`.match(/([1-4])[ºª]?\s*Trimestre\/(\d{4})/i);
  if (explicit) return { trimestre: Number(explicit[1]), anoTrimestre: Number(explicit[2]) };

  if (/TRIMESTRAL|BAL\s*TRIM/i.test(description)) {
    const monthly = String(period || '').match(/(0[1-9]|1[0-2])\/(\d{4})/);
    if (monthly) {
      return {
        trimestre: Math.floor((Number(monthly[1]) - 1) / 3) + 1,
        anoTrimestre: Number(monthly[2])
      };
    }
  }
  return { trimestre: null, anoTrimestre: null };
}

function regimeFor(code, description) {
  const value = `${code} ${description}`.toUpperCase();
  if (!/PIS|COFINS/.test(value)) return null;
  if (/NAO[- ]?CUMULAT|NÃO[- ]?CUMULAT|\b6912\b|\b5856\b/.test(value)) return 'NAO_CUMULATIVO';
  if (/FATURAMENTO|\b8109\b|\b2172\b/.test(value)) return 'CUMULATIVO';
  return 'NAO_IDENTIFICADO';
}

function amountsFrom(values) {
  const numbers = values.map(money).filter(value => value !== null);
  if (numbers.length >= 4) {
    return { principal: numbers[0], multa: numbers[1], juros: numbers[2], total: numbers[3] };
  }
  if (numbers.length === 3) {
    return { principal: numbers[0], multa: 0, juros: numbers[1], total: numbers[2] };
  }
  if (numbers.length === 2) {
    return { principal: numbers[0], multa: 0, juros: 0, total: numbers[1] };
  }
  return { principal: numbers[0] ?? null, multa: null, juros: null, total: numbers[0] ?? null };
}

function parseRows(text) {
  const composition = first(text, /Composição do Documento de Arrecadação\s*([\s\S]*?)\s*Totais/i);
  if (!composition) return [];

  const starts = [...composition.matchAll(/(?:^|\s)(\d{4})(?=[A-ZÀ-Ü])/g)];
  if (starts.length === 0 && /^\d{4}/.test(composition)) starts.push({ index: 0, 1: composition.slice(0, 4) });

  return starts.map((start, index) => {
    const rowStart = start.index + (composition[start.index] === ' ' ? 1 : 0);
    const rowEnd = starts[index + 1]?.index ?? composition.length;
    const row = composition.slice(rowStart, rowEnd).trim();
    const code = row.slice(0, 4);
    const paIndex = row.search(/\bPA\s*:?/i);
    const beforePeriod = paIndex >= 0 ? row.slice(4, paIndex) : row.slice(4);
    const periodText = paIndex >= 0
      ? first(row.slice(paIndex), /PA\s*:?\s*([^\s]+(?:\s*Trimestre\/\d{4}|\/\d{4}))/i)
      : null;
    const firstAmount = beforePeriod.search(MONEY);
    const label = (firstAmount >= 0 ? beforePeriod.slice(0, firstAmount) : beforePeriod).trim();
    const values = (firstAmount >= 0 ? beforePeriod.slice(firstAmount) : '').match(MONEY) || [];
    const variationAndDescription = values.length
      ? beforePeriod.slice(beforePeriod.lastIndexOf(values[values.length - 1]) + values[values.length - 1].length).trim()
      : '';
    const variationMatch = variationAndDescription.match(/^(\d{2})\s+([\s\S]*)$/);
    const detail = variationMatch?.[2]?.trim() || label;
    const quarter = quarterlyInfo(`${label} ${detail}`, periodText);
    const periodicity = quarter.trimestre ? 'TRIMESTRAL' : (periodText ? 'MENSAL' : null);
    const period = quarter.trimestre
      ? `${quarter.trimestre}º Trimestre/${quarter.anoTrimestre}`
      : normalizeCompetence(periodText);

    return {
      tributo: taxFrom(`${label} ${detail}`),
      codigoReceita: code,
      codigoVariacao: variationMatch?.[1] || null,
      denominacao: label || null,
      descricaoDetalhada: detail || null,
      regime: regimeFor(code, `${label} ${detail}`),
      periodicidade: periodicity,
      periodoApuracao: period,
      trimestre: quarter.trimestre,
      anoTrimestre: quarter.anoTrimestre,
      ...amountsFrom(values),
      textoOriginal: row
    };
  });
}

exports.parse = function parseDarf(text) {
  const header = extractHeader(text);
  const tributos = parseRows(text);
  const totals = tributos.reduce((acc, item) => ({
    principal: acc.principal + (item.principal || 0),
    multa: acc.multa + (item.multa || 0),
    juros: acc.juros + (item.juros || 0),
    total: acc.total + (item.total || 0)
  }), { principal: 0, multa: 0, juros: 0, total: 0 });
  const quarterly = tributos.some(item => item.periodicidade === 'TRIMESTRAL');
  const source = /Darf emitido pelo Sicalc Web/i.test(text) ? 'SICALC_WEB' : (/SENDA/i.test(text) ? 'SENDA' : null);
  const barcode = first(text, /AUTENTICAÇÃO MECÂNICA\s*Documento de Arrecadação de Receitas Federais\s*((?:\d{11}\s*){4})/i);

  return {
    identificacao: {
      empresa: header.company,
      cnpj: header.cnpj,
      competencia: header.competence
    },
    documento: {
      numeroDocumento: header.number,
      tipo: 'DARF',
      origem: source,
      numeroReciboDeclaracao: header.receipt
    },
    datas: {
      periodoApuracaoOriginal: header.originalPeriod,
      periodoApuracaoISO: /^\d{2}\/\d{2}\/\d{4}$/.test(header.originalPeriod || '') ? isoDate(header.originalPeriod) : null,
      vencimento: header.due,
      vencimentoISO: isoDate(header.due),
      dataEmissao: header.issue,
      dataEmissaoISO: isoDate(header.issue)
    },
    valores: tributos.length ? totals : { principal: null, multa: null, juros: null, total: header.total },
    tributos,
    pagamento: {
      codigoBarras: barcode ? barcode.replace(/\s/g, '') : null,
      possuiPix: /Pague com o PIX/i.test(text) ? true : null
    },
    parcelamento: {
      possivelQuotaTrimestral: quarterly,
      numeroQuota: null,
      totalQuotas: null,
      criterioIdentificacao: quarterly ? 'Tributo trimestral com vencimento posterior ao período de apuração; número da quota não inferido.' : null
    },
    resumo: {
      quantidadeTributos: tributos.length,
      darfUnificado: tributos.length > 1,
      tributosIdentificados: [...new Set(tributos.map(item => item.tributo))]
    },
    extras: {}
  };
};
