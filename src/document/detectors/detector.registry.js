const simplesDetector = require('./familias/simples.detector');
const municipalDetector = require('./familias/municipal.detector');
const federalDetector = require('./familias/federal.detector');

const detectors = Object.freeze([
  federalDetector,
  simplesDetector,
  municipalDetector
]);

function confidenceLevel(confidence) {
  const value = Number(confidence);

  if (!Number.isFinite(value) || value < 0.75) {
    return 'LOW';
  }

  if (value < 0.9) {
    return 'MEDIUM';
  }

  return 'HIGH';
}

module.exports = Object.freeze({
  detectors,
  confidenceLevel
});
