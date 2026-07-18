const detectorRegistry = require('./detector.registry');

function unknownResult() {
  return {
    documentType: 'UNKNOWN',
    family: 'UNKNOWN',
    confidence: 0,
    confidenceLevel: 'LOW',
    matchedRules: [],
    missingRules: [],
    excludedRules: [],
    detector: 'none'
  };
}

function detectDetailed(text) {
  const resultados = [];

  for (const detector of detectorRegistry.detectors) {
    const resultado = detector.detect(text);

    if (resultado) {
      resultados.push(resultado);
    }
  }

  if (resultados.length === 0) {
    return unknownResult();
  }

  resultados.sort((a, b) => b.confidence - a.confidence);

  const melhor = resultados[0];

  return {
    ...melhor,
    confidenceLevel:
      detectorRegistry.confidenceLevel(melhor.confidence)
  };
}

function detect(text) {
  return detectDetailed(text).documentType;
}

module.exports = {
  detect,
  detectDetailed
};
