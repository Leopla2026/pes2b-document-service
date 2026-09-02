const crypto = require('node:crypto');

const CONTRACT_VERSION = '1.0.0';

function createParseId() {
  return crypto.randomUUID();
}

function calculateSha256(buffer) {
  return crypto
    .createHash('sha256')
    .update(buffer)
    .digest('hex');
}

function buildContractMetadata({
  adapter,
  layoutVersion
} = {}) {
  return {
    version: CONTRACT_VERSION,
    adapter: adapter || null,
    layoutVersion: layoutVersion || null
  };
}

function buildDocumentMetadata({
  buffer,
  pages
} = {}) {
  return {
    sha256:
      Buffer.isBuffer(buffer)
        ? calculateSha256(buffer)
        : null,

    pages:
      Number.isInteger(pages)
        ? pages
        : null,

    size:
      Buffer.isBuffer(buffer)
        ? buffer.length
        : null
  };
}

function buildProcessingMetadata({
  startedAt,
  finishedAt,
  durationMs,
  engineVersion
} = {}) {
  return {
    startedAt:
      startedAt || null,

    finishedAt:
      finishedAt || null,

    durationMs:
      typeof durationMs === 'number'
        ? Number(durationMs.toFixed(2))
        : null,

    engine: 'pes2b-document-engine',

    engineVersion:
      engineVersion || null
  };
}

function resolveIsExpectedDocument({
  expected,
  validation
} = {}) {
  /*
   * Sem contexto esperado, não podemos afirmar
   * que o documento é ou não o esperado.
   */
  if (!expected) {
    return null;
  }

  if (
    validation &&
    typeof validation.valid === 'boolean'
  ) {
    return validation.valid;
  }

  return null;
}

module.exports = {
  CONTRACT_VERSION,
  createParseId,
  calculateSha256,
  buildContractMetadata,
  buildDocumentMetadata,
  buildProcessingMetadata,
  resolveIsExpectedDocument
};