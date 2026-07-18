const startedAt = Date.now();

function createState() {
  return {
    processedDocuments: 0,
    successfulDocuments: 0,
    failedDocuments: 0,
    blockedByConfidence: 0,
    unknownDocuments: 0,
    rejectedUploads: 0,
    totalProcessingMs: 0,
    byDocumentType: {},
    byConfidenceLevel: {
      HIGH: 0,
      MEDIUM: 0,
      LOW: 0
    }
  };
}

let state = createState();

function round(value, decimals = 3) {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function incrementMap(map, key) {
  const normalizedKey = key || 'UNKNOWN';
  map[normalizedKey] = (map[normalizedKey] || 0) + 1;
}

function recordDocument(result, durationMs = 0) {
  state.processedDocuments += 1;
  state.totalProcessingMs += Number.isFinite(Number(durationMs))
    ? Number(durationMs)
    : 0;

  const documentType = result?.documentType || 'UNKNOWN';
  const confidenceLevel = result?.engine?.confidenceLevel || 'LOW';
  const blocked = result?.engine?.parserBlocked === true;
  const hasErrors = Array.isArray(result?.errors) && result.errors.length > 0;
  const successful = result?.success !== false && !hasErrors;

  incrementMap(state.byDocumentType, documentType);
  incrementMap(state.byConfidenceLevel, confidenceLevel);

  if (documentType === 'UNKNOWN') {
    state.unknownDocuments += 1;
  }

  if (blocked) {
    state.blockedByConfidence += 1;
  }

  if (successful) {
    state.successfulDocuments += 1;
  } else {
    state.failedDocuments += 1;
  }
}

function recordFailure(durationMs = 0) {
  state.processedDocuments += 1;
  state.failedDocuments += 1;
  state.totalProcessingMs += Number.isFinite(Number(durationMs))
    ? Number(durationMs)
    : 0;
}

function recordRejectedUpload() {
  state.rejectedUploads += 1;
}

function snapshot({ engineVersion, parserDefinitions = [] } = {}) {
  const processed = state.processedDocuments;
  const activeParsers = parserDefinitions.filter(
    definition => definition.status === 'active'
  ).length;

  return {
    engineVersion: engineVersion || null,
    startedAt: new Date(startedAt).toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    processedDocuments: processed,
    successfulDocuments: state.successfulDocuments,
    failedDocuments: state.failedDocuments,
    successRate: processed > 0
      ? round(state.successfulDocuments / processed)
      : 1,
    blockedByConfidence: state.blockedByConfidence,
    unknownDocuments: state.unknownDocuments,
    rejectedUploads: state.rejectedUploads,
    averageProcessingMs: processed > 0
      ? round(state.totalProcessingMs / processed, 2)
      : 0,
    parsers: {
      total: parserDefinitions.length,
      active: activeParsers,
      inactive: parserDefinitions.length - activeParsers
    },
    byDocumentType: { ...state.byDocumentType },
    byConfidenceLevel: { ...state.byConfidenceLevel }
  };
}

function resetForTests() {
  state = createState();
}

module.exports = {
  recordDocument,
  recordFailure,
  recordRejectedUpload,
  snapshot,
  resetForTests
};
