const FAMILY = 'DECLARACAO_MUNICIPAL';
const DETECTOR = 'municipal.detector';
const MINIMUM_DETECTION_CONFIDENCE = 0.75;

function normalizar(texto) {
  return String(texto || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toUpperCase();
}

function arredondar(valor) {
  return Number(
    Math.max(0, Math.min(1, valor)).toFixed(4)
  );
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
    (
      regra.minimumDetectionConfidence ||
      MINIMUM_DETECTION_CONFIDENCE
    )
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
    documentType: 'DEC_POA_DECLARACAO_MENSAL',
    minimumDetectionConfidence: 0.8,
    signals: Object.freeze([
      criarSinal(
        'PREFEITURA DE PORTO ALEGRE',
        0.30,
        { required: true }
      ),
      criarSinal(
        'DECLARACAO MENSAL - ISSQN',
        0.25,
        { required: true }
      ),
      criarSinal(
        'RECIBO DE ENTREGA - DECLARACAO MENSAL',
        0.20
      ),
      criarSinal(
        'SECRETARIA MUNICIPAL DA FAZENDA',
        0.10
      ),
      criarSinal(
        'DECLARACAO RECEBIDA EM',
        0.10
      ),
      criarSinal(
        'IMPOSTO RESPONSABILIDADE PROPRIA',
        0.05
      )
    ])
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
  minimumDetectionConfidence:
    MINIMUM_DETECTION_CONFIDENCE,
  detect
};