const crypto = require('node:crypto');

function md5(buffer) {
  return crypto.createHash('md5').update(buffer).digest('hex').toUpperCase();
}

function isoDate(value) {
  const match = String(value || '').match(/^(\d{2})(\d{2})(\d{4})$/);
  if (!match) return null;
  return `${match[3]}-${match[2]}-${match[1]}`;
}

function decimal(value) {
  const raw = String(value ?? '').trim();
  if (!raw) return null;
  const normalized = raw.includes(',')
    ? raw.replace(/\./g, '').replace(',', '.')
    : raw;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function records(text, type) {
  return text.split(/\r?\n/)
    .filter(line => line.startsWith(`|${type}|`))
    .map(line => line.split('|').slice(1, -1));
}

const CST_REVENUE_FIELDS = {
  '01': 'receitaTributadaAliquotaBasica',
  '02': 'receitaTributadaAliquotaDiferenciada',
  '03': 'receitaTributadaUnidadeMedida',
  '04': 'receitaMonofasicaRevenda',
  '05': 'receitaSubstituicaoTributaria',
  '06': 'receitaAliquotaZero',
  '07': 'receitaIsenta',
  '08': 'receitaSemIncidencia',
  '09': 'receitaSuspensa'
};

const FINANCIAL_REVENUE = /(?:RECEITA|RENDIMENTO|JUROS|DESCONTO|VARIA(?:C|Ç)(?:A|Ã)O).*FINANCEIR|APLICA(?:C|Ç)(?:A|Ã)O|VARIA(?:C|Ç)(?:A|Ã)O CAMBIAL/i;

function accountNames(text) {
  return new Map(records(text, '0500')
    .filter(record => record[5])
    .map(record => [record[5], record[6] || '']));
}

function isFinancial(account, description, accounts) {
  const evidence = `${accounts.get(account) || ''} ${description || ''}`.trim();
  return Boolean(evidence && FINANCIAL_REVENUE.test(evidence));
}

function origin(record, layout, accounts) {
  const value = decimal(record[layout.value]);
  if (value === null) return null;
  const cstPis = layout.cstPis ? record[layout.cstPis] || null : null;
  const cstCofins = layout.cstCofins ? record[layout.cstCofins] || null : null;
  const cst = cstPis && cstCofins && cstPis !== cstCofins ? null : (cstPis || cstCofins);
  const account = layout.account ? record[layout.account] || null : null;
  const description = layout.description ? record[layout.description] || null : null;
  const financial = isFinancial(account, description, accounts);
  const category = financial ? null : CST_REVENUE_FIELDS[cst];

  return {
    registro: record[0],
    cst,
    cstPis,
    cstCofins,
    valor: value,
    classificacao: financial ? 'RECEITA_FINANCEIRA' : (category || 'OUTRAS_RECEITAS'),
    incluidoFaturamento: !financial,
    ...(account ? { codConta: account } : {}),
    ...(description ? { descricao: description } : {})
  };
}

function consolidatedFOrigins(text, regime, accounts) {
  const cash = ['F500', 'F510'];
  const accrual = ['F550', 'F560'];
  const criterion = regime?.criterioEscrituracaoConsolidada;
  const types = criterion === '1' ? cash : (criterion === '2' ? accrual : [...cash, ...accrual]);
  return types.flatMap(type => records(text, type)
    .map(record => origin(record, {
      value: 1, cstPis: 2, cstCofins: 7, account: 14, description: 15
    }, accounts))
    .filter(Boolean));
}

function mOrigins(text, accounts) {
  const taxableType = records(text, 'M610').length ? 'M610' : 'M210';
  const untaxedType = records(text, 'M800').length ? 'M800' : 'M400';
  const result = records(text, taxableType).map(record => {
    const value = decimal(record[2]);
    if (value === null) return null;
    const suffix = String(record[1] || '').slice(-1);
    const category = suffix === '1' ? 'receitaTributadaAliquotaBasica'
      : (suffix === '2' ? 'receitaTributadaAliquotaDiferenciada'
        : (suffix === '3' ? 'receitaTributadaUnidadeMedida' : null));
    return {
      registro: taxableType,
      cst: null,
      valor: value,
      codigoContribuicao: record[1] || null,
      classificacao: category || 'OUTRAS_RECEITAS',
      incluidoFaturamento: true
    };
  }).filter(Boolean);

  for (const record of records(text, untaxedType)) {
    const item = origin(record, {
      value: 2, cstPis: untaxedType === 'M400' ? 1 : null,
      cstCofins: untaxedType === 'M800' ? 1 : null, account: 3, description: 4
    }, accounts);
    if (item) result.push(item);
  }
  return result;
}

function record1900Origins(text, accounts) {
  return records(text, '1900').map(record => origin(record, {
    value: 6, cstPis: 8, cstCofins: 9, account: 12, description: 11
  }, accounts)).filter(Boolean);
}

function f100FinancialOrigins(text, accounts) {
  return records(text, 'F100')
    .filter(record => record[1] === '1' || record[1] === '2')
    .map(record => origin(record, {
      value: 5, cstPis: 6, cstCofins: 10, account: 16, description: 18
    }, accounts))
    .filter(item => item?.classificacao === 'RECEITA_FINANCEIRA');
}

function summarizeOrigins(origins) {
  if (!origins.length) return null;
  return origins.reduce((sum, item) => sum + (item.incluidoFaturamento ? item.valor : 0), 0);
}

function parseRevenue(text) {
  const record0110 = records(text, '0110')[0];
  const record0111 = records(text, '0111')[0];
  const record0900 = records(text, '0900')[0];
  const accounts = accountNames(text);
  const alerts = [];
  const used = [];

  const regime = record0110 ? {
    codigoIncidenciaTributaria: record0110[1] || null,
    metodoApropriacaoCreditos: record0110[2] || null,
    tipoContribuicaoApurada: record0110[3] || null,
    criterioEscrituracaoConsolidada: record0110[4] || null
  } : null;
  if (record0110) used.push('0110');

  const component0111 = record0111 ? {
    naoCumulativoTributadoMercadoInterno: decimal(record0111[1]),
    naoCumulativoNaoTributadoMercadoInterno: decimal(record0111[2]),
    naoCumulativoExportacao: decimal(record0111[3]),
    cumulativo: decimal(record0111[4]),
    total: decimal(record0111[5])
  } : null;
  const valid0111 = component0111?.total !== null && component0111?.total !== undefined;
  if (valid0111) used.push('0111');

  const total0900 = record0900 ? decimal(record0900[13]) : null;
  const nonGross0900 = record0900 ? decimal(record0900[14]) : null;
  const gross0900 = total0900 !== null
    ? Number((total0900 - (nonGross0900 || 0)).toFixed(2)) : null;

  const consolidated = consolidatedFOrigins(text, regime, accounts);
  const mSummary = mOrigins(text, accounts);
  const summary1900 = record1900Origins(text, accounts);
  let origins = consolidated.length ? consolidated : (mSummary.length ? mSummary : summary1900);
  const detailSource = origins[0]?.registro || null;

  if (origins.length) {
    [...new Set(origins.map(item => item.registro))].forEach(type => used.push(type));
  }
  if (record0900 && gross0900 !== null) used.push('0900');

  const directFinancial = f100FinancialOrigins(text, accounts);
  const financialAlreadyDetailed = origins.some(item => item.classificacao === 'RECEITA_FINANCEIRA');
  if (directFinancial.length && !financialAlreadyDetailed) {
    origins = [...origins, ...directFinancial.map(item => ({ ...item, incluidoFaturamento: false }))];
    if (!used.includes('F100')) used.push('F100');
    if (accounts.size && !used.includes('0500')) used.push('0500');
  }

  let calculatedDetail = summarizeOrigins(origins.filter(item => item.registro !== 'F100'));
  if (calculatedDetail !== null && directFinancial.length && !financialAlreadyDetailed) {
    calculatedDetail = Number((calculatedDetail
      - directFinancial.reduce((sum, item) => sum + item.valor, 0)).toFixed(2));
  }
  const declared0111 = valid0111 ? component0111.total : null;
  const total = valid0111 ? declared0111 : (gross0900 !== null ? gross0900 : calculatedDetail);

  if (!valid0111 && total !== null) {
    alerts.push(`Registro 0111 não encontrado ou inválido; faturamento obtido de ${gross0900 !== null ? '0900' : detailSource}.`);
  }
  if (records(text, 'F525').length || (summary1900.length && consolidated.length)) {
    alerts.push('Registros de detalhamento/consolidação paralelos foram preservados fora da soma para evitar dupla contagem.');
  }
  if (directFinancial.length) {
    alerts.push('Receita financeira identificada por F100 em conjunto com conta 0500/descrição e excluída do faturamento.');
  } else if (records(text, 'F100').length && !accounts.size) {
    alerts.push('Há registros F100, mas não há evidência contábil suficiente para classificar receita financeira com segurança.');
  }

  const categoryOrigins = origins.filter(item => item.registro !== 'F100');
  const categories = Object.fromEntries(Object.values(CST_REVENUE_FIELDS).map(field => {
    if (!categoryOrigins.length) return [field, null];
    let value = categoryOrigins
      .filter(item => item.classificacao === field)
      .reduce((sum, item) => sum + item.valor, 0);
    if (!financialAlreadyDetailed) {
      value -= directFinancial
        .filter(item => CST_REVENUE_FIELDS[item.cst] === field)
        .reduce((sum, item) => sum + item.valor, 0);
    }
    return [field, Number(Math.max(0, value).toFixed(2))];
  }));

  let cumulative = valid0111 ? component0111.cumulativo : null;
  let nonCumulative = valid0111
    ? [component0111.naoCumulativoTributadoMercadoInterno,
      component0111.naoCumulativoNaoTributadoMercadoInterno,
      component0111.naoCumulativoExportacao]
      .reduce((sum, value) => sum + (value || 0), 0)
    : null;
  if (!valid0111 && total !== null && regime?.codigoIncidenciaTributaria === '2') {
    cumulative = total;
    nonCumulative = 0;
  } else if (!valid0111 && total !== null && regime?.codigoIncidenciaTributaria === '1') {
    cumulative = 0;
    nonCumulative = total;
  }

  const difference = declared0111 !== null && calculatedDetail !== null
    ? Number((calculatedDetail - declared0111).toFixed(2)) : null;
  const financialOrigins = origins.filter(item => item.classificacao === 'RECEITA_FINANCEIRA');
  const otherRevenue = categoryOrigins.length
    ? categoryOrigins.filter(item => item.classificacao === 'OUTRAS_RECEITAS')
      .reduce((sum, item) => sum + item.valor, 0) : null;

  return {
    encontrado: total !== null,
    fontePrincipal: valid0111 ? '0111' : (gross0900 !== null ? '0900' : detailSource),
    total,
    cumulativo: cumulative,
    naoCumulativo: nonCumulative,
    naoCumulativoTributadoMercadoInterno: valid0111
      ? component0111.naoCumulativoTributadoMercadoInterno : null,
    naoCumulativoNaoTributadoMercadoInterno: valid0111
      ? component0111.naoCumulativoNaoTributadoMercadoInterno : null,
    naoCumulativoExportacao: valid0111 ? component0111.naoCumulativoExportacao : null,
    ...categories,
    receitaExportacao: valid0111 ? component0111.naoCumulativoExportacao : null,
    outrasReceitas: otherRevenue,
    receitaFinanceiraExcluidaFaturamento: financialOrigins.length
      ? financialOrigins.reduce((sum, item) => sum + item.valor, 0) : null,
    faturamentoDeclarado0111: declared0111,
    faturamentoCalculadoDetalhamento: calculatedDetail,
    diferenca: difference,
    confere: difference === null ? null : difference === 0,
    regime,
    registrosUtilizados: [...new Set(used)],
    alertas: alerts,
    origens: origins
  };
}

function parseTxt(buffer) {
  const text = new TextDecoder('windows-1252').decode(buffer);
  const record = text.split(/\r?\n/).find(line => line.startsWith('|0000|'));

  if (!record) throw new Error('Registro 0000 não encontrado no arquivo TXT.');

  const fields = record.split('|');
  const start = fields[6];
  const end = fields[7];
  const startMatch = String(start || '').match(/^(\d{2})(\d{2})(\d{4})$/);
  const endMatch = String(end || '').match(/^(\d{2})(\d{2})(\d{4})$/);

  if (!startMatch || !endMatch || !fields[8] || !/^\d{14}$/.test(fields[9] || '')) {
    throw new Error('Registro 0000 incompleto ou inválido.');
  }

  const competence = startMatch[2] === endMatch[2] && startMatch[3] === endMatch[3]
    ? `${startMatch[2]}/${startMatch[3]}`
    : null;

  return {
    success: true,
    tipoArquivo: 'EFD_CONTRIBUICOES_TXT',
    cnpj: fields[9],
    empresa: fields[8],
    dataInicial: isoDate(start),
    dataFinal: isoDate(end),
    competencia: competence,
    md5: md5(buffer),
    faturamento: parseRevenue(text)
  };
}

function parseRec(buffer) {
  const text = buffer.toString('ascii').trim();
  const match = text.match(
    /^RCP01(\d{14})(\d{14})([A-F0-9]+)\s+([A-F0-9]{32})\s+(.+)$/i
  );

  if (!match) throw new Error('Arquivo REC não corresponde ao layout RCP01 suportado.');

  const dateTime = match[2].match(
    /^(\d{2})(\d{2})(\d{4})(\d{2})(\d{2})(\d{2})$/
  );

  return {
    success: true,
    tipoArquivo: 'EFD_CONTRIBUICOES_REC',
    formato: 'RCP01',
    cnpj: match[1],
    dataHora: dateTime
      ? `${dateTime[3]}-${dateTime[2]}-${dateTime[1]}T${dateTime[4]}:${dateTime[5]}:${dateTime[6]}`
      : null,
    md5TxtReferenciado: match[4].toUpperCase(),
    identificadorTecnico1: match[3],
    identificadorTecnico2: match[5].trim()
  };
}

module.exports = { parseTxt, parseRec };
