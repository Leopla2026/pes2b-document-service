exports.buildResponse = ({
  documentType,
  parser,
  pages,
  data,
  text,
  detection,
  parserDefinition
}) => {
  const warnings = [];

  if (!data?.identificacao?.cnpj) {
    warnings.push('CNPJ não encontrado.');
  }

  if (!data?.identificacao?.competencia) {
    warnings.push('Competência não encontrada.');
  }

  const confidence = Number.isFinite(
    Number(detection?.confidence)
  )
    ? Number(detection.confidence)
    : warnings.length === 0
      ? 1
      : 0.9;

  return {
    success: true,

    engine: {
      version: '1.6.0',
      parser,
      parserVersion: parserDefinition?.version || null,
      parserStatus: parserDefinition?.status || null,
      schemaVersion: parserDefinition?.schemaVersion || null,
      confidence,
      family: detection?.family || 'UNKNOWN',
      detector: detection?.detector || 'none',
      matchedRules: detection?.matchedRules || []
    },

    documentType,
    pages,
    data,
    warnings,
    errors: [],
    text
  };
};
