const detectorRegistry = require('./detector.registry');

function detectDetailed(text) {
  for (const detector of detectorRegistry) {
    const resultado = detector.detect(text);

    if (resultado) {
      return resultado;
    }
  }

  return {
    documentType: 'UNKNOWN',
    family: 'UNKNOWN',
    confidence: 0,
    matchedRules: [],
    detector: 'none'
  };
}

/*
 * Mantém compatibilidade com chamadas antigas e testes que
 * esperam somente a string do tipo documental.
 */
function detect(text) {
  return detectDetailed(text).documentType;
}

module.exports = {
  detect,
  detectDetailed
};
