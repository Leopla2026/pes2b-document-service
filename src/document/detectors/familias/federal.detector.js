const FAMILY = 'FISCAL_FEDERAL';
const DETECTOR = 'federal.detector';

function normalize(text) {
  return String(text || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[–—]/g, '-')
    .replace(/\s+/g, ' ')
    .trim()
    .toUpperCase();
}

function result(documentType, matchedRules, missingRules, confidence) {
  return {
    documentType,
    family: FAMILY,
    confidence,
    matchedRules,
    missingRules,
    excludedRules: [],
    detector: DETECTOR
  };
}

function evaluate(normalized, definition) {
  const matchedRules = definition.signals.filter(token => normalized.includes(token));
  const missingRules = definition.signals.filter(token => !normalized.includes(token));
  const requiredPresent = definition.required.every(token => normalized.includes(token));

  if (!requiredPresent) return null;

  const confidence = Number((matchedRules.length / definition.signals.length).toFixed(4));
  if (confidence < definition.minimumConfidence) return null;

  return result(definition.documentType, matchedRules, missingRules, confidence);
}

const definitions = Object.freeze([
  Object.freeze({
    documentType: 'RECIBO_EFD_CONTRIBUICOES',
    minimumConfidence: 0.75,
    required: Object.freeze([
      'RECIBO DE ENTREGA DE ESCRITURACAO FISCAL DIGITAL - CONTRIBUICOES',
      'IDENTIFICACAO DA ESCRITURACAO'
    ]),
    signals: Object.freeze([
      'RECIBO DE ENTREGA DE ESCRITURACAO FISCAL DIGITAL - CONTRIBUICOES',
      'IDENTIFICACAO DA ESCRITURACAO',
      'EFD-CONTRIBUICOES',
      'SISTEMA PUBLICO DE ESCRITURACAO DIGITAL',
      'APURACAO DAS CONTRIBUICOES SOCIAS'
    ])
  }),
  Object.freeze({
    documentType: 'DCTFWEB',
    minimumConfidence: 0.75,
    required: Object.freeze([
      'RELATORIO DA DECLARACAO COMPLETA - DCTFWEB',
      'DEBITO APURADO E CREDITO VINCULADO'
    ]),
    signals: Object.freeze([
      'RELATORIO DA DECLARACAO COMPLETA - DCTFWEB',
      'DEBITO APURADO E CREDITO VINCULADO',
      'IDENTIFICACAO DA APURACAO DE DEBITOS',
      'DADOS DO MIT'
    ])
  }),
  Object.freeze({
    documentType: 'DARF',
    minimumConfidence: 0.75,
    required: Object.freeze([
      'DOCUMENTO DE ARRECADACAO DE RECEITAS FEDERAIS',
      'COMPOSICAO DO DOCUMENTO DE ARRECADACAO'
    ]),
    signals: Object.freeze([
      'DOCUMENTO DE ARRECADACAO DE RECEITAS FEDERAIS',
      'COMPOSICAO DO DOCUMENTO DE ARRECADACAO',
      'VALOR TOTAL DO DOCUMENTO'
    ])
  })
]);

function detect(text) {
  const normalized = normalize(text);
  return definitions
    .map(definition => evaluate(normalized, definition))
    .filter(Boolean)
    .sort((a, b) => b.confidence - a.confidence)[0] || null;
}

module.exports = {
  family: FAMILY,
  detector: DETECTOR,
  minimumDetectionConfidence: 0.75,
  detect
};
