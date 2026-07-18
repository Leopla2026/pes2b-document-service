const ENGINE_VERSION = '1.8.0';

exports.buildResponse = ({
  documentType,
  parser,
  pages,
  data,
  text,
  detection,
  parserDefinition,
  parserBlocked = false
}) => {
  const warnings = [];

  if (parserBlocked) {
    warnings.push(
      `Parser não executado: confiança ${detection?.confidence ?? 0} abaixo do mínimo ${parserDefinition?.minimumConfidence ?? 0}.`
    );
  }

  if (!parserBlocked && !data?.identificacao?.cnpj) {
    warnings.push('CNPJ não encontrado.');
  }

  if (!parserBlocked && !data?.identificacao?.competencia) {
    warnings.push('Competência não encontrada.');
  }

  const confidence = Number.isFinite(
    Number(detection?.confidence)
  )
    ? Number(detection.confidence)
    : 0;

  return {
    success: true,

    engine: {
      version: ENGINE_VERSION,
      parser,
      parserVersion: parserDefinition?.version || null,
      parserStatus: parserDefinition?.status || null,
      schemaVersion: parserDefinition?.schemaVersion || null,
      parserExecuted: Boolean(parserDefinition) && !parserBlocked,
      parserBlocked,
      minimumConfidence:
        parserDefinition?.minimumConfidence ?? null,
      confidence,
      confidenceLevel:
        detection?.confidenceLevel || 'LOW',
      family: detection?.family || 'UNKNOWN',
      detector: detection?.detector || 'none',
      matchedRules: detection?.matchedRules || [],
      missingRules: detection?.missingRules || [],
      excludedRules: detection?.excludedRules || []
    },

    documentType,
    pages,
    data,
    warnings,
    errors: [],
    text
  };
};
