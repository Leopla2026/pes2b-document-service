const FAMILY = 'SIMPLES_NACIONAL';
const DETECTOR = 'simples.detector';
const MINIMUM_DETECTION_CONFIDENCE = 0.55;

function normalizar(texto) {
  return String(texto || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toUpperCase();
}

function arredondar(valor) {
  return Number(Math.max(0, Math.min(1, valor)).toFixed(4));
}

function criarSinal(token, weight, options = {}) {
  return Object.freeze({
    token,
    weight,
    required: options.required === true,
    group: options.group || null
  });
}

function avaliarRegra(normalized, regra) {
  const sinais = regra.signals || [];
  const excludentes = regra.excludes || [];

  const matchedRules = [];
  const missingRules = [];
  const matchedGroups = new Set();

  let pesoTotal = 0;
  let pesoEncontrado = 0;
  let obrigatoriaAusente = false;

  for (const sinal of sinais) {
    pesoTotal += sinal.weight;

    const encontrado = normalized.includes(sinal.token);

    if (encontrado) {
      pesoEncontrado += sinal.weight;
      matchedRules.push(sinal.token);

      if (sinal.group) {
        matchedGroups.add(sinal.group);
      }
    } else {
      missingRules.push(sinal.token);

      if (sinal.required) {
        obrigatoriaAusente = true;
      }
    }
  }

  const excludedRules = excludentes.filter(token =>
    normalized.includes(token)
  );

  if (
    obrigatoriaAusente ||
    excludedRules.length > 0 ||
    pesoTotal <= 0
  ) {
    return null;
  }

  if (Array.isArray(regra.requiredGroups)) {
    const grupoAusente = regra.requiredGroups.some(
      group => !matchedGroups.has(group)
    );

    if (grupoAusente) {
      return null;
    }
  }

  const confidence = arredondar(
    pesoEncontrado / pesoTotal
  );

  if (
    confidence <
    (regra.minimumDetectionConfidence ||
      MINIMUM_DETECTION_CONFIDENCE)
  ) {
    return null;
  }

  return {
    documentType: regra.documentType,
    family: FAMILY,
    confidence,
    matchedRules,
    missingRules,
    excludedRules,
    detector: DETECTOR
  };
}

const regras = Object.freeze([
  Object.freeze({
    documentType: 'RELATORIO_SIMPLES',
    signals: Object.freeze([
      criarSinal('SIMPLES NACIONAL', 0.15, { required: true }),
      criarSinal('TOTAL DE RECEITAS BRUTAS', 0.18),
      criarSinal('RECEITA BRUTA DO PERIODO DE APURACAO', 0.22),
      criarSinal('SIMPLES NACIONAL A RECOLHER', 0.25),
      criarSinal('SISTEMA LICENCIADO PARA', 0.2)
    ])
  }),
  Object.freeze({
    documentType: 'COMBINADO_DECLARACAO_RECIBO_PGDAS',
    signals: Object.freeze([
      criarSinal('PROGRAMA GERADOR DO DOCUMENTO DE ARRECADACAO', 0.25, { required: true }),
      criarSinal('DECLARATORIO', 0.15, { required: true }),
      criarSinal('N DA DECLARACAO', 0.2, { required: true }),
      criarSinal('RECIBO DE ENTREGA DA APURACAO NO PGDAS-D', 0.4, { required: true })
    ])
  }),
  Object.freeze({
    documentType: 'DECLARACAO_FATURAMENTO',
    signals: Object.freeze([
      criarSinal('DECLARAMOS PARA OS DEVIDOS FINS', 0.28, { required: true }),
      criarSinal('TEVE COMO FATURAMENTO NO PERIODO', 0.27, { required: true }),
      criarSinal('CADASTRO NACIONAL DA PESSOA JURIDICA', 0.18),
      criarSinal('CRC', 0.12),
      criarSinal('TOTAL', 0.15)
    ])
  }),
  Object.freeze({
    documentType: 'RECIBO_PGDAS',
    signals: Object.freeze([
      criarSinal('RECIBO DE ENTREGA DA APURACAO NO PGDAS-D', 1, { required: true })
    ])
  }),
  Object.freeze({
    documentType: 'EXTRATO_PGDAS',
    signals: Object.freeze([
      criarSinal('EXTRATO DO SIMPLES NACIONAL', 0.75, { required: true }),
      criarSinal('PERIODO DE APURACAO', 0.15),
      criarSinal('CNPJ', 0.1)
    ])
  }),
  Object.freeze({
    documentType: 'DECLARACAO_PGDAS',
    excludes: Object.freeze([
      'RECIBO DE ENTREGA DA APURACAO NO PGDAS-D'
    ]),
    signals: Object.freeze([
      criarSinal('PROGRAMA GERADOR DO DOCUMENTO DE ARRECADACAO', 0.4, { required: true }),
      criarSinal('DECLARATORIO', 0.2, { required: true }),
      criarSinal('N DA DECLARACAO', 0.25),
      criarSinal('RESUMO DA DECLARACAO', 0.15)
    ])
  }),
  Object.freeze({
    documentType: 'DAS',
    signals: Object.freeze([
      criarSinal('DOCUMENTO DE ARRECADACAO DO SIMPLES NACIONAL', 0.62, { required: true }),
      criarSinal('PAGUE COM O PIX', 0.1, { group: 'complemento' }),
      criarSinal('PAGAR ESTE DOCUMENTO ATE', 0.1, { group: 'complemento' }),
      criarSinal('CODIGO PRINCIPAL', 0.09, { group: 'complemento' }),
      criarSinal('AUTENTICACAO MECANICA', 0.09, { group: 'complemento' })
    ]),
    requiredGroups: Object.freeze(['complemento'])
  })
]);

function detect(texto) {
  const normalized = normalizar(texto);
  const resultados = regras
    .map(regra => avaliarRegra(normalized, regra))
    .filter(Boolean)
    .sort((a, b) => b.confidence - a.confidence);

  return resultados[0] || null;
}

module.exports = {
  family: FAMILY,
  detector: DETECTOR,
  minimumDetectionConfidence: MINIMUM_DETECTION_CONFIDENCE,
  detect
};
